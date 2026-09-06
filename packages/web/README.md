# Crate web client

Astro builds static pages; a Preact island owns the authenticated file explorer.
The Rust server handles OAuth and accesses the account's private ATProto Space.
The browser never needs a separate Crate profile, password, or storage subscription.

Run from the repository root:

- `bun run dev:web` serves Astro at `http://127.0.0.1:5173`.
- `bun run dev` starts the full web/server stack.
- `bun run build:web` writes static files to `dist/packages/web`.

The development proxy and Nginx production gateway forward API and OAuth routes
to the Rust server. Nginx expects the service name `server`. Authentication uses
same-origin cookies. A PDS without private Spaces support fails explicitly; there
is no public-repository fallback.

## Contracts and state

API request/response types come only from the generated `@crate/client` package.
Files have stable record IDs; revision CIDs are concurrency tokens, not cache keys.
TanStack Query keys include account DID and Space URI. Mutations invalidate all
related listings and history, session loss clears account data, and unmount aborts
in-flight requests. Preferences, selection, and breadcrumb state remain local.

The file page retains the original `Dropdown`, `PopoverMenu`, `RightClickMenu`,
`GridView`, `ListView`, and `FileInspector` components, adapted to the current API.
Menus and modal popovers use Preact portals into `document.body`. Keep their
translucency, positioning, outside-click dismissal, inline rename, 64px grid
icons, and the inspector's 300ms width/opacity transition when changing internals.
The inspector retains the original Name, Path, Size, Extension, and CID table,
including current-directory inspection when selection is empty. Its added
replace/version-history panel is removed; those backend APIs remain available.
Creation dialogs retain Done/Cancel and Escape dismissal. The Astro footer uses
the original copyright, breadcrumbs, and legal links.
Delete uses the existing backend deletion operation; there is no Trash view.

## Styling

Tailwind CSS 4 runs through the official `@tailwindcss/vite` plugin. Components
use utilities directly; `src/styles/base.css` contains the CSS-first theme,
font declarations, native element defaults, and shared primary/error utilities.
The theme preserves the existing light/dark colors and typography.

There is no PostCSS configuration, Tailwind PostCSS plugin, or Autoprefixer
dependency. Vite itself still includes PostCSS transitively; it is not configured
as Crate's styling pipeline. Follow the
[Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite)
when changing the build setup.

## Tooling exceptions

Astro's internal esbuild dependency is an approved framework-only exception.
Crate's own packages and build scripts must not depend directly on esbuild.

The repository's TypeScript 7 root-reference check covers TypeScript sources.
Astro's checker currently needs TypeScript's JavaScript compiler API, which the
native TypeScript 7 package does not expose. `check:astro` runs standard
`astro check` against the root tsconfig and its references. Bun's isolated linker
keeps TypeScript 6 as the checker's workspace-local peer dependency; the root
TypeScript 7 compiler is invoked explicitly and remains the primary typecheck.
See the [upstream support discussion](https://github.com/withastro/roadmap/discussions/1321).

Oxfmt handles TypeScript, CSS, and configuration. Its
[language support list](https://oxc.rs/docs/guide/usage/formatter/language-support)
does not include Astro. The narrow `format:astro` scripts use Prettier with the
official Astro plugin only for `.astro` files.
