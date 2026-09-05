use super::rpc;
use crate::{
    auth::Session,
    error::{ApiError, Result},
};
use crate_protocol::Space;
use serde::Deserialize;
use serde_json::{Value, json};

pub fn personal(did: &str) -> Space {
    Space {
        uri: format!("at://{did}/space/network.crate.drive/self"),
        authority_did: did.into(),
        space_type: "network.crate.drive".into(),
        key: "self".into(),
    }
}

#[derive(Deserialize)]
struct SpaceInfo {
    uri: String,
    policy: Value,
    #[serde(rename = "appAccess")]
    app_access: Value,
}

pub async fn exists(session: &Session, space: &Space) -> Result<bool> {
    let response = rpc::query::<SpaceInfo>(
        session,
        "com.atproto.simplespace.getSpace",
        json!({"space":space.uri}),
    )
    .await;
    match response {
        Ok(info) => {
            if info.uri != space.uri
                || info.policy["$type"] != "com.atproto.simplespace.defs#memberListPolicy"
            {
                return Err(ApiError::forbidden(
                    "Crate requires an explicit member-list space; public spaces are not accepted.",
                ));
            }
            if info.app_access["$type"] != "com.atproto.simplespace.defs#open" {
                return Err(ApiError::forbidden(
                    "This space restricts clients. Open app access is required for interoperable Crate clients.",
                ));
            }
            Ok(true)
        }
        Err(error) if error.code == "SpaceNotFound" => Ok(false),
        Err(error) => Err(error.into()),
    }
}

pub async fn ensure(session: &Session, space: &Space) -> Result<()> {
    if exists(session, space).await? {
        return Ok(());
    }
    let response = rpc::procedure::<Value>(session, "com.atproto.simplespace.createSpace", json!({"type":space.space_type,"skey":space.key,"policy":{"$type":"com.atproto.simplespace.defs#memberListPolicy"},"appAccess":{"$type":"com.atproto.simplespace.defs#open"}})).await;
    match response {
        Ok(_) => {}
        Err(error) if error.code == "SpaceAlreadyExists" => {}
        Err(error) => return Err(error.into()),
    }
    if !exists(session, space).await? {
        return Err(ApiError::unavailable(
            "The PDS did not create the private space.",
        ));
    }
    Ok(())
}
