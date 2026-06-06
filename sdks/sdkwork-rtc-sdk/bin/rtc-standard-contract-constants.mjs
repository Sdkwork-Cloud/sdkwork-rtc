export const RTC_PROVIDER_SELECTION_SOURCES = Object.freeze([
  'provider_url',
  'provider_key',
  'tenant_override',
  'deployment_profile',
  'default_provider',
]);

export const RTC_PROVIDER_SELECTION_PRECEDENCE = RTC_PROVIDER_SELECTION_SOURCES;

export const DEFAULT_RTC_PROVIDER_KEY = 'volcengine';

export const BUILTIN_RTC_PROVIDER_KEYS = Object.freeze([
  'volcengine',
  'aliyun',
  'tencent',
  'agora',
  'livekit',
]);

export const OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS = Object.freeze([
  'typescript',
  'flutter',
  'rust',
  'java',
  'csharp',
  'swift',
  'kotlin',
  'go',
  'python',
]);

export const RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS = Object.freeze([
  'default',
  'reuse-live-connection',
]);

export const RTC_PROVIDER_SUPPORT_STATUSES = Object.freeze([
  'builtin_registered',
  'official_registered',
  'official_unregistered',
  'unknown',
]);

export const RTC_PROVIDER_ACTIVATION_STATUSES = Object.freeze([
  'root-public-builtin',
  'package-boundary',
  'control-metadata-only',
]);

export const RTC_PROVIDER_TIERS = Object.freeze([
  'tier-a',
  'tier-b',
  'tier-c',
]);

export const RTC_PROVIDER_TIER_SUMMARIES = Object.freeze({
  'tier-a': 'Built-in baseline providers',
  'tier-b': 'Official extension targets with reserved adapter positions',
  'tier-c': 'Future SPI targets',
});

export const RTC_PROVIDER_PACKAGE_BOUNDARY_MODES = Object.freeze([
  'catalog-governed-mixed',
  'scaffold-per-provider-package',
]);

export const RTC_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES = Object.freeze([
  'builtin-only',
  'none',
]);

export const RTC_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS = Object.freeze([
  'root_public_reference_boundary',
  'package_reference_boundary',
  'future-runtime-bridge-only',
]);

export const RTC_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS = Object.freeze([
  'reference-baseline',
  'reserved',
]);

export const RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES = Object.freeze({
  reference: Object.freeze({
    mode: 'catalog-governed-mixed',
    rootPublicPolicy: 'builtin-only',
    lifecycleStatusTerms: Object.freeze([
      'root_public_reference_boundary',
      'package_reference_boundary',
    ]),
    runtimeBridgeStatusTerms: Object.freeze(['reference-baseline']),
  }),
  reserved: Object.freeze({
    mode: 'scaffold-per-provider-package',
    rootPublicPolicy: 'none',
    lifecycleStatusTerms: Object.freeze(['future-runtime-bridge-only']),
    runtimeBridgeStatusTerms: Object.freeze(['reserved']),
  }),
});

export const REQUIRED_RTC_CAPABILITIES = Object.freeze([
  'session',
  'credential',
  'callback',
  'health',
  'call.audio',
  'call.video',
  'live.broadcast',
  'live.audience',
]);

export const OPTIONAL_RTC_CAPABILITIES = Object.freeze([
  'screen-share',
  'recording',
  'artifact',
  'cloud-mix',
  'cdn-relay',
  'data-channel',
  'transcription',
  'beauty',
  'spatial-audio',
  'e2ee',
]);

export const RTC_CAPABILITY_CATEGORIES = Object.freeze([
  'required-baseline',
  'optional-advanced',
]);

export const RTC_CAPABILITY_SURFACES = Object.freeze([
  'control-plane',
  'runtime-bridge',
  'cross-surface',
]);

export const RTC_CAPABILITY_NEGOTIATION_STATUSES = Object.freeze([
  'supported',
  'degraded',
  'unsupported',
]);

export const RTC_CAPABILITY_NEGOTIATION_RULES = Object.freeze({
  supported: 'all-requested-capabilities-available',
  degraded: 'all-required-capabilities-available_optional-capabilities-missing',
  unsupported: 'required-capabilities-missing',
});

export const RTC_RUNTIME_SURFACE_METHODS = Object.freeze([
  'join',
  'leave',
  'publish',
  'unpublish',
  'muteAudio',
  'muteVideo',
]);

export const RTC_RUNTIME_SURFACE_FAILURE_CODE = 'native_sdk_not_available';

