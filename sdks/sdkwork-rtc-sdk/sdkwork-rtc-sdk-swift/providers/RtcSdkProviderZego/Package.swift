// providerKey: zego
// pluginId: rtc-zego
// driverId: sdkwork-rtc-driver-zego
// packageIdentity: RtcSdkProviderZego
// sourcePath: Sources/RtcSdkProviderZego/RtcProviderZegoPackageContract.swift
// sourceSymbol: RtcProviderZegoPackageContract
// rootPublic: false
// status: future-runtime-bridge-only
// runtimeBridgeStatus: reserved

import PackageDescription

let package = Package(
    name: "RtcSdkProviderZego",
    products: [
        .library(
            name: "RtcSdkProviderZego",
            targets: ["RtcSdkProviderZego"]
        ),
    ],
    targets: [
        .target(
            name: "RtcSdkProviderZego",
            path: "Sources/RtcSdkProviderZego"
        ),
    ]
)
