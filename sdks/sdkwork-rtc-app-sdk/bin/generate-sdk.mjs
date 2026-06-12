#!/usr/bin/env node
import { runRtcSdkGenerator } from "../../../tools/rtc_sdk_generate.mjs";

await runRtcSdkGenerator({
  familyName: "sdkwork-rtc-app-sdk",
  authorityName: "sdkwork-rtc-app-api",
  sdkType: "app",
  apiPrefix: "/app/v3/api",
  sourceRouteCrate: "sdkwork-router-rtc-app-api",
  routeManifest:
    "sdks/_route-manifests/app-api/sdkwork-router-rtc-app-api.route-manifest.json",
  sourceOpenapi: "apis/app-api/communication/sdkwork-rtc-app-api.openapi.json",
  defaultBaseUrl: "http://127.0.0.1:18080",
  sdkDependencies: [
    {
      workspace: "sdkwork-rtc-sdk",
      role: "provider-runtime-sdk",
      required: true,
      dependencyMode: "consumer-sdk",
      apiPrefix: null,
      generatedTransportImportPolicy: "forbidden",
      packageByLanguage: {
        typescript: "@sdkwork/rtc-sdk",
        rust: "sdkwork-rtc-sdk",
        java: "com.sdkwork:sdkwork-rtc-sdk",
        python: "sdkwork-rtc-sdk",
        go: "github.com/sdkwork/sdkwork-rtc-sdk",
      },
    },
    {
      workspace: "sdkwork-drive-app-sdk",
      role: "drive-media-resource-app-capability",
      required: true,
      dependencyMode: "consumer-sdk",
      apiPrefix: "/app/v3/api",
      apiAuthority: "sdkwork-drive.app",
      generatedTransportImportPolicy: "forbidden",
      packageByLanguage: {
        typescript: "@sdkwork/drive-app-sdk",
        rust: "sdkwork-drive-app-sdk",
        java: "com.sdkwork:sdkwork-drive-app-sdk",
        python: "sdkwork-drive-app-sdk",
        go: "github.com/sdkwork/sdkwork-drive-app-sdk",
      },
    },
  ],
}, process.argv.slice(2));