export const RTC_SIGNALING_TRANSPORT_TERM = 'websocket-only';

export const RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH = 'connectOptions.webSocketAuth';

export const RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM =
  'signaling-adapter-pass-through';

export const RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS = Object.freeze([
  'automatic',
  'headerBearer',
  'queryBearer',
  'none',
]);

export const RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE = 'automatic';

export const RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM =
  'top-level-device-id';

export const RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM =
  'must-match-top-level-device-id';

export const RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM =
  'shared-rtc-live-connection';

export const RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM = 'not-supported';

export const RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM = 'fail-fast';

export const RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM = 'runtime-frozen';

export const RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM = 'immutable-snapshots';

export const RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM = 'shallow-immutable-context';

export const RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM = 'mutable-native-client';

export const RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS = Object.freeze([
  './errors.js',
  './runtime-surface.js',
  './signaling-transport.js',
  './runtime-immutability.js',
  './root-public-surface.js',
  './types.js',
  './call-types.js',
  './call-controller.js',
  './call-session.js',
  './signaling-adapter.js',
  './standard-call-stack.js',
  './app-http-client.js',
  './capability-catalog.js',
  './capability-negotiation.js',
  './language-workspace-catalog.js',
  './provider-selection.js',
  './provider-support.js',
  './provider-extension-catalog.js',
  './provider-package-catalog.js',
  './provider-package-loader.js',
  './provider-activation-catalog.js',
  './capabilities.js',
  './client.js',
  './driver.js',
  './driver-manager.js',
  './data-source.js',
  './provider-module.js',
  './providers/index.js',
]);

export const RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS = Object.freeze([
  './providers/volcengine.js',
  './providers/aliyun.js',
  './providers/tencent.js',
  './providers/agora.js',
  './providers/livekit.js',
]);

export const RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES = Object.freeze([
  'createBuiltinRtcDriverManager',
]);

export const RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES = Object.freeze([
  'standard-contract',
  'provider-catalog',
  'provider-package-catalog',
  'provider-activation-catalog',
  'capability-catalog',
  'provider-extension-catalog',
  'language-workspace-catalog',
  'provider-selection',
  'provider-package-loader',
  'provider-support',
  'driver-manager',
  'data-source',
]);

export const RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS = Object.freeze({
  flutter: 'barrel',
  python: 'package-init',
});

export const RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM =
  'root-public-builtin-only';

export const RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM =
  'package-boundary-only';

export const RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS = Object.freeze([
  'lower-camel-rtc',
  'upper-camel-rtc',
  'snake-case-rtc',
]);

export const RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS = Object.freeze([
  'provider-catalog-by-provider-key',
  'provider-package-by-provider-key',
  'provider-package-by-package-identity',
  'provider-activation-by-provider-key',
  'capability-catalog',
  'capability-descriptor-by-capability-key',
  'provider-extension-catalog',
  'provider-extension-descriptor-by-extension-key',
  'provider-extensions-for-provider',
  'provider-extensions-by-extension-keys',
  'provider-extension-membership',
  'language-workspace-by-language',
  'provider-url-parser',
  'provider-selection-resolver',
  'provider-support-status-resolver',
  'provider-support-state-factory',
  'provider-package-loader-factory',
  'provider-package-load-target-resolver',
  'provider-module-loader',
  'single-provider-package-installer',
  'batch-provider-package-installer',
]);

