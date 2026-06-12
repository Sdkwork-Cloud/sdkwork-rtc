# RTC Runtime Plugins

## Purpose

`plugins/` stores RTC runtime provider plugin source packages.

## Owner

sdkwork-rtc.

## Allowed Content

- `rtc-agora/`, `rtc-aliyun/`, `rtc-livekit/`, `rtc-tencent/`, and `rtc-volcengine/` provider implementations.
- Plugin-local component specs, source code, tests, and provider documentation.

## Forbidden Content

- Repository-local agent plugins; those belong in `.sdkwork/plugins/`.
- Service or repository crates that belong in `crates/`.
- Generated SDK transport output.
- Provider secrets or runtime credential files.

## Related Specs

- `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
- `../sdkwork-specs/COMPONENT_SPEC.md`
- `../sdkwork-specs/INTEGRATION_SPEC.md`

## Verification

Run `cargo test --workspace` and `node --test tests/rtc-workspace-standard.test.mjs`.
