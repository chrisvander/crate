<div align="center">
  <img src="https://github.com/chrisvander/crate/blob/main/icon/exports/Crate-iOS-Default-1024x1024%401x.png" alt="Crate Logo" width="300"/>
  <h1>Crate</h1>
</div>

Crate is an ATProto-native file application. A permissioned PDS stores file
records, version history, and blobs. Astro and Preact provide the web client;
a Rust/Poem companion handles browser OAuth and the typed HTTP API.

## Development

Install Just 1.43 or newer, Bun 1.3.13, Node.js 22.12 or newer (for Astro), and Rust 1.95 or newer. Install the pinned Rust development watcher, then start both services:

```sh
cargo install --locked bacon --version 3.25.0
just install
just dev
```

Sign in with your own ATProto handle and approve access on your PDS. The PDS must implement the permissioned Spaces API described in [the protocol documentation](packages/protocol/README.md).

Optional local configuration is listed in [.env.example](.env.example). Just loads root `.env` for its recipes; direct `cargo run` uses the process environment. Keep the OAuth data directory private and persistent. It contains credentials and browser sessions, not the authoritative file database.

Run `just` to list commands, including `just infra-preview` and `just infra-up`
for the production Pulumi stack (requires the Pulumi CLI and login).

## Contract and clients

Rust record definitions generate root `lexicons/network/crate`. Actual Poem handlers generate OpenAPI and the TypeScript and Swift clients:

```sh
just generate-lexicons  # Lexicons only
just generate-api
just check-contracts
```

Full contract generation/checking requires Swift 6.1 or newer. Generators and their dependencies are pinned. Generated clients are checked in as source, so web builds and root TypeScript checks do not require prebuilding package types. The running Rust server exposes its API documentation at [API docs](http://127.0.0.1:3030/docs).

## Verification and Jujutsu

```sh
just check
just build
jj status
jj diff
jj describe -m 'Describe one completed concept'
jj new
```

With the stack running, `just test-browser` checks anonymous behavior and
synthetic-account layout and interactions without accessing a real PDS.
Install its Chromium browser with `bunx playwright install chromium` if needed.
The authenticated lifecycle is opt-in and requires you to sign in manually:

```sh
CRATE_LIVE_PDS=1 just test-browser --grep 'user-authorized private PDS' --headed --workers=1
```
