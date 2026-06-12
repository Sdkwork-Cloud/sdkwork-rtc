# Repository Guidelines

<!-- SDKWORK-AGENTS-GENERATED: v2 -->

## SDKWORK Soul

Read `../sdkwork-specs/SOUL.md` before executing tasks in this root. Follow specs before memory, dictionary before context, stop on ambiguity, and evidence before completion.

## SDKWORK Standards

Canonical SDKWORK specs path from this root:

- `../sdkwork-specs/README.md`
- `../sdkwork-specs/SOUL.md`
- `../sdkwork-specs/AGENTS_SPEC.md`
- `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
- `../sdkwork-specs/NAMING_SPEC.md`

Do not copy root standard text into this repository. If these relative paths do not resolve, stop and report the broken workspace layout.

## Application Identity

No `sdkwork.app.config.json` is present at this root. This repository is the RTC authority workspace with Rust crates, provider plugins, API contracts, and SDK families. If a runnable app surface is added later, place its app root under `apps/` or add a root manifest according to `APP_MANIFEST_SPEC.md`.

## Local Dictionary Structure

- `AGENTS.md`: local agent entrypoint and relative SDKWORK spec index.
- `CLAUDE.md`: Claude Code compatibility shim that points to `AGENTS.md` and must not duplicate rules.
- `GEMINI.md`: Gemini CLI compatibility shim that points to `AGENTS.md` and must not duplicate rules.
- `CODEX.md`: Codex compatibility shim that points to `AGENTS.md` and must not duplicate rules.
- `.sdkwork/`: repository-local skills, plugins, manifests, and AI workspace metadata only.
- `apis/`: RTC API authority inputs under canonical domain directory `communication/`.
- `apps/`: reserved for future independently runnable RTC app surfaces.
- `crates/`: Rust service, repository, route, host, and support crates.
- `sdks/`: SDK family workspaces, OpenAPI materialization, route manifests, and generated SDK output.
- `jobs/`: job definitions, schedules, queues, and maintenance runbooks.
- `tools/`: reusable Node validation and generation tools.
- `plugins/`: RTC runtime provider plugins such as Volcengine, Tencent, Agora, Aliyun, and LiveKit.
- `examples/`: maintained RTC examples.
- `configs/`: safe config templates, schemas, profiles, and non-secret defaults.
- `deployments/`: deployment descriptors and runbooks.
- `scripts/`: thin command wrappers.
- `docs/`: maintained documentation and migration records.
- `tests/`: repository-level contract, migration, and static verification tests.
- Root-level `packages/` is not allowed in this RTC authority workspace. App packages must live under `apps/<app-root>/packages/`.

## Spec Resolution Order

1. Read this `AGENTS.md` and any nearer component-level `AGENTS.md`.
2. Read `sdkwork.app.config.json` when present.
3. Read local `specs/README.md` and `specs/component.spec.json` when present.
4. Read local `.sdkwork/README.md`, `.sdkwork/skills/`, and `.sdkwork/plugins/` when relevant.
5. Read `../sdkwork-specs/README.md` and the task-specific root specs.
6. Inspect implementation files only after the relevant dictionary entries are clear.

## Required Specs By Task Type

- Repository structure or agent entrypoint changes: `../sdkwork-specs/SOUL.md`, `../sdkwork-specs/AGENTS_SPEC.md`, `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`, `../sdkwork-specs/DOCUMENTATION_SPEC.md`, `../sdkwork-specs/TEST_SPEC.md`.
- Any code or naming change: `../sdkwork-specs/CODE_STYLE_SPEC.md`, `../sdkwork-specs/NAMING_SPEC.md`, plus only the touched language/framework spec.
- Rust code or Cargo workspace changes: `../sdkwork-specs/RUST_CODE_SPEC.md`.
- TypeScript or Node tooling changes: `../sdkwork-specs/TYPESCRIPT_CODE_SPEC.md`.
- API or SDK generation changes: `../sdkwork-specs/API_SPEC.md`, `../sdkwork-specs/SDK_SPEC.md`, `../sdkwork-specs/SDK_WORKSPACE_GENERATION_SPEC.md`, `../sdkwork-specs/DOMAIN_SPEC.md`, `../sdkwork-specs/TEST_SPEC.md`.
- Database or repository changes: `../sdkwork-specs/DATABASE_SPEC.md`, `../sdkwork-specs/RUST_CODE_SPEC.md`, `../sdkwork-specs/TEST_SPEC.md`.
- Provider plugin or external integration changes: `../sdkwork-specs/INTEGRATION_SPEC.md`, `../sdkwork-specs/COMPONENT_SPEC.md`, `../sdkwork-specs/CONFIG_SPEC.md`, `../sdkwork-specs/SECURITY_SPEC.md`.

Language-specific specs are on demand; do not load Rust, Java, TypeScript, and frontend specs for unrelated tasks.

## Code Style Rules

Read `../sdkwork-specs/CODE_STYLE_SPEC.md` and `../sdkwork-specs/NAMING_SPEC.md` before code changes. Do not hand-edit generated SDK transport output; change the API source, route manifest, materializer, or approved facade and regenerate.

## Build, Test, And Verification

This root has both `package.json` and `Cargo.toml`. Prefer narrow checks first, then aggregate verification:

```powershell
node --test tests/rtc-workspace-standard.test.mjs
pnpm run audit:migration
pnpm run materialize:openapi
pnpm run sdk:check
cargo fmt --all --check
cargo test --workspace
pnpm run verify
```

Record the exact verification commands and important outputs before reporting completion.

## Agent Execution Rules

Use the convention dictionary instead of broad context loading. Do not replace generated SDK integration with raw HTTP. Keep changes scoped to the owning module, package, crate, SDK family, or app root. Do not retain forbidden generic Rust crate names through aliases, wrapper crates, or compatibility packages.

## Human Review Rules

Request human review before breaking SDKWORK standards, changing public naming beyond the approved standardization, altering security/auth behavior, changing database migrations or production deployment config, deleting data/files, or changing generated SDK ownership. Surface unresolved spec paths, app identity conflicts, component ownership conflicts, and API authority ambiguity instead of guessing.
