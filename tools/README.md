# RTC Tools

## Purpose

`tools/` stores deterministic repository-local generation, validation, migration, and operator tools.

## Owner

sdkwork-rtc.

## Allowed Content

- SDK generation wrappers.
- Contract and migration validation scripts.
- Developer or operator tooling that is not shipped as runtime code.

## Forbidden Content

- Runtime application code.
- Thin shell entrypoints that belong in `scripts/`.
- Generated SDK transport output.
- Secrets or local machine state.

## Related Specs

- `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
- `../sdkwork-specs/TYPESCRIPT_CODE_SPEC.md`
- `../sdkwork-specs/SDK_WORKSPACE_GENERATION_SPEC.md`

## Verification

Run `pnpm run sdk:check` and `pnpm run audit:migration`.
