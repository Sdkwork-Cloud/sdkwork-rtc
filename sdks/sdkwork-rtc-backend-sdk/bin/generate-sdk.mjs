#!/usr/bin/env node
import { runRtcSdkGenerator } from "../../../tools/rtc_sdk_generate.mjs";

await runRtcSdkGenerator({
  familyName: "sdkwork-rtc-backend-sdk",
  authorityName: "sdkwork-rtc-backend-api",
  sdkType: "backend",
  apiPrefix: "/backend/v3/api",
  sourceRouteCrate: "sdkwork-routes-rtc-backend-api",
  routeManifest:
    "sdks/_route-manifests/backend-api/sdkwork-routes-rtc-backend-api.route-manifest.json",
  sourceOpenapi: "generated/openapi/rtc-backend-api.openapi.json",
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
      workspace: "sdkwork-drive-backend-sdk",
      role: "drive-media-resource-backend-capability",
      required: true,
      dependencyMode: "consumer-sdk",
      apiPrefix: "/backend/v3/api",
      apiAuthority: "sdkwork-drive.backend",
      generatedTransportImportPolicy: "forbidden",
      packageByLanguage: {
        typescript: "@sdkwork/drive-backend-sdk",
        rust: "sdkwork-drive-backend-sdk",
        java: "com.sdkwork:sdkwork-drive-backend-sdk",
        python: "sdkwork-drive-backend-sdk",
        go: "github.com/sdkwork/sdkwork-drive-backend-sdk",
      },
    },
  ],
}, process.argv.slice(2));
