use crate_protocol::ErrorBody;
use poem_openapi::{ApiResponse, payload::Json};

#[derive(Debug, ApiResponse)]
pub enum ApiError {
    #[oai(status = 400)]
    BadRequest(Json<ErrorBody>),
    #[oai(status = 401)]
    Unauthorized(Json<ErrorBody>),
    #[oai(status = 403)]
    Forbidden(Json<ErrorBody>),
    #[oai(status = 404)]
    NotFound(Json<ErrorBody>),
    #[oai(status = 409)]
    Conflict(Json<ErrorBody>),
    #[oai(status = 413)]
    TooLarge(Json<ErrorBody>),
    #[oai(status = 500)]
    Internal(Json<ErrorBody>),
    #[oai(status = 502)]
    BadGateway(Json<ErrorBody>),
    #[oai(status = 503)]
    Unavailable(Json<ErrorBody>),
}

impl ApiError {
    pub fn bad(message: impl Into<String>) -> Self {
        Self::BadRequest(body("InvalidRequest", message))
    }
    pub fn unauthorized() -> Self {
        Self::Unauthorized(body("LoginRequired", "Sign in to your PDS to continue."))
    }
    pub fn forbidden(message: impl Into<String>) -> Self {
        Self::Forbidden(body("Forbidden", message))
    }
    pub fn not_found() -> Self {
        Self::NotFound(body("NotFound", "The file or directory was not found."))
    }
    pub fn conflict(message: impl Into<String>) -> Self {
        Self::Conflict(body("Conflict", message))
    }
    pub fn too_large() -> Self {
        Self::TooLarge(body(
            "TransferLimit",
            "The operation exceeds the configured transfer or transaction limit.",
        ))
    }
    pub fn unavailable(message: impl Into<String>) -> Self {
        Self::Unavailable(body("SpacesUnavailable", message))
    }
    pub fn upstream(message: impl Into<String>) -> Self {
        Self::BadGateway(body("PdsUnavailable", message))
    }
}

pub fn body(code: impl Into<String>, message: impl Into<String>) -> Json<ErrorBody> {
    Json(ErrorBody {
        code: code.into(),
        message: message.into(),
    })
}

impl From<anyhow::Error> for ApiError {
    fn from(_: anyhow::Error) -> Self {
        Self::Internal(body(
            "InternalError",
            "The server could not complete the operation.",
        ))
    }
}

pub type Result<T> = std::result::Result<T, ApiError>;
