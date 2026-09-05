#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = crate_server::config::Config::from_env()?;
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();
    let bind = config.bind;
    let state = crate_server::state::State::new(config)?;
    tracing::info!(%bind,"Crate server listening");
    poem::Server::new(poem::listener::TcpListener::bind(bind))
        .run_with_graceful_shutdown(
            crate_server::app::app(state),
            async {
                let _ = tokio::signal::ctrl_c().await;
            },
            Some(std::time::Duration::from_secs(10)),
        )
        .await?;
    Ok(())
}
