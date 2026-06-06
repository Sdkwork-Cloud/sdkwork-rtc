# @sdkwork/rtc-sdk-provider-janus

Reference TypeScript provider package boundary for Janus RTC.

- provider key: `janus`
- tier: `tier-c`
- builtin: `false`
- status: `package_reference_boundary`
- vendor sdk provisioning: `consumer-supplied`
- binding strategy: `native-factory`
- bundle policy: `must-not-bundle`
- runtime bridge status: `reference-baseline`
- official vendor sdk requirement: `required`
- required capabilities: `session`, `credential`, `callback`, `health`, `call.audio`, `call.video`, `live.broadcast`, `live.audience`
- optional capabilities: `data-channel`
- provider extension keys: `janus.native-client`

Rules:

- wraps the official vendor SDK instead of re-implementing media runtime
- depends on the core `@sdkwork/rtc-sdk` contracts
- registers through the `RtcProviderModule` adapter contract
- ships executable `index.js` and `index.d.ts` entrypoints
- declares `exports` so `import` and `default` resolve to `index.js` and `types` resolve
  to `index.d.ts`
- the driver factory and provider module symbol are not re-exported from the root `@sdkwork/rtc-sdk` entrypoint because this provider is not builtin
