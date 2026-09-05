use crate::storage::oauth::{SessionPersistence, StatePersistence};
use crate::{
    auth::{browser, identity, metadata, security::Authenticated},
    error::{ApiError, Result},
    pds::space,
    state::State,
};
use atrium_common::store::Store;
use atrium_oauth::{AuthorizeOptions, CallbackParams};
use crate_protocol::{LoginInput, LoginOutput, Session, User};
use poem::{
    IntoResponse, Request, Response, handler,
    http::StatusCode,
    web::{Data, Query},
};
use poem_openapi::{ApiResponse, OpenApi, payload::Json};
use std::sync::Arc;

pub struct AuthApi;

#[derive(ApiResponse)]
pub enum LoginResponse {
    #[oai(status = 200)]
    Success(Json<LoginOutput>, #[oai(header = "Set-Cookie")] String),
}

#[derive(ApiResponse)]
pub enum LogoutResponse {
    #[oai(status = 204)]
    Success(#[oai(header = "Set-Cookie")] String),
}

#[OpenApi]
impl AuthApi {
    #[oai(path = "/oauth/login", method = "post", operation_id = "login")]
    async fn login(
        &self,
        state: Data<&Arc<State>>,
        input: Json<LoginInput>,
    ) -> Result<LoginResponse> {
        let handle = input.handle.trim().trim_start_matches('@');
        if handle.parse::<atrium_api::types::string::Handle>().is_err()
            && handle.parse::<atrium_api::types::string::Did>().is_err()
        {
            return Err(ApiError::bad("An ATProto handle is required."));
        }
        let binding = browser::token();
        let oauth_state = state.0.clone();
        let handle = handle.to_owned();
        let app_state = binding.clone();
        let url = crate::auth::exchange::complete(async move {
            oauth_state
                .oauth
                .authorize(
                    &handle,
                    AuthorizeOptions {
                        scopes: metadata::scopes(),
                        state: Some(app_state),
                        ..Default::default()
                    },
                )
                .await
        })
        .await?;
        Ok(LoginResponse::Success(
            Json(LoginOutput { redirect_url: url }),
            browser::cookie(&state.config, browser::LOGIN_COOKIE, &binding, 600),
        ))
    }

    #[oai(path = "/api/v1/session", method = "get", operation_id = "session")]
    async fn session(
        &self,
        auth: Authenticated,
        state: Data<&Arc<State>>,
    ) -> Result<Json<Session>> {
        let (did, _) = auth.0;
        let space = space::personal(&did);
        let handle = identity::handle(
            &state.config,
            &did.parse().map_err(|_| ApiError::unauthorized())?,
        )
        .await?;
        Ok(Json(Session {
            user: User { did, handle },
            space,
        }))
    }

    #[oai(path = "/api/v1/logout", method = "post", operation_id = "logout")]
    async fn logout(&self, request: &Request, state: Data<&Arc<State>>) -> Result<LogoutResponse> {
        if let Some(cookie) = browser::read(request, browser::COOKIE) {
            if let Some(session) = browser::get(&state.database, Some(cookie))?
                && let Ok(did) = session.did.parse::<atrium_api::types::string::Did>()
            {
                let _ = state.oauth.revoke(&did).await;
                SessionPersistence::new(state.database.clone(), "oauth-session", 0)
                    .del(&did)
                    .await
                    .map_err(|_| {
                        ApiError::upstream("Session storage is temporarily unavailable.")
                    })?;
            }
            browser::delete(&state.database, cookie)?;
        }
        Ok(LogoutResponse::Success(browser::cookie(
            &state.config,
            browser::COOKIE,
            "",
            0,
        )))
    }
}

#[handler]
pub async fn callback(
    request: &Request,
    state: Data<&Arc<State>>,
    Query(params): Query<CallbackParams>,
) -> Response {
    let result = async {
        let binding = browser::read(request, browser::LOGIN_COOKIE).ok_or_else(|| {
            ApiError::forbidden("The OAuth callback is not bound to this browser.")
        })?;
        let key = params
            .state
            .as_ref()
            .ok_or_else(|| ApiError::bad("OAuth state is missing."))?;
        let pending = StatePersistence::new(state.database.clone(), "oauth-state", 600)
            .get(key)
            .await
            .map_err(|_| ApiError::upstream("OAuth state is unavailable."))?
            .ok_or_else(|| ApiError::bad("OAuth state expired. Restart login."))?;
        if pending.app_state.as_deref() != Some(binding) {
            return Err(ApiError::forbidden(
                "The OAuth callback does not match this browser.",
            ));
        }
        let oauth_state = state.0.clone();
        let (session, user_state) =
            crate::auth::exchange::complete(
                async move { oauth_state.oauth.callback(params).await },
            )
            .await?;
        if user_state.as_deref() != Some(binding) {
            return Err(ApiError::forbidden(
                "The OAuth callback does not match this browser.",
            ));
        }
        use atrium_api::agent::SessionManager;
        let did = session.did().await.ok_or_else(ApiError::unauthorized)?;
        let token = browser::create(&state.database, did.as_str().into())?;
        Ok::<_, ApiError>(
            Response::builder()
                .status(StatusCode::SEE_OTHER)
                .header(
                    "Location",
                    state.config.web_url.join("files").unwrap().as_str(),
                )
                .header("Set-Cookie", browser::session_cookie(&state.config, &token))
                .header(
                    "Set-Cookie",
                    browser::cookie(&state.config, browser::LOGIN_COOKIE, "", 0),
                )
                .body(""),
        )
    }
    .await;
    match result {
        Ok(response) => response,
        Err(error) => error.into_response(),
    }
}

#[handler]
pub async fn metadata_document(state: Data<&Arc<State>>) -> poem::web::Json<serde_json::Value> {
    poem::web::Json(
        serde_json::to_value(&state.oauth.client_metadata).expect("OAuth metadata serializes"),
    )
}
