use crate::{error::ApiError, state::State};
use poem::{IntoResponse, Request};
use poem_openapi::{SecurityScheme, auth::ApiKey};
use std::sync::Arc;

#[derive(SecurityScheme)]
#[oai(
    ty = "api_key",
    key_name = "crate_session",
    key_in = "cookie",
    checker = "check"
)]
pub struct Authenticated(pub (String, super::Session));

async fn check(request: &Request, _key: ApiKey) -> poem::Result<(String, super::Session)> {
    let state = request
        .data::<Arc<State>>()
        .ok_or_else(|| poem::Error::from_response(ApiError::unauthorized().into_response()))?;
    state
        .session(request)
        .await
        .map_err(|error| poem::Error::from_response(error.into_response()))
}
