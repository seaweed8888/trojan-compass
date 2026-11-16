import SwiftUI
import WebKit
import UniformTypeIdentifiers
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// Serves only checked-in web assets. This is an app-bundle origin, not a localhost server.
final class ReplicaResourceHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "compass-web"
    let root = AppResources.root.appendingPathComponent("Replica").resolvingSymlinksInPath()

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        do {
            guard let url = task.request.url, url.scheme == Self.scheme, url.host == "bundle" else { throw URLError(.badURL) }
            let path = url.path.removingPercentEncoding ?? url.path
            let file = root.appendingPathComponent(path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))).standardizedFileURL.resolvingSymlinksInPath()
            guard file.path.hasPrefix(root.path + "/") else { throw URLError(.noPermissionsToReadFile) }
            let data = try Data(contentsOf: file)
            let mime: String
            if file.lastPathComponent.hasPrefix("css") || file.pathExtension == "css" { mime = "text/css" }
            else if file.pathExtension == "js" { mime = "text/javascript" }
            else if file.pathExtension == "woff2" { mime = "font/woff2" }
            else if data.starts(with: [0x89, 0x50, 0x4e, 0x47]) { mime = "image/png" }
            else { mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream" }
            let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: [
                "Content-Type": mime, "Content-Length": String(data.count), "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=31536000"
            ])!
            task.didReceive(response); task.didReceive(data); task.didFinish()
        } catch { task.didFailWithError(error) }
    }
    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}

