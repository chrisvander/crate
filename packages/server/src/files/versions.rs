use super::{model::File, mutation, read, repository::Repository};
use crate::error::{ApiError, Result};
use crate_protocol::{FileVersion, VERSION_COLLECTION, VersionList, VersionRecord};

pub async fn list(repo: &impl Repository, id: &str, space: &str, did: &str) -> Result<VersionList> {
    read::get(repo, id).await?;
    let mut versions = Vec::new();
    for entry in repo.list(VERSION_COLLECTION).await? {
        let version: VersionRecord = serde_json::from_value(entry.value)
            .map_err(|_| ApiError::upstream("A version record is malformed."))?;
        validate(&entry.id, &version)?;
        if version.file_id != id {
            continue;
        }
        let file = File {
            id: id.into(),
            revision: version.revision,
            record: version.record,
        }
        .entry(space, did);
        versions.push(FileVersion {
            id: entry.id,
            file_id: id.into(),
            captured_at: version.captured_at,
            file,
        });
    }
    versions.sort_by_cached_key(|version| {
        std::cmp::Reverse(
            chrono::DateTime::parse_from_rfc3339(&version.captured_at)
                .expect("version timestamps were validated"),
        )
    });
    Ok(VersionList { versions })
}

pub async fn restore(
    repo: &impl Repository,
    id: &str,
    version_id: &str,
    revision: &str,
) -> Result<File> {
    let current = read::get(repo, id).await?;
    current.check_revision(revision)?;
    if current.record.trashed_at.is_some() {
        return Err(ApiError::conflict(
            "Restore this file from Trash before restoring a version.",
        ));
    }
    let snapshot = repo.get(VERSION_COLLECTION, version_id).await?;
    let version: VersionRecord = serde_json::from_value(snapshot.value)
        .map_err(|_| ApiError::upstream("A version record is malformed."))?;
    if version.file_id != id {
        return Err(ApiError::not_found());
    }
    validate(version_id, &version)?;
    if version.record.is_directory != current.record.is_directory {
        return Err(ApiError::bad("The version has a different file kind."));
    }
    let mut next = version.record;
    next.created_at = current.record.created_at.clone();
    next.parent_id = current.record.parent_id.clone();
    next.trashed_at = None;
    mutation::commit(repo, current, next).await
}

fn validate(id: &str, version: &VersionRecord) -> Result<()> {
    version
        .validate()
        .map_err(|_| ApiError::upstream("A version record failed validation."))?;
    if id != format!("{}.{}", version.file_id, version.revision) {
        return Err(ApiError::upstream(
            "A version record has an invalid identity.",
        ));
    }
    Ok(())
}
