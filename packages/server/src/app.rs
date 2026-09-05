use crate::{
    api,
    auth::browser,
    error::{ApiError, body},
    state::State,
};
use poem::{
    Endpoint, EndpointExt, IntoResponse, Request, Response, Route, get, handler,
    http::{Method, StatusCode},
    middleware::CookieJarManager,
};
use std::sync::Arc;

pub fn app(state: Arc<State>) -> impl Endpoint<Output = Response> {
    let slots = Arc::new(tokio::sync::Semaphore::new(4));
    let service = api::service();
    let route = Route::new()
        .at("/health", get(health))
        .at("/oauth/callback", get(api::auth::callback))
        .at(
            "/oauth-client-metadata.json",
            get(api::auth::metadata_document),
        )
        .at("/openapi.json", service.spec_endpoint())
        .nest("/docs", service.swagger_ui())
        .nest("/", service)
        .with(CookieJarManager::new())
        .data(state.clone());
    route.around(move |endpoint, mut request| {
        let state = state.clone();
        let permit = if request.uri().path() == "/health" {
            None
        } else {
            Some(slots.clone().try_acquire_owned())
        };
        async move {
            let docs = request.uri().path().starts_with("/docs");
            let result = async {
                if matches!(permit, Some(Err(_))) {
                    return Err(ApiError::Unavailable(body(
                        "ServerBusy",
                        "The server has reached its concurrent request limit. Retry shortly.",
                    )));
                }
                check_origin(&request, &state)?;
                let json = request
                    .content_type()
                    .is_some_and(|value| value.starts_with("application/json"));
                if json {
                    let bytes = tokio::time::timeout(
                        std::time::Duration::from_secs(10),
                        crate::files::content::read_upload(request.take_body(), 1024 * 1024),
                    )
                    .await
                    .map_err(|_| ApiError::bad("The JSON request body timed out."))??;
                    request.set_body(bytes);
                }
                Ok::<_, ApiError>(match endpoint.call(request).await {
                    Ok(response) => response,
                    Err(error) => error.into_response(),
                })
            }
            .await;
            let mut response = normalize(match result {
                Ok(response) => response,
                Err(error) => error.into_response(),
            });
            let headers = response.headers_mut();
            headers.insert("Cache-Control", "no-store".parse().unwrap());
            headers.insert("X-Content-Type-Options", "nosniff".parse().unwrap());
            headers.insert(
                "Cross-Origin-Resource-Policy",
                "same-origin".parse().unwrap(),
            );
            if !docs {
                headers.insert(
                    "Content-Security-Policy",
                    "default-src 'none'; sandbox".parse().unwrap(),
                );
            }
            if response.status() == StatusCode::UNAUTHORIZED {
                response.headers_mut().append(
                    "Set-Cookie",
                    browser::cookie(&state.config, browser::COOKIE, "", 0)
                        .parse()
                        .unwrap(),
                );
            }
            if let Some(Ok(permit)) = permit {
                let body = response.take_body();
                response.set_body(crate::limits::LimitedBody::wrap(body, permit));
            }
            Ok::<_, poem::Error>(response)
        }
    })
}

fn check_origin(request: &Request, state: &State) -> crate::error::Result<()> {
    if matches!(
        *request.method(),
        Method::GET | Method::HEAD | Method::OPTIONS
    ) {
        return Ok(());
    }
    let origin = request.header("Origin");
    if [
        state.config.web_url.origin().ascii_serialization(),
        state.config.server_url.origin().ascii_serialization(),
    ]
    .iter()
    .any(|allowed| Some(allowed.as_str()) == origin)
    {
        return Ok(());
    }
    Err(ApiError::forbidden(
        "Mutating browser requests require this application's Origin.",
    ))
}

fn normalize(response: Response) -> Response {
    if !response.status().is_client_error() && !response.status().is_server_error() {
        return response;
    }
    if response
        .content_type()
        .is_some_and(|value| value.starts_with("application/json"))
    {
        return response;
    }
    let status = response.status();
    match status {
        StatusCode::UNAUTHORIZED => ApiError::unauthorized(),
        StatusCode::FORBIDDEN => ApiError::forbidden("The request is not authorized."),
        StatusCode::NOT_FOUND => ApiError::not_found(),
        StatusCode::PAYLOAD_TOO_LARGE => ApiError::too_large(),
        value if value.is_client_error() => {
            ApiError::bad("The request does not match the API contract.")
        }
        _ => ApiError::Internal(body(
            "InternalError",
            "The server could not complete the operation.",
        )),
    }
    .into_response()
}

#[handler]
async fn health() -> poem::web::Json<serde_json::Value> {
    poem::web::Json(serde_json::json!({"status":"ok"}))
}
