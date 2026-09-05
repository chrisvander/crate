mod support;
use crate_protocol::{
    DuplicateFile, FILE_COLLECTION, NAME_COLLECTION, UpdateFile, VERSION_COLLECTION,
};
use crate_server::files::{duplicate, mutation, read, repository::Repository, versions};
use support::{MemoryRepository, file};

#[tokio::test]
async fn root_listing_returns_children_and_nested_listing_is_not_recursive() {
    let repo = MemoryRepository::default();
    let folder = mutation::create(&repo, file("folder", None, true))
        .await
        .unwrap();
    mutation::create(&repo, file("child", Some(&folder.id), false))
        .await
        .unwrap();
    let root = read::list(&repo, None, false, "space", "did")
        .await
        .unwrap();
    assert_eq!(root.files.len(), 1);
    assert_eq!(root.files[0].id, folder.id);
    assert_eq!(
        read::list(&repo, Some(&folder.id), false, "space", "did")
            .await
            .unwrap()
            .files
            .len(),
        1
    );
}

#[tokio::test]
async fn concurrent_name_creates_have_one_winner_and_no_orphan_file() {
    let repo = MemoryRepository::default();
    let (a, b) = tokio::join!(
        mutation::create(&repo, file("same", None, false)),
        mutation::create(&repo, file("same", None, false))
    );
    assert_ne!(a.is_ok(), b.is_ok());
    assert_eq!(repo.list(FILE_COLLECTION).await.unwrap().len(), 1);
    assert_eq!(repo.list(NAME_COLLECTION).await.unwrap().len(), 1);
}

#[tokio::test]
async fn concurrent_revision_writes_have_one_winner() {
    let repo = MemoryRepository::default();
    let current = mutation::create(&repo, file("first", None, false))
        .await
        .unwrap();
    let mut a = current.record.clone();
    a.name = "a".into();
    let mut b = current.record.clone();
    b.name = "b".into();
    let (a, b) = tokio::join!(
        mutation::commit(&repo, current.clone(), a),
        mutation::commit(&repo, current.clone(), b)
    );
    assert_ne!(a.is_ok(), b.is_ok());
    assert_eq!(repo.list(VERSION_COLLECTION).await.unwrap().len(), 1);
    assert_eq!(repo.list(NAME_COLLECTION).await.unwrap().len(), 1);
    let final_file = read::get(&repo, &current.id).await.unwrap();
    assert_ne!(final_file.revision, current.revision);
    assert_eq!(final_file.record.blob, current.record.blob);
}

#[tokio::test]
async fn conflicting_rename_rolls_back_snapshot_claim_and_head() {
    let repo = MemoryRepository::default();
    let current = mutation::create(&repo, file("original", None, false))
        .await
        .unwrap();
    mutation::create(&repo, file("occupied", None, false))
        .await
        .unwrap();
    assert!(
        mutation::metadata(
            &repo,
            &current.id,
            UpdateFile {
                revision: current.revision.clone(),
                name: "occupied".into()
            }
        )
        .await
        .is_err()
    );
    assert_eq!(
        read::get(&repo, &current.id).await.unwrap().revision,
        current.revision
    );
    assert_eq!(repo.list(VERSION_COLLECTION).await.unwrap().len(), 0);
    assert_eq!(repo.list(NAME_COLLECTION).await.unwrap().len(), 2);
}

#[tokio::test]
async fn trash_releases_name_and_restore_requires_it_to_be_available() {
    let repo = MemoryRepository::default();
    let current = mutation::create(&repo, file("name", None, false))
        .await
        .unwrap();
    let trash = mutation::trash(&repo, &current.id, &current.revision, false)
        .await
        .unwrap();
    mutation::create(&repo, file("name", None, false))
        .await
        .unwrap();
    assert!(
        mutation::trash(&repo, &current.id, &trash.revision, true)
            .await
            .is_err()
    );
    assert!(
        read::get(&repo, &current.id)
            .await
            .unwrap()
            .record
            .trashed_at
            .is_some()
    );
    assert_eq!(repo.list(VERSION_COLLECTION).await.unwrap().len(), 1);
}

