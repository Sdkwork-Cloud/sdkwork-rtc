// providerKey: mediasoup
// pluginId: rtc-mediasoup
// driverId: sdkwork-rtc-driver-mediasoup
// packageIdentity: RtcSdkProviderMediasoup
// sourcePath: Sources/RtcSdkProviderMediasoup/RtcProviderMediasoupPackageContract.swift
// sourceSymbol: RtcProviderMediasoupPackageContract
// rootPublic: false
// status: future-runtime-bridge-only
// runtimeBridgeStatus: reserved

import PackageDescription

let package = Package(
    name: "RtcSdkProviderMediasoup",
    products: [
        .library(
            name: "RtcSdkProviderMediasoup",
            targets: ["RtcSdkProviderMediasoup"]
        ),
    ],
    targets: [
        .target(
            name: "RtcSdkProviderMediasoup",
            path: "Sources/RtcSdkProviderMediasoup"
        ),
    ]
)
