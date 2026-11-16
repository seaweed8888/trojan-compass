import SwiftUI

struct ToolPanel: View {
    @ObservedObject var store: CompassStore
    let tool: Tool
    var body: some View {
        Group {
            switch tool {
            case .search: SearchPanel(store: store)
            case .directions: DirectionsPanel(store: store)
            case .chat: ChatPanel(store: store)
            case .layers: LayerPanel(store: store)
            case .settings: SettingsPanel(store: store)
            }
        }.background(CompassTheme.paper)
    }
}

struct SearchPanel: View {
    @ObservedObject var store: CompassStore
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    Image(systemName: "magnifyingglass").foregroundStyle(CompassTheme.cardinal)
                    TextField("Building or room · LAW 101", text: $store.query)
                        .textFieldStyle(.plain).onSubmit { store.submitSearch() }
                        .onChange(of: store.query) { _, q in store.search(q) }
                    if !store.query.isEmpty { Button { store.query = "" } label: { Image(systemName: "xmark.circle.fill") }.accessibilityLabel("Clear search") }
                }.padding(15).background(.white, in: RoundedRectangle(cornerRadius: 14))
                HStack { Text(store.query.isEmpty ? "EXPLORE BUILDINGS" : "MATCHING LOCATIONS").font(.caption.weight(.bold)).tracking(1.2); Spacer(); if store.searchLoading { ProgressView() } }.foregroundStyle(.secondary)
                if let error = store.searchError { InlineNotice(text: error) }
                else if store.suggestions.isEmpty && !store.searchLoading {
                    Text("No matching locations. Try a building code or a room, such as LAW 101.").font(.subheadline).foregroundStyle(.secondary)
                }
                VStack(spacing: 0) {
                    ForEach(store.suggestions) { suggestion in
                        Button { store.choose(suggestion) } label: { SuggestionRow(suggestion: suggestion) }.buttonStyle(.plain)
                        Divider().padding(.leading, 54)
                    }
                }.background(.white, in: RoundedRectangle(cornerRadius: 16))
                if store.buildingId != nil {
                    Text("ON THIS FLOOR").font(.caption.weight(.bold)).tracking(1.2).foregroundStyle(.secondary)
                    ForEach(store.currentFloorPlaces) { p in
                        Button {
                            store.choose(SearchSuggestion(id: p.id, title: p.label, detail: p.detail, place: p, campus: nil, buildingId: p.buildingId))
                        } label: {
                            HStack { Text(p.label).fontWeight(.medium); Spacer(); Text(p.kind.capitalized).font(.caption).foregroundStyle(.secondary) }.padding(12).background(.white, in: RoundedRectangle(cornerRadius: 12))
                        }.buttonStyle(.plain)
                    }
                }
                if store.isPreview { Text("Preview maps include a traced LAW layout and generated interiors. They are not verified campus directions.").font(.caption).foregroundStyle(.secondary) }
            }.padding(20)
        }
    }
}
struct SuggestionRow: View {
    let suggestion: SearchSuggestion
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: suggestion.place == nil ? "building.2" : "door.left.hand.open").foregroundStyle(CompassTheme.cardinal).frame(width: 28, height: 36)
            VStack(alignment: .leading, spacing: 4) { Text(suggestion.title).font(.subheadline.weight(.semibold)); Text(suggestion.detail).font(.caption).foregroundStyle(.secondary).lineLimit(2) }
            Spacer()
            Image(systemName: "arrow.up.left").font(.caption).foregroundStyle(.tertiary)
        }.padding(14).contentShape(Rectangle())
    }
}

