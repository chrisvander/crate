use async_trait::async_trait;
use crate_protocol::{BlobRef, FileRecord};
use crate_server::{
    error::{ApiError, Result},
    files::repository::{Record, Repository, Write},
};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use tokio::sync::Mutex;

#[derive(Default)]
pub struct MemoryRepository(Mutex<BTreeMap<(String, String), Record>>);

pub fn cid(bytes: &[u8]) -> String {
    cid::Cid::new_v1(
        0x55,
        cid::multihash::Multihash::wrap(0x12, &Sha256::digest(bytes)).unwrap(),
    )
    .to_string()
}

pub fn file(name: &str, parent: Option<&str>, directory: bool) -> FileRecord {
    let now = chrono::Utc::now().to_rfc3339();
    let blob:BlobRef=serde_json::from_value(serde_json::json!({"$type":"blob","ref":{"$link":cid(b"hello")},"mimeType":"text/plain","size":5})).unwrap();
    FileRecord {
        name: name.into(),
        parent_id: parent.map(str::to_owned),
        is_directory: directory,
        created_at: now.clone(),
        updated_at: now,
        trashed_at: None,
        blob: if directory { None } else { Some(blob) },
    }
}

#[async_trait]
impl Repository for MemoryRepository {
    async fn get(&self, collection: &str, id: &str) -> Result<Record> {
        self.0
            .lock()
            .await
            .get(&(collection.into(), id.into()))
            .cloned()
            .ok_or_else(ApiError::not_found)
    }
    async fn list(&self, collection: &str) -> Result<Vec<Record>> {
        Ok(self
            .0
            .lock()
            .await
            .iter()
            .filter(|((key, _), _)| key == collection)
            .map(|(_, record)| record.clone())
            .collect())
    }
    async fn apply(&self, writes: Vec<Write>) -> Result<()> {
        tokio::task::yield_now().await;
        let mut records = self.0.lock().await;
        let mut transaction = records.clone();
        for write in writes {
            match write {
                Write::Create {
                    collection,
                    rkey,
                    value,
                } => {
                    let key = (collection, rkey.clone());
                    if transaction.contains_key(&key) {
                        return Err(ApiError::conflict("Record already exists."));
                    }
                    let revision = cid(&serde_json::to_vec(&value).unwrap());
                    transaction.insert(
                        key,
                        Record {
                            id: rkey,
                            revision,
                            value,
                        },
                    );
                }
                Write::Update {
                    collection,
                    rkey,
                    value,
                } => {
                    let key = (collection, rkey.clone());
                    if !transaction.contains_key(&key) {
                        return Err(ApiError::not_found());
                    }
                    let revision = cid(&serde_json::to_vec(&value).unwrap());
                    transaction.insert(
                        key,
                        Record {
                            id: rkey,
                            revision,
                            value,
                        },
                    );
                }
                Write::Delete { collection, rkey } => {
                    if transaction.remove(&(collection, rkey)).is_none() {
                        return Err(ApiError::not_found());
                    }
                }
            }
        }
        *records = transaction;
        Ok(())
    }
}
