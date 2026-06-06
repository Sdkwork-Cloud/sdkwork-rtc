// providerKey: twilio
// pluginId: rtc-twilio
// driverId: sdkwork-rtc-driver-twilio
// packageIdentity: RtcSdkProviderTwilio
// sourcePath: Sources/RtcSdkProviderTwilio/RtcProviderTwilioPackageContract.swift
// sourceSymbol: RtcProviderTwilioPackageContract
// rootPublic: false
// status: future-runtime-bridge-only
// runtimeBridgeStatus: reserved

import PackageDescription

let package = Package(
    name: "RtcSdkProviderTwilio",
    products: [
        .library(
            name: "RtcSdkProviderTwilio",
            targets: ["RtcSdkProviderTwilio"]
        ),
    ],
    targets: [
        .target(
            name: "RtcSdkProviderTwilio",
            path: "Sources/RtcSdkProviderTwilio"
        ),
    ]
)
