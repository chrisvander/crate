set dotenv-load := true
set positional-arguments := true

export PATH := justfile_directory() + "/node_modules/.bin:" + env("PATH")

# List available commands.
default:
    @just --list

# Install JavaScript dependencies from the lockfile.
install:
    bun install --frozen-lockfile

# Start the server and web client together.
[parallel]
dev: dev-server dev-web

dev-server:
    bacon --headless server

dev-web:
    bun run --filter @crate/web dev

[parallel]
build: build-server build-web

build-server:
    cargo build --release --locked -p crate-server

build-web:
    bun run --filter @crate/web build

# Run all generate operations
generate: generate-lexicons generate-api
publish: publish-lexicons

# Generate only the ATProto Lexicons from Rust.
generate-lexicons:
    cargo run --locked --quiet -p crate-protocol --bin export-lexicons -- lexicons

# Publish generated schemas with the signed-in Goat account (use create for first publication).
publish-lexicons operation="update": generate-lexicons
    #!/usr/bin/env bash
    set -euo pipefail
    case "$1" in create|update) ;; *) echo 'Expected create or update' >&2; exit 1 ;; esac
    command -v goat >/dev/null
    command -v jq >/dev/null
    record=$(mktemp)
    trap 'rm -f "$record"' EXIT
    for schema in lexicons/network/crate/*.json; do
        id=$(jq -er '.id' "$schema")
        jq '. + {"$type": "com.atproto.lexicon.schema"}' "$schema" > "$record"
        goat record "$1" --no-validate --rkey "$id" "$record"
    done

# Generate Lexicons, OpenAPI, and TypeScript/Swift clients.
generate-api:
    bun scripts/generate-api.ts

check-contracts:
    bun scripts/generate-api.ts --check

test:
    vitest run
    cargo test --workspace --locked

test-browser *args:
    playwright test "$@"

test-swift:
    swift test --package-path packages/swift-client

typecheck:
    bun node_modules/typescript/bin/tsc -b tsconfig.json
    bun run --filter @crate/web check:astro

format:
    oxfmt .
    cargo fmt --all
    bun run --filter @crate/web format:astro

format-check:
    oxfmt --check .
    cargo fmt --all --check
    bun run --filter @crate/web format:astro:check

lint:
    oxlint . --deny-warnings
    cargo clippy --workspace --all-targets --locked -- -D warnings

# Run the complete validation suite.
check: format-check lint typecheck test check-contracts

infra-preview:
    pulumi preview --cwd infra --stack prod

infra-up:
    pulumi up --cwd infra --stack prod
