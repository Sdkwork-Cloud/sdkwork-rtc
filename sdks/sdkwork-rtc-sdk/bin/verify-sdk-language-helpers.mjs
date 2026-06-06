import { RTC_LOOKUP_HELPER_NAMING_PROFILES } from './rtc-standard-contract-constants.mjs';

export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toGoExportedFieldToken(token) {
  if (!/^[a-z][A-Za-z0-9]*$/.test(token)) {
    return token;
  }

  return `${token.charAt(0).toUpperCase()}${token.slice(1)}`;
}

export function matchesReservedLanguageToken(language, content, token) {
  if (new RegExp(escapeRegExp(token)).test(content)) {
    return true;
  }

  if (language === 'go') {
    const goToken = toGoExportedFieldToken(token);
    if (goToken !== token && new RegExp(escapeRegExp(goToken)).test(content)) {
      return true;
    }
  }

  return false;
}

function getLookupHelperNamingProfile(language) {
  for (const [profileKey, profile] of Object.entries(RTC_LOOKUP_HELPER_NAMING_PROFILES)) {
    if (profile.languages.includes(language)) {
      return profileKey;
    }
  }

  throw new Error(`Unsupported reserved language lookup helper profile: ${language}`);
}

function getLookupHelperNames(language) {
  return RTC_LOOKUP_HELPER_NAMING_PROFILES[getLookupHelperNamingProfile(language)].helpers;
}

function buildHelperPattern(helperName) {
  return new RegExp(escapeRegExp(helperName));
}

