use super::{
    model::{self, File},
    read,
    repository::{Repository, Write},
};
use crate::error::{ApiError, Result};
use crate_protocol::{FILE_COLLECTION, FileRecord, VERSION_COLLECTION, VersionRecord};

pub async fn create(repo: &impl Repository, record: FileRecord) -> Result<File> {
    record.validate().map_err(ApiError::bad)?;
    read::parent(repo, record.parent_id.as_deref(), None).await?;
    let id = model::next_id();
    let writes = vec![
        model::claim(&id, &record)?,
        Write::Create {
            collection: FILE_COLLECTION.into(),
            rkey: id.clone(),
            value: model::value(&record)?,
        },
    ];
    repo.apply(writes).await?;
    read::get(repo, &id).await
}

pub async fn metadata(
    repo: &impl Repository,
    id: &str,
    input: crate_protocol::UpdateFile,
) -> Result<File> {
    let current = read::get(repo, id).await?;
    current.check_revision(&input.revision)?;
    if current.record.trashed_at.is_some() {
        return Err(ApiError::conflict("Restore this file before editing it."));
    }
    let mut next = current.record.clone();
    next.name = input.name;
    commit(repo, current, next).await
}

pub async fn trash(
    repo: &impl Repository,
    id: &str,
    revision: &str,
    restore: bool,
) -> Result<File> {
    let current = read::get(repo, id).await?;
    current.check_revision(revision)?;
    let mut next = current.record.clone();
    next.trashed_at = if restore {
        None
    } else {
        Some(chrono::Utc::now().to_rfc3339())
    };
    commit(repo, current, next).await
}

pub async fn commit(repo: &impl Repository, current: File, mut next: FileRecord) -> Result<File> {
    if next.parent_id != current.record.parent_id {
        return Err(ApiError::bad("Moving existing files is not supported."));
    }
    if next == current.record {
        return Ok(current);
    }
    if next.trashed_at.is_none() {
        read::parent(repo, next.parent_id.as_deref(), Some(&current.id)).await?;
    }
    next.updated_at = model::updated_after(&current.record.updated_at);
    next.validate().map_err(ApiError::bad)?;
    let snapshot = VersionRecord {
        file_id: current.id.clone(),
        revision: current.revision.clone(),
        captured_at: next.updated_at.clone(),
        record: current.record.clone(),
    };
    // Spaces alpha has no swapRecord. Atomic create rejects a second writer of this revision.
    let mut writes = vec![Write::Create {
        collection: VERSION_COLLECTION.into(),
        rkey: format!("{}.{}", current.id, current.revision),
        value: model::value(&snapshot)?,
    }];
    let renamed = current.record.name != next.name || current.record.parent_id != next.parent_id;
    if current.record.trashed_at.is_none() && (renamed || next.trashed_at.is_some()) {
        writes.push(model::release(&current.record));
    }
    if next.trashed_at.is_none() && (renamed || current.record.trashed_at.is_some()) {
        writes.push(model::claim(&current.id, &next)?);
    }
    writes.push(Write::Update {
        collection: FILE_COLLECTION.into(),
        rkey: current.id.clone(),
        value: model::value(&next)?,
    });
    repo.apply(writes).await?;
    read::get(repo, &current.id).await
}
