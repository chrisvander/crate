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
        let store =
            SessionPersistence::new(self.database.clone(), "oauth-session", 60 * 60 * 24 * 30);
        let stored = store
            .get(&did)
            .await
            .map_err(|_| ApiError::upstream("Session storage is temporarily unavailable."))?
            .ok_or_else(ApiError::unauthorized)?;
        let session = match self.oauth.restore(&did).await {
            Ok(session) => session,
            Err(_)
                if stored
                    .token_set
                    .refresh_token
                    .as_deref()
                    .is_none_or(|token| self.revocations.take(token)) =>
            {
                store.del(&did).await.map_err(|_| {
                    ApiError::upstream("Session storage is temporarily unavailable.")
                })?;
                return Err(ApiError::unauthorized());
            }
            Err(_) => {
                return Err(ApiError::upstream(
                    "Your PDS session could not be restored. Retry shortly; your browser login has been retained.",
                ));
            }
        };
        Ok((did.as_str().into(), session))
    }
}
