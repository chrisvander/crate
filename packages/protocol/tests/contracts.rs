use crate_protocol::{BlobRef, FileEntry, FileKind, FileRecord, UpdateFile, VersionRecord};
use jacquard_lexicon::{schema::global_registry, validation::SchemaValidator};
use poem_openapi::types::{ParseFromJSON, ToJSON, Type};
use serde_json::json;

const CID: &str = "bafkreibme22gw2h7y2h7tg2fhqotaqjucnbc24deqo72b6mkl2egezxhvy";
const DATE: &str = "2026-09-05T12:00:00Z";

fn directory() -> FileRecord {
    FileRecord {
        name: "Documents".into(),
        parent_id: None,
        is_directory: true,
        created_at: DATE.into(),
        updated_at: DATE.into(),
        trashed_at: None,
        blob: None,
    }
}

fn blob() -> BlobRef {
    serde_json::from_value(json!({
        "$type": "blob", "ref": {"$link": CID}, "mimeType": "text/plain", "size": 0
    }))
    .unwrap()
}

#[test]
fn serialized_records_match_derived_lexicons() {
    let validator = SchemaValidator::from_registry(global_registry().clone());
    let directory = directory();
    let value = serde_json::to_value(&directory).unwrap();
    assert_eq!(value["$type"], "network.crate.file");
    assert!(value.get("parentId").is_none());
    let data = jacquard_common::types::value::to_data(&directory).unwrap();
    let result = validator.validate::<FileRecord>(&data).unwrap();
    assert!(result.is_valid(), "{result:?}");

    let snapshot = VersionRecord {
        file_id: "3mabcdef12345".into(),
        revision: CID.into(),
        captured_at: DATE.into(),
        record: directory,
    };
    let data = jacquard_common::types::value::to_data(&snapshot).unwrap();
    let result = validator.validate::<VersionRecord>(&data).unwrap();
    assert!(result.is_valid(), "{result:?}");
}

#[test]
fn record_semantics_reject_invalid_files() {
    let directory = directory();
    assert!(directory.validate().is_ok());
    assert!(
        FileRecord {
            is_directory: false,
            ..directory.clone()
        }
        .validate()
        .is_err()
    );
    assert!(
        FileRecord {
            blob: Some(blob()),
            ..directory.clone()
        }
        .validate()
        .is_err()
    );
    assert!(
        FileRecord {
            is_directory: false,
            blob: Some(blob()),
            ..directory.clone()
        }
        .validate()
        .is_ok()
    );
    for name in ["", "..", "a/b", "a\\b", "bad\nname"] {
        assert!(
            FileRecord {
                name: name.into(),
                ..directory.clone()
            }
            .validate()
            .is_err()
        );
    }
    assert!(
        FileRecord {
            updated_at: "yesterday".into(),
            ..directory.clone()
        }
        .validate()
        .is_err()
    );
    assert!(
        FileRecord {
            parent_id: Some("bad/key".into()),
            ..directory
        }
        .validate()
        .is_err()
    );
}

#[test]
fn api_serializers_agree_on_omission_and_enum_names() {
    let file = FileEntry {
        id: "3mabcdef12345".into(),
        uri: "at://example".into(),
        revision: CID.into(),
        name: "Documents".into(),
        kind: FileKind::Directory,
        parent_id: None,
        created_at: DATE.into(),
        updated_at: DATE.into(),
        trashed_at: None,
        size: 0,
        blob: None,
    };
    let json = serde_json::to_value(&file).unwrap();
    assert_eq!(file.to_json(), Some(json.clone()));
    assert_eq!(json["kind"], "directory");
    assert!(json.get("parentId").is_none());
    assert!(json.get("blob").is_none());
    let mut registry = poem_openapi::registry::Registry::new();
    FileEntry::register(&mut registry);
    let schema = &registry.schemas["FileEntry"];
    assert!(!schema.required.contains(&"parentId"));
}

#[test]
fn metadata_update_requires_name_and_revision() {
    assert!(UpdateFile::parse_from_json(Some(json!({"name":"New"}))).is_err());
    assert!(UpdateFile::parse_from_json(Some(json!({"revision":CID}))).is_err());
    assert!(
        UpdateFile::parse_from_json(Some(json!({"revision":CID,"name":"New","unexpected":true})))
            .is_err()
    );
    let update = UpdateFile::parse_from_json(Some(json!({"revision":CID,"name":"New"}))).unwrap();
    assert!(update.parent_id.is_none());
}

#[test]
fn name_claims_are_scoped_and_unambiguous() {
    use crate_protocol::name_claim_key;
    assert_eq!(
        name_claim_key(None, "Documents"),
        "cc78b9e5ea9ff8bd300f79190f7f7754b7befd1b77d87460dcf77288c4f7e27f"
    );
    assert_eq!(
        name_claim_key(Some("3mabcdef12345"), "café.txt"),
        "7d91c5e0f4fdb569e9fad9dc48bb18b7ca66fa09824eed7eddeb17e4a53d2961"
    );
    assert_ne!(
        name_claim_key(None, "Documents"),
        name_claim_key(Some("parent"), "Documents")
    );
    assert_ne!(
        name_claim_key(Some("ab"), "c"),
        name_claim_key(Some("a"), "bc")
    );
    assert_ne!(name_claim_key(None, "A"), name_claim_key(None, "a"));
}
