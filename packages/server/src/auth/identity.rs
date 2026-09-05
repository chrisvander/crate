use super::{Dns, transport::Transport};
use crate::{
    config::Config,
    error::{ApiError, Result},
};
use atrium_api::types::string::{Did, Handle};
use atrium_common::resolver::Resolver;
use atrium_identity::{
    did::{CommonDidResolver, CommonDidResolverConfig, DEFAULT_PLC_DIRECTORY_URL},
    handle::{AtprotoHandleResolver, AtprotoHandleResolverConfig},
};
use std::sync::Arc;

pub async fn handle(config: &Config, did: &Did) -> Result<String> {
    let http = Arc::new(Transport::new(config.max_upload_bytes)?);
    let resolver = CommonDidResolver::new(CommonDidResolverConfig {
        plc_directory_url: DEFAULT_PLC_DIRECTORY_URL.into(),
        http_client: http.clone(),
    });
    let document = resolver
        .resolve(did)
        .await
        .map_err(|_| ApiError::upstream("Identity resolution is temporarily unavailable."))?;
    let resolver = AtprotoHandleResolver::new(AtprotoHandleResolverConfig {
        dns_txt_resolver: Dns(
            hickory_resolver::TokioAsyncResolver::tokio_from_system_conf()
                .map_err(|_| ApiError::upstream("DNS is unavailable."))?,
        ),
        http_client: http,
    });
    for alias in document.also_known_as.unwrap_or_default() {
        let Some(value) = alias.strip_prefix("at://") else {
            continue;
        };
        let Ok(handle) = value.parse::<Handle>() else {
            continue;
        };
        if resolver
            .resolve(&handle)
            .await
            .is_ok_and(|resolved| &resolved == did)
        {
            return Ok(handle.as_str().into());
        }
    }
    Ok(did.as_str().into())
}
