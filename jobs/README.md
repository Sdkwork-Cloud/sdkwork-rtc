# RTC Jobs

## Purpose

`jobs/` is reserved for RTC job definitions, schedules, queue bindings, and maintenance runbooks.

## Owner

sdkwork-rtc.

## Allowed Content

- Job schedules and queue binding descriptors.
- Maintenance task runbooks.
- Batch or worker operation documentation.

## Forbidden Content

- Rust worker implementation code; use `crates/sdkwork-<domain>-<capability>-worker/`.
- Generated SDK output.
- Runtime job state, local databases, logs, or credentials.

## Related Specs

- `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
- `../sdkwork-specs/RUST_CODE_SPEC.md`
- `../sdkwork-specs/TEST_SPEC.md`

## Verification

Run `node --test tests/rtc-workspace-standard.test.mjs`.
