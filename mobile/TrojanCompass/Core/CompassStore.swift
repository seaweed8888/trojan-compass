import Foundation
import Combine

@MainActor
final class CompassStore: ObservableObject {
    @Published var source: DataSource = .preview
    @Published var apiURL = UserDefaults.standard.string(forKey: "compass.apiURL") ?? ""
    @Published var catalog: PreviewCatalog?
    @Published var buildingId: String?
    @Published var floorId = "1"
    @Published var allFloors = false
    @Published var selectedPlace: MapPlace?
    @Published var tool: Tool?
    @Published var layers = MapLayer.defaults
    @Published var showBuildings = true
    @Published var showParking = false
    @Published var query = ""
    @Published var suggestions: [SearchSuggestion] = []
    @Published var searchLoading = false
    @Published var searchError: String?
    @Published var originText = ""
    @Published var destinationText = ""
    @Published var origin: SelectedLocation?
    @Published var destination: SelectedLocation?
    @Published var picking: EndpointField?
    @Published var stepFree = false
    @Published var routeMode = "stairs"
    @Published var route: Route?
    @Published var activeStep = 0
    @Published var routeLoading = false
    @Published var routeError: String?
    @Published var chatDraft = ""
    @Published var conversation: [ConversationMessage] = []
    @Published var chatLoading = false
    @Published var chatError: String?
    @Published var notice: String?
    @Published var loading = false
    @Published var viewerError: String?
    @Published var cameraReset = 0
    @Published var campusReset = 0
    @Published var liveBuilding: BuildingResponse?
    @Published var liveFloors: [FloorResponse] = []
    @Published var liveDirectory: [BuildingSummary] = []
    @Published var dataVersion = "web-preview-v1"
    @Published var reduceMotion = false

    private(set) var client: CompassAPIClient?
    private var searchTask: Task<Void, Never>?
    private var loadGeneration = UUID()
    private var routeGeneration = UUID()
    private var chatGeneration = UUID()
    private var searchGeneration = UUID()
    private var lastFailedMessage: String?

    init(client: CompassAPIClient? = nil) {
        self.client = client
        do { catalog = try PreviewCatalog.load() }
        catch { notice = "Preview data could not be loaded: \(error.localizedDescription)" }
    }
    var previewBuilding: PreviewBuilding? { catalog?.interiors.first { $0.id == buildingId } }
    var buildingName: String { liveBuilding?.building.name ?? previewBuilding?.name ?? "University Park Campus" }
    var floorIDs: [String] {
        source == .preview ? (previewBuilding?.floors ?? []) : (liveBuilding?.building.floors.sorted { $0.sortOrder < $1.sortOrder }.map(\.id) ?? [])
    }
    var places: [MapPlace] {
        source == .preview ? (previewBuilding?.places ?? []) : liveFloors.flatMap { $0.places.map(MapPlace.init) }
    }
    var currentFloorPlaces: [MapPlace] { places.filter { (allFloors || $0.floorId == floorId) && $0.kind != "block" } }
    var canRoute: Bool { source == .live && liveBuilding?.building.capabilities.navigation == true }
    var canChat: Bool { source == .live && (liveBuilding?.building.capabilities.chatText ?? liveDirectory.contains { $0.capabilities.chatText }) }
    var isPreview: Bool { source == .preview }

