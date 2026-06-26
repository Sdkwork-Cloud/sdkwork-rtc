# apps/

Application: rtc
Status: active
Owner: SDKWork maintainers
Specs: APPLICATION_SPEC.md, SDKWORK_WORKSPACE_SPEC.md

## Primary App Surface

The repository root is not the primary runnable app surface.
Runnable application roots live under `apps/<application-root>/`.

## Directory Index

| Directory | Surface role | Runnable | Purpose | Entry |
| --- | --- | --- | --- | --- |
| sdkwork-rtc-flutter-mobile | flutter-mobile | yes | SDKWork RTC Mobile flutter-mobile application root. | [README](sdkwork-rtc-flutter-mobile/README.md) |
| sdkwork-rtc-h5 | h5 | yes | SDKWork RTC H5 h5 application root. | [README](sdkwork-rtc-h5/README.md) |
| sdkwork-rtc-mini-program | mini-program | yes | SDKWork RTC Mini Program mini-program application root. | `sdkwork-rtc-mini-program/` |
| sdkwork-rtc-pc | pc | yes | SDKWork RTC PC pc application root. | [README](sdkwork-rtc-pc/README.md) |

## Allowed Content

- Selected language/architecture application roots with `README.md`, `AGENTS.md`, `.sdkwork/`, and `specs/` when authored packages exist.
- Architecture-local `packages/`, `config/`, `src/`, `lib/`, `App/`, or `entry/` directories required by the owning architecture standard.

## Forbidden Content

- Repository-root API contracts, generated SDK workspaces, Rust crates, or deployment descriptors moved under `apps/`.
- Runtime secrets, user-private state, generated SDK transport output, or cross-application copied business logic.

## Related Specs

- `../sdkwork-specs/APPLICATION_SPEC.md`
- `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
- `../sdkwork-specs/APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md`

## Verification

```bash
node ../sdkwork-specs/tools/check-apps-directory-index.mjs --root .
```
