use crate::FileKind;
use poem_openapi::Object;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
#[oai(
    rename_all = "camelCase",
    deny_unknown_fields,
    skip_serializing_if_is_none
)]
pub struct CreateFile {
    #[oai(validator(min_length = "1", max_length = "255"))]
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    pub kind: FileKind,
}

/// Renames a file without changing its parent or stable identity.
#[derive(Debug, Clone, Serialize, Deserialize, Object)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
#[oai(
    rename_all = "camelCase",
    deny_unknown_fields,
    skip_serializing_if_is_none
)]
pub struct UpdateFile {
    pub revision: String,
    #[oai(validator(min_length = "1", max_length = "255"))]
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
#[oai(
    rename_all = "camelCase",
    deny_unknown_fields,
    skip_serializing_if_is_none
)]
pub struct DuplicateFile {
    pub revision: String,
    #[oai(validator(min_length = "1", max_length = "255"))]
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
#[serde(deny_unknown_fields)]
#[oai(deny_unknown_fields)]
pub struct RevisionInput {
    pub revision: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
#[serde(deny_unknown_fields)]
#[oai(deny_unknown_fields)]
pub struct LoginInput {
    #[oai(validator(min_length = "1"))]
    pub handle: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
#[serde(rename_all = "camelCase")]
#[oai(rename_all = "camelCase")]
pub struct LoginOutput {
    pub redirect_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct ErrorBody {
    pub code: String,
    pub message: String,
}
