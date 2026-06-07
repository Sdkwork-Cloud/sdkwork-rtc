# SDKWork RTC Backend SDK

`sdkwork-rtc-backend-sdk` is generated from `sdkwork-rtc-backend-api` and owns backend/admin RTC HTTP operations under `/backend/v3/api/rtc`.

The generator wrapper is `bin/generate-sdk.mjs`. It materializes owner-only SDK input, validates route manifests, and calls the canonical SDKWork generator:

```text
..\sdkwork-sdk-generator\bin\sdkgen.js
```

Use `node bin/generate-sdk.mjs --check` to validate inputs without writing generated transport output.
