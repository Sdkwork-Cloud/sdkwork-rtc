# sdkwork-rtc-backend-sdk

Generated SDKWork v3 dual-token transport SDK.

## Installation

```bash
npm install sdkwork-rtc-backend-sdk-generated-typescript
# or
yarn add sdkwork-rtc-backend-sdk-generated-typescript
# or
pnpm add sdkwork-rtc-backend-sdk-generated-typescript
```

## Quick Start

```typescript
import { SdkworkBackendClient } from 'sdkwork-rtc-backend-sdk-generated-typescript';

const client = new SdkworkBackendClient({
  baseUrl: 'http://127.0.0.1:18080',
  timeout: 30000,
});

// Authentication
client.setAuthToken('your-auth-token');
client.setAccessToken('your-access-token');

// Use the SDK
const params = {
  page: 1,
  page_size: 2,
  cursor: 'cursor',
  sort: 'sort',
  q: 'q',
};
const result = await client.rtcMediaArtifacts.rtc.mediaArtifacts.list(params);
```

## Authentication

```text
Authorization: Bearer <authToken>
Access-Token: <accessToken>
```


## Configuration (Non-Auth)

```typescript
import { SdkworkBackendClient } from 'sdkwork-rtc-backend-sdk-generated-typescript';

const client = new SdkworkBackendClient({
  baseUrl: 'http://127.0.0.1:18080',
  timeout: 30000, // Request timeout in ms
  headers: {      // Custom headers
    'X-Custom-Header': 'value',
  },
});
```

## API Modules

- `client.rtcMediaArtifacts` - rtc_media_artifacts API
- `client.rtcMediaSessions` - rtc_media_sessions API
- `client.rtcProviderAccounts` - rtc_provider_accounts API
- `client.rtcProviderApplications` - rtc_provider_applications API
- `client.rtcProviderCredentials` - rtc_provider_credentials API
- `client.rtcProviderProfiles` - rtc_provider_profiles API
- `client.rtcProviderQueryJobs` - rtc_provider_query_jobs API
- `client.rtcProviderRoutes` - rtc_provider_routes API
- `client.rtcProviderWebhooks` - rtc_provider_webhooks API
- `client.rtcQualitySamples` - rtc_quality_samples API
- `client.rtcRooms` - rtc_rooms API

## Usage Examples

### rtc_media_artifacts

```typescript
// Rtc media Artifacts list.
const params = {
  page: 1,
  page_size: 2,
  cursor: 'cursor',
  sort: 'sort',
  q: 'q',
};
const result = await client.rtcMediaArtifacts.rtc.mediaArtifacts.list(params);
```

### rtc_media_sessions

```typescript
// Rtc media Sessions list.
const params = {
  page: 1,
  page_size: 2,
  cursor: 'cursor',
  sort: 'sort',
  q: 'q',
};
const result = await client.rtcMediaSessions.rtc.mediaSessions.list(params);
```

### rtc_provider_accounts

```typescript
// Rtc provider Accounts list.
const params = {
  page: 1,
  page_size: 2,
  cursor: 'cursor',
  sort: 'sort',
  q: 'q',
};
const result = await client.rtcProviderAccounts.rtc.providerAccounts.list(params);
```

### rtc_provider_applications

```typescript
// Rtc provider Applications retrieve.
const providerApplicationId = '1';
const result = await client.rtcProviderApplications.rtc.providerApplications.retrieve(providerApplicationId);
```

### rtc_provider_credentials

```typescript
// Rtc provider Credentials retrieve.
const providerCredentialId = '1';
const result = await client.rtcProviderCredentials.rtc.providerCredentials.retrieve(providerCredentialId);
```

### rtc_provider_profiles

```typescript
// Rtc provider Profiles list.
const params = {
  page: 1,
  page_size: 2,
  cursor: 'cursor',
  sort: 'sort',
  q: 'q',
};
const result = await client.rtcProviderProfiles.rtc.providerProfiles.list(params);
```

### rtc_provider_query_jobs

```typescript
// Rtc provider Query Jobs create.
const body = {
  provider: 'provider',
  providerProfileId: 'providerProfileId',
  queryKind: 'room_online_users',
  roomId: 'roomId',
  mediaSessionId: 'mediaSessionId',
  providerSessionId: 'providerSessionId',
  cursor: 'cursor',
};
const result = await client.rtcProviderQueryJobs.rtc.providerQueryJobs.create(body);
```

### rtc_provider_routes

```typescript
// Rtc provider Routes list.
const params = {
  page: 1,
  page_size: 2,
  cursor: 'cursor',
  sort: 'sort',
  q: 'q',
};
const result = await client.rtcProviderRoutes.rtc.providerRoutes.list(params);
```

### rtc_provider_webhooks

```typescript
// Rtc provider Webhooks events list.
const params = {
  page: 1,
  page_size: 2,
  cursor: 'cursor',
  sort: 'sort',
  q: 'q',
};
const result = await client.rtcProviderWebhooks.rtc.providerWebhooks.events.list(params);
```

### rtc_quality_samples

```typescript
// Rtc quality Samples list.
const params = {
  page: 1,
  page_size: 2,
  cursor: 'cursor',
  sort: 'sort',
  q: 'q',
};
const result = await client.rtcQualitySamples.rtc.qualitySamples.list(params);
```

### rtc_rooms

```typescript
// Rtc rooms list.
const params = {
  page: 1,
  page_size: 2,
  cursor: 'cursor',
  sort: 'sort',
  q: 'q',
};
const result = await client.rtcRooms.rtc.rooms.list(params);
```

## Error Handling

```typescript
import { SdkworkBackendClient, NetworkError, TimeoutError, AuthenticationError } from 'sdkwork-rtc-backend-sdk-generated-typescript';

try {
  const params = {
    page: 1,
    page_size: 2,
    cursor: 'cursor',
    sort: 'sort',
    q: 'q',
  };
  const result = await client.rtcMediaArtifacts.rtc.mediaArtifacts.list(params);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof TimeoutError) {
    console.error('Request timed out:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else {
    throw error;
  }
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

> Configure npm registry credentials before release publish.

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
