use crate_protocol::{BlobRef, FileEntry, FileKind, FileRecord, UpdateFile, VersionRecord};
use jacquard_lexicon::{schema::global_registry, validation::SchemaValidator};
use poem_openapi::types::{ParseFromJSON, ToJSON, Type};
use serde_json::json;

const CID: &str = "bafkreibme22gw2h7y2h7tg2fhqotaqjucnbc24deqo72b6mkl2egezxhvy";
const DATE: &str = "2026-09-05T12:00:00Z";
const TID: &str = "3jzfcijpj2z2a";

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
        file_id: TID.into(),
        revision: CID.into(),
        captured_at: DATE.into(),
        record: directory,
    };
    let data = jacquard_common::types::value::to_data(&snapshot).unwrap();
    let result = validator.validate::<VersionRecord>(&data).unwrap();
    assert!(result.is_valid(), "{result:?}");
}

#[test]
fn personal_space_declaration_has_required_metadata_and_record_collections() {
    use crate_protocol::{FILE_COLLECTION, NAME_COLLECTION, SPACE_TYPE, VERSION_COLLECTION};

    let documents = crate_protocol::lexicons::documents().unwrap();
    let (_, space) = documents
        .iter()
        .find(|(_, document)| document["id"] == SPACE_TYPE)
        .unwrap();
    let declaration = &space["defs"]["main"];
    assert_eq!(space["lexicon"], 1);
    assert_eq!(declaration["type"], "space");
    assert_eq!(declaration["key"], "literal:self");
    assert_eq!(declaration["name"], "Crate Drive");
    assert_eq!(
        declaration["collections"],
        json!([FILE_COLLECTION, VERSION_COLLECTION, NAME_COLLECTION])
    );
    for collection in declaration["collections"].as_array().unwrap() {
        assert!(documents.iter().any(|(_, document)| {
            document["id"] == *collection && document["defs"]["main"]["type"] == "record"
        }));
    }
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
    assert_eq!(update.name, "New");
    assert!(
        UpdateFile::parse_from_json(Some(json!({
            "revision": CID, "name": "New", "parentId": TID
        })))
        .is_err()
    );
}

#[test]
fn request_strings_never_coerce_json_scalars() {
    use crate_protocol::{CreateFile, DuplicateFile, LoginInput, RevisionInput};
    for value in [json!(42), json!(true), json!({}), json!([])] {
        let invalid = [
            LoginInput::parse_from_json(Some(json!({"handle": value}))).is_err(),
            RevisionInput::parse_from_json(Some(json!({"revision": value}))).is_err(),
            UpdateFile::parse_from_json(Some(json!({"revision": value, "name": "New"}))).is_err(),
            UpdateFile::parse_from_json(Some(json!({"revision": CID, "name": value}))).is_err(),
            CreateFile::parse_from_json(Some(json!({"kind": "file", "name": value}))).is_err(),
            CreateFile::parse_from_json(Some(
                json!({"kind": "file", "name": "New", "parentId": value}),
            ))
            .is_err(),
            DuplicateFile::parse_from_json(Some(json!({"revision": value, "name": "New"})))
                .is_err(),
            DuplicateFile::parse_from_json(Some(json!({"revision": CID, "name": value}))).is_err(),
            DuplicateFile::parse_from_json(Some(
                json!({"revision": CID, "name": "New", "parentId": value}),
            ))
            .is_err(),
        ];
        assert!(
            invalid.into_iter().all(|rejected| rejected),
            "Coerced {value}"
        );
    }
}

#[test]
fn version_records_validate_every_boundary() {
    let version = VersionRecord {
        file_id: TID.into(),
        revision: CID.into(),
        captured_at: DATE.into(),
        record: directory(),
    };
    assert!(version.validate().is_ok());
    assert!(
        VersionRecord {
            file_id: "not-a-tid".into(),
            ..version.clone()
        }
        .validate()
        .is_err()
    );
    assert!(
        VersionRecord {
            revision: "not-a-cid".into(),
            ..version.clone()
        }
        .validate()
        .is_err()
    );
    assert!(
        VersionRecord {
            captured_at: "yesterday".into(),
            ..version.clone()
        }
        .validate()
        .is_err()
    );
    let mut invalid_record = directory();
    invalid_record.parent_id = Some("valid-record-key-but-not-a-tid".into());
    assert!(
        VersionRecord {
            record: invalid_record,
            ..version
        }
        .validate()
        .is_err()
    );
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
