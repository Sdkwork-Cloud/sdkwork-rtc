# RTC Documentation

## Purpose

`docs/` stores maintained RTC documentation, operator runbooks, architecture notes, and migration records for the `sdkwork-rtc` authority workspace.

## Owner

sdkwork-rtc maintainers.

## Canon Documents

| Document | Path |
| --- | --- |
| Product PRD | [product/prd/PRD.md](product/prd/PRD.md) |
| Technical architecture | [architecture/tech/TECH_ARCHITECTURE.md](architecture/tech/TECH_ARCHITECTURE.md) |
| RTC ↔ IM boundary | [rtc-im-boundary.md](rtc-im-boundary.md) |
| Production deployment | [guides/operator/deployment.md](guides/operator/deployment.md) |
| Forward roadmap (RTC scope) | [ARCHITECTURE_ROADMAP.md](ARCHITECTURE_ROADMAP.md) |

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

```powershell
pnpm run verify
node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace .
```
