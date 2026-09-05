use std::{env, fs, path::PathBuf};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let destination = PathBuf::from(
        env::args()
            .nth(1)
            .ok_or("Usage: export-lexicons <directory>")?,
    );
    for (relative, document) in crate_protocol::lexicons::documents()? {
        let path = destination.join(relative);
        fs::create_dir_all(
            path.parent()
                .ok_or("Schema output must have a parent directory")?,
        )?;
        fs::write(
            path,
            format!("{}\n", serde_json::to_string_pretty(&document)?),
        )?;
    }
    Ok(())
}
