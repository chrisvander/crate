use std::{env, net::SocketAddr, path::PathBuf};
use url::Url;

#[derive(Clone)]
pub struct Config {
    pub bind: SocketAddr,
    pub server_url: Url,
    pub web_url: Url,
    pub data_dir: PathBuf,
    pub max_upload_bytes: usize,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        let server_url = Url::parse(&value("CRATE_SERVER_URL", "http://127.0.0.1:3030"))?;
        let web_url = Url::parse(&value("CRATE_WEB_URL", "http://127.0.0.1:5173"))?;
        let config = Self {
            bind: format!(
                "{}:{}",
                value("CRATE_SERVER_HOST", "127.0.0.1"),
                value("PORT", "3030")
            )
            .parse()?,
            server_url,
            web_url,
            data_dir: value("CRATE_DATA_DIR", ".crate-data").into(),
            max_upload_bytes: value("CRATE_MAX_UPLOAD_BYTES", "104857600").parse()?,
        };
        config.validate()?;
        Ok(config)
    }

    pub fn validate(&self) -> anyhow::Result<()> {
        for url in [&self.server_url, &self.web_url] {
            anyhow::ensure!(
                url.path() == "/"
                    && url.query().is_none()
                    && url.fragment().is_none()
                    && url.username().is_empty()
                    && url.password().is_none(),
                "URLs must be origins"
            );
            anyhow::ensure!(
                url.scheme() == "https"
                    || (url.scheme() == "http" && url.host_str() == Some("127.0.0.1")),
                "HTTP is allowed only on 127.0.0.1"
            );
        }
        anyhow::ensure!(
            self.max_upload_bytes > 0 && self.max_upload_bytes <= crate_protocol::MAX_FILE_BYTES,
            "Transfer limit must be between 1 byte and 1 GiB"
        );
        Ok(())
    }

    pub fn secure(&self) -> bool {
        self.server_url.scheme() == "https"
    }
}

fn value(name: &str, default: &str) -> String {
    env::var(name).unwrap_or_else(|_| default.into())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn validates_origins_and_bounded_transfers() {
        let mut config = Config {
            bind: "127.0.0.1:3030".parse().unwrap(),
            server_url: "http://127.0.0.1:3030".parse().unwrap(),
            web_url: "http://127.0.0.1:5173".parse().unwrap(),
            data_dir: ".crate-data".into(),
            max_upload_bytes: 1024,
        };
        assert!(config.validate().is_ok());
        for origin in [
            "ftp://127.0.0.1",
            "http://localhost:3030",
            "https://user:secret@example.org",
            "https://example.org/#fragment",
            "https://example.org/path",
            "https://example.org/?query",
        ] {
            config.server_url = Url::parse(origin).unwrap();
            assert!(config.validate().is_err(), "{origin}");
        }
        config.server_url = Url::parse("https://api.example.org").unwrap();
        assert!(config.validate().is_ok());
        config.max_upload_bytes = 0;
        assert!(config.validate().is_err());
        config.max_upload_bytes = crate_protocol::MAX_FILE_BYTES + 1;
        assert!(config.validate().is_err());
    }
}