export function getReservedLanguageLookupHelperPatterns(language) {
  const helperNames = getLookupHelperNames(language);

  switch (language) {
    case 'flutter':
      return {
        providerCatalog: [buildHelperPattern(helperNames.providerCatalogByProviderKey)],
        providerPackageCatalog: [
          buildHelperPattern(helperNames.providerPackageByProviderKey),
          buildHelperPattern(helperNames.providerPackageByPackageIdentity),
        ],
        providerActivationCatalog: [
          buildHelperPattern(helperNames.providerActivationByProviderKey),
        ],
        capabilityCatalog: [
          buildHelperPattern(helperNames.capabilityCatalog),
          buildHelperPattern(helperNames.capabilityDescriptorByCapabilityKey),
        ],
        providerExtensionCatalog: [
          buildHelperPattern(helperNames.providerExtensionCatalog),
          buildHelperPattern(helperNames.providerExtensionDescriptorByExtensionKey),
          buildHelperPattern(helperNames.providerExtensionsForProvider),
          buildHelperPattern(helperNames.providerExtensionsByExtensionKeys),
          buildHelperPattern(helperNames.providerExtensionMembership),
        ],
        languageWorkspaceCatalog: [buildHelperPattern(helperNames.languageWorkspaceByLanguage)],
        providerSelection: [
          /rtcProviderSelectionSources/,
          /rtcProviderSelectionPrecedence/,
          /ParsedRtcProviderUrl/,
          buildHelperPattern(helperNames.providerUrlParser),
          buildHelperPattern(helperNames.providerSelectionResolver),
        ],
        providerSupport: [
          /rtcProviderSupportStatuses/,
          /RtcProviderSupportStateRequest/,
          buildHelperPattern(helperNames.providerSupportStatusResolver),
          buildHelperPattern(helperNames.providerSupportStateFactory),
        ],
        providerPackageLoader: [
          /RtcProviderPackageLoadRequest/,
          /RtcResolvedProviderPackageLoadTarget/,
          /RtcProviderPackageLoader/,
          buildHelperPattern(helperNames.providerPackageLoaderFactory),
          buildHelperPattern(helperNames.providerPackageLoadTargetResolver),
          buildHelperPattern(helperNames.providerModuleLoader),
          buildHelperPattern(helperNames.singleProviderPackageInstaller),
          buildHelperPattern(helperNames.batchProviderPackageInstaller),
          /provider_package_not_found/,
          /provider_package_identity_mismatch/,
          /provider_package_load_failed/,
          /provider_module_export_missing/,
        ],
        driverManagerDelegates: [
          buildHelperPattern(helperNames.providerSelectionResolver),
          buildHelperPattern(helperNames.providerCatalogByProviderKey),
          buildHelperPattern(helperNames.providerActivationByProviderKey),
          buildHelperPattern(helperNames.providerSupportStateFactory),
        ],
      };
    case 'rust':
      return {
        providerCatalog: [buildHelperPattern(helperNames.providerCatalogByProviderKey)],
        providerPackageCatalog: [
          buildHelperPattern(helperNames.providerPackageByProviderKey),
          buildHelperPattern(helperNames.providerPackageByPackageIdentity),
        ],
        providerActivationCatalog: [
          buildHelperPattern(helperNames.providerActivationByProviderKey),
        ],
        capabilityCatalog: [
          buildHelperPattern(helperNames.capabilityCatalog),
          buildHelperPattern(helperNames.capabilityDescriptorByCapabilityKey),
        ],
        providerExtensionCatalog: [
          buildHelperPattern(helperNames.providerExtensionCatalog),
          buildHelperPattern(helperNames.providerExtensionDescriptorByExtensionKey),
          buildHelperPattern(helperNames.providerExtensionsForProvider),
          buildHelperPattern(helperNames.providerExtensionsByExtensionKeys),
          buildHelperPattern(helperNames.providerExtensionMembership),
        ],
        languageWorkspaceCatalog: [buildHelperPattern(helperNames.languageWorkspaceByLanguage)],
        providerSelection: [
          /RTC_PROVIDER_SELECTION_SOURCES/,
          /RTC_PROVIDER_SELECTION_PRECEDENCE/,
          /ParsedRtcProviderUrl/,
          buildHelperPattern(helperNames.providerUrlParser),
          buildHelperPattern(helperNames.providerSelectionResolver),
        ],
        providerSupport: [
          /RTC_PROVIDER_SUPPORT_STATUSES/,
          /RtcProviderSupportStateRequest/,
          buildHelperPattern(helperNames.providerSupportStatusResolver),
          buildHelperPattern(helperNames.providerSupportStateFactory),
        ],
        providerPackageLoader: [
          /RtcProviderPackageLoadRequest/,
          /RtcResolvedProviderPackageLoadTarget/,
          /RtcProviderPackageLoader/,
          buildHelperPattern(helperNames.providerPackageLoaderFactory),
          buildHelperPattern(helperNames.providerPackageLoadTargetResolver),
          buildHelperPattern(helperNames.providerModuleLoader),
          buildHelperPattern(helperNames.singleProviderPackageInstaller),
          buildHelperPattern(helperNames.batchProviderPackageInstaller),
          /provider_package_not_found/,
          /provider_package_identity_mismatch/,
          /provider_package_load_failed/,
          /provider_module_export_missing/,
        ],
        driverManagerDelegates: [
          buildHelperPattern(helperNames.providerSelectionResolver),
          buildHelperPattern(helperNames.providerCatalogByProviderKey),
          buildHelperPattern(helperNames.providerActivationByProviderKey),
          buildHelperPattern(helperNames.providerSupportStateFactory),
        ],
      };
    case 'java':
    case 'swift':
    case 'kotlin':
      return {
        providerCatalog: [buildHelperPattern(helperNames.providerCatalogByProviderKey)],
        providerPackageCatalog: [
          buildHelperPattern(helperNames.providerPackageByProviderKey),
          buildHelperPattern(helperNames.providerPackageByPackageIdentity),
        ],
        providerActivationCatalog: [
          buildHelperPattern(helperNames.providerActivationByProviderKey),
        ],
        capabilityCatalog: [
          buildHelperPattern(helperNames.capabilityCatalog),
          buildHelperPattern(helperNames.capabilityDescriptorByCapabilityKey),
        ],
        providerExtensionCatalog: [
          buildHelperPattern(helperNames.providerExtensionCatalog),
          buildHelperPattern(helperNames.providerExtensionDescriptorByExtensionKey),
          buildHelperPattern(helperNames.providerExtensionsForProvider),
          buildHelperPattern(helperNames.providerExtensionsByExtensionKeys),
          buildHelperPattern(helperNames.providerExtensionMembership),
        ],
        languageWorkspaceCatalog: [buildHelperPattern(helperNames.languageWorkspaceByLanguage)],
        providerSelection: [
          /RTC_PROVIDER_SELECTION_SOURCES|rtcProviderSelectionSources/,
          /RTC_PROVIDER_SELECTION_PRECEDENCE|rtcProviderSelectionPrecedence/,
          /ParsedRtcProviderUrl/,
          buildHelperPattern(helperNames.providerUrlParser),
          buildHelperPattern(helperNames.providerSelectionResolver),
        ],
        providerSupport: [
          /RTC_PROVIDER_SUPPORT_STATUSES|rtcProviderSupportStatuses/,
          /RtcProviderSupportStateRequest/,
          buildHelperPattern(helperNames.providerSupportStatusResolver),
          buildHelperPattern(helperNames.providerSupportStateFactory),
        ],
        providerPackageLoader: [
          /RtcProviderPackageLoadRequest/,
          /RtcResolvedProviderPackageLoadTarget/,
          /RtcProviderPackageLoader/,
          buildHelperPattern(helperNames.providerPackageLoaderFactory),
          buildHelperPattern(helperNames.providerPackageLoadTargetResolver),
          buildHelperPattern(helperNames.providerModuleLoader),
          buildHelperPattern(helperNames.singleProviderPackageInstaller),
          buildHelperPattern(helperNames.batchProviderPackageInstaller),
          /provider_package_not_found/,
          /provider_package_identity_mismatch/,
          /provider_package_load_failed/,
          /provider_module_export_missing/,
        ],
        driverManagerDelegates: [
          buildHelperPattern(helperNames.providerSelectionResolver),
          buildHelperPattern(helperNames.providerCatalogByProviderKey),
          buildHelperPattern(helperNames.providerActivationByProviderKey),
          buildHelperPattern(helperNames.providerSupportStateFactory),
        ],
      };
    case 'csharp':
    case 'go':
      return {
        providerCatalog: [buildHelperPattern(helperNames.providerCatalogByProviderKey)],
        providerPackageCatalog: [
          buildHelperPattern(helperNames.providerPackageByProviderKey),
          buildHelperPattern(helperNames.providerPackageByPackageIdentity),
        ],
        providerActivationCatalog: [
          buildHelperPattern(helperNames.providerActivationByProviderKey),
        ],
        capabilityCatalog: [
          buildHelperPattern(helperNames.capabilityCatalog),
          buildHelperPattern(helperNames.capabilityDescriptorByCapabilityKey),
        ],
        providerExtensionCatalog: [
          buildHelperPattern(helperNames.providerExtensionCatalog),
          buildHelperPattern(helperNames.providerExtensionDescriptorByExtensionKey),
          buildHelperPattern(helperNames.providerExtensionsForProvider),
          buildHelperPattern(helperNames.providerExtensionsByExtensionKeys),
          buildHelperPattern(helperNames.providerExtensionMembership),
        ],
        languageWorkspaceCatalog: [buildHelperPattern(helperNames.languageWorkspaceByLanguage)],
        providerSelection: [
          /RtcProviderSelectionSources/,
          /RtcProviderSelectionPrecedence/,
          /ParsedRtcProviderUrl/,
          buildHelperPattern(helperNames.providerUrlParser),
          buildHelperPattern(helperNames.providerSelectionResolver),
        ],
        providerSupport: [
          /RtcProviderSupportStatuses/,
          /RtcProviderSupportStateRequest/,
          buildHelperPattern(helperNames.providerSupportStatusResolver),
          buildHelperPattern(helperNames.providerSupportStateFactory),
        ],
        providerPackageLoader: [
          /RtcProviderPackageLoadRequest/,
          /RtcResolvedProviderPackageLoadTarget/,
          /RtcProviderPackageLoader/,
          buildHelperPattern(helperNames.providerPackageLoaderFactory),
          buildHelperPattern(helperNames.providerPackageLoadTargetResolver),
          buildHelperPattern(helperNames.providerModuleLoader),
          buildHelperPattern(helperNames.singleProviderPackageInstaller),
          buildHelperPattern(helperNames.batchProviderPackageInstaller),
          /provider_package_not_found/,
          /provider_package_identity_mismatch/,
          /provider_package_load_failed/,
          /provider_module_export_missing/,
        ],
        driverManagerDelegates: [
          buildHelperPattern(helperNames.providerSelectionResolver),
          buildHelperPattern(helperNames.providerCatalogByProviderKey),
          buildHelperPattern(helperNames.providerActivationByProviderKey),
          buildHelperPattern(helperNames.providerSupportStateFactory),
        ],
      };
    case 'python':
      return {
        providerCatalog: [buildHelperPattern(helperNames.providerCatalogByProviderKey)],
        providerPackageCatalog: [
          buildHelperPattern(helperNames.providerPackageByProviderKey),
          buildHelperPattern(helperNames.providerPackageByPackageIdentity),
        ],
        providerActivationCatalog: [
          buildHelperPattern(helperNames.providerActivationByProviderKey),
        ],
        capabilityCatalog: [
          buildHelperPattern(helperNames.capabilityCatalog),
          buildHelperPattern(helperNames.capabilityDescriptorByCapabilityKey),
        ],
        providerExtensionCatalog: [
          buildHelperPattern(helperNames.providerExtensionCatalog),
          buildHelperPattern(helperNames.providerExtensionDescriptorByExtensionKey),
          buildHelperPattern(helperNames.providerExtensionsForProvider),
          buildHelperPattern(helperNames.providerExtensionsByExtensionKeys),
          buildHelperPattern(helperNames.providerExtensionMembership),
        ],
        languageWorkspaceCatalog: [buildHelperPattern(helperNames.languageWorkspaceByLanguage)],
        providerSelection: [
          /RTC_PROVIDER_SELECTION_SOURCES/,
          /RTC_PROVIDER_SELECTION_PRECEDENCE/,
          /ParsedRtcProviderUrl/,
          buildHelperPattern(helperNames.providerUrlParser),
          buildHelperPattern(helperNames.providerSelectionResolver),
        ],
        providerSupport: [
          /RTC_PROVIDER_SUPPORT_STATUSES/,
          /RtcProviderSupportStateRequest/,
          buildHelperPattern(helperNames.providerSupportStatusResolver),
          buildHelperPattern(helperNames.providerSupportStateFactory),
        ],
        providerPackageLoader: [
          /RtcProviderPackageLoadRequest/,
          /RtcResolvedProviderPackageLoadTarget/,
          /RtcProviderPackageLoader/,
          buildHelperPattern(helperNames.providerPackageLoaderFactory),
          buildHelperPattern(helperNames.providerPackageLoadTargetResolver),
          buildHelperPattern(helperNames.providerModuleLoader),
          buildHelperPattern(helperNames.singleProviderPackageInstaller),
          buildHelperPattern(helperNames.batchProviderPackageInstaller),
          /provider_package_not_found/,
          /provider_package_identity_mismatch/,
          /provider_package_load_failed/,
          /provider_module_export_missing/,
        ],
        driverManagerDelegates: [
          buildHelperPattern(helperNames.providerSelectionResolver),
          buildHelperPattern(helperNames.providerCatalogByProviderKey),
          buildHelperPattern(helperNames.providerActivationByProviderKey),
          buildHelperPattern(helperNames.providerSupportStateFactory),
        ],
      };
    default:
      throw new Error(`Unsupported reserved language lookup helper contract: ${language}`);
  }
}