    func setTool(_ next: Tool?) {
        if tool == .directions && next != .directions { origin = nil; originText = ""; picking = nil; cancelPendingRoute() }
        tool = next
    }
    func campus() {
        cancelPendingChat()
        loadGeneration = UUID(); buildingId = nil; selectedPlace = nil; liveBuilding = nil; liveFloors = []
        picking = nil; invalidateRoute(); tool = nil; origin = nil; originText = ""
        viewerError = nil
    }
    func setFloor(_ id: String) {
        guard floorIDs.contains(id) else { return }
        cancelPendingChat()
        if id != floorId { selectedPlace = nil }
        floorId = id; allFloors = false
    }
    func openBuilding(_ id: String, floor: String? = nil) async throws {
        cancelPendingChat()
        let generation = UUID(); loadGeneration = generation
        if source == .preview {
            guard let b = catalog?.interiors.first(where: { $0.id == id }) else {
                throw CompassFailure.message("An interior is not available for \(id). Choose another building from the directory.")
            }
            if let floor, floor != "all", !b.floors.contains(floor) { throw CompassFailure.message("This building does not have that floor.") }
            buildingId = id; floorId = floor == "all" ? (b.floors.contains("1") ? "1" : b.floors[0]) : (floor ?? "1")
            allFloors = floor == "all"; selectedPlace = nil; viewerError = nil
            return
        }
        guard let client else { throw CompassFailure.message("Connect an API in Settings first.") }
        loading = true
        defer { if loadGeneration == generation { loading = false } }
        // Stage the complete replacement before changing the currently committed scene.
        let result: APIResult<BuildingResponse> = try await client.get(BuildingResponse.self, path: ["buildings", id])
        guard case .value(let metadata, _) = result else { throw TransportIssue.unexpectedNotModified }
        guard metadata.building.capabilities.interiorScene else { throw CompassFailure.message("This building has no available interior.") }
        let versionQuery = [URLQueryItem(name: "dataVersion", value: metadata.dataVersion)]
        let sceneResult = try await client.get(SceneResponse.self, path: ["buildings", id, "scene"], query: versionQuery + [URLQueryItem(name: "representation", value: "procedural")])
        guard case .value(let scene, _) = sceneResult, scene.dataVersion == metadata.dataVersion,
              scene.scene.buildingId == id, scene.scene.representation == "procedural",
              scene.scene.coordinateSystem.units == "meters", scene.scene.coordinateSystem.upAxis == "Y"
        else { throw CompassFailure.message("This scene representation or data version is unsupported. The current map was kept.") }
        var floors: [FloorResponse] = []
        for f in metadata.building.floors {
            let result = try await client.get(FloorResponse.self, path: ["buildings", id, "floors", f.id], query: versionQuery)
            guard case .value(let value, _) = result, value.dataVersion == metadata.dataVersion,
                  value.floor.buildingId == id, value.floor.id == f.id,
                  let geometry = value.geometry, geometry.buildingId == id, geometry.floorId == f.id,
                  geometry.coordinateSystem.units == "meters", geometry.coordinateSystem.upAxis == "Y"
            else { throw CompassFailure.message("Floor geometry is unavailable or belongs to a different snapshot.") }
            floors.append(value)
        }
        guard !floors.isEmpty else { throw CompassFailure.message("No floor geometry is available.") }
        if let floor, floor != "all", !floors.contains(where: { $0.floor.id == floor }) { throw CompassFailure.message("This floor is unavailable.") }
        guard generation == loadGeneration, !Task.isCancelled else { return }
        invalidateRoute(); liveBuilding = metadata; liveFloors = floors; buildingId = id
        dataVersion = metadata.dataVersion
        floorId = floor == "all" ? floors[0].floor.id : (floor ?? (floors.first { $0.floor.id == "1" }?.floor.id ?? floors[0].floor.id))
        allFloors = floor == "all"; selectedPlace = nil; viewerError = nil
    }

