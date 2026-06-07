# RTC Provider Standard SDK Component Specs

This directory is the local standards index for `sdkwork-rtc-sdk`.

Root SDKWork standards remain authoritative. Local component specs can narrow or document this component, but they must not contradict the root standards at `../../../sdkwork-specs`.

## Component

| Field | Value |
| --- | --- |
| Name | `sdkwork-rtc-sdk` |
| Type | `sdk-family` |
| Root | `sdkwork-rtc/sdks/sdkwork-rtc-sdk` |
| Domain | `rtc` |
| Capability | `rtc` |
| Languages | `csharp, flutter, go, java, kotlin, python, rust, swift, typescript` |
| Status | `standardizing` |

## Provider Runtime Boundary

| Field | Value |
| --- | --- |
| Kind | `provider-runtime-sdk` |
| Route Generated | `false` |
| Standard | `SDK_WORKSPACE_GENERATION_SPEC.md` |

`sdkwork-rtc-sdk` is a provider-standard SDK family for RTC runtime integration. It is not an OpenAPI route-generated HTTP SDK family and must stay separate from app/backend generated transport packages.

## Contract Manifest

- [component.spec.json](./component.spec.json) is the machine-readable component contract.
- Consumers should integrate through public exports, runtime entrypoints, SDK clients, or adapters declared in the manifest.
- Generated SDK language outputs are represented at their SDK family root instead of duplicating local specs in generated folders.

## Canonical Specs

| Spec | Applies Because |
| --- | --- |
| API_SPEC.md | HTTP/OpenAPI and generated SDK contract rules. |
| COMPONENT_SPEC.md | Local component specs directory and manifest rules. |
| CONFIG_SPEC.md | Runtime configuration, environment, SDK bootstrap, and feature flag rules. |
| DOCUMENTATION_SPEC.md | Module README, examples, ADR, changelog, and runbook rules. |
| DOMAIN_SPEC.md | Canonical domain ownership and naming. |
| FRONTEND_SPEC.md | UI, service, SDK, accessibility, and frontend runtime rules. |
| GOVERNANCE_SPEC.md | Standard ownership, exception, compatibility, and migration rules. |
| I18N_SPEC.md | User-facing language, locale, message catalog, and fallback rules. |
| MODULE_SPEC.md | Reusable package contract and dependency direction. |
| README.md | SDKWork root standards entrypoint. |
| SDK_SPEC.md | SDK generation and SDK integration rules. |
| SDK_WORKSPACE_GENERATION_SPEC.md | Application-root `sdks/` workspace, SDK family naming, provider/runtime SDK exception, and OpenAPI generation rules. |
| TEST_SPEC.md | Contract, frontend, SDK, security, parity, and documentation verification rules. |

## Public Exports

- Public exports are not declared in the package manifest.

## SDK Clients

- No generated SDK client class is declared at this component boundary.

## Local Extension Specs

- No local extension specs are declared yet.

## Verification

- `pnpm run audit:migration`
