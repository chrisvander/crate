use super::repository::{Record, Write};
use crate::error::{ApiError, Result};
use atrium_api::types::string::Tid;
use chrono::{DateTime, Utc};
use cid::Cid;
pub use crate_protocol::name_claim_key as name_key;
use crate_protocol::{
    BlobInfo, BlobRef, FILE_COLLECTION, FileEntry, FileKind, FileRecord, NAME_COLLECTION, NameClaim,
};
use serde_json::Value;

#[derive(Clone, Debug)]
pub struct File {
    pub id: String,
    pub revision: String,
    pub record: FileRecord,
}

impl File {
    pub fn parse(record: Record) -> Result<Self> {
        record
            .id
            .parse::<Tid>()
            .map_err(|_| ApiError::upstream("The PDS returned an invalid file ID."))?;
        let value: FileRecord = serde_json::from_value(record.value)
            .map_err(|_| ApiError::upstream("A file record is malformed."))?;
        value
            .validate()
            .map_err(|_| ApiError::upstream("A file record failed schema validation."))?;
        record
            .revision
            .parse::<Cid>()
            .map_err(|_| ApiError::upstream("The PDS returned an invalid revision CID."))?;
        Ok(Self {
            id: record.id,
            revision: record.revision,
            record: value,
        })
    }

    pub fn entry(&self, space: &str, did: &str) -> FileEntry {
        let blob = self
            .record
            .blob
            .as_ref()
            .map(|BlobRef::Blob(blob)| BlobInfo {
                cid: blob.r#ref.0.to_string(),
                mime_type: blob.mime_type.clone(),
                size: blob.size as i64,
            });
        FileEntry {
            id: self.id.clone(),
            uri: format!("{space}/{did}/{FILE_COLLECTION}/{}", self.id),
            revision: self.revision.clone(),
            parent_id: self.record.parent_id.clone(),
            name: self.record.name.clone(),
            kind: if self.record.is_directory {
                FileKind::Directory
            } else {
                FileKind::File
            },
            created_at: self.record.created_at.clone(),
            updated_at: self.record.updated_at.clone(),
            trashed_at: self.record.trashed_at.clone(),
            size: blob.as_ref().map_or(0, |blob| blob.size),
            blob,
        }
    }

    pub fn check_revision(&self, revision: &str) -> Result<()> {
        revision
            .parse::<Cid>()
            .map_err(|_| ApiError::bad("Invalid revision CID."))?;
        if revision != self.revision {
            return Err(ApiError::conflict(
                "The file changed on another client. Refresh before saving.",
            ));
        }
        Ok(())
    }
}

pub fn value(input: &impl serde::Serialize) -> Result<Value> {
    serde_json::to_value(input).map_err(|_| ApiError::bad("The record could not be encoded."))
}

pub fn claim(id: &str, record: &FileRecord) -> Result<Write> {
    Ok(Write::Create {
        collection: NAME_COLLECTION.into(),
        rkey: name_key(record.parent_id.as_deref(), &record.name),
        value: value(&NameClaim {
            file_id: id.into(),
            parent_id: record.parent_id.clone(),
            name: record.name.clone(),
        })?,
    })
}

pub fn release(record: &FileRecord) -> Write {
    Write::Delete {
        collection: NAME_COLLECTION.into(),
        rkey: name_key(record.parent_id.as_deref(), &record.name),
    }
}

pub fn next_id() -> String {
    static LAST: std::sync::Mutex<i64> = std::sync::Mutex::new(0);
    let mut last = LAST.lock().expect("TID clock");
    *last = Utc::now().timestamp_micros().max(*last + 1);
    Tid::from_datetime(
        (rand::random::<u32>() % 1024).try_into().unwrap(),
        DateTime::from_timestamp_micros(*last).unwrap(),
    )
    .as_str()
    .into()
}

pub fn updated_after(previous: &str) -> String {
    let previous = DateTime::parse_from_rfc3339(previous)
        .expect("validated file date")
        .with_timezone(&Utc);
    Utc::now()
        .max(previous + chrono::Duration::nanoseconds(1))
        .to_rfc3339()
}
