// providerKey: aliyun
// pluginId: rtc-aliyun
// driverId: sdkwork-rtc-driver-aliyun
// packageIdentity: RtcSdkProviderAliyun
// sourcePath: Sources/RtcSdkProviderAliyun/RtcProviderAliyunPackageContract.swift
// sourceSymbol: RtcProviderAliyunPackageContract
// rootPublic: false
// status: future-runtime-bridge-only
// runtimeBridgeStatus: reserved

import PackageDescription

let package = Package(
    name: "RtcSdkProviderAliyun",
    products: [
        .library(
            name: "RtcSdkProviderAliyun",
            targets: ["RtcSdkProviderAliyun"]
        ),
    ],
    targets: [
        .target(
            name: "RtcSdkProviderAliyun",
            path: "Sources/RtcSdkProviderAliyun"
        ),
    ]
)
