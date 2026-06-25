# RTC Container Images

## Image

`ghcr.io/sdkwork/rtc-api-server` ships:

- `/opt/sdkwork/rtc/bin/sdkwork-rtc-api-server`
- `/opt/sdkwork/rtc/bin/sdkwork-rtc-reconcile`

## Build

Run from the SDKWork workspace root (sibling repositories must be present):

```powershell
docker build -f sdkwork-rtc/deployments/docker/Dockerfile -t ghcr.io/sdkwork/rtc-api-server:latest .
```

Required sibling repositories:

- `sdkwork-database`
- `sdkwork-web-framework`
- `sdkwork-drive`
- `sdkwork-appbase`
- `sdkwork-utils`
- `sdkwork-id`

CI should clone them via `node sdkwork-rtc/scripts/prepare-ci-dependencies.mjs --apply` before building.

## Runtime

Mount secrets and database configuration through environment variables or `EnvironmentFile`.
See `deployments/templates/server.env.example` and Kubernetes manifests under
`deployments/kubernetes/cloud-split-services/`.

## Local compose

`docker-compose.standalone.example.yaml` demonstrates API server + PostgreSQL for integration testing.
Copy to a protected location and replace placeholder credentials before use.
