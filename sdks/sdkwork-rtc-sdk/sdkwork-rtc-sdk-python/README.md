# SDKWork RTC SDK Python Workspace

Language: `python`

Planned public package:

- `sdkwork-rtc-sdk`

Current boundary:

- control SDK support: yes
- runtime bridge support: reserved
- maturity tier: reserved

Current role:

- Reserved workspace skeleton
- provider metadata and driver selection standards
- reserved Python language boundary for automation or control-plane integration
- no runtime bridge is claimed in the current landing
- code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing
- metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing
- resolution scaffold fixes metadata-only driver manager, data source, provider support, and provider package loader boundaries before runtime bridge landing

This workspace is the reserved Python standard boundary for provider metadata, driver selection, and future automation or control-plane integration.

Default provider contract:

- default provider key: `volcengine`
- default plugin id: `rtc-volcengine`
- default driver id: `sdkwork-rtc-driver-volcengine`
- language metadata and selection scaffolds must preserve that assembly-driven default
  provider identity for future runtime bridge landings


Language workspace catalog:

- workspace catalog: `sdkwork_rtc_sdk/language_workspace_catalog.py`
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

- build system: pyproject
- manifest: `pyproject.toml`
- contract scaffold: `sdkwork_rtc_sdk/standard_contract.py`


Metadata scaffold:

- provider catalog: `sdkwork_rtc_sdk/provider_catalog.py`
- provider package catalog: `sdkwork_rtc_sdk/provider_package_catalog.py`
- provider activation catalog: `sdkwork_rtc_sdk/provider_activation_catalog.py`
- capability catalog: `sdkwork_rtc_sdk/capability_catalog.py`
- provider extension catalog: `sdkwork_rtc_sdk/provider_extension_catalog.py`
- provider selection: `sdkwork_rtc_sdk/provider_selection.py`
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

- driver manager: `sdkwork_rtc_sdk/driver_manager.py`
- data source: `sdkwork_rtc_sdk/data_source.py`
- provider support: `sdkwork_rtc_sdk/provider_support.py`
- provider package loader: `sdkwork_rtc_sdk/provider_package_loader.py`


Provider package scaffold:

- scaffold: `providers/provider-package-scaffold.md`
- directory pattern: `providers/sdkwork_rtc_sdk_provider_{providerKey}`
- package pattern: `sdkwork-rtc-sdk-provider-{providerKey}`
- manifest file name: `pyproject.toml`
- readme file name: `README.md`
- source file pattern: `sdkwork_rtc_sdk_provider_{providerKey}/__init__.py`
- source symbol pattern: `RtcProvider{providerPascal}PackageContract`
- template tokens: `{providerKey}`
- source template tokens: `{providerKey}`, `{providerPascal}`
- status: `future-runtime-bridge-only`
- runtime bridge status: `reserved`
- root public exposure: `false`


Standards references:

- `../docs/provider-adapter-standard.md`
- `../docs/multilanguage-capability-matrix.md`
