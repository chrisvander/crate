use crate::auth::security::Authenticated;
use crate::{
    error::{ApiError, Result, body},
    files::{self, content, repository::PdsRepository},
    pds::{rpc, space},
    state::State,
};
use crate_protocol::{BlobRef, FileEntry, FileRecord};
use poem::{Body, web::Data};
use poem_openapi::{
    ApiResponse, OpenApi,
    param::{Header, Path, Query},
    payload::{Binary, Json},
};
use std::sync::Arc;

pub struct ContentApi;
#[derive(serde::Deserialize)]
struct Uploaded {
    blob: BlobRef,
}

#[derive(ApiResponse)]
pub enum Download {
    #[oai(status = 200)]
    Complete(
        Binary<Vec<u8>>,
        #[oai(header = "Content-Disposition")] String,
        #[oai(header = "ETag")] String,
    ),
    #[oai(status = 206)]
    Partial(
        Binary<Vec<u8>>,
        #[oai(header = "Content-Disposition")] String,
        #[oai(header = "ETag")] String,
        #[oai(header = "Content-Range")] String,
    ),
    #[oai(status = 416)]
    Unsatisfiable(
        Json<crate_protocol::ErrorBody>,
        #[oai(header = "Content-Range")] String,
    ),
}

#[OpenApi]
impl ContentApi {
    #[oai(
        path = "/api/v1/files/upload",
        method = "post",
        operation_id = "uploadFile"
    )]
    async fn upload(
        &self,
        auth: Authenticated,
        state: Data<&Arc<State>>,
        name: Query<String>,
        #[oai(name = "parentId")] parent: Query<Option<String>>,
        #[oai(name = "mimeType")] mime: Query<Option<String>>,
        body: Binary<Body>,
    ) -> Result<Json<FileEntry>> {
        crate_protocol::validate_name(&name).map_err(ApiError::bad)?;
        let (did, session) = auth.0;
        let space = space::personal(&did);
        let repo = PdsRepository {
            session: &session,
            space: &space,
            did: &did,
        };
        files::read::parent(&repo, parent.as_deref(), None).await?;
        let bytes = content::read_upload(body.0, state.config.max_upload_bytes).await?;
        let mime = content::mime_type(mime.as_deref())?;
        space::ensure(&session, &space).await?;
        let digest = content::BlobDigest::new(&bytes);
        let uploaded: Uploaded = rpc::upload(&session, bytes, &mime).await?;
        digest.verify(&uploaded.blob)?;
        let now = chrono::Utc::now().to_rfc3339();
        let record = FileRecord {
            name: name.0,
            parent_id: parent.0,
            is_directory: false,
            created_at: now.clone(),
            updated_at: now,
            trashed_at: None,
            blob: Some(uploaded.blob),
        };
        Ok(Json(
            files::mutation::create(&repo, record)
                .await?
                .entry(&space.uri, &did),
        ))
    }

    #[oai(
        path = "/api/v1/files/:id/content",
        method = "put",
        operation_id = "replaceContent"
    )]
    async fn replace(
        &self,
        auth: Authenticated,
        state: Data<&Arc<State>>,
        id: Path<String>,
        revision: Query<String>,
        #[oai(name = "mimeType")] mime: Query<Option<String>>,
        body: Binary<Body>,
    ) -> Result<Json<FileEntry>> {
        let (did, session) = auth.0;
        let space = space::personal(&did);
        let repo = PdsRepository {
            session: &session,
            space: &space,
            did: &did,
        };
        let current = files::read::get(&repo, &id).await?;
        current.check_revision(&revision)?;
        if current.record.is_directory || current.record.trashed_at.is_some() {
            return Err(ApiError::bad(
                "Only an active file has replaceable content.",
            ));
        }
        files::read::parent(&repo, current.record.parent_id.as_deref(), None).await?;
        let bytes = content::read_upload(body.0, state.config.max_upload_bytes).await?;
        let mime = content::mime_type(mime.as_deref())?;
        let digest = content::BlobDigest::new(&bytes);
        let uploaded: Uploaded = rpc::upload(&session, bytes, &mime).await?;
        digest.verify(&uploaded.blob)?;
        let mut next = current.record.clone();
        next.blob = Some(uploaded.blob);
        Ok(Json(
            files::mutation::commit(&repo, current, next)
                .await?
                .entry(&space.uri, &did),
        ))
    }

    #[oai(
        path = "/api/v1/files/:id/content",
        method = "get",
        operation_id = "downloadFile"
    )]
    async fn download(
        &self,
        auth: Authenticated,
        state: Data<&Arc<State>>,
        id: Path<String>,
        #[oai(name = "Range")] range: Header<Option<String>>,
        #[oai(name = "If-Range")] if_range: Header<Option<String>>,
    ) -> Result<Download> {
        let (did, session) = auth.0;
        let space = space::personal(&did);
        let repo = PdsRepository {
            session: &session,
            space: &space,
            did: &did,
        };
        let file = files::read::get(&repo, &id).await?;
        if file.record.trashed_at.is_some() {
            return Err(ApiError::not_found());
        }
        files::read::parent(&repo, file.record.parent_id.as_deref(), None).await?;
        let blob = file
            .record
            .blob
            .as_ref()
            .ok_or_else(|| ApiError::bad("Directories cannot be downloaded as files."))?;
        let BlobRef::Blob(reference) = blob;
        if reference.size > state.config.max_upload_bytes {
            return Err(ApiError::too_large());
        }
        let cid = reference.r#ref.0.to_string();
        let bytes = rpc::download(
            &session,
            serde_json::json!({"space":space.uri,"repo":did,"cid":cid}),
        )
        .await?;
        content::verify_blob(blob, &bytes)?;
        let disposition = content::disposition(&file.record.name);
        let etag = format!("\"{cid}\"");
        if let Some(range) = range
            .0
            .filter(|_| if_range.as_deref().is_none_or(|value| value == etag))
        {
            let Some(range) = content::byte_range(&range, bytes.len()) else {
                return Ok(Download::Unsatisfiable(
                    body("InvalidRange", "The requested byte range is invalid."),
                    format!("bytes */{}", bytes.len()),
                ));
            };
            return Ok(Download::Partial(
                Binary(bytes[range.clone()].to_vec()),
                disposition,
                etag,
                format!("bytes {}-{}/{}", range.start, range.end - 1, bytes.len()),
            ));
        }
        Ok(Download::Complete(Binary(bytes), disposition, etag))
    }
}
