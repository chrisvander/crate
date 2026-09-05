use poem_openapi::{Enum, Object};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Enum)]
#[serde(rename_all = "lowercase")]
#[oai(rename_all = "lowercase")]
pub enum FileKind {
    File,
    Directory,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Object)]
#[serde(rename_all = "camelCase")]
#[oai(rename_all = "camelCase")]
pub struct BlobInfo {
    /// Content identifier of the blob, never the file identity or record revision.
    pub cid: String,
    pub mime_type: String,
    #[oai(validator(minimum(value = "0")))]
    pub size: i64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Object)]
#[serde(rename_all = "camelCase")]
#[oai(rename_all = "camelCase", skip_serializing_if_is_none)]
pub struct FileEntry {
    /// Stable record key within the authenticated account's drive space.
    pub id: String,
    pub uri: String,
    /// Current record CID, used to reject stale writes.
    pub revision: String,
    /// Omitted for a root-level entry.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    pub name: String,
    pub kind: FileKind,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trashed_at: Option<String>,
    pub size: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blob: Option<BlobInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct FileList {
    pub files: Vec<FileEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
#[serde(rename_all = "camelCase")]
#[oai(rename_all = "camelCase")]
pub struct FileVersion {
    /// Immutable version record key, distinct from the file's stable ID.
    pub id: String,
    pub file_id: String,
    pub captured_at: String,
    pub file: FileEntry,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct VersionList {
    pub versions: Vec<FileVersion>,
}