export const RTC_LOOKUP_HELPER_NAMING_PROFILES = Object.freeze({
  'lower-camel-rtc': Object.freeze({
    languages: Object.freeze(['typescript', 'flutter', 'java', 'swift', 'kotlin']),
    helpers: Object.freeze({
      providerCatalogByProviderKey: 'getRtcProviderByProviderKey',
      providerPackageByProviderKey: 'getRtcProviderPackageByProviderKey',
      providerPackageByPackageIdentity: 'getRtcProviderPackageByPackageIdentity',
      providerActivationByProviderKey: 'getRtcProviderActivationByProviderKey',
      capabilityCatalog: 'getRtcCapabilityCatalog',
      capabilityDescriptorByCapabilityKey: 'getRtcCapabilityDescriptor',
      providerExtensionCatalog: 'getRtcProviderExtensionCatalog',
      providerExtensionDescriptorByExtensionKey: 'getRtcProviderExtensionDescriptor',
      providerExtensionsForProvider: 'getRtcProviderExtensionsForProvider',
      providerExtensionsByExtensionKeys: 'getRtcProviderExtensions',
      providerExtensionMembership: 'hasRtcProviderExtension',
      languageWorkspaceByLanguage: 'getRtcLanguageWorkspaceByLanguage',
      providerUrlParser: 'parseRtcProviderUrl',
      providerSelectionResolver: 'resolveRtcProviderSelection',
      providerSupportStatusResolver: 'resolveRtcProviderSupportStatus',
      providerSupportStateFactory: 'createRtcProviderSupportState',
      providerPackageLoaderFactory: 'createRtcProviderPackageLoader',
      providerPackageLoadTargetResolver: 'resolveRtcProviderPackageLoadTarget',
      providerModuleLoader: 'loadRtcProviderModule',
      singleProviderPackageInstaller: 'installRtcProviderPackage',
      batchProviderPackageInstaller: 'installRtcProviderPackages',
    }),
  }),
  'upper-camel-rtc': Object.freeze({
    languages: Object.freeze(['csharp', 'go']),
    helpers: Object.freeze({
      providerCatalogByProviderKey: 'GetRtcProviderByProviderKey',
      providerPackageByProviderKey: 'GetRtcProviderPackageByProviderKey',
      providerPackageByPackageIdentity: 'GetRtcProviderPackageByPackageIdentity',
      providerActivationByProviderKey: 'GetRtcProviderActivationByProviderKey',
      capabilityCatalog: 'GetRtcCapabilityCatalog',
      capabilityDescriptorByCapabilityKey: 'GetRtcCapabilityDescriptor',
      providerExtensionCatalog: 'GetRtcProviderExtensionCatalog',
      providerExtensionDescriptorByExtensionKey: 'GetRtcProviderExtensionDescriptor',
      providerExtensionsForProvider: 'GetRtcProviderExtensionsForProvider',
      providerExtensionsByExtensionKeys: 'GetRtcProviderExtensions',
      providerExtensionMembership: 'HasRtcProviderExtension',
      languageWorkspaceByLanguage: 'GetRtcLanguageWorkspaceByLanguage',
      providerUrlParser: 'ParseRtcProviderUrl',
      providerSelectionResolver: 'ResolveRtcProviderSelection',
      providerSupportStatusResolver: 'ResolveRtcProviderSupportStatus',
      providerSupportStateFactory: 'CreateRtcProviderSupportState',
      providerPackageLoaderFactory: 'CreateRtcProviderPackageLoader',
      providerPackageLoadTargetResolver: 'ResolveRtcProviderPackageLoadTarget',
      providerModuleLoader: 'LoadRtcProviderModule',
      singleProviderPackageInstaller: 'InstallRtcProviderPackage',
      batchProviderPackageInstaller: 'InstallRtcProviderPackages',
    }),
  }),
  'snake-case-rtc': Object.freeze({
    languages: Object.freeze(['rust', 'python']),
    helpers: Object.freeze({
      providerCatalogByProviderKey: 'get_rtc_provider_by_provider_key',
      providerPackageByProviderKey: 'get_rtc_provider_package_by_provider_key',
      providerPackageByPackageIdentity: 'get_rtc_provider_package_by_package_identity',
      providerActivationByProviderKey: 'get_rtc_provider_activation_by_provider_key',
      capabilityCatalog: 'get_rtc_capability_catalog',
      capabilityDescriptorByCapabilityKey: 'get_rtc_capability_descriptor',
      providerExtensionCatalog: 'get_rtc_provider_extension_catalog',
      providerExtensionDescriptorByExtensionKey: 'get_rtc_provider_extension_descriptor',
      providerExtensionsForProvider: 'get_rtc_provider_extensions_for_provider',
      providerExtensionsByExtensionKeys: 'get_rtc_provider_extensions',
      providerExtensionMembership: 'has_rtc_provider_extension',
      languageWorkspaceByLanguage: 'get_rtc_language_workspace_by_language',
      providerUrlParser: 'parse_rtc_provider_url',
      providerSelectionResolver: 'resolve_rtc_provider_selection',
      providerSupportStatusResolver: 'resolve_rtc_provider_support_status',
      providerSupportStateFactory: 'create_rtc_provider_support_state',
      providerPackageLoaderFactory: 'create_rtc_provider_package_loader',
      providerPackageLoadTargetResolver: 'resolve_rtc_provider_package_load_target',
      providerModuleLoader: 'load_rtc_provider_module',
      singleProviderPackageInstaller: 'install_rtc_provider_package',
      batchProviderPackageInstaller: 'install_rtc_provider_packages',
    }),
  }),
});

