// providerKey: tencent
// pluginId: rtc-tencent
// driverId: sdkwork-rtc-driver-tencent
// packageIdentity: RtcSdkProviderTencent
// sourcePath: Sources/RtcSdkProviderTencent/RtcProviderTencentPackageContract.swift
// sourceSymbol: RtcProviderTencentPackageContract
// rootPublic: false
// status: future-runtime-bridge-only
// runtimeBridgeStatus: reserved

import PackageDescription

let package = Package(
    name: "RtcSdkProviderTencent",
    products: [
        .library(
            name: "RtcSdkProviderTencent",
            targets: ["RtcSdkProviderTencent"]
        ),
    ],
    targets: [
        .target(
            name: "RtcSdkProviderTencent",
            path: "Sources/RtcSdkProviderTencent"
        ),
    ]
)
