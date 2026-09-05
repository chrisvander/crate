use atrium_common::store::Store;
use atrium_oauth::store::state::InternalStateData;
use crate_server::{
    app::app,
    auth::{browser, metadata},
    config::Config,
    state::State,
    storage::oauth::StatePersistence,
};
use poem::{Endpoint, Response, http::StatusCode, test::TestClient};

const KEY: &str = "synthetic-state";
const BINDING: &str = "synthetic-browser-binding";
const ISSUER: &str = "https://issuer.example.org";

async fn fixture() -> (
    tempfile::TempDir,
    TestClient<impl Endpoint<Output = Response>>,
    StatePersistence,
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
    let store = StatePersistence::new(state.database.clone(), "oauth-state", 600);
    store
        .set(
            KEY.to_owned(),
            InternalStateData {
                iss: ISSUER.into(),
                dpop_key: metadata::signing_key(&state.database).unwrap().key,
                verifier: "synthetic-verifier".into(),
                app_state: Some(BINDING.into()),
            },
        )
        .await
        .unwrap();
    (directory, TestClient::new(app(state)), store)
}

#[tokio::test]
async fn bound_declaration_rejection_is_actionable_consumed_and_not_exchanged() {
    let (_dir, client, store) = fixture().await;
    let response = client
        .get("/oauth/callback")
        .query("state", &KEY)
        .query("iss", &ISSUER)
        .query("error", &"invalid_scope")
        .query(
            "error_description",
            &"Unable to retrieve space declarations",
        )
        .header("Cookie", format!("{}={BINDING}", browser::LOGIN_COOKIE))
        .send()
        .await;
    response.assert_status(StatusCode::BAD_REQUEST);
    response.assert_header(
        "Set-Cookie",
        "crate_login=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    );
    response.assert_json(serde_json::json!({"code":"SpaceDeclarationsUnavailable","message":"Your PDS could not retrieve Crate's space declarations. The network.crate.drive declaration must be published and reachable before sign-in can finish. Restart login after the declaration is available."})).await;
    assert!(store.get(&KEY.to_owned()).await.unwrap().is_none());
    let replay = client
        .get("/oauth/callback")
        .query("state", &KEY)
        .query("error", &"invalid_scope")
        .header("Cookie", format!("{}={BINDING}", browser::LOGIN_COOKIE))
        .send()
        .await;
    replay.assert_status(StatusCode::BAD_REQUEST);
    replay
        .json()
        .await
        .value()
        .object()
        .get("message")
        .assert_string("OAuth state expired. Restart login.");
}

#[tokio::test]
async fn other_scope_rejections_do_not_claim_declaration_failure_or_echo_provider_text() {
    let (_dir, client, store) = fixture().await;
    let response = client
        .get("/oauth/callback")
        .query("state", &KEY)
        .query("iss", &ISSUER)
        .query("error", &"invalid_scope")
        .query(
            "error_description",
            &"<script>synthetic-untrusted-description</script>",
        )
        .header("Cookie", format!("{}={BINDING}", browser::LOGIN_COOKIE))
        .send()
        .await;
    response.assert_status(StatusCode::BAD_REQUEST);
    response.assert_json(serde_json::json!({"code":"OAuthScopeRejected","message":"Your PDS rejected the requested Crate permissions. Verify that the PDS supports these permissions, then restart login."})).await;
    assert!(store.get(&KEY.to_owned()).await.unwrap().is_none());
}

#[tokio::test]
async fn unbound_rejections_cannot_consume_another_login() {
    let (_dir, client, store) = fixture().await;
    for cookie in ["", "crate_login=wrong-binding"] {
        client
            .get("/oauth/callback")
            .query("state", &KEY)
            .query("error", &"access_denied")
            .header("Cookie", cookie)
            .send()
            .await
            .assert_status(StatusCode::FORBIDDEN);
        assert!(store.get(&KEY.to_owned()).await.unwrap().is_some());
    }
    client
        .get("/oauth/callback")
        .query("state", &KEY)
        .query("iss", &"https://wrong.example.org")
        .query("error", &"access_denied")
        .header("Cookie", format!("{}={BINDING}", browser::LOGIN_COOKIE))
        .send()
        .await
        .assert_status(StatusCode::FORBIDDEN);
    assert!(store.get(&KEY.to_owned()).await.unwrap().is_some());
}

#[tokio::test]
async fn malformed_outcomes_are_rejected_before_consuming_state() {
    let (_dir, client, store) = fixture().await;
    for query in [
        "state=synthetic-state",
        "state=synthetic-state&code=",
        "state=synthetic-state&error=",
        "state=synthetic-state&code=test&error=access_denied",
        "state=synthetic-state&code=test&code=other",
        "code=test",
        "error=access_denied",
    ] {
        client
            .get(format!("/oauth/callback?{query}"))
            .header("Cookie", format!("{}={BINDING}", browser::LOGIN_COOKIE))
            .send()
            .await
            .assert_status(StatusCode::BAD_REQUEST);
        assert!(store.get(&KEY.to_owned()).await.unwrap().is_some());
    }
}

#[tokio::test]
async fn valid_success_query_still_reaches_browser_binding_check() {
    let (_dir, client, store) = fixture().await;
    let response = client
        .get("/oauth/callback")
        .query("state", &KEY)
        .query("iss", &ISSUER)
        .query("code", &"synthetic-code")
        .send()
        .await;
    response.assert_status(StatusCode::FORBIDDEN);
    response
        .json()
        .await
        .value()
        .object()
        .get("message")
        .assert_string("The OAuth callback is not bound to this browser.");
    assert!(store.get(&KEY.to_owned()).await.unwrap().is_some());
}

#[tokio::test]
async fn other_bound_provider_errors_are_consumed_without_reflecting_untrusted_fields() {
    for (error, code, status) in [
        ("access_denied", "OAuthDenied", StatusCode::BAD_REQUEST),
        (
            "temporarily_unavailable",
            "PdsUnavailable",
            StatusCode::BAD_GATEWAY,
        ),
        (
            "<script>unknown-error</script>",
            "OAuthRejected",
            StatusCode::BAD_REQUEST,
        ),
    ] {
        let (_dir, client, store) = fixture().await;
        let response = client
            .get("/oauth/callback")
            .query("state", &KEY)
            .query("iss", &ISSUER)
            .query("error", &error)
            .query(
                "error_description",
                &"<script>untrusted-description</script>",
            )
            .header("Cookie", format!("{}={BINDING}", browser::LOGIN_COOKIE))
            .send()
            .await;
        response.assert_status(status);
        let json = response.json().await;
        json.value().object().get("code").assert_string(code);
        let message = json.value().object().get("message").string();
        assert!(!message.contains("<script>"));
        assert!(store.get(&KEY.to_owned()).await.unwrap().is_none());
    }
}
