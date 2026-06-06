plugins {
    base
}

group = "com.sdkwork"
version = "0.1.0"
description = "Reserved Kotlin package scaffold for com.sdkwork:rtc-sdk with build system: gradle-kotlin-dsl"

extra["sdkworkPublicPackage"] = "com.sdkwork:rtc-sdk"

base {
    archivesName.set("rtc-sdk")
}
