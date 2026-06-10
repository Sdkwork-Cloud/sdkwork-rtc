# SDKWork RTC SDK Internal Docs

This directory contains the materialized standards for `sdkwork-rtc-sdk`.

## Documents

- `usage-guide.md`: practical provider/media runtime overview.
- `typescript-volcengine-runtime-usage.md`: TypeScript executable media runtime guide.
- `flutter-volcengine-runtime-usage.md`: Flutter executable media runtime guide.
- `package-standards.md`: package ownership, export, and scaffold rules.
- `provider-adapter-standard.md`: provider adapter and runtime bridge rules.
- `multilanguage-capability-matrix.md`: provider, capability, language, and scaffold matrix.
- `verification-matrix.md`: commands and verification responsibilities.

## Source Of Truth

`.sdkwork-assembly.json` drives:

- provider catalog metadata
- capability catalog metadata
- provider extension metadata
- provider selection precedence
- provider support and activation vocabularies
- runtime surface method vocabulary
- runtime immutability vocabulary
- root public surface rules
- lookup helper naming profiles
- language workspace catalog entries
- provider package scaffold contracts

## Runtime Boundary

The SDK owns provider-neutral media runtime behavior:

- join a provider room
- leave a provider room
- publish or unpublish tracks
- mute audio or video
- expose provider metadata and `unwrap()` escape hatches

The SDK does not own application workflow state. IM-owned packages provide authenticated business
workflow, conversation delivery, and invite lifecycle. Those packages pass provider room,
participant, and credential inputs into the RTC SDK.

## Verification

Run the generated verification matrix from the SDK family root:

```powershell
node .\bin\materialize-sdk.mjs
node .\test\verify-sdk-automation.test.mjs
node .\bin\verify-sdk.mjs
node .\bin\smoke-sdk.mjs
```
