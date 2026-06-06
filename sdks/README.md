# SDKWork RTC SDKs

This directory is the SDK boundary owned by `sdkwork-rtc`.

- `sdkwork-rtc-sdk` owns the provider-standard RTC runtime and signaling SDK workspace.
- `sdkwork-rtc-app-sdk` owns the generated app API SDK boundary.
- `sdkwork-rtc-backend-sdk` owns the generated backend API SDK boundary.

RTC SDK workspaces must stay in this repository. `sdkwork-appbase` must not aggregate RTC SDK
sources, route specifications, Rust storage, or generated SDK authority files.
