# RTC Documentation

## Purpose

`docs/` stores maintained RTC documentation, plans, runbooks, architecture notes, and migration records.

## Owner

sdkwork-rtc.

## Allowed Content

- Architecture and migration notes.
- Runbooks and developer guides.
- Changelogs and standardization records.

## Forbidden Content

- API contract source files that belong in `apis/`.
- Generated SDK transport output.
- Secrets, runtime state, local overrides, or unreviewed scratch notes.

## Related Specs

- `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
- `../sdkwork-specs/DOCUMENTATION_SPEC.md`
- `../sdkwork-specs/MIGRATION_SPEC.md`

## Verification

Run `node --test tests/rtc-workspace-standard.test.mjs`.
