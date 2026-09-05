import Foundation
import HTTPTypes
import OpenAPIRuntime
import Testing
@testable import CrateClient

@Test func mutationsSendTheValidatedServerOrigin() async throws {
    let url = URL(string: "http://127.0.0.1:3030/api?ignored=1#ignored")!
    let middleware = try ServerOrigin(serverURL: url)
    let request = HTTPRequest(method: .post, scheme: "http", authority: "127.0.0.1:3030", path: "/oauth/login")
    _ = try await middleware.intercept(request, body: nil, baseURL: url, operationID: "login") {
        request, _, baseURL in
        #expect(request.headerFields[.origin] == "http://127.0.0.1:3030")
        #expect(baseURL == url)
        return (HTTPResponse(status: .ok), nil)
    }
}

@Test func serverOriginsAreCanonicalAndRejectCredentials() throws {
    #expect(try ServerOrigin(serverURL: URL(string: "https://EXAMPLE.com:443/path")!).value == "https://example.com")
    #expect(try ServerOrigin(serverURL: URL(string: "http://[::1]:3030/path")!).value == "http://[::1]:3030")
    for value in ["file:///private/file", "https://user:password@example.com"] {
        #expect(throws: CrateClientConfigurationError.self) {
            try ServerOrigin(serverURL: URL(string: value)!)
        }
    }
}
