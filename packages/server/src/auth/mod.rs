pub mod browser;
pub mod callback;
pub mod exchange;
pub mod identity;
pub mod metadata;
pub mod revocation;
pub mod security;
pub mod transport;

use crate::{
    config::Config,
    storage::{
        Database,
        oauth::{OAuthStore, SessionPersistence, StatePersistence},
    },
};
use atrium_identity::{
    did::{CommonDidResolver, CommonDidResolverConfig, DEFAULT_PLC_DIRECTORY_URL},
    handle::{AtprotoHandleResolver, AtprotoHandleResolverConfig, DnsTxtResolver},
};
use atrium_oauth::{
    AtprotoLocalhostClientMetadata, OAuthClient, OAuthClientConfig, OAuthResolverConfig,
    OAuthSession,
};
use std::{error::Error, sync::Arc};
use transport::Transport;

pub type DidResolver = CommonDidResolver<Transport>;
pub type HandleResolver = AtprotoHandleResolver<Dns, Transport>;
pub type Client =
    OAuthClient<StatePersistence, SessionPersistence, DidResolver, HandleResolver, Transport>;
pub type Session = OAuthSession<Transport, DidResolver, HandleResolver, SessionPersistence>;

pub fn client(config: &Config, database: &Database, http: Transport) -> anyhow::Result<Client> {
    let resolver = OAuthResolverConfig {
        did_resolver: CommonDidResolver::new(CommonDidResolverConfig {
            plc_directory_url: DEFAULT_PLC_DIRECTORY_URL.into(),
            http_client: Arc::new(http.clone()),
        }),
        handle_resolver: AtprotoHandleResolver::new(AtprotoHandleResolverConfig {
            dns_txt_resolver: Dns(hickory_resolver::TokioAsyncResolver::tokio_from_system_conf()?),
            http_client: Arc::new(http.clone()),
        }),
        authorization_server_metadata: Default::default(),
        protected_resource_metadata: Default::default(),
    };
    let state_store = OAuthStore::new(database.clone(), "oauth-state", 600);
    let session_store = OAuthStore::new(database.clone(), "oauth-session", 60 * 60 * 24 * 30);
    if config.secure() {
        return Ok(Client::new(OAuthClientConfig {
            client_metadata: metadata::production(config),
            keys: Some(vec![metadata::signing_key(database)?]),
            state_store,
            session_store,
            resolver,
            http_client: http,
        })?);
    }
    Ok(Client::new(OAuthClientConfig {
        client_metadata: AtprotoLocalhostClientMetadata {
            redirect_uris: Some(vec![config.server_url.join("oauth/callback")?.into()]),
            scopes: Some(metadata::scopes()),
        },
        keys: None,
        state_store,
        session_store,
        resolver,
        http_client: http,
    })?)
}

pub struct Dns(hickory_resolver::TokioAsyncResolver);
impl DnsTxtResolver for Dns {
    async fn resolve(&self, query: &str) -> Result<Vec<String>, Box<dyn Error + Send + Sync>> {
        Ok(self
            .0
            .txt_lookup(query)
            .await?
            .iter()
            .map(|txt| txt.to_string())
            .collect())
    }
}
