# Crate TypeScript client

`@crate/client` is a source-first HTTP client generated from the Rust server's
actual Poem handlers and response enums. It is an adapter for the optional Crate
web backend, not a replacement for ATProto Lexicons or an independently writable
OpenAPI specification.

```ts
import { createCrateClient } from "@crate/client"

const api = createCrateClient()
const result = await api.GET("/api/v1/files", { params: { query: {} } })
if (result.error) throw new Error(result.error.message)
console.log(result.data.files)
```

The checked-in `src/schema.ts` needs no build step to import or typecheck. Its
types do not validate arbitrary JSON at runtime; requests are validated by Poem,
and response serialization uses the same Rust DTOs as the generated schema.
The Swift client additionally decodes responses into generated `Codable` values.
Browsers supply the mutation `Origin` automatically. Non-browser fetch transports
must send the configured backend's canonical origin as well as their own session;
the backend rejects mutation requests without an accepted origin.

Run `bun run generate:api` after Rust contract changes, and `bun run check:contracts`
to check drift. This package's pinned TypeScript 6 dependency supplies the AST API
required by OpenAPI code generation; root workspace checks use TypeScript 7.
`bun run check` runs those root project-reference checks, generated-client tests,
and the complete drift/Swift compilation check.

Never edit `openapi.json` or `src/schema.ts` directly. Binary request types are
generated as `Blob` so web uploads require no unsafe type assertion. Send the body
with `bodySerializer: (body) => body` and `Content-Type: application/octet-stream`;
the `mimeType` query parameter preserves the file's actual media type.
