import SwiftUI
import WebKit

@MainActor
final class ViewerCoordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
    weak var webView: WKWebView?
    let store: CompassStore
    private var ready = false
    private var lastPayload: Data?
    private var pendingMessageID: String?
    private var timeout: Task<Void, Never>?
    init(store: CompassStore) { self.store = store }

    func configure(_ web: WKWebView) {
        webView = web; web.navigationDelegate = self
        let root = AppResources.root.appendingPathComponent("Viewer")
        web.loadFileURL(root.appendingPathComponent("index.html"), allowingReadAccessTo: root)
        timeout = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 20_000_000_000)
            guard !Task.isCancelled, let self, !ready else { return }
            store.viewerError = "The interior viewer did not start. Return to campus and reopen the building."
        }
    }
    func send() {
        guard ready, let webView, let building = store.buildingId else { return }
        let payload = store.viewerPayload(building)
        guard let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]), data != lastPayload else { return }
        lastPayload = data
        let messageID = UUID().uuidString; pendingMessageID = messageID
        let message: [String: Any] = ["protocolVersion": 1, "messageId": messageID, "kind": "command", "dataVersion": store.dataVersion, "payload": payload]
        webView.callAsyncJavaScript("window.CompassViewer.receive(message)", arguments: ["message": message], in: nil, in: .page) { [weak self] result in
            if case .failure(let error) = result {
                Task { @MainActor in self?.store.viewerError = "The map could not update: \(error.localizedDescription)" }
            }
        }
    }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, message.webView === webView,
              let envelope = message.body as? [String: Any], envelope["protocolVersion"] as? Int == 1,
              let kind = envelope["kind"] as? String, let payload = envelope["payload"] as? [String: Any] else { return }
        if kind == "viewer_ready" { ready = true; timeout?.cancel(); send(); return }
        if kind == "viewer_error" { store.viewerError = payload["message"] as? String; return }
        guard envelope["dataVersion"] as? String == store.dataVersion else { return }
        if kind == "ack" {
            guard payload["replyTo"] as? String == pendingMessageID else { return }
            if payload["success"] as? Bool != true { store.viewerError = payload["message"] as? String ?? "Map update failed." }
        } else if kind == "floor_selected", let id = payload["floorId"] as? String { store.setFloor(id) }
        else if kind == "move_origin" { store.startPicking(.origin) }
        else if kind == "place_selected", let id = payload["placeId"] as? String,
                let p = store.places.first(where: { $0.id == id }), p.buildingId == store.buildingId {
            store.cancelPendingChat(); store.selectedPlace = p
            if !store.allFloors { store.floorId = p.floorId }
        } else if kind == "position_picked", let field = store.picking {
            let isPreview = store.source == .preview
            let building = (payload["buildingId"] ?? payload["building"]) as? String
            let floor = payload["floorId"] as? String ?? (payload["floor"] as? Int).map(String.init)
            guard building == store.buildingId, floor == store.floorId,
                  payload["coordinateSpace"] as? String == (isPreview ? "preview-meters" : "canonical-meters") else { return }
            let point = payload["position"] as? [String: Double]
            guard let x = point?["x"] ?? payload["x"] as? Double,
                  let z = point?["z"] ?? payload["z"] as? Double, x.isFinite, z.isFinite else { return }
            let placeId = payload["placeId"] as? String
            if let placeId, !store.places.contains(where: { $0.id == placeId && $0.floorId == floor }) { return }
            let y = point?["y"] ?? (Double(floor ?? "1")! - 1) * 3.4
            store.setEndpoint(SelectedLocation(buildingId: building!, floorId: floor!, label: payload["label"] as? String ?? "Selected floor area", placeId: placeId,
                position: Vector3(x: x, y: y, z: z), coordinateSpace: isPreview ? "preview-meters" : "canonical-meters"), field: field)
        }
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { store.viewerError = error.localizedDescription }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { store.viewerError = error.localizedDescription }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { store.viewerError = "The map stopped responding. Return to campus and reopen it." }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        // The bridge is available only to the bundled page, never a remote navigation.
        decisionHandler(action.request.url?.isFileURL == true ? .allow : .cancel)
    }
    func tearDown() {
        timeout?.cancel(); webView?.stopLoading()
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "compass")
        webView?.navigationDelegate = nil; webView = nil
    }
}

