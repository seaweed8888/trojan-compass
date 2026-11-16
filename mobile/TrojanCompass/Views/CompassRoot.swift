import SwiftUI
import MapKit

struct CompassRoot: View {
    @ObservedObject var store: CompassStore
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var detent: PresentationDetent = .height(340)

    var body: some View {
        VStack(spacing: 0) {
            brandHeader
            ZStack(alignment: .top) {
                if store.buildingId == nil { CampusMap(store: store) }
                else { InteriorViewer(store: store).accessibilityLabel("Interactive building interior. Use Search for a list of destinations.") }
                VStack(spacing: 10) {
                    mapToolbar
                    if let field = store.picking {
                        HStack {
                            Image(systemName: "hand.point.up.left.fill")
                            Text("Tap a room or open floor area for \(field == .origin ? "your location" : "the destination").").font(.subheadline)
                            Button("Cancel") { store.picking = nil }.fontWeight(.semibold)
                        }.padding(12).background(CompassTheme.gold, in: RoundedRectangle(cornerRadius: 16)).padding(.horizontal, 16)
                    }
                    if let error = store.viewerError {
                        Label(error, systemImage: "exclamationmark.triangle").font(.subheadline).padding().background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16)).padding(.horizontal)
                    }
                    Spacer()
                    if let p = store.selectedPlace, store.picking == nil {
                        HStack(spacing: 12) {
                            Image(systemName: "door.left.hand.open").font(.title2).foregroundStyle(CompassTheme.cardinal)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(p.label).font(.headline)
                                Text("\(floorLabel(p.floorId)) · \(p.detail)").font(.caption).foregroundStyle(.secondary).lineLimit(2)
                            }
                            Spacer()
                            Button { store.setEndpoint(SelectedLocation(place: p, source: store.source), field: .destination); store.setTool(.directions) } label: {
                                Image(systemName: "arrow.triangle.turn.up.right.diamond.fill").font(.title2)
                            }.accessibilityLabel("Directions to \(p.label)")
                            Button { store.selectedPlace = nil } label: { Image(systemName: "xmark") }.accessibilityLabel("Clear room selection")
                        }.padding(16).background(.regularMaterial, in: RoundedRectangle(cornerRadius: 20)).shadow(color: .black.opacity(0.08), radius: 12, y: 4).padding(16)
                    }
                    if store.buildingId != nil {
                        HStack {
                            Text(store.isPreview ? "PREVIEW INTERIOR · Unverified map" : (store.liveBuilding?.building.provenance.note ?? ""))
                                .font(.caption2).foregroundStyle(.secondary).lineLimit(2)
                            Spacer()
                            if let origin = store.origin, origin.floorId != store.floorId {
                                Button { store.setFloor(origin.floorId) } label: { Label("You · \(floorLabel(origin.floorId))", systemImage: "location.fill") }.font(.caption)
                            }
                        }.padding(.horizontal, 16).padding(.bottom, 10)
                    }
                }
                if store.loading { ProgressView("Loading building…").padding(20).background(.regularMaterial, in: RoundedRectangle(cornerRadius: 18)).frame(maxHeight: .infinity) }
            }
            bottomBar
        }
        .background(CompassTheme.paper)
        .sheet(item: $store.tool) { tool in
            NavigationStack {
                ToolPanel(store: store, tool: tool)
                    .navigationTitle(tool.rawValue)
                    #if os(iOS)
                    .navigationBarTitleDisplayMode(.inline)
                    #endif
                    .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { store.setTool(nil) } } }
            }
            .presentationDetents([.height(230), .height(340), .medium, .large], selection: $detent)
            .presentationDragIndicator(.visible)
            #if os(iOS)
            .presentationBackgroundInteraction(.enabled)
            .presentationCornerRadius(24)
            #endif
        }
        .alert("Trojan Compass", isPresented: Binding(get: { store.notice != nil }, set: { if !$0 { store.notice = nil } })) {
            Button("OK", role: .cancel) { store.notice = nil }
        } message: { Text(store.notice ?? "") }
        .onOpenURL { url in Task { await store.handleLink(url) } }
        .onChange(of: store.picking) { _, field in if field != nil { detent = .height(230) } }
        .onChange(of: store.tool) { old, new in
            if old == .directions && new != .directions { store.origin = nil; store.originText = ""; store.picking = nil; store.cancelPendingRoute() }
            if new == .search { store.search(store.query) }
        }
        .onChange(of: scenePhase) { _, phase in if phase != .active { store.interrupted() } }
        .onChange(of: reduceMotion) { _, value in store.reduceMotion = value }
        .onAppear { store.reduceMotion = reduceMotion }
        .frame(minWidth: 320, minHeight: 500)
    }

    private var brandHeader: some View {
        HStack(spacing: 12) {
            Text("USC").font(.system(size: 25, weight: .bold, design: .serif)).foregroundStyle(.white).accessibilityHidden(true)
            Rectangle().fill(.white.opacity(0.3)).frame(width: 1, height: 26)
            Text("Trojan \(Text("Compass").foregroundColor(CompassTheme.gold))").foregroundColor(.white)
                .font(.system(size: 21, weight: .semibold)).accessibilityAddTraits(.isHeader)
            Spacer(minLength: 0)
            Button { store.setTool(.settings) } label: { Image(systemName: "gearshape").frame(width: 40, height: 44).foregroundStyle(.white) }.accessibilityLabel("Connection settings")
        }.padding(.leading, 18).padding(.trailing, 8).padding(.vertical, 5).background(CompassTheme.cardinal)
    }
    private var mapToolbar: some View {
        HStack(alignment: .top, spacing: 8) {
            VStack(alignment: .leading, spacing: 4) {
                if store.buildingId != nil {
                    Button { store.campus() } label: { Label("Campus", systemImage: "chevron.left").font(.caption.weight(.semibold)) }
                } else { Text("EXPLORE USC").font(.caption2.weight(.bold)).tracking(1.6).foregroundStyle(CompassTheme.cardinal) }
                Text(store.buildingId ?? "University Park").font(.title2.weight(.bold))
                Text(store.buildingId == nil ? "Find your place on campus." : store.buildingName).font(.caption).foregroundStyle(.secondary).lineLimit(2)
            }
            Spacer(minLength: 6)
            if store.buildingId != nil {
                Menu {
                    ForEach(store.floorIDs, id: \.self) { id in Button(floorLabel(id)) { store.setFloor(id) } }
                    Divider()
                    Button("All floors") { store.allFloors = true; store.picking = nil; store.selectedPlace = nil }
                } label: {
                    Label(store.allFloors ? "All floors" : (store.floorId == "0" ? "B" : "F\(store.floorId)"), systemImage: "square.3.layers.3d")
                        .font(.subheadline.weight(.semibold)).padding(12).background(.white, in: Capsule())
                }.accessibilityLabel("Choose floor")
            }
            VStack(spacing: 8) {
                Button { store.cameraReset += 1; store.campusReset += 1 } label: { Image(systemName: "scope").frame(width: 44, height: 44).background(.white, in: Circle()) }.accessibilityLabel("Reset map view")
                if store.buildingId != nil {
                    ShareLink(item: store.shareURL) { Image(systemName: "square.and.arrow.up").frame(width: 44, height: 44).background(.white, in: Circle()) }.accessibilityLabel("Share map location")
                }
            }
        }.padding(16).background(LinearGradient(colors: [.white.opacity(0.98), .white.opacity(0.75), .white.opacity(0)], startPoint: .top, endPoint: .bottom))
    }
    private var bottomBar: some View {
        HStack(spacing: 0) {
            ForEach([Tool.search, .directions, .chat, .layers]) { tool in
                Button { store.setTool(tool) } label: {
                    VStack(spacing: 5) {
                        Image(systemName: tool.symbol).font(.system(size: 21, weight: .medium)).frame(height: 24)
                        Text(tool.rawValue).font(.caption2.weight(.semibold))
                    }.frame(maxWidth: .infinity).frame(height: 62)
                }.buttonStyle(.plain).foregroundStyle(CompassTheme.cardinal)
            }
        }.padding(.horizontal, 8).background(.regularMaterial).overlay(alignment: .top) { Divider() }
    }
}

