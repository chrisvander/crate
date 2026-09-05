use crate::error::{ApiError, body};
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(try_from = "Fields")]
pub struct Callback {
    pub state: String,
    pub issuer: Option<String>,
    pub outcome: Outcome,
}

pub enum Outcome {
    Authorized {
        code: String,
    },
    Rejected {
        error: String,
        description: Option<String>,
    },
}

// Parse the flat query fields, then make success and rejection mutually exclusive.
#[derive(Deserialize)]
struct Fields {
    state: String,
    iss: Option<String>,
    code: Option<String>,
    error: Option<String>,
    error_description: Option<String>,
}

impl TryFrom<Fields> for Callback {
    type Error = &'static str;

    fn try_from(fields: Fields) -> Result<Self, Self::Error> {
        if fields.state.trim().is_empty() {
            return Err("OAuth state is missing");
        }
        let outcome = match (fields.code, fields.error, fields.error_description) {
            (Some(code), None, None) if !code.trim().is_empty() => Outcome::Authorized { code },
            (None, Some(error), description) if !error.trim().is_empty() => {
                Outcome::Rejected { error, description }
            }
            _ => return Err("OAuth callbacks require exactly one authorization code or error"),
        };
        Ok(Self {
            state: fields.state,
            issuer: fields.iss,
            outcome,
        })
    }
}

pub fn rejection(error: &str, description: Option<&str>) -> ApiError {
    match (error, description) {
        ("invalid_scope", Some("Unable to retrieve space declarations")) => {
            ApiError::BadRequest(body(
                "SpaceDeclarationsUnavailable",
                format!(
                    "Your PDS could not retrieve Crate's space declarations. The {} declaration must be published and reachable before sign-in can finish. Restart login after the declaration is available.",
                    crate_protocol::SPACE_TYPE
                ),
            ))
        }
        ("invalid_scope", _) => ApiError::BadRequest(body(
            "OAuthScopeRejected",
            "Your PDS rejected the requested Crate permissions. Verify that the PDS supports these permissions, then restart login.",
        )),
        ("access_denied", _) => ApiError::BadRequest(body(
            "OAuthDenied",
            "Authorization was declined or denied by your PDS. Restart login if you want to try again.",
        )),
        ("temporarily_unavailable" | "server_error", _) => {
            ApiError::upstream("Your PDS could not finish authorization. Restart login shortly.")
        }
        _ => ApiError::BadRequest(body(
            "OAuthRejected",
            "Your PDS rejected authorization. Restart login to try again.",
        )),
    }
}
