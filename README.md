# SDKWork RTC

`sdkwork-rtc` is the SDKWork authority for realtime communication.

It owns RTC provider SDK workspaces, app/backend HTTP API contracts, generated SDK boundaries,
Rust storage and route contracts, and reusable RTC UI/service packages. RTC code must not be owned
by `sdkwork-appbase`; appbase may consume published RTC packages but must not carry RTC source,
database schema, route catalogs, SDK generation inputs, or provider SDK workspaces.

## Owned Surfaces

- Provider/runtime SDK: `sdks/sdkwork-rtc-sdk`
- App API SDK: `sdks/sdkwork-rtc-app-sdk`
- Backend API SDK: `sdks/sdkwork-rtc-backend-sdk`
- Rust core/storage/routes: `crates/` and `services/`
- PC React package: `packages/pc-react/communication/sdkwork-rtc-pc-react`

## Verification

```powershell
pnpm run verify
```

The migration audit also checks that old appbase and craw-chat RTC authority sources are removed:

```powershell
pnpm run audit:migration
```
