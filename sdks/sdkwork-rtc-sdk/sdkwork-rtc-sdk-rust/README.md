# SDKWork RTC SDK Rust Workspace

Language: `rust`

Planned public package:

- `rtc_sdk`

Current boundary:

- control SDK support: yes
- runtime bridge support: reserved
- maturity tier: reserved

Current role:

- Reserved workspace skeleton
- provider metadata and driver selection standards
- reserved Rust workspace boundary for control-plane expansion
- no runtime bridge is claimed in the current landing
- code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing
- metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing
- resolution scaffold fixes metadata-only driver manager, data source, provider support, and provider package loader boundaries before runtime bridge landing

This workspace is the reserved Rust standard boundary for provider metadata, selection, and future control-plane integration.

Default provider contract:

- default provider key: `volcengine`
- default plugin id: `rtc-volcengine`
- default driver id: `sdkwork-rtc-driver-volcengine`
- language metadata and selection scaffolds must preserve that assembly-driven default
  provider identity for future runtime bridge landings


Language workspace catalog:

- workspace catalog: `src/language_workspace_catalog.rs`
- workspace catalog entries also keep `workspaceCatalogRelativePath`,
  `defaultProviderContract`, `providerSelectionContract`, `providerSupportContract`,
  `providerActivationContract`, any declared `runtimeBaseline`,
  `providerPackageBoundaryContract`, and any declared
  `metadataScaffold`, `resolutionScaffold`, `providerPackageBoundary`, and
  `providerPackageScaffold` boundaries so consumers can inspect official assembly-driven module
  locations, workspace-wide default provider identity, selection precedence, support-status
  vocabulary, activation-status vocabulary, runtime-baseline integration details, and
  package-boundary vocabulary without rereading the
  assembly.



Provider package boundary:

- mode: `scaffold-per-provider-package`
- root public policy: `none`
- lifecycle status terms: `future-runtime-bridge-only`
- runtime bridge status terms: `reserved`


Package scaffold:

- build system: cargo
- manifest: `Cargo.toml`
- contract scaffold: `src/lib.rs`


Metadata scaffold:

- provider catalog: `src/provider_catalog.rs`
- provider package catalog: `src/provider_package_catalog.rs`
- provider activation catalog: `src/provider_activation_catalog.rs`
- capability catalog: `src/capability_catalog.rs`
- provider extension catalog: `src/provider_extension_catalog.rs`
- provider selection: `src/provider_selection.rs`
- lookup helper naming contract: `lookupHelperNamingStandard`
- lookup helper naming profiles: `lower-camel-rtc`, `upper-camel-rtc`, `snake-case-rtc`
- explicit lookup helpers stay mandatory for metadata catalogs:
  provider catalog by provider key, provider package by provider key,
  provider activation by provider key, capability descriptor by capability key,
  provider extension catalog by extension key and provider key, provider URL parsing,
  provider selection resolution, provider support resolution, provider package loading, and
  language workspace by language
- helper naming stays language-idiomatic while preserving the same semantics:
  `getRtc...` for Flutter/Java/Swift/Kotlin, `GetRtc...` for C#/Go, and `get_rtc...` for Rust/Python


Resolution scaffold:

- driver manager: `src/driver_manager.rs`
- data source: `src/data_source.rs`
- provider support: `src/provider_support.rs`
- provider package loader: `src/provider_package_loader.rs`


Provider package scaffold:

- scaffold: `providers/provider-package-scaffold.md`
- directory pattern: `providers/rtc-sdk-provider-{providerKey}`
- package pattern: `rtc-sdk-provider-{providerKey}`
- manifest file name: `Cargo.toml`
- readme file name: `README.md`
- source file pattern: `src/lib.rs`
- source symbol pattern: `RtcProvider{providerPascal}PackageContract`
- template tokens: `{providerKey}`
- source template tokens: `{providerPascal}`
- status: `future-runtime-bridge-only`
- runtime bridge status: `reserved`
- root public exposure: `false`


Standards references:

- `../docs/provider-adapter-standard.md`
- `../docs/multilanguage-capability-matrix.md`
