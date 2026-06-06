// providerKey: agora
// pluginId: rtc-agora
// driverId: sdkwork-rtc-driver-agora
// packageIdentity: RtcSdkProviderAgora
// sourcePath: Sources/RtcSdkProviderAgora/RtcProviderAgoraPackageContract.swift
// sourceSymbol: RtcProviderAgoraPackageContract
// rootPublic: false
// status: future-runtime-bridge-only
// runtimeBridgeStatus: reserved

import PackageDescription

let package = Package(
    name: "RtcSdkProviderAgora",
    products: [
        .library(
            name: "RtcSdkProviderAgora",
            targets: ["RtcSdkProviderAgora"]
        ),
    ],
    targets: [
        .target(
            name: "RtcSdkProviderAgora",
            path: "Sources/RtcSdkProviderAgora"
        ),
    ]
)
