use crate_server::{app::app, config::Config, state::State};
use poem::{Endpoint, Response, http::StatusCode, test::TestClient};
use std::sync::Arc;

fn fixture() -> (
    tempfile::TempDir,
    TestClient<impl Endpoint<Output = Response>>,
    Arc<State>,
) {
    let directory = tempfile::tempdir().unwrap();
    let state = State::new(Config {
        bind: "127.0.0.1:3030".parse().unwrap(),
        server_url: "http://127.0.0.1:3030".parse().unwrap(),
        web_url: "http://127.0.0.1:5173".parse().unwrap(),
        data_dir: directory.path().into(),
        max_upload_bytes: 1024,
    })
    .unwrap();
    let client = TestClient::new(app(state.clone()));
    (directory, client, state)
}

#[tokio::test]
async fn missing_or_invalid_cookie_is_the_documented_json_error() {
    let (_dir, client, _) = fixture();
    for path in [
        "/api/v1/session",
        "/api/v1/files",
        "/api/v1/files/invalid/content",
    ] {
        for cookie in ["", "crate_session=invalid"] {
            let response = client.get(path).header("Cookie", cookie).send().await;
            response.assert_status(StatusCode::UNAUTHORIZED);
            response.assert_header("X-Content-Type-Options", "nosniff");
            response.assert_header("Cache-Control", "no-store");
            response.assert_json(serde_json::json!({"code":"LoginRequired","message":"Sign in to your PDS to continue."})).await;
        }
    }
}

#[tokio::test]
async fn malformed_json_invalid_query_and_handler_errors_are_json() {
    let (_dir, client, _) = fixture();
    for value in ["{", r#"{"handle":42}"#, r#"{"handle":""}"#] {
        let response = client
            .post("/oauth/login")
            .header("Origin", "http://127.0.0.1:5173")
            .header("Content-Type", "application/json")
            .body(value)
            .send()
            .await;
        response.assert_status(StatusCode::BAD_REQUEST);
        response
            .json()
            .await
            .value()
            .object()
            .get("code")
            .assert_string("InvalidRequest");
    }
    let response = client
        .get("/oauth/callback?code=x&state=x&iss=x&code=y")
        .send()
        .await;
    response.assert_status(StatusCode::BAD_REQUEST);
    response
        .json()
        .await
        .value()
        .object()
        .get("code")
        .assert_string("InvalidRequest");
    let response = client.get("/not-a-route").send().await;
    response.assert_status(StatusCode::NOT_FOUND);
    response
        .json()
        .await
        .value()
        .object()
        .get("code")
        .assert_string("NotFound");
}

#[tokio::test]
async fn mutations_require_exact_origin_even_without_cookies() {
    let (_dir, client, _) = fixture();
    for origin in [
        "null",
        "https://malicious.example",
        "http://127.0.0.1:5173.evil.test",
    ] {
        let response = client
            .post("/api/v1/logout")
            .header("Origin", origin)
            .send()
            .await;
        response.assert_status(StatusCode::FORBIDDEN);
        response
            .json()
            .await
            .value()
            .object()
            .get("code")
            .assert_string("Forbidden");
    }
    client
        .post("/api/v1/logout")
        .send()
        .await
        .assert_status(StatusCode::FORBIDDEN);
    client
        .post("/api/v1/logout")
        .header("Origin", "http://127.0.0.1:5173")
        .send()
        .await
        .assert_status(StatusCode::NO_CONTENT);
}

#[tokio::test]
async fn contract_and_docs_are_served_without_login_and_derive_cookie_security() {
    let (_dir, client, _) = fixture();
    client
        .get("/health")
        .send()
        .await
        .assert_json(serde_json::json!({"status":"ok"}))
        .await;
    client.get("/docs/").send().await.assert_status_is_ok();
    client
        .get("/openapi.json")
        .send()
        .await
        .assert_status_is_ok();
    let spec: serde_json::Value =
        serde_json::from_str(&crate_server::api::service().spec()).unwrap();
    assert_eq!(
        spec["components"]["securitySchemes"]["Authenticated"]["in"],
        "cookie"
    );
    assert_eq!(
        spec["components"]["securitySchemes"]["Authenticated"]["name"],
        "crate_session"
    );
    assert!(
        spec["paths"]["/api/v1/files"]["get"]["security"]
            .as_array()
            .is_some_and(|v| !v.is_empty())
    );
    assert!(
        spec["components"]["schemas"]["UpdateFile"]["properties"]
            .get("parentId")
            .is_none()
    );
}

#[tokio::test]
async fn request_slots_are_held_until_bodies_drain_but_health_stays_available() {
    let (_dir, client, _) = fixture();
    let mut pending = Vec::new();
    for _ in 0..4 {
        let response = client.get("/openapi.json").send().await;
        response.assert_status_is_ok();
        pending.push(response);
    }
    let busy = client.get("/openapi.json").send().await;
    busy.assert_status(StatusCode::SERVICE_UNAVAILABLE);
    busy.json()
        .await
        .value()
        .object()
        .get("code")
        .assert_string("ServerBusy");
    client.get("/health").send().await.assert_status_is_ok();
    drop(pending.pop());
    client
        .get("/openapi.json")
        .send()
        .await
        .assert_status_is_ok();
}

#[tokio::test]
async fn every_json_media_type_accepted_by_poem_gets_the_same_body_limit() {
    let (_dir, client, _) = fixture();
    for mime in [
        "application/json",
        "application/ld+json",
        "Application/JSON",
    ] {
        let response = client
            .post("/oauth/login")
            .header("Origin", "http://127.0.0.1:5173")
            .header("Content-Type", mime)
            .body("x".repeat(1024 * 1024 + 1))
            .send()
            .await;
        response.assert_status(StatusCode::PAYLOAD_TOO_LARGE);
        response
            .json()
            .await
            .value()
            .object()
            .get("code")
            .assert_string("TransferLimit");
    }
}
