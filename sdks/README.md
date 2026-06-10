# SDKWork RTC SDKs

This directory is the SDK boundary owned by `sdkwork-rtc`.

- `sdkwork-rtc-sdk` owns the provider-standard RTC media/runtime SDK workspace.
- `sdkwork-rtc-backend-sdk` owns the generated backend API SDK boundary.

Call signaling, invite lifecycle, conversation delivery, and browser WebSocket business protocol are
owned by IM/Craw Chat. `sdkwork-rtc` intentionally does not publish an app/client call-signaling SDK
or app-api RTC session route family.

RTC SDK workspaces must stay in this repository. `sdkwork-appbase` must not aggregate RTC SDK
sources, route specifications, Rust storage, or generated SDK authority files.
