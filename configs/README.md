# RTC Config Templates

## Purpose

`configs/` is reserved for safe RTC config templates, schemas, profile examples, and non-secret defaults.

## Owner

sdkwork-rtc.

## Allowed Content

- Config schemas.
- Development, test, staging, and production examples without secrets.
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

Run `node --test tests/rtc-workspace-standard.test.mjs`.
