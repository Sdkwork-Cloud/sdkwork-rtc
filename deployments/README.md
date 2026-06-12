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

## Verification

Run `node --test tests/rtc-workspace-standard.test.mjs`.
