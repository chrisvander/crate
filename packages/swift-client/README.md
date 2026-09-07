# Crate Swift client

The `CrateClient` Swift package contains Apple's generated OpenAPI client and
typed `Codable` request/response models. It targets iOS 16+ and macOS 13+.

```swift
import CrateClient
import Foundation

let client = try makeCrateClient(serverURL: URL(string: "http://127.0.0.1:3030")!)
let response = try await client.listFiles()
```

This client speaks to the optional Crate web backend. Native applications that
access a PDS directly must implement ATProto OAuth and the conventions in
`packages/protocol/README.md`; the generated HTTP client is not a native OAuth SDK.
The app owns its URLSession and authentication lifecycle. Do not copy web cookies
into another app as an authentication strategy.
The factory validates the server URL and sends its canonical `Origin` on mutations
to satisfy the backend's CSRF check. Creating the generated `Client` directly
requires equivalent middleware; a cookie alone does not authorize mutation requests.

`Sources/CrateClient/GeneratedSources` and its sibling `openapi.json` are generated
from the Rust server. Run root `just generate-api`, then `swift test
--package-path packages/swift-client`. The generator/runtime/transport versions
are pinned and dependency resolution is checked in.
