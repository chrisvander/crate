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
    permit: Option<OwnedSemaphorePermit>,
    deadline: Pin<Box<tokio::time::Sleep>>,
}

impl LimitedBody {
    pub fn wrap(body: poem::Body, permit: OwnedSemaphorePermit) -> poem::Body {
        poem::Body::from_async_read(Self {
            inner: Box::pin(body.into_async_read()),
            permit: Some(permit),
            deadline: Box::pin(tokio::time::sleep(std::time::Duration::from_secs(300))),
        })
    }
}

impl AsyncRead for LimitedBody {
    fn poll_read(
        mut self: Pin<&mut Self>,
        context: &mut Context<'_>,
        buffer: &mut ReadBuf<'_>,
    ) -> Poll<std::io::Result<()>> {
        use std::future::Future;
        if self.deadline.as_mut().poll(context).is_ready() {
            self.permit.take();
            return Poll::Ready(Err(std::io::Error::new(
                std::io::ErrorKind::TimedOut,
                "The response transfer timed out.",
            )));
        }
        self.inner.as_mut().poll_read(context, buffer)
    }
}
