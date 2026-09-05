use crate::FileKind;
use poem_openapi::Object;
use serde::{Deserialize, Serialize};

// Poem's default String parser coerces scalars; serde preserves the JSON contract.
fn parse_strict<T>(value: Option<serde_json::Value>) -> poem_openapi::types::ParseResult<T>
where
    T: serde::de::DeserializeOwned + poem_openapi::types::Type,
{
    serde_json::from_value(value.unwrap_or(serde_json::Value::Null))
        .map_err(poem_openapi::types::ParseError::custom)
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
#[oai(
    rename_all = "camelCase",
    deny_unknown_fields,
    skip_serializing_if_is_none
)]
pub struct CreateFile {
    #[oai(
        deserialize_with = "parse_strict",
        validator(min_length = "1", max_length = "255")
    )]
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[oai(deserialize_with = "parse_strict")]
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
    #[oai(deserialize_with = "parse_strict")]
    pub revision: String,
    #[oai(
        deserialize_with = "parse_strict",
        validator(min_length = "1", max_length = "255")
    )]
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
    #[oai(deserialize_with = "parse_strict")]
    pub revision: String,
    #[oai(
        deserialize_with = "parse_strict",
        validator(min_length = "1", max_length = "255")
    )]
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[oai(deserialize_with = "parse_strict")]
    pub parent_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
#[serde(deny_unknown_fields)]
#[oai(deny_unknown_fields)]
pub struct RevisionInput {
    #[oai(deserialize_with = "parse_strict")]
    pub revision: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
#[serde(deny_unknown_fields)]
#[oai(deny_unknown_fields)]
pub struct LoginInput {
    #[oai(deserialize_with = "parse_strict", validator(min_length = "1"))]
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
