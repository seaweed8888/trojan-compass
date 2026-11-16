// Proposed contract 0.1.0. Foundation transport/decoding scaffold, not a 3D viewer.
// openapi.yaml remains authoritative. Unknown response fields are intentionally ignored.
import Foundation

enum JSONValue: Codable, Sendable {
    case object([String: JSONValue]), array([JSONValue]), string(String)
    case number(Double), bool(Bool), null

    init(from decoder: Decoder) throws {
        let value = try decoder.singleValueContainer()
        if value.decodeNil() { self = .null }
        else if let v = try? value.decode(Bool.self) { self = .bool(v) }
        else if let v = try? value.decode(String.self) { self = .string(v) }
        else if let v = try? value.decode(Double.self) { self = .number(v) }
        else if let v = try? value.decode([JSONValue].self) { self = .array(v) }
        else { self = .object(try value.decode([String: JSONValue].self)) }
    }
    func encode(to encoder: Encoder) throws {
        var value = encoder.singleValueContainer()
        switch self {
        case .object(let v): try value.encode(v)
        case .array(let v): try value.encode(v)
        case .string(let v): try value.encode(v)
        case .number(let v): try value.encode(v)
        case .bool(let v): try value.encode(v)
        case .null: try value.encodeNil()
        }
    }
}