struct DirectionsPanel: View {
    @ObservedObject var store: CompassStore
    @FocusState private var focused: EndpointField?
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                VStack(spacing: 0) {
                    endpoint(.origin, title: "Current location", symbol: "circle.inset.filled", text: Binding(get: { store.originText }, set: { store.editEndpoint($0, field: .origin) }))
                    Divider().padding(.leading, 48)
                    endpoint(.destination, title: "Destination", symbol: "mappin.circle.fill", text: Binding(get: { store.destinationText }, set: { store.editEndpoint($0, field: .destination) }))
                }.background(.white, in: RoundedRectangle(cornerRadius: 16))
                if store.picking != nil { Text("The map stays interactive above this panel. Change floors if needed, then tap a valid floor area. Cancel keeps the previous endpoint.").font(.caption).foregroundStyle(.secondary) }
                if focused != nil {
                    if store.searchLoading { ProgressView("Finding places…") }
                    if let error = store.searchError { InlineNotice(text: error) }
                    ForEach(store.suggestions) { suggestion in
                        Button { store.choose(suggestion, field: focused); focused = nil } label: { SuggestionRow(suggestion: suggestion) }.buttonStyle(.plain).background(.white, in: RoundedRectangle(cornerRadius: 12))
                    }
                    if store.stepFree && store.suggestions.isEmpty {
                        Text("Only locations with verified step-free access can be suggested. Preview accessibility is unknown.").font(.caption).foregroundStyle(.secondary)
                    }
                }
                Menu {
                    ForEach(store.places.filter { $0.kind == "entrance" && (!store.stepFree || $0.stepFreeAccess == "verified_yes") }) { p in
                        Button(p.label) { store.setEndpoint(SelectedLocation(place: p, source: store.source), field: .origin) }
                    }
                } label: { Label("Outside the building · choose an entrance", systemImage: "door.left.hand.open").font(.subheadline) }
                    .disabled(store.buildingId == nil)
                VStack(alignment: .leading, spacing: 14) {
                    Toggle(isOn: $store.stepFree) {
                        Label { VStack(alignment: .leading, spacing: 3) { Text("Accessibility").font(.subheadline.weight(.semibold)); Text("Step-free entrances and elevator access.").font(.caption).foregroundStyle(.secondary) } } icon: { Image(systemName: "figure.roll").foregroundStyle(CompassTheme.blue) }
                    }.onChange(of: store.stepFree) { _, _ in store.accessibilityChanged() }
                    Picker("Travel preference", selection: $store.routeMode) {
                        Text("Stairs").tag("stairs").disabled(store.stepFree)
                        Text("Elevators").tag("elevator")
                    }.pickerStyle(.segmented).onChange(of: store.routeMode) { _, _ in store.invalidateRoute() }
                }.padding(16).background(.white, in: RoundedRectangle(cornerRadius: 16))
                Button { focused = nil; Task { await store.calculateRoute() } } label: {
                    HStack { if store.routeLoading { ProgressView().tint(.white) }; Text(store.routeLoading ? "Finding your route…" : "Get directions").fontWeight(.semibold); Image(systemName: "arrow.right") }.frame(maxWidth: .infinity).padding(16)
                }.buttonStyle(.plain).foregroundStyle(.white).background(CompassTheme.cardinal, in: RoundedRectangle(cornerRadius: 15)).disabled(store.routeLoading)
                if let error = store.routeError { InlineNotice(text: error) }
                if let route = store.route {
                    Button("Clear route") { store.invalidateRoute() }
                    ForEach(route.warnings, id: \.code) { InlineNotice(text: $0.message) }
                }
                if !store.canRoute { Label("Routing preview — endpoints and preferences work. A connected routing service is required for directions.", systemImage: "info.circle").font(.caption).foregroundStyle(.secondary) }
            }.padding(20)
        }.onChange(of: focused) { _, field in
            if let field { store.search(field == .origin ? store.originText : store.destinationText, field: field) }
        }
    }
    func endpoint(_ field: EndpointField, title: String, symbol: String, text: Binding<String>) -> some View {
        HStack(spacing: 12) {
            Image(systemName: symbol).foregroundStyle(field == .origin ? CompassTheme.gold : CompassTheme.cardinal).frame(width: 22)
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.caption2.weight(.semibold)).foregroundStyle(.secondary)
                TextField("Building, room or pick on map", text: text).textFieldStyle(.plain).font(.subheadline).focused($focused, equals: field)
                    .onSubmit {
                        if let match = store.suggestions.first(where: { normalized($0.title) == normalized(text.wrappedValue) }) {
                            store.choose(match, field: field); focused = nil
                        }
                    }
            }
            Button { focused = nil; store.startPicking(field) } label: { Image(systemName: "hand.tap").frame(width: 44, height: 44) }.accessibilityLabel("Pick \(title.lowercased()) on map")
        }.padding(.leading, 14).padding(.trailing, 4).padding(.vertical, 7)
    }
}