export const RTC_SDK_ERROR_CODES = Object.freeze([
  'provider_package_not_found',
  'provider_package_identity_mismatch',
  'provider_package_load_failed',
  'provider_module_export_missing',
  'provider_module_contract_mismatch',
  'driver_already_registered',
  'driver_not_found',
  'provider_not_official',
  'provider_not_supported',
  'provider_metadata_mismatch',
  'provider_selection_failed',
  'capability_not_supported',
  'invalid_provider_url',
  'invalid_native_config',
  'native_sdk_not_available',
  'signaling_not_available',
  'call_state_invalid',
  'vendor_error',
]);

export const RTC_SDK_ERROR_FALLBACK_CODE = 'vendor_error';

export const RTC_PROVIDER_EXTENSION_ACCESSES = Object.freeze([
  'unwrap-only',
  'extension-object',
]);

export const RTC_PROVIDER_EXTENSION_STATUSES = Object.freeze([
  'reference-baseline',
  'reserved',
]);

export const RTC_LANGUAGE_MATURITY_TIERS = Object.freeze([
  'reference',
  'reserved',
]);

export const RTC_LANGUAGE_MATURITY_TIER_SUMMARIES = Object.freeze({
  reference: 'Executable baseline language workspace',
  reserved: 'Official but not yet executable runtime-bridge workspace',
});

export const TYPESCRIPT_ADAPTER_SDK_PROVISIONING_VALUES = Object.freeze([
  'consumer-supplied',
]);

export const TYPESCRIPT_ADAPTER_BINDING_STRATEGIES = Object.freeze([
  'native-factory',
]);

export const TYPESCRIPT_ADAPTER_BUNDLE_POLICIES = Object.freeze([
  'must-not-bundle',
]);

export const TYPESCRIPT_ADAPTER_RUNTIME_BRIDGE_STATUSES = Object.freeze([
  'reference-baseline',
]);

export const TYPESCRIPT_ADAPTER_OFFICIAL_VENDOR_SDK_REQUIREMENTS = Object.freeze([
  'required',
]);

export const DEFAULT_TYPESCRIPT_ADAPTER_CONTRACT = Object.freeze({
  sdkProvisioning: 'consumer-supplied',
  bindingStrategy: 'native-factory',
  bundlePolicy: 'must-not-bundle',
  runtimeBridgeStatus: 'reference-baseline',
  officialVendorSdkRequirement: 'required',
});

export const DEFAULT_TYPESCRIPT_PACKAGE_STANDARD = Object.freeze({
  packageNamePattern: '@sdkwork/rtc-sdk-provider-{providerKey}',
  sourceModulePattern: '../../src/providers/{providerKey}.ts',
  driverFactoryPattern: 'create{providerPascal}RtcDriver',
  metadataSymbolPattern: '{providerUpperSnake}_RTC_PROVIDER_METADATA',
  moduleSymbolPattern: '{providerUpperSnake}_RTC_PROVIDER_MODULE',
  rootPublicRule: 'builtin-aligned',
});

export const DEFAULT_ROOT_PUBLIC_SURFACE_STANDARD = Object.freeze({
  typescriptProviderNeutralExportPaths:
    RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS,
  typescriptBuiltinProviderExportPaths:
    RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS,
  typescriptInlineHelperNames: RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES,
  reservedSurfaceFamilies: RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES,
  reservedEntryPointKinds: RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS,
  builtinProviderExposureTerm: RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM,
  nonBuiltinProviderExposureTerm: RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM,
});

export const DEFAULT_SIGNALING_TRANSPORT_STANDARD = Object.freeze({
  transportTerm: RTC_SIGNALING_TRANSPORT_TERM,
  authConfigPath: RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH,
  authPassThroughTerm: RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM,
  authModeTerms: RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS,
  recommendedAuthMode: RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE,
  deviceIdAuthorityTerm: RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM,
  connectOptionsDeviceIdRuleTerm:
    RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM,
  liveConnectionTerm: RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM,
  pollingFallbackTerm: RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM,
  authFailureTerm: RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM,
});

export const DEFAULT_LOOKUP_HELPER_NAMING_STANDARD = Object.freeze({
  profileTerms: RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS,
  familyTerms: RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS,
  profiles: RTC_LOOKUP_HELPER_NAMING_PROFILES,
});
