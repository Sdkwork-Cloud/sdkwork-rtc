// providerKey: janus
// pluginId: rtc-janus
// driverId: sdkwork-rtc-driver-janus
// packageIdentity: RtcSdkProviderJanus
// sourcePath: Sources/RtcSdkProviderJanus/RtcProviderJanusPackageContract.swift
// sourceSymbol: RtcProviderJanusPackageContract
// rootPublic: false
// status: future-runtime-bridge-only
// runtimeBridgeStatus: reserved

import PackageDescription

let package = Package(
    name: "RtcSdkProviderJanus",
    products: [
        .library(
            name: "RtcSdkProviderJanus",
            targets: ["RtcSdkProviderJanus"]
        ),
    ],
    targets: [
        .target(
            name: "RtcSdkProviderJanus",
            path: "Sources/RtcSdkProviderJanus"
        ),
    ]
)
