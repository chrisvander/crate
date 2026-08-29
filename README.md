<div align="center">
  <img src="https://github.com/Crate-Network/crate/blob/main/mac-icon.png?raw=true" alt="Crate Logo" width="300"/>
  <h1>Crate</h1>
</div>

Crate is a web application backed by ATProto OAuth, repository records, and blobs.

## Development

Install Bun 1.3.13 and Node.js 22 or newer, then run:

```sh
bun install
bun run dev
```

The top-level command runs `dev:web` and `dev:server` in parallel. Open
`http://127.0.0.1:5173`; the API and OAuth callback listen on
`http://127.0.0.1:3030`.

Bun installs, builds, watches, tests, and orchestrates the workspace. The
server bundle runs on Node because the official `@atproto/oauth-client-node`
runtime depends on Node Web APIs that Bun 1.3.13 does not yet implement.
