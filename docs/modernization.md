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
Authored files stay below 400 lines; tests and machine-generated Lexicon, OpenAPI,
TypeScript, and Swift output are exempt. Generators own their output formatting.
Oxfmt formats supported files; Prettier's Astro plugin handles only `.astro`.
TypeScript 7 checks the root project-reference graph. Astro's language-server
checker uses an isolated legacy TypeScript API dependency for `.astro` files;
it does not select the application compiler or require built package types.

## Acceptance checklist

An unchecked item is incomplete, not waived. Check items only with evidence.

### Protocol and server

- [x] Rust server replaces Express and the Node OAuth runtime.
- [x] Root `lexicons/network/crate` layout follows the personal site's convention.
- [x] Rust records generate valid Lexicons without a separately maintained schema.
- [x] Rust handler responses generate OpenAPI, TypeScript, and Swift contracts.
- [x] Regeneration is deterministic and drift checks detect incompatible changes.
- [x] TypeScript clients use source exports; clean typechecking needs no type build.
- [x] Swift generated client compiles and exercises the response contract.
- [x] PDS adapters pass explicit permissioned context; live interoperability remains below.
- [x] File identity, revision CID, blob CID, and parent identity remain distinct.
- [x] Record boundaries reject malformed names, dates, sizes, references, and blobs.
- [ ] Creation, empty files, upload, rename, duplicate, and download work.
- [x] Mutations have explicit duplicate-name and concurrent-write behavior.
- [x] Trash, restore, version retention, and folder mutation behavior are tested.
- [x] Reads avoid per-child full-collection scans and derived state is refreshable.
- [x] Content responses enforce safe browser headers and bounded resource usage.
- [x] Authentication lifecycle and transient-failure behavior have local regression tests.
- [x] OAuth persistence has explicit concurrency and deployment constraints.

### Web

- [x] Astro replaces the manual Preact page router and Vite entry point.
- [x] Shared explorer interactions have regression tests for grid and list views.
- [x] Cache keys include account/storage context and mutations invalidate correctly.
- [x] Session restoration, account changes, request cancellation, and logout are tested.
- [x] Visible controls call real operations; authenticated browser verification remains below.
- [x] Fake 2FA, profile database, community, billing, and other placeholder UI are removed.
- [x] Marketing and privacy text describe actual behavior without invented guarantees.
- [x] Obsolete crypto, pinning contracts, dead assets, and dependencies are removed.

### Tooling, deployment, and verification

- [x] Root TypeScript project references and Astro-specific checking both run.
- [x] Bun runs top-level `dev:web` and `dev:server` in parallel on `127.0.0.1`.
- [x] Bacon rebuilds/restarts the Rust server.
- [x] Format, lint, typecheck, Rust checks, unit/contract tests, and production builds pass.
- [x] Local/container routing, binding, persistence, and configuration agree.
- [x] Kubernetes manifests and configuration are removed; Pulumi is out of scope.
- [x] The integrated history contains no deployment-specific credentials; examples remain usable.
- [ ] Browser verification covers login and meaningful file interactions.
- [ ] Real PDS sign-in is performed by the user; existing records are not silently migrated or deleted.
- [x] Final history is linear, single-concept, and all work is integrated into the main checkout.

## Verified on 2026-09-05

`bun install --frozen-lockfile` and `bun run check` pass from the main checkout:
67 JavaScript tests, 34 Rust tests, deterministic Lexicon/OpenAPI/SDK drift checks,
and four Swift tests. TypeScript 7 checks source-only root references; Astro reports
zero errors and warnings, with two dependency deprecation hints in query tests.
The Swift generator emits upstream unused-public-import warnings in generated files.

Both production builds pass. Four anonymous Chromium tests cover hydration,
protected routes, typed proxy errors, retryable login failures, and mobile layout.
Both listeners bind `127.0.0.1`; the proxied health endpoint responds successfully.
The running server's OpenAPI is semantically identical to the generated contract.
Bacon restarted successfully after a source change. The largest authored file is
254 lines. Commits change no more than six files.

Both container images build successfully. The same four anonymous browser checks
pass against the packaged Nginx/Rust stack. The container API exposes the generated
OpenAPI contract, runs as UID 10001, and creates its data directory with mode 700
and SQLite database with mode 600. The volume survives server replacement. Nginx
refreshes a changed backend IP without restarting, and the server's default stop
signal reaches its graceful handler (observed clean exit in 130 ms).

Host disk exhaustion blocked checkout updates while Podman reported overlay/writeback
errors. Only task-owned rebuildable caches and a failed build container were removed; flushing the VM's
filesystem cleared the stale error state without resetting or restarting the VM.
The Rust image build now discards compiler output before committing its build layer.
Nested environment files and browser artifacts are excluded from image contexts.

Remaining acceptance boundaries:

- The first headed PDS test timed out before reaching the file browser; no file
  operations ran. The next attempt requires the user's sign-in. The test now waits
  for persisted revisions before downloading and treats an incomplete manual sign-in
  as skipped, avoiding a failure-page snapshot on the PDS login screen. A skipped
  test is not evidence of live OAuth or file interoperability.
- Astro 7.3.1 retains esbuild 0.28.2 internally. Crate has no direct dependency or
  build scripts using it. Approval of this framework-only exception is still pending.

Astro auto-backgrounds inside detected coding-agent environments. For foreground
verification here, `env -u CODEX_THREAD_ID bun run dev` disables only that detection;
ordinary shells use the unchanged `bun run dev` command.

## Verification boundaries

Do not publish Lexicons, change DNS, deploy services, migrate real accounts, or
modify existing PDS files implicitly. Use isolated test data and ask the user to
sign in for authenticated browser verification. An unsupported PDS or SDK is a
reported capability gap, not permission to weaken the storage model.
