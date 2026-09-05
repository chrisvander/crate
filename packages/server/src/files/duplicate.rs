use super::{
    model::{self, File},
    read,
    repository::{Repository, Write},
};
use crate::error::{ApiError, Result};
use crate_protocol::{DuplicateFile, FILE_COLLECTION};
use std::collections::{HashMap, VecDeque};

pub async fn duplicate(repo: &impl Repository, id: &str, input: DuplicateFile) -> Result<File> {
    let source = read::get(repo, id).await?;
    source.check_revision(&input.revision)?;
    if source.record.trashed_at.is_some() {
        return Err(ApiError::conflict(
            "Restore this file before duplicating it.",
        ));
    }
    read::parent(repo, source.record.parent_id.as_deref(), None).await?;
    read::parent(repo, input.parent_id.as_deref(), None).await?;
    let all = if source.record.is_directory {
        read::all(repo).await?
    } else {
        vec![]
    };
    let new_id = model::next_id();
    let mut mapping = HashMap::from([(id.to_owned(), new_id.clone())]);
    let mut queue = VecDeque::from([source]);
    let mut writes = Vec::new();
    while let Some(file) = queue.pop_front() {
        if writes.len() >= 200 {
            return Err(ApiError::too_large());
        }
        let copy_id = mapping[&file.id].clone();
        let mut record = file.record.clone();
        record.created_at = chrono::Utc::now().to_rfc3339();
        record.updated_at = record.created_at.clone();
        record.trashed_at = None;
        if file.id == id {
            record.name = input.name.clone();
            record.parent_id = input.parent_id.clone();
        } else {
            record.parent_id = file
                .record
                .parent_id
                .as_ref()
                .and_then(|id| mapping.get(id).cloned());
        }
        record.validate().map_err(ApiError::bad)?;
        writes.push(model::claim(&copy_id, &record)?);
        writes.push(Write::Create {
            collection: FILE_COLLECTION.into(),
            rkey: copy_id,
            value: model::value(&record)?,
        });
        for child in all.iter().filter(|child| {
            child.record.parent_id.as_deref() == Some(&file.id) && child.record.trashed_at.is_none()
        }) {
            if mapping.insert(child.id.clone(), model::next_id()).is_some() {
                return Err(ApiError::bad("The source directory contains a cycle."));
            }
            queue.push_back(child.clone());
        }
    }
    repo.apply(writes).await?;
    read::get(repo, &new_id).await
}
