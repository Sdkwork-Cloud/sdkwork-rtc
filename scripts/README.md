# RTC Scripts

## Purpose

`scripts/` is reserved for thin command entrypoints that delegate to canonical tools or package scripts.

## Owner

sdkwork-rtc.

## Allowed Content

- Thin build, verification, generation, migration, packaging, and release wrappers.
- Cross-platform command shims that call `tools/`, Cargo, or pnpm scripts.

## Forbidden Content

- Reusable parsing, generation, migration, or validation logic; place that in `tools/`.
- Runtime application code.
- Generated SDK transport output.
- Secrets or local machine state.

## Related Specs

- `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
- `../sdkwork-specs/TYPESCRIPT_CODE_SPEC.md`
- `../sdkwork-specs/TEST_SPEC.md`

## Verification

Run `node --test tests/rtc-workspace-standard.test.mjs`.
