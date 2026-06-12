# SDKWork RTC PC Surface

## Purpose

`apps/sdkwork-rtc-pc/` contains PC React application-surface packages for RTC media integration.
The repository root remains the RTC authority workspace; root-level `packages/` is intentionally not used.

## Owner

sdkwork-rtc.

## Allowed Content

- `packages/sdkwork-rtc-pc-rtc/` app-side PC React RTC media package.
- App-surface documentation and package-level tests.

## Forbidden Content

- Repository-root package collections.
- SDK family workspaces or generated SDK transport output.
- Rust crates or provider plugins that belong in `crates/` or `plugins/`.
- Runtime-local user data or secrets.

## Related Specs

- `../../../sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`
- `../../../sdkwork-specs/APP_PC_REACT_UI_SPEC.md`
- `../../../sdkwork-specs/UI_ARCHITECTURE_SPEC.md`

## Verification

Run `pnpm test`, `pnpm run typecheck`, and `node --test tests/rtc-workspace-standard.test.mjs` from the repository root.
