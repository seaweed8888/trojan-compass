// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "TrojanCompass",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.executable(name: "TrojanCompass", targets: ["TrojanCompass"])],
    targets: [
        .executableTarget(name: "TrojanCompass", path: "TrojanCompass", exclude: ["Info.plist", "Info-Debug.plist"],
                          resources: [.copy("Resources"), .process("Assets.xcassets")]),
        .testTarget(name: "CompassTests", dependencies: ["TrojanCompass"],
                    path: "Tests", exclude: ["VerifyFixtures.swift", "StateChecks.swift"])
    ],
    swiftLanguageModes: [.v5]
)
