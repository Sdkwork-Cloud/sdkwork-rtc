// providerKey: livekit
// pluginId: rtc-livekit
// driverId: sdkwork-rtc-driver-livekit
// packageIdentity: RtcSdkProviderLivekit
// sourcePath: Sources/RtcSdkProviderLivekit/RtcProviderLivekitPackageContract.swift
// sourceSymbol: RtcProviderLivekitPackageContract
// rootPublic: false
// status: future-runtime-bridge-only
// runtimeBridgeStatus: reserved

import PackageDescription

let package = Package(
    name: "RtcSdkProviderLivekit",
    products: [
        .library(
            name: "RtcSdkProviderLivekit",
            targets: ["RtcSdkProviderLivekit"]
        ),
    ],
    targets: [
        .target(
            name: "RtcSdkProviderLivekit",
            path: "Sources/RtcSdkProviderLivekit"
        ),
    ]
)
