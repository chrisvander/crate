use poem_openapi::Object;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
#[serde(rename_all = "camelCase")]
#[oai(rename_all = "camelCase")]
pub struct Space {
    pub uri: String,
    pub authority_did: String,
    #[serde(rename = "type")]
    #[oai(rename = "type")]
    pub space_type: String,
    pub key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct User {
    pub did: String,
    pub handle: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct Session {
    pub user: User,
    pub space: Space,
}
