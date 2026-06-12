# RTC Cross-Package Tests

## Purpose

`tests/` stores repository-level RTC contract, migration, integration, and static verification tests.

## Owner

sdkwork-rtc.

## Allowed Content

- Workspace structure tests.
- Migration and contract audits.
- Cross-package fixtures and static verification inputs.

## Forbidden Content

- Package-local unit tests that belong beside their crate or package.
- Runtime state, generated SDK output, credentials, or customer data.
- Unmaintained manual test scratch files.

## Related Specs

- `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
- `../sdkwork-specs/TEST_SPEC.md`
- `../sdkwork-specs/API_SPEC.md`

## Verification

Run `node --test tests/rtc-workspace-standard.test.mjs` and `pnpm run audit:migration`.