    func selectCampus(_ location: CampusLocation) {
        Task {
            do {
                let id = location.interiorId ?? location.code
                guard !id.isEmpty else { throw CompassFailure.message("An interior is unavailable for \(location.name).") }
                try await openBuilding(id)
            } catch { notice = describeFailure(error) }
        }
    }
    func search(_ text: String, field: EndpointField? = nil) {
        searchTask?.cancel(); let generation = UUID(); searchGeneration = generation
        searchError = nil
        let q = String(text.prefix(200))
        searchTask = Task {
            if source == .preview {
                suggestions = previewSuggestions(q, field: field); searchLoading = false; return
            }
            guard let client else { return }
            searchLoading = true
            defer { if searchGeneration == generation { searchLoading = false } }
            do {
                try await Task.sleep(nanoseconds: 250_000_000)
                guard !Task.isCancelled else { return }
                let filters = [URLQueryItem(name: "q", value: q), URLQueryItem(name: "limit", value: "8"), URLQueryItem(name: "dataVersion", value: dataVersion)]
                    + (stepFree && field != nil ? [URLQueryItem(name: "stepFree", value: "true"), URLQueryItem(name: "accessProfile", value: "public")] : [])
                let results = try await client.get(CollectionResponse<PlaceSearchResult>.self, path: ["places"], query: filters)
                guard case .value(let list, _) = results, list.dataVersion == dataVersion else { throw CompassFailure.message("Search data changed. Reconnect to refresh the map.") }
                let buildings = try await client.get(CollectionResponse<BuildingSummary>.self, path: ["buildings"], query: filters.filter { !["stepFree", "accessProfile"].contains($0.name) })
                guard case .value(let directory, _) = buildings, directory.dataVersion == dataVersion else { throw CompassFailure.message("Search snapshot mismatch.") }
                guard !Task.isCancelled, searchGeneration == generation else { return }
                var out = list.items.filter { !stepFree || field == nil || $0.place.access.stepFreeAccess == "verified_yes" }.map {
                    SearchSuggestion(id: $0.place.id, title: $0.matchLabel, detail: $0.secondaryLabel, place: MapPlace($0.place), campus: nil, buildingId: $0.place.buildingId)
                }
                if field == nil {
                    out += directory.items.map { SearchSuggestion(id: "building-" + $0.id, title: $0.code, detail: $0.name, place: nil, campus: nil, buildingId: $0.id) }
                }
                suggestions = Array(out.prefix(8))
            } catch is CancellationError {} catch {
                guard searchGeneration == generation else { return }
                searchError = describeFailure(error); suggestions = []
            }
        }
    }
    func previewSuggestions(_ text: String, field: EndpointField? = nil) -> [SearchSuggestion] {
        let q = normalized(text)
        let allPlaces = catalog?.interiors.flatMap(\.places) ?? []
        var out = allPlaces.filter { p in
            !q.isEmpty && p.kind != "block" && normalized(p.label + p.detail).contains(q)
        }.map { SearchSuggestion(id: $0.id, title: $0.label, detail: $0.detail, place: $0, campus: nil, buildingId: $0.buildingId) }
        if field == nil {
            out += (catalog?.locations ?? []).filter { l in
                (l.category == "Buildings") && (q.isEmpty ? l.interiorId != nil : normalized(l.code + l.name + l.aliases.joined()).contains(q))
            }.map { SearchSuggestion(id: $0.id, title: $0.code.isEmpty ? $0.name : $0.code, detail: $0.name, place: nil, campus: $0, buildingId: $0.interiorId) }
        }
        // Preview access is unknown; never promote the demo's stepFree boolean to verified.
        if stepFree && field != nil { return [] }
        return Array(out.sorted {
            let a = normalized($0.title), b = normalized($1.title)
            if a == q && b != q { return true }; if b == q && a != q { return false }
            if a.hasPrefix(q) != b.hasPrefix(q) { return a.hasPrefix(q) }
            return a < b
        }.prefix(8))
    }
    func choose(_ suggestion: SearchSuggestion, field: EndpointField? = nil) {
        cancelPendingChat()
        Task {
            do {
                invalidateRoute(); picking = nil
                let keepAll = allFloors
                if let p = suggestion.place {
                    if buildingId != p.buildingId { try await openBuilding(p.buildingId, floor: p.floorId) }
                    guard places.contains(where: { $0.id == p.id && $0.floorId == p.floorId }) else { throw CompassFailure.message("The selected place is not in the loaded snapshot.") }
                    if let field { setEndpoint(SelectedLocation(place: p, source: source), field: field) }
                    else { query = suggestion.title; selectedPlace = p; floorId = p.floorId; allFloors = keepAll; search(query) }
                } else if let c = suggestion.campus { selectCampus(c); query = suggestion.title }
                else if let id = suggestion.buildingId { try await openBuilding(id); query = suggestion.title }
            } catch { notice = describeFailure(error) }
        }
    }
    func submitSearch() {
        if let exact = suggestions.first(where: { normalized($0.title) == normalized(query) }) { choose(exact) }
        else if let first = suggestions.first { choose(first) }
        else { searchError = "No matching building or room. Try LAW or LAW 101." }
    }
    func editEndpoint(_ text: String, field: EndpointField) {
        cancelPendingChat()
        invalidateRoute()
        if field == .origin { originText = text; origin = nil } else { destinationText = text; destination = nil }
        search(text, field: field)
    }
    func setEndpoint(_ value: SelectedLocation, field: EndpointField) {
        cancelPendingChat()
        invalidateRoute()
        if field == .origin { origin = value; originText = value.label }
        else { destination = value; destinationText = value.label }
        floorId = value.floorId; allFloors = false; picking = nil; suggestions = []
    }
    func startPicking(_ field: EndpointField) {
        cancelPendingChat()
        guard buildingId != nil else { notice = "Open a building before picking a location."; return }
        picking = field; allFloors = false; selectedPlace = nil
    }
    func accessibilityChanged() {
        cancelPendingChat()
        if stepFree { routeMode = "elevator" }
        invalidateRoute(); suggestions = []
    }
    func invalidateRoute() { routeGeneration = UUID(); route = nil; activeStep = 0; routeError = nil; routeLoading = false }
    func cancelPendingRoute() { routeGeneration = UUID(); routeLoading = false }

