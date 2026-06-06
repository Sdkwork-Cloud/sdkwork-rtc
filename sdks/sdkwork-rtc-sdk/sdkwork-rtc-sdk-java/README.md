# SDKWork RTC SDK Java Workspace

Language: `java`

Planned public package:

- `com.sdkwork:rtc-sdk`

Current boundary:

- control SDK support: yes
- runtime bridge support: reserved
- maturity tier: reserved

Current role:

- Reserved workspace skeleton
- provider metadata and driver selection standards
- reserved Java language boundary for future enterprise runtime integration
- no runtime bridge is claimed in the current landing
- code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing
- metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing
- resolution scaffold fixes metadata-only driver manager, data source, provider support, and provider package loader boundaries before runtime bridge landing

This workspace is the reserved Java standard boundary for provider metadata, driver selection, and future enterprise runtime integration.

Default provider contract:

- default provider key: `volcengine`
- default plugin id: `rtc-volcengine`
- default driver id: `sdkwork-rtc-driver-volcengine`
- language metadata and selection scaffolds must preserve that assembly-driven default
  provider identity for future runtime bridge landings


Language workspace catalog:

- workspace catalog: `src/main/java/com/sdkwork/rtc/metadata/RtcLanguageWorkspaceCatalog.java`
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

- build system: maven
- manifest: `pom.xml`
- contract scaffold: `src/main/java/com/sdkwork/rtc/standard/RtcStandardContract.java`


Metadata scaffold:

- provider catalog: `src/main/java/com/sdkwork/rtc/metadata/RtcProviderCatalog.java`
- provider package catalog: `src/main/java/com/sdkwork/rtc/metadata/RtcProviderPackageCatalog.java`
- provider activation catalog: `src/main/java/com/sdkwork/rtc/metadata/RtcProviderActivationCatalog.java`
- capability catalog: `src/main/java/com/sdkwork/rtc/metadata/RtcCapabilityCatalog.java`
- provider extension catalog: `src/main/java/com/sdkwork/rtc/metadata/RtcProviderExtensionCatalog.java`
- provider selection: `src/main/java/com/sdkwork/rtc/metadata/RtcProviderSelection.java`
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

- driver manager: `src/main/java/com/sdkwork/rtc/metadata/RtcDriverManager.java`
- data source: `src/main/java/com/sdkwork/rtc/metadata/RtcDataSource.java`
- provider support: `src/main/java/com/sdkwork/rtc/metadata/RtcProviderSupport.java`
- provider package loader: `src/main/java/com/sdkwork/rtc/metadata/RtcProviderPackageLoader.java`


Provider package scaffold:

- scaffold: `providers/provider-package-scaffold.md`
- directory pattern: `providers/rtc-sdk-provider-{providerKey}`
- package pattern: `com.sdkwork:rtc-sdk-provider-{providerKey}`
- manifest file name: `pom.xml`
- readme file name: `README.md`
- source file pattern: `src/main/java/com/sdkwork/rtc/provider/{providerKey}/RtcProvider{providerPascal}PackageContract.java`
- source symbol pattern: `RtcProvider{providerPascal}PackageContract`
- template tokens: `{providerKey}`
- source template tokens: `{providerKey}`, `{providerPascal}`
- status: `future-runtime-bridge-only`
- runtime bridge status: `reserved`
- root public exposure: `false`


Standards references:

- `../docs/provider-adapter-standard.md`
- `../docs/multilanguage-capability-matrix.md`