#[tokio::test]
async fn ancestor_trash_hides_children_and_restore_preserves_them() {
    let repo = MemoryRepository::default();
    let folder = mutation::create(&repo, file("folder", None, true))
        .await
        .unwrap();
    let child = mutation::create(&repo, file("child", Some(&folder.id), false))
        .await
        .unwrap();
    let trash = mutation::trash(&repo, &folder.id, &folder.revision, false)
        .await
        .unwrap();
    assert!(
        read::list(&repo, Some(&folder.id), false, "space", "did")
            .await
            .is_err()
    );
    assert!(
        mutation::create(&repo, file("new", Some(&folder.id), false))
            .await
            .is_err()
    );
    assert!(
        duplicate::duplicate(
            &repo,
            &child.id,
            DuplicateFile {
                revision: child.revision.clone(),
                name: "copy".into(),
                parent_id: None
            }
        )
        .await
        .is_err()
    );
    mutation::trash(&repo, &folder.id, &trash.revision, true)
        .await
        .unwrap();
    assert_eq!(
        read::list(&repo, Some(&folder.id), false, "space", "did")
            .await
            .unwrap()
            .files[0]
            .id,
        child.id
    );
}

#[tokio::test]
async fn duplication_reuses_blob_but_has_independent_stable_identity() {
    let repo = MemoryRepository::default();
    let current = mutation::create(&repo, file("original", None, false))
        .await
        .unwrap();
    let copy = duplicate::duplicate(
        &repo,
        &current.id,
        DuplicateFile {
            revision: current.revision.clone(),
            name: "copy".into(),
            parent_id: None,
        },
    )
    .await
    .unwrap();
    assert_ne!(copy.id, current.id);
    assert_eq!(copy.record.blob, current.record.blob);
    assert_eq!(
        read::get(&repo, &current.id).await.unwrap().revision,
        current.revision
    );
}

#[tokio::test]
async fn restoring_a_version_is_a_new_revision_with_the_same_file_id() {
    let repo = MemoryRepository::default();
    let original = mutation::create(&repo, file("original", None, false))
        .await
        .unwrap();
    let renamed = mutation::metadata(
        &repo,
        &original.id,
        UpdateFile {
            revision: original.revision.clone(),
            name: "renamed".into(),
        },
    )
    .await
    .unwrap();
    let history = versions::list(&repo, &original.id, "space", "did")
        .await
        .unwrap();
    assert_eq!(history.versions[0].file.revision, original.revision);
    let restored = versions::restore(
        &repo,
        &original.id,
        &history.versions[0].id,
        &renamed.revision,
    )
    .await
    .unwrap();
    assert_eq!(restored.id, original.id);
    assert_eq!(restored.record.name, "original");
    assert_ne!(restored.revision, original.revision);
    assert_eq!(repo.list(VERSION_COLLECTION).await.unwrap().len(), 2);
}

#[tokio::test]
async fn version_history_orders_mixed_offsets_by_instant_not_local_clock() {
    use crate_protocol::VersionRecord;
    use crate_server::files::repository::Write;

    let repo = MemoryRepository::default();
    let current = mutation::create(&repo, file("current", None, false))
        .await
        .unwrap();
    for captured_at in [
        "2026-09-05T12:30:00+02:00",
        "2026-09-05T11:00:00Z",
        "2026-09-05T07:30:00-04:00",
    ] {
        let mut record = current.record.clone();
        record.updated_at = captured_at.into();
        let revision = support::cid(&serde_json::to_vec(&record).unwrap());
        let version = VersionRecord {
            file_id: current.id.clone(),
            revision: revision.clone(),
            captured_at: captured_at.into(),
            record,
        };
        repo.apply(vec![Write::Create {
            collection: VERSION_COLLECTION.into(),
            rkey: format!("{}.{}", current.id, revision),
            value: serde_json::to_value(version).unwrap(),
        }])
        .await
        .unwrap();
    }

    let history = versions::list(&repo, &current.id, "space", "did")
        .await
        .unwrap();
    let timestamps: Vec<_> = history
        .versions
        .iter()
        .map(|version| version.captured_at.as_str())
        .collect();
    assert_eq!(
        timestamps,
        [
            "2026-09-05T07:30:00-04:00",
            "2026-09-05T11:00:00Z",
            "2026-09-05T12:30:00+02:00",
        ]
    );
}

#[tokio::test]
async fn central_commit_rejects_moves_and_therefore_cross_client_cycles() {
    let repo = MemoryRepository::default();
    let a = mutation::create(&repo, file("a", None, true))
        .await
        .unwrap();
    let b = mutation::create(&repo, file("b", None, true))
        .await
        .unwrap();
    let mut next_a = a.record.clone();
    next_a.parent_id = Some(b.id.clone());
    let mut next_b = b.record.clone();
    next_b.parent_id = Some(a.id.clone());
    let (a, b) = tokio::join!(
        mutation::commit(&repo, a, next_a),
        mutation::commit(&repo, b, next_b)
    );
    assert!(a.is_err() && b.is_err());
}
