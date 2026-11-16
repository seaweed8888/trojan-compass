// Copy into the iOS target alongside CompassModels.swift, or generate a full client
// from openapi.yaml. This scaffold intentionally contains no UI or automatic retry.
import Foundation

struct APIHTTPFailure: Error, Sendable {
    let statusCode: Int
    let body: APIErrorEnvelope?
    let retryAfter: String?
    let requestId: String?
}
enum TransportIssue: Error, Sendable {
    case invalidBaseURL, invalidPath, invalidResponse, unexpectedNotModified
    case invalidTextMessage, invalidImage
}
enum APIResult<Value: Sendable>: Sendable {
    case value(Value, etag: String?)
    case notModified
}

actor CompassAPIClient {
    private let baseURL: URL
    private let session: URLSession
    private struct CachedResponse { let data: Data; let etag: String? }
    // Only static GET responses are cached. The full URL includes snapshot and filters.
    private var cache: [URL: CachedResponse] = [:]

    init(baseURL: URL, allowHTTPForDevelopment: Bool = false, session: URLSession? = nil) throws {
        guard baseURL.host != nil,
              baseURL.query == nil, baseURL.fragment == nil,
              baseURL.user == nil, baseURL.password == nil,
              baseURL.scheme == "https" || (allowHTTPForDevelopment && baseURL.scheme == "http")
        else { throw TransportIssue.invalidBaseURL }
        self.baseURL = baseURL
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 15
        config.timeoutIntervalForResource = 90
        self.session = session ?? URLSession(configuration: config)
    }

    func get<Value: Decodable & Sendable>(
        _ type: Value.Type, path: [String], query: [URLQueryItem] = [], etag: String? = nil
    ) async throws -> APIResult<Value> {
        try await perform(type, method: "GET", path: path, query: query,
                          body: nil, contentType: nil, timeout: 15, etag: etag)
    }

    func post<Body: Encodable & Sendable, Value: Decodable & Sendable>(
        _ type: Value.Type, path: [String], body: Body, timeout: TimeInterval = 15
    ) async throws -> Value {
        let result = try await perform(type, method: "POST", path: path, query: [],
                                       body: JSONEncoder().encode(body),
                                       contentType: "application/json", timeout: timeout, etag: nil)
        switch result {
        case .value(let response, _): return response
        case .notModified: throw TransportIssue.unexpectedNotModified
        }
    }

    func calculateRoute(_ request: RouteRequest) async throws -> RouteResponse {
        try await post(RouteResponse.self, path: ["routes"], body: request)
    }
    func chat(_ request: ChatPayload) async throws -> ChatResponse {
        guard let message = request.message, !message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else { throw TransportIssue.invalidTextMessage }
        return try await post(ChatResponse.self, path: ["chat"], body: request, timeout: 60)
    }
    func chatWithImage(_ request: ChatPayload, image: Data, mimeType: String) async throws -> ChatResponse {
        guard !image.isEmpty, image.count <= 5 * 1024 * 1024,
              ["image/jpeg", "image/png"].contains(mimeType)
        else { throw TransportIssue.invalidImage }
        // The caller also checks/reduces decoded pixel dimensions before upload.
        let boundary = "Compass-" + UUID().uuidString
        let ext = mimeType == "image/png" ? "png" : "jpg"
        var data = Data()
        func append(_ string: String) { data.append(Data(string.utf8)) }
        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"request\"\r\n")
        append("Content-Type: application/json\r\n\r\n")
        data.append(try JSONEncoder().encode(request))
        append("\r\n--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"image\"; filename=\"upload.\(ext)\"\r\n")
        append("Content-Type: \(mimeType)\r\n\r\n")
        data.append(image)
        append("\r\n--\(boundary)--\r\n")
        let result = try await perform(ChatResponse.self, method: "POST", path: ["chat"],
            query: [], body: data, contentType: "multipart/form-data; boundary=\(boundary)", timeout: 60, etag: nil)
        switch result {
        case .value(let response, _): return response
        case .notModified: throw TransportIssue.unexpectedNotModified
        }
    }

    private func perform<Value: Decodable & Sendable>(
        _ type: Value.Type, method: String, path: [String], query: [URLQueryItem],
        body: Data?, contentType: String?, timeout: TimeInterval, etag: String?
    ) async throws -> APIResult<Value> {
        var url = baseURL
        for part in path {
            guard !part.isEmpty,
                  part.range(of: #"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$"#, options: .regularExpression) != nil,
                  part != ".", part != ".."
            else { throw TransportIssue.invalidPath }
            url.appendPathComponent(part)
        }
        guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        else { throw TransportIssue.invalidPath }
        if !query.isEmpty { components.queryItems = query }
        guard let resolved = components.url else { throw TransportIssue.invalidPath }
        var request = URLRequest(url: resolved)
        request.httpMethod = method
        request.httpBody = body
        request.timeoutInterval = timeout
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Request-ID")
        if let contentType { request.setValue(contentType, forHTTPHeaderField: "Content-Type") }
        if let tag = etag ?? (method == "GET" ? cache[resolved]?.etag : nil) {
            request.setValue(tag, forHTTPHeaderField: "If-None-Match")
        }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw TransportIssue.invalidResponse }
        if http.statusCode == 304 {
            guard let cached = cache[resolved] else { return .notModified }
            return .value(try JSONDecoder().decode(type, from: cached.data), etag: cached.etag)
        }
        guard (200..<300).contains(http.statusCode) else {
            throw APIHTTPFailure(statusCode: http.statusCode,
                body: try? JSONDecoder().decode(APIErrorEnvelope.self, from: data),
                retryAfter: http.value(forHTTPHeaderField: "Retry-After"),
                requestId: http.value(forHTTPHeaderField: "X-Request-ID"))
        }
        let decoded = try JSONDecoder().decode(type, from: data)
        if method == "GET" {
            if cache.count >= 128 { cache.removeAll() }
            cache[resolved] = CachedResponse(data: data, etag: http.value(forHTTPHeaderField: "ETag"))
        }
        return .value(decoded, etag: http.value(forHTTPHeaderField: "ETag"))
    }
}