#if os(iOS)
struct InteriorViewer: UIViewRepresentable {
    @ObservedObject var store: CompassStore
    func makeCoordinator() -> ViewerCoordinator { ViewerCoordinator(store: store) }
    func makeUIView(context: Context) -> WKWebView {
        let c = WKWebViewConfiguration(); c.userContentController.add(context.coordinator, name: "compass")
        let web = WKWebView(frame: .zero, configuration: c)
        web.isOpaque = false; web.backgroundColor = .white
        web.scrollView.isScrollEnabled = false
        context.coordinator.configure(web); return web
    }
    func updateUIView(_ uiView: WKWebView, context: Context) { context.coordinator.send() }
    static func dismantleUIView(_ uiView: WKWebView, coordinator: ViewerCoordinator) { coordinator.tearDown() }
}
#else
struct InteriorViewer: NSViewRepresentable {
    @ObservedObject var store: CompassStore
    func makeCoordinator() -> ViewerCoordinator { ViewerCoordinator(store: store) }
    func makeNSView(context: Context) -> WKWebView {
        let c = WKWebViewConfiguration(); c.userContentController.add(context.coordinator, name: "compass")
        let web = WKWebView(frame: .zero, configuration: c)
        context.coordinator.configure(web); return web
    }
    func updateNSView(_ nsView: WKWebView, context: Context) { context.coordinator.send() }
    static func dismantleNSView(_ nsView: WKWebView, coordinator: ViewerCoordinator) { coordinator.tearDown() }
}
#endif

extension CompassStore {
    func viewerPayload(_ id: String) -> [String: Any] {
        func point(_ p: Vector3) -> [String: Double] { ["x": p.x, "y": p.y, "z": p.z] }
        var payload: [String: Any] = ["source": source.rawValue, "buildingId": id, "floorId": floorId, "allFloors": allFloors,
            "layers": layers.sorted(), "reset": cameraReset, "reduceMotion": reduceMotion]
        if let p = selectedPlace { payload["selectedPlaceId"] = p.id }
        if let picking { payload["picking"] = picking.rawValue }
        if let origin { payload["origin"] = ["buildingId": origin.buildingId, "floorId": origin.floorId, "label": origin.label,
                                              "x": origin.position.x, "y": origin.position.y, "z": origin.position.z] }
        if source == .live {
            payload["floors"] = liveFloors.compactMap { f -> [String: Any]? in
                guard let g = f.geometry else { return nil }
                let objects: [[String: Any]] = g.objects.compactMap { o in
                    switch o {
                    case .box(let b):
                        var v: [String: Any] = ["kind": b.kind, "objectKey": b.objectKey, "role": b.role, "pickable": b.pickable,
                            "center": point(b.center), "size": point(b.size), "yawRadians": b.yawRadians]
                        if let p = b.placeId { v["placeId"] = p }; return v
                    case .mesh(let m):
                        var v: [String: Any] = ["kind": m.kind, "objectKey": m.objectKey, "role": m.role, "pickable": m.pickable,
                            "vertices": m.vertices.map(point), "triangles": m.triangles]
                        if let p = m.placeId { v["placeId"] = p }; return v
                    case .unknown: return nil
                    }
                }
                return ["id": f.floor.id, "elevation": f.floor.elevationMeters,
                    "bounds": ["min": point(g.bounds.min), "max": point(g.bounds.max)], "objects": objects,
                    "places": f.places.map { p -> [String: Any] in
                        ["id": p.id, "label": p.displayLabel, "kind": p.kind, "position": point(p.position), "isRamp": p.access.isRamp == true]
                    }]
            }
            if let route {
                payload["route"] = ["legs": route.legs.compactMap { leg -> [String: Any]? in
                    if case .indoor(let l) = leg { return ["id": l.id, "kind": l.kind, "buildingId": l.buildingId, "floorId": l.floorId, "points": l.points.map(point)] }
                    if case .vertical(let l) = leg { return ["id": l.id, "kind": l.kind, "buildingId": l.buildingId,
                        "fromFloorId": l.fromFloorId, "toFloorId": l.toFloorId, "connectorKind": l.connectorKind,
                        "connectorId": l.connectorId, "points": l.points.map(point)] }
                    return nil
                }]
            }
        }
        return payload
    }
}
