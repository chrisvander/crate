use crate::{auth::Session, error::ApiError};
use atrium_xrpc::{
    InputDataOrBytes, OutputDataOrBytes, XrpcClient, XrpcRequest,
    error::{ErrorResponseBody, XrpcErrorKind},
    http::Method,
};
use serde::{Serialize, de::DeserializeOwned};
use serde_json::Value;

#[derive(Debug)]
pub struct RpcError {
    pub code: String,
    pub message: String,
    pub status: u16,
}

pub async fn query<T: DeserializeOwned + Send + Sync>(
    session: &Session,
    nsid: &str,
    params: Value,
) -> Result<T, RpcError> {
    let result = session
        .send_xrpc::<_, (), T, ErrorResponseBody>(&XrpcRequest {
            method: Method::GET,
            nsid: nsid.into(),
            parameters: Some(params),
            input: None,
            encoding: None,
        })
        .await;
    match result.map_err(convert)? {
        OutputDataOrBytes::Data(data) => Ok(data),
        _ => Err(malformed()),
    }
}

pub async fn procedure<T: DeserializeOwned + Send + Sync>(
    session: &Session,
    nsid: &str,
    body: impl Serialize + Send + Sync,
) -> Result<T, RpcError> {
    let result = session
        .send_xrpc::<(), _, T, ErrorResponseBody>(&XrpcRequest {
            method: Method::POST,
            nsid: nsid.into(),
            parameters: None,
            input: Some(InputDataOrBytes::Data(body)),
            encoding: Some("application/json".into()),
        })
        .await;
    match result.map_err(convert)? {
        OutputDataOrBytes::Data(data) => Ok(data),
        _ => Err(malformed()),
    }
}

pub async fn upload<T: DeserializeOwned + Send + Sync>(
    session: &Session,
    bytes: Vec<u8>,
    mime: &str,
) -> Result<T, RpcError> {
    let result = session
        .send_xrpc::<(), (), T, ErrorResponseBody>(&XrpcRequest {
            method: Method::POST,
            nsid: "com.atproto.repo.uploadBlob".into(),
            parameters: None,
            input: Some(InputDataOrBytes::Bytes(bytes)),
            encoding: Some(mime.into()),
        })
        .await;
    match result.map_err(convert)? {
        OutputDataOrBytes::Data(data) => Ok(data),
        _ => Err(malformed()),
    }
}

pub async fn download(session: &Session, params: Value) -> Result<Vec<u8>, RpcError> {
    let result = session
        .send_xrpc::<_, (), Value, ErrorResponseBody>(&XrpcRequest {
            method: Method::GET,
            nsid: "com.atproto.space.getBlob".into(),
            parameters: Some(params),
            input: None,
            encoding: None,
        })
        .await;
    match result.map_err(convert)? {
        OutputDataOrBytes::Bytes(data) => Ok(data),
        _ => Err(malformed()),
    }
}

fn malformed() -> RpcError {
    RpcError {
        code: "InvalidPdsResponse".into(),
        message: "The PDS returned an invalid response.".into(),
        status: 502,
    }
}

fn convert(error: atrium_xrpc::Error<ErrorResponseBody>) -> RpcError {
    if let atrium_xrpc::Error::XrpcResponse(response) = error {
        let details = match response.error {
            Some(XrpcErrorKind::Custom(value) | XrpcErrorKind::Undefined(value)) => value,
            None => ErrorResponseBody {
                error: None,
                message: None,
            },
        };
        return RpcError {
            code: details.error.unwrap_or_default(),
            message: details
                .message
                .unwrap_or_else(|| "The PDS request failed.".into()),
            status: response.status.as_u16(),
        };
    }
    RpcError {
        code: "PdsUnavailable".into(),
        message: "The PDS could not be reached. Your session is retained; retry shortly.".into(),
        status: 502,
    }
}

impl From<RpcError> for ApiError {
    fn from(error: RpcError) -> Self {
        match (error.status, error.code.as_str()) {
            (_, "RecordAlreadyExists") => Self::conflict(
                "This revision or filename changed on another client. Refresh and retry.",
            ),
            (_, "RecordNotFound" | "BlobNotFound") => Self::not_found(),
            (_, "MethodNotImplemented" | "XRPCNotSupported" | "NotImplemented") | (501, _) => {
                Self::unavailable(
                    "This PDS does not support the required ATProto Spaces API. No data was made public.",
                )
            }
            (401, _) => Self::unauthorized(),
            (403, _) => Self::forbidden("The PDS denied access to this private space."),
            (413, _) => Self::too_large(),
            (_, "SpaceNotFound" | "SpaceDeleted") => Self::unavailable(
                "The private Crate space is unavailable. No public storage fallback is used.",
            ),
            _ => Self::upstream(error.message),
        }
    }
}
