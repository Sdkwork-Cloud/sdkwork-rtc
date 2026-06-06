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
- package boundary statuses are standardized as `root_public_reference_boundary` for builtin root-public
  packages and `package_reference_boundary` for non-builtin executable package boundaries
- every package manifest must declare the TypeScript vendor SDK contract:
  `consumer-supplied` provisioning, `native-factory` binding, `must-not-bundle`
  bundle policy, `reference-baseline` runtime bridge status, and official vendor SDK requirement of `required`
- built-in providers are the only provider packages whose driver factory and module symbol may be
  re-exported from the root `@sdkwork/rtc-sdk` entrypoint
- the root `@sdkwork/rtc-sdk` package does not re-export future non-builtin provider packages
- each provider package wraps the official vendor SDK instead of re-implementing media runtime
