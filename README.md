# SDKWork RTC
repository-kind: application

`sdkwork-rtc` is the SDKWork authority for RTC media capabilities. It owns realtime
audio/video, voice session, live/broadcast, room, media participant, credential, provider webhook,
active provider query, quality sample, and Drive-backed recording artifact contracts.

It does not own signaling, call invitation, ringing, accept/reject, conversation, IM message, or
WebSocket call workflow behavior. Those workflows remain in `sdkwork-im`.

## IM Boundary

Dependency direction is one-way: **`sdkwork-im` depends on `sdkwork-rtc`; `sdkwork-rtc` must not depend on `sdkwork-im`.**

| Repository | Role |
|------------|------|
| `sdkwork-rtc` | Provider encapsulation, media sessions, call data, recording metadata, Drive-backed artifacts |
| `sdkwork-im` | Call signaling (`/im/v3/api/calls/*`), invite/accept/reject workflow, WebSocket call protocol |
| `sdkwork-drive` | Binary storage for recording files referenced by RTC `RtcDriveReference` |

See [docs/rtc-im-boundary.md](docs/rtc-im-boundary.md) for API ownership, client integration pattern, and IM migration checklist.

## Owned Surfaces

- Provider/runtime SDK: `sdks/sdkwork-rtc-sdk`
- App API SDK: `sdks/sdkwork-rtc-app-sdk`
- Backend API SDK: `sdks/sdkwork-rtc-backend-sdk`
- API contract inputs: `apis/app-api/communication` and `apis/backend-api/communication`
- Rust service, SQLx repository, route adapters, and service host: `crates/`
- Provider runtime plugins: `plugins/rtc-*`

## Project Structure

The repository follows the SDKWork project-root directory dictionary:

- `apis/`: API authority inputs and contract materialization sources.
- `crates/`: Rust service, repository, route adapter, host, and support crates.
- `sdks/`: SDK family workspaces, route manifests, materialized OpenAPI copies, and generated SDK output.
- `plugins/`: RTC runtime provider plugins.
- `apps/sdkwork-rtc-pc/packages/`: PC React application-surface package family. Root-level `packages/` is not used.
- `tools/`, `scripts/`, `tests/`, `docs/`, `configs/`, `deployments/`, `jobs/`, `examples/`, and `apps/`: standard project-root support directories.

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

## Local Development (Topology)

Default dev profile: `standalone.split-services.development`

```powershell
pnpm dev                                                    # PC admin UI + RTC API server
pnpm dev:browser:postgres:split-services:standalone:local   # H5 admin UI + RTC API server
pnpm dev:flutter-android                                    # Flutter mobile + RTC API server
pnpm dev:browser:postgres:split-services:cloud              # cloud deployment profile with platform API gateway
pnpm dev:server                                             # RTC API server only
```

Topology authority: `specs/topology.spec.json`, profiles under `configs/topology/`.
Human summary: [docs/topology-standard.md](docs/topology-standard.md).

Provider adapter checks:

```powershell
cargo test -p sdkwork-rtc-adapter-volcengine -p sdkwork-rtc-adapter-tencent
```

The migration audit also checks that old appbase and Craw Chat RTC authority sources are removed:

```powershell
pnpm run test:contract:migration
```

## Documentation Canon

- [docs/README.md](docs/README.md)
- [docs/product/prd/PRD.md](docs/product/prd/PRD.md)
- [docs/architecture/tech/TECH_ARCHITECTURE.md](docs/architecture/tech/TECH_ARCHITECTURE.md)

## Application Roots

- [apps directory index](apps/README.md)
