# RTC Rust Crates

## Purpose

`crates/` stores authored Rust crates for RTC service logic, SQLx repository access, route adapters, service hosts, and supporting Rust libraries.

## Owner

sdkwork-rtc.

## Allowed Content

- `sdkwork-communication-rtc-service/` business service logic and service ports.
- `sdkwork-communication-rtc-repository-sqlx/` SQLx schema, row mapping, and repository implementation.
- `sdkwork-routes-rtc-app-api/` and `sdkwork-routes-rtc-backend-api/` route adapters.
- `sdkwork-rtc-service-host/` in-process service container.
- Supporting RTC registry, context, and OpenAPI helper crates.

## Forbidden Content

- Generic Rust crates named with `core`, `runtime`, `product`, `backend`, `common`, or `manager` suffixes.
- Provider plugin implementations; they belong in `plugins/rtc-*`.
- Generated SDK transport output.
- API contract source files that belong in `apis/`.

## Related Specs

- `../sdkwork-specs/RUST_CODE_SPEC.md`
- `../sdkwork-specs/NAMING_SPEC.md`
- `../sdkwork-specs/API_SPEC.md`

## Verification

Run `cargo fmt --all --check`, `cargo test --workspace`, `node --test tests/rtc-workspace-standard.test.mjs`, and `pnpm run api:materialize:check`.

Rust crate `specs/component.spec.json` files are materialized from `tools/materialize-rtc-rust-component-specs.mjs`.
