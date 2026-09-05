use crate::error::{ApiError, Result};
use crate_protocol::BlobRef;
use poem::Body;
use sha2::{Digest, Sha256};
use tokio::io::AsyncReadExt;

pub async fn read_upload(body: Body, limit: usize) -> Result<Vec<u8>> {
    let mut bytes = Vec::new();
    body.into_async_read()
        .take(limit as u64 + 1)
        .read_to_end(&mut bytes)
        .await
        .map_err(|_| ApiError::bad("The upload was interrupted."))?;
    if bytes.len() > limit {
        return Err(ApiError::too_large());
    }
    Ok(bytes)
}

pub fn mime_type(value: Option<&str>) -> Result<String> {
    let mime = value
        .unwrap_or("application/octet-stream")
        .parse::<mime::Mime>()
        .map_err(|_| ApiError::bad("Invalid MIME type."))?;
    Ok(mime.to_string())
}

pub fn verify_blob(blob: &BlobRef, bytes: &[u8]) -> Result<()> {
    BlobDigest::new(bytes).verify(blob)
}

pub struct BlobDigest {
    size: usize,
    sha256: [u8; 32],
}

impl BlobDigest {
    pub fn new(bytes: &[u8]) -> Self {
        Self {
            size: bytes.len(),
            sha256: Sha256::digest(bytes).into(),
        }
    }
    pub fn verify(&self, blob: &BlobRef) -> Result<()> {
        let BlobRef::Blob(blob) = blob;
        let cid = &blob.r#ref.0;
        if blob.size != self.size
            || cid.codec() != 0x55
            || cid.hash().code() != 0x12
            || cid.hash().digest() != self.sha256
        {
            return Err(ApiError::upstream(
                "File bytes do not match the PDS blob reference.",
            ));
        }
        Ok(())
    }
}

pub fn disposition(name: &str) -> String {
    format!(
        "attachment; filename=\"download\"; filename*=UTF-8''{}",
        percent_encoding::utf8_percent_encode(name, percent_encoding::NON_ALPHANUMERIC)
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn rejects_oversize_without_relying_on_content_length() {
        assert!(read_upload(Body::from("abcdef"), 5).await.is_err());
        assert_eq!(read_upload(Body::from("abc"), 5).await.unwrap(), b"abc");
    }
    #[test]
    fn attachment_filename_cannot_inject_headers() {
        let value = disposition("a\r\nContent-Type: text/html");
        assert!(!value.contains(['\r', '\n']));
        assert!(value.starts_with("attachment;"));
    }
}
