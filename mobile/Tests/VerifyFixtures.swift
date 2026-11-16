// Command-line fixture decoding check. Exclude this file from the iOS app target.
// Compile with the two scaffold files; run with the package root as argument.
import Foundation

@main struct VerifyFixtures {
    static func main() throws {
        let root = URL(fileURLWithPath: CommandLine.arguments.dropFirst().first ?? ".")
        let index = try JSONDecoder().decode([Fixture].self,
            from: Data(contentsOf: root.appendingPathComponent("fixture-index.json")))
        var checked = 0
        for item in index where item.valid {
            let data = try Data(contentsOf: root.appendingPathComponent(item.file))
            switch item.schema {
            case "Health": try decode(Health.self, data)
            case "BuildingListResponse": try decode(CollectionResponse<BuildingSummary>.self, data)
            case "BuildingResponse": try decode(BuildingResponse.self, data)
            case "SceneResponse": try decode(SceneResponse.self, data)
            case "FloorListResponse": try decode(CollectionResponse<Floor>.self, data)
            case "FloorResponse": try decode(FloorResponse.self, data)
            case "PlaceListResponse": try decode(CollectionResponse<Place>.self, data)
            case "PlaceResponse": try decode(PlaceResponse.self, data)
            case "PlaceSearchResponse": try decode(CollectionResponse<PlaceSearchResult>.self, data)
            case "RouteRequest": try decode(RouteRequest.self, data)
            case "RouteResponse": try decode(RouteResponse.self, data)
            case "ChatTextRequest": try decode(ChatPayload.self, data)
            case "ChatResponse": try decode(ChatResponse.self, data)
            case "EventListResponse": try decode(CollectionResponse<Event>.self, data)
            case "EventResponse": try decode(EventResponse.self, data)
            case "GraphResponse": try decode(GraphResponse.self, data)
            case "OutdoorLeg": try decode(OutdoorLeg.self, data)
            case "MeshObject": try decode(MeshGeometry.self, data)
            default: try decode(APIErrorEnvelope.self, data)
            }
            checked += 1
        }
        let unknown = Data(#"{"type":"future_action","buildingId":"LAW"}"#.utf8)
        guard case .unknown = try JSONDecoder().decode(MapAction.self, from: unknown)
        else { fatalError("Unknown actions must decode safely") }
        let context = ChatContext(buildingId: nil, floorId: nil, origin: nil, selectedPlace: nil)
        let encoded = try JSONSerialization.jsonObject(with: JSONEncoder().encode(context)) as! [String: Any]
        guard encoded.count == 4, encoded.values.allSatisfy({ $0 is NSNull })
        else { fatalError("Required nullable context fields must be encoded explicitly") }
        print("Decoded \(checked) positive fixtures; unknown action and explicit-null encoding checks passed.")
    }
    struct Fixture: Decodable { let file, schema: String; let valid: Bool }
    static func decode<Value: Decodable>(_ type: Value.Type, _ data: Data) throws {
        _ = try JSONDecoder().decode(type, from: data)
    }
}
