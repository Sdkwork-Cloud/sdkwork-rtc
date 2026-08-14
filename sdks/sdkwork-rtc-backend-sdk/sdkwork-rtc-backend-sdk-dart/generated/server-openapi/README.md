# sdkwork-rtc-backend-sdk (Dart)

Generated SDKWork v3 dual-token transport SDK.

## Installation

```bash
dart pub add sdkwork_rtc_backend_sdk_generated_dart
```

## Quick Start

```dart
import 'package:sdkwork_rtc_backend_sdk_generated_dart/sdkwork_rtc_backend_sdk_generated_dart.dart';

final client = SdkworkBackendClient(
  config: const SdkConfig(
    baseUrl: 'http://127.0.0.1:18088',
  ),
);
client.setAuthToken('your-auth-token');
client.setAccessToken('your-access-token');

// Use the SDK
final result = await client.rtcProviderPlugins.list();
print(result);
```

## Authentication

```text
Authorization: Bearer <authToken>
Access-Token: <accessToken>
```


## Configuration (Non-Auth)

```dart
final client = SdkworkBackendClient.withBaseUrl(baseUrl: 'http://127.0.0.1:18088');
client.setHeader('X-Custom-Header', 'value');
```

## API Modules

- `client.rtcMediaArtifacts` - rtc_media_artifacts API
- `client.rtcMediaSessions` - rtc_media_sessions API
- `client.rtcProviderAccounts` - rtc_provider_accounts API
- `client.rtcProviderApplications` - rtc_provider_applications API
- `client.rtcProviderCredentials` - rtc_provider_credentials API
- `client.rtcProviderPlugins` - rtc_provider_plugins API
- `client.rtcProviderProfiles` - rtc_provider_profiles API
- `client.rtcProviderQueryJobs` - rtc_provider_query_jobs API
- `client.rtcProviderRoutes` - rtc_provider_routes API
- `client.rtcProviderSchemas` - rtc_provider_schemas API
- `client.rtcProviderWebhooks` - rtc_provider_webhooks API
- `client.rtcQualitySamples` - rtc_quality_samples API
- `client.rtcRooms` - rtc_rooms API

## Usage Examples

### rtc_media_artifacts

```dart
// Rtc media Artifacts list.
final params = <String, dynamic>{
  'page': 1,
  'page_size': 2,
  'cursor': 'cursor',
  'sort': 'sort',
  'q': 'q',
  'status': 'pending',
  'createdAfter': '2026-04-10T00:00:00Z',
};
final result = await client.rtcMediaArtifacts.list(params);
print(result);
```

### rtc_media_sessions

```dart
// Rtc media Sessions list.
final params = <String, dynamic>{
  'page': 1,
  'page_size': 2,
  'cursor': 'cursor',
  'sort': 'sort',
  'q': 'q',
  'status': 'preparing',
  'ownerUserId': '1',
  'createdAfter': '2026-04-10T00:00:00Z',
};
final result = await client.rtcMediaSessions.list(params);
print(result);
```

### rtc_provider_accounts

```dart
// Rtc provider Accounts list.
final params = <String, dynamic>{
  'page': 1,
  'page_size': 2,
  'cursor': 'cursor',
  'sort': 'sort',
  'q': 'q',
};
final result = await client.rtcProviderAccounts.list(params);
print(result);
```

### rtc_provider_applications

```dart
// Rtc provider Applications retrieve.
final providerApplicationId = '1';
final result = await client.rtcProviderApplications.retrieve(providerApplicationId);
print(result);
```

### rtc_provider_credentials

```dart
// Rtc provider Credentials retrieve.
final providerCredentialId = '1';
final result = await client.rtcProviderCredentials.retrieve(providerCredentialId);
print(result);
```

### rtc_provider_plugins

```dart
// Rtc provider Plugins list.
final result = await client.rtcProviderPlugins.list();
print(result);
```

### rtc_provider_profiles

```dart
// Rtc provider Profiles list.
final params = <String, dynamic>{
  'page': 1,
  'page_size': 2,
  'cursor': 'cursor',
  'sort': 'sort',
  'q': 'q',
};
final result = await client.rtcProviderProfiles.list(params);
print(result);
```

### rtc_provider_query_jobs

```dart
// Rtc provider Query Jobs retrieve.
final providerQueryJobId = '1';
final result = await client.rtcProviderQueryJobs.retrieve(providerQueryJobId);
print(result);
```

### rtc_provider_routes

```dart
// Rtc provider Routes list.
final params = <String, dynamic>{
  'page': 1,
  'page_size': 2,
  'cursor': 'cursor',
  'sort': 'sort',
  'q': 'q',
};
final result = await client.rtcProviderRoutes.list(params);
print(result);
```

### rtc_provider_schemas

```dart
// Rtc provider Schemas list.
final result = await client.rtcProviderSchemas.list();
print(result);
```

### rtc_provider_webhooks

```dart
// Rtc provider Webhooks events list.
final params = <String, dynamic>{
  'page': 1,
  'page_size': 2,
  'cursor': 'cursor',
  'sort': 'sort',
  'q': 'q',
};
final result = await client.rtcProviderWebhooks.eventsList(params);
print(result);
```

### rtc_quality_samples

```dart
// Rtc quality Samples list.
final params = <String, dynamic>{
  'page': 1,
  'page_size': 2,
  'cursor': 'cursor',
  'sort': 'sort',
  'q': 'q',
  'createdAfter': '2026-04-10T00:00:00Z',
};
final result = await client.rtcQualitySamples.list(params);
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
  'status': 'active',
  'ownerUserId': '1',
  'createdAfter': '2026-04-10T00:00:00Z',
};
final result = await client.rtcRooms.list(params);
print(result);
```

## Error Handling

```dart
try {
  final result = await client.rtcProviderPlugins.list();
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
