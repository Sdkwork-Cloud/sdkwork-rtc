# @sdkwork/rtc-sdk-provider-agora

Reference TypeScript provider package boundary for Agora RTC.

- provider key: `agora`
- tier: `tier-a`
- builtin: `true`
- status: `root_public_reference_boundary`
- vendor sdk provisioning: `consumer-supplied`
- binding strategy: `native-factory`
- bundle policy: `must-not-bundle`
- runtime bridge status: `reference-baseline`
- official vendor sdk requirement: `required`
- required capabilities: `session`, `credential`, `callback`, `health`, `call.audio`, `call.video`, `live.broadcast`, `live.audience`
- optional capabilities: `screen-share`, `recording`, `artifact`, `cloud-mix`, `data-channel`, `spatial-audio`, `e2ee`
- provider extension keys: `agora.native-client`

Rules:

- wraps the official vendor SDK instead of re-implementing media runtime
- depends on the core `@sdkwork/rtc-sdk` contracts
- registers through the `RtcProviderModule` adapter contract
- ships executable `index.js` and `index.d.ts` entrypoints
- declares `exports` so `import` and `default` resolve to `index.js` and `types` resolve
  to `index.d.ts`
- the driver factory and provider module symbol may be re-exported from the root `@sdkwork/rtc-sdk` entrypoint because this provider is builtin
