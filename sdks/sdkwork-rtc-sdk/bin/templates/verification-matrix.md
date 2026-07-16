# RTC SDK Verification Matrix

This matrix defines the verification responsibilities for `sdkwork-rtc-sdk`.

## Materialization

Run:

```powershell
node .\bin\materialize-sdk.mjs
```

The materializer must update:

- root `README.md`
- `docs/README.md`
- `docs/package-standards.md`
- `docs/provider-adapter-standard.md`
- `docs/verification-matrix.md`
- `docs/multilanguage-capability-matrix.md`
- `docs/usage-guide.md`
- `docs/typescript-volcengine-runtime-usage.md`
- `docs/flutter-volcengine-runtime-usage.md`
- official language workspace READMEs
- TypeScript catalog modules
- reserved language catalog and scaffold modules
- provider package boundary manifests and README files

The materializer must not recreate retired app workflow, invite lifecycle, or business realtime
coordination modules inside the RTC SDK family.

## Root Verification

Run:

```powershell
node .\test\verify-sdk-automation.test.mjs
node .\bin\verify-sdk.mjs
```

The verifier must confirm:

- `sdk-manifest.json` parses and matches the standard baseline
- provider selection, support, activation, package boundary, capability, runtime surface, runtime
  immutability, root-public surface, lookup-helper naming, and error-code vocabularies are present
- exactly one default provider is selected
- generated TypeScript public exports are provider/media runtime exports only
- TypeScript and Flutter runtime guides reference media runtime entrypoints
- reserved language scaffolds expose metadata, lookup, provider selection, provider support, and
  provider package loader boundaries without advertising executable media support prematurely

## Runtime Smoke

Fast runtime smoke commands:

{{RTC_FAST_RUNTIME_SMOKE_COMMANDS}}

Required runtime smoke steps:

{{RTC_REQUIRED_RUNTIME_SMOKE_STEPS}}

Optional runtime smoke steps:

{{RTC_OPTIONAL_RUNTIME_SMOKE_STEPS}}

## Full Regression

Run:

```powershell
node .\bin\smoke-sdk.mjs
```

The full regression entrypoint should:

- run materialization
- run automation verification
- run root verification
- run TypeScript build, test, and smoke checks
- attempt optional language checks only when their toolchains are available

## Boundary Expectations

RTC SDK owns media runtime provider behavior only. IM-owned SDKs and services own user workflow,
conversation delivery, authenticated websocket workflow, and invite lifecycle.

The repository should keep scans that prevent retired workflow modules, app HTTP clients, manual
credential headers, and application-owned realtime workflow code from reappearing inside
`sdkwork-rtc-sdk`.
