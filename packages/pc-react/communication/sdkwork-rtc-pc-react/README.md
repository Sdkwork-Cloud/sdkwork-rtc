# @sdkwork/rtc-pc-react

## Purpose

Realtime audio, video, live media sessions, room state, and media controls.

## Placement

- Architecture: `pc-react`
- Domain: `communication`
- Capability: `rtc`
- Status: `ready`

## Depends on

- `@sdkwork/ui-pc-react` for shared UI primitives and patterns
- `@sdkwork/core-pc-react` for SDK runtime, env, and session integration
- Lower-level RTC workspace packages only

## Extraction sources

- `sdkwork-chat-pc-rtc`
- `sdkwork-react-backend-rtc`

## Next implementation steps

- Keep package contracts under the public `src` surface
- Keep reusable services behind injected RTC SDK clients
- Add UI composition surfaces under `src/components` as workflows mature
- Register routes or manifest metadata under `src/routes` or `src/manifests`
