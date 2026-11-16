import Foundation

enum AppResources {
    static var root: URL {
        #if SWIFT_PACKAGE
        // On macOS Bundle already resolves the copied Resources directory.
        let bundleRoot = Bundle.module.resourceURL!
        return FileManager.default.fileExists(atPath: bundleRoot.appendingPathComponent("preview-catalog.json").path)
            ? bundleRoot : bundleRoot.appendingPathComponent("Resources")
        #else
        return Bundle.main.resourceURL!.appendingPathComponent("Resources")
        #endif
    }
    static func decode<T: Decodable>(_ type: T.Type, _ file: String) throws -> T {
        try JSONDecoder().decode(type, from: Data(contentsOf: root.appendingPathComponent(file)))
    }
}

struct PreviewCatalog: Decodable {
    let interiors: [PreviewBuilding]
    let locations: [CampusLocation]
    static func load() throws -> Self { try AppResources.decode(Self.self, "preview-catalog.json") }
}
struct PreviewBuilding: Decodable, Identifiable {
    let id, name, detail: String
    let floors: [String]
    let places: [MapPlace]
}
struct CampusLocation: Decodable, Identifiable {
    let id, code, name, category: String
    let latitude, longitude: Double
    let paths: [[Double]]
    let interiorId: String?
    let aliases: [String]
}
struct MapPlace: Codable, Identifiable, Sendable {
    let id, buildingId, floorId, label, detail, kind: String
    let x, z, y: Double
    let isRamp: Bool
    let stepFreeAccess: String

    init(_ p: Place) {
        id = p.id; buildingId = p.buildingId; floorId = p.floorId
        label = p.displayLabel; detail = p.description; kind = p.kind
        x = p.position.x; y = p.position.y; z = p.position.z
        isRamp = p.access.isRamp == true; stepFreeAccess = p.access.stepFreeAccess
    }
    var position: Vector3 { Vector3(x: x, y: y, z: z) }
}

enum DataSource: String, CaseIterable { case preview, live }
enum Tool: String, Identifiable, CaseIterable {
    case search = "Search", directions = "Directions", chat = "Compass", layers = "Layers", settings = "Settings"
    var id: String { rawValue }
    var symbol: String {
        switch self {
        case .search: "magnifyingglass"
        case .directions: "arrow.triangle.turn.up.right.diamond"
        case .chat: "sparkles"
        case .layers: "square.3.layers.3d"
        case .settings: "gearshape"
        }
    }
}
enum EndpointField: String { case origin, destination }
struct SelectedLocation: Codable, Sendable {
    let buildingId, floorId, label: String
    let placeId: String?
    let position: Vector3
    let coordinateSpace: String
    var reference: LocationRef {
        if let placeId { return .place(PlaceLocation(buildingId: buildingId, placeId: placeId)) }
        return .position(PositionLocation(buildingId: buildingId, floorId: floorId, position: position))
    }
    init(place: MapPlace, source: DataSource) {
        buildingId = place.buildingId; floorId = place.floorId; placeId = place.id
        label = place.label; position = place.position
        coordinateSpace = source == .live ? "canonical-meters" : "preview-meters"
    }
    init(buildingId: String, floorId: String, label: String, placeId: String?, position: Vector3, coordinateSpace: String) {
        self.buildingId = buildingId; self.floorId = floorId; self.label = label
        self.placeId = placeId; self.position = position; self.coordinateSpace = coordinateSpace
    }
}
struct ConversationMessage: Identifiable {
    let id = UUID()
    let role, text: String
    var failed = false
}
struct SearchSuggestion: Identifiable {
    let id, title, detail: String
    let place: MapPlace?
    let campus: CampusLocation?
    let buildingId: String?
}
struct MapLayer: Identifiable {
    let id, title, symbol: String
    static let all: [Self] = [
        .init(id: "classrooms", title: "Classrooms", symbol: "door.left.hand.open"),
        .init(id: "mensRestrooms", title: "Men’s restrooms", symbol: "figure.stand"),
        .init(id: "womensRestrooms", title: "Women’s restrooms", symbol: "figure.stand.dress"),
        .init(id: "ramps", title: "Wheelchair ramps", symbol: "figure.roll"),
        .init(id: "elevators", title: "Elevators", symbol: "arrow.up.arrow.down"),
        .init(id: "stairs", title: "Stairs", symbol: "figure.stairs"),
        .init(id: "entrances", title: "Entrances", symbol: "door.left.hand.open"),
        .init(id: "exits", title: "Emergency exits", symbol: "rectangle.portrait.and.arrow.right")
    ]
    static let defaults = Set(all.map(\.id))
}
enum CompassFailure: LocalizedError {
    case message(String)
    var errorDescription: String? {
        switch self { case .message(let text): text }
    }
}

enum LinkIntent {
    case building(id: String, floor: String?, place: String?)
    case route(from: String, to: String, mode: String, via: String?, stepFree: Bool)
    static func parse(_ url: URL) throws -> Self {
        guard ["trojancompass", "https", "http"].contains(url.scheme?.lowercased() ?? ""),
              let c = URLComponents(url: url, resolvingAgainstBaseURL: false)
        else { throw CompassFailure.message("This map link is invalid.") }
        let q = c.queryItems ?? []
        func value(_ k: String) -> String? { q.first { $0.name == k }?.value }
        if let from = value("from"), let to = value("to") {
            let mode = value("mode") ?? "fastest"
            guard ["fastest", "stairs", "elevator"].contains(mode) else { throw CompassFailure.message("Unsupported travel preference.") }
            let stepFree = value("stepFree"), via = value("via")
            guard stepFree == nil || ["true", "false"].contains(stepFree!),
                  via == nil || !via!.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            else { throw CompassFailure.message("The route link has an invalid stop or accessibility preference.") }
            return .route(from: from, to: to, mode: mode, via: via, stepFree: stepFree == "true")
        }
        guard let id = value("building"), !id.isEmpty else { throw CompassFailure.message("The link has no building.") }
        let floor = value("floor").map { $0.uppercased() == "B" ? "0" : $0.lowercased() }
        return .building(id: id, floor: floor, place: value("room"))
    }
}

func normalized(_ text: String) -> String {
    text.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
        .filter { $0.isLetter || $0.isNumber }
}
func floorLabel(_ id: String) -> String { id == "0" ? "Basement" : "Floor \(id)" }
func describeFailure(_ error: Error) -> String {
    if let api = error as? APIHTTPFailure {
        let base = api.body?.error.message ?? "Service unavailable (\(api.statusCode))."
        let reference = api.body?.error.requestId ?? api.requestId
        return base + (reference.map { " Reference: \($0)." } ?? "")
    }
    return error.localizedDescription
}
