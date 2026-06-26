# sdkwork-rtc-app-sdk (Dart)

Generated SDKWork v3 dual-token transport SDK.

## Installation

```bash
dart pub add sdkwork_ai_prod_app_sdk_generated_dart
```

## Quick Start

```dart
import 'package:sdkwork_ai_prod_app_sdk_generated_dart/sdkwork_ai_prod_app_sdk_generated_dart.dart';

final client = SdkworkAppClient(
  config: const SdkConfig(
    baseUrl: 'http://127.0.0.1:18088',
  ),
);
client.setAuthToken('your-auth-token');
client.setAccessToken('your-access-token');

// Use the SDK
final params = <String, dynamic>{
  'page': 1,
  'page_size': 2,
  'cursor': 'cursor',
  'sort': 'sort',
  'q': 'q',
};
final result = await client.rtcMediaSessions.list(params);
print(result);
```

## Authentication

```text
Authorization: Bearer <authToken>
Access-Token: <accessToken>
```


## Configuration (Non-Auth)

```dart
final client = SdkworkAppClient.withBaseUrl(baseUrl: 'http://127.0.0.1:18088');
client.setHeader('X-Custom-Header', 'value');
```

## API Modules

- `client.rtcMediaSessions` - rtc_media_sessions API
- `client.rtcParticipantCredentials` - rtc_participant_credentials API
- `client.rtcRecordingArtifacts` - rtc_recording_artifacts API
- `client.rtcProviderProfiles` - rtc_provider_profiles API
- `client.rtcRooms` - rtc_rooms API

## Usage Examples

### rtc_media_sessions

```dart
// Rtc media Sessions list.
final params = <String, dynamic>{
  'page': 1,
  'page_size': 2,
  'cursor': 'cursor',
  'sort': 'sort',
  'q': 'q',
};
final result = await client.rtcMediaSessions.list(params);
print(result);
```

### rtc_participant_credentials

```dart
// Rtc media Sessions participant Credentials issue.
final mediaSessionId = '1';
final participantId = '1';
final body = <String, dynamic>{
};
final idempotencyKey = 'Idempotency-Key';
final result = await client.rtcParticipantCredentials.rtcMediaSessionsParticipantCredentialsIssue(mediaSessionId, participantId, body, idempotencyKey);
print(result);
```

### rtc_recording_artifacts

```dart
// Rtc media Sessions recording Artifacts list.
final mediaSessionId = '1';
final params = <String, dynamic>{
  'page': 1,
  'page_size': 2,
  'cursor': 'cursor',
  'sort': 'sort',
  'q': 'q',
};
final result = await client.rtcRecordingArtifacts.rtcMediaSessionsRecordingArtifactsList(mediaSessionId, params);
print(result);
```

### rtc_provider_profiles

```dart
// Rtc provider Profiles active list.
final params = <String, dynamic>{
  'page': 1,
  'page_size': 2,
  'cursor': 'cursor',
  'sort': 'sort',
  'q': 'q',
};
final result = await client.rtcProviderProfiles.activeList(params);
print(result);
```

### rtc_rooms

```dart
// Rtc rooms list.
final params = <String, dynamic>{
  'page': 1,
  'page_size': 2,
  'cursor': 'cursor',
  'sort': 'sort',
  'q': 'q',
};
final result = await client.rtcRooms.list(params);
print(result);
```

## Error Handling

```dart
try {
  final params = <String, dynamic>{
    'page': 1,
    'page_size': 2,
    'cursor': 'cursor',
    'sort': 'sort',
    'q': 'q',
  };
  final result = await client.rtcMediaSessions.list(params);
  print(result);
} catch (error) {
  print('Error: $error');
}
```

## Publishing

This SDK includes cross-platform publish scripts in `bin/`:
- `bin/publish-core.mjs`
- `bin/publish.sh`
- `bin/publish.ps1`

### Check

```bash
./bin/publish.sh --action check
```

### Publish

```bash
./bin/publish.sh --action publish --channel release
```

```powershell
.\bin\publish.ps1 --action publish --channel test --dry-run
```

> Ensure `dart pub publish --dry-run` passes before release publish.

## License

MIT

## Regeneration Contract

- HTTP/OpenAPI generator-owned files are tracked in `.sdkwork/sdkwork-generator-manifest.json`.
- HTTP/OpenAPI generation also writes `.sdkwork/sdkwork-generator-changes.json` so automation can inspect created, updated, deleted, unchanged, scaffolded, and backed-up files plus the classified impact areas, verification plan, and execution decision for the latest generation.
- HTTP/OpenAPI apply mode also writes `.sdkwork/sdkwork-generator-report.json` with the full execution report, including `schemaVersion`, `generator`, stable artifact paths, and the execution handoff commands that match CLI `--json` output.
- CLI JSON output also includes an execution handoff with concrete next commands, including reviewed apply commands for dry-run flows.
- Put HTTP/OpenAPI hand-written wrappers, adapters, and orchestration in `custom/`.
- Files scaffolded under `custom/` are created once and preserved across HTTP/OpenAPI regenerations.
- If an HTTP/OpenAPI generated-owned file was modified locally, its previous content is copied to `.sdkwork/manual-backups/` before overwrite or removal.
- RPC SDK source workspaces use convention-first evidence by default: RPC SDK family naming, language workspace naming, `rpc/*.manifest.json`, proto source references, generated client source, and native package manifests.
- Use `sdkgen inspect --protocol rpc` to verify RPC convention evidence. Request persisted generator evidence only with `--emit-control-plane` for release, CI, audit, or migration workflows; evidence paths are derived by generator convention.
