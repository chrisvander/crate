use crate::{config::Config, storage::Database};
use atrium_oauth::{AtprotoClientMetadata, AuthMethod, GrantType, KnownScope, Scope};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use jose_jwk::Jwk;
use p256::elliptic_curve::{rand_core::OsRng, sec1::ToEncodedPoint};

pub fn scopes() -> Vec<Scope> {
    vec![Scope::Known(KnownScope::Atproto), Scope::Unknown("blob:*/*".into()),
        Scope::Unknown("space:network.crate.drive?skey=self&collection=network.crate.file&collection=network.crate.fileVersion&collection=network.crate.fileName&action=read_self&action=create&action=update&action=delete&manage=create".into())]
}

pub fn production(config: &Config) -> AtprotoClientMetadata {
    AtprotoClientMetadata {
        client_id: config
            .server_url
            .join("oauth-client-metadata.json")
            .unwrap()
            .into(),
        client_uri: Some(config.web_url.to_string()),
        redirect_uris: vec![config.server_url.join("oauth/callback").unwrap().into()],
        token_endpoint_auth_method: AuthMethod::PrivateKeyJwt,
        grant_types: vec![GrantType::AuthorizationCode, GrantType::RefreshToken],
        scopes: scopes(),
        jwks_uri: None,
        token_endpoint_auth_signing_alg: Some("ES256".into()),
    }
}

pub fn signing_key(database: &Database) -> anyhow::Result<Jwk> {
    if let Some(key) = database.get("keys", "client")? {
        return Ok(key);
    }
    let secret = p256::SecretKey::random(&mut OsRng);
    let public = secret.public_key().to_encoded_point(false);
    let key: Jwk = serde_json::from_value(serde_json::json!({
        "kty":"EC", "crv":"P-256", "kid":"crate-client-1", "use":"sig", "alg":"ES256",
        "d": URL_SAFE_NO_PAD.encode(secret.to_bytes()),
        "x": URL_SAFE_NO_PAD.encode(public.x().unwrap()),
        "y": URL_SAFE_NO_PAD.encode(public.y().unwrap())
    }))?;
    database.set("keys", "client", &key, 60 * 60 * 24 * 365 * 100)?;
    Ok(key)
}
