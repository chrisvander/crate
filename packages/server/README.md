# Crate Server

The Rust/Poem server is the browser OAuth companion and safe download layer. File records, versions, filename reservations and blob references live in the user's permissioned ATProto Space, not in a server-owned user database. Native clients use the same generated Lexicons and atomic write protocol directly.

## Setup

Run `just dev` from the repository root for the parallel web and Bacon/Rust processes. Defaults are `127.0.0.1:3030` for the API and `127.0.0.1:5173` for the web app. `/health`, `/docs` and `/openapi.json` are public. API cookie guards and response variants generate the OpenAPI document; the schema is not handwritten.

Configuration: `CRATE_SERVER_HOST`, `PORT`, `CRATE_SERVER_URL`, `CRATE_WEB_URL`, `CRATE_DATA_DIR`, and `CRATE_MAX_UPLOAD_BYTES`. URL values must be clean HTTPS origins, except HTTP on `127.0.0.1`. The production reverse proxy must expose `/oauth-client-metadata.json`, `/oauth/*`, and `/api/v1/*` under the configured API origin and preserve the browser Origin header. Mutating requests require the exact web/API Origin; the browser uses same-origin proxying instead of cross-origin CORS.

Persist `CRATE_DATA_DIR` (default `.crate-data`): its owner-only SQLite database contains the OAuth signing key, short-lived authorization state, expiring browser sessions and OAuth/DPoP secrets. Treat it as secret material. A filesystem lock prevents two processes sharing the refresh-token store; this implementation is a single server instance, not a horizontally replicated OAuth service. Logout revokes and clears the shared OAuth session for that account; other browser sessions for the account must sign in again.

## Private storage boundary

This targets the current [ATProto permissioned-data proposal](https://github.com/bluesky-social/proposals/tree/main/0016-permissioned-data) and its reference implementation. The personal space is `at://{did}/space/network.crate.drive/self`, with an explicit member-list policy and open client access for independent native clients. Each authenticated request checks that policy. The first mutation creates the space; reads do not create anything. A PDS without the required APIs or OAuth scopes fails explicitly. There is no public repository fallback.

Spaces alpha has no `swapRecord`. Crate's cooperative-writer protocol atomically creates an immutable prior-revision snapshot before updating the file head, and reserves each parent/name pair with an atomic create. Reference implementation inspection confirmed transaction rollback and create-collision behavior; local tests verify the assumed atomic contract. A real target PDS must still be exercised before claiming interoperability. Authorized raw PDS writes can bypass cooperative application invariants.

V1 metadata editing is rename-only. Directory trash hides descendants without rewriting them; restoring the directory reveals them, including a child concurrently created before the trash operation became visible. File IDs stay stable, blob CIDs and record revision CIDs remain distinct, version restores create a new revision, and filename collisions never silently overwrite another file. Directory size is not a recursive total. Permanent deletion is not exposed.

## Transfer and OAuth limits

Uploads and downloads are **bounded buffers**, not end-to-end streams: Atrium's current transport owns byte vectors. The default per-file limit is 100 MiB and the configurable ceiling is 1 GiB. Four request slots are held until response bodies drain, including slow downloads; health checks bypass this limit. Transfers have a five-minute deadline; JSON reads have ten seconds. JSON bodies are limited to 1 MiB and Spaces batches to 200 writes / 1,000,000 encoded bytes. The browser companion reads up to 10,000 records per collection and fails explicitly above that ceiling; it never presents a partial listing as complete. Large recursive copies fail atomically rather than leaving partial trees. Single byte ranges and matching `If-Range` ETags are supported after full-blob integrity verification.

Downloads always use an attachment disposition, `application/octet-stream`, no-store, nosniff and sandbox CSP; active HTML/SVG cannot execute with the application's origin. Upload and download bytes must match the PDS's SHA-256 blob CID and size. Discovery and PDS requests reject redirects, non-HTTPS endpoints, environment proxies and internal network addresses.

Atrium owns OAuth PKCE, PAR, DPoP, issuer verification and token refresh. Its current release panics on some failed authorization/code-exchange branches; only those SDK futures are contained and returned as explicit errors. Structured `invalid_grant` refresh failures clear the session, while transient discovery/network failures retain it. Observed terminal errors are bounded and expire. This does not claim a completed live OAuth/storage test: sign in with a Spaces-capable PDS and verify the actual create/upload/rename/version/trash/restore flow.
