FROM rust:1.95-bookworm AS build
WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY packages/protocol packages/protocol
COPY packages/server packages/server
RUN cargo build --release --locked -p crate-server --bin crate-server

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
RUN useradd --system --uid 10001 --create-home crate && mkdir /var/lib/crate && chown crate:crate /var/lib/crate
COPY --from=build /build/target/release/crate-server /usr/local/bin/crate-server
USER crate
ENV CRATE_SERVER_HOST=0.0.0.0 PORT=3030 CRATE_DATA_DIR=/var/lib/crate
VOLUME ["/var/lib/crate"]
EXPOSE 3030
STOPSIGNAL SIGINT
CMD ["crate-server"]
