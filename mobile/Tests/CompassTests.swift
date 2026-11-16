import XCTest
@testable import TrojanCompass

final class CompassTests: XCTestCase {
    func testContractFixturesDecode() throws {
        _ = try AppResources.decode(BuildingResponse.self, "Fixtures/building-law.json")
        _ = try AppResources.decode(FloorResponse.self, "Fixtures/floor-1.json")
        _ = try AppResources.decode(MeshGeometry.self, "Fixtures/geometry-mesh.json")
        _ = try AppResources.decode(SceneResponse.self, "Fixtures/scene-procedural.json")
        _ = try AppResources.decode(RouteResponse.self, "Fixtures/route-success.json")
        _ = try AppResources.decode(RouteResponse.self, "Fixtures/route-cross-floor.json")
        _ = try AppResources.decode(RouteResponse.self, "Fixtures/route-same-place.json")
        _ = try AppResources.decode(OutdoorLeg.self, "Fixtures/outdoor-leg.json")
        for file in ["chat-route", "chat-focus-building", "chat-focus-floor", "chat-focus-place", "chat-clarification", "chat-no-route"] {
            _ = try AppResources.decode(ChatResponse.self, "Fixtures/\(file).json")
        }
    }
    @MainActor
    func testPreviewSearchVariantsAndAliases() throws {
        let s = CompassStore()
        for text in ["law 101", "LAW-101", "LAW101"] {
            XCTAssertTrue(s.previewSuggestions(text).contains { $0.place?.id == "LAW-101" }, text)
        }
        XCTAssertTrue(s.previewSuggestions("Medicine Crow").contains { $0.buildingId == "VKC" })
        XCTAssertTrue(s.previewSuggestions("no-such-room-zzzz").isEmpty)
        s.stepFree = true
        XCTAssertTrue(s.previewSuggestions("LAW", field: .origin).isEmpty, "Unknown demo accessibility must not become verified")
    }
    @MainActor
    func testFloorSelectionAndPickingPreserveCommittedEndpoints() async throws {
        let s = CompassStore()
        try await s.openBuilding("LAW")
        let room = try XCTUnwrap(s.places.first { $0.id == "LAW-101" })
        s.setEndpoint(SelectedLocation(place: room, source: .preview), field: .origin)
        s.setEndpoint(SelectedLocation(place: room, source: .preview), field: .destination)
        s.allFloors = true; s.startPicking(.destination)
        XCTAssertFalse(s.allFloors)
        s.picking = nil
        XCTAssertEqual(s.destination?.placeId, "LAW-101")
        s.selectedPlace = room; s.setFloor("2")
        XCTAssertNil(s.selectedPlace)
        XCTAssertEqual(s.origin?.floorId, "1")
        s.editEndpoint("unresolved text", field: .origin)
        XCTAssertNil(s.origin)
        XCTAssertEqual(s.destination?.placeId, "LAW-101")
    }
    @MainActor
    func testUnavailableBuildingKeepsPreviousMap() async throws {
        let s = CompassStore(); try await s.openBuilding("LAW")
        do { try await s.openBuilding("UNKNOWN"); XCTFail("Expected missing interior") } catch {}
        XCTAssertEqual(s.buildingId, "LAW")
        XCTAssertEqual(s.floorId, "1")
    }
    @MainActor
    func testPreviewDoesNotFabricateRoutesOrChat() async throws {
        let s = CompassStore(); try await s.openBuilding("LAW")
        let room = try XCTUnwrap(s.places.first { $0.id == "LAW-101" })
        s.origin = SelectedLocation(place: room, source: .preview); s.destination = s.origin
        await s.calculateRoute()
        XCTAssertNil(s.route); XCTAssertNotNil(s.routeError)
        s.chatDraft = "Where is LAW 101?"; await s.sendChat()
        XCTAssertTrue(s.conversation.isEmpty); XCTAssertFalse(s.chatDraft.isEmpty); XCTAssertNotNil(s.chatError)
    }
    @MainActor
    func testUnverifiedStepFreeRouteRejected() throws {
        let s = CompassStore()
        s.stepFree = true
        let fixture = try AppResources.decode(RouteResponse.self, "Fixtures/route-success.json")
        XCTAssertThrowsError(try s.validateRoute(fixture.route))
    }
    func testLinksAndLayerDefaults() throws {
        guard case .building(let id, let floor, _) = try LinkIntent.parse(URL(string: "trojancompass://map?building=LAW&floor=B")!) else { return XCTFail() }
        XCTAssertEqual(id, "LAW"); XCTAssertEqual(floor, "0")
        XCTAssertThrowsError(try LinkIntent.parse(URL(string: "trojancompass://map?from=LAW-101&to=LAW-102&mode=teleport")!))
        XCTAssertFalse(MapLayer.defaults.contains("exits")); XCTAssertFalse(MapLayer.defaults.contains("accessible"))
        XCTAssertEqual(MapLayer.all[3].id, "ramps"); XCTAssertEqual(MapLayer.all[4].id, "elevators")
    }
    func testChatNullContextKeysAreEncoded() throws {
        let data = try JSONEncoder().encode(ChatContext(buildingId: nil, floorId: nil, origin: nil, selectedPlace: nil))
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertEqual(object.count, 4)
        XCTAssertTrue(object.values.allSatisfy { $0 is NSNull })
    }
    func testClientRejectsUnapprovedURLs() throws {
        XCTAssertThrowsError(try CompassAPIClient(baseURL: URL(string: "http://example.com/api")!))
        XCTAssertThrowsError(try CompassAPIClient(baseURL: URL(string: "https://example.com/api?token=private")!))
        XCTAssertThrowsError(try CompassAPIClient(baseURL: URL(string: "https://user:secret@example.com/api")!))
    }
}