struct Vector3: Codable, Sendable { let x, y, z: Double }
struct GeoPoint: Codable, Sendable { let latitude, longitude: Double }
struct Bounds3: Codable, Sendable { let min, max: Vector3 }
struct CoordinateSystem: Codable, Sendable {
    let id, units, upAxis, handedness, accuracy: String
}
struct Provenance: Codable, Sendable {
    let dataKind, verificationStatus: String
    let sourceUrls: [String]
    let verifiedAt: String?
    let note: String
}
struct Capabilities: Codable, Sendable {
    let interiorScene, navigation, verifiedStepFreeRouting: Bool
    let chatText, chatImages, events: Bool
}
struct Health: Decodable, Sendable { let status, service: String }
struct CollectionResponse<Item: Decodable & Sendable>: Decodable, Sendable {
    let requestId, dataVersion: String
    let items: [Item]
    let nextCursor: String?
}
struct BuildingSummary: Decodable, Sendable {
    let id, code, name: String
    let aliases: [String]
    let location: GeoPoint?
    let coverage: String
    let capabilities: Capabilities
    let provenance: Provenance
}
struct Floor: Decodable, Sendable {
    let id, buildingId, label: String
    let sortOrder: Int
    let elevationMeters: Double
    let sceneObjectKey: String
    let bounds: Bounds3
    let provenance: Provenance
}
struct Building: Decodable, Sendable {
    let id, code, name, description: String
    let aliases: [String]
    let location: GeoPoint?
    let coverage: String
    let capabilities: Capabilities
    let provenance: Provenance
    let officialMapUrl: String?
    let viewerUrl: String
    let coordinateSystem: CoordinateSystem
    let bounds: Bounds3
    let floors: [Floor]
    let sources: [JSONValue]
}
struct BuildingResponse: Decodable, Sendable {
    let requestId, dataVersion: String
    let building: Building
}
struct AccessInfo: Decodable, Sendable {
    let level, stepFreeAccess: String
    let isRamp, entryAllowed, exitAllowed: Bool?
    let note: String
}
struct AccessPoint: Decodable, Sendable {
    let id, nodeId, label: String
    let position: Vector3
    let stepFreeAccess: String
}
struct Place: Decodable, Sendable {
    let id, buildingId, floorId, name, displayLabel, kind, description: String
    let roomNumber: String?
    let aliases: [String]
    let position: Vector3
    let sceneObjectKey: String?
    let bounds: Bounds3?
    let accessPoints: [AccessPoint]
    let access: AccessInfo
    let provenance: Provenance
}
struct PlaceResponse: Decodable, Sendable {
    let requestId, dataVersion: String
    let place: Place
}
struct PlaceSearchResult: Decodable, Sendable {
    let place: Place
    let matchLabel, secondaryLabel, matchType: String
    let stepFreeEvaluation: JSONValue?
}
struct FloorSceneReference: Decodable, Sendable {
    let floorId, label, sceneObjectKey, geometryUrl: String
}
struct SceneManifest: Decodable, Sendable {
    let representation, buildingId: String
    let coordinateSystem: CoordinateSystem
    let bounds: Bounds3
    let rootObjectKey, viewerUrl: String
    let floors: [FloorSceneReference]
    let provenance: Provenance
    let materials: [JSONValue]?
    let asset: JSONValue?
    let assetToBuildingMatrix: [Double]?
    let nodeBindings: [JSONValue]?
}
struct SceneResponse: Decodable, Sendable {
    let requestId, dataVersion: String
    let scene: SceneManifest
}
struct BoxGeometry: Decodable, Sendable {
    let kind, objectKey, role, materialKey: String
    let placeId: String?
    let pickable: Bool
    let center, size: Vector3
    let yawRadians: Double
}
struct MeshGeometry: Decodable, Sendable {
    let kind, objectKey, role, materialKey: String
    let placeId: String?
    let pickable: Bool
    let vertices: [Vector3]
    let triangles: [Int]
    let normals: [Vector3]?
}
enum GeometryObject: Decodable, Sendable {
    case box(BoxGeometry), mesh(MeshGeometry), unknown(JSONValue)
    enum Keys: String, CodingKey { case kind }
    init(from decoder: Decoder) throws {
        switch try decoder.container(keyedBy: Keys.self).decode(String.self, forKey: .kind) {
        case "box": self = .box(try BoxGeometry(from: decoder))
        case "mesh": self = .mesh(try MeshGeometry(from: decoder))
        default: self = .unknown(try JSONValue(from: decoder))
        }
    }
}
struct MapLabel: Decodable, Sendable {
    let placeId, text: String
    let position: Vector3
    let priority: Int
}
struct FloorGeometry: Decodable, Sendable {
    let buildingId, floorId: String
    let coordinateSystem: CoordinateSystem
    let bounds: Bounds3
    let objects: [GeometryObject]
    let labels: [MapLabel]
}
struct FloorResponse: Decodable, Sendable {
    let requestId, dataVersion: String
    let floor: Floor
    let geometry: FloorGeometry?
    let places: [Place]
}
struct PlaceLocation: Codable, Sendable {
    let kind: String
    let buildingId, placeId: String
    init(buildingId: String, placeId: String) {
        kind = "place"; self.buildingId = buildingId; self.placeId = placeId
    }
}
struct PositionLocation: Codable, Sendable {
    let kind: String
    let buildingId, floorId: String
    let position: Vector3
    init(buildingId: String, floorId: String, position: Vector3) {
        kind = "position"; self.buildingId = buildingId
        self.floorId = floorId; self.position = position
    }
}
enum LocationRef: Codable, Sendable {
    case place(PlaceLocation), position(PositionLocation)
    enum Keys: String, CodingKey { case kind }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: Keys.self)
        switch try c.decode(String.self, forKey: .kind) {
        case "place": self = .place(try PlaceLocation(from: decoder))
        case "position": self = .position(try PositionLocation(from: decoder))
        default: throw DecodingError.dataCorruptedError(forKey: .kind, in: c, debugDescription: "Unsupported location kind")
        }
    }
    func encode(to encoder: Encoder) throws {
        switch self {
        case .place(let v): try v.encode(to: encoder)
        case .position(let v): try v.encode(to: encoder)
        }
    }
}
struct ResolvedEndpoint: Decodable, Sendable {
    let requested: LocationRef
    let buildingId, floorId, nodeId: String
    let placeId: String?
    let position: Vector3
    let snapDistanceMeters: Double
}
struct IndoorLeg: Decodable, Sendable {
    let id, kind, buildingId, floorId: String
    let distanceMeters, durationSeconds: Double
    let points: [Vector3]
}
struct VerticalLeg: Decodable, Sendable {
    let id, kind, buildingId, fromFloorId, toFloorId, connectorKind, connectorId: String
    let distanceMeters, durationSeconds: Double
    let points: [Vector3]
}
struct OutdoorLeg: Decodable, Sendable {
    let id, kind, fromBuildingId, toBuildingId: String
    let fromEntrancePlaceId, toEntrancePlaceId, coordinateSystem: String
    let distanceMeters, durationSeconds: Double
    let points: [GeoPoint]
}
enum RouteLeg: Decodable, Sendable {
    case indoor(IndoorLeg), vertical(VerticalLeg), outdoor(OutdoorLeg), unknown(JSONValue)
    enum Keys: String, CodingKey { case kind }
    init(from decoder: Decoder) throws {
        switch try decoder.container(keyedBy: Keys.self).decode(String.self, forKey: .kind) {
        case "indoor": self = .indoor(try IndoorLeg(from: decoder))
        case "vertical": self = .vertical(try VerticalLeg(from: decoder))
        case "outdoor": self = .outdoor(try OutdoorLeg(from: decoder))
        default: self = .unknown(try JSONValue(from: decoder))
        }
    }
}
struct RouteStep: Decodable, Sendable {
    let id, kind, text, legId: String
    let index, pointIndex: Int
    let buildingId, floorId: String?
}
struct RouteWarning: Decodable, Sendable { let code, message: String }
struct Route: Decodable, Sendable {
    let id, mode, accessProfile: String
    let origin, destination: ResolvedEndpoint
    let via: ResolvedEndpoint?
    let distanceMeters, durationSeconds: Double
    let metricsEstimated, usesStairs, usesElevator, stepFreeRequested, verifiedStepFree: Bool
    let legs: [RouteLeg]
    let steps: [RouteStep]
    let warnings: [RouteWarning]
    let provenance: Provenance
}
struct RouteResponse: Decodable, Sendable {
    let requestId, clientRequestId, dataVersion: String
    let route: Route
}
struct RouteRequest: Codable, Sendable {
    let clientRequestId, dataVersion: String
    let origin, destination: LocationRef
    let mode: String
    let stepFree: Bool
    let accessProfile: String
    var via: PlaceLocation? = nil
}
struct ChatHistoryMessage: Codable, Sendable { let role, content: String }
struct ChatContext: Codable, Sendable {
    let buildingId, floorId: String?
    let origin: LocationRef?
    let selectedPlace: PlaceLocation?

