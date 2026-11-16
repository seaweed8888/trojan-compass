// Standalone checks for environments without XCTest/Xcode. See scripts/check-mobile.sh.
import Foundation

final class StubProtocol: URLProtocol, @unchecked Sendable {
    static var handler: ((URLRequest) throws -> (Int, [String: String], Data))?
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        do {
            let (code, headers, data) = try Self.handler!(request)
            let response = HTTPURLResponse(url: request.url!, statusCode: code, httpVersion: nil, headerFields: headers)!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data); client?.urlProtocolDidFinishLoading(self)
        } catch { client?.urlProtocol(self, didFailWithError: error) }
    }
    override func stopLoading() {}
}

@main struct StateChecks {
    @MainActor static func main() async throws {
        var checks = 0
        func check(_ value: Bool, _ message: String) throws {
            guard value else { throw CompassFailure.message("FAIL: " + message) }
            checks += 1
        }
        let store = CompassStore()
        try check(store.catalog?.interiors.count == 9, "all nine interiors loaded")
        for text in ["law 101", "LAW-101", "LAW101"] {
            try check(store.previewSuggestions(text).contains { $0.place?.id == "LAW-101" }, "room normalization: " + text)
        }
        try check(store.previewSuggestions("Medicine Crow").contains { $0.buildingId == "VKC" }, "Medicine Crow alias")
        try check(store.catalog?.locations.first { $0.name.contains("Michelson") }?.interiorId == nil, "Michelson never opens VKC")
        try await store.openBuilding("LAW")
        let place = store.places.first { $0.id == "LAW-101" }!
        store.selectedPlace = place; store.setFloor("2")
        try check(store.selectedPlace == nil, "floor clears stale selection")
        store.setEndpoint(SelectedLocation(place: place, source: .preview), field: .origin)
        store.setEndpoint(SelectedLocation(place: place, source: .preview), field: .destination)
        store.allFloors = true; store.startPicking(.destination); store.picking = nil
        try check(!store.allFloors && store.destination?.placeId == place.id, "cancel retains structured endpoint")
        store.editEndpoint("unknown", field: .origin)
        try check(store.origin == nil && store.destination?.placeId == place.id, "editing invalidates only one endpoint")
        store.origin = SelectedLocation(place: place, source: .preview)
        await store.calculateRoute()
        try check(store.route == nil && store.routeError != nil, "preview never fabricates route")
        store.chatDraft = "Find LAW 101"; await store.sendChat()
        try check(store.conversation.isEmpty && !store.chatDraft.isEmpty, "preview never fabricates reply or loses draft")
        store.stepFree = true; store.accessibilityChanged()
        try check(store.routeMode == "elevator" && store.previewSuggestions("LAW", field: .origin).isEmpty, "accessibility unknown is explicit")
        store.stepFree = false; store.accessibilityChanged()
        try check(store.routeMode == "elevator", "disabling accessibility retains elevator preference")
        var rejected = false
        do { try await store.openBuilding("UNKNOWN") } catch { rejected = true }
        try check(rejected && store.buildingId == "LAW", "failed building preserves committed map")
        let route = try AppResources.decode(RouteResponse.self, "Fixtures/route-success.json")
        store.stepFree = true
        rejected = false
        do { try store.validateRoute(route.route) } catch { rejected = true }
        try check(rejected && store.route == nil, "step-free route rejected")
        store.route = route.route; store.setTool(.directions); store.setTool(nil)
        try check(store.route != nil && store.origin == nil, "closing directions keeps route and clears manual marker")
        store.invalidateRoute()
        guard case .building(let building, let floor, _) = try LinkIntent.parse(URL(string: "trojancompass://map?building=LAW&floor=B")!) else { fatalError() }
        try check(building == "LAW" && floor == "0", "basement link")
        try check(!MapLayer.defaults.contains("exits") && !MapLayer.defaults.contains("accessible"), "layer defaults")
        let config = URLSessionConfiguration.ephemeral; config.protocolClasses = [StubProtocol.self]
        let api = try CompassAPIClient(baseURL: URL(string: "https://compass.test/api")!, session: URLSession(configuration: config))
        var requests = 0
        StubProtocol.handler = { request in
            requests += 1
            if requests == 1 { return (200, ["ETag": "v1"], Data(#"{"status":"ok","service":"test"}"#.utf8)) }
            guard request.value(forHTTPHeaderField: "If-None-Match") == "v1" else { throw CompassFailure.message("ETag missing") }
            return (304, [:], Data())
        }
        let _: APIResult<Health> = try await api.get(Health.self, path: ["health"])
        let result: APIResult<Health> = try await api.get(Health.self, path: ["health"])
        guard case .value(let health, _) = result else { fatalError("304 cache not restored") }
        try check(health.status == "ok" && requests == 2, "ETag 304 reuses matching response")
        StubProtocol.handler = { _ in (422, [:], Data(#"{"error":{"code":"NO_ROUTE","message":"No route","requestId":"test-request"}}"#.utf8)) }
        do { let _: APIResult<Health> = try await api.get(Health.self, path: ["missing"]); fatalError("Expected HTTP error") }
        catch let error as APIHTTPFailure { try check(error.statusCode == 422 && error.body?.error.code == "NO_ROUTE", "structured HTTP error") }
        do { let _: APIResult<Health> = try await api.get(Health.self, path: [".."]); fatalError("Unsafe path accepted") }
        catch is TransportIssue { checks += 1 }
        print("Passed \(checks) mobile state/transport checks.")
    }
}
