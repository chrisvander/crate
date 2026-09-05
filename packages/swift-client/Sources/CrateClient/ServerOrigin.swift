import Foundation
import HTTPTypes
import OpenAPIRuntime

public enum CrateClientConfigurationError: Error {
    case invalidServerURL
}

/// Non-browser transports must satisfy the same origin check as browser requests.
struct ServerOrigin: ClientMiddleware {
    let value: String

    init(serverURL: URL) throws {
        guard var parts = URLComponents(url: serverURL, resolvingAgainstBaseURL: false),
            let scheme = parts.scheme?.lowercased(), ["http", "https"].contains(scheme),
            let host = parts.host, !host.isEmpty,
            parts.user == nil, parts.password == nil
        else { throw CrateClientConfigurationError.invalidServerURL }
        parts.scheme = scheme
        parts.host = host.lowercased()
        parts.path = ""
        parts.query = nil
        parts.fragment = nil
        if parts.port == (scheme == "https" ? 443 : 80) { parts.port = nil }
        guard let origin = parts.string else { throw CrateClientConfigurationError.invalidServerURL }
        value = origin
    }

    func intercept(
        _ request: HTTPRequest,
        body: HTTPBody?,
        baseURL: URL,
        operationID: String,
        next: @Sendable (HTTPRequest, HTTPBody?, URL) async throws -> (HTTPResponse, HTTPBody?)
    ) async throws -> (HTTPResponse, HTTPBody?) {
        var request = request
        if [.post, .put, .patch, .delete].contains(request.method) {
            request.headerFields[.origin] = value
        }
        return try await next(request, body, baseURL)
    }
}
