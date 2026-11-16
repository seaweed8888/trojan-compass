import XCTest
@testable import TrojanCompass

private final class HeldResponse: URLProtocol, @unchecked Sendable {
    static var heldPath = ""
    static var arrived: XCTestExpectation?
    static var pending: HeldResponse?
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        if request.url?.path == Self.heldPath {
            Self.pending = self; Self.arrived?.fulfill()
        } else { complete() }
    }
    override func stopLoading() {}
    func complete() {
        do {
            let path = request.url!.path
            let name = path == "/api/chat" ? "chat-focus-place"
                : path.hasSuffix("/scene") ? "scene-procedural"
                : path.contains("/floors/") ? "floor-1" : "building-law"
            var data = try Data(contentsOf: AppResources.root.appendingPathComponent("Fixtures/\(name).json"))
            if name == "building-law" {
                var response = try JSONSerialization.jsonObject(with: data) as! [String: Any]
                var building = response["building"] as! [String: Any]
                building["floors"] = Array((building["floors"] as! [[String: Any]]).prefix(1))
                response["building"] = building
                data = try JSONSerialization.data(withJSONObject: response)
            }
            client?.urlProtocol(self, didReceive: HTTPURLResponse(url: request.url!, statusCode: 200,
                httpVersion: nil, headerFields: ["Content-Type": "application/json"])!, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch { client?.urlProtocol(self, didFailWithError: error) }
    }
}

final class ChatStateTests: XCTestCase {
    @MainActor private func makeStore(holding path: String) throws -> CompassStore {
        HeldResponse.heldPath = path; HeldResponse.pending = nil
        HeldResponse.arrived = expectation(description: "Request reached \(path)")
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [HeldResponse.self]
        let client = try CompassAPIClient(baseURL: URL(string: "https://compass.test/api")!,
            session: URLSession(configuration: configuration))
        let store = CompassStore(client: client)
        store.source = .live; store.dataVersion = "contract-demo-v1"; store.buildingId = "LAW"
        store.liveBuilding = try AppResources.decode(BuildingResponse.self, "Fixtures/building-law.json")
        return store
    }

    @MainActor func testReturningToCampusDiscardsPendingChat() async throws {
        let store = try makeStore(holding: "/api/chat")
        store.chatDraft = "Show LAW 101"
        let task = Task { await store.sendChat() }
        await fulfillment(of: [HeldResponse.arrived!], timeout: 3)
        store.campus()
        HeldResponse.pending?.complete()
        await task.value
        XCTAssertNil(store.buildingId)
        XCTAssertNil(store.selectedPlace)
        XCTAssertFalse(store.chatLoading)
        XCTAssertNil(store.chatError)
        XCTAssertEqual(store.chatDraft, "Show LAW 101")
        XCTAssertEqual(store.conversation.count, 1)
    }

    @MainActor func testReturningToCampusDuringSceneStagingPreventsCommit() async throws {
        let store = try makeStore(holding: "/api/buildings/LAW/scene")
        let response = try AppResources.decode(ChatResponse.self, "Fixtures/chat-focus-place.json")
        let task = Task { try await store.applyActions(response.actions) }
        await fulfillment(of: [HeldResponse.arrived!], timeout: 3)
        store.campus()
        HeldResponse.pending?.complete()
        let committed = try await task.value
        XCTAssertFalse(committed)
        XCTAssertNil(store.buildingId)
        XCTAssertNil(store.liveBuilding)
        XCTAssertNil(store.selectedPlace)
        // An unchanged selection still accepts the same valid action.
        HeldResponse.heldPath = ""
        let current = try await store.applyActions(response.actions)
        XCTAssertTrue(current)
        XCTAssertEqual(store.selectedPlace?.id, "LAW-101")
    }

    @MainActor func testSharingUsesRouteStopAndPreferencesInsteadOfCurrentControls() throws {
        let data = try Data(contentsOf: AppResources.root.appendingPathComponent("Fixtures/route-success.json"))
        let response = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        var route = response["route"] as! [String: Any]
        route["via"] = route["origin"]; route["mode"] = "elevator"; route["stepFreeRequested"] = true
        let store = CompassStore()
        store.route = try JSONDecoder().decode(Route.self, from: JSONSerialization.data(withJSONObject: route))
        guard case .route(let from, let to, let mode, let via, let stepFree) = try LinkIntent.parse(store.shareURL)
        else { return XCTFail("Expected a route link") }
        XCTAssertEqual(from, store.route?.origin.placeId)
        XCTAssertEqual(to, store.route?.destination.placeId)
        XCTAssertEqual(mode, "elevator"); XCTAssertTrue(stepFree)
        XCTAssertEqual(via, from)
        XCTAssertThrowsError(try LinkIntent.parse(URL(string: "trojancompass://map?from=LAW-101&to=LAW-107&stepFree=bad")!))
    }
}