export function getReservedLanguageRootPublicContract(languageEntry) {
  switch (languageEntry.language) {
    case 'flutter':
      return {
        relativePath: 'lib/rtc_sdk.dart',
        patterns: [
          /library rtc_sdk;/,
          /export 'src\/rtc_standard_contract\.dart';/,
          /export 'src\/rtc_call_controller\.dart';/,
          /export 'src\/rtc_signaling_transport\.dart';/,
          /export 'src\/rtc_provider_catalog\.dart';/,
          /export 'src\/rtc_provider_package_catalog\.dart';/,
          /export 'src\/rtc_provider_activation_catalog\.dart';/,
          /export 'src\/rtc_capability_catalog\.dart';/,
          /export 'src\/rtc_provider_extension_catalog\.dart';/,
          /export 'src\/rtc_language_workspace_catalog\.dart';/,
          /export 'src\/rtc_provider_selection\.dart';/,
          /export 'src\/rtc_provider_package_loader\.dart';/,
          /export 'src\/rtc_provider_support\.dart';/,
          /export 'src\/rtc_driver_manager\.dart';/,
          /export 'src\/rtc_data_source\.dart';/,
        ],
      };
    case 'python':
      return {
        relativePath: 'sdkwork_rtc_sdk/__init__.py',
        patterns: [
          /from \.provider_catalog import \(/,
          /from \.provider_package_catalog import \(/,
          /from \.provider_activation_catalog import \(/,
          /from \.language_workspace_catalog import \(/,
          /from \.provider_selection import \(/,
          /from \.provider_package_loader import \(/,
          /from \.provider_support import \(/,
          /ParsedRtcProviderUrl/,
          /RTC_PROVIDER_SELECTION_SOURCES/,
          /RTC_PROVIDER_SUPPORT_STATUSES/,
          /create_rtc_provider_package_loader/,
          /resolve_rtc_provider_package_load_target/,
          /get_rtc_provider_extensions_for_provider/,
          /get_rtc_language_workspace_by_language/,
          /__all__ = \[/,
        ],
      };
    default:
      return null;
  }
}

export function getGoPublicStructFieldContracts(languageEntry) {
  if (languageEntry.language !== 'go') {
    return [];
  }

  return [
    {
      relativePath: languageEntry.metadataScaffold.providerCatalogRelativePath,
      patterns: [/ProviderKey\s+string/, /PluginId\s+string/, /DriverId\s+string/, /DefaultSelected\s+bool/],
    },
    {
      relativePath: languageEntry.metadataScaffold.providerPackageCatalogRelativePath,
      patterns: [
        /ProviderKey\s+string/,
        /PackageIdentity\s+string/,
        /RootPublic\s+bool/,
        /RuntimeBridgeStatus\s+string/,
      ],
    },
    {
      relativePath: languageEntry.metadataScaffold.capabilityCatalogRelativePath,
      patterns: [/CapabilityKey\s+string/, /Category\s+string/, /Surface\s+string/],
    },
    {
      relativePath: languageEntry.metadataScaffold.providerExtensionCatalogRelativePath,
      patterns: [/ExtensionKey\s+string/, /ProviderKey\s+string/, /DisplayName\s+string/],
    },
    {
      relativePath: languageEntry.metadataScaffold.providerSelectionRelativePath,
      patterns: [
        /ProviderUrl\s+string/,
        /ProviderKey\s+string/,
        /TenantOverrideProviderKey\s+string/,
        /DeploymentProfileProviderKey\s+string/,
      ],
    },
    {
      relativePath: languageEntry.resolutionScaffold.providerSupportRelativePath,
      patterns: [
        /ProviderKey\s+string/,
        /Status\s+string/,
        /Builtin\s+bool/,
        /Official\s+bool/,
        /Registered\s+bool/,
      ],
    },
    {
      relativePath: languageEntry.metadataScaffold.providerActivationCatalogRelativePath,
      patterns: [
        /ProviderKey\s+string/,
        /ActivationStatus\s+string/,
        /RuntimeBridge\s+bool/,
        /PackageIdentity\s+string/,
      ],
    },
    {
      relativePath: languageEntry.workspaceCatalogRelativePath,
      patterns: [
        /Language\s+string/,
        /PublicPackage\s+string/,
        /RoleHighlights\s+\[\]string/,
        /ProviderSelectionContract\s+RtcLanguageWorkspaceProviderSelectionContract/,
        /ProviderSupportContract\s+RtcLanguageWorkspaceProviderSupportContract/,
        /ProviderActivationContract\s+RtcLanguageWorkspaceProviderActivationContract/,
        /ProviderPackageBoundaryContract\s+RtcLanguageWorkspaceProviderPackageBoundaryContract/,
      ],
    },
    {
      relativePath: languageEntry.resolutionScaffold.dataSourceRelativePath,
      patterns: [
        /ProviderUrl\s+string/,
        /DefaultProviderKey\s+string/,
        /selection\.ProviderKey/,
      ],
    },
  ];
}
