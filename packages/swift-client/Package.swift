// swift-tools-version: 6.1
import PackageDescription

let package = Package(
    name: "CrateClient",
    platforms: [.macOS(.v13), .iOS(.v16)],
    products: [.library(name: "CrateClient", targets: ["CrateClient"])],
    dependencies: [
        .package(url: "https://github.com/apple/swift-openapi-generator", exact: "1.13.1"),
        .package(url: "https://github.com/apple/swift-openapi-runtime", exact: "1.12.1"),
        .package(url: "https://github.com/apple/swift-openapi-urlsession", exact: "1.3.1"),
    ],
    targets: [
        .target(
            name: "CrateClient",
            dependencies: [
                .product(name: "OpenAPIRuntime", package: "swift-openapi-runtime"),
                .product(name: "OpenAPIURLSession", package: "swift-openapi-urlsession"),
            ],
            exclude: ["openapi.json", "openapi-generator-config.yaml"]
        ),
        .testTarget(name: "CrateClientTests", dependencies: ["CrateClient"]),
    ]
)
