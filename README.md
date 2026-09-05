<div align="center">
  <img src="https://github.com/Crate-Network/crate/blob/main/mac-icon.png?raw=true" alt="Crate Logo" width="300"/>
  <h1>Crate</h1>
</div>

Crate is an ATProto-native file application. A permissioned PDS stores file
records, version history, and blobs. Astro and Preact provide the web client;
a Rust/Poem companion handles browser OAuth and the typed HTTP API.

## Development

Install Bun 1.3.13, Node.js 22.12 or newer (for Astro), and Rust 1.95 or newer.
Install the pinned Rust development watcher, then start both services:

```sh
cargo install --locked bacon --version 3.25.0
bun install
bun run dev
```

The top-level command uses Bun's parallel script runner for `dev:web` and
`dev:server`. Open [Crate](http://127.0.0.1:5173). The API and OAuth callback listen
on `127.0.0.1:3030`; Bacon rebuilds and restarts Rust when its source changes.
Use `127.0.0.1`, not `localhost`, so OAuth redirect origins and cookies agree.

Sign in with your own ATProto handle and approve access on your PDS. The PDS must
implement the permissioned Spaces API described in
[the protocol documentation](packages/protocol/README.md). Crate does not fall
back to public repository storage. Existing legacy records are not migrated or
deleted automatically. Authentication tests never require sharing a password.

Optional local configuration is listed in [.env.example](.env.example). Bun loads
root `.env` when running these scripts; direct `cargo run` uses the process
environment. Keep the OAuth data directory private and persistent. It contains
credentials and browser sessions, not the authoritative file database.

## Contract and clients

Rust record definitions generate root `lexicons/network/crate`. Actual Poem
handlers generate OpenAPI and the TypeScript and Swift clients:

```sh
bun run generate:api
bun run check:contracts
```

Full contract generation/checking requires Swift 6.1 or newer. Generators and
their dependencies are pinned. Generated clients are checked in as source, so
web builds and root TypeScript checks do not require prebuilding package types.
The running Rust server exposes its API documentation at
[API docs](http://127.0.0.1:3030/docs).

## Verification and Jujutsu

```sh
bun run check
bun run build
jj status
jj diff
jj describe -m 'Describe one completed concept'
jj new
```

Checks are explicit and do not block commits through hooks. `typecheck` invokes
TypeScript 7 against root `tsconfig.json` and its project references, then checks
Astro templates. Bun's isolated linker keeps Astro's legacy TypeScript API peer
separate from the root compiler. Oxfmt handles supported files; Prettier is used
only for `.astro`, which Oxfmt does not yet support.

Keep authored files below 400 lines. Tests and generated contracts/SDKs are
exempt; `bun run check:files` enforces this boundary. Keep Jujutsu changes small
and single-concept. No publishing or deployment is part of the local workflow.

Kubernetes has been removed. Container definitions remain for the web gateway
and Rust companion; future infrastructure provisioning is a separate decision.
