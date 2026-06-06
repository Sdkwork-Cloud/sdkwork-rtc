// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "RtcSdk",
    platforms: [
        .iOS(.v15),
        .macOS(.v13),
    ],
    products: [
        .library(
            name: "RtcSdk",
            targets: ["RtcSdk"]
        ),
    ],
    targets: [
        .target(
            name: "RtcSdk",
            path: "Sources/RtcSdk"
        ),
    ]
)

// build system: swift-package-manager
