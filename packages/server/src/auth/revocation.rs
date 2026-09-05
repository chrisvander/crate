use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

// Atrium hides the typed token endpoint error. Observe only the OAuth wire error,
// never infer revocation from network failures or unstructured error messages.
#[derive(Clone, Default)]
pub struct Revocations(Arc<Mutex<HashMap<[u8; 32], Instant>>>);

impl Revocations {
    pub fn observe(&self, request: &[u8], status: http::StatusCode, response: &[u8]) {
        if status != http::StatusCode::BAD_REQUEST && status != http::StatusCode::UNAUTHORIZED {
            return;
        }
        let Ok(error) = serde_json::from_slice::<serde_json::Value>(response) else {
            return;
        };
        if error["error"] != "invalid_grant" {
            return;
        }
        let parameters: std::collections::HashMap<_, _> =
            url::form_urlencoded::parse(request).collect();
        if parameters.get("grant_type").map(|v| v.as_ref()) != Some("refresh_token") {
            return;
        }
        if let Some(token) = parameters.get("refresh_token") {
            let mut revoked = self.0.lock().expect("revocations");
            revoked.retain(|_, created| created.elapsed() < Duration::from_secs(600));
            if revoked.len() >= 1024 {
                if let Some(oldest) = revoked
                    .iter()
                    .min_by_key(|(_, at)| *at)
                    .map(|(key, _)| *key)
                {
                    revoked.remove(&oldest);
                }
            }
            revoked.insert(Sha256::digest(token.as_bytes()).into(), Instant::now());
        }
    }

    pub fn take(&self, token: &str) -> bool {
        self.0
            .lock()
            .expect("revocations")
            .remove(&<[u8; 32]>::from(Sha256::digest(token.as_bytes())))
            .is_some_and(|created| created.elapsed() < Duration::from_secs(600))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn only_terminal_refresh_errors_revoke() {
        let errors = Revocations::default();
        let request = b"grant_type=refresh_token&refresh_token=secret";
        errors.observe(
            request,
            http::StatusCode::SERVICE_UNAVAILABLE,
            br#"{"error":"invalid_grant"}"#,
        );
        errors.observe(
            request,
            http::StatusCode::BAD_REQUEST,
            br#"{"error":"use_dpop_nonce"}"#,
        );
        assert!(!errors.take("secret"));
        errors.observe(
            request,
            http::StatusCode::BAD_REQUEST,
            br#"{"error":"invalid_grant"}"#,
        );
        assert!(errors.take("secret"));
        assert!(!errors.take("secret"));
    }
}