    func calculateRoute(via: PlaceLocation? = nil) async {
        cancelPendingChat()
        guard let origin, let destination else { routeError = "Choose a suggested location or pick each endpoint on the map."; return }
        guard canRoute, let client else { routeError = "Routing is not connected in Preview. Your selected endpoints are kept."; return }
        guard origin.coordinateSpace == "canonical-meters", destination.coordinateSpace == "canonical-meters" else { routeError = "Choose both locations again using the live dataset."; return }
        let id = UUID().uuidString; let generation = UUID(); routeGeneration = generation
        routeLoading = true; routeError = nil
        defer { if generation == routeGeneration { routeLoading = false } }
        do {
            let result = try await client.calculateRoute(RouteRequest(clientRequestId: id, dataVersion: dataVersion, origin: origin.reference, destination: destination.reference, mode: routeMode, stepFree: stepFree, accessProfile: "public", via: via))
            guard generation == routeGeneration else { return }
            guard result.clientRequestId == id, result.dataVersion == dataVersion else { throw CompassFailure.message("The route response is stale. Please try again.") }
            try validateRoute(result.route)
            route = result.route; activeStep = 0
            if !result.route.steps.isEmpty { await goToStep(0) }
        } catch { if generation == routeGeneration { routeError = describeFailure(error) } }
    }
    func validateRoute(_ value: Route) throws {
        if stepFree && (!value.verifiedStepFree || value.usesStairs) { throw CompassFailure.message("A verified step-free route is unavailable. Your accessibility preference was kept.") }
        let known = Set(liveDirectory.map(\.id)).union([buildingId].compactMap { $0 })
        guard known.contains(value.origin.buildingId), known.contains(value.destination.buildingId),
              value.distanceMeters.isFinite, value.durationSeconds.isFinite else { throw CompassFailure.message("The route refers to unavailable data.") }
        for leg in value.legs {
            if case .unknown = leg { throw CompassFailure.message("This route includes an unsupported segment.") }
        }
    }
    func goToStep(_ index: Int) async {
        guard let value = route, value.steps.indices.contains(index) else { return }
        let step = value.steps[index]
        do {
            if let id = step.buildingId {
                if id != buildingId { try await openBuilding(id, floor: step.floorId); route = value }
                if let floor = step.floorId { guard floorIDs.contains(floor) else { throw CompassFailure.message("The route step's floor is unavailable.") }; setFloor(floor) }
            } else { buildingId = nil }
            activeStep = index
        } catch { routeError = describeFailure(error) }
    }

    func cancelPendingChat() { chatGeneration = UUID(); chatLoading = false }

