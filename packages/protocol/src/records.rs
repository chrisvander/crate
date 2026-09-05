pub use atrium_api::types::TypedBlobRef as BlobRef;
use jacquard_derive::LexiconSchema;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub const FILE_COLLECTION: &str = "network.crate.file";
pub const VERSION_COLLECTION: &str = "network.crate.fileVersion";
pub const NAME_COLLECTION: &str = "network.crate.fileName";
pub const SPACE_TYPE: &str = "network.crate.drive";
pub const MAX_FILE_BYTES: usize = 1_073_741_824;

/// Lowercase SHA-256 of the compact UTF-8 JSON array `[parentId-or-null, name]`.
pub fn name_claim_key(parent_id: Option<&str>, name: &str) -> String {
    let input = serde_json::to_vec(&(parent_id, name)).expect("strings always serialize");
    format!("{:x}", Sha256::digest(input))
}

/// A mutable file head, addressed by its stable record key in a private drive space.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, LexiconSchema)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "$type", rename = "network.crate.file")]
#[lexicon(nsid = "network.crate.file", record, key = "tid")]
pub struct FileRecord {
    #[lexicon(min_length = 1, max_length = 1024)]
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[lexicon(format = "tid")]
    pub parent_id: Option<String>,
    pub is_directory: bool,
    #[lexicon(format = "datetime")]
    pub created_at: String,
    #[lexicon(format = "datetime")]
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[lexicon(format = "datetime")]
    pub trashed_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blob: Option<BlobRef>,
}

impl FileRecord {
    pub fn validate(&self) -> Result<(), String> {
        jacquard_lexicon::schema::LexiconSchema::validate(self)
            .map_err(|error| error.to_string())?;
        validate_name(&self.name)?;
        if let Some(parent) = &self.parent_id {
            atrium_api::types::string::Tid::new(parent.clone())
                .map_err(|error| format!("Invalid parent TID: {error}"))?;
        }
        for value in [
            Some(&self.created_at),
            Some(&self.updated_at),
            self.trashed_at.as_ref(),
        ]
        .into_iter()
        .flatten()
        {
            chrono::DateTime::parse_from_rfc3339(value)
                .map_err(|error| format!("Invalid record timestamp: {error}"))?;
        }
        match (&self.blob, self.is_directory) {
            (Some(BlobRef::Blob(blob)), false)
                if blob.size <= MAX_FILE_BYTES && !blob.mime_type.is_empty() =>
            {
                Ok(())
            }
            (None, true) => Ok(()),
            _ => Err("Files require a valid blob; directories cannot contain a blob.".into()),
        }
    }
}

pub fn validate_name(name: &str) -> Result<(), String> {
    if name.trim().is_empty()
        || matches!(name, "." | "..")
        || name.contains(['/', '\\'])
        || name.chars().any(char::is_control)
        || name.len() > 1024
        || name.chars().count() > 255
    {
        return Err(
            "Name must be a nonempty filename without separators or control characters.".into(),
        );
    }
    Ok(())
}

/// Immutable snapshot created atomically before replacing a file head.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, LexiconSchema)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "$type", rename = "network.crate.fileVersion")]
#[lexicon(nsid = "network.crate.fileVersion", record, key = "any")]
pub struct VersionRecord {
    #[lexicon(format = "tid")]
    pub file_id: String,
    #[lexicon(format = "cid")]
    pub revision: String,
    #[lexicon(format = "datetime")]
    pub captured_at: String,
    #[lexicon(ref = "network.crate.file")]
    pub record: FileRecord,
}

impl VersionRecord {
    pub fn validate(&self) -> Result<(), String> {
        atrium_api::types::string::Tid::new(self.file_id.clone())
            .map_err(|error| format!("Invalid version file TID: {error}"))?;
        atrium_api::types::CidLink::try_from(self.revision.as_str())
            .map_err(|error| format!("Invalid version revision CID: {error}"))?;
        chrono::DateTime::parse_from_rfc3339(&self.captured_at)
            .map_err(|error| format!("Invalid version timestamp: {error}"))?;
        self.record.validate()
    }
}

/// Atomic uniqueness claim for a filename within a parent directory.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, LexiconSchema)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "$type", rename = "network.crate.fileName")]
#[lexicon(nsid = "network.crate.fileName", record, key = "any")]
pub struct NameClaim {
    #[lexicon(format = "tid")]
    pub file_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[lexicon(format = "tid")]
    pub parent_id: Option<String>,
    #[lexicon(min_length = 1, max_length = 1024)]
    pub name: String,
}
