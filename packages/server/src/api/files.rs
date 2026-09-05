use crate::auth::security::Authenticated;
use crate::{
    error::Result,
    files::{self, repository::PdsRepository},
    pds::{rpc, space},
};
use crate_protocol::{
    BlobRef, CreateFile, DuplicateFile, FileEntry, FileKind, FileList, FileRecord, RevisionInput,
    UpdateFile, VersionList,
};
use poem_openapi::{
    OpenApi,
    param::{Path, Query},
    payload::Json,
};

pub struct FilesApi;

#[OpenApi]
impl FilesApi {
    #[oai(path = "/api/v1/files", method = "get", operation_id = "listFiles")]
    async fn list(
        &self,
        auth: Authenticated,
        #[oai(name = "parentId")] parent: Query<Option<String>>,
        trash: Query<Option<bool>>,
    ) -> Result<Json<FileList>> {
        let (did, session) = auth.0;
        let space = space::personal(&did);
        if !space::exists(&session, &space).await? {
            return Ok(Json(FileList { files: vec![] }));
        }
        let repo = PdsRepository {
            session: &session,
            space: &space,
            did: &did,
        };
        Ok(Json(
            files::read::list(
                &repo,
                parent.as_deref(),
                trash.unwrap_or(false),
                &space.uri,
                &did,
            )
            .await?,
        ))
    }

    #[oai(path = "/api/v1/files/:id", method = "get", operation_id = "getFile")]
    async fn get(&self, auth: Authenticated, id: Path<String>) -> Result<Json<FileEntry>> {
        let (did, session) = auth.0;
        let space = space::personal(&did);
        let repo = PdsRepository {
            session: &session,
            space: &space,
            did: &did,
        };
        Ok(Json(
            files::read::get(&repo, &id).await?.entry(&space.uri, &did),
        ))
    }

    #[oai(path = "/api/v1/files", method = "post", operation_id = "createFile")]
    async fn create(
        &self,
        auth: Authenticated,
        input: Json<CreateFile>,
    ) -> Result<Json<FileEntry>> {
        crate_protocol::validate_name(&input.name).map_err(crate::error::ApiError::bad)?;
        let (did, session) = auth.0;
        let space = space::personal(&did);
        let repo = PdsRepository {
            session: &session,
            space: &space,
            did: &did,
        };
        files::read::parent(&repo, input.parent_id.as_deref(), None).await?;
        space::ensure(&session, &space).await?;
        let blob = if input.kind == FileKind::File {
            #[derive(serde::Deserialize)]
            struct Uploaded {
                blob: BlobRef,
            }
            let uploaded =
                rpc::upload::<Uploaded>(&session, vec![], "application/octet-stream").await?;
            files::content::verify_blob(&uploaded.blob, &[])?;
            Some(uploaded.blob)
        } else {
            None
        };
        let now = chrono::Utc::now().to_rfc3339();
        let record = FileRecord {
            name: input.name.clone(),
            parent_id: input.parent_id.clone(),
            is_directory: input.kind == FileKind::Directory,
            created_at: now.clone(),
            updated_at: now,
            trashed_at: None,
            blob,
        };
        let repo = PdsRepository {
            session: &session,
            space: &space,
            did: &did,
        };
        Ok(Json(
            files::mutation::create(&repo, record)
                .await?
                .entry(&space.uri, &did),
        ))
    }

    #[oai(
        path = "/api/v1/files/:id",
        method = "put",
        operation_id = "updateFile"
    )]
    async fn update(
        &self,
        auth: Authenticated,
        id: Path<String>,
        input: Json<UpdateFile>,
    ) -> Result<Json<FileEntry>> {
        let (did, session) = auth.0;
        let space = space::personal(&did);
        let repo = PdsRepository {
            session: &session,
            space: &space,
            did: &did,
        };
        Ok(Json(
            files::mutation::metadata(&repo, &id, input.0)
                .await?
                .entry(&space.uri, &did),
        ))
    }

    #[oai(
        path = "/api/v1/files/:id/duplicate",
        method = "post",
        operation_id = "duplicateFile"
    )]
    async fn duplicate(
        &self,
        auth: Authenticated,
        id: Path<String>,
        input: Json<DuplicateFile>,
    ) -> Result<Json<FileEntry>> {
        let (did, session) = auth.0;
        let space = space::personal(&did);
        let repo = PdsRepository {
            session: &session,
            space: &space,
            did: &did,
        };
        Ok(Json(
            files::duplicate::duplicate(&repo, &id, input.0)
                .await?
                .entry(&space.uri, &did),
        ))
    }

    #[oai(
        path = "/api/v1/files/:id/trash",
        method = "post",
        operation_id = "trashFile"
    )]
    async fn trash(
        &self,
        auth: Authenticated,
        id: Path<String>,
        input: Json<RevisionInput>,
    ) -> Result<Json<FileEntry>> {
        let (did, session) = auth.0;
        let space = space::personal(&did);
        let repo = PdsRepository {
            session: &session,
            space: &space,
            did: &did,
        };
        Ok(Json(
            files::mutation::trash(&repo, &id, &input.revision, false)
                .await?
                .entry(&space.uri, &did),
        ))
    }

    #[oai(
        path = "/api/v1/files/:id/restore",
        method = "post",
        operation_id = "restoreFile"
    )]
    async fn restore(
        &self,
        auth: Authenticated,
        id: Path<String>,
        input: Json<RevisionInput>,
    ) -> Result<Json<FileEntry>> {
        let (did, session) = auth.0;
        let space = space::personal(&did);
        let repo = PdsRepository {
            session: &session,
            space: &space,
            did: &did,
        };
        Ok(Json(
            files::mutation::trash(&repo, &id, &input.revision, true)
                .await?
                .entry(&space.uri, &did),
        ))
    }

    #[oai(
        path = "/api/v1/files/:id/versions",
        method = "get",
        operation_id = "listVersions"
    )]
    async fn versions(&self, auth: Authenticated, id: Path<String>) -> Result<Json<VersionList>> {
        let (did, session) = auth.0;
        let space = space::personal(&did);
        let repo = PdsRepository {
            session: &session,
            space: &space,
            did: &did,
        };
        Ok(Json(
            files::versions::list(&repo, &id, &space.uri, &did).await?,
        ))
    }

    #[oai(
        path = "/api/v1/files/:id/versions/:versionId/restore",
        method = "post",
        operation_id = "restoreVersion"
    )]
    async fn restore_version(
        &self,
        auth: Authenticated,
        id: Path<String>,
        #[oai(name = "versionId")] version: Path<String>,
        input: Json<RevisionInput>,
    ) -> Result<Json<FileEntry>> {
        let (did, session) = auth.0;
        let space = space::personal(&did);
        let repo = PdsRepository {
            session: &session,
            space: &space,
            did: &did,
        };
        Ok(Json(
            files::versions::restore(&repo, &id, &version, &input.revision)
                .await?
                .entry(&space.uri, &did),
        ))
    }
}
