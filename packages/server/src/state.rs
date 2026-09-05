use crate::{
    auth::{self, browser},
    config::Config,
    error::{ApiError, Result},
    storage::{Database, oauth::SessionPersistence},
};
use atrium_api::types::string::Did;
use atrium_common::store::Store;
use poem::Request;
use std::sync::Arc;

pub struct State {
    pub config: Config,
    pub database: Database,
    pub oauth: auth::Client,
    revocations: auth::revocation::Revocations,
}

impl State {
    pub fn new(config: Config) -> anyhow::Result<Arc<Self>> {
        config.validate()?;
        let database = Database::open(&config.data_dir)?;
        let http = auth::transport::Transport::new(config.max_upload_bytes)?;
        let revocations = http.revocations.clone();
        let oauth = auth::client(&config, &database, http)?;
        Ok(Arc::new(Self {
            config,
            database,
            oauth,
            revocations,
        }))
    }

    pub async fn session(&self, request: &Request) -> Result<(String, auth::Session)> {
        let browser = browser::get(&self.database, browser::read(request, browser::COOKIE))?
            .ok_or_else(ApiError::unauthorized)?;
        let did: Did = browser.did.parse().map_err(|_| ApiError::unauthorized())?;
        self.require_active(&did).await?;
        let result=async {
            let session=self.oauth.restore(&did).await.map_err(|_|ApiError::upstream("Your PDS session could not be restored. Retry shortly; your browser login has been retained."))?;
            // Every authenticated operation verifies private policy, including direct API callers.
            crate::pds::space::exists(&session,&crate::pds::space::personal(did.as_str())).await?;
            Ok::<_,ApiError>(session)
        }.await;
        // Atrium refreshes lazily during XRPC, not restore; inspect the token after that request.
        self.require_active(&did).await?;
        Ok((did.as_str().into(), result?))
    }

    async fn require_active(&self, did: &Did) -> Result<()> {
        let store =
            SessionPersistence::new(self.database.clone(), "oauth-session", 60 * 60 * 24 * 30);
        let stored = store
            .get(did)
            .await
            .map_err(|_| ApiError::upstream("Session storage is temporarily unavailable."))?
            .ok_or_else(ApiError::unauthorized)?;
        let expired_without_refresh = stored.token_set.refresh_token.is_none()
            && stored
                .token_set
                .expires_at
                .as_ref()
                .is_none_or(|expiry| expiry <= &atrium_api::types::string::Datetime::now());
        if expired_without_refresh
            || stored
                .token_set
                .refresh_token
                .as_deref()
                .is_some_and(|token| self.revocations.take(token))
        {
            store
                .del(did)
                .await
                .map_err(|_| ApiError::upstream("Session storage is temporarily unavailable."))?;
            return Err(ApiError::unauthorized());
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use atrium_oauth::store::session::Session;

    async fn fixture() -> (tempfile::TempDir, Arc<State>, Did) {
        let directory = tempfile::tempdir().unwrap();
        let state = State::new(Config {
            bind: "127.0.0.1:3030".parse().unwrap(),
            server_url: "http://127.0.0.1:3030".parse().unwrap(),
            web_url: "http://127.0.0.1:5173".parse().unwrap(),
            data_dir: directory.path().into(),
            max_upload_bytes: 1024,
        })
        .unwrap();
        let did = "did:plc:abcdefghijklmnopqrstuvwx".parse::<Did>().unwrap();
        let session = Session {
            dpop_key: auth::metadata::signing_key(&state.database).unwrap().key,
            token_set: serde_json::from_value(serde_json::json!({"iss":"https://pds.example.org","sub":did,"aud":"https://pds.example.org","scope":"atproto","refresh_token":"test-refresh","access_token":"test-access","token_type":"DPoP","expires_at":atrium_api::types::string::Datetime::now()})).unwrap(),
        };
        SessionPersistence::new(state.database.clone(), "oauth-session", 600)
            .set(did.clone(), session)
            .await
            .unwrap();
        (directory, state, did)
    }

    #[tokio::test]
    async fn terminal_refresh_observation_clears_persisted_session() {
        let (_dir, state, did) = fixture().await;
        state.revocations.observe(
            b"grant_type=refresh_token&refresh_token=test-refresh",
            http::StatusCode::BAD_REQUEST,
            br#"{"error":"invalid_grant"}"#,
        );
        assert!(matches!(
            state.require_active(&did).await,
            Err(ApiError::Unauthorized(_))
        ));
        assert!(
            SessionPersistence::new(state.database.clone(), "oauth-session", 600)
                .get(&did)
                .await
                .unwrap()
                .is_none()
        );
    }

    #[tokio::test]
    async fn temporary_refresh_failure_retains_persisted_session() {
        let (_dir, state, did) = fixture().await;
        state.revocations.observe(
            b"grant_type=refresh_token&refresh_token=test-refresh",
            http::StatusCode::SERVICE_UNAVAILABLE,
            br#"{"error":"temporarily_unavailable"}"#,
        );
        assert!(state.require_active(&did).await.is_ok());
        assert!(
            SessionPersistence::new(state.database.clone(), "oauth-session", 600)
                .get(&did)
                .await
                .unwrap()
                .is_some()
        );
    }
}
