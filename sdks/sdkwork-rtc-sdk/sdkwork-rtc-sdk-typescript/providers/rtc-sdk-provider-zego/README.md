# @sdkwork/rtc-sdk-provider-zego

Reserved TypeScript provider package boundary for ZEGO RTC.

- provider key: `zego`
- tier: `tier-b`
- builtin: `false`
- status: `package_reference_boundary`
- vendor sdk provisioning: `consumer-supplied`
- binding strategy: `native-factory`
- bundle policy: `must-not-bundle`
- runtime bridge status: `reserved`
- official vendor sdk requirement: `not-declared-until-bridge`
- required capabilities: `session`, `credential`, `provider.webhook`, `health`, `media.audio`, `media.video`, `live.broadcast`, `live.audience`, `provider.event-normalization`
- optional capabilities: `screen-share`, `recording`, `artifact`, `cloud-mix`, `beauty`, `provider.active-query`
- provider extension keys: `zego.native-client`

Rules:

- Reserved TypeScript provider package boundary
- reserves the official provider plugin boundary until a verified official runtime bridge is implemented
- accepts consumer-supplied `nativeFactory` and `runtimeController` hooks for application-owned bridge injection
- does not declare vendor SDK peer dependencies or expose an official bridge factory until the package owns a verified bridge
- depends on the core `@sdkwork/rtc-sdk` contracts
- registers through the `RtcProviderModule` adapter contract
- ships executable `index.js` and `index.d.ts` entrypoints
- declares `exports` so `import` and `default` resolve to `index.js` and `types` resolve
  to `index.d.ts`
- driver factories and provider module symbols live only behind this provider package boundary
- the root `@sdkwork/rtc-sdk` package exposes provider-neutral SPI, catalogs, loader, manager, and
  data-source contracts but does not re-export this provider implementation
