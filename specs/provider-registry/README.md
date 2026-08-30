# RTC Provider Registry

## Purpose

`specs/provider-registry/` declares the default RTC provider plugin roster for `StaticProviderRegistry` and runtime factory bootstrap. Capability lists remain authoritative in `specs/provider-schemas/<providerKind>.json`.

## Files

| File | Role |
| --- | --- |
| `platform-default.json` | Built-in provider roster, default selection, and binding precedence |

## Runtime override

Set `SDKWORK_RTC_PROVIDER_REGISTRY_PATH` to an alternate manifest path when deploying a custom provider roster. The file must follow the same schema as `platform-default.json`.

## Related

- `specs/provider-schemas/` — per-provider admin form schema and capability declarations
- `crates/sdkwork-communication-rtc-service/src/provider/registry_config.rs` — manifest loader

## Verification

```powershell
cargo test -p sdkwork-communication-rtc-service provider_registry
pnpm run verify
```