    func sendChat(retry: Bool = false) async {
        let text = (retry ? lastFailedMessage ?? "" : chatDraft).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !chatLoading else { return }
        guard text.count <= 4000 else { chatError = "Use 4,000 characters or fewer."; return }
        guard canChat, let client else { chatError = "Compass is not connected in Preview. Add the shared API URL in Settings when the service is ready."; return }
        let history = conversation.filter { !$0.failed }.suffix(20).map { ChatHistoryMessage(role: $0.role, content: String($0.text.prefix(4000))) }
        if retry { conversation.removeAll { $0.failed } }
        conversation.append(ConversationMessage(role: "user", text: text))
        let generation = UUID(); chatGeneration = generation
        chatLoading = true; chatError = nil; lastFailedMessage = text
        let id = UUID().uuidString
        let payload = ChatPayload(clientRequestId: id, dataVersion: dataVersion, message: text, history: history,
            context: ChatContext(buildingId: buildingId, floorId: buildingId == nil ? nil : floorId, origin: origin?.reference,
                selectedPlace: selectedPlace.map { PlaceLocation(buildingId: $0.buildingId, placeId: $0.id) }),
            preferences: ChatPreferences(mode: routeMode, stepFree: stepFree, accessProfile: "public"))
        defer { if generation == chatGeneration { chatLoading = false } }
        do {
            let result = try await client.chat(payload)
            guard generation == chatGeneration else { return }
            guard result.clientRequestId == id, result.dataVersion == dataVersion else { throw CompassFailure.message("The reply belongs to an earlier map snapshot. Please retry.") }
            if result.status == "resolved", !(try await applyActions(result.actions)) { return }
            guard generation == chatGeneration else { return }
            conversation.append(ConversationMessage(role: "assistant", text: result.clarification?.question ?? result.message))
            if chatDraft.trimmingCharacters(in: .whitespacesAndNewlines) == text { chatDraft = "" }
            lastFailedMessage = nil
        } catch {
            guard generation == chatGeneration else { return }
            if let i = conversation.indices.last { conversation[i].failed = true }
            chatError = describeFailure(error)
        }
    }
    func applyActions(_ actions: [MapAction]) async throws -> Bool {
        let generation = chatGeneration
        // Validate the entire action batch before committing a selection or route.
        var targetBuilding: String?, targetFloor: String?, targetPlace: String?, newRoute: Route?
        var references: [(String, String?, String?)] = []
        for action in actions {
            switch action {
            case .focusBuilding(let a): targetBuilding = a.buildingId; targetFloor = nil; targetPlace = nil; references.append((a.buildingId, nil, nil))
            case .focusFloor(let a): targetBuilding = a.buildingId; targetFloor = a.floorId; targetPlace = nil; references.append((a.buildingId, a.floorId, nil))
            case .focusPlace(let a): targetBuilding = a.buildingId; targetFloor = a.floorId; targetPlace = a.placeId; references.append((a.buildingId, a.floorId, a.placeId))
            case .showRoute(let a): try validateRoute(a.route); newRoute = a.route
            case .unknown: throw CompassFailure.message("Compass returned an unsupported map action. Your map was kept.")
            }
        }
        if let step = newRoute?.steps.first, let id = step.buildingId {
            targetBuilding = id; targetFloor = step.floorId; targetPlace = nil
            references.append((id, step.floorId, nil))
        }
        var validated: [String: CompassStore] = [:]
        for (id, floor, place) in references {
            let staged: CompassStore
            if let cached = validated[id] { staged = cached }
            else {
                staged = CompassStore(); staged.source = .live; staged.client = client; staged.dataVersion = dataVersion
                try await staged.openBuilding(id)
                guard staged.dataVersion == dataVersion else { throw CompassFailure.message("Compass references a different map snapshot.") }
                validated[id] = staged
            }
            if let floor, !staged.floorIDs.contains(floor) { throw CompassFailure.message("Compass referenced an unknown floor. Your map was kept.") }
            if let place, !staged.places.contains(where: { $0.id == place && $0.floorId == floor }) { throw CompassFailure.message("Compass referenced an unknown room. Your map was kept.") }
        }
        guard generation == chatGeneration, !Task.isCancelled else { return false }
        if let id = targetBuilding {
            // Stage using a separate store so a bad place ID cannot replace the map.
            guard let staged = validated[id] else { throw CompassFailure.message("No validated scene is available.") }
            liveBuilding = staged.liveBuilding; liveFloors = staged.liveFloors; buildingId = id; floorId = targetFloor ?? staged.floorId; allFloors = false
            selectedPlace = staged.places.first { $0.id == targetPlace }
        }
        invalidateRoute(); route = newRoute; picking = nil
        return true
    }

