# Crate protocol

Rust is the source of truth for persisted records and the web API contract.
`records.rs` derives ATProto Lexicons using Jacquard. `files.rs`, `requests.rs`, and
`session.rs` derive Poem request parsing, response serialization, and OpenAPI
schemas. The server's actual handler response enums define status/body pairs.

Generated Lexicons live under root `lexicons/network/crate`, following the NSID
directory structure. They are local artifacts; generating them does not publish
records, configure DNS, or change a PDS. The space schema is an explicit alpha
extension and must be supported by the PDS. There is no public-repository fallback.

## Identity and ownership

A personal drive is `at://{did}/space/network.crate.drive/self`. Its authority and
author are the signed-in DID. The space owner controls access. The space must use
personal membership and permit authorized applications to interoperate.

File identity is a stable TID record key, scoped to that drive. A file URI is
`{spaceUri}/{authorDid}/network.crate.file/{id}`. A record CID is a revision, and a
blob CID identifies bytes. Neither CID is the stable file ID.

`parentId` points to a stable directory ID in the same drive. It is omitted for
root entries. Directories have `isDirectory: true` and no blob; files have a modern
typed blob reference and `isDirectory: false`. The HTTP DTO exposes `kind` and
derived byte size without duplicating those fields in persisted records.

Names contain no separators, controls, empty/whitespace-only values, `.` or `..`.
They are at most 255 Unicode scalar values and 1024 UTF-8 bytes. Names are
case-sensitive. Clients must not normalize or sanitize a submitted name silently.

## Atomic changes and conflict detection

The current Spaces transaction API does not expose `swapRecord`. Crate uses two
small shared record conventions inside a single `com.atproto.space.applyWrites`
transaction, relying on its atomic commit and create-if-absent semantics:

- `network.crate.fileVersion`: immutable full old-head snapshot, keyed
  `{fileId}.{oldRecordCid}`. A successful head mutation must first create this
  snapshot in the same transaction. Another mutation from the same revision
  cannot create the same snapshot, so the whole transaction fails.
- `network.crate.fileName`: filename uniqueness claim, keyed by lowercase SHA-256
  of the compact UTF-8 JSON array `[parentId-or-null,name]`, without a final newline.
  Unicode is encoded directly, not ASCII-escaped. `name_claim_key` is the Rust
  reference implementation. A create, rename, or restore claims the destination
  name in the same transaction; a rename or trash releases the old claim in that
  transaction.

All interoperable writers must follow these conventions. A raw PDS writer can
violate them; the PDS validates records and transaction preconditions, not the
Crate application's cross-record invariants. Do not represent this as protection
against a malicious authorized client.

Restore reads an immutable snapshot and performs a new guarded head update. It
does not delete or overwrite the snapshot. Trash sets `trashedAt`; it is not
permanent deletion. No client should garbage-collect version records or their
blobs without an explicit retention design.

The schema permits blobs up to 1 GiB. The backend's configured upload limit and
the PDS's own policy may be stricter. Clients must treat upload-limit errors as
errors, never truncate bytes. Private blob reads go through the space API.

## HTTP adapter

The optional server owns browser OAuth sessions and proxies operations to the
authenticated personal drive. Native direct-PDS clients do not need that server.
Renaming uses `PUT /api/v1/files/{id}` with the new `name` and expected `revision`.
Moving existing entries is deliberately unsupported: the alpha transaction API
cannot enforce directory-cycle invariants across concurrent moves. Creation and
duplication can target an existing parent; they create a new stable file ID.
Optional response fields are omitted,
never advertised as nullable when the OpenAPI schema cannot guarantee that.

The same Rust contract generates TypeScript via `openapi-typescript` and Swift via
Apple's `swift-openapi-generator`. Generated code is checked in, consumed as
source, and checked for drift. This gives compile-time request/response coverage,
not a proof that middleware or an arbitrary external server honors the contract.

## Verification

`cargo test -p crate-protocol` verifies serialized records against their derived
Lexicons, API serializer parity, mutation input requirements, and record boundary
rules. Root contract checks regenerate every Lexicon, the real server OpenAPI,
and both clients into temporary locations before comparing with checked-in output.
Swift tests compile the generated client and reject malformed response fixtures.
