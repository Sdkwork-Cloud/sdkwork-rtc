# SDKWork RTC Apps

Application surfaces for SDKWork RTC.

## Application Roots

| App Root | Architecture | Framework | Surface |
|----------|-------------|-----------|---------|
| `sdkwork-rtc-pc/` | PC | React/TypeScript | Browser + Desktop |
| `sdkwork-rtc-h5/` | H5 | React/TypeScript | Mobile Browser + Capacitor |
| `sdkwork-rtc-flutter-mobile/` | Flutter Mobile | Dart/Flutter | iOS + Android |

## Cross-Client Alignment

All three app roots share:
- Same RTC app-api (`/app/v3/api/rtc/`)
- Same generated RTC app SDK (`sdkwork-rtc-app-sdk`)
- Same route identity (`rtc.rooms.*`, `rtc.mediaSessions.*`, etc.)
- Same appbase IAM runtime integration
- Same provider profile and media session domain model
