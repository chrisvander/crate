import Foundation
import OpenAPIURLSession

/// Creates the generated API client. Authentication is owned by the calling app.
public func makeCrateClient(serverURL: URL, session: URLSession = .shared) throws -> Client {
    Client(
        serverURL: serverURL,
        transport: URLSessionTransport(configuration: .init(session: session)),
        middlewares: [try ServerOrigin(serverURL: serverURL)]
    )
}
