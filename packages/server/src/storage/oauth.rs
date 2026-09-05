use super::Database;
use atrium_common::store::Store;
use atrium_oauth::store::{
    session::{Session, SessionStore},
    state::{InternalStateData, StateStore},
};
use serde::{Serialize, de::DeserializeOwned};
use std::{hash::Hash, marker::PhantomData};

#[derive(Clone)]
pub struct OAuthStore<V> {
    database: Database,
    namespace: &'static str,
    ttl: i64,
    value: PhantomData<V>,
}

impl<V> OAuthStore<V> {
    pub fn new(database: Database, namespace: &'static str, ttl: i64) -> Self {
        Self {
            database,
            namespace,
            ttl,
            value: PhantomData,
        }
    }
}

#[derive(Debug, thiserror::Error)]
#[error("OAuth persistence failed: {0}")]
pub struct StoreError(#[from] anyhow::Error);

impl<K, V> Store<K, V> for OAuthStore<V>
where
    K: Eq + Hash + AsRef<str> + Send + Sync,
    V: Clone + Serialize + DeserializeOwned + Send + Sync,
{
    type Error = StoreError;
    async fn get(&self, key: &K) -> Result<Option<V>, StoreError> {
        Ok(self.database.get(self.namespace, key.as_ref())?)
    }
    async fn set(&self, key: K, value: V) -> Result<(), StoreError> {
        Ok(self
            .database
            .set(self.namespace, key.as_ref(), &value, self.ttl)?)
    }
    async fn del(&self, key: &K) -> Result<(), StoreError> {
        Ok(self.database.delete(self.namespace, key.as_ref())?)
    }
    async fn clear(&self) -> Result<(), StoreError> {
        Ok(self.database.clear(self.namespace)?)
    }
}

impl StateStore for OAuthStore<InternalStateData> {}
impl SessionStore for OAuthStore<Session> {}

pub type SessionPersistence = OAuthStore<Session>;
pub type StatePersistence = OAuthStore<InternalStateData>;
