# RTC topology profiles

Machine contract: `specs/topology.spec.json` (`schemaVersion: 2`, archetype `application-http-gateway`).

Platform standard: `../../sdkwork-specs/APP_RUNTIME_TOPOLOGY_ADOPTION.md`

## Active profiles

| Profile id | Command |
| --- | --- |
| `standalone.split-services.development` | `pnpm dev`, `pnpm dev:browser:postgres:split-services:standalone:local`, `pnpm dev:flutter-android` |
| `cloud.split-services.development` | `pnpm dev:browser:postgres:split-services:cloud` |
| `standalone.unified-process.development` | `pnpm dev:server` |
| `cloud.split-services.production` | packaging / release |

Loader: `scripts/lib/rtc-topology.mjs` → `@sdkwork/app-topology`.
