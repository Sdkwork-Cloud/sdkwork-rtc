# SDKWork RTC App SDK

`sdkwork-rtc-app-sdk` is generated from `sdkwork-rtc-app-api` and owns user-facing RTC HTTP operations under `/app/v3/api/rtc`.

The app SDK exposes RTC rooms, media sessions, participant credential issuance, and Drive-backed recording artifact references. It does not expose signaling, invitations, ringing, or business call lifecycle operations.

The generator wrapper is `bin/generate-sdk.mjs`. It materializes owner-only SDK input, validates route manifests, and calls the canonical SDKWork generator:

```text
..\sdkwork-sdk-generator\bin\sdkgen.js
```

Use `node bin/generate-sdk.mjs --check` to validate inputs without writing generated transport output.
