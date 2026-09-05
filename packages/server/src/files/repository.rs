use crate::{
    auth::Session,
    error::{ApiError, Result},
    pds::rpc,
};
use async_trait::async_trait;
use crate_protocol::Space;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

#[derive(Clone, Debug)]
pub struct Record {
    pub id: String,
    pub revision: String,
    pub value: Value,
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "$type")]
pub enum Write {
    #[serde(rename = "com.atproto.space.applyWrites#create")]
    Create {
        collection: String,
        rkey: String,
        value: Value,
    },
    #[serde(rename = "com.atproto.space.applyWrites#update")]
    Update {
        collection: String,
        rkey: String,
        value: Value,
    },
    #[serde(rename = "com.atproto.space.applyWrites#delete")]
    Delete { collection: String, rkey: String },
}

#[async_trait]
pub trait Repository: Sync {
    async fn get(&self, collection: &str, id: &str) -> Result<Record>;
    async fn list(&self, collection: &str) -> Result<Vec<Record>>;
    async fn apply(&self, writes: Vec<Write>) -> Result<()>;
}

pub struct PdsRepository<'a> {
    pub session: &'a Session,
    pub space: &'a Space,
    pub did: &'a str,
}

#[derive(Deserialize)]
struct RecordResponse {
    cid: String,
    value: Value,
}
#[derive(Deserialize)]
struct ListedRecord {
    rkey: String,
    cid: String,
    value: Value,
}
#[derive(Deserialize)]
struct Listing {
    records: Vec<ListedRecord>,
    cursor: Option<String>,
}

#[async_trait]
impl Repository for PdsRepository<'_> {
    async fn get(&self, collection: &str, id: &str) -> Result<Record> {
        atrium_api::types::string::RecordKey::new(id.into()).map_err(ApiError::bad)?;
        let output: RecordResponse = rpc::query(
            self.session,
            "com.atproto.space.getRecord",
            json!({"space":self.space.uri,"repo":self.did,"collection":collection,"rkey":id}),
        )
        .await?;
        Ok(Record {
            id: id.into(),
            revision: output.cid,
            value: output.value,
        })
    }

    async fn list(&self, collection: &str) -> Result<Vec<Record>> {
        let mut records = Vec::new();
        let mut cursor = None::<String>;
        loop {
            let mut params =
                json!({"space":self.space.uri,"repo":self.did,"collection":collection,"limit":100});
            if let Some(cursor) = &cursor {
                params["cursor"] = json!(cursor);
            }
            let output =
                rpc::query::<Listing>(self.session, "com.atproto.space.listRecords", params).await;
            let page = match output {
                Ok(page) => page,
                Err(error) if error.code == "RepoNotFound" || error.code == "SpaceNotFound" => {
                    return Ok(records);
                }
                Err(error) => return Err(error.into()),
            };
            records.extend(page.records.into_iter().map(|record| Record {
                id: record.rkey,
                revision: record.cid,
                value: record.value,
            }));
            if page.cursor.is_none() {
                return Ok(records);
            }
            if page.cursor == cursor {
                return Err(ApiError::upstream("The PDS repeated a pagination cursor."));
            }
            cursor = page.cursor;
        }
    }

    async fn apply(&self, writes: Vec<Write>) -> Result<()> {
        if writes.len() > 200 {
            return Err(ApiError::too_large());
        }
        let body = json!({"space":self.space.uri,"repo":self.did,"writes":writes});
        if serde_json::to_vec(&body)
            .map_err(|_| ApiError::bad("Invalid write"))?
            .len()
            > 1_000_000
        {
            return Err(ApiError::too_large());
        }
        rpc::procedure::<Value>(self.session, "com.atproto.space.applyWrites", body).await?;
        Ok(())
    }
}
