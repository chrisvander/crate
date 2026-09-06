# Crate modernization

## Target

Crate is an ATProto-native file application. A trusted, permissioned PDS owns
records, blobs, and access control. Rust defines the storage models and HTTP
contract. The server derives OpenAPI from its actual typed handlers; TypeScript
and Swift consume generated clients. Astro owns the web pages and a cohesive
Preact island owns the interactive file browser. The migration must preserve the
original page layout and visual styling, not redesign the application.

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
- [ ] The PDS can discover the published Crate Space declaration during OAuth consent.
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
- [x] Original login, landing, explorer, inspector, and account layouts are preserved.
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

## Verified on 2026-09-06: Tailwind restoration

Tailwind CSS 4.3.3 and its Vite plugin replace the handwritten component styling.
Eight page/component stylesheets were removed; the shared CSS-first theme keeps
the existing palette, typography, and native control defaults. There is no
PostCSS configuration or Autoprefixer dependency. Vite retains its own transitive
PostCSS dependency, unrelated to the Tailwind integration.

The full repository check passes: 81 JavaScript, 41 Rust, and four Swift tests,
plus formatting, lint, root-reference typechecking, file sizes, and contract drift.
The production web build passes. Eleven browser checks pass in both development
and production previews, including dark controls and portal popover centering.
All 24 captured desktop/mobile, light/dark views are pixel-identical to the
pre-Tailwind revision `3ba1e2e8`; 496 measured elements retain their geometry and
painted colors. Comparisons use synthetic accounts and do not access a real PDS.
Live sign-in and namespace setup remain deferred under the boundaries below.

## Verified on 2026-09-05

`bun install --frozen-lockfile` and `bun run check` pass from the main checkout:
81 JavaScript tests, 41 Rust tests, deterministic Lexicon/OpenAPI/SDK drift checks,
and four Swift tests. TypeScript 7 checks source-only root references; Astro reports
zero errors and warnings, with two dependency deprecation hints in query tests.
The Swift generator emits upstream unused-public-import warnings in generated files.

Both production builds pass. Nine Chromium tests cover hydration, protected routes,
typed proxy errors, retryable login failures, original layout geometry, selection,
search, grid/list switching, inspector controls, and synthetic-account logout.
The opt-in live PDS lifecycle remains skipped, not counted as a passing test.
Both listeners bind `127.0.0.1`; the proxied health endpoint responds successfully.
The running server's OpenAPI is semantically identical to the generated contract.
Bacon restarted successfully after a source change. The largest authored file is
254 lines. The linear implementation series contains 127 commits since the
login-only baseline; each changes no more than six files. This evidence update
follows them as a separate documentation commit.

Original-revision screenshots were compared with the restored UI using synthetic
accounts and files at desktop and mobile widths, including dark mode. The original
shell, login card, landing artwork, file toolbar/table/grid/inspector, and settings
sidebar are restored. Real ATProto identity and controls remain; placeholder
security/billing pages, clipped filenames, broken selection, and mobile overflow
were not reinstated. Layout assertions run in the regular browser suite.

Both container images build successfully. All nine non-live browser checks pass
against the final restored web image and the updated OAuth server image on an
isolated loopback port. No real PDS requests are made by that suite. Earlier
container lifecycle checks also verified that the API exposes the generated
OpenAPI contract, runs as UID 10001, and creates its data directory with mode 700
and SQLite database with mode 600. The volume survives server replacement. Nginx
refreshes a changed backend IP without restarting, and the server's default stop
signal reaches its graceful handler (observed clean exit in 130 ms).

Host disk exhaustion blocked checkout updates while Podman reported overlay/writeback
errors. Only task-owned rebuildable caches and a failed build container were removed; flushing the VM's
filesystem cleared the stale error state without resetting or restarting the VM.
The Rust image build now discards compiler output before committing its build layer.
Nested environment files and browser artifacts are excluded from image contexts.

The user's live sign-in attempt reached the Spaces alpha provider, which rejected
consent with `invalid_scope`: it could not retrieve Space declarations. Public
authoritative DNS had no TXT record at `_lexicon.crate.network`. The local generated
declaration also lacked the alpha validator's required `name` and `key` metadata;
the Rust generator now includes both, with a regression test. Callback handling
now distinguishes bound provider rejection from malformed requests, consumes only
the matching pending login, and never reflects arbitrary provider descriptions.
All four generated documents and their publication envelopes also passed the
unmodified official alpha validator pinned to commit
`7cefaccc5307db53d92cda364ff582a2efec0027`; negative controls missing `name` or `key`
were rejected. This validates local syntax, not remote discovery.

The interrupted browser run performed no file operations. Its diagnostic artifact
was removed. Manual sign-in observation now reports provider rejection promptly
without leaving a locator that logs callback URLs on cancellation. Live mode also
disables Playwright's separate failure-page snapshot capture; an intentionally
failing synthetic-provider test verified that neither its page contents nor its
callback-state marker appeared in the diagnostic artifact.

Approved tooling exception: Astro 7.3.1 retains esbuild 0.28.2 internally.
The user approved this framework-only dependency on 2026-09-05. Crate has no
direct esbuild dependency or build scripts using it.

Remaining acceptance boundaries:

- Public declaration discovery, successful OAuth, and live file interoperability
  remain unverified. The user confirmed control of `crate.network` and explicitly
  deferred DNS changes. Schema publication is also deferred; no PDS records or DNS
  entries were published. A later authorized setup requires a
  schema-publisher DID and publicly resolvable generated Lexicons before another
  user-driven sign-in attempt can complete.

Astro auto-backgrounds inside detected coding-agent environments. For foreground
verification here, `env -u CODEX_THREAD_ID bun run dev` disables only that detection;
ordinary shells use the unchanged `bun run dev` command.

## Verification boundaries

Do not publish Lexicons, change DNS, deploy services, migrate real accounts, or
modify existing PDS files implicitly. Use isolated test data and ask the user to
sign in for authenticated browser verification. An unsupported PDS or SDK is a
reported capability gap, not permission to weaken the storage model.
