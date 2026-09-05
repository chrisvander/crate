use std::{
    pin::Pin,
    task::{Context, Poll},
};
use tokio::{
    io::{AsyncRead, ReadBuf},
    sync::OwnedSemaphorePermit,
};

// Keep the request slot until its response has drained, including slow downloads.
pub struct LimitedBody {
    inner: Pin<Box<dyn AsyncRead + Send>>,
    _permit: OwnedSemaphorePermit,
}

impl LimitedBody {
    pub fn wrap(body: poem::Body, permit: OwnedSemaphorePermit) -> poem::Body {
        poem::Body::from_async_read(Self {
            inner: Box::pin(body.into_async_read()),
            _permit: permit,
        })
    }
}

impl AsyncRead for LimitedBody {
    fn poll_read(
        mut self: Pin<&mut Self>,
        context: &mut Context<'_>,
        buffer: &mut ReadBuf<'_>,
    ) -> Poll<std::io::Result<()>> {
        self.inner.as_mut().poll_read(context, buffer)
    }
}
