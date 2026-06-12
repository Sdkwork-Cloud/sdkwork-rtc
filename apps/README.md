# RTC Application Surfaces

## Purpose

`apps/` stores RTC application surface roots. The current repository root is the primary RTC authority workspace; app packages must live under an app surface root, not at the repository root.

## Owner

sdkwork-rtc.

## Allowed Content

- Future app surface roots with their own `sdkwork.app.config.json`.
- `sdkwork-rtc-pc/` PC React application-surface packages for RTC media integration.
- Runnable demos promoted to maintained app surfaces.
- App shell documentation for secondary surfaces.

## Forbidden Content

- SDK family workspaces.
- Generated SDK transport output.
- Rust service, repository, route, or plugin crates that belong in `crates/` or `plugins/`.
- Runtime-local user data or secrets.

## Related Specs

- `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
- `../sdkwork-specs/APPLICATION_SPEC.md`
- `../sdkwork-specs/APP_MANIFEST_SPEC.md`

## Verification

Run `node --test tests/rtc-workspace-standard.test.mjs`.
