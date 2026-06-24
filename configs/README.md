# RTC Config Templates

## Purpose

`configs/` is reserved for safe RTC config templates, schemas, profile examples, and non-secret defaults.

## Owner

sdkwork-rtc.

## Allowed Content

- Config schemas.
- Development, test, staging, and production examples without secrets.
- Topology profiles under `topology/` and cloud gateway bundles under `sdkwork-api-cloud-gateway.sdkwork-rtc.*.toml`.
- Provider config templates using placeholder values.

## Forbidden Content

- `.local` overrides.
- Live provider secrets, API keys, tokens, database URLs, or private keys.
- Runtime user config or generated deployment state.

## Related Specs

- `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
- `../sdkwork-specs/CONFIG_SPEC.md`
- `../sdkwork-specs/ENVIRONMENT_SPEC.md`

## Verification

```powershell
node --test tests/rtc-workspace-standard.test.mjs
pnpm run test:topology-validate
pnpm run gateway:matrix:cloud
```
