# RTC Deployments

## Purpose

`deployments/` is reserved for RTC deployment descriptors, topology examples, packaging handoff files, and deployment runbooks.

## Owner

sdkwork-rtc.

## Allowed Content

- Docker, Kubernetes, systemd, nginx, and environment topology examples.
- Release deployment notes and runbooks.
- Non-secret deployment templates.

## Forbidden Content

- Live secrets, private keys, local override files, or runtime state.
- Runtime logs, caches, databases, or generated user data.
- Application source code.

## Related Specs

- `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
- `../sdkwork-specs/DEPLOYMENT_SPEC.md`
- `../sdkwork-specs/RELEASE_SPEC.md`

## Kubernetes

See `kubernetes/README.md` for cloud production manifests (`rtc-standalone-gateway`, `rtc-reconcile` CronJob).

## systemd (standalone appliance)

- `systemd/sdkwork-api-rtc-standalone-gateway.service` — API server unit
- `systemd/sdkwork-rtc-reconcile.service` + `sdkwork-rtc-reconcile.timer` — periodic reconciliation

## Docker

See `docker/README.md` for multi-stage image build and local compose example.

## Server archive

`node scripts/package-server.mjs package` produces `artifacts/release/server/sdkwork-rtc-<version>-<platform>-<arch>-server.tar.gz`
with `sdkwork-api-rtc-standalone-gateway` and `sdkwork-rtc-reconcile` binaries.

## Templates

- `templates/server.env.example` — production environment keys (non-secret)

## Verification

Run `node --test tests/rtc-workspace-standard.test.mjs`.

## Operator documentation

See `docs/guides/operator/deployment.md` for production rollout, environment keys, and go-live verification.

## Build output

Local and CI package output under `artifacts/release/` is gitignored; publish via GitHub Actions (`package.yml`, `rtc-server-image.yml`).
