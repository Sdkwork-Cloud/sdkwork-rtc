# RTC API Contracts

## Purpose

`apis/` stores sdkwork-rtc authored API contract sources and materialized authority inputs.

## Owner

sdkwork-rtc.

## Allowed Content

- `app-api/communication/` App API OpenAPI authority inputs.
- `backend-api/communication/` Backend API OpenAPI authority inputs.
- API examples, changelogs, fixtures, and contract validation inputs.

## Forbidden Content

- Generated SDK transport output.
- SDK family workspaces.
- Rust route, handler, service, or repository implementation code.
- Runtime state, credentials, or local override files.

## Related Specs

- `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
- `../sdkwork-specs/API_SPEC.md`
- `../sdkwork-specs/SDK_WORKSPACE_GENERATION_SPEC.md`

## Verification

Run `node --test tests/rtc-workspace-standard.test.mjs` and `pnpm run sdk:check`.
