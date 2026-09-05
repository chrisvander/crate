use crate::{config::Config, storage::Database};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub const COOKIE: &str = "crate_session";
pub const LOGIN_COOKIE: &str = "crate_login";
const LIFETIME: i64 = 60 * 60 * 24 * 30;

#[derive(Clone, Serialize, Deserialize)]
pub struct BrowserSession {
    pub did: String,
}

pub fn create(database: &Database, did: String) -> anyhow::Result<String> {
    let token = token();
    database.set("browser", &hash(&token), &BrowserSession { did }, LIFETIME)?;
    Ok(token)
}

pub fn get(database: &Database, cookie: Option<&str>) -> anyhow::Result<Option<BrowserSession>> {
    match cookie {
        Some(token) => database.get("browser", &hash(token)),
        None => Ok(None),
    }
}

pub fn delete(database: &Database, cookie: &str) -> anyhow::Result<()> {
    database.delete("browser", &hash(cookie))
}

pub fn cookie(config: &Config, name: &str, token: &str, max_age: i64) -> String {
    format!(
        "{name}={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age}{}",
        if config.secure() { "; Secure" } else { "" }
    )
}

pub fn session_cookie(config: &Config, value: &str) -> String {
    cookie(config, COOKIE, value, LIFETIME)
}

pub fn read<'a>(request: &'a poem::Request, name: &str) -> Option<&'a str> {
    request
        .header("cookie")?
        .split(';')
        .filter_map(|part| part.trim().split_once('='))
        .find(|(key, _)| *key == name)
        .map(|(_, value)| value)
}

pub fn token() -> String {
    let mut bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

fn hash(token: &str) -> String {
    URL_SAFE_NO_PAD.encode(Sha256::digest(token.as_bytes()))
}
