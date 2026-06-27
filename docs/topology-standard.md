# SDKWork RTC Topology

Archetype: `application-http-gateway` (`specs/topology.spec.json`, `schemaVersion: 2`).

Platform standard: `../sdkwork-specs/APP_RUNTIME_TOPOLOGY_ADOPTION.md`

## Default dev profile

`standalone.split-services.development` — start the RTC API server and a client renderer:

```bash
pnpm dev
pnpm dev:browser:postgres:split-services:standalone:local
pnpm dev:flutter-android
```

Cloud development profile:

```bash
pnpm dev:browser:postgres:split-services:cloud
```

Server-only smoke (no client renderer):

```bash
pnpm dev:server
```

## Surfaces

| Surface id | Plane | Service |
| --- | --- | --- |
| `application.public-ingress` | application | `sdkwork-rtc-standalone-gateway` (`/app/v3/api/rtc/*`, `/backend/v3/api/rtc/*`) |
| `platform.api-gateway` | platform | `sdkwork-api-cloud-gateway` (sibling repo, IAM and shared SDKs) |

Product OpenAPI SDKs use `application.public-ingress`. IAM and platform SDKs use `platform.api-gateway`.

Loader: `scripts/lib/rtc-topology.mjs` → `@sdkwork/app-topology`.

## Client env keys

| App root | Application HTTP | Platform gateway |
| --- | --- | --- |
| `sdkwork-rtc-pc` | `VITE_SDKWORK_RTC_PC_APPLICATION_PUBLIC_HTTP_URL` | `VITE_SDKWORK_RTC_PC_PLATFORM_API_GATEWAY_HTTP_URL` |
| `sdkwork-rtc-h5` | `VITE_SDKWORK_RTC_H5_APPLICATION_PUBLIC_HTTP_URL` | `VITE_SDKWORK_RTC_H5_PLATFORM_API_GATEWAY_HTTP_URL` |
| `sdkwork-rtc-flutter-mobile` | `SDKWORK_RTC_APPLICATION_PUBLIC_HTTP_URL` (dart-define) | `SDKWORK_RTC_PLATFORM_API_GATEWAY_HTTP_URL` (dart-define) |

Derived SDK base URLs in profile env:

- `VITE_SDKWORK_RTC_*_APP_API_BASE_URL` → `{application}/app/v3/api`
- `VITE_SDKWORK_RTC_*_BACKEND_API_BASE_URL` → `{application}/backend/v3/api`

Cloud gateway config bundles: `configs/sdkwork-api-cloud-gateway.sdkwork-rtc.{development,production}.toml`.

Packaging:

```bash
pnpm gateway:package:cloud
pnpm gateway:matrix:cloud
```

## Validate

```bash
pnpm test:topology-validate
node --test tests/rtc-topology-contract.test.mjs
node --test tests/rtc-topology-baggage.test.mjs
```

Framework validator:

```bash
node ../sdkwork-app-topology/scripts/sdkwork-topology.mjs validate --root . --spec specs/topology.spec.json
```
