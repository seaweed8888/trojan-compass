import XCTest
@testable import TrojanCompass

final class ReplicaTests: XCTestCase {
    @MainActor
    func testLocalWebLinksUseBundledScreens() throws {
        let campus = try XCTUnwrap(ReplicaController.bundledURL(for: URL(string: "http://localhost:3001")!))
        XCTAssertEqual(campus.absoluteString, "compass-web://bundle/campus/index.html")
        let interior = try XCTUnwrap(ReplicaController.bundledURL(for: URL(string: "http://localhost:3000/?building=LAW&floor=1&room=LAW-101")!))
        XCTAssertEqual(interior.host, "bundle")
        XCTAssertEqual(interior.path, "/interior/index.html")
        XCTAssertEqual(URLComponents(url: interior, resolvingAgainstBaseURL: false)?.queryItems?.first { $0.name == "room" }?.value, "LAW-101")
        XCTAssertNil(ReplicaController.bundledURL(for: URL(string: "https://example.com/map")!))
        XCTAssertNil(ReplicaController.bundledURL(for: URL(string: "http://localhost:9999")!))
    }
    @MainActor
    func testSharedCampusLink() throws {
        let url = try XCTUnwrap(ReplicaController.bundledURL(for: URL(string: "trojancompass://map?campus=1")!))
        XCTAssertEqual(url.path, "/campus/index.html")
        XCTAssertNil(url.query)
    }
    @MainActor
    func testAPITransportPreservesContractAndRejectsOtherOrigins() throws {
        let base = URL(string: "https://compass.test/api")!
        let request = try ReplicaController.apiRequest(["path": "/api/routes?dataVersion=v1",
            "method": "POST", "body": "{\"from\":{\"buildingId\":\"LAW\"}}"], baseURL: base)
        XCTAssertEqual(request.url?.absoluteString, "https://compass.test/api/routes?dataVersion=v1")
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        XCTAssertEqual(String(data: try XCTUnwrap(request.httpBody), encoding: .utf8), "{\"from\":{\"buildingId\":\"LAW\"}}")
        for path in ["https://other.test/api/routes", "//other.test/api/routes", "/api/../private", "/api/%2e%2e/private"] {
            XCTAssertThrowsError(try ReplicaController.apiRequest(["path": path, "method": "GET"], baseURL: base))
        }
        XCTAssertThrowsError(try ReplicaController.apiRequest(["path": "/api/routes", "method": "DELETE"], baseURL: base))
        XCTAssertEqual(ReplicaController.bundledURL(for: URL(string: "compass-web://bundle/")!)?.path, "/campus/index.html")
    }
}
