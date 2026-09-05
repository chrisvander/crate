use atrium_xrpc::{
    HttpClient,
    http::{Request, Response},
};
use std::{error::Error, sync::Arc, time::Duration};

#[derive(Clone)]
pub struct Transport {
    client: reqwest::Client,
    max_bytes: usize,
    pub revocations: super::revocation::Revocations,
}

impl Transport {
    pub fn new(max_bytes: usize) -> anyhow::Result<Self> {
        Ok(Self {
            client: reqwest::Client::builder()
                .no_proxy()
                .redirect(reqwest::redirect::Policy::none())
                .connect_timeout(Duration::from_secs(10))
                .timeout(Duration::from_secs(300))
                .dns_resolver(Arc::new(PublicDns))
                .build()?,
            max_bytes,
            revocations: Default::default(),
        })
    }
}

impl HttpClient for Transport {
    async fn send_http(
        &self,
        request: Request<Vec<u8>>,
    ) -> Result<Response<Vec<u8>>, Box<dyn Error + Send + Sync>> {
        let host = request.uri().host().ok_or("missing host")?;
        if request.uri().scheme_str() != Some("https") {
            return Err("PDS requests must use HTTPS".into());
        }
        if let Ok(ip) = host.trim_matches(['[', ']']).parse() {
            require_public(ip)?;
        }
        let is_blob = request.uri().path() == "/xrpc/com.atproto.space.getBlob";
        let limit = if is_blob {
            self.max_bytes
        } else {
            2 * 1024 * 1024
        };
        let refresh_body = if request
            .headers()
            .get(http::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .is_some_and(|v| v.starts_with("application/x-www-form-urlencoded"))
        {
            Some(request.body().clone())
        } else {
            None
        };
        let mut response = self.client.execute(request.try_into()?).await?;
        let status = response.status();
        if response
            .content_length()
            .is_some_and(|size| size > limit as u64)
        {
            return Err("PDS response exceeds transfer limit".into());
        }
        let mut builder = Response::builder().status(response.status());
        for (key, value) in response.headers() {
            // The SDK otherwise parses JSON files as API responses, losing their original bytes.
            if is_blob && response.status().is_success() && key == http::header::CONTENT_TYPE {
                continue;
            }
            builder = builder.header(key, value);
        }
        if is_blob && response.status().is_success() {
            builder = builder.header(http::header::CONTENT_TYPE, "application/octet-stream");
        }
        let mut bytes = Vec::new();
        while let Some(chunk) = response.chunk().await? {
            if bytes.len() + chunk.len() > limit {
                return Err("PDS response exceeds transfer limit".into());
            }
            bytes.extend_from_slice(&chunk);
        }
        if let Some(request) = refresh_body {
            self.revocations.observe(&request, status, &bytes);
        }
        Ok(builder.body(bytes)?)
    }
}

struct PublicDns;
impl reqwest::dns::Resolve for PublicDns {
    fn resolve(&self, name: reqwest::dns::Name) -> reqwest::dns::Resolving {
        Box::pin(async move {
            let addresses: Vec<_> = tokio::net::lookup_host((name.as_str(), 0)).await?.collect();
            for address in &addresses {
                require_public(address.ip())?;
            }
            Ok(Box::new(addresses.into_iter()) as reqwest::dns::Addrs)
        })
    }
}

fn require_public(ip: std::net::IpAddr) -> Result<(), Box<dyn Error + Send + Sync>> {
    use std::net::IpAddr;
    let denied = match ip {
        IpAddr::V4(v) => {
            v.is_private()
                || v.is_loopback()
                || v.is_link_local()
                || v.is_unspecified()
                || v.is_multicast()
                || v.is_broadcast()
                || v.is_documentation()
                || v.octets()[0] == 0
                || v.octets()[0] >= 240
                || (v.octets()[0] == 198 && matches!(v.octets()[1], 18 | 19))
                || (v.octets()[0] == 192 && v.octets()[1] == 0 && v.octets()[2] == 0)
                || (v.octets()[0] == 100 && (64..=127).contains(&v.octets()[1]))
        }
        IpAddr::V6(v) => {
            v.segments()[0] & 0xe000 != 0x2000
                || v.segments()[0] == 0x2002
                || (v.segments()[0] == 0x2001 && matches!(v.segments()[1], 0 | 2 | 0xdb8))
                || v.is_loopback()
                || v.is_unspecified()
                || v.is_multicast()
                || (v.segments()[0] & 0xfe00 == 0xfc00)
                || (v.segments()[0] & 0xffc0 == 0xfe80)
                || v.to_ipv4_mapped().is_some()
        }
    };
    if denied {
        return Err("OAuth discovery may not reach private network addresses".into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn blocks_internal_and_metadata_addresses() {
        for ip in [
            "127.0.0.1",
            "10.0.0.2",
            "169.254.169.254",
            "100.100.100.200",
            "::1",
            "::ffff:127.0.0.1",
            "fc00::1",
        ] {
            assert!(require_public(ip.parse().unwrap()).is_err());
        }
        assert!(require_public("1.1.1.1".parse().unwrap()).is_ok());
    }
}
