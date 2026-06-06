// providerKey: volcengine
// pluginId: rtc-volcengine
// driverId: sdkwork-rtc-driver-volcengine
// packageIdentity: RtcSdkProviderVolcengine
// sourcePath: Sources/RtcSdkProviderVolcengine/RtcProviderVolcenginePackageContract.swift
// sourceSymbol: RtcProviderVolcenginePackageContract
// rootPublic: false
// status: future-runtime-bridge-only
// runtimeBridgeStatus: reserved

import PackageDescription

let package = Package(
    name: "RtcSdkProviderVolcengine",
    products: [
        .library(
            name: "RtcSdkProviderVolcengine",
            targets: ["RtcSdkProviderVolcengine"]
        ),
    ],
    targets: [
        .target(
            name: "RtcSdkProviderVolcengine",
            path: "Sources/RtcSdkProviderVolcengine"
        ),
    ]
)