struct ChatPanel: View {
    @ObservedObject var store: CompassStore
    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        if store.conversation.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Image(systemName: "sparkles").font(.title).foregroundStyle(CompassTheme.cardinal)
                                Text("Meet Compass.").font(.title2.weight(.bold))
                                Text("Ask about a room, explore a building, or find a route across campus.").font(.subheadline).foregroundStyle(.secondary)
                                if !store.canChat { Text("Preview mode · Connect the shared API in Settings to start a conversation.").font(.caption).foregroundStyle(CompassTheme.cardinal) }
                            }.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(.white, in: RoundedRectangle(cornerRadius: 20))
                        }
                        ForEach(store.conversation) { message in
                            HStack {
                                if message.role == "user" { Spacer(minLength: 30) }
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(message.role == "user" ? "You" : "Compass").font(.caption2.weight(.bold))
                                    Text(message.text).font(.subheadline).textSelection(.enabled)
                                    if message.failed { Label("Not delivered", systemImage: "exclamationmark.circle").font(.caption) }
                                }.padding(14).foregroundStyle(message.role == "user" ? Color.white : .primary)
                                    .background(message.role == "user" ? CompassTheme.cardinal : .white, in: RoundedRectangle(cornerRadius: 18))
                                if message.role != "user" { Spacer(minLength: 30) }
                            }.id(message.id)
                        }
                        if store.chatLoading { HStack { ProgressView(); Text("Compass is thinking…").font(.caption) } }
                        if let error = store.chatError {
                            InlineNotice(text: error)
                            if store.canChat { Button("Retry message") { Task { await store.sendChat(retry: true) } } }
                        }
                        Color.clear.frame(height: 1).id("bottom")
                    }.padding(20)
                }.onChange(of: store.conversation.count) { _, _ in proxy.scrollTo("bottom", anchor: .bottom) }
            }
            HStack(alignment: .bottom, spacing: 10) {
                TextField("Ask Compass…", text: $store.chatDraft, axis: .vertical).lineLimit(1...5).textFieldStyle(.plain).padding(12).background(.white, in: RoundedRectangle(cornerRadius: 16)).accessibilityLabel("Message to Compass")
                Button { Task { await store.sendChat() } } label: { Image(systemName: "arrow.up").font(.headline).foregroundStyle(.white).frame(width: 44, height: 44).background(CompassTheme.cardinal, in: Circle()) }
                    .disabled(store.chatDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || store.chatLoading).accessibilityLabel("Send message")
            }.padding(16).background(.regularMaterial)
        }
    }
}

struct LayerPanel: View {
    @ObservedObject var store: CompassStore
    var body: some View {
        Form {
            Section("Campus map") {
                Toggle("Buildings", isOn: $store.showBuildings)
                Toggle("Parking", isOn: $store.showParking)
            }
            Section("Interior map") {
                ForEach(MapLayer.all) { layer in
                    Toggle(isOn: Binding(get: { store.layers.contains(layer.id) }, set: { on in if on { store.layers.insert(layer.id) } else { store.layers.remove(layer.id) } })) {
                        Label(layer.title, systemImage: layer.symbol)
                            .foregroundStyle(layer.id == "ramps" || layer.id == "elevators" ? CompassTheme.blue : layer.id == "exits" ? .red : layer.id == "entrances" ? .green : .primary)
                    }
                }
            }
            Section { Text("Ramp markers require explicit ramp data. Marker visibility does not verify accessibility or evacuation routes.").font(.caption).foregroundStyle(.secondary) }
        }.formStyle(.grouped)
    }
}

struct SettingsPanel: View {
    @ObservedObject var store: CompassStore
    var body: some View {
        Form {
            Section("Data connection") {
                Label(store.isPreview ? "Preview data" : "Shared API connected", systemImage: store.isPreview ? "square.stack.3d.up" : "network").font(.headline)
                Text(store.isPreview ? "Browse the bundled campus directory and nine preview interiors without a backend. Routes and Compass require a connected service." : "Snapshot: \(store.dataVersion)").font(.caption).foregroundStyle(.secondary)
                TextField("https://your-host/api", text: $store.apiURL).textFieldStyle(.roundedBorder)
                    #if os(iOS)
                    .textInputAutocapitalization(.never).autocorrectionDisabled().keyboardType(.URL)
                    #endif
                Button { Task { await store.connect() } } label: { if store.loading { ProgressView() } else { Text("Connect shared API") } }.disabled(store.loading)
                if !store.isPreview { Button("Use preview data") { store.usePreview() } }
            }
            Section("About this build") {
                Text("Trojan Compass").font(.headline)
                Text("SwiftUI · iOS 17 or later").font(.subheadline)
                Text("Campus geography is bundled from the repository directory; the basemap is provided by Apple Maps. LAW is a traced preview; other interiors are generated. No indoor GPS or verified campus navigation is included.").font(.caption).foregroundStyle(.secondary)
                Text("Chat stays in memory during this session. The app saves only the API URL and does not contain AI provider keys.").font(.caption).foregroundStyle(.secondary)
            }
        }.formStyle(.grouped)
    }
}

struct InlineNotice: View {
    let text: String
    var body: some View { Label(text, systemImage: "info.circle").font(.subheadline).foregroundStyle(CompassTheme.cardinal).frame(maxWidth: .infinity, alignment: .leading).padding(14).background(CompassTheme.cardinal.opacity(0.06), in: RoundedRectangle(cornerRadius: 12)).accessibilityAddTraits(.updatesFrequently) }
}
