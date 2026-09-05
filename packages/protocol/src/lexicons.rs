use crate::{
    FILE_COLLECTION, FileRecord, MAX_FILE_BYTES, NAME_COLLECTION, NameClaim, SPACE_TYPE,
    VERSION_COLLECTION, VersionRecord,
};
use jacquard_lexicon::schema::LexiconSchema;
use serde_json::{Value, json};

/// Rust record definitions are canonical. This function only adds blob/space policy
/// that the upstream derive does not yet support, without repeating record fields.
pub fn documents() -> Result<Vec<(&'static str, Value)>, serde_json::Error> {
    let mut file = serde_json::to_value(FileRecord::lexicon_doc())?;
    let blob = &mut file["defs"]["main"]["record"]["properties"]["blob"];
    blob["accept"] = json!(["*/*"]);
    blob["maxSize"] = json!(MAX_FILE_BYTES);
    Ok(vec![
        ("network/crate/file.json", file),
        (
            "network/crate/fileVersion.json",
            serde_json::to_value(VersionRecord::lexicon_doc())?,
        ),
        (
            "network/crate/fileName.json",
            serde_json::to_value(NameClaim::lexicon_doc())?,
        ),
        (
            "network/crate/drive.json",
            json!({
                "lexicon": 1,
                "id": SPACE_TYPE,
                "defs": {"main": {
                    "type": "space",
                    "key": "literal:self",
                    "name": "Crate Drive",
                    "description": "Personal Crate drive. Only its owner can read or write; clients use the shared collection protocol.",
                    "collections": [FILE_COLLECTION, VERSION_COLLECTION, NAME_COLLECTION]
                }}
            }),
        ),
    ])
}
