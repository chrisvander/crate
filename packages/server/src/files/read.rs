use super::{model::File, repository::Repository};
use crate::error::{ApiError, Result};
use crate_protocol::{FILE_COLLECTION, FileList};
use std::collections::HashSet;

pub async fn get(repo: &impl Repository, id: &str) -> Result<File> {
    id.parse::<atrium_api::types::string::Tid>()
        .map_err(|_| ApiError::bad("Invalid file ID."))?;
    File::parse(repo.get(FILE_COLLECTION, id).await?)
}

pub async fn all(repo: &impl Repository) -> Result<Vec<File>> {
    repo.list(FILE_COLLECTION)
        .await?
        .into_iter()
        .map(File::parse)
        .collect()
}

pub async fn parent(
    repo: &impl Repository,
    parent: Option<&str>,
    child: Option<&str>,
) -> Result<()> {
    let mut current = parent.map(str::to_owned);
    let mut seen = HashSet::new();
    while let Some(id) = current {
        if !seen.insert(id.clone()) || Some(id.as_str()) == child {
            return Err(ApiError::bad(
                "A directory cannot contain itself or form a cycle.",
            ));
        }
        let file = get(repo, &id).await?;
        if !file.record.is_directory || file.record.trashed_at.is_some() {
            return Err(ApiError::conflict(
                "The destination folder is missing or in Trash.",
            ));
        }
        current = file.record.parent_id;
    }
    Ok(())
}

pub async fn list(
    repo: &impl Repository,
    parent_id: Option<&str>,
    trash: bool,
    space: &str,
    did: &str,
) -> Result<FileList> {
    if !trash {
        parent(repo, parent_id, None).await?;
    }
    let mut files: Vec<_> = all(repo)
        .await?
        .into_iter()
        .filter(|file| {
            if trash {
                file.record.trashed_at.is_some()
            } else {
                file.record.trashed_at.is_none() && file.record.parent_id.as_deref() == parent_id
            }
        })
        .map(|file| file.entry(space, did))
        .collect();
    files.sort_by(|a, b| a.name.cmp(&b.name).then(a.id.cmp(&b.id)));
    Ok(FileList { files })
}
