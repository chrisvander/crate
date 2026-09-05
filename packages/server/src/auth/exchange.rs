use crate::error::{ApiError, Result};
use std::future::Future;

// Atrium 0.1.7 panics on a failed code exchange and missing PAR. Contain only
// those SDK entrypoints until its error branches are released without todo!().
pub async fn complete<T: Send + 'static>(
    operation: impl Future<Output = atrium_oauth::Result<T>> + Send + 'static,
) -> Result<T> {
    tokio::spawn(operation)
        .await
        .map_err(|_| {
            ApiError::upstream("The OAuth provider could not complete the exchange. Restart login.")
        })?
        .map_err(|_| {
            ApiError::bad("OAuth could not complete. Verify your handle and restart login.")
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn sdk_exchange_panics_are_an_explicit_error() {
        let result = complete::<()>(async { panic!("simulated SDK exchange failure") }).await;
        assert!(matches!(result, Err(ApiError::BadGateway(_))));
    }
}
