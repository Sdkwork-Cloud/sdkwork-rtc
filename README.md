# SDKWork RTC

`sdkwork-rtc` is the SDKWork authority for RTC media capabilities. It owns realtime
audio/video, voice session, live/broadcast, room, media participant, credential, provider webhook,
active provider query, quality sample, and Drive-backed recording artifact contracts.

It does not own signaling, call invitation, ringing, accept/reject, conversation, IM message, or
WebSocket call workflow behavior. Those workflows remain in Craw Chat.

## Owned Surfaces

- Provider/runtime SDK: `sdks/sdkwork-rtc-sdk`
- App API SDK: `sdks/sdkwork-rtc-app-sdk`
- Backend API SDK: `sdks/sdkwork-rtc-backend-sdk`
- Rust core/storage/routes: `crates/` and `services/`
- Provider adapters: `adapters/rtc-*`

## Provider Model

Providers use a JDBC-style plugin boundary. The root RTC SDK is provider-neutral and vendor-free;
vendor packages and native bridges live only in provider plugin packages. Volcengine is the
platform default provider, and Tencent Cloud is a first-class provider adapter.

The Rust provider SPI is `RtcProviderPort`. Volcengine and Tencent adapters implement:

- media session create/close handles
- participant credential issuance and refresh
- provider webhook parsing and normalization
- active provider query request mapping
- signed OpenAPI request execution through injectable executor SPIs
- Drive-backed recording artifact export
- provider health snapshots

## Provider Configuration

Volcengine adapter environment keys:

- `SDKWORK_RTC_VOLCENGINE_ACCESS_ENDPOINT`
- `SDKWORK_RTC_VOLCENGINE_REGION`
- `SDKWORK_RTC_VOLCENGINE_APP_ID`
- `SDKWORK_RTC_VOLCENGINE_APP_KEY`
- `SDKWORK_RTC_VOLCENGINE_CREDENTIAL_TTL_SECONDS`
- `SDKWORK_RTC_VOLCENGINE_API_ENDPOINT`
- `SDKWORK_RTC_VOLCENGINE_API_HOST`
- `SDKWORK_RTC_VOLCENGINE_API_VERSION`
- `SDKWORK_RTC_VOLCENGINE_ACCESS_KEY_ID`
- `SDKWORK_RTC_VOLCENGINE_SECRET_ACCESS_KEY`

Tencent adapter environment keys:

- `SDKWORK_RTC_TENCENT_ACCESS_ENDPOINT`
- `SDKWORK_RTC_TENCENT_REGION`
- `SDKWORK_RTC_TENCENT_SDK_APP_ID`
- `SDKWORK_RTC_TENCENT_SDK_SECRET_KEY`
- `SDKWORK_RTC_TENCENT_CREDENTIAL_TTL_SECONDS`
- `SDKWORK_RTC_TENCENT_API_ENDPOINT`
- `SDKWORK_RTC_TENCENT_API_HOST`
- `SDKWORK_RTC_TENCENT_API_VERSION`
- `SDKWORK_RTC_TENCENT_SECRET_ID`
- `SDKWORK_RTC_TENCENT_SECRET_KEY`

Provider secrets are used only inside provider adapter plugins. They are not stored in RTC business
tables and are not included in normalized query snapshots.

## Persistence

RTC storage owns media runtime tables such as `rtc_room`, `rtc_media_session`,
`rtc_media_participant`, `rtc_media_track`, `rtc_quality_sample`, `rtc_media_artifact`,
`rtc_provider_webhook_event`, `rtc_provider_query_job`, and `rtc_provider_query_snapshot`.

Recording artifacts persist Drive references and `MediaResource` snapshots. RTC business storage
does not persist provider bucket, object key, signed URL, or presigned upload state.

## Verification

```powershell
pnpm run verify
```

Provider adapter checks:

```powershell
cargo test -p sdkwork-rtc-adapter-volcengine -p sdkwork-rtc-adapter-tencent
```

The migration audit also checks that old appbase and Craw Chat RTC authority sources are removed:

```powershell
pnpm run audit:migration
```
