<div align="center">
  <img src="https://github.com/chrisvander/crate/blob/main/icon/exports/Crate-iOS-Default-1024x1024%401x.png" alt="Crate Logo" width="300"/>
  <h1>Crate</h1>
</div>

Crate is an ATProto-native file application. A permissioned PDS stores file
records, version history, and blobs. Astro and Preact provide the web client;
a Rust/Poem companion handles browser OAuth and the typed HTTP API.

## Development

Install Bun 1.3.13, Node.js 22.12 or newer (for Astro), and Rust 1.95 or newer. Install the pinned Rust development watcher, then start both services:

```sh
cargo install --locked bacon --version 3.25.0
bun install
bun run dev
```

Sign in with your own ATProto handle and approve access on your PDS. The PDS must implement the permissioned Spaces API described in [the protocol documentation](packages/protocol/README.md). 

Optional local configuration is listed in [.env.example](.env.example). Bun loads root `.env` when running these scripts; direct `cargo run` uses the process environment. Keep the OAuth data directory private and persistent. It contains credentials and browser sessions, not the authoritative file database.

## Contract and clients

Rust record definitions generate root `lexicons/network/crate`. Actual Poem handlers generate OpenAPI and the TypeScript and Swift clients:

```sh
bun run generate:api
bun run check:contracts
```

Full contract generation/checking requires Swift 6.1 or newer. Generators and their dependencies are pinned. Generated clients are checked in as source, so web builds and root TypeScript checks do not require prebuilding package types. The running Rust server exposes its API documentation at [API docs](http://127.0.0.1:3030/docs).

## Verification and Jujutsu

```sh
bun run check
bun run build
jj status
jj diff
jj describe -m 'Describe one completed concept'
jj new
```

With the stack running, `bun run test:browser` checks anonymous behavior and
synthetic-account layout and interactions without accessing a real PDS.
Install its Chromium browser with `bunx playwright install chromium` if needed.
The authenticated lifecycle is opt-in and requires you to sign in manually:

```sh
CRATE_LIVE_PDS=1 bun run test:browser --grep 'user-authorized private PDS' --headed --workers=1
```
