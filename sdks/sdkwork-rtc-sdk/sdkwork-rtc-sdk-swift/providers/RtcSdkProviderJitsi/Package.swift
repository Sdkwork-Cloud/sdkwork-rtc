// providerKey: jitsi
// pluginId: rtc-jitsi
// driverId: sdkwork-rtc-driver-jitsi
// packageIdentity: RtcSdkProviderJitsi
// sourcePath: Sources/RtcSdkProviderJitsi/RtcProviderJitsiPackageContract.swift
// sourceSymbol: RtcProviderJitsiPackageContract
// rootPublic: false
// status: future-runtime-bridge-only
// runtimeBridgeStatus: reserved

import PackageDescription

let package = Package(
    name: "RtcSdkProviderJitsi",
    products: [
        .library(
            name: "RtcSdkProviderJitsi",
            targets: ["RtcSdkProviderJitsi"]
        ),
    ],
    targets: [
        .target(
            name: "RtcSdkProviderJitsi",
            path: "Sources/RtcSdkProviderJitsi"
        ),
    ]
)
