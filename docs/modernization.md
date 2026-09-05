# Crate modernization

## Target

Crate is an ATProto-native file application. A trusted, permissioned PDS owns
records, blobs, and access control. Rust defines the storage models and HTTP
contract. The server derives OpenAPI from its actual typed handlers; TypeScript
and Swift consume generated clients. Astro owns the web pages and a cohesive
Preact island owns the interactive file browser.

The browser may use a same-origin OAuth backend. Its tokens and sessions are
private operational state, not user-profile records. The backend must not become
the only source of file semantics: published Lexicons describe the stored data.
There is no silent fallback from permissioned storage to public repositories.

## Work ownership

- Protocol: `packages/protocol`, root `lexicons`, generated TypeScript/Swift
  clients, and deterministic contract generation.
- Server: `packages/server`, Rust OAuth/PDS access, file operations, responses,
  and server container.
- Web: `packages/web`, Astro/Preact, client state, interactions, and web container.
- Integration: root tooling, deployment, shared documentation, and verification.

Work is developed in separate Jujutsu workspaces. Commits represent one concept;
integration preserves their descriptions and orders prerequisites before callers.
Generated files are committed with their corresponding contract change.

## Acceptance checklist

An unchecked item is incomplete, not waived. Check items only with evidence.

### Protocol and server

- [ ] Rust server replaces Express and the Node OAuth runtime.
- [ ] Root `lexicons/network/crate` layout follows the personal site's convention.
- [ ] Rust records generate valid Lexicons without a separately maintained schema.
- [ ] Rust handler responses generate OpenAPI, TypeScript, and Swift contracts.
- [ ] Regeneration is deterministic and drift checks detect incompatible changes.
- [ ] TypeScript clients use source exports; clean typechecking needs no type build.
- [ ] Swift generated client compiles and exercises the response contract.
- [ ] Required permissioned context is passed to actual PDS endpoints.
- [ ] File identity, revision CID, blob CID, and parent identity remain distinct.
- [ ] Record boundaries reject malformed names, dates, sizes, references, and blobs.
- [ ] Creation, empty files, upload, rename, duplicate, and download work.
- [ ] Mutations have explicit duplicate-name and concurrent-write behavior.
- [ ] Trash, restore, version retention, and folder mutation behavior are tested.
- [ ] Reads avoid per-child full-collection scans and derived state is refreshable.
- [ ] Content responses enforce safe browser headers and bounded resource usage.
- [ ] Authentication restores, expires, logs out, and preserves transient failures.
- [ ] OAuth persistence has explicit concurrency and deployment constraints.

### Web

- [ ] Astro replaces the manual Preact page router and Vite entry point.
- [ ] Shared explorer interactions work in both grid and list views.
- [ ] Cache keys include account/storage context and mutations invalidate correctly.
- [ ] Session restoration, account changes, request cancellation, and logout are tested.
- [ ] Visible search, sort, file operations, and error states reflect real behavior.
- [ ] Fake 2FA, profile database, community, billing, and other placeholder UI are removed.
- [ ] Marketing and privacy text describe actual behavior without invented guarantees.
- [ ] Obsolete crypto, pinning types, Filecoin declarations, dead assets, and dependencies are removed.

### Tooling, deployment, and verification

- [ ] Root TypeScript project references and Astro-specific checking both run.
- [ ] Bun runs top-level `dev:web` and `dev:server` in parallel on `127.0.0.1`.
- [ ] Bacon rebuilds/restarts the Rust server.
- [ ] Format, lint, typecheck, Rust checks, unit/contract tests, and production builds pass.
- [ ] Docker/Kubernetes routing, binding, persistence, and configuration agree.
- [ ] Deployment-specific credentials are not committed; examples remain usable.
- [ ] Browser verification covers login and meaningful file interactions.
- [ ] Real PDS sign-in is performed by the user; existing records are not silently migrated or deleted.
- [ ] Final history is reviewable, single-concept, and all work is integrated.

## Verification boundaries

Do not publish Lexicons, change DNS, deploy services, migrate real accounts, or
modify existing PDS files implicitly. Use isolated test data and ask the user to
sign in for authenticated browser verification. An unsupported PDS or SDK is a
reported capability gap, not permission to weaken the storage model.
