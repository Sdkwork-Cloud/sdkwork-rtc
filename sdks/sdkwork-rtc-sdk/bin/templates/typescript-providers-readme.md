# RTC TypeScript Provider Packages

This directory materializes one-provider-only TypeScript package boundaries for official RTC adapters.

Rules:

- one directory per official provider
- provider package identity is assembly-driven through each provider `typescriptPackage` contract
- runtime registration uses the `RtcProviderModule` contract
- every provider package must ship executable `index.js` and `index.d.ts` entrypoints
- every provider package must declare `exports` that map `import` and `default` to
  `index.js` and `types` to `index.d.ts`
- every package manifest must declare `sourceModule`, `driverFactory`, `metadataSymbol`, and
  `moduleSymbol`
- every package manifest must declare `requiredCapabilities` and `optionalCapabilities` from the
  assembly-driven provider catalog
- every package manifest must declare the provider extension keys bound to that provider package
- the assembly-driven machine-readable package boundary catalog lives at
  `../src/provider-package-catalog.ts`
- package boundary statuses are standardized as `package_reference_boundary` for executable
  provider plugin package boundaries
- every package manifest must declare the TypeScript vendor SDK contract:
  `consumer-supplied` provisioning, `native-factory` binding, `must-not-bundle`
  bundle policy, the provider-specific runtime bridge status, and the matching official vendor SDK
  requirement
- provider driver factories and module symbols must not be re-exported from the root
  `@sdkwork/rtc-sdk` entrypoint
- the root `@sdkwork/rtc-sdk` package exposes provider-neutral SPI, catalogs, loaders, manager,
  and data-source contracts only
- `reference-baseline` provider packages wrap verified official vendor SDK bridges
- `reserved` provider packages keep the official plugin boundary and accept consumer-supplied
  `nativeFactory` / `runtimeController` hooks, but do not declare vendor SDK peers until a verified
  official bridge is implemented
