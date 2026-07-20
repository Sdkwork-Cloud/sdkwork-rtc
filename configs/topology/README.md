# RTC topology profiles

Machine contract: `specs/topology.spec.json` (`schemaVersion: 2`, archetype `application-http-gateway`).

Platform standard: `../../sdkwork-specs/APP_RUNTIME_TOPOLOGY_ADOPTION.md`

## Active profiles

| Profile id | Command |
| --- | --- |
| `standalone.split-services.development` | `pnpm dev`, `pnpm dev:browser:postgres:standalone:local`, `pnpm dev:flutter-android` |
| `cloud.development` | `pnpm dev:browser:cloud` |
| `standalone.development` | `pnpm dev:server` |
| `cloud.production` | packaging / release |

Loader: `scripts/lib/rtc-topology.mjs` → `@sdkwork/app-topology`.