    func connect() async {
        cancelPendingChat()
        do {
            guard let url = URL(string: apiURL.trimmingCharacters(in: .whitespacesAndNewlines)), url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/")).hasSuffix("api"), url.user == nil, url.password == nil,
                  url.scheme == "https" || (url.scheme == "http" && ["localhost", "127.0.0.1"].contains(url.host ?? ""))
            else { throw CompassFailure.message("Enter a reachable HTTPS API URL ending in /api. Simulator localhost may use HTTP.") }
            loading = true; defer { loading = false }
            let candidate = try CompassAPIClient(baseURL: url, allowHTTPForDevelopment: url.scheme == "http")
            let result = try await candidate.get(CollectionResponse<BuildingSummary>.self, path: ["buildings"], query: [URLQueryItem(name: "limit", value: "100")])
            guard case .value(let list, _) = result else { throw TransportIssue.unexpectedNotModified }
            client = candidate; source = .live; campus(); liveDirectory = list.items; dataVersion = list.dataVersion
            UserDefaults.standard.set(url.absoluteString, forKey: "compass.apiURL"); tool = .settings
            notice = "Connected to the shared API. \(list.items.count) buildings available."
        } catch { notice = describeFailure(error) }
    }
    func usePreview() {
        loadGeneration = UUID(); chatGeneration = UUID(); searchGeneration = UUID(); searchTask?.cancel()
        client = nil; source = .preview; campus(); dataVersion = "web-preview-v1"
        suggestions = []; chatLoading = false; searchLoading = false; loading = false; tool = .settings
    }
    func handleLink(_ url: URL) async {
        do {
            switch try LinkIntent.parse(url) {
            case .building(let id, let floor, let place):
                try await openBuilding(id, floor: floor)
                if let place {
                    guard let p = places.first(where: { $0.id == place }) else { throw CompassFailure.message("That room is unavailable in this snapshot.") }
                    selectedPlace = p; floorId = p.floorId
                }
            case .route(let from, let to, let mode, let via, let stepFree):
                guard source == .live, let client else { throw CompassFailure.message("Shared routes need the connected backend. Preview does not calculate navigation routes.") }
                func resolve(_ id: String) async throws -> MapPlace {
                    let result = try await client.get(CollectionResponse<PlaceSearchResult>.self, path: ["places"], query: [URLQueryItem(name: "q", value: id), URLQueryItem(name: "dataVersion", value: dataVersion)])
                    guard case .value(let list, _) = result, list.dataVersion == dataVersion, let p = list.items.first(where: { $0.place.id == id }) else { throw CompassFailure.message("A shared endpoint is unavailable.") }
                    return MapPlace(p.place)
                }
                let a = try await resolve(from), b = try await resolve(to)
                var stop: PlaceLocation?
                if let via {
                    let place = try await resolve(via)
                    stop = PlaceLocation(buildingId: place.buildingId, placeId: place.id)
                }
                try await openBuilding(a.buildingId, floor: a.floorId)
                setEndpoint(SelectedLocation(place: a, source: .live), field: .origin)
                setEndpoint(SelectedLocation(place: b, source: .live), field: .destination)
                routeMode = mode; self.stepFree = stepFree; tool = .directions; await calculateRoute(via: stop)
            }
        } catch { notice = describeFailure(error) }
    }
    var shareURL: URL {
        var c = URLComponents(); c.scheme = "trojancompass"; c.host = "map"
        if let route, let a = route.origin.placeId, let b = route.destination.placeId {
            c.queryItems = [URLQueryItem(name: "from", value: a), URLQueryItem(name: "to", value: b), URLQueryItem(name: "mode", value: route.mode)]
            if route.stepFreeRequested { c.queryItems?.append(URLQueryItem(name: "stepFree", value: "true")) }
            if let via = route.via?.placeId { c.queryItems?.append(URLQueryItem(name: "via", value: via)) }
        } else {
            c.queryItems = [URLQueryItem(name: "building", value: buildingId ?? "LAW"), URLQueryItem(name: "floor", value: allFloors ? "all" : floorId)]
            if let p = selectedPlace { c.queryItems?.append(URLQueryItem(name: "room", value: p.id)) }
        }
        return c.url!
    }
    func interrupted() { picking = nil }
}
