pub mod oauth;

use rusqlite::{Connection, OptionalExtension, params};
use serde::{Serialize, de::DeserializeOwned};
use std::{
    path::Path,
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Clone)]
pub struct Database(Arc<Storage>);

struct Storage {
    connection: Mutex<Connection>,
    _lock: std::fs::File,
}

impl Database {
    pub fn open(directory: &Path) -> anyhow::Result<Self> {
        std::fs::create_dir_all(directory)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(directory, std::fs::Permissions::from_mode(0o700))?;
        }
        let lock = std::fs::OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(false)
            .open(directory.join("server.lock"))?;
        lock.try_lock()
            .map_err(|_| anyhow::anyhow!("Another Crate server is using this session directory"))?;
        let path = directory.join("sessions.sqlite");
        let db = Connection::open(&path)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600))?;
        }
        db.busy_timeout(std::time::Duration::from_secs(5))?;
        db.execute_batch("PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS secrets (namespace TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, expires INTEGER NOT NULL, PRIMARY KEY(namespace,key));")?;
        Ok(Self(Arc::new(Storage {
            connection: Mutex::new(db),
            _lock: lock,
        })))
    }

    pub fn get<T: DeserializeOwned>(
        &self,
        namespace: &str,
        key: &str,
    ) -> anyhow::Result<Option<T>> {
        let db = self
            .0
            .connection
            .lock()
            .map_err(|_| anyhow::anyhow!("session database lock failed"))?;
        let value: Option<String> = db
            .query_row(
                "SELECT value FROM secrets WHERE namespace=? AND key=? AND expires>?",
                params![namespace, key, now()],
                |row| row.get(0),
            )
            .optional()?;
        value
            .map(|v| serde_json::from_str(&v).map_err(Into::into))
            .transpose()
    }

    pub fn set<T: Serialize>(
        &self,
        namespace: &str,
        key: &str,
        value: &T,
        ttl: i64,
    ) -> anyhow::Result<()> {
        let db = self
            .0
            .connection
            .lock()
            .map_err(|_| anyhow::anyhow!("session database lock failed"))?;
        db.execute("DELETE FROM secrets WHERE expires<=?", [now()])?;
        db.execute("INSERT INTO secrets(namespace,key,value,expires) VALUES(?,?,?,?) ON CONFLICT(namespace,key) DO UPDATE SET value=excluded.value, expires=excluded.expires", params![namespace,key,serde_json::to_string(value)?,now()+ttl])?;
        Ok(())
    }

    pub fn delete(&self, namespace: &str, key: &str) -> anyhow::Result<()> {
        self.0
            .connection
            .lock()
            .map_err(|_| anyhow::anyhow!("session database lock failed"))?
            .execute(
                "DELETE FROM secrets WHERE namespace=? AND key=?",
                params![namespace, key],
            )?;
        Ok(())
    }

    pub fn clear(&self, namespace: &str) -> anyhow::Result<()> {
        self.0
            .connection
            .lock()
            .map_err(|_| anyhow::anyhow!("session database lock failed"))?
            .execute("DELETE FROM secrets WHERE namespace=?", [namespace])?;
        Ok(())
    }
}

pub fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn persists_isolates_and_expires_sessions() {
        let dir = tempfile::tempdir().unwrap();
        let db = Database::open(dir.path()).unwrap();
        db.set("browser", "id", &"alice", 60).unwrap();
        assert!(db.get::<String>("oauth", "id").unwrap().is_none());
        assert!(Database::open(dir.path()).is_err());
        drop(db);
        let db = Database::open(dir.path()).unwrap();
        assert_eq!(
            db.get::<String>("browser", "id").unwrap().as_deref(),
            Some("alice")
        );
        db.set("browser", "expired", &"alice", -1).unwrap();
        assert!(db.get::<String>("browser", "expired").unwrap().is_none());
    }
}