@MainActor
final class ReplicaController: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    @Published var failure: String?
    weak var webView: WKWebView?
    private var apiTasks: [String: Task<Void, Never>] = [:]
    private var currentURL = URL(string: "compass-web://bundle/campus/index.html")!

    func makeWebView() -> WKWebView {
        let config = WKWebViewConfiguration()
        // Bundled pages have no accounts; a fresh session also avoids stale UI after app updates.
        config.websiteDataStore = .nonPersistent()
        config.setURLSchemeHandler(ReplicaResourceHandler(), forURLScheme: ReplicaResourceHandler.scheme)
        config.userContentController.add(self, name: "replica")
        let bridge = """
        (() => {
          const send = payload => window.webkit.messageHandlers.replica.postMessage(payload);
          // Preserve the original Copy link button on the app's local origin.
          try { Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText: text => {
            send({type:'copy', text:String(text)}); return Promise.resolve();
          }}}); } catch (_) {}
          window.addEventListener('error', e => { if (e instanceof ErrorEvent && e.error) send({type:'page_error'}); });
        })();
        """
        config.userContentController.addUserScript(WKUserScript(source: bridge, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        let web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self; web.uiDelegate = self
        #if os(iOS)
        web.isOpaque = false; web.backgroundColor = .white
        web.scrollView.isScrollEnabled = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.allowsBackForwardNavigationGestures = true
        #endif
        webView = web; web.load(URLRequest(url: currentURL))
        return web
    }
    func retry() { failure = nil; webView?.load(URLRequest(url: currentURL)) }

    static func bundledURL(for url: URL) -> URL? {
        if url.scheme == ReplicaResourceHandler.scheme, url.host == "bundle" {
            if url.path == "/" || url.path.isEmpty { return URL(string: "compass-web://bundle/campus/index.html") }
            return url
        }
        let local = ["localhost", "127.0.0.1"].contains(url.host ?? "")
        let custom = url.scheme == "trojancompass"
        guard local || custom else { return nil }
        let query = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
        let isCampus = (local && url.port == 3001) || (custom && query.contains { $0.name == "campus" })
        let isInterior = (local && url.port == 3000) || custom
        guard isCampus || isInterior else { return nil }
        var c = URLComponents(); c.scheme = ReplicaResourceHandler.scheme; c.host = "bundle"
        c.path = isCampus ? "/campus/index.html" : "/interior/index.html"
        c.queryItems = isCampus ? nil : query
        return c.url
    }
    func openLink(_ url: URL) {
        guard let local = Self.bundledURL(for: url) else { return }
        failure = nil; currentURL = local; webView?.load(URLRequest(url: local))
    }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { decisionHandler(.cancel); return }
        if url.scheme == ReplicaResourceHandler.scheme, url.host == "bundle", url.path != "/", !url.path.isEmpty { currentURL = url; decisionHandler(.allow); return }
        if let local = Self.bundledURL(for: url) { decisionHandler(.cancel); currentURL = local; webView.load(URLRequest(url: local)); return }
        if ["about", "blob", "data"].contains(url.scheme ?? "") { decisionHandler(.allow); return }
        decisionHandler(.cancel)
        if action.navigationType == .linkActivated || action.targetFrame == nil { openExternal(url) }
    }
    private func openExternal(_ url: URL) {
        guard ["https", "http", "mailto", "tel"].contains(url.scheme?.lowercased() ?? "") else { return }
        #if os(iOS)
        UIApplication.shared.open(url)
        #else
        NSWorkspace.shared.open(url)
        #endif
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url {
            if let local = Self.bundledURL(for: url) { openLink(local) }
            else { openExternal(url) }
        }
        return nil
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { handle(error) }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { handle(error) }
    private func handle(_ error: Error) {
        if (error as NSError).code != NSURLErrorCancelled { failure = "The bundled map could not load. Please try again." }
    }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { failure = "The map stopped responding. Please reload it." }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, message.webView === webView,
              message.frameInfo.request.url?.scheme == ReplicaResourceHandler.scheme,
              message.frameInfo.request.url?.host == "bundle",
              let body = message.body as? [String: Any] else { return }
        if body["type"] as? String == "api_cancel", let id = body["id"] as? String {
            apiTasks.removeValue(forKey: id)?.cancel()
            return
        }
        if body["type"] as? String == "api_request", let id = body["id"] as? String, UUID(uuidString: id) != nil {
            guard apiTasks[id] == nil, apiTasks.count < 64 else { return }
            let pageURL = message.frameInfo.request.url
            apiTasks[id] = Task { [weak self] in
                guard let self else { return }
                defer { self.apiTasks[id] = nil }
                var reply: [String: Any] = ["id": id]
                do {
                    let request = try Self.apiRequest(body)
                    let (data, response) = try await URLSession.shared.data(for: request)
                    try Task.checkCancellation()
                    guard let response = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
                    reply["status"] = response.statusCode
                    reply["body"] = String(data: data, encoding: .utf8) ?? ""
                } catch {
                    if Task.isCancelled { return }
                    reply["error"] = error.localizedDescription
                }
                guard self.webView?.url == pageURL else { return }
                self.webView?.callAsyncJavaScript("window.CompassReplicaTransport?.receive(message)",
                    arguments: ["message": reply], in: nil, in: .page, completionHandler: nil)
            }
            return
        }
        if body["type"] as? String == "page_error" { failure = "The bundled page encountered an error. Please reload it." }
        if body["type"] as? String == "copy", let text = body["text"] as? String, text.count <= 8192 {
            #if os(iOS)
            UIPasteboard.general.string = text
            #else
            NSPasteboard.general.clearContents(); NSPasteboard.general.setString(text, forType: .string)
            #endif
        }
    }
    /// Transport only: preserve the shared API payload and server response unchanged.
    static func apiRequest(_ message: [String: Any], baseURL: URL? = nil) throws -> URLRequest {
        let configured = ProcessInfo.processInfo.environment["COMPASS_API_BASE_URL"]
            ?? UserDefaults.standard.string(forKey: "compass.apiURL")
            ?? Bundle.main.object(forInfoDictionaryKey: "CompassAPIBaseURL") as? String ?? ""
        guard let base = baseURL ?? URL(string: configured),
              base.host != nil, base.user == nil, base.password == nil, base.query == nil, base.fragment == nil,
              base.path.trimmingCharacters(in: CharacterSet(charactersIn: "/")) == "api" else {
            throw NSError(domain: "CompassAPI", code: 1, userInfo: [NSLocalizedDescriptionKey:
                "Configure COMPASS_API_BASE_URL in the Xcode build settings to point to the shared backend (/api)."])
        }
        #if DEBUG
        let validScheme = ["https", "http"].contains(base.scheme ?? "")
        #else
        let validScheme = base.scheme == "https"
        #endif
        guard validScheme, let path = message["path"] as? String,
              path.hasPrefix("/api/"), !path.contains("\\"), !path.contains("#"),
              let relative = URLComponents(string: path), relative.scheme == nil, relative.host == nil,
              !relative.path.split(separator: "/").contains(".."),
              let method = message["method"] as? String, ["GET", "POST"].contains(method),
              var target = URLComponents(url: base, resolvingAgainstBaseURL: false) else { throw URLError(.badURL) }
        target.path = relative.path
        target.percentEncodedQuery = relative.percentEncodedQuery
        guard let url = target.url else { throw URLError(.badURL) }
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 60)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if method == "POST", let body = message["body"] as? String {
            guard body.utf8.count <= 1_048_576 else { throw URLError(.dataLengthExceedsMaximum) }
            request.httpBody = Data(body.utf8)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        return request
    }
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        for task in apiTasks.values { task.cancel() }
        apiTasks.removeAll()
    }
    func tearDown() {
        for task in apiTasks.values { task.cancel() }
        apiTasks.removeAll()
        webView?.stopLoading(); webView?.configuration.userContentController.removeScriptMessageHandler(forName: "replica")
        webView?.navigationDelegate = nil; webView?.uiDelegate = nil; webView = nil
    }
}

struct WebsiteReplica: View {
    @StateObject private var controller = ReplicaController()
    var body: some View {
        ZStack {
            ReplicaWebView(controller: controller)
            if let failure = controller.failure {
                VStack(spacing: 14) { Text(failure).multilineTextAlignment(.center); Button("Reload map") { controller.retry() } }
                    .padding(24).background(.regularMaterial, in: RoundedRectangle(cornerRadius: 18)).padding()
            }
        }.background(.white).onOpenURL { controller.openLink($0) }
    }
}

#if os(iOS)
struct ReplicaWebView: UIViewRepresentable {
    let controller: ReplicaController
    func makeUIView(context: Context) -> WKWebView { controller.makeWebView() }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
    static func dismantleUIView(_ uiView: WKWebView, coordinator: ()) {
        (uiView.navigationDelegate as? ReplicaController)?.tearDown()
    }
}
#else
struct ReplicaWebView: NSViewRepresentable {
    let controller: ReplicaController
    func makeNSView(context: Context) -> WKWebView { controller.makeWebView() }
    func updateNSView(_ nsView: WKWebView, context: Context) {}
    static func dismantleNSView(_ nsView: WKWebView, coordinator: ()) {
        (nsView.navigationDelegate as? ReplicaController)?.tearDown()
    }
}
#endif