    // The contract requires null keys to remain explicit.
    enum Keys: String, CodingKey { case buildingId, floorId, origin, selectedPlace }
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: Keys.self)
        try c.encode(buildingId, forKey: .buildingId)
        try c.encode(floorId, forKey: .floorId)
        try c.encode(origin, forKey: .origin)
        try c.encode(selectedPlace, forKey: .selectedPlace)
    }
}
struct ChatPreferences: Codable, Sendable {
    let mode: String
    let stepFree: Bool
    let accessProfile: String
}
struct ChatPayload: Codable, Sendable {
    let clientRequestId, dataVersion: String
    let message: String?
    let history: [ChatHistoryMessage]
    let context: ChatContext
    let preferences: ChatPreferences
}
struct FocusBuilding: Decodable, Sendable { let type, buildingId: String }
struct FocusFloor: Decodable, Sendable { let type, buildingId, floorId: String }
struct FocusPlace: Decodable, Sendable { let type, buildingId, floorId, placeId: String }
struct ShowRoute: Decodable, Sendable { let type: String; let route: Route }
enum MapAction: Decodable, Sendable {
    case focusBuilding(FocusBuilding), focusFloor(FocusFloor)
    case focusPlace(FocusPlace), showRoute(ShowRoute), unknown(JSONValue)
    enum Keys: String, CodingKey { case type }
    init(from decoder: Decoder) throws {
        switch try decoder.container(keyedBy: Keys.self).decode(String.self, forKey: .type) {
        case "focus_building": self = .focusBuilding(try FocusBuilding(from: decoder))
        case "focus_floor": self = .focusFloor(try FocusFloor(from: decoder))
        case "focus_place": self = .focusPlace(try FocusPlace(from: decoder))
        case "show_route": self = .showRoute(try ShowRoute(from: decoder))
        default: self = .unknown(try JSONValue(from: decoder))
        }
    }
}
struct Clarification: Decodable, Sendable {
    let reason, question: String
    let candidates: [JSONValue]
}
struct ChatResponse: Decodable, Sendable {
    let requestId, clientRequestId, dataVersion, status, message: String
    let actions: [MapAction]
    let clarification: Clarification?
    let citations: [JSONValue]
}
struct Event: Decodable, Sendable {
    let id, title, description, kind, status, startsAt, endsAt, displayTimeZone: String
    let destination: PlaceLocation
    let sourceUrl: String?
    let provenance: Provenance
}
struct EventResponse: Decodable, Sendable {
    let requestId, dataVersion: String
    let event: Event
}
struct GraphResponse: Decodable, Sendable {
    let requestId, dataVersion, buildingId: String
    let nodes, edges: [JSONValue]
    let provenance: Provenance
}
struct APIErrorEnvelope: Decodable, Sendable {
    struct Body: Decodable, Sendable {
        let code, message, requestId: String
        let fieldErrors: [JSONValue]?
        let details: JSONValue?
    }
    let error: Body
}