struct CampusMap: View {
    @ObservedObject var store: CompassStore
    @State private var position: MapCameraPosition = .region(Self.region)
    static let region = MKCoordinateRegion(center: CLLocationCoordinate2D(latitude: 34.0211, longitude: -118.2853), span: MKCoordinateSpan(latitudeDelta: 0.012, longitudeDelta: 0.012))
    var locations: [CampusLocation] {
        let bundled = store.catalog?.locations ?? []
        if store.source == .live {
            let live = store.liveDirectory.compactMap { b -> CampusLocation? in
                guard let p = b.location else { return nil }
                return CampusLocation(id: b.id, code: b.code, name: b.name, category: "Buildings", latitude: p.latitude, longitude: p.longitude,
                    paths: [], interiorId: b.capabilities.interiorScene ? b.id : nil, aliases: b.aliases)
            }
            return (store.showBuildings ? live : []) + (store.showParking ? bundled.filter { $0.category == "Parking" } : [])
        }
        return bundled.filter { ($0.category == "Buildings" && store.showBuildings) || ($0.category == "Parking" && store.showParking) }
    }
    var body: some View {
        Map(position: $position) {
            ForEach(locations) { l in
                if l.paths.count > 2 {
                    MapPolygon(coordinates: l.paths.compactMap { $0.count == 2 ? CLLocationCoordinate2D(latitude: $0[0], longitude: $0[1]) : nil })
                        .foregroundStyle((l.category == "Parking" ? CompassTheme.blue : CompassTheme.cardinal).opacity(l.interiorId != nil ? 0.22 : 0.06))
                }
                if l.interiorId != nil || l.category == "Parking" {
                    Annotation(l.code.isEmpty ? l.name : l.code, coordinate: CLLocationCoordinate2D(latitude: l.latitude, longitude: l.longitude), anchor: .bottom) {
                        Button { store.selectCampus(l) } label: {
                            HStack(spacing: 5) {
                                Image(systemName: l.category == "Parking" ? "parkingsign" : "building.2.fill").font(.caption)
                                Text(l.code.isEmpty ? "P" : l.code).font(.caption.weight(.bold))
                            }.padding(.horizontal, 10).padding(.vertical, 9).foregroundStyle(.white)
                                .background(l.category == "Parking" ? CompassTheme.blue : CompassTheme.cardinal, in: Capsule())
                                .overlay(Capsule().stroke(.white, lineWidth: 2)).shadow(color: .black.opacity(0.15), radius: 4, y: 2)
                        }.buttonStyle(.plain).accessibilityLabel("\(l.name), \(l.interiorId != nil ? "open interior" : "interior unavailable")")
                    }.annotationTitles(.hidden)
                }
            }
            if let route = store.route {
                ForEach(Array(route.legs.enumerated()), id: \.offset) { _, leg in
                    if case .outdoor(let l) = leg {
                        MapPolyline(coordinates: l.points.map { CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude) }).stroke(CompassTheme.cardinal, lineWidth: 5)
                    }
                }
            }
        }
        .mapStyle(.standard(elevation: .flat, pointsOfInterest: .excludingAll))
        .mapControls { MapCompass(); MapScaleView() }
        .onChange(of: store.campusReset) { _, _ in withAnimation { position = .region(Self.region) } }
        .overlay(alignment: .bottomLeading) {
            Label("\(store.isPreview ? "Preview interiors" : "Connected API") · Apple Maps", systemImage: "map")
                .font(.caption2).padding(8).background(.regularMaterial, in: Capsule()).padding(12)
        }
    }
}
