# SDKWork RTC Specs

## Purpose

`specs/` holds repository-level contracts for the RTC authority workspace.

## Owner

sdkwork-rtc.

## Allowed Content

- `topology.spec.json` — runtime topology authority (`schemaVersion: 2`).
- Component and integration specs referenced by crates, plugins, SDK families, and app roots.

## Related Specs

- `../sdkwork-specs/APP_RUNTIME_TOPOLOGY_SPEC.md`
- `../sdkwork-specs/APP_RUNTIME_TOPOLOGY_ADOPTION.md`
- `../docs/topology-standard.md`

## Verification

```powershell
node ../sdkwork-app-topology/scripts/sdkwork-topology.mjs validate --root . --spec specs/topology.spec.json
node --test tests/rtc-topology-contract.test.mjs
node --test tests/rtc-topology-baggage.test.mjs
```
