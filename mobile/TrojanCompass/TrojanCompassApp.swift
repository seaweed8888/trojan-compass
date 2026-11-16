import SwiftUI

@main
struct TrojanCompassApp: App {
    @StateObject private var store = CompassStore()
    var body: some Scene {
        WindowGroup {
            Group {
                if ProcessInfo.processInfo.arguments.contains("--native-integration") {
                    CompassRoot(store: store)
                } else {
                    WebsiteReplica()
                }
            }
                .tint(CompassTheme.cardinal)
                .preferredColorScheme(.light)
                #if os(macOS)
                .frame(width: 393, height: 852)
                #endif
        }
        #if os(macOS)
        .defaultSize(width: 393, height: 852)
        .windowResizability(.contentSize)
        #endif
    }
}

enum CompassTheme {
    static let cardinal = Color(red: 0.6, green: 0, blue: 0)
    static let gold = Color(red: 1, green: 0.8, blue: 0)
    static let paper = Color(red: 0.97, green: 0.96, blue: 0.94)
    static let blue = Color(red: 0.12, green: 0.36, blue: 0.66)
}
