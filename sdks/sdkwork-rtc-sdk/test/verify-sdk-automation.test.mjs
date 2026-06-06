import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import {
  readJsonFile as readJson,
  resolveRtcSdkSdksReadmePath,
  resolveRtcSdkWorkspaceRoot,
} from '../bin/rtc-standard-file-helpers.mjs';
import {
  RTC_TEMPLATE_MATERIALIZED_FILES,
  RTC_TEMPLATE_SOURCE_FILES,
} from '../bin/materialize-sdk-template-assets.mjs';
import {
  RTC_FLUTTER_REQUIRED_STANDARD_FILES,
  RTC_ROOT_REQUIRED_CONTRACT_FILES,
  RTC_TYPESCRIPT_PROVIDER_PACKAGE_ROOT_README,
  RTC_TYPESCRIPT_REQUIRED_STANDARD_FILES,
  RTC_TYPESCRIPT_REQUIRED_TEST_FILES,
} from '../bin/rtc-standard-workspace-file-contracts.mjs';
import {
  buildRtcVerifierFixtureFileList,
  createRtcVerifierFixture as createVerifierFixture,
  getReservedLanguageWorkspaceEntries,
} from './rtc-standard-fixture-helpers.mjs';
import {
  buildLanguageProviderActivationCatalogEntries,
  buildProviderPackageManifestPath,
  buildProviderPackageReadmePath,
  buildProviderPackageSourcePath,
  buildProviderPackageSourceRelativePath,
  buildProviderPackageSourceSymbol,
  extractTemplateTokens,
  getCanonicalTypeScriptProviderPackageContract,
  materializeProviderPackagePattern,
  normalizeStringArray,
  toPascalCase,
} from '../bin/rtc-standard-shared-helpers.mjs';
import {
  KNOWN_PROVIDER_PACKAGE_TEMPLATE_TOKENS,
  LEGACY_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_TERMS,
  REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
} from '../bin/verify-sdk-standard-constants.mjs';
import {
  BUILTIN_RTC_PROVIDER_KEYS,
  RTC_CAPABILITY_NEGOTIATION_RULES,
  RTC_CAPABILITY_NEGOTIATION_STATUSES,
  DEFAULT_RTC_PROVIDER_KEY,
  DEFAULT_TYPESCRIPT_ADAPTER_CONTRACT,
  OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS,
  RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS,
  RTC_PROVIDER_ACTIVATION_STATUSES,
  RTC_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS,
  RTC_PROVIDER_PACKAGE_BOUNDARY_MODES,
  RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES,
  RTC_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES,
  RTC_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS,
  RTC_CAPABILITY_CATEGORIES,
  RTC_CAPABILITY_SURFACES,
  TYPESCRIPT_ADAPTER_BINDING_STRATEGIES,
  TYPESCRIPT_ADAPTER_BUNDLE_POLICIES,
  TYPESCRIPT_ADAPTER_OFFICIAL_VENDOR_SDK_REQUIREMENTS,
  TYPESCRIPT_ADAPTER_RUNTIME_BRIDGE_STATUSES,
  TYPESCRIPT_ADAPTER_SDK_PROVISIONING_VALUES,
  RTC_PROVIDER_SELECTION_PRECEDENCE,
  RTC_PROVIDER_SELECTION_SOURCES,
  RTC_PROVIDER_SUPPORT_STATUSES,
} from '../bin/rtc-standard-contract-constants.mjs';
import {
  escapeRegExp,
  getGoPublicStructFieldContracts,
  getReservedLanguageLookupHelperPatterns,
  getReservedLanguageRootPublicContract,
  matchesReservedLanguageToken,
} from '../bin/verify-sdk-language-helpers.mjs';

const workspaceRoot = resolveRtcSdkWorkspaceRoot(import.meta.url);
const assemblyPath = path.join(workspaceRoot, '.sdkwork-assembly.json');
const sdksReadmePath = resolveRtcSdkSdksReadmePath(import.meta.url);
const EXPECTED_PROVIDER_TIER_STANDARD = {
  tierTerms: ['tier-a', 'tier-b', 'tier-c'],
  tierSummaries: {
    'tier-a': 'Built-in baseline providers',
    'tier-b': 'Official extension targets with reserved adapter positions',
    'tier-c': 'Future SPI targets',
  },
};
const EXPECTED_LANGUAGE_MATURITY_STANDARD = {
  tierTerms: ['reference', 'reserved'],
  tierSummaries: {
    reference: 'Executable baseline language workspace',
    reserved: 'Official but not yet executable runtime-bridge workspace',
  },
};
const EXPECTED_TYPESCRIPT_ADAPTER_STANDARD = {
  sdkProvisioningTerms: TYPESCRIPT_ADAPTER_SDK_PROVISIONING_VALUES,
  bindingStrategyTerms: TYPESCRIPT_ADAPTER_BINDING_STRATEGIES,
  bundlePolicyTerms: TYPESCRIPT_ADAPTER_BUNDLE_POLICIES,
  runtimeBridgeStatusTerms: TYPESCRIPT_ADAPTER_RUNTIME_BRIDGE_STATUSES,
  officialVendorSdkRequirementTerms: TYPESCRIPT_ADAPTER_OFFICIAL_VENDOR_SDK_REQUIREMENTS,
  referenceContract: DEFAULT_TYPESCRIPT_ADAPTER_CONTRACT,
};
const EXPECTED_TYPESCRIPT_PACKAGE_STANDARD = {
  packageNamePattern: '@sdkwork/rtc-sdk-provider-{providerKey}',
  sourceModulePattern: '../../src/providers/{providerKey}.ts',
  driverFactoryPattern: 'create{providerPascal}RtcDriver',
  metadataSymbolPattern: '{providerUpperSnake}_RTC_PROVIDER_METADATA',
  moduleSymbolPattern: '{providerUpperSnake}_RTC_PROVIDER_MODULE',
  rootPublicRule: 'builtin-aligned',
};
const EXPECTED_CAPABILITY_NEGOTIATION_STANDARD = {
  statusTerms: RTC_CAPABILITY_NEGOTIATION_STATUSES,
  statusRules: RTC_CAPABILITY_NEGOTIATION_RULES,
};
const EXPECTED_ERROR_CODE_STANDARD = {
  codeTerms: [
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
  ],
  fallbackCode: 'vendor_error',
};
const EXPECTED_RUNTIME_SURFACE_STANDARD = {
  methodTerms: ['join', 'leave', 'publish', 'unpublish', 'muteAudio', 'muteVideo'],
  failureCode: 'native_sdk_not_available',
};
const EXPECTED_SIGNALING_TRANSPORT_STANDARD = {
  transportTerm: 'websocket-only',
  authConfigPath: 'connectOptions.webSocketAuth',
  authPassThroughTerm: 'signaling-adapter-pass-through',
  authModeTerms: ['automatic', 'headerBearer', 'queryBearer', 'none'],
  recommendedAuthMode: 'automatic',
  deviceIdAuthorityTerm: 'top-level-device-id',
  connectOptionsDeviceIdRuleTerm: 'must-match-top-level-device-id',
  liveConnectionTerm: 'shared-rtc-live-connection',
  pollingFallbackTerm: 'not-supported',
  authFailureTerm: 'fail-fast',
};
const EXPECTED_RUNTIME_IMMUTABILITY_STANDARD = {
  frozenTerm: 'runtime-frozen',
  snapshotTerm: 'immutable-snapshots',
  controllerContextTerm: 'shallow-immutable-context',
  nativeClientTerm: 'mutable-native-client',
};
const EXPECTED_ROOT_PUBLIC_SURFACE_STANDARD = {
    typescriptProviderNeutralExportPaths: [
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
  ],
  typescriptBuiltinProviderExportPaths: [
    './providers/volcengine.js',
    './providers/aliyun.js',
    './providers/tencent.js',
    './providers/agora.js',
    './providers/livekit.js',
  ],
  typescriptInlineHelperNames: ['createBuiltinRtcDriverManager'],
  reservedSurfaceFamilies: [
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
  ],
  reservedEntryPointKinds: {
    flutter: 'barrel',
    python: 'package-init',
  },
  builtinProviderExposureTerm: 'root-public-builtin-only',
  nonBuiltinProviderExposureTerm: 'package-boundary-only',
};
const EXPECTED_LOOKUP_HELPER_NAMING_STANDARD = {
  profileTerms: ['lower-camel-rtc', 'upper-camel-rtc', 'snake-case-rtc'],
  familyTerms: [
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
  ],
  profiles: {
    'lower-camel-rtc': {
      languages: ['typescript', 'flutter', 'java', 'swift', 'kotlin'],
      helpers: {
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
      },
    },
    'upper-camel-rtc': {
      languages: ['csharp', 'go'],
      helpers: {
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
      },
    },
    'snake-case-rtc': {
      languages: ['rust', 'python'],
      helpers: {
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
      },
    },
  },
};

function assertLanguageWorkspaceProviderPackageBoundaryShape(languageEntry) {
  const boundary = languageEntry.providerPackageBoundary;
  assert.equal(typeof boundary?.mode, 'string');
  assert.equal(typeof boundary?.rootPublicPolicy, 'string');
  assert.equal(Array.isArray(boundary?.lifecycleStatusTerms), true);
  assert.equal(Array.isArray(boundary?.runtimeBridgeStatusTerms), true);
  assert.equal((boundary?.lifecycleStatusTerms?.length ?? 0) > 0, true);
  assert.equal((boundary?.runtimeBridgeStatusTerms?.length ?? 0) > 0, true);
}

function assertReservedLanguageToken(language, content, token, label = token) {
  assert.equal(
    matchesReservedLanguageToken(language, content, token),
    true,
    `expected ${language} content to preserve ${label}`,
  );
}

function extractYamlSectionTopLevelKeys(content, sectionName) {
  const keys = new Set();
  const lines = content.split(/\r?\n/);
  let inSection = false;
  let sectionIndent = 0;

  for (const line of lines) {
    const sectionMatch = line.match(new RegExp(`^(\\s*)${sectionName}:\\s*$`));

    if (sectionMatch) {
      inSection = true;
      sectionIndent = sectionMatch[1].length;
      continue;
    }

    if (!inSection) {
      continue;
    }

    if (/^\s*$/.test(line)) {
      continue;
    }

    const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
    if (indent <= sectionIndent) {
      break;
    }

    const keyMatch = line.match(new RegExp(`^\\s{${sectionIndent + 2}}([^\\s:#][^:]*)\\s*:`));
    if (keyMatch) {
      keys.add(keyMatch[1].trim());
    }
  }

  return keys;
}

test('sdk overview lists sdkwork-rtc-sdk workspace', () => {
  const content = readFileSync(sdksReadmePath, 'utf8');
  assert.match(content, /sdkwork-rtc-sdk/);
});

test('root rtc workspace contract files exist', () => {
  for (const relativePath of RTC_ROOT_REQUIRED_CONTRACT_FILES) {
    assert.equal(
      existsSync(path.join(workspaceRoot, relativePath)),
      true,
      `expected ${relativePath} to exist`,
    );
  }
});

test('root documentation and materialized readmes describe provider package entrypoints, vendor sdk contract, and default catalog constants', () => {
  const assembly = readJson(assemblyPath);
  const rootReadme = readFileSync(path.join(workspaceRoot, 'README.md'), 'utf8');
  const docsReadme = readFileSync(path.join(workspaceRoot, 'docs', 'README.md'), 'utf8');
  const usageGuide = readFileSync(path.join(workspaceRoot, 'docs', 'usage-guide.md'), 'utf8');
  const packageStandards = readFileSync(path.join(workspaceRoot, 'docs', 'package-standards.md'), 'utf8');
  const providerAdapterStandard = readFileSync(
    path.join(workspaceRoot, 'docs', 'provider-adapter-standard.md'),
    'utf8',
  );
  const capabilityMatrix = readFileSync(
    path.join(workspaceRoot, 'docs', 'multilanguage-capability-matrix.md'),
    'utf8',
  );
  const verificationMatrix = readFileSync(
    path.join(workspaceRoot, 'docs', 'verification-matrix.md'),
    'utf8',
  );
  const typescriptReadme = readFileSync(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript', 'README.md'),
    'utf8',
  );
  const typescriptLanguageWorkspaceCatalog = readFileSync(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript', 'src', 'language-workspace-catalog.ts'),
    'utf8',
  );
  const typescriptCallTypes = readFileSync(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript', 'src', 'call-types.ts'),
    'utf8',
  );
  const flutterCallTypes = readFileSync(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-flutter', 'lib', 'src', 'rtc_call_types.dart'),
    'utf8',
  );
  const flutterCallSession = readFileSync(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-flutter', 'lib', 'src', 'rtc_call_session.dart'),
    'utf8',
  );
  const typescriptUsageGuide = readFileSync(
    path.join(workspaceRoot, 'docs', 'typescript-volcengine-signaling-usage.md'),
    'utf8',
  );
  const flutterUsageGuide = readFileSync(
    path.join(workspaceRoot, 'docs', 'flutter-volcengine-signaling-usage.md'),
    'utf8',
  );
  const providersReadme = readFileSync(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript', 'providers', 'README.md'),
    'utf8',
  );
  const builtinProviderReadme = readFileSync(
    path.join(
      workspaceRoot,
      'sdkwork-rtc-sdk-typescript',
      'providers',
      'rtc-sdk-provider-volcengine',
      'README.md',
    ),
    'utf8',
  );
  const futureProviderReadme = readFileSync(
    path.join(
      workspaceRoot,
      'sdkwork-rtc-sdk-typescript',
      'providers',
      'rtc-sdk-provider-zego',
      'README.md',
    ),
    'utf8',
  );

  assert.match(rootReadme, /DEFAULT_RTC_PROVIDER_KEY/);
  assert.match(rootReadme, /DEFAULT_RTC_PROVIDER_PLUGIN_ID/);
  assert.match(rootReadme, /DEFAULT_RTC_PROVIDER_DRIVER_ID/);
  assert.match(rootReadme, /assembly-driven language workspace identity, role, summary, and default-provider contracts/i);
  assert.match(rootReadme, /language workspace catalog/i);
  assert.match(rootReadme, /provider package scaffold boundaries/i);
  assert.match(rootReadme, /provider package boundar/i);
  assert.match(rootReadme, /template token/i);
  assert.match(rootReadme, /root-public/i);
  assert.match(rootReadme, /capability negotiation/i);
  assert.match(rootReadme, /degraded/i);
  assert.match(rootReadme, /unsupported/i);
  assert.match(rootReadme, /errorCodeStandard/);
  assert.match(rootReadme, /RTC_SDK_ERROR_CODES/);
  assert.match(rootReadme, /RTC_SDK_ERROR_FALLBACK_CODE/);
  assert.match(rootReadme, /vendor_error/);
  assert.match(rootReadme, /smoke-sdk\.mjs/);
  assert.match(rootReadme, /--reuse-live-connection/);
  assert.match(rootReadme, /shared-`liveConnection` call-smoke variants/i);
  assert.match(rootReadme, /full regression/i);
  assert.match(rootReadme, /\.gitignore/);
  assert.match(rootReadme, /non-source artifacts/i);
  assert.match(rootReadme, /\.sdkwork-assembly\.json.*source/i);
  assert.match(rootReadme, /source stub/i);
  assert.match(rootReadme, /source symbol/i);
  assert.match(rootReadme, /provider activation catalog/i);
  assert.match(rootReadme, /defaultProviderContract/);
  assert.match(rootReadme, /providerSelectionContract/);
  assert.match(rootReadme, /providerSupportContract/);
  assert.match(rootReadme, /providerActivationContract/);
  assert.match(rootReadme, /providerPackageBoundaryContract/);
  assert.match(rootReadme, /capabilityStandard/);
  assert.match(rootReadme, /capabilityNegotiationStandard/);
  assert.match(rootReadme, /runtimeSurfaceStandard/);
  assert.match(rootReadme, /signalingTransportStandard/);
  assert.match(rootReadme, /runtimeImmutabilityStandard/);
  assert.match(rootReadme, /rootPublicSurfaceStandard/);
  assert.match(rootReadme, /lookupHelperNamingStandard/);
  assert.match(rootReadme, /errorCodeStandard/);
  assert.match(rootReadme, /providerExtensionStandard/);
  assert.match(rootReadme, /providerTierStandard/);
  assert.match(rootReadme, /languageMaturityStandard/);
  assert.match(rootReadme, /typescriptAdapterStandard/);
  assert.match(rootReadme, /typescriptPackageStandard/);
  assert.match(rootReadme, /RTC_RUNTIME_SURFACE_METHODS/);
  assert.match(rootReadme, /RTC_RUNTIME_SURFACE_FAILURE_CODE/);
  assert.match(rootReadme, /RTC_RUNTIME_IMMUTABILITY_STANDARD/);
  assert.match(rootReadme, /RTC_SIGNALING_TRANSPORT_STANDARD/);
  assert.match(rootReadme, /RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS/);
  assert.match(rootReadme, /RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM/);
  assert.match(rootReadme, /RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM/);
  assert.match(rootReadme, /RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM/);
  assert.match(rootReadme, /RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM/);
  assert.match(rootReadme, /root-public-surface\.ts/);
  assert.match(rootReadme, /RTC_ROOT_PUBLIC_SURFACE_STANDARD/);
  assert.match(rootReadme, /lookup-helper-naming\.ts/);
  assert.match(rootReadme, /RTC_LOOKUP_HELPER_NAMING_STANDARD/);
  assert.match(rootReadme, /lower-camel-rtc/);
  assert.match(rootReadme, /upper-camel-rtc/);
  assert.match(rootReadme, /snake-case-rtc/);
  assert.match(rootReadme, /RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS/);
  assert.match(rootReadme, /RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS/);
  assert.match(rootReadme, /RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES/);
  assert.match(rootReadme, /RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS/);
  assert.match(rootReadme, /root-public-builtin-only/);
  assert.match(rootReadme, /package-boundary-only/);
  assert.match(rootReadme, /providerActivationStandard/);
  assert.match(rootReadme, /providerPackageBoundaryStandard/);
  assert.match(rootReadme, /providerPackageBoundary/);
  assert.match(rootReadme, /rootPublicPolicy/);
  assert.match(rootReadme, /catalog-governed-mixed/);
  assert.match(rootReadme, /scaffold-per-provider-package/);
  assert.match(rootReadme, /builtin-only/);
  assert.match(rootReadme, /getBuiltinRtcProviderMetadataByKey/);
  assert.match(rootReadme, /getOfficialRtcProviderMetadataByKey/);
  assert.match(rootReadme, /getRtcProviderByProviderKey/);
  assert.match(rootReadme, /getRtcProviderPackageByProviderKey/);
  assert.match(rootReadme, /getRtcProviderPackageByPackageIdentity/);
  assert.match(rootReadme, /getRtcProviderActivationByProviderKey/);
  assert.match(rootReadme, /getRtcLanguageWorkspaceByLanguage/);
  assert.match(rootReadme, /resolveRtcProviderSupportStatus/);
  assert.match(rootReadme, /createRtcProviderSupportState/);
  assert.match(rootReadme, /provider package loader/i);
  assert.match(rootReadme, /@sdkwork\/rtc-sdk-provider-<providerKey>/);
  assert.match(rootReadme, /\.\.\/\.\.\/src\/providers\/<providerKey>\.ts/);
  assert.match(rootReadme, /create<ProviderPascal>RtcDriver/);
  assert.match(rootReadme, /<PROVIDER_UPPER>_RTC_PROVIDER_METADATA/);
  assert.match(rootReadme, /<PROVIDER_UPPER>_RTC_PROVIDER_MODULE/);
  assert.doesNotMatch(rootReadme, /\{\{RTC_/);

  assert.match(docsReadme, /provider-catalog\.ts/);
  assert.match(docsReadme, /provider-activation-catalog\.ts/);
  assert.match(docsReadme, /provider-selection\.ts/);
  assert.match(docsReadme, /provider-support\.ts/);
  assert.match(docsReadme, /provider-package-catalog\.ts/);
  assert.match(docsReadme, /language-workspace-catalog\.ts/);
  assert.match(docsReadme, /defaultProviderContract/);
  assert.match(docsReadme, /providerSelectionContract/);
  assert.match(docsReadme, /providerSupportContract/);
  assert.match(docsReadme, /providerActivationContract/);
  assert.match(docsReadme, /providerPackageBoundaryContract/);
  assert.match(docsReadme, /capabilityStandard/);
  assert.match(docsReadme, /capabilityNegotiationStandard/);
  assert.match(docsReadme, /runtimeSurfaceStandard/);
  assert.match(docsReadme, /signalingTransportStandard/);
  assert.match(docsReadme, /runtimeImmutabilityStandard/);
  assert.match(docsReadme, /rootPublicSurfaceStandard/);
  assert.match(docsReadme, /lookupHelperNamingStandard/);
  assert.match(docsReadme, /errorCodeStandard/);
  assert.match(docsReadme, /providerExtensionStandard/);
  assert.match(docsReadme, /providerTierStandard/);
  assert.match(docsReadme, /languageMaturityStandard/);
  assert.match(docsReadme, /typescriptAdapterStandard/);
  assert.match(docsReadme, /typescriptPackageStandard/);
  assert.match(docsReadme, /RTC_RUNTIME_SURFACE_METHODS/);
  assert.match(docsReadme, /RTC_RUNTIME_SURFACE_FAILURE_CODE/);
  assert.match(docsReadme, /runtime-immutability\.ts/);
  assert.match(docsReadme, /RTC_RUNTIME_IMMUTABILITY_STANDARD/);
  assert.match(docsReadme, /RTC_SIGNALING_TRANSPORT_STANDARD/);
  assert.match(docsReadme, /root-public-surface\.ts/);
  assert.match(docsReadme, /RTC_ROOT_PUBLIC_SURFACE_STANDARD/);
  assert.match(docsReadme, /lookup-helper-naming\.ts/);
  assert.match(docsReadme, /RTC_LOOKUP_HELPER_NAMING_STANDARD/);
  assert.match(docsReadme, /root-public-builtin-only/);
  assert.match(docsReadme, /package-boundary-only/);
  assert.match(docsReadme, /providerActivationStandard/);
  assert.match(docsReadme, /providerPackageBoundaryStandard/);
  assert.match(docsReadme, /providerPackageBoundary/);
  assert.match(docsReadme, /rootPublicPolicy/);
  assert.match(docsReadme, /catalog-governed-mixed/);
  assert.match(docsReadme, /scaffold-per-provider-package/);
  assert.match(docsReadme, /builtin-only/);
  assert.match(docsReadme, /`none`/);
  assert.match(docsReadme, /getBuiltinRtcProviderMetadataByKey/);
  assert.match(docsReadme, /getOfficialRtcProviderMetadataByKey/);
  assert.match(docsReadme, /getRtcProviderByProviderKey/);
  assert.match(docsReadme, /getRtcProviderPackageByProviderKey/);
  assert.match(docsReadme, /getRtcProviderPackageByPackageIdentity/);
  assert.match(docsReadme, /getRtcProviderActivationByProviderKey/);
  assert.match(docsReadme, /getRtcLanguageWorkspaceByLanguage/);
  assert.match(docsReadme, /provider support classification/i);
  assert.match(docsReadme, /provider package loader/i);
  assert.match(docsReadme, /RTC_SDK_ERROR_CODES/);
  assert.match(docsReadme, /RTC_SDK_ERROR_FALLBACK_CODE/);
  assert.match(docsReadme, /vendor_error/);
  assert.match(docsReadme, /provider lookup by key/i);
  assert.match(docsReadme, /typescript-volcengine-signaling-usage\.md/);
  assert.match(docsReadme, /flutter-volcengine-signaling-usage\.md/);
  assert.match(docsReadme, /--reuse-live-connection/);
  assert.match(
    docsReadme,
    /Flutter\/mobile language workspace catalogs and the remaining reserved non-TypeScript language\s+workspace catalogs and metadata scaffolds must also keep explicit lookup helpers stable/i,
  );
  assert.doesNotMatch(
    docsReadme,
    /Reserved non-TypeScript language workspace catalogs and metadata scaffolds must also keep explicit/i,
  );
  assert.doesNotMatch(docsReadme, /\{\{RTC_/);

  assert.match(usageGuide, /TypeScript is the executable web\/browser baseline/i);
  assert.match(usageGuide, /Flutter is the executable mobile baseline/i);
  assert.match(usageGuide, /sdkwork-rtc-sdk/i);
  assert.match(usageGuide, /@volcengine\/rtc/);
  assert.match(usageGuide, /package:volc_engine_rtc\/volc_engine_rtc\.dart/);
  assert.match(usageGuide, /package:rtc_sdk\/rtc_sdk\.dart/);
  assert.match(usageGuide, /node \.\/bin\/sdk-call-smoke\.mjs --json/);
  assert.match(usageGuide, /runtime-backed/);
  assert.match(usageGuide, /analysis-backed/);
  assert.match(usageGuide, /shared-`liveConnection` call-smoke variants/i);
  assert.match(usageGuide, /flutter-volcengine-signaling-usage\.md/);
  assert.match(typescriptUsageGuide, /@volcengine\/rtc/);
  assert.match(typescriptUsageGuide, /@sdkwork\/rtc-sdk/);
  assert.match(typescriptUsageGuide, /node \.\/bin\/sdk-call-smoke\.mjs --json/);
  assert.match(typescriptUsageGuide, /--reuse-live-connection/);
  assert.match(typescriptUsageGuide, /runtime-backed/);
  assert.match(typescriptUsageGuide, /createStandardRtcCallControllerStack/);
  assert.match(typescriptUsageGuide, /describeRtcSignalingTransport/);
  assert.match(typescriptUsageGuide, /signalingTransport/);
  assert.match(typescriptCallTypes, /export const RTC_CALL_TRACK_ID_SEPARATOR = '-';/);
  assert.match(typescriptCallTypes, /export const DEFAULT_RTC_CALL_SUBSCRIBE_SIGNALS = true;/);
  assert.match(typescriptCallTypes, /export function createRtcCallTrackId\(/);
  assert.match(typescriptUsageGuide, /subscribeSignals` to `true`/i);
  assert.match(flutterUsageGuide, /package:volc_engine_rtc\/volc_engine_rtc\.dart/);
  assert.match(flutterUsageGuide, /package:rtc_sdk\/rtc_sdk\.dart/);
  assert.match(flutterUsageGuide, /node \.\/bin\/sdk-call-smoke\.mjs --json/);
  assert.match(flutterUsageGuide, /--reuse-live-connection/);
  assert.match(flutterUsageGuide, /analysis-backed/);
  assert.match(flutterUsageGuide, /createStandardRtcCallControllerStack/);
  assert.match(flutterUsageGuide, /describeRtcSignalingTransport/);
  assert.match(flutterUsageGuide, /signalingTransport/);
  assert.match(flutterCallTypes, /const String rtcCallTrackIdSeparator = '-';/);
  assert.match(flutterCallTypes, /String createRtcCallTrackId\(String rtcSessionId, RtcTrackKind kind\)/);
  assert.match(flutterCallSession, /createRtcCallTrackId\(rtcSessionId, RtcTrackKind\.audio\)/);
  assert.match(flutterCallSession, /createRtcCallTrackId\(rtcSessionId, RtcTrackKind\.video\)/);
  assert.doesNotMatch(flutterCallSession, /_audio/);
  assert.doesNotMatch(flutterCallSession, /_video/);
  assert.match(
    rootReadme,
    /Flutter\/mobile and the remaining reserved non-TypeScript workspaces must preserve the same\s+semantics through standalone\s+provider-selection helper modules/i,
  );
  assert.match(
    rootReadme,
    /Flutter\/mobile and the remaining reserved non-TypeScript provider package boundaries must also\s+materialize one metadata-only source stub/i,
  );
  assert.doesNotMatch(
    rootReadme,
    /Reserved non-TypeScript workspaces must preserve the same semantics through standalone\s+provider-selection helper modules/i,
  );

  assert.match(packageStandards, /index\.js/);
  assert.match(packageStandards, /index\.d\.ts/);
  assert.match(packageStandards, /exports/);
  assert.match(packageStandards, /consumer-supplied/);
  assert.match(packageStandards, /native-factory/);
  assert.match(packageStandards, /must-not-bundle/);
  assert.match(packageStandards, /reference-baseline/);
  assert.match(packageStandards, /official vendor sdk.*required/i);
  assert.match(packageStandards, /displayName/);
  assert.match(packageStandards, /currentRole/);
  assert.match(packageStandards, /workspaceSummary/);
  assert.match(packageStandards, /roleHighlights/);
  assert.match(packageStandards, /workspaceCatalogRelativePath/);
  assert.match(packageStandards, /language workspace catalog/i);
  assert.match(packageStandards, /providerSelectionStandard/);
  assert.match(packageStandards, /providerSupportStandard/);
  assert.match(packageStandards, /providerActivationStandard/);
  assert.match(packageStandards, /providerPackageBoundaryStandard/);
  assert.match(packageStandards, /capabilityStandard/);
  assert.match(packageStandards, /capabilityNegotiationStandard/);
  assert.match(packageStandards, /runtimeSurfaceStandard/);
  assert.match(packageStandards, /signalingTransportStandard/);
  assert.match(packageStandards, /runtimeImmutabilityStandard/);
  assert.match(packageStandards, /rootPublicSurfaceStandard/);
  assert.match(packageStandards, /lookupHelperNamingStandard/);
  assert.match(packageStandards, /errorCodeStandard/);
  assert.match(packageStandards, /providerExtensionStandard/);
  assert.match(packageStandards, /providerTierStandard/);
  assert.match(packageStandards, /languageMaturityStandard/);
  assert.match(packageStandards, /typescriptAdapterStandard/);
  assert.match(packageStandards, /typescriptPackageStandard/);
  assert.match(packageStandards, /RTC_RUNTIME_SURFACE_METHODS/);
  assert.match(packageStandards, /RTC_RUNTIME_SURFACE_FAILURE_CODE/);
  assert.match(packageStandards, /RTC_RUNTIME_IMMUTABILITY_STANDARD/);
  assert.match(packageStandards, /RTC_SIGNALING_TRANSPORT_STANDARD/);
  assert.match(packageStandards, /RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM/);
  assert.match(packageStandards, /RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM/);
  assert.match(packageStandards, /RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM/);
  assert.match(packageStandards, /RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM/);
  assert.match(packageStandards, /RTC_ROOT_PUBLIC_SURFACE_STANDARD/);
  assert.match(packageStandards, /RTC_LOOKUP_HELPER_NAMING_STANDARD/);
  assert.match(packageStandards, /lower-camel-rtc/);
  assert.match(packageStandards, /upper-camel-rtc/);
  assert.match(packageStandards, /snake-case-rtc/);
  assert.match(packageStandards, /RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS/);
  assert.match(packageStandards, /RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS/);
  assert.match(packageStandards, /RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES/);
  assert.match(packageStandards, /RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS/);
  assert.match(packageStandards, /root-public-builtin-only/);
  assert.match(packageStandards, /package-boundary-only/);
  assert.match(packageStandards, /providerActivations/);
  assert.match(packageStandards, /typescriptPackage/);
  assert.match(packageStandards, /defaultProviderContract/);
  assert.match(packageStandards, /providerSelectionContract/);
  assert.match(packageStandards, /providerSupportContract/);
  assert.match(packageStandards, /providerActivationContract/);
  assert.match(packageStandards, /providerPackageBoundaryContract/);
  assert.match(packageStandards, /providerPackageBoundary/);
  assert.match(packageStandards, /rootPublicPolicy/);
  assert.match(packageStandards, /catalog-governed-mixed/);
  assert.match(packageStandards, /scaffold-per-provider-package/);
  assert.match(packageStandards, /builtin-only/);
  assert.match(packageStandards, /`none`/);
  assert.match(
    packageStandards,
    /Flutter\/mobile and the remaining reserved non-TypeScript workspaces use\s+`scaffold-per-provider-package`/i,
  );
  assert.doesNotMatch(
    packageStandards,
    /^- reserved non-TypeScript workspaces use\s+`scaffold-per-provider-package`/im,
  );
  assert.match(packageStandards, /@sdkwork\/rtc-sdk-provider-<providerKey>/);
  assert.match(packageStandards, /\.\.\/\.\.\/src\/providers\/<providerKey>\.ts/);
  assert.match(packageStandards, /create<ProviderPascal>RtcDriver/);
  assert.match(packageStandards, /<PROVIDER_UPPER>_RTC_PROVIDER_METADATA/);
  assert.match(packageStandards, /<PROVIDER_UPPER>_RTC_PROVIDER_MODULE/);
  assert.match(packageStandards, /contractScaffold/);
  assert.match(packageStandards, /resolutionScaffold/);
  assert.match(packageStandards, /providerPackageScaffold/);
  assert.match(packageStandards, /directoryPattern/);
  assert.match(packageStandards, /packagePattern/);
  assert.match(packageStandards, /manifestFileName/);
  assert.match(packageStandards, /readmeFileName/);
  assert.match(packageStandards, /sourceFilePattern/);
  assert.match(packageStandards, /sourceSymbolPattern/);
  assert.match(packageStandards, /templateTokens/);
  assert.match(packageStandards, /sourceTemplateTokens/);
  assert.match(packageStandards, /future-runtime-bridge-only/);
  assert.match(packageStandards, /rootPublic/);
  assert.match(packageStandards, /provider package boundar/i);
  assert.match(packageStandards, /source stub/i);
  assert.match(packageStandards, /providerPackageCatalogRelativePath/);
  assert.match(packageStandards, /provider package catalog/i);
  assert.match(packageStandards, /providerActivationCatalogRelativePath/);
  assert.match(packageStandards, /provider activation catalog/i);
  assert.match(packageStandards, /providerExtensionCatalogRelativePath/);
  assert.match(packageStandards, /providerPackageLoaderRelativePath/);
  assert.match(packageStandards, /driver manager/i);
  assert.match(packageStandards, /data source/i);
  assert.match(packageStandards, /provider support/i);
  assert.match(packageStandards, /provider package loader/i);
  assert.match(packageStandards, /getRtcLanguageWorkspaceByLanguage/);
  assert.match(packageStandards, /getRtcProviderActivationByProviderKey/);
  assert.match(packageStandards, /getRtcProviderPackageByProviderKey/);
  assert.match(packageStandards, /getRtcProviderPackageByPackageIdentity/);
  assert.match(packageStandards, /createRtcProviderPackageLoader/);
  assert.match(packageStandards, /resolveRtcProviderPackageLoadTarget/);
  assert.match(packageStandards, /loadRtcProviderModule/);
  assert.match(packageStandards, /installRtcProviderPackage/);
  assert.match(packageStandards, /installRtcProviderPackages/);
  assert.match(packageStandards, /getRtcProviderByProviderKey/);
  assert.match(packageStandards, /RtcProviderSupportStateRequest/);
  assert.match(packageStandards, /resolveRtcProviderSupportStatus/);
  assert.match(packageStandards, /createRtcProviderSupportState/);
  assert.match(packageStandards, /root-public-builtin/);
  assert.match(packageStandards, /package-boundary/);
  assert.match(packageStandards, /control-metadata-only/);
  assert.match(packageStandards, /RTC_SDK_ERROR_CODES/);
  assert.match(packageStandards, /RTC_SDK_ERROR_FALLBACK_CODE/);
  assert.match(packageStandards, /vendor_error/);
  assert.match(packageStandards, /capabilityCatalog/);
  assert.match(packageStandards, /providerExtensionCatalog/);
  assert.match(packageStandards, /getBuiltinRtcProviderMetadataByKey/);
  assert.match(packageStandards, /getOfficialRtcProviderMetadataByKey/);
  assert.match(packageStandards, /category/);
  assert.match(packageStandards, /surface/);
  assert.match(packageStandards, /cross-surface/);
  assert.match(packageStandards, /unwrap-only/);
  assert.match(packageStandards, /extension-object/);
  assert.match(packageStandards, /runtime-frozen/i);
  assert.match(packageStandards, /shallow-immutable-context/i);
  assert.match(packageStandards, /mutable-native-client/i);
  assert.match(packageStandards, /\.gitignore/);
  assert.match(packageStandards, /sdkwork-rtc-sdk-typescript\/dist\//);
  assert.match(packageStandards, /sdkwork-rtc-sdk-rust\/target\//);
  assert.match(packageStandards, /sdkwork-rtc-sdk-java\/target\//);
  assert.match(packageStandards, /__pycache__/);
  assert.match(packageStandards, /\.sdkwork-assembly\.json/);

  assert.match(providerAdapterStandard, /index\.js/);
  assert.match(providerAdapterStandard, /index\.d\.ts/);
  assert.match(providerAdapterStandard, /exports/);
  assert.match(providerAdapterStandard, /builtin provider packages/i);
  assert.match(providerAdapterStandard, /consumer-supplied/);
  assert.match(providerAdapterStandard, /registerRtcProviderModules/);
  assert.match(providerAdapterStandard, /native-factory/);
  assert.match(providerAdapterStandard, /must-not-bundle/);
  assert.match(providerAdapterStandard, /reference-baseline/);
  assert.match(providerAdapterStandard, /official vendor sdk.*required/i);
  assert.match(providerAdapterStandard, /provider_module_contract_mismatch/);
  assert.match(providerAdapterStandard, /atomic/i);
  assert.match(providerAdapterStandard, /control-plane/i);
  assert.match(providerAdapterStandard, /runtime-bridge/i);
  assert.match(providerAdapterStandard, /cross-surface/i);
  assert.match(providerAdapterStandard, /capability negotiation/i);
  assert.match(providerAdapterStandard, /degraded/i);
  assert.match(providerAdapterStandard, /unsupported/i);
  assert.match(providerAdapterStandard, /errorCodeStandard/);
  assert.match(providerAdapterStandard, /RTC_SDK_ERROR_CODES/);
  assert.match(providerAdapterStandard, /RTC_SDK_ERROR_FALLBACK_CODE/);
  assert.match(providerAdapterStandard, /vendor_error/);
  assert.match(providerAdapterStandard, /getRtcProviderPackageByProviderKey/);
  assert.match(providerAdapterStandard, /getRtcProviderPackageByPackageIdentity/);
  assert.match(providerAdapterStandard, /getRtcProviderActivationByProviderKey/);
  assert.match(providerAdapterStandard, /getRtcLanguageWorkspaceByLanguage/);
  assert.match(providerAdapterStandard, /getRtcProviderByProviderKey/);
  assert.match(providerAdapterStandard, /resolveRtcProviderSupportStatus/);
  assert.match(providerAdapterStandard, /createRtcProviderSupportState/);
  assert.match(providerAdapterStandard, /defaultProviderContract/);
  assert.match(providerAdapterStandard, /providerSelectionContract/);
  assert.match(providerAdapterStandard, /providerSupportContract/);
  assert.match(providerAdapterStandard, /providerActivationContract/);
  assert.match(providerAdapterStandard, /providerPackageBoundaryContract/);
  assert.match(providerAdapterStandard, /providerActivationStandard/);
  assert.match(providerAdapterStandard, /providerPackageBoundaryStandard/);
  assert.match(providerAdapterStandard, /capabilityStandard/);
  assert.match(providerAdapterStandard, /capabilityNegotiationStandard/);
  assert.match(providerAdapterStandard, /runtimeSurfaceStandard/);
  assert.match(providerAdapterStandard, /signalingTransportStandard/);
  assert.match(providerAdapterStandard, /runtimeImmutabilityStandard/);
  assert.match(providerAdapterStandard, /rootPublicSurfaceStandard/);
  assert.match(providerAdapterStandard, /lookupHelperNamingStandard/);
  assert.match(providerAdapterStandard, /errorCodeStandard/);
  assert.match(providerAdapterStandard, /providerExtensionStandard/);
  assert.match(providerAdapterStandard, /providerTierStandard/);
  assert.match(providerAdapterStandard, /languageMaturityStandard/);
  assert.match(providerAdapterStandard, /typescriptAdapterStandard/);
  assert.match(providerAdapterStandard, /typescriptPackageStandard/);
  assert.match(providerAdapterStandard, /RTC_RUNTIME_SURFACE_METHODS/);
  assert.match(providerAdapterStandard, /RTC_RUNTIME_SURFACE_FAILURE_CODE/);
  assert.match(providerAdapterStandard, /RTC_RUNTIME_IMMUTABILITY_STANDARD/);
  assert.match(providerAdapterStandard, /RTC_SIGNALING_TRANSPORT_STANDARD/);
  assert.match(providerAdapterStandard, /RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM/);
  assert.match(providerAdapterStandard, /RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM/);
  assert.match(providerAdapterStandard, /root-public-surface\.ts/);
  assert.match(providerAdapterStandard, /RTC_ROOT_PUBLIC_SURFACE_STANDARD/);
  assert.match(providerAdapterStandard, /RTC_LOOKUP_HELPER_NAMING_STANDARD/);
  assert.match(providerAdapterStandard, /lower-camel-rtc/);
  assert.match(providerAdapterStandard, /upper-camel-rtc/);
  assert.match(providerAdapterStandard, /snake-case-rtc/);
  assert.match(providerAdapterStandard, /root-public-builtin-only/);
  assert.match(providerAdapterStandard, /package-boundary-only/);
  assert.match(providerAdapterStandard, /providerPackageBoundary/);
  assert.match(providerAdapterStandard, /rootPublicPolicy/);
  assert.match(providerAdapterStandard, /catalog-governed-mixed/);
  assert.match(providerAdapterStandard, /scaffold-per-provider-package/);
  assert.match(providerAdapterStandard, /builtin-only/);
  assert.match(providerAdapterStandard, /`none`/);
  assert.match(
    providerAdapterStandard,
    /Flutter\/mobile and the remaining reserved non-TypeScript language workspaces must preserve the\s+same\s+rule through standalone\s+provider-selection helper modules/i,
  );
  assert.match(
    providerAdapterStandard,
    /Flutter\/mobile and the remaining reserved non-TypeScript workspaces use\s+`scaffold-per-provider-package`/i,
  );
  assert.doesNotMatch(
    providerAdapterStandard,
    /^- reserved non-TypeScript workspaces use\s+`scaffold-per-provider-package`/im,
  );
  assert.match(providerAdapterStandard, /createRtcProviderPackageLoader/);
  assert.match(providerAdapterStandard, /resolveRtcProviderPackageLoadTarget/);
  assert.match(providerAdapterStandard, /loadRtcProviderModule/);
  assert.match(providerAdapterStandard, /installRtcProviderPackage/);
  assert.match(providerAdapterStandard, /installRtcProviderPackages/);
  assert.match(providerAdapterStandard, /provider_package_not_found/);
  assert.match(providerAdapterStandard, /provider_package_identity_mismatch/);
  assert.match(providerAdapterStandard, /provider_package_load_failed/);
  assert.match(providerAdapterStandard, /provider_module_export_missing/);
  assert.match(providerAdapterStandard, /provider extension metadata/i);
  assert.match(providerAdapterStandard, /unwrap-only/i);
  assert.match(providerAdapterStandard, /extension-object/i);
  assert.match(providerAdapterStandard, /templateTokens/);
  assert.match(providerAdapterStandard, /sourceFilePattern/);
  assert.match(providerAdapterStandard, /sourceSymbolPattern/);
  assert.match(providerAdapterStandard, /sourceTemplateTokens/);
  assert.match(providerAdapterStandard, /future-runtime-bridge-only/);
  assert.match(providerAdapterStandard, /rootPublic/i);
  assert.match(providerAdapterStandard, /provider package boundar/i);
  assert.match(providerAdapterStandard, /provider package catalog/i);
  assert.match(providerAdapterStandard, /provider activation catalog/i);
  assert.match(providerAdapterStandard, /source stub/i);

  assert.match(capabilityMatrix, /Capability Catalog/i);
  assert.match(capabilityMatrix, /Capability key/i);
  assert.match(capabilityMatrix, /Category/i);
  assert.match(capabilityMatrix, /Surface/i);
  assert.match(capabilityMatrix, /control-plane/i);
  assert.match(capabilityMatrix, /runtime-bridge/i);
  assert.match(capabilityMatrix, /cross-surface/i);
  assert.match(capabilityMatrix, /Provider Extension Catalog/i);
  assert.match(capabilityMatrix, /Provider package catalog/i);
  assert.match(capabilityMatrix, /Provider activation catalog/i);
  assert.match(capabilityMatrix, /Language Provider Package Boundary Matrix/i);
  assert.match(capabilityMatrix, /Mode/i);
  assert.match(capabilityMatrix, /Root public policy/i);
  assert.match(capabilityMatrix, /catalog-governed-mixed/);
  assert.match(capabilityMatrix, /scaffold-per-provider-package/);
  assert.match(capabilityMatrix, /builtin-only/);
  assert.match(capabilityMatrix, /reference-baseline/);
  assert.match(capabilityMatrix, /Reserved Language Resolution Scaffold Matrix/i);
  assert.match(capabilityMatrix, /Provider package loader/i);
  assert.match(capabilityMatrix, /Reserved Language Provider Package Scaffold Matrix/i);
  assert.match(capabilityMatrix, /Directory pattern/i);
  assert.match(capabilityMatrix, /Package pattern/i);
  assert.match(capabilityMatrix, /Readme file name/i);
  assert.match(capabilityMatrix, /Source file pattern/i);
  assert.match(capabilityMatrix, /Source symbol pattern/i);
  assert.match(capabilityMatrix, /Template tokens/i);
  assert.match(capabilityMatrix, /Source template tokens/i);
  assert.match(capabilityMatrix, /Runtime bridge status/i);
  assert.match(capabilityMatrix, /Default provider package identity/i);
  assert.match(capabilityMatrix, /Default provider manifest path/i);
  assert.match(capabilityMatrix, /Default provider README path/i);
  assert.match(capabilityMatrix, /Default provider source path/i);
  assert.match(capabilityMatrix, /Default provider source symbol/i);
  assert.match(capabilityMatrix, /future-runtime-bridge-only/i);
  assert.match(capabilityMatrix, /root public/i);
  assert.match(capabilityMatrix, /Extension key/i);
  assert.match(capabilityMatrix, /Access/i);
  assert.match(capabilityMatrix, /Status/i);
  assert.match(capabilityMatrix, /unwrap-only/i);
  assert.match(capabilityMatrix, /runtimeSurfaceStandard/);
  assert.match(capabilityMatrix, /signalingTransportStandard/);
  assert.match(capabilityMatrix, /runtimeImmutabilityStandard/);
  assert.match(capabilityMatrix, /rootPublicSurfaceStandard/);
  assert.match(capabilityMatrix, /lookupHelperNamingStandard/);
  assert.match(capabilityMatrix, /RTC_RUNTIME_SURFACE_METHODS/);
  assert.match(capabilityMatrix, /RTC_RUNTIME_SURFACE_FAILURE_CODE/);
  assert.match(capabilityMatrix, /RTC_RUNTIME_IMMUTABILITY_STANDARD/);
  assert.match(capabilityMatrix, /RTC_SIGNALING_TRANSPORT_STANDARD/);
  assert.match(capabilityMatrix, /RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM/);
  assert.match(capabilityMatrix, /RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM/);
  assert.match(capabilityMatrix, /RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM/);
  assert.match(capabilityMatrix, /RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM/);
  assert.match(capabilityMatrix, /root-public-surface\.ts/);
  assert.match(capabilityMatrix, /RTC_ROOT_PUBLIC_SURFACE_STANDARD/);
  assert.match(capabilityMatrix, /lookup-helper-naming\.ts/);
  assert.match(capabilityMatrix, /RTC_LOOKUP_HELPER_NAMING_STANDARD/);

  assert.match(verificationMatrix, /DEFAULT_RTC_PROVIDER_KEY/);
  assert.match(verificationMatrix, /DEFAULT_RTC_PROVIDER_PLUGIN_ID/);
  assert.match(verificationMatrix, /DEFAULT_RTC_PROVIDER_DRIVER_ID/);
  assert.match(verificationMatrix, /index\.js/);
  assert.match(verificationMatrix, /index\.d\.ts/);
  assert.match(verificationMatrix, /flutter analyze/i);
  assert.match(verificationMatrix, /consumer-supplied/);
  assert.match(verificationMatrix, /native-factory/);
  assert.match(verificationMatrix, /must-not-bundle/);
  assert.match(verificationMatrix, /reference-baseline/);
  assert.match(verificationMatrix, /official vendor sdk.*required/i);
  assert.match(verificationMatrix, /displayName/);
  assert.match(verificationMatrix, /currentRole/);
  assert.match(verificationMatrix, /workspaceSummary/);
  assert.match(verificationMatrix, /roleHighlights/);
  assert.match(verificationMatrix, /workspaceCatalogRelativePath/);
  assert.match(verificationMatrix, /language workspace catalog/i);
  assert.match(verificationMatrix, /defaultProviderContract/);
  assert.match(verificationMatrix, /providerSelectionContract/);
  assert.match(verificationMatrix, /providerSupportContract/);
  assert.match(verificationMatrix, /providerActivationContract/);
  assert.match(verificationMatrix, /providerPackageBoundaryContract/);
  assert.match(verificationMatrix, /typescript-volcengine-signaling-usage\.md/);
  assert.match(verificationMatrix, /flutter-volcengine-signaling-usage\.md/);
  assert.match(verificationMatrix, /vendorSdkPackage/);
  assert.match(verificationMatrix, /vendorSdkImportPath/);
  assert.match(verificationMatrix, /signalingSdkPackage/);
  assert.match(verificationMatrix, /signalingSdkImportPath/);
  assert.match(verificationMatrix, /recommendedEntrypoint/);
  assert.match(verificationMatrix, /smokeCommand/);
  assert.match(verificationMatrix, /smokeMode/);
  assert.match(verificationMatrix, /smokeVariants/);
  assert.match(verificationMatrix, /runtime-backed/);
  assert.match(verificationMatrix, /analysis-backed/);
  assert.match(verificationMatrix, /providerSelectionStandard/);
  assert.match(verificationMatrix, /providerSupportStandard/);
  assert.match(verificationMatrix, /providerActivationStandard/);
  assert.match(verificationMatrix, /providerPackageBoundaryStandard/);
  assert.match(verificationMatrix, /capabilityStandard/);
  assert.match(verificationMatrix, /capabilityNegotiationStandard/);
  assert.match(verificationMatrix, /runtimeSurfaceStandard/);
  assert.match(verificationMatrix, /signalingTransportStandard/);
  assert.match(verificationMatrix, /runtimeImmutabilityStandard/);
  assert.match(verificationMatrix, /rootPublicSurfaceStandard/);
  assert.match(verificationMatrix, /lookupHelperNamingStandard/);
  assert.match(verificationMatrix, /errorCodeStandard/);
  assert.match(verificationMatrix, /providerExtensionStandard/);
  assert.match(verificationMatrix, /providerTierStandard/);
  assert.match(verificationMatrix, /languageMaturityStandard/);
  assert.match(verificationMatrix, /typescriptAdapterStandard/);
  assert.match(verificationMatrix, /typescriptPackageStandard/);
  assert.match(verificationMatrix, /RTC_RUNTIME_SURFACE_METHODS/);
  assert.match(verificationMatrix, /RTC_RUNTIME_SURFACE_FAILURE_CODE/);
  assert.match(verificationMatrix, /RTC_RUNTIME_IMMUTABILITY_STANDARD/);
  assert.match(verificationMatrix, /RTC_SIGNALING_TRANSPORT_STANDARD/);
  assert.match(verificationMatrix, /RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM/);
  assert.match(verificationMatrix, /RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM/);
  assert.match(verificationMatrix, /RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM/);
  assert.match(verificationMatrix, /RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM/);
  assert.match(verificationMatrix, /root-public-surface\.ts/);
  assert.match(verificationMatrix, /RTC_ROOT_PUBLIC_SURFACE_STANDARD/);
  assert.match(verificationMatrix, /lookup-helper-naming\.ts/);
  assert.match(verificationMatrix, /RTC_LOOKUP_HELPER_NAMING_STANDARD/);
  assert.match(verificationMatrix, /RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS/);
  assert.match(verificationMatrix, /RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS/);
  assert.match(capabilityMatrix, /capabilityNegotiationStandard/);
  assert.match(capabilityMatrix, /runtimeSurfaceStandard/);
  assert.match(capabilityMatrix, /errorCodeStandard/);
  assert.match(verificationMatrix, /providerActivations/);
  assert.match(verificationMatrix, /typescriptPackage/);
  assert.match(verificationMatrix, /providerPackageBoundary/);
  assert.match(verificationMatrix, /rootPublicPolicy/);
  assert.match(verificationMatrix, /catalog-governed-mixed/);
  assert.match(verificationMatrix, /scaffold-per-provider-package/);
  assert.match(verificationMatrix, /builtin-only/);
  assert.match(verificationMatrix, /`none`/);
  assert.match(verificationMatrix, /@sdkwork\/rtc-sdk-provider-<providerKey>/);
  assert.match(verificationMatrix, /\.\.\/\.\.\/src\/providers\/<providerKey>\.ts/);
  assert.match(verificationMatrix, /create<ProviderPascal>RtcDriver/);
  assert.match(verificationMatrix, /<PROVIDER_UPPER>_RTC_PROVIDER_METADATA/);
  assert.match(verificationMatrix, /<PROVIDER_UPPER>_RTC_PROVIDER_MODULE/);
  assert.match(verificationMatrix, /contractScaffold/);
  assert.match(verificationMatrix, /resolutionScaffold/);
  assert.match(verificationMatrix, /providerPackageScaffold/);
  assert.match(verificationMatrix, /directoryPattern/);
  assert.match(verificationMatrix, /packagePattern/);
  assert.match(verificationMatrix, /manifestFileName/);
  assert.match(verificationMatrix, /readmeFileName/);
  assert.match(verificationMatrix, /sourceFilePattern/);
  assert.match(verificationMatrix, /sourceSymbolPattern/);
  assert.match(verificationMatrix, /templateTokens/);
  assert.match(verificationMatrix, /sourceTemplateTokens/);
  assert.match(verificationMatrix, /future-runtime-bridge-only/);
  assert.match(verificationMatrix, /rootPublic/);
  assert.match(verificationMatrix, /provider package boundar/i);
  assert.match(verificationMatrix, /source stub/i);
  assert.match(verificationMatrix, /providerPackageCatalogRelativePath/);
  assert.match(verificationMatrix, /provider package catalog/i);
  assert.match(verificationMatrix, /providerActivationCatalogRelativePath/);
  assert.match(verificationMatrix, /provider activation catalog/i);
  assert.match(verificationMatrix, /providerExtensionCatalogRelativePath/);
  assert.match(verificationMatrix, /providerPackageLoaderRelativePath/);
  assert.match(verificationMatrix, /driver manager/i);
  assert.match(verificationMatrix, /data source/i);
  assert.match(verificationMatrix, /provider support/i);
  assert.match(verificationMatrix, /provider package loader/i);
  assert.match(verificationMatrix, /getRtcProviderPackageByProviderKey/);
  assert.match(verificationMatrix, /getRtcProviderPackageByPackageIdentity/);
  assert.match(verificationMatrix, /createRtcProviderPackageLoader/);
  assert.match(verificationMatrix, /resolveRtcProviderPackageLoadTarget/);
  assert.match(verificationMatrix, /loadRtcProviderModule/);
  assert.match(verificationMatrix, /installRtcProviderPackage/);
  assert.match(verificationMatrix, /installRtcProviderPackages/);
  assert.match(verificationMatrix, /provider_package_not_found/);
  assert.match(verificationMatrix, /provider_package_identity_mismatch/);
  assert.match(verificationMatrix, /provider_package_load_failed/);
  assert.match(verificationMatrix, /provider_module_export_missing/);
  assert.match(verificationMatrix, /getRtcProviderActivationByProviderKey/);
  assert.match(verificationMatrix, /getRtcLanguageWorkspaceByLanguage/);
  assert.match(verificationMatrix, /getRtcProviderByProviderKey/);
  assert.match(verificationMatrix, /root-public-builtin/);
  assert.match(verificationMatrix, /package-boundary/);
  assert.match(verificationMatrix, /control-metadata-only/);
  assert.match(verificationMatrix, /capabilityCatalog/);
  assert.match(verificationMatrix, /cross-surface/);
  assert.match(verificationMatrix, /capability negotiation/i);
  assert.match(verificationMatrix, /degraded/i);
  assert.match(verificationMatrix, /unsupported/i);
  assert.match(verificationMatrix, /RTC_SDK_ERROR_CODES/);
  assert.match(verificationMatrix, /RTC_SDK_ERROR_FALLBACK_CODE/);
  assert.match(verificationMatrix, /vendor_error/);
  assert.match(verificationMatrix, /runtime-frozen/i);
  assert.match(verificationMatrix, /shallow-immutable-context/i);
  assert.match(verificationMatrix, /mutable-native-client/i);
  assert.match(verificationMatrix, /registerRtcProviderModules/);
  assert.match(verificationMatrix, /provider_module_contract_mismatch/);
  assert.match(verificationMatrix, /atomic/i);
  assert.match(verificationMatrix, /providerExtensionCatalog/);
  assert.match(typescriptReadme, /RTC_RUNTIME_SURFACE_METHODS/);
  assert.match(typescriptReadme, /RTC_SIGNALING_TRANSPORT_STANDARD/);
  assert.match(typescriptReadme, /RTC_RUNTIME_SURFACE_FAILURE_CODE/);
  assert.match(typescriptReadme, /runtime-immutability\.ts/);
  assert.match(typescriptReadme, /RTC_RUNTIME_IMMUTABILITY_STANDARD/);
  assert.match(typescriptReadme, /root-public-surface\.ts/);
  assert.match(typescriptReadme, /RTC_ROOT_PUBLIC_SURFACE_STANDARD/);
  assert.match(typescriptReadme, /lookup-helper-naming\.ts/);
  assert.match(typescriptReadme, /RTC_LOOKUP_HELPER_NAMING_STANDARD/);
  assert.match(typescriptReadme, /RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS/);
  assert.match(typescriptReadme, /RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES/);
  assert.match(verificationMatrix, /resolveRtcProviderSupportStatus/);
  assert.match(verificationMatrix, /createRtcProviderSupportState/);
  assert.match(verificationMatrix, /getBuiltinRtcProviderMetadataByKey/);
  assert.match(verificationMatrix, /getOfficialRtcProviderMetadataByKey/);
  assert.match(verificationMatrix, /provider catalog lookup/i);
  assert.match(verificationMatrix, /unwrap-only/);
  assert.match(verificationMatrix, /extension-object/);
  assert.match(verificationMatrix, /smoke-sdk\.mjs/);
  assert.match(verificationMatrix, /--reuse-live-connection/);
  assert.match(verificationMatrix, /shared RTC live-connection ownership/i);
  assert.match(verificationMatrix, /compileall/i);
  assert.match(verificationMatrix, /cargo check/i);
  assert.match(verificationMatrix, /go build/i);
  assert.match(verificationMatrix, /dotnet build/i);
  assert.match(verificationMatrix, /javac/i);
  assert.match(verificationMatrix, /swift build/i);
  assert.match(verificationMatrix, /kotlinc/i);
  assert.match(verificationMatrix, /\.gitignore/);
  assert.match(verificationMatrix, /sdkwork-rtc-sdk-typescript\/dist\//);
  assert.match(verificationMatrix, /sdkwork-rtc-sdk-rust\/target\//);
  assert.match(verificationMatrix, /sdkwork-rtc-sdk-java\/target\//);
  assert.match(verificationMatrix, /__pycache__/);
  assert.match(verificationMatrix, /\.sdkwork-assembly\.json/);
  assert.doesNotMatch(verificationMatrix, /\{\{RTC_/);

  assert.match(typescriptReadme, /src\/provider-catalog\.ts/);
  assert.match(typescriptReadme, /src\/provider-package-catalog\.ts/);
  assert.match(typescriptReadme, /src\/provider-selection\.ts/);
  assert.match(typescriptReadme, /src\/provider-support\.ts/);
  assert.match(typescriptReadme, /src\/language-workspace-catalog\.ts/);
  assert.match(typescriptReadme, /DEFAULT_RTC_PROVIDER_KEY/);
  assert.match(typescriptReadme, /DEFAULT_RTC_PROVIDER_PLUGIN_ID/);
  assert.match(typescriptReadme, /DEFAULT_RTC_PROVIDER_DRIVER_ID/);
  assert.match(typescriptReadme, /Web\/browser default provider key:\s*`volcengine`/);
  assert.match(typescriptReadme, /Web\/browser default plugin id:\s*`rtc-volcengine`/);
  assert.match(typescriptReadme, /Web\/browser default driver id:\s*`sdkwork-rtc-driver-volcengine`/);
  assert.match(typescriptReadme, /resolveRtcProviderSelection\(\)/);
  assert.match(typescriptReadme, /RtcDataSource/);
  assert.match(typescriptReadme, /provider-activation-catalog\.ts/);
  assert.match(typescriptReadme, /reference-baseline/);
  assert.match(typescriptReadme, /official vendor sdk.*required/i);
  assert.match(typescriptReadme, /catalog-governed-mixed/);
  assert.match(typescriptReadme, /builtin-only/);
  assert.match(typescriptReadme, /root_public_reference_boundary/);
  assert.match(typescriptReadme, /package_reference_boundary/);

  assert.match(typescriptLanguageWorkspaceCatalog, /providerPackageBoundary/);
  assert.match(typescriptLanguageWorkspaceCatalog, /defaultProviderContract/);
  assert.match(typescriptLanguageWorkspaceCatalog, /providerSelectionContract/);
  assert.match(typescriptLanguageWorkspaceCatalog, /providerSupportContract/);
  assert.match(typescriptLanguageWorkspaceCatalog, /providerActivationContract/);
  assert.match(typescriptLanguageWorkspaceCatalog, /providerPackageBoundaryContract/);
  assert.match(typescriptLanguageWorkspaceCatalog, /providerKey:\s*'volcengine'/);
  assert.match(typescriptLanguageWorkspaceCatalog, /pluginId:\s*'rtc-volcengine'/);
  assert.match(typescriptLanguageWorkspaceCatalog, /driverId:\s*'sdkwork-rtc-driver-volcengine'/);
  for (const source of RTC_PROVIDER_SELECTION_SOURCES) {
    assert.match(
      typescriptLanguageWorkspaceCatalog,
      new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
  for (const status of RTC_PROVIDER_SUPPORT_STATUSES) {
    assert.match(
      typescriptLanguageWorkspaceCatalog,
      new RegExp(status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
  for (const status of RTC_PROVIDER_ACTIVATION_STATUSES) {
    assert.match(
      typescriptLanguageWorkspaceCatalog,
      new RegExp(status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
  for (const mode of RTC_PROVIDER_PACKAGE_BOUNDARY_MODES) {
    assert.match(
      typescriptLanguageWorkspaceCatalog,
      new RegExp(mode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
  for (const policy of RTC_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES) {
    assert.match(
      typescriptLanguageWorkspaceCatalog,
      new RegExp(policy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
  for (const term of RTC_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS) {
    assert.match(
      typescriptLanguageWorkspaceCatalog,
      new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
  for (const term of RTC_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS) {
    assert.match(
      typescriptLanguageWorkspaceCatalog,
      new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
  assert.match(typescriptLanguageWorkspaceCatalog, /catalog-governed-mixed/);
  assert.match(typescriptLanguageWorkspaceCatalog, /builtin-only/);
  assert.match(typescriptLanguageWorkspaceCatalog, /root_public_reference_boundary/);
  assert.match(typescriptLanguageWorkspaceCatalog, /package_reference_boundary/);

  assert.match(providersReadme, /index\.js/);
  assert.match(providersReadme, /index\.d\.ts/);
  assert.match(providersReadme, /exports/);
  assert.match(providersReadme, /consumer-supplied/);
  assert.match(providersReadme, /native-factory/);
  assert.match(providersReadme, /must-not-bundle/);
  assert.match(providersReadme, /reference-baseline/);
  assert.match(providersReadme, /official vendor sdk.*required/i);
  assert.match(providersReadme, /root_public_reference_boundary/);
  assert.match(providersReadme, /package_reference_boundary/);

  const typeScriptLanguage = assembly.languages.find((languageEntry) => languageEntry.language === 'typescript');
  assert.ok(typeScriptLanguage, 'expected TypeScript language workspace');
  assert.deepEqual(typeScriptLanguage.providerPackageBoundary, {
    mode: 'catalog-governed-mixed',
    rootPublicPolicy: 'builtin-only',
    lifecycleStatusTerms: REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
    runtimeBridgeStatusTerms: ['reference-baseline'],
  });
  assert.equal(typeScriptLanguage.providerPackageScaffold, undefined);
  assert.equal(
    typeScriptLanguage.roleHighlights.some((highlight) => /root_public_reference_boundary/.test(highlight)),
    true,
  );
  assert.equal(
    typeScriptLanguage.roleHighlights.some((highlight) => /package_reference_boundary/.test(highlight)),
    true,
  );

  for (const legacyTerm of LEGACY_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_TERMS) {
    assert.doesNotMatch(typescriptReadme, new RegExp(legacyTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    assert.doesNotMatch(providersReadme, new RegExp(legacyTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    assert.doesNotMatch(
      typescriptLanguageWorkspaceCatalog,
      new RegExp(legacyTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    );
    assert.equal(
      typeScriptLanguage.roleHighlights.some(
        (highlight) => new RegExp(legacyTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(highlight),
      ),
      false,
    );
  }

  assert.match(builtinProviderReadme, /may be re-exported from the root `@sdkwork\/rtc-sdk` entrypoint/);
  assert.match(builtinProviderReadme, /vendor sdk provisioning:\s*`consumer-supplied`/i);
  assert.match(builtinProviderReadme, /binding strategy:\s*`native-factory`/i);
  assert.match(builtinProviderReadme, /bundle policy:\s*`must-not-bundle`/i);
  assert.match(builtinProviderReadme, /runtime bridge status:\s*`reference-baseline`/i);
  assert.match(builtinProviderReadme, /official vendor sdk requirement:\s*`required`/i);
  assert.match(futureProviderReadme, /not re-exported from the root `@sdkwork\/rtc-sdk` entrypoint/);
  assert.match(futureProviderReadme, /vendor sdk provisioning:\s*`consumer-supplied`/i);
  assert.match(futureProviderReadme, /binding strategy:\s*`native-factory`/i);
  assert.match(futureProviderReadme, /bundle policy:\s*`must-not-bundle`/i);
  assert.match(futureProviderReadme, /runtime bridge status:\s*`reference-baseline`/i);
  assert.match(futureProviderReadme, /official vendor sdk requirement:\s*`required`/i);
});

test('root gitignore keeps transient artifact boundaries out of source control', () => {
  const gitignore = readFileSync(path.join(workspaceRoot, '.gitignore'), 'utf8');

  assert.match(gitignore, /sdkwork-rtc-sdk-typescript\/dist\//);
  assert.match(gitignore, /sdkwork-rtc-sdk-rust\/target\//);
  assert.match(gitignore, /sdkwork-rtc-sdk-java\/target\//);
  assert.match(gitignore, /sdkwork-rtc-sdk-csharp\/src\/\*\*\/bin\//);
  assert.match(gitignore, /sdkwork-rtc-sdk-csharp\/src\/\*\*\/obj\//);
  assert.match(gitignore, /__pycache__/);
  assert.match(gitignore, /\*\.tgz/);
  assert.doesNotMatch(gitignore, /^\/\.sdkwork-assembly\.json$/m);
});

test('rtc assembly declares official languages and default provider', () => {
  const assembly = readJson(assemblyPath);

  assert.equal(assembly.workspace, 'sdkwork-rtc-sdk');
  assert.equal(assembly.defaults?.providerKey, DEFAULT_RTC_PROVIDER_KEY);
  assert.deepEqual(assembly.officialLanguages, OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS);
  assert.deepEqual(assembly.providerSelectionStandard?.sourceTerms, RTC_PROVIDER_SELECTION_SOURCES);
  assert.deepEqual(assembly.providerSelectionStandard?.precedence, RTC_PROVIDER_SELECTION_PRECEDENCE);
  assert.equal(
    assembly.providerSelectionStandard?.defaultSource,
    RTC_PROVIDER_SELECTION_SOURCES[RTC_PROVIDER_SELECTION_SOURCES.length - 1],
  );
  assert.deepEqual(assembly.providerSupportStandard?.statusTerms, RTC_PROVIDER_SUPPORT_STATUSES);
  assert.deepEqual(assembly.providerActivationStandard?.statusTerms, RTC_PROVIDER_ACTIVATION_STATUSES);
  assert.deepEqual(assembly.capabilityStandard, {
    categoryTerms: RTC_CAPABILITY_CATEGORIES,
    surfaceTerms: RTC_CAPABILITY_SURFACES,
  });
  assert.deepEqual(
    assembly.capabilityNegotiationStandard,
    EXPECTED_CAPABILITY_NEGOTIATION_STANDARD,
  );
  assert.deepEqual(assembly.runtimeSurfaceStandard, EXPECTED_RUNTIME_SURFACE_STANDARD);
  assert.deepEqual(
    assembly.signalingTransportStandard,
    EXPECTED_SIGNALING_TRANSPORT_STANDARD,
  );
  assert.deepEqual(
    assembly.runtimeImmutabilityStandard,
    EXPECTED_RUNTIME_IMMUTABILITY_STANDARD,
  );
  assert.deepEqual(
    assembly.rootPublicSurfaceStandard,
    EXPECTED_ROOT_PUBLIC_SURFACE_STANDARD,
  );
  assert.deepEqual(
    assembly.lookupHelperNamingStandard,
    EXPECTED_LOOKUP_HELPER_NAMING_STANDARD,
  );
  assert.deepEqual(assembly.errorCodeStandard, EXPECTED_ERROR_CODE_STANDARD);
  assert.deepEqual(assembly.providerExtensionStandard, {
    accessTerms: ['unwrap-only', 'extension-object'],
    statusTerms: ['reference-baseline', 'reserved'],
  });
  assert.deepEqual(assembly.providerTierStandard, EXPECTED_PROVIDER_TIER_STANDARD);
  assert.deepEqual(assembly.languageMaturityStandard, EXPECTED_LANGUAGE_MATURITY_STANDARD);
  assert.deepEqual(assembly.typescriptAdapterStandard, EXPECTED_TYPESCRIPT_ADAPTER_STANDARD);
  assert.deepEqual(assembly.typescriptPackageStandard, EXPECTED_TYPESCRIPT_PACKAGE_STANDARD);
  assert.deepEqual(assembly.providerPackageBoundaryStandard?.modeTerms, RTC_PROVIDER_PACKAGE_BOUNDARY_MODES);
  assert.deepEqual(
    assembly.providerPackageBoundaryStandard?.rootPublicPolicyTerms,
    RTC_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES,
  );
  assert.deepEqual(
    assembly.providerPackageBoundaryStandard?.lifecycleStatusTerms,
    RTC_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS,
  );
  assert.deepEqual(
    assembly.providerPackageBoundaryStandard?.runtimeBridgeStatusTerms,
    RTC_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS,
  );
  assert.deepEqual(
    assembly.providerPackageBoundaryStandard?.profiles,
    RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES,
  );

  const defaultSelectedProviders = assembly.providers
    .filter((provider) => provider.defaultSelected)
    .map((provider) => provider.providerKey);
  assert.deepEqual(defaultSelectedProviders, [DEFAULT_RTC_PROVIDER_KEY]);

  const builtinProviders = assembly.providers
    .filter((provider) => provider.builtin)
    .map((provider) => provider.providerKey);
  assert.deepEqual(builtinProviders, BUILTIN_RTC_PROVIDER_KEYS);

  assert.equal(Array.isArray(assembly.capabilityCatalog), true);
  assert.equal(assembly.capabilityCatalog.length > 0, true);
  assert.equal(Array.isArray(assembly.providerExtensionCatalog), true);
  assert.equal(assembly.providerExtensionCatalog.length > 0, true);

  const capabilityKeys = new Set();
  for (const descriptor of assembly.capabilityCatalog) {
    assert.equal(typeof descriptor.capabilityKey, 'string');
    assert.equal(typeof descriptor.category, 'string');
    assert.equal(typeof descriptor.surface, 'string');
    assert.equal(RTC_CAPABILITY_CATEGORIES.includes(descriptor.category), true);
    assert.equal(RTC_CAPABILITY_SURFACES.includes(descriptor.surface), true);
    assert.equal(capabilityKeys.has(descriptor.capabilityKey), false);
    capabilityKeys.add(descriptor.capabilityKey);
  }

  const providerExtensionKeys = new Set();
  for (const descriptor of assembly.providerExtensionCatalog) {
    assert.equal(typeof descriptor.extensionKey, 'string');
    assert.equal(typeof descriptor.providerKey, 'string');
    assert.equal(typeof descriptor.displayName, 'string');
    assert.equal(typeof descriptor.surface, 'string');
    assert.equal(typeof descriptor.access, 'string');
    assert.equal(typeof descriptor.status, 'string');
    assert.equal(providerExtensionKeys.has(descriptor.extensionKey), false);
    providerExtensionKeys.add(descriptor.extensionKey);
  }

  for (const provider of assembly.providers) {
    const canonicalTypeScriptPackage = getCanonicalTypeScriptProviderPackageContract(
      provider.providerKey,
      assembly.typescriptPackageStandard,
    );

    assert.equal(typeof provider.defaultSelected, 'boolean');
    assert.equal(Array.isArray(provider.urlSchemes), true);
    assert.equal(provider.urlSchemes.length > 0, true);
    assert.equal(Array.isArray(provider.requiredCapabilities), true);
    assert.equal(provider.requiredCapabilities.length > 0, true);
    assert.equal(Array.isArray(provider.optionalCapabilities), true);
    assert.equal(Array.isArray(provider.extensionKeys), true);
    assert.equal(typeof provider.typescriptAdapter?.sdkProvisioning, 'string');
    assert.equal(typeof provider.typescriptAdapter?.bindingStrategy, 'string');
    assert.equal(typeof provider.typescriptAdapter?.bundlePolicy, 'string');
    assert.equal(typeof provider.typescriptAdapter?.runtimeBridgeStatus, 'string');
    assert.equal(typeof provider.typescriptAdapter?.officialVendorSdkRequirement, 'string');
    assert.equal(
      assembly.typescriptAdapterStandard.sdkProvisioningTerms.includes(
        provider.typescriptAdapter.sdkProvisioning,
      ),
      true,
    );
    assert.equal(
      assembly.typescriptAdapterStandard.bindingStrategyTerms.includes(
        provider.typescriptAdapter.bindingStrategy,
      ),
      true,
    );
    assert.equal(
      assembly.typescriptAdapterStandard.bundlePolicyTerms.includes(
        provider.typescriptAdapter.bundlePolicy,
      ),
      true,
    );
    assert.equal(
      assembly.typescriptAdapterStandard.runtimeBridgeStatusTerms.includes(
        provider.typescriptAdapter.runtimeBridgeStatus,
      ),
      true,
    );
    assert.equal(
      assembly.typescriptAdapterStandard.officialVendorSdkRequirementTerms.includes(
        provider.typescriptAdapter.officialVendorSdkRequirement,
      ),
      true,
    );
    assert.equal(typeof provider.typescriptPackage?.packageName, 'string');
    assert.equal(typeof provider.typescriptPackage?.sourceModule, 'string');
    assert.equal(typeof provider.typescriptPackage?.driverFactory, 'string');
    assert.equal(typeof provider.typescriptPackage?.metadataSymbol, 'string');
    assert.equal(typeof provider.typescriptPackage?.moduleSymbol, 'string');
    assert.equal(typeof provider.typescriptPackage?.rootPublic, 'boolean');
    assert.equal(provider.typescriptPackage.packageName, canonicalTypeScriptPackage.packageName);
    assert.equal(provider.typescriptPackage.sourceModule, canonicalTypeScriptPackage.sourceModule);
    assert.equal(provider.typescriptPackage.driverFactory, canonicalTypeScriptPackage.driverFactory);
    assert.equal(provider.typescriptPackage.metadataSymbol, canonicalTypeScriptPackage.metadataSymbol);
    assert.equal(provider.typescriptPackage.moduleSymbol, canonicalTypeScriptPackage.moduleSymbol);

    for (const capability of provider.requiredCapabilities) {
      const descriptor = assembly.capabilityCatalog.find((entry) => entry.capabilityKey === capability);
      assert.ok(descriptor, `expected capability descriptor for ${capability}`);
      assert.equal(descriptor.category, 'required-baseline');
    }

    for (const capability of provider.optionalCapabilities) {
      const descriptor = assembly.capabilityCatalog.find((entry) => entry.capabilityKey === capability);
      assert.ok(descriptor, `expected capability descriptor for ${capability}`);
      assert.equal(descriptor.category, 'optional-advanced');
    }

    for (const extensionKey of provider.extensionKeys) {
      const descriptor = assembly.providerExtensionCatalog.find((entry) => entry.extensionKey === extensionKey);
      assert.ok(descriptor, `expected provider extension descriptor for ${extensionKey}`);
      assert.equal(descriptor.providerKey, provider.providerKey);
    }
  }

  assert.deepEqual(
    [...capabilityKeys].sort(),
    [...new Set(assembly.providers.flatMap((provider) => [
      ...provider.requiredCapabilities,
      ...provider.optionalCapabilities,
    ]))].sort(),
  );

  for (const languageEntry of assembly.languages) {
    assert.equal(typeof languageEntry.displayName, 'string');
    assert.equal(languageEntry.displayName.length > 0, true);
    assert.equal(typeof languageEntry.workspaceCatalogRelativePath, 'string');
    assert.equal(languageEntry.workspaceCatalogRelativePath.length > 0, true);
    assert.equal(typeof languageEntry.maturityTier, 'string');
    assert.equal(languageEntry.maturityTier.length > 0, true);
    assert.equal(typeof languageEntry.currentRole, 'string');
    assert.equal(languageEntry.currentRole.length > 0, true);
    assert.equal(typeof languageEntry.workspaceSummary, 'string');
    assert.equal(languageEntry.workspaceSummary.length > 0, true);
    assert.equal(Array.isArray(languageEntry.roleHighlights), true);
    const expectsRuntimeBaseline =
      languageEntry.runtimeBridge === true && languageEntry.maturityTier === 'reference';
    if (expectsRuntimeBaseline) {
      assert.equal(typeof languageEntry.runtimeBaseline?.vendorSdkPackage, 'string');
      assert.equal(languageEntry.runtimeBaseline.vendorSdkPackage.length > 0, true);
      assert.equal(typeof languageEntry.runtimeBaseline?.vendorSdkImportPath, 'string');
      assert.equal(languageEntry.runtimeBaseline.vendorSdkImportPath.length > 0, true);
      assert.equal(typeof languageEntry.runtimeBaseline?.signalingSdkPackage, 'string');
      assert.equal(languageEntry.runtimeBaseline.signalingSdkPackage.length > 0, true);
      assert.equal(typeof languageEntry.runtimeBaseline?.signalingSdkImportPath, 'string');
      assert.equal(languageEntry.runtimeBaseline.signalingSdkImportPath.length > 0, true);
      assert.equal(typeof languageEntry.runtimeBaseline?.recommendedEntrypoint, 'string');
      assert.equal(languageEntry.runtimeBaseline.recommendedEntrypoint.length > 0, true);
      assert.equal(typeof languageEntry.runtimeBaseline?.smokeCommand, 'string');
      assert.equal(languageEntry.runtimeBaseline.smokeCommand.length > 0, true);
      assert.equal(
        ['runtime-backed', 'analysis-backed'].includes(languageEntry.runtimeBaseline?.smokeMode),
        true,
      );
      assert.deepEqual(
        languageEntry.runtimeBaseline.smokeVariants,
        RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS.filter((variant) =>
          languageEntry.runtimeBaseline.smokeVariants.includes(variant),
        ),
      );
      assert.equal(typeof languageEntry.runtimeDocumentation?.baselineConclusion, 'string');
      assert.equal(languageEntry.runtimeDocumentation.baselineConclusion.length > 0, true);
      assert.equal(typeof languageEntry.runtimeDocumentation?.guideTitle, 'string');
      assert.equal(languageEntry.runtimeDocumentation.guideTitle.length > 0, true);
      assert.equal(typeof languageEntry.runtimeDocumentation?.runtimeLabel, 'string');
      assert.equal(languageEntry.runtimeDocumentation.runtimeLabel.length > 0, true);
      assert.equal(typeof languageEntry.runtimeDocumentation?.detailedGuidePath, 'string');
      assert.equal(languageEntry.runtimeDocumentation.detailedGuidePath.length > 0, true);
      assert.equal(typeof languageEntry.runtimeDocumentation?.detailedGuideLabel, 'string');
      assert.equal(languageEntry.runtimeDocumentation.detailedGuideLabel.length > 0, true);
      assert.equal(typeof languageEntry.runtimeDocumentation?.smokeNarrative, 'string');
      assert.equal(languageEntry.runtimeDocumentation.smokeNarrative.length > 0, true);
    } else {
      assert.equal(languageEntry.runtimeBaseline, undefined);
      assert.equal(languageEntry.runtimeDocumentation, undefined);
    }
    assert.equal(Array.isArray(languageEntry.providerActivations), true);
    assert.equal(languageEntry.providerActivations.length, assembly.providers.length);
    if (languageEntry.language !== 'typescript') {
      assert.equal(typeof languageEntry.providerPackageScaffold?.readmeFileName, 'string');
      assert.equal(languageEntry.providerPackageScaffold.readmeFileName, 'README.md');
    }

    const seenProviderKeys = new Set();
    for (const providerActivation of languageEntry.providerActivations) {
      assert.equal(typeof providerActivation.providerKey, 'string');
      assert.equal(typeof providerActivation.activationStatus, 'string');
      assert.equal(seenProviderKeys.has(providerActivation.providerKey), false);
      seenProviderKeys.add(providerActivation.providerKey);
    }
  }

  const typescriptLanguage = assembly.languages.find((entry) => entry.language === 'typescript');
  assert.ok(typescriptLanguage);
  assert.deepEqual(typescriptLanguage.runtimeBaseline, {
    vendorSdkPackage: '@volcengine/rtc',
    vendorSdkImportPath: '@volcengine/rtc',
    signalingSdkPackage: '@sdkwork/rtc-sdk',
    signalingSdkImportPath: '@sdkwork/rtc-sdk',
    recommendedEntrypoint: 'createStandardRtcCallControllerStack',
    smokeCommand: 'node ./bin/sdk-call-smoke.mjs --json',
    smokeMode: 'runtime-backed',
    smokeVariants: ['default', 'reuse-live-connection'],
  });
  assert.deepEqual(typescriptLanguage.runtimeDocumentation, {
    baselineConclusion: 'TypeScript is the executable web/browser baseline.',
    guideTitle: 'TypeScript / Web',
    runtimeLabel: 'web/browser',
    detailedGuidePath: './typescript-volcengine-signaling-usage.md',
    detailedGuideLabel: 'docs/typescript-volcengine-signaling-usage.md',
    smokeNarrative: 'exercises the public default-provider baseline without live services',
  });
  assert.deepEqual(
    typescriptLanguage.providerActivations.map((entry) => ({
      providerKey: entry.providerKey,
      activationStatus: entry.activationStatus,
    })),
    assembly.providers.map((provider) => ({
      providerKey: provider.providerKey,
      activationStatus: provider.builtin ? 'root-public-builtin' : 'package-boundary',
    })),
  );

  const flutterLanguage = assembly.languages.find((entry) => entry.language === 'flutter');
  assert.ok(flutterLanguage);
  assert.deepEqual(flutterLanguage.runtimeBaseline, {
    vendorSdkPackage: 'volc_engine_rtc',
    vendorSdkImportPath: 'package:volc_engine_rtc/volc_engine_rtc.dart',
    signalingSdkPackage: 'rtc_sdk',
    signalingSdkImportPath: 'package:rtc_sdk/rtc_sdk.dart',
    recommendedEntrypoint: 'createStandardRtcCallControllerStack',
    smokeCommand: 'node ./bin/sdk-call-smoke.mjs --json',
    smokeMode: 'analysis-backed',
    smokeVariants: ['default', 'reuse-live-connection'],
  });
  assert.deepEqual(flutterLanguage.runtimeDocumentation, {
    baselineConclusion: 'Flutter is the executable mobile baseline.',
    guideTitle: 'Flutter / Mobile',
    runtimeLabel: 'mobile',
    detailedGuidePath: './flutter-volcengine-signaling-usage.md',
    detailedGuideLabel: 'docs/flutter-volcengine-signaling-usage.md',
    smokeNarrative:
      'currently verifies the public baseline through the Flutter CLI wrapper and `flutter analyze` because the official vendor runtime is not yet CLI-runnable through the Dart VM toolchain',
  });
  assert.deepEqual(
    flutterLanguage.providerActivations.map((entry) => ({
      providerKey: entry.providerKey,
      activationStatus: entry.activationStatus,
    })),
    assembly.providers.map((provider) => ({
      providerKey: provider.providerKey,
      activationStatus: provider.providerKey === 'volcengine' ? 'root-public-builtin' : 'control-metadata-only',
    })),
  );

  for (const languageEntry of assembly.languages.filter((entry) => !['typescript', 'flutter'].includes(entry.language))) {
    assert.deepEqual(
      languageEntry.providerActivations.map((entry) => entry.activationStatus),
      assembly.providers.map(() => 'control-metadata-only'),
    );
  }
});

test('executable reference manifests preserve runtime baseline dependency packages', () => {
  const assembly = readJson(assemblyPath);
  const typescriptLanguage = assembly.languages.find((entry) => entry.language === 'typescript');
  const flutterLanguage = assembly.languages.find((entry) => entry.language === 'flutter');
  const typeScriptManifest = readJson(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript', 'package.json'),
  );
  const flutterManifest = readFileSync(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-flutter', 'pubspec.yaml'),
    'utf8',
  );
  const flutterDependencies = extractYamlSectionTopLevelKeys(flutterManifest, 'dependencies');

  assert.ok(typescriptLanguage?.runtimeBaseline);
  assert.equal(
    typeof typeScriptManifest.peerDependencies?.[typescriptLanguage.runtimeBaseline.vendorSdkPackage],
    'string',
  );
  assert.equal(
    typeScriptManifest.peerDependenciesMeta?.[typescriptLanguage.runtimeBaseline.vendorSdkPackage]
      ?.optional,
    true,
  );
  if (typescriptLanguage.runtimeBaseline.signalingSdkPackage !== typescriptLanguage.publicPackage) {
    assert.equal(
      typeof typeScriptManifest.peerDependencies?.[typescriptLanguage.runtimeBaseline.signalingSdkPackage],
      'string',
    );
    assert.equal(
      typeScriptManifest.peerDependenciesMeta?.[typescriptLanguage.runtimeBaseline.signalingSdkPackage]
        ?.optional,
      true,
    );
  }

  assert.ok(flutterLanguage?.runtimeBaseline);
  assert.equal(flutterDependencies.has(flutterLanguage.runtimeBaseline.vendorSdkPackage), true);
  if (flutterLanguage.runtimeBaseline.signalingSdkPackage !== flutterLanguage.publicPackage) {
    assert.equal(flutterDependencies.has(flutterLanguage.runtimeBaseline.signalingSdkPackage), true);
  }
});

test('root verification entrypoints exist', () => {
  const requiredFiles = ['bin/verify-sdk.mjs', 'bin/verify-sdk.ps1', 'bin/verify-sdk.sh'];

  for (const relativePath of requiredFiles) {
    assert.equal(
      existsSync(path.join(workspaceRoot, relativePath)),
      true,
      `expected ${relativePath} to exist`,
    );
  }
});

test('root smoke regression entrypoints exist', () => {
  const requiredFiles = [
    'bin/smoke-sdk.mjs',
    'bin/smoke-sdk.ps1',
    'bin/smoke-sdk.sh',
    'bin/rtc-call-smoke-standard.mjs',
  ];

  for (const relativePath of requiredFiles) {
    assert.equal(
      existsSync(path.join(workspaceRoot, relativePath)),
      true,
      `expected ${relativePath} to exist`,
    );
  }

  const smokeScript = readFileSync(path.join(workspaceRoot, 'bin', 'smoke-sdk.mjs'), 'utf8');
  const smokeHelperScript = readFileSync(
    path.join(workspaceRoot, 'bin', 'rtc-call-smoke-standard.mjs'),
    'utf8',
  );
  assert.match(smokeScript, /python:compileall/);
  assert.match(smokeScript, /flutter:analyze/);
  assert.match(smokeScript, /rust:cargo-check/);
  assert.match(smokeScript, /go:go-build/);
  assert.match(smokeScript, /csharp:dotnet-build/);
  assert.match(smokeScript, /java:javac/);
  assert.match(smokeScript, /swift:swift-build/);
  assert.match(smokeScript, /kotlin:kotlinc/);
  assert.match(smokeScript, /getRtcExecutableLanguageEntriesBySmokeMode/);
  assert.match(smokeScript, /runtime-backed/);
  assert.match(smokeScript, /analysis-backed/);
  assert.match(smokeScript, /buildRtcRootCallSmokeSteps/);
  assert.match(smokeHelperScript, /call-cli-smoke/);
  assert.match(smokeHelperScript, /reuse-live-connection/);
  assert.match(smokeHelperScript, /sdk-call-smoke\.mjs/);
  assert.match(smokeHelperScript, /buildRtcCallSmokeSignalingTransportSummary/);
  assert.match(smokeHelperScript, /buildRtcCallSmokeConnectOptions/);
});

test('root rtc smoke helper derives signaling transport defaults from the canonical assembly contract', async () => {
  const helperModule = await import(
    pathToFileURL(path.join(workspaceRoot, 'bin', 'rtc-call-smoke-standard.mjs')).href
  );

  assert.equal(helperModule.RTC_CALL_SMOKE_DEFAULT_DEVICE_ID, 'device-smoke');

  const connectOptions = helperModule.buildRtcCallSmokeConnectOptions({
    deviceId: 'device-smoke',
    conversationId: 'conversation-smoke',
    includeConversationSubscriptions: true,
  });
  assert.deepEqual(connectOptions, {
    deviceId: 'device-smoke',
    webSocketAuth: {
      mode: 'automatic',
    },
    subscriptions: {
      conversations: ['conversation-smoke'],
    },
  });

  assert.deepEqual(
    helperModule.buildRtcCallSmokeSignalingTransportSummary({
      deviceId: 'device-smoke',
    }),
    {
      deviceId: 'device-smoke',
      connectOptionsDeviceId: 'device-smoke',
      authMode: 'automatic',
      usesSharedLiveConnection: false,
      transportTerm: 'websocket-only',
      authConfigPath: 'connectOptions.webSocketAuth',
      authPassThroughTerm: 'signaling-adapter-pass-through',
      recommendedAuthMode: 'automatic',
      deviceIdAuthorityTerm: 'top-level-device-id',
      connectOptionsDeviceIdRuleTerm: 'must-match-top-level-device-id',
      liveConnectionTerm: 'shared-rtc-live-connection',
      pollingFallbackTerm: 'not-supported',
      authFailureTerm: 'fail-fast',
    },
  );

  assert.deepEqual(
    helperModule.buildRtcCallSmokeSignalingTransportSummary({
      deviceId: 'device-smoke',
      reuseLiveConnection: true,
    }),
    {
      deviceId: 'device-smoke',
      connectOptionsDeviceId: 'device-smoke',
      authMode: 'automatic',
      usesSharedLiveConnection: true,
      transportTerm: 'websocket-only',
      authConfigPath: 'connectOptions.webSocketAuth',
      authPassThroughTerm: 'signaling-adapter-pass-through',
      recommendedAuthMode: 'automatic',
      deviceIdAuthorityTerm: 'top-level-device-id',
      connectOptionsDeviceIdRuleTerm: 'must-match-top-level-device-id',
      liveConnectionTerm: 'shared-rtc-live-connection',
      pollingFallbackTerm: 'not-supported',
      authFailureTerm: 'fail-fast',
    },
  );
});

test('root sdk-call-smoke dispatcher entrypoints exist', () => {
  const requiredFiles = ['bin/sdk-call-smoke.mjs', 'bin/sdk-call-smoke.ps1', 'bin/sdk-call-smoke.sh'];

  for (const relativePath of requiredFiles) {
    assert.equal(
      existsSync(path.join(workspaceRoot, relativePath)),
      true,
      `expected ${relativePath} to exist`,
    );
  }

  const dispatcherScript = readFileSync(path.join(workspaceRoot, 'bin', 'sdk-call-smoke.mjs'), 'utf8');
  assert.match(dispatcherScript, /\.sdkwork-assembly\.json/);
  assert.match(dispatcherScript, /getRtcExecutableLanguageEntries/);
  assert.match(dispatcherScript, /getRtcDefaultCallSmokeLanguage/);
  assert.match(dispatcherScript, /languageEntry\.workspace/);
  assert.match(dispatcherScript, /renderRtcCallSmokeForwardedVariantHelp/);
});

test('root sdk-call-smoke dispatcher resolves assembly-driven executable languages', async () => {
  const dispatcherModule = await import(
    pathToFileURL(path.join(workspaceRoot, 'bin', 'sdk-call-smoke.mjs')).href
  );

  const runtimeContract = dispatcherModule.resolveRtcCallSmokeRuntimeContract(workspaceRoot);
  assert.equal(runtimeContract.defaultLanguage, 'typescript');
  assert.deepEqual(runtimeContract.executableLanguages, ['typescript', 'flutter']);
  assert.deepEqual(
    runtimeContract.executableLanguageEntries.map((languageEntry) => ({
      language: languageEntry.language,
      smokeMode: languageEntry.runtimeBaseline?.smokeMode,
      smokeVariants: languageEntry.runtimeBaseline?.smokeVariants,
    })),
    [
      {
        language: 'typescript',
        smokeMode: 'runtime-backed',
        smokeVariants: ['default', 'reuse-live-connection'],
      },
      {
        language: 'flutter',
        smokeMode: 'analysis-backed',
        smokeVariants: ['default', 'reuse-live-connection'],
      },
    ],
  );

  const defaultTarget = dispatcherModule.resolveSdkCallSmokeTarget({
    workspaceRoot,
    runtimeContract,
  });
  assert.equal(defaultTarget.language, 'typescript');
  assert.match(
    defaultTarget.args[0].replace(/\\/gu, '/'),
    /sdkwork-rtc-sdk-typescript\/bin\/sdk-call-smoke\.mjs$/,
  );

  const flutterTarget = dispatcherModule.resolveSdkCallSmokeTarget({
    workspaceRoot,
    language: 'flutter',
    runtimeContract,
  });
  assert.equal(flutterTarget.language, 'flutter');
  assert.match(
    flutterTarget.args[0].replace(/\\/gu, '/'),
    /sdkwork-rtc-sdk-flutter\/bin\/sdk-call-smoke\.mjs$/,
  );

  assert.throws(
    () =>
      dispatcherModule.resolveSdkCallSmokeTarget({
        workspaceRoot,
        language: 'python',
        runtimeContract,
      }),
    /not implemented yet/,
  );

  const helpText = dispatcherModule.getSdkCallSmokeHelpText(runtimeContract);
  assert.match(helpText, /standard forwarded variant: --reuse-live-connection/);
  assert.match(helpText, /`typescript` and `flutter`/);
});

test('typescript call smoke cli entrypoints exist', () => {
  const requiredFiles = [
    'sdkwork-rtc-sdk-typescript/bin/sdk-call-smoke.mjs',
    'sdkwork-rtc-sdk-typescript/bin/sdk-call-smoke.ps1',
    'sdkwork-rtc-sdk-typescript/bin/sdk-call-smoke.sh',
  ];

  for (const relativePath of requiredFiles) {
    assert.equal(
      existsSync(path.join(workspaceRoot, relativePath)),
      true,
      `expected ${relativePath} to exist`,
    );
  }

  const cliScript = readFileSync(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript', 'bin', 'sdk-call-smoke.mjs'),
    'utf8',
  );
  assert.match(cliScript, /createStandardRtcCallControllerStack/);
  assert.match(cliScript, /createOfficialVolcengineWebRtcDriver/);
  assert.match(cliScript, /DEFAULT_RTC_PROVIDER_KEY/);
  assert.match(cliScript, /describeRtcSignalingTransport/);
  assert.match(cliScript, /signalingTransport/);
});

test('flutter call smoke cli entrypoints exist', () => {
  for (const relativePath of RTC_FLUTTER_REQUIRED_STANDARD_FILES) {
    assert.equal(
      existsSync(path.join(workspaceRoot, relativePath)),
      true,
      `expected ${relativePath} to exist`,
    );
  }

  const cliScript = readFileSync(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-flutter', 'bin', 'sdk-call-smoke.dart'),
    'utf8',
  );
  const wrapperScript = readFileSync(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-flutter', 'bin', 'sdk-call-smoke.mjs'),
    'utf8',
  );
  assert.match(cliScript, /createStandardRtcCallControllerStack/);
  assert.match(cliScript, /createOfficialVolcengineFlutterRtcDriver/);
  assert.match(cliScript, /RtcProviderCatalog\.DEFAULT_RTC_PROVIDER_KEY/);
  assert.match(cliScript, /_FakeRtcSignalingClient/);
  assert.match(cliScript, /buildRtcCallSmokeSignalingTransportSummary/);
  assert.match(cliScript, /describeRtcSignalingTransport/);
  assert.match(wrapperScript, /analysis-backed/);
  assert.match(wrapperScript, /vendor-sdk-cli-runtime-blocked/);
  assert.match(wrapperScript, /reuse-live-connection/);
  assert.match(wrapperScript, /signalingTransport/);
  assert.match(wrapperScript, /sdk-call-smoke\.dart/);
});

test('root materialization entrypoints exist', () => {
  const requiredFiles = [
    'bin/materialize-sdk.mjs',
    'bin/materialize-sdk.ps1',
    'bin/materialize-sdk.sh',
  ];

  for (const relativePath of requiredFiles) {
    assert.equal(
      existsSync(path.join(workspaceRoot, relativePath)),
      true,
      `expected ${relativePath} to exist`,
    );
  }
});

test('typescript workspace baseline files exist', () => {
  for (const relativePath of [
    ...RTC_TYPESCRIPT_REQUIRED_STANDARD_FILES,
    RTC_TYPESCRIPT_PROVIDER_PACKAGE_ROOT_README,
    ...RTC_TYPESCRIPT_REQUIRED_TEST_FILES,
    ...RTC_FLUTTER_REQUIRED_STANDARD_FILES,
  ]) {
    assert.equal(
      existsSync(path.join(workspaceRoot, relativePath)),
      true,
      `expected ${relativePath} to exist`,
    );
  }
});

test('official language workspace skeletons exist with readmes', () => {
  const assembly = readJson(assemblyPath);

  for (const language of assembly.officialLanguages) {
    const readmePath = path.join(workspaceRoot, `sdkwork-rtc-sdk-${language}`, 'README.md');
    assert.equal(existsSync(readmePath), true, `expected ${readmePath} to exist`);
  }
});

test('official language workspaces expose language workspace catalog assets', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of assembly.languages) {
    assert.equal(
      typeof languageEntry.workspaceCatalogRelativePath,
      'string',
      `expected workspaceCatalogRelativePath for ${languageEntry.language}`,
    );

    const catalogPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.workspaceCatalogRelativePath,
    );
    assert.equal(existsSync(catalogPath), true, `expected ${catalogPath} to exist`);

    const content = readFileSync(catalogPath, 'utf8');
    assert.match(content, /LanguageWorkspaceCatalog|RTC_LANGUAGE_WORKSPACE_CATALOG/);
    for (const token of [
      'language',
      'workspace',
      'workspaceCatalogRelativePath',
      'displayName',
      'publicPackage',
      'maturityTier',
      'controlSdk',
      'runtimeBridge',
      'currentRole',
      'workspaceSummary',
      'roleHighlights',
      'defaultProviderContract',
      'providerSelectionContract',
      'providerSupportContract',
      'providerActivationContract',
      'providerPackageBoundaryContract',
      'providerPackageBoundary',
      'metadataScaffold',
      'resolutionScaffold',
      'providerPackageScaffold',
    ]) {
      assert.equal(
        matchesReservedLanguageToken(languageEntry.language, content, token),
        true,
        `expected ${token} token in ${languageEntry.language} workspace catalog`,
      );
    }

    for (const expectedLanguage of assembly.languages) {
      assert.match(
        content,
        new RegExp(expectedLanguage.language.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        content,
        new RegExp(expectedLanguage.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        content,
        new RegExp(expectedLanguage.publicPackage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        content,
        new RegExp(expectedLanguage.currentRole.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        content,
        new RegExp(expectedLanguage.workspaceSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
    }
    assert.match(
      content,
      new RegExp(assembly.defaults.providerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.match(
      content,
      new RegExp(assembly.defaults.pluginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.match(
      content,
      new RegExp(assembly.defaults.driverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );

    assertLanguageWorkspaceProviderPackageBoundaryShape(languageEntry);
    for (const sourceTerm of assembly.providerSelectionStandard.sourceTerms) {
      assert.match(content, new RegExp(sourceTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    for (const precedenceTerm of assembly.providerSelectionStandard.precedence) {
      assert.match(content, new RegExp(precedenceTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.match(
      content,
      new RegExp(assembly.providerSelectionStandard.defaultSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    for (const statusTerm of assembly.providerSupportStandard.statusTerms) {
      assert.match(content, new RegExp(statusTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    for (const statusTerm of assembly.providerActivationStandard.statusTerms) {
      assert.match(content, new RegExp(statusTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    for (const modeTerm of assembly.providerPackageBoundaryStandard.modeTerms) {
      assert.match(content, new RegExp(modeTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    for (const policyTerm of assembly.providerPackageBoundaryStandard.rootPublicPolicyTerms) {
      assert.match(content, new RegExp(policyTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    for (const lifecycleTerm of assembly.providerPackageBoundaryStandard.lifecycleStatusTerms) {
      assert.match(content, new RegExp(lifecycleTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    for (const runtimeTerm of assembly.providerPackageBoundaryStandard.runtimeBridgeStatusTerms) {
      assert.match(content, new RegExp(runtimeTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }

    if (languageEntry.language === 'typescript') {
      assert.equal(
        content.includes(languageEntry.providerPackageBoundary.mode),
        true,
        'expected TypeScript providerPackageBoundary mode in workspace catalog',
      );
      assert.equal(
        content.includes(languageEntry.providerPackageBoundary.rootPublicPolicy),
        true,
        'expected TypeScript providerPackageBoundary rootPublicPolicy in workspace catalog',
      );
      for (const term of languageEntry.providerPackageBoundary.lifecycleStatusTerms) {
        assert.equal(
          content.includes(term),
          true,
          `expected TypeScript providerPackageBoundary lifecycle term ${term} in workspace catalog`,
        );
      }
      for (const term of languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms) {
        assert.equal(
          content.includes(term),
          true,
          `expected TypeScript providerPackageBoundary runtime term ${term} in workspace catalog`,
        );
      }
      assert.match(content, /getRtcLanguageWorkspaceByLanguage/);
      continue;
    }
    assert.equal(languageEntry.providerPackageBoundary.mode, 'scaffold-per-provider-package');
    assert.equal(languageEntry.providerPackageBoundary.rootPublicPolicy, 'none');
    assert.deepEqual(languageEntry.providerPackageBoundary.lifecycleStatusTerms, [
      'future-runtime-bridge-only',
    ]);
    assert.deepEqual(languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms, ['reserved']);
    for (const term of languageEntry.providerPackageBoundary.lifecycleStatusTerms) {
      assert.equal(
        content.includes(term),
        true,
        `expected reserved providerPackageBoundary lifecycle term ${term} in ${languageEntry.language} workspace catalog`,
      );
    }
    for (const term of languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms) {
      assert.equal(
        content.includes(term),
        true,
        `expected reserved providerPackageBoundary runtime term ${term} in ${languageEntry.language} workspace catalog`,
      );
    }

    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).languageWorkspaceCatalog) {
      assert.match(content, pattern);
    }
  }
});

test('reserved language root public entrypoints expose the standard surface', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of assembly.languages) {
    const rootPublicContract = getReservedLanguageRootPublicContract(languageEntry);
    if (!rootPublicContract) {
      continue;
    }

    const rootPublicPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      rootPublicContract.relativePath,
    );
    assert.equal(existsSync(rootPublicPath), true, `expected ${rootPublicPath} to exist`);

    const content = readFileSync(rootPublicPath, 'utf8');
    for (const pattern of rootPublicContract.patterns) {
      assert.match(content, pattern);
    }
  }
});

test('go reserved workspace exports public struct fields for standard DTOs', () => {
  const assembly = readJson(assemblyPath);
  const goLanguage = assembly.languages.find((languageEntry) => languageEntry.language === 'go');
  assert.ok(goLanguage, 'expected go language workspace');

  for (const contract of getGoPublicStructFieldContracts(goLanguage)) {
    const contractPath = path.join(workspaceRoot, goLanguage.workspace, contract.relativePath);
    assert.equal(existsSync(contractPath), true, `expected ${contractPath} to exist`);

    const content = readFileSync(contractPath, 'utf8');
    for (const pattern of contract.patterns) {
      assert.match(content, pattern);
    }
  }
});

test('reserved language workspaces expose code-level standard contract scaffold files', () => {
  const assembly = readJson(assemblyPath);
  const requiredTokens = [
    'RtcProviderDriver',
    'RtcDriverManager',
    'RtcDataSource',
    'RtcClient',
    'RtcRuntimeController',
  ];

  for (const languageEntry of getReservedLanguageWorkspaceEntries(assembly)) {
    assert.equal(
      typeof languageEntry.contractScaffold?.relativePath,
      'string',
      `expected contractScaffold.relativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.contractScaffold?.symbol,
      'string',
      `expected contractScaffold.symbol for ${languageEntry.language}`,
    );

    const scaffoldPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.contractScaffold.relativePath,
    );
    assert.equal(existsSync(scaffoldPath), true, `expected ${scaffoldPath} to exist`);

    const content = readFileSync(scaffoldPath, 'utf8');
    assert.match(content, new RegExp(languageEntry.contractScaffold.symbol));
    for (const token of requiredTokens) {
      assert.match(
        content,
        new RegExp(token),
        `expected ${token} in ${languageEntry.language} contract scaffold`,
      );
    }
  }
});

test('reserved language workspaces expose package/build scaffold manifests', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of getReservedLanguageWorkspaceEntries(assembly)) {
    assert.equal(
      typeof languageEntry.packageScaffold?.buildSystem,
      'string',
      `expected packageScaffold.buildSystem for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.packageScaffold?.manifestRelativePath,
      'string',
      `expected packageScaffold.manifestRelativePath for ${languageEntry.language}`,
    );

    const manifestPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.packageScaffold.manifestRelativePath,
    );
    assert.equal(existsSync(manifestPath), true, `expected ${manifestPath} to exist`);

    const content = readFileSync(manifestPath, 'utf8');
    assert.match(content, new RegExp(languageEntry.publicPackage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(
      content,
      new RegExp(languageEntry.packageScaffold.buildSystem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
});

test('reserved language workspaces expose provider package scaffold files', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of getReservedLanguageWorkspaceEntries(assembly)) {
    assertLanguageWorkspaceProviderPackageBoundaryShape(languageEntry);
    assert.equal(languageEntry.providerPackageBoundary.mode, 'scaffold-per-provider-package');
    assert.equal(languageEntry.providerPackageBoundary.rootPublicPolicy, 'none');
    assert.deepEqual(languageEntry.providerPackageBoundary.lifecycleStatusTerms, [
      'future-runtime-bridge-only',
    ]);
    assert.deepEqual(languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms, ['reserved']);
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.relativePath,
      'string',
      `expected providerPackageScaffold.relativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.directoryPattern,
      'string',
      `expected providerPackageScaffold.directoryPattern for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.packagePattern,
      'string',
      `expected providerPackageScaffold.packagePattern for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.manifestFileName,
      'string',
      `expected providerPackageScaffold.manifestFileName for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.readmeFileName,
      'string',
      `expected providerPackageScaffold.readmeFileName for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.sourceFilePattern,
      'string',
      `expected providerPackageScaffold.sourceFilePattern for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.sourceSymbolPattern,
      'string',
      `expected providerPackageScaffold.sourceSymbolPattern for ${languageEntry.language}`,
    );
    assert.equal(
      Array.isArray(languageEntry.providerPackageScaffold?.templateTokens),
      true,
      `expected providerPackageScaffold.templateTokens for ${languageEntry.language}`,
    );
    assert.equal(
      languageEntry.providerPackageScaffold.templateTokens.length > 0,
      true,
      `expected providerPackageScaffold.templateTokens to be non-empty for ${languageEntry.language}`,
    );
    assert.equal(
      Array.isArray(languageEntry.providerPackageScaffold?.sourceTemplateTokens),
      true,
      `expected providerPackageScaffold.sourceTemplateTokens for ${languageEntry.language}`,
    );
    assert.equal(
      languageEntry.providerPackageScaffold.sourceTemplateTokens.length > 0,
      true,
      `expected providerPackageScaffold.sourceTemplateTokens to be non-empty for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.runtimeBridgeStatus,
      'string',
      `expected providerPackageScaffold.runtimeBridgeStatus for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.rootPublic,
      'boolean',
      `expected providerPackageScaffold.rootPublic for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.status,
      'string',
      `expected providerPackageScaffold.status for ${languageEntry.language}`,
    );

    const declaredTemplateTokens = normalizeStringArray(languageEntry.providerPackageScaffold.templateTokens);
    const usedTemplateTokens = normalizeStringArray([
      ...extractTemplateTokens(languageEntry.providerPackageScaffold.directoryPattern),
      ...extractTemplateTokens(languageEntry.providerPackageScaffold.packagePattern),
      ...extractTemplateTokens(languageEntry.providerPackageScaffold.manifestFileName),
    ]);
    const declaredSourceTemplateTokens = normalizeStringArray(
      languageEntry.providerPackageScaffold.sourceTemplateTokens,
    );
    const usedSourceTemplateTokens = normalizeStringArray([
      ...extractTemplateTokens(languageEntry.providerPackageScaffold.sourceFilePattern),
      ...extractTemplateTokens(languageEntry.providerPackageScaffold.sourceSymbolPattern),
    ]);
    assert.deepEqual(
      declaredTemplateTokens,
      usedTemplateTokens,
      `expected exact providerPackageScaffold.templateTokens for ${languageEntry.language}`,
    );
    assert.deepEqual(
      declaredSourceTemplateTokens,
      usedSourceTemplateTokens,
      `expected exact providerPackageScaffold.sourceTemplateTokens for ${languageEntry.language}`,
    );
    for (const token of declaredTemplateTokens) {
      assert.ok(
        KNOWN_PROVIDER_PACKAGE_TEMPLATE_TOKENS.includes(token),
        `expected known provider package template token for ${languageEntry.language}: ${token}`,
      );
    }
    for (const token of declaredSourceTemplateTokens) {
      assert.ok(
        KNOWN_PROVIDER_PACKAGE_TEMPLATE_TOKENS.includes(token),
        `expected known provider package source template token for ${languageEntry.language}: ${token}`,
      );
    }
    assert.equal(languageEntry.providerPackageScaffold.runtimeBridgeStatus, 'reserved');
    assert.equal(languageEntry.providerPackageScaffold.rootPublic, false);
    assert.equal(languageEntry.providerPackageScaffold.status, 'future-runtime-bridge-only');
    assert.equal(languageEntry.providerPackageScaffold.readmeFileName, 'README.md');
    assert.deepEqual(
      languageEntry.providerPackageBoundary.lifecycleStatusTerms,
      [languageEntry.providerPackageScaffold.status],
    );
    assert.deepEqual(
      languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms,
      [languageEntry.providerPackageScaffold.runtimeBridgeStatus],
    );

    const scaffoldPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.providerPackageScaffold.relativePath,
    );
    assert.equal(existsSync(scaffoldPath), true, `expected ${scaffoldPath} to exist`);

    const content = readFileSync(scaffoldPath, 'utf8');
    assert.match(
      content,
      new RegExp(languageEntry.providerPackageScaffold.directoryPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.match(
      content,
      new RegExp(languageEntry.providerPackageScaffold.packagePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.match(
      content,
      new RegExp(languageEntry.providerPackageScaffold.manifestFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.match(
      content,
      new RegExp(languageEntry.providerPackageScaffold.readmeFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.match(
      content,
      new RegExp(languageEntry.providerPackageScaffold.sourceFilePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.match(
      content,
      new RegExp(languageEntry.providerPackageScaffold.sourceSymbolPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    for (const templateToken of languageEntry.providerPackageScaffold.templateTokens) {
      assert.match(content, new RegExp(templateToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    for (const templateToken of languageEntry.providerPackageScaffold.sourceTemplateTokens) {
      assert.match(content, new RegExp(templateToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.match(content, /future-runtime-bridge-only/);
    assert.match(content, /runtime bridge status:\s*`reserved`/i);
    assert.match(content, /root public exposure:\s*`false`/i);
    assert.match(content, /source stub/i);

    for (const provider of assembly.providers) {
      assert.match(content, new RegExp(provider.providerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(
        content,
        new RegExp(toPascalCase(provider.providerKey).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        content,
        new RegExp(
          materializeProviderPackagePattern(
            languageEntry.providerPackageScaffold.packagePattern,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        content,
        new RegExp(
          materializeProviderPackagePattern(
            languageEntry.providerPackageScaffold.directoryPattern,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        content,
        new RegExp(
          buildProviderPackageManifestPath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        content,
        new RegExp(
          buildProviderPackageSourcePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        content,
        new RegExp(
          buildProviderPackageSourceSymbol(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );

      const providerManifestPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        buildProviderPackageManifestPath(
          languageEntry.providerPackageScaffold,
          provider.providerKey,
        ),
      );
      const providerReadmePath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        buildProviderPackageReadmePath(
          languageEntry.providerPackageScaffold,
          provider.providerKey,
        ),
      );
      const providerSourcePath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        buildProviderPackageSourcePath(
          languageEntry.providerPackageScaffold,
          provider.providerKey,
        ),
      );

      assert.equal(existsSync(providerManifestPath), true, `expected ${providerManifestPath} to exist`);
      assert.equal(existsSync(providerReadmePath), true, `expected ${providerReadmePath} to exist`);
      assert.equal(existsSync(providerSourcePath), true, `expected ${providerSourcePath} to exist`);

      const providerManifestContent = readFileSync(providerManifestPath, 'utf8');
      const providerReadmeContent = readFileSync(providerReadmePath, 'utf8');
      const providerSourceContent = readFileSync(providerSourcePath, 'utf8');

      assert.match(
        providerManifestContent,
        new RegExp(provider.providerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerManifestContent,
        new RegExp(provider.pluginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerManifestContent,
        new RegExp(provider.driverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerManifestContent,
        new RegExp(
          buildProviderPackageSourceRelativePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerManifestContent,
        new RegExp(
          buildProviderPackageSourceSymbol(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(providerManifestContent, /future-runtime-bridge-only/);
      assert.match(providerManifestContent, /reserved/);
      assert.match(providerManifestContent, /false/);

      assert.match(
        providerReadmeContent,
        new RegExp(provider.providerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerReadmeContent,
        new RegExp(provider.pluginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerReadmeContent,
        new RegExp(provider.driverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerReadmeContent,
        new RegExp(
          buildProviderPackageManifestPath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerReadmeContent,
        new RegExp(
          buildProviderPackageReadmePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerReadmeContent,
        new RegExp(
          buildProviderPackageSourcePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerReadmeContent,
        new RegExp(
          buildProviderPackageSourceSymbol(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(providerReadmeContent, /future-runtime-bridge-only/);
      assert.match(providerReadmeContent, /reserved/);
      assert.match(providerReadmeContent, /false/);
      assert.match(providerReadmeContent, /metadata-only/i);

      assert.match(
        providerSourceContent,
        new RegExp(provider.providerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerSourceContent,
        new RegExp(provider.pluginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerSourceContent,
        new RegExp(provider.driverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerSourceContent,
        new RegExp(
          materializeProviderPackagePattern(
            languageEntry.providerPackageScaffold.packagePattern,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerSourceContent,
        new RegExp(
          buildProviderPackageSourceSymbol(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(providerSourceContent, /future-runtime-bridge-only/);
      assert.match(providerSourceContent, /reserved/);
      assert.match(providerSourceContent, /metadata-only/i);
    }
  }
});

test('reserved language workspaces expose metadata catalog, provider package catalog, provider activation catalog, provider extension catalog, and standalone provider selection helper scaffold files', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of getReservedLanguageWorkspaceEntries(assembly)) {
    assert.equal(
      typeof languageEntry.metadataScaffold?.providerCatalogRelativePath,
      'string',
      `expected metadataScaffold.providerCatalogRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.metadataScaffold?.providerPackageCatalogRelativePath,
      'string',
      `expected metadataScaffold.providerPackageCatalogRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.metadataScaffold?.providerActivationCatalogRelativePath,
      'string',
      `expected metadataScaffold.providerActivationCatalogRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.metadataScaffold?.capabilityCatalogRelativePath,
      'string',
      `expected metadataScaffold.capabilityCatalogRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.metadataScaffold?.providerExtensionCatalogRelativePath,
      'string',
      `expected metadataScaffold.providerExtensionCatalogRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.metadataScaffold?.providerSelectionRelativePath,
      'string',
      `expected metadataScaffold.providerSelectionRelativePath for ${languageEntry.language}`,
    );

    const providerCatalogPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.metadataScaffold.providerCatalogRelativePath,
    );
    const capabilityCatalogPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.metadataScaffold.capabilityCatalogRelativePath,
    );
    const providerPackageCatalogPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.metadataScaffold.providerPackageCatalogRelativePath,
    );
    const providerActivationCatalogPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.metadataScaffold.providerActivationCatalogRelativePath,
    );
    const providerExtensionCatalogPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.metadataScaffold.providerExtensionCatalogRelativePath,
    );
    const providerSelectionPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.metadataScaffold.providerSelectionRelativePath,
    );

    assert.equal(existsSync(providerCatalogPath), true, `expected ${providerCatalogPath} to exist`);
    assert.equal(
      existsSync(providerPackageCatalogPath),
      true,
      `expected ${providerPackageCatalogPath} to exist`,
    );
    assert.equal(
      existsSync(providerActivationCatalogPath),
      true,
      `expected ${providerActivationCatalogPath} to exist`,
    );
    assert.equal(existsSync(capabilityCatalogPath), true, `expected ${capabilityCatalogPath} to exist`);
    assert.equal(existsSync(providerExtensionCatalogPath), true, `expected ${providerExtensionCatalogPath} to exist`);
    assert.equal(existsSync(providerSelectionPath), true, `expected ${providerSelectionPath} to exist`);

    const providerCatalog = readFileSync(providerCatalogPath, 'utf8');
    assert.match(providerCatalog, /RtcProviderCatalog/);
    assert.match(providerCatalog, /DEFAULT_RTC_PROVIDER_KEY/);
    assertReservedLanguageToken(languageEntry.language, providerCatalog, 'providerKey', 'provider catalog providerKey');
    assertReservedLanguageToken(languageEntry.language, providerCatalog, 'pluginId', 'provider catalog pluginId');
    assertReservedLanguageToken(languageEntry.language, providerCatalog, 'driverId', 'provider catalog driverId');
    assert.match(providerCatalog, /volcengine/);
    assert.match(providerCatalog, /aliyun/);
    assert.match(providerCatalog, /tencent/);
    assert.match(providerCatalog, /agora/);
    if (languageEntry.language === 'flutter') {
      assert.match(providerCatalog, /DEFAULT_RTC_PROVIDER_KEY = "volcengine"/);
    }
    if (languageEntry.language !== 'typescript') {
      for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerCatalog) {
        assert.match(providerCatalog, pattern);
      }
    }

    const providerPackageCatalog = readFileSync(providerPackageCatalogPath, 'utf8');
    assert.match(providerPackageCatalog, /RtcProviderPackageCatalog/);
    assert.match(providerPackageCatalog, /RtcProviderPackageCatalogEntry/);
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'providerKey', 'provider package catalog providerKey');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'pluginId', 'provider package catalog pluginId');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'driverId', 'provider package catalog driverId');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'packageIdentity', 'provider package catalog packageIdentity');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'manifestPath', 'provider package catalog manifestPath');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'readmePath', 'provider package catalog readmePath');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'sourcePath', 'provider package catalog sourcePath');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'sourceSymbol', 'provider package catalog sourceSymbol');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'builtin', 'provider package catalog builtin');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'rootPublic', 'provider package catalog rootPublic');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'status', 'provider package catalog status');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'runtimeBridgeStatus', 'provider package catalog runtimeBridgeStatus');
    assert.match(providerPackageCatalog, /future-runtime-bridge-only/);
    assert.match(providerPackageCatalog, /reserved/);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerPackageCatalog) {
      assert.match(providerPackageCatalog, pattern);
    }

    for (const provider of assembly.providers) {
      assert.match(
        providerPackageCatalog,
        new RegExp(provider.providerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(provider.pluginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(provider.driverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(
          materializeProviderPackagePattern(
            languageEntry.providerPackageScaffold.packagePattern,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(
          buildProviderPackageManifestPath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(
          buildProviderPackageReadmePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(
          buildProviderPackageSourcePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(
          buildProviderPackageSourceSymbol(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
    }

    const providerActivationCatalog = readFileSync(providerActivationCatalogPath, 'utf8');
    assert.match(providerActivationCatalog, /RtcProviderActivationCatalog/);
    assert.match(providerActivationCatalog, /RtcProviderActivationCatalogEntry/);
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'providerKey', 'provider activation catalog providerKey');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'pluginId', 'provider activation catalog pluginId');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'driverId', 'provider activation catalog driverId');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'activationStatus', 'provider activation catalog activationStatus');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'runtimeBridge', 'provider activation catalog runtimeBridge');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'rootPublic', 'provider activation catalog rootPublic');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'packageBoundary', 'provider activation catalog packageBoundary');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'builtin', 'provider activation catalog builtin');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'packageIdentity', 'provider activation catalog packageIdentity');
    assert.match(providerActivationCatalog, /root-public-builtin/);
    assert.match(providerActivationCatalog, /package-boundary/);
    assert.match(providerActivationCatalog, /control-metadata-only/);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerActivationCatalog) {
      assert.match(providerActivationCatalog, pattern);
    }

    const expectedProviderActivationCatalogEntries = buildLanguageProviderActivationCatalogEntries(
      languageEntry,
      assembly.providers,
    );
    for (const entry of expectedProviderActivationCatalogEntries) {
      for (const value of [
        entry.providerKey,
        entry.pluginId,
        entry.driverId,
        entry.activationStatus,
        entry.packageIdentity,
      ]) {
        assert.match(
          providerActivationCatalog,
          new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        );
      }
    }

    const capabilityCatalog = readFileSync(capabilityCatalogPath, 'utf8');
    assert.match(capabilityCatalog, /RtcCapabilityCatalog/);
    assertReservedLanguageToken(languageEntry.language, capabilityCatalog, 'capabilityKey', 'capability catalog capabilityKey');
    assertReservedLanguageToken(languageEntry.language, capabilityCatalog, 'category', 'capability catalog category');
    assertReservedLanguageToken(languageEntry.language, capabilityCatalog, 'surface', 'capability catalog surface');
    assert.match(capabilityCatalog, /required-baseline/);
    assert.match(capabilityCatalog, /optional-advanced/);
    assert.match(capabilityCatalog, /control-plane/);
    assert.match(capabilityCatalog, /runtime-bridge/);
    assert.match(capabilityCatalog, /cross-surface/);
    assert.match(capabilityCatalog, /session/);
    assert.match(capabilityCatalog, /screen-share/);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).capabilityCatalog) {
      assert.match(capabilityCatalog, pattern);
    }

    const providerExtensionCatalog = readFileSync(providerExtensionCatalogPath, 'utf8');
    assert.match(providerExtensionCatalog, /RtcProviderExtensionCatalog/);
    assertReservedLanguageToken(languageEntry.language, providerExtensionCatalog, 'extensionKey', 'provider extension catalog extensionKey');
    assertReservedLanguageToken(languageEntry.language, providerExtensionCatalog, 'providerKey', 'provider extension catalog providerKey');
    assertReservedLanguageToken(languageEntry.language, providerExtensionCatalog, 'displayName', 'provider extension catalog displayName');
    assertReservedLanguageToken(languageEntry.language, providerExtensionCatalog, 'surface', 'provider extension catalog surface');
    assertReservedLanguageToken(languageEntry.language, providerExtensionCatalog, 'access', 'provider extension catalog access');
    assertReservedLanguageToken(languageEntry.language, providerExtensionCatalog, 'status', 'provider extension catalog status');
    assert.match(providerExtensionCatalog, /volcengine\.native-client/);
    assert.match(providerExtensionCatalog, /agora\.native-client/);
    assert.match(providerExtensionCatalog, /unwrap-only/);
    assert.match(providerExtensionCatalog, /reference-baseline/);
    assert.match(providerExtensionCatalog, /reserved/);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerExtensionCatalog) {
      assert.match(providerExtensionCatalog, pattern);
    }

    const providerSelection = readFileSync(providerSelectionPath, 'utf8');
    assert.match(providerSelection, /RtcProviderSelection/);
    assertReservedLanguageToken(languageEntry.language, providerSelection, 'providerKey', 'provider selection providerKey');
    assertReservedLanguageToken(languageEntry.language, providerSelection, 'source', 'provider selection source');
    assertReservedLanguageToken(languageEntry.language, providerSelection, 'providerUrl', 'provider selection providerUrl');
    assertReservedLanguageToken(languageEntry.language, providerSelection, 'tenantOverrideProviderKey', 'provider selection tenantOverrideProviderKey');
    assertReservedLanguageToken(languageEntry.language, providerSelection, 'deploymentProfileProviderKey', 'provider selection deploymentProfileProviderKey');
    assert.match(providerSelection, /default_provider/);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerSelection) {
      assert.match(providerSelection, pattern);
    }
    if (languageEntry.language === 'flutter') {
      assert.match(providerSelection, /RtcProviderCatalog\.DEFAULT_RTC_PROVIDER_KEY/);
    }
  }
});

test('reserved language workspaces expose metadata-only driver manager, data source, provider support, and provider package loader scaffold files', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of getReservedLanguageWorkspaceEntries(assembly)) {
    assert.equal(
      typeof languageEntry.resolutionScaffold?.driverManagerRelativePath,
      'string',
      `expected resolutionScaffold.driverManagerRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.resolutionScaffold?.dataSourceRelativePath,
      'string',
      `expected resolutionScaffold.dataSourceRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.resolutionScaffold?.providerSupportRelativePath,
      'string',
      `expected resolutionScaffold.providerSupportRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.resolutionScaffold?.providerPackageLoaderRelativePath,
      'string',
      `expected resolutionScaffold.providerPackageLoaderRelativePath for ${languageEntry.language}`,
    );

    const driverManagerPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.resolutionScaffold.driverManagerRelativePath,
    );
    const dataSourcePath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.resolutionScaffold.dataSourceRelativePath,
    );
    const providerSupportPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.resolutionScaffold.providerSupportRelativePath,
    );
    const providerPackageLoaderPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.resolutionScaffold.providerPackageLoaderRelativePath,
    );

    assert.equal(existsSync(driverManagerPath), true, `expected ${driverManagerPath} to exist`);
    assert.equal(existsSync(dataSourcePath), true, `expected ${dataSourcePath} to exist`);
    assert.equal(existsSync(providerSupportPath), true, `expected ${providerSupportPath} to exist`);
    assert.equal(existsSync(providerPackageLoaderPath), true, `expected ${providerPackageLoaderPath} to exist`);

    const driverManager = readFileSync(driverManagerPath, 'utf8');
    assert.match(driverManager, /RtcDriverManager/);
    assert.match(driverManager, /resolveSelection/i);
    assert.match(driverManager, /describeProviderSupport/i);
    assert.match(driverManager, /listProviderSupport/i);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).driverManagerDelegates) {
      assert.match(driverManager, pattern);
    }

    const dataSource = readFileSync(dataSourcePath, 'utf8');
    assert.match(dataSource, /RtcDataSource/);
    assert.match(dataSource, /RtcDataSourceOptions/);
    assert.match(dataSource, /describeSelection/i);
    assert.match(dataSource, /describeProviderSupport/i);
    assert.match(dataSource, /listProviderSupport/i);
    assertReservedLanguageToken(languageEntry.language, dataSource, 'defaultProviderKey', 'data source defaultProviderKey');
    if (languageEntry.language === 'flutter') {
      assert.match(dataSource, /RtcProviderCatalog\.DEFAULT_RTC_PROVIDER_KEY/);
    }

    const providerSupport = readFileSync(providerSupportPath, 'utf8');
    assert.match(providerSupport, /RtcProviderSupport/);
    assertReservedLanguageToken(languageEntry.language, providerSupport, 'providerKey', 'provider support providerKey');
    assertReservedLanguageToken(languageEntry.language, providerSupport, 'status', 'provider support status');
    assertReservedLanguageToken(languageEntry.language, providerSupport, 'builtin', 'provider support builtin');
    assertReservedLanguageToken(languageEntry.language, providerSupport, 'official', 'provider support official');
    assertReservedLanguageToken(languageEntry.language, providerSupport, 'registered', 'provider support registered');
    assert.match(providerSupport, /official_unregistered/);
    assert.match(providerSupport, /unknown/);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerSupport) {
      assert.match(providerSupport, pattern);
    }

    const providerPackageLoader = readFileSync(providerPackageLoaderPath, 'utf8');
    assert.match(providerPackageLoader, /RtcProviderPackageLoadRequest/);
    assert.match(providerPackageLoader, /RtcResolvedProviderPackageLoadTarget/);
    assert.match(providerPackageLoader, /provider_package_not_found/);
    assert.match(providerPackageLoader, /provider_package_identity_mismatch/);
    assert.match(providerPackageLoader, /provider_package_load_failed/);
    assert.match(providerPackageLoader, /provider_module_export_missing/);
    if (languageEntry.language === 'csharp') {
      assert.doesNotMatch(
        providerPackageLoader,
        /\bvar namespace\s*=/,
        'csharp provider package loader must not use the reserved namespace keyword as a local variable',
      );
    }
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerPackageLoader) {
      assert.match(providerPackageLoader, pattern);
    }
  }
});

test('language workspace readmes align with the assembly language matrix', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of assembly.languages) {
    const readmePath = path.join(workspaceRoot, languageEntry.workspace, 'README.md');
    const readme = readFileSync(readmePath, 'utf8');

    const escapedDisplayName = languageEntry.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(readme, new RegExp(`Language:\\s*\\\`${languageEntry.language}\\\``));
    assert.match(readme, new RegExp(`#\\s+SDKWork RTC SDK ${escapedDisplayName} Workspace`));
    assert.match(readme, /Planned public package:/);
    assert.match(readme, new RegExp(languageEntry.publicPackage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(
      readme,
      new RegExp(`control SDK support:\\s*${languageEntry.controlSdk ? 'yes' : 'no'}`),
    );
    assert.match(
      readme,
      new RegExp(`runtime bridge support:\\s*${languageEntry.runtimeBridge ? 'yes' : 'reserved'}`),
    );
    assert.match(
      readme,
      new RegExp(`maturity tier:\\s*${languageEntry.maturityTier}`),
    );
    assert.match(readme, new RegExp(`Current role:\\s*[\\s\\S]*${languageEntry.currentRole.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.match(readme, new RegExp(languageEntry.workspaceSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(readme, /Default provider contract:/);
    assert.match(readme, new RegExp(`provider key:\\s*\\\`${assembly.defaults.providerKey}\\\``));
    assert.match(readme, new RegExp(`plugin id:\\s*\\\`${assembly.defaults.pluginId}\\\``));
    assert.match(readme, new RegExp(`driver id:\\s*\\\`${assembly.defaults.driverId}\\\``));
    for (const roleHighlight of languageEntry.roleHighlights) {
      assert.match(readme, new RegExp(roleHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.match(readme, /\.\.\/docs\/provider-adapter-standard\.md/);
    assert.match(readme, /\.\.\/docs\/multilanguage-capability-matrix\.md/);
    assert.match(
      readme,
      new RegExp(
        languageEntry.workspaceCatalogRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      ),
    );

    if (languageEntry.language !== 'typescript') {
      assert.match(
        readme,
        new RegExp(
          languageEntry.resolutionScaffold.driverManagerRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        readme,
        new RegExp(
          languageEntry.resolutionScaffold.dataSourceRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        readme,
        new RegExp(
          languageEntry.resolutionScaffold.providerSupportRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        readme,
        new RegExp(
          languageEntry.resolutionScaffold.providerPackageLoaderRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        readme,
        new RegExp(
          languageEntry.metadataScaffold.providerPackageCatalogRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        readme,
        new RegExp(
          languageEntry.metadataScaffold.providerActivationCatalogRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        readme,
        new RegExp(
          languageEntry.metadataScaffold.providerExtensionCatalogRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
    }

    if (languageEntry.language === 'flutter') {
      assert.match(readme, /future extracted provider packages/i);
      assert.match(readme, /runnable root workspace baseline/i);
    }
  }
});

test('multilanguage capability matrix aligns with the assembly language and provider tier snapshot', () => {
  const assembly = readJson(assemblyPath);
  const matrixPath = path.join(workspaceRoot, 'docs', 'multilanguage-capability-matrix.md');
  const docsReadmePath = path.join(workspaceRoot, 'docs', 'README.md');
  const matrix = readFileSync(matrixPath, 'utf8');
  const docsReadme = readFileSync(docsReadmePath, 'utf8');

  assert.match(
    matrix,
    /\| Provider key \| Tier \| Builtin \| Default selected \| Display name \|/,
  );
  assert.match(
    matrix,
    /\| Provider key \| Runtime bridge status \| Vendor SDK requirement \| SDK provisioning \| Binding strategy \| Bundle policy \|/,
  );
  assert.match(
    matrix,
    /\| Language \| Provider key \| Activation status \| Runtime bridge \| Root public \| Package boundary \|/,
  );
  assert.match(
    matrix,
    /\| Language \| Provider catalog \| Provider package catalog \| Provider activation catalog \| Capability catalog \| Provider extension catalog \| Provider selection \|/,
  );
  assert.match(
    matrix,
    /\| Language \| Driver manager \| Data source \| Provider support \| Provider package loader \|/,
  );
  assert.match(
    matrix,
    /\| Language \| Workspace catalog \| Public package \| Control SDK \| Runtime bridge \| Maturity tier \|/,
  );

  for (const provider of assembly.providers) {
    assert.match(matrix, new RegExp(`\\\`${provider.providerKey}\\\``));
    assert.match(
      matrix,
      new RegExp(
        `\\|\\s*\\\`${provider.providerKey}\\\`\\s*\\|\\s*\\\`${provider.tier}\\\`\\s*\\|[^\\n]*\\|\\s*${provider.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|`,
      ),
    );
    assert.match(
      matrix,
      new RegExp(
        `\\|\\s*\\\`${provider.providerKey}\\\`\\s*\\|\\s*\\\`${provider.typescriptAdapter.runtimeBridgeStatus}\\\`\\s*\\|\\s*\\\`${provider.typescriptAdapter.officialVendorSdkRequirement}\\\`\\s*\\|\\s*\\\`${provider.typescriptAdapter.sdkProvisioning}\\\`\\s*\\|\\s*\\\`${provider.typescriptAdapter.bindingStrategy}\\\`\\s*\\|\\s*\\\`${provider.typescriptAdapter.bundlePolicy}\\\`\\s*\\|`,
      ),
    );
  }

  for (const languageEntry of assembly.languages) {
    assert.match(
      matrix,
      new RegExp(`\\|\\s*${languageEntry.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|`),
    );
    assert.match(matrix, new RegExp(languageEntry.publicPackage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(
      matrix,
      new RegExp(
        `\\|\\s*${languageEntry.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|[^\\n]*\\|\\s*\\\`${languageEntry.maturityTier}\\\`\\s*\\|\\s*${languageEntry.currentRole.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|`,
      ),
    );

    for (const providerActivation of languageEntry.providerActivations) {
      const provider = assembly.providers.find((entry) => entry.providerKey === providerActivation.providerKey);
      assert.ok(provider);
      const expectedRuntimeBridge = providerActivation.activationStatus === 'control-metadata-only' ? 'No' : 'Yes';
      const expectedRootPublic = providerActivation.activationStatus === 'root-public-builtin' ? 'Yes' : 'No';
      const expectedPackageBoundary =
        providerActivation.activationStatus === 'control-metadata-only' ? 'No' : 'Yes';

      assert.match(
        matrix,
        new RegExp(
          `\\|\\s*${languageEntry.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|\\s*\\\`${provider.providerKey}\\\`\\s*\\|\\s*\\\`${providerActivation.activationStatus}\\\`\\s*\\|\\s*${expectedRuntimeBridge}\\s*\\|\\s*${expectedRootPublic}\\s*\\|\\s*${expectedPackageBoundary}\\s*\\|`,
        ),
      );
    }
  }

  assert.match(docsReadme, /multilanguage-capability-matrix\.md/);
  assert.match(docsReadme, /materialized from `\.sdkwork-assembly\.json`/);
  assert.match(docsReadme, /language workspace catalog/i);
  assert.match(docsReadme, /provider activation catalog/i);
  assert.match(matrix, /TypeScript and Flutter are the executable reference baselines in the current landing\./);
  assert.match(
    matrix,
    /A provider package boundary may stay reserved even when the root workspace already has a verified runtime bridge\./,
  );
  assert.doesNotMatch(matrix, /TypeScript is the only executable reference baseline in the first landing\./);
});

test('typescript provider package skeletons exist for every official provider', () => {
  const assembly = readJson(assemblyPath);
  const providerRoot = path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript', 'providers');

  assert.equal(existsSync(path.join(providerRoot, 'README.md')), true);

  for (const provider of assembly.providers) {
    const packageDir = path.join(providerRoot, `rtc-sdk-provider-${provider.providerKey}`);
    const manifestPath = path.join(packageDir, 'package.json');
    const readmePath = path.join(packageDir, 'README.md');
    const entrypointPath = path.join(packageDir, 'index.js');
    const declarationPath = path.join(packageDir, 'index.d.ts');

    assert.equal(existsSync(manifestPath), true, `expected ${manifestPath} to exist`);
    assert.equal(existsSync(readmePath), true, `expected ${readmePath} to exist`);
    assert.equal(existsSync(entrypointPath), true, `expected ${entrypointPath} to exist`);
    assert.equal(existsSync(declarationPath), true, `expected ${declarationPath} to exist`);

    const manifest = readJson(manifestPath);
    assert.equal(manifest.name, provider.typescriptPackage.packageName);
    assert.equal(manifest.main, './index.js');
    assert.equal(manifest.types, './index.d.ts');
    assert.equal(manifest.exports?.['.']?.import, './index.js');
    assert.equal(manifest.exports?.['.']?.default, './index.js');
    assert.equal(manifest.exports?.['.']?.types, './index.d.ts');
    assert.equal(manifest.sdkworkRtcProvider?.providerKey, provider.providerKey);
    assert.equal(manifest.sdkworkRtcProvider?.builtin, provider.builtin);
    assert.equal(manifest.sdkworkRtcProvider?.tier, provider.tier);
    assert.equal(manifest.sdkworkRtcProvider?.registrationContract, 'RtcProviderModule');
    assert.equal(manifest.sdkworkRtcProvider?.sourceModule, provider.typescriptPackage.sourceModule);
    assert.equal(manifest.sdkworkRtcProvider?.driverFactory, provider.typescriptPackage.driverFactory);
    assert.equal(
      manifest.sdkworkRtcProvider?.metadataSymbol,
      provider.typescriptPackage.metadataSymbol,
    );
    assert.equal(manifest.sdkworkRtcProvider?.moduleSymbol, provider.typescriptPackage.moduleSymbol);
    assert.equal(manifest.sdkworkRtcProvider?.rootPublic, provider.typescriptPackage.rootPublic);
    assert.equal(
      manifest.sdkworkRtcProvider?.typescriptAdapter?.sdkProvisioning,
      provider.typescriptAdapter.sdkProvisioning,
    );
    assert.equal(
      manifest.sdkworkRtcProvider?.typescriptAdapter?.bindingStrategy,
      provider.typescriptAdapter.bindingStrategy,
    );
    assert.equal(
      manifest.sdkworkRtcProvider?.typescriptAdapter?.bundlePolicy,
      provider.typescriptAdapter.bundlePolicy,
    );
    assert.equal(
      existsSync(
        path.resolve(packageDir, manifest.sdkworkRtcProvider.sourceModule),
      ),
      true,
      `expected source module for ${provider.providerKey} to exist`,
    );
  }
});

test('root verifier rejects builtin provider drift in assembly metadata', async () => {
  const fixture = createVerifierFixture((assembly) => {
    assembly.providers = assembly.providers.filter((provider) => provider.providerKey !== 'aliyun');
    for (const languageEntry of assembly.languages) {
      languageEntry.providerActivations = languageEntry.providerActivations.filter(
        (entry) => entry.providerKey !== 'aliyun',
      );
    }
  });

  try {
    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /builtin providers/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects non-canonical TypeScript provider package naming patterns in assembly metadata', async () => {
  const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
  const cases = [
    {
      label: 'packageName',
      mutate(provider) {
        provider.typescriptPackage.packageName = '@sdkwork/rtc-provider-volcengine';
      },
      expected: /packageName must be @sdkwork\/rtc-sdk-provider-volcengine/i,
    },
    {
      label: 'sourceModule',
      mutate(provider) {
        provider.typescriptPackage.sourceModule = '../../src/provider/volcengine.ts';
      },
      expected: /sourceModule must be \.\.\/\.\.\/src\/providers\/volcengine\.ts/i,
    },
    {
      label: 'driverFactory',
      mutate(provider) {
        provider.typescriptPackage.driverFactory = 'createRtcDriverVolcengine';
      },
      expected: /driverFactory must be createVolcengineRtcDriver/i,
    },
    {
      label: 'metadataSymbol',
      mutate(provider) {
        provider.typescriptPackage.metadataSymbol = 'RTC_PROVIDER_METADATA_VOLCENGINE';
      },
      expected: /metadataSymbol must be VOLCENGINE_RTC_PROVIDER_METADATA/i,
    },
    {
      label: 'moduleSymbol',
      mutate(provider) {
        provider.typescriptPackage.moduleSymbol = 'RTC_PROVIDER_MODULE_VOLCENGINE';
      },
      expected: /moduleSymbol must be VOLCENGINE_RTC_PROVIDER_MODULE/i,
    },
  ];

  for (const contractCase of cases) {
    const fixture = createVerifierFixture((assembly) => {
      const provider = assembly.providers.find((entry) => entry.providerKey === 'volcengine');
      assert.ok(provider, 'expected volcengine provider in assembly fixture');
      contractCase.mutate(provider);
    });

    try {
      assert.throws(
        () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
        contractCase.expected,
        `expected verifier to reject non-canonical ${contractCase.label} contract`,
      );
    } finally {
      rmSync(fixture.fixtureRoot, { recursive: true, force: true });
    }
  }
});

test('root verifier rejects missing documentation clauses for provider package entrypoints and default constants', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const packageStandardsPath = path.join(fixture.workspaceCopy, 'docs', 'package-standards.md');
    const rootReadmePath = path.join(fixture.workspaceCopy, 'README.md');

    writeFileSync(
      packageStandardsPath,
      readFileSync(packageStandardsPath, 'utf8')
        .replace(/- provider package boundaries live under `providers\/rtc-sdk-provider-<providerKey>\/`\r?\n/, '')
        .replace(/- every provider package manifest must bind to one real source module and declare its driver\r?\n  factory, metadata symbol, module symbol, and root-public exposure policy\r?\n/, '')
        .replace(/- every provider package manifest must declare the TypeScript vendor SDK contract:.*\r?\n/, ''),
    );
    writeFileSync(
      rootReadmePath,
      readFileSync(rootReadmePath, 'utf8').replace(/DEFAULT_RTC_PROVIDER_KEY/g, 'DEFAULT_PROVIDER_KEY'),
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /documentation clause|README\.md|package-standards/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing documentation clauses for the assembly-driven language workspace contract', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const packageStandardsPath = path.join(fixture.workspaceCopy, 'docs', 'package-standards.md');
    const verificationMatrixPath = path.join(fixture.workspaceCopy, 'docs', 'verification-matrix.md');

    writeFileSync(
      packageStandardsPath,
      readFileSync(packageStandardsPath, 'utf8')
        .replace(/- the assembly-driven `displayName`\r?\n/, '')
        .replace(/- the current role summary as `currentRole`\r?\n/, '')
        .replace(/- the workspace summary text as `workspaceSummary`\r?\n/, '')
        .replace(/- the role highlight list as `roleHighlights`, materialized into the workspace README\r?\n/, ''),
    );
    writeFileSync(
      verificationMatrixPath,
      readFileSync(verificationMatrixPath, 'utf8').replace(
        /- every language declares the assembly-driven language workspace contract fields:[\s\S]*?roleHighlights`\r?\n/,
        '',
      ),
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /documentation clause|language workspace contract|displayName|roleHighlights/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing internal docs clauses for standard modules and provider lookup helpers', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const docsReadmePath = path.join(fixture.workspaceCopy, 'docs', 'README.md');

    writeFileSync(
      docsReadmePath,
      readFileSync(docsReadmePath, 'utf8')
        .replace(
          /- provider support: `sdkwork-rtc-sdk-typescript\/src\/provider-support\.ts`\r?\n  Keeps provider support classification and support-state construction explicit\.\r?\n/,
          '',
        )
        .replace(/getBuiltinRtcProviderMetadataByKey/g, 'getBuiltinRtcProviderMetadata')
        .replace(/getOfficialRtcProviderMetadataByKey/g, 'getOfficialRtcProviderMetadata'),
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /documentation clause|docs\/README\.md|provider support|getOfficialRtcProviderMetadataByKey/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing typescript provider package boundaries', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        'sdkwork-rtc-sdk-typescript',
        'providers',
        'rtc-sdk-provider-agora',
      ),
      { recursive: true, force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /provider package/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects legacy TypeScript provider package boundary wording in materialized assets', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const typescriptReadmePath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'README.md',
    );
    writeFileSync(
      typescriptReadmePath,
      readFileSync(typescriptReadmePath, 'utf8').replace(
        /- TypeScript runtime bridge baseline: reference-baseline/,
        '- reserved TypeScript provider package boundaries\n- TypeScript runtime bridge baseline: reference-baseline',
      ),
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /legacy TypeScript provider package boundary wording|reserved TypeScript provider package boundaries/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects stale legacy provider catalog assets', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const legacyCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'src',
      'providers',
      'catalog.ts',
    );
    mkdirSync(path.dirname(legacyCatalogPath), { recursive: true });
    writeFileSync(legacyCatalogPath, 'export const LEGACY_PROVIDER_CATALOG = true;\n');

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /legacy provider catalog|stale/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing rtc smoke standard helper asset', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    rmSync(path.join(fixture.workspaceCopy, 'bin', 'rtc-call-smoke-standard.mjs'), {
      force: true,
    });

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /Missing required file: bin\/rtc-call-smoke-standard\.mjs/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects root smoke script drift away from the shared rtc smoke helper', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const smokeScriptPath = path.join(fixture.workspaceCopy, 'bin', 'smoke-sdk.mjs');
    writeFileSync(
      smokeScriptPath,
      readFileSync(smokeScriptPath, 'utf8').replace(
        /buildRtcRootCallSmokeSteps/g,
        'buildRootCallSmokeStepsLegacy',
      ),
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /script clause|smoke-sdk\.mjs|buildRtcRootCallSmokeSteps/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects drift in materialized language workspace assets', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const javaReadmePath = path.join(fixture.workspaceCopy, 'sdkwork-rtc-sdk-java', 'README.md');
    const javaProviderPackageScaffoldPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'provider-package-scaffold.md',
    );
    const javaAgoraProviderManifestPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'rtc-sdk-provider-agora',
      'pom.xml',
    );
    const javaAgoraProviderReadmePath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'rtc-sdk-provider-agora',
      'README.md',
    );
    const javaAgoraProviderSourcePath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'rtc-sdk-provider-agora',
      'src',
      'main',
      'java',
      'com',
      'sdkwork',
      'rtc',
      'provider',
      'agora',
      'RtcProviderAgoraPackageContract.java',
    );
    const originalReadme = readFileSync(javaReadmePath, 'utf8');
    const driftedReadme = originalReadme.replace(
      'future enterprise runtime integration.',
      'future enterprise runtime orchestration.',
    );

    assert.notEqual(driftedReadme, originalReadme);
    writeFileSync(javaReadmePath, driftedReadme);

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /materialized asset|drift/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing assembly-driven language workspace contract fields', async () => {
  const fixture = createVerifierFixture((assembly) => {
    delete assembly.languages.find((entry) => entry.language === 'java').displayName;
  });

  try {
    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /language workspace contract|displayName|java/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing language provider activation matrix entries', async () => {
  const fixture = createVerifierFixture((assembly) => {
    const typescriptLanguage = assembly.languages.find((entry) => entry.language === 'typescript');
    typescriptLanguage.providerActivations = typescriptLanguage.providerActivations.filter(
      (entry) => entry.providerKey !== 'agora',
    );
  });

  try {
    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /provider activation|typescript|agora/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language contract scaffold files', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const javaLanguage = assembly.languages.find((entry) => entry.language === 'java');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        javaLanguage.workspace,
        javaLanguage.contractScaffold.relativePath,
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /language contract scaffold|java/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language package scaffold manifests', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const pythonLanguage = assembly.languages.find((entry) => entry.language === 'python');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        pythonLanguage.workspace,
        pythonLanguage.packageScaffold.manifestRelativePath,
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /package scaffold|python/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language provider package scaffold files', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const goLanguage = assembly.languages.find((entry) => entry.language === 'go');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        goLanguage.workspace,
        goLanguage.providerPackageScaffold.relativePath,
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /provider package scaffold|go/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects invalid reserved language provider package template token contracts', async () => {
  const fixture = createVerifierFixture((assembly) => {
    const javaLanguage = assembly.languages.find((entry) => entry.language === 'java');
    javaLanguage.providerPackageScaffold.templateTokens = ['{providerPascal}'];
  });

  try {
    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /templateTokens|provider package scaffold|java/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects invalid reserved language provider package source template token contracts', async () => {
  const fixture = createVerifierFixture((assembly) => {
    const pythonLanguage = assembly.languages.find((entry) => entry.language === 'python');
    pythonLanguage.providerPackageScaffold.sourceTemplateTokens = ['{providerKey}'];
  });

  try {
    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /sourceTemplateTokens|provider package scaffold|python/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects reserved language provider package rootPublic drift', async () => {
  const fixture = createVerifierFixture((assembly) => {
    const goLanguage = assembly.languages.find((entry) => entry.language === 'go');
    goLanguage.providerPackageScaffold.rootPublic = true;
  });

  try {
    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /rootPublic|provider package scaffold|go/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language provider package manifest boundaries', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const javaLanguage = assembly.languages.find((entry) => entry.language === 'java');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        javaLanguage.workspace,
        buildProviderPackageManifestPath(javaLanguage.providerPackageScaffold, 'agora'),
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /provider package manifest|java|agora/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language provider package source boundaries', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const swiftLanguage = assembly.languages.find((entry) => entry.language === 'swift');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        swiftLanguage.workspace,
        buildProviderPackageSourcePath(swiftLanguage.providerPackageScaffold, 'agora'),
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /provider package source scaffold|swift|agora/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language metadata scaffold files', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const goLanguage = assembly.languages.find((entry) => entry.language === 'go');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        goLanguage.workspace,
        goLanguage.metadataScaffold.providerActivationCatalogRelativePath,
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /metadata scaffold|go/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language resolution scaffold files', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const javaLanguage = assembly.languages.find((entry) => entry.language === 'java');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        javaLanguage.workspace,
        javaLanguage.resolutionScaffold.driverManagerRelativePath,
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /resolution scaffold|java/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

function resolveActualGeneratorRoot(startRoot = workspaceRoot) {
  if (process.env.SDKWORK_GENERATOR_ROOT) {
    const explicitRoot = path.resolve(process.env.SDKWORK_GENERATOR_ROOT);
    if (existsSync(explicitRoot)) {
      return explicitRoot;
    }
  }

  let current = path.resolve(startRoot);

  while (true) {
    const candidate = path.join(current, 'sdk', 'sdkwork-sdk-generator');
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  throw new Error(`Unable to locate sdkwork-sdk-generator from ${startRoot}`);
}

test('typescript package-task resolves the generator through the shared runtime helper when the package is relocated', () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'sdkwork-rtc-sdk-package-task-'));
  const fixtureWorkspace = path.join(tempRoot, 'relocated-workspace');
  const packageRoot = path.join(fixtureWorkspace, 'sdkwork-rtc-sdk-typescript');
  const rootBinDir = path.join(fixtureWorkspace, 'bin');
  const generatorHelperPath = path.join(rootBinDir, 'generator-runtime.mjs');
  const generatorRoot = resolveActualGeneratorRoot(workspaceRoot);
  const fixtureTypescriptBin = path.join(
    fixtureWorkspace,
    'node_modules',
    '.pnpm',
    'node_modules',
    'typescript',
    'bin',
  );

  try {
    mkdirSync(fixtureWorkspace, { recursive: true });
    cpSync(
      path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript'),
      packageRoot,
      { recursive: true },
    );
    mkdirSync(rootBinDir, { recursive: true });
    cpSync(path.join(workspaceRoot, 'bin', 'generator-runtime.mjs'), generatorHelperPath);
    mkdirSync(fixtureTypescriptBin, { recursive: true });
    writeFileSync(
      path.join(fixtureTypescriptBin, 'tsc'),
      `const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const distRoot = path.join(process.cwd(), 'dist');
mkdirSync(distRoot, { recursive: true });
writeFileSync(path.join(distRoot, 'index.js'), 'export {};\\n', 'utf8');
`,
      'utf8',
    );

    const result = spawnSync(
      process.execPath,
      [path.join(packageRoot, 'bin', 'package-task.mjs'), 'build'],
      {
        cwd: fixtureWorkspace,
        encoding: 'utf8',
        shell: false,
        env: {
          ...process.env,
          SDKWORK_GENERATOR_ROOT: generatorRoot,
        },
      },
    );

    const output = `${result.stdout || ''}${result.stderr || ''}`;
    assert.equal(
      result.status,
      0,
      `package-task build must succeed when SDKWORK_GENERATOR_ROOT is provided in a relocated workspace.\n${output}`,
    );
    assert.ok(
      existsSync(path.join(packageRoot, 'dist', 'index.js')),
      'package-task build must emit dist/index.js in the relocated workspace.',
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('root materializer repairs provider package, provider catalog, and language readme drift idempotently', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const rootReadmePath = path.join(fixture.workspaceCopy, 'README.md');
    const docsReadmePath = path.join(fixture.workspaceCopy, 'docs', 'README.md');
    const packageStandardsPath = path.join(
      fixture.workspaceCopy,
      'docs',
      'package-standards.md',
    );
    const providerAdapterStandardPath = path.join(
      fixture.workspaceCopy,
      'docs',
      'provider-adapter-standard.md',
    );
    const matrixPath = path.join(
      fixture.workspaceCopy,
      'docs',
      'multilanguage-capability-matrix.md',
    );
    const usageGuidePath = path.join(
      fixture.workspaceCopy,
      'docs',
      'usage-guide.md',
    );
    const typescriptUsageGuidePath = path.join(
      fixture.workspaceCopy,
      'docs',
      'typescript-volcengine-signaling-usage.md',
    );
    const flutterUsageGuidePath = path.join(
      fixture.workspaceCopy,
      'docs',
      'flutter-volcengine-signaling-usage.md',
    );
    const verificationMatrixPath = path.join(
      fixture.workspaceCopy,
      'docs',
      'verification-matrix.md',
    );
    const providersReadmePath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'providers',
      'README.md',
    );
    const javaReadmePath = path.join(fixture.workspaceCopy, 'sdkwork-rtc-sdk-java', 'README.md');
    const javaProviderPackageScaffoldPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'provider-package-scaffold.md',
    );
    const javaAgoraProviderManifestPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'rtc-sdk-provider-agora',
      'pom.xml',
    );
    const javaAgoraProviderReadmePath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'rtc-sdk-provider-agora',
      'README.md',
    );
    const javaAgoraProviderSourcePath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'rtc-sdk-provider-agora',
      'src',
      'main',
      'java',
      'com',
      'sdkwork',
      'rtc',
      'provider',
      'agora',
      'RtcProviderAgoraPackageContract.java',
    );
    const agoraManifestPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'providers',
      'rtc-sdk-provider-agora',
      'package.json',
    );
    const agoraEntrypointPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'providers',
      'rtc-sdk-provider-agora',
      'index.js',
    );
    const catalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'src',
      'capability-catalog.ts',
    );
    const providerCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'src',
      'provider-catalog.ts',
    );
    const providerActivationCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'src',
      'provider-activation-catalog.ts',
    );
    const typescriptManifestPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'package.json',
    );
    const flutterManifestPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-flutter',
      'pubspec.yaml',
    );
    const pythonProviderCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-python',
      'sdkwork_rtc_sdk',
      'provider_catalog.py',
    );
    const pythonProviderPackageCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-python',
      'sdkwork_rtc_sdk',
      'provider_package_catalog.py',
    );
    const pythonProviderActivationCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-python',
      'sdkwork_rtc_sdk',
      'provider_activation_catalog.py',
    );
    const rustDriverManagerPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-rust',
      'src',
      'driver_manager.rs',
    );
    const legacyCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'src',
      'providers',
      'catalog.ts',
    );

    writeFileSync(rootReadmePath, '# drifted root readme\n');
    writeFileSync(docsReadmePath, '# drifted docs readme\n');
    writeFileSync(packageStandardsPath, '# drifted package standards\n');
    writeFileSync(providerAdapterStandardPath, '# drifted provider adapter standard\n');
    writeFileSync(matrixPath, '# drifted matrix\n');
    writeFileSync(usageGuidePath, '# drifted usage guide\n');
    writeFileSync(typescriptUsageGuidePath, '# drifted typescript runtime usage guide\n');
    writeFileSync(flutterUsageGuidePath, '# drifted flutter runtime usage guide\n');
    writeFileSync(verificationMatrixPath, '# drifted verification matrix\n');
    writeFileSync(providersReadmePath, '# drifted providers readme\n');
    writeFileSync(javaReadmePath, '# drifted\n');
    writeFileSync(javaProviderPackageScaffoldPath, '# drifted provider package scaffold\n');
    writeFileSync(javaAgoraProviderManifestPath, '<project></project>\n');
    writeFileSync(javaAgoraProviderReadmePath, '# drifted provider package readme\n');
    writeFileSync(javaAgoraProviderSourcePath, 'public final class BrokenJavaProviderSource {}\n');
    writeFileSync(
      agoraManifestPath,
      `${JSON.stringify(
        {
          name: '@sdkwork/rtc-sdk-provider-agora',
          sdkworkRtcProvider: {
            providerKey: 'agora',
            builtin: false,
            tier: 'tier-b',
            registrationContract: 'BrokenContract',
          },
        },
        null,
        2,
      )}\n`,
    );
    writeFileSync(agoraEntrypointPath, 'export const BROKEN_ENTRYPOINT = true;\n');
    writeFileSync(catalogPath, 'export const RTC_CAPABILITY_CATALOG = [];\n');
    writeFileSync(providerCatalogPath, 'export const OFFICIAL_RTC_PROVIDER_CATALOG = [];\n');
    writeFileSync(providerActivationCatalogPath, 'export const RTC_PROVIDER_ACTIVATION_CATALOG = [];\n');
    writeFileSync(
      typescriptManifestPath,
      `${JSON.stringify(
        {
          name: '@sdkwork/rtc-sdk',
          peerDependencies: {},
          peerDependenciesMeta: {},
        },
        null,
        2,
      )}\n`,
    );
    writeFileSync(flutterManifestPath, 'name: broken_flutter_sdk\n');
    writeFileSync(pythonProviderCatalogPath, 'BROKEN_PROVIDER_CATALOG = []\n');
    writeFileSync(pythonProviderPackageCatalogPath, 'BROKEN_PROVIDER_PACKAGE_CATALOG = []\n');
    writeFileSync(pythonProviderActivationCatalogPath, 'BROKEN_PROVIDER_ACTIVATION_CATALOG = []\n');
    writeFileSync(rustDriverManagerPath, 'pub struct BrokenDriverManager;\n');
    mkdirSync(path.dirname(legacyCatalogPath), { recursive: true });
    writeFileSync(legacyCatalogPath, 'export const LEGACY_PROVIDER_CATALOG = true;\n');

    const materializerModule = await import(
      pathToFileURL(path.join(workspaceRoot, 'bin', 'materialize-sdk.mjs')).href
    );

    const firstRun = materializerModule.materializeRtcSdkWorkspace(fixture.workspaceCopy);
    assert.ok(firstRun.changedFiles.length >= 7);
    for (const relativePath of RTC_TEMPLATE_MATERIALIZED_FILES) {
      assert.ok(firstRun.changedFiles.includes(relativePath));
    }
    assert.ok(firstRun.changedFiles.includes('docs/multilanguage-capability-matrix.md'));
    assert.ok(firstRun.changedFiles.includes('docs/usage-guide.md'));
    assert.ok(firstRun.changedFiles.includes('docs/typescript-volcengine-signaling-usage.md'));
    assert.ok(firstRun.changedFiles.includes('docs/flutter-volcengine-signaling-usage.md'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-java/providers/provider-package-scaffold.md'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-java/providers/rtc-sdk-provider-agora/pom.xml'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-java/providers/rtc-sdk-provider-agora/README.md'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-java/providers/rtc-sdk-provider-agora/src/main/java/com/sdkwork/rtc/provider/agora/RtcProviderAgoraPackageContract.java'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-typescript/src/capability-catalog.ts'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-typescript/src/provider-catalog.ts'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-typescript/src/providers/catalog.ts'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-typescript/package.json'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-flutter/pubspec.yaml'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-python/sdkwork_rtc_sdk/provider_catalog.py'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-python/sdkwork_rtc_sdk/provider_package_catalog.py'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-python/sdkwork_rtc_sdk/provider_activation_catalog.py'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-rust/src/driver_manager.rs'));

    const repairedRootReadme = readFileSync(rootReadmePath, 'utf8');
    assert.match(repairedRootReadme, /# SDKWork RTC SDK Workspace/);
    assert.match(repairedRootReadme, /DEFAULT_RTC_PROVIDER_KEY/);
    assert.match(repairedRootReadme, /providerActivationContract/);
    assert.match(repairedRootReadme, /providerPackageBoundaryContract/);
    assert.match(repairedRootReadme, /providerPackageBoundary/);
    assert.match(repairedRootReadme, /node \.\\bin\\materialize-sdk\.mjs/);

    const repairedDocsReadme = readFileSync(docsReadmePath, 'utf8');
    assert.match(repairedDocsReadme, /multilanguage-capability-matrix\.md/);
    assert.match(repairedDocsReadme, /materialized from `\.sdkwork-assembly\.json`/);
    assert.match(repairedDocsReadme, /metadata-only source stub/i);

    const repairedUsageGuide = readFileSync(usageGuidePath, 'utf8');
    assert.match(repairedUsageGuide, /# SDKWork RTC SDK Usage Guide/);
    assert.match(repairedUsageGuide, /TypeScript is the executable web\/browser baseline/i);
    assert.match(repairedUsageGuide, /Flutter is the executable mobile baseline/i);
    assert.match(repairedUsageGuide, /@volcengine\/rtc/);
    assert.match(repairedUsageGuide, /package:volc_engine_rtc\/volc_engine_rtc\.dart/);
    assert.match(repairedUsageGuide, /package:rtc_sdk\/rtc_sdk\.dart/);
    assert.match(repairedUsageGuide, /createStandardRtcCallControllerStack/);
    assert.match(repairedUsageGuide, /runtime-backed/);
    assert.match(repairedUsageGuide, /analysis-backed/);

    const repairedTypeScriptUsageGuide = readFileSync(typescriptUsageGuidePath, 'utf8');
    assert.match(repairedTypeScriptUsageGuide, /# SDKWork RTC SDK TypeScript Usage/);
    assert.match(repairedTypeScriptUsageGuide, /@volcengine\/rtc/);
    assert.match(repairedTypeScriptUsageGuide, /@sdkwork\/rtc-sdk/);
    assert.match(repairedTypeScriptUsageGuide, /createStandardRtcCallControllerStack/);
    assert.match(repairedTypeScriptUsageGuide, /node \.\/bin\/sdk-call-smoke\.mjs --json/);
    assert.match(repairedTypeScriptUsageGuide, /runtime-backed/);

    const repairedFlutterUsageGuide = readFileSync(flutterUsageGuidePath, 'utf8');
    assert.match(repairedFlutterUsageGuide, /# SDKWork RTC SDK Flutter Usage/);
    assert.match(repairedFlutterUsageGuide, /package:volc_engine_rtc\/volc_engine_rtc\.dart/);
    assert.match(repairedFlutterUsageGuide, /package:rtc_sdk\/rtc_sdk\.dart/);
    assert.match(repairedFlutterUsageGuide, /createStandardRtcCallControllerStack/);
    assert.match(repairedFlutterUsageGuide, /node \.\/bin\/sdk-call-smoke\.mjs --json/);
    assert.match(repairedFlutterUsageGuide, /analysis-backed/);

    const repairedPackageStandards = readFileSync(packageStandardsPath, 'utf8');
    assert.match(repairedPackageStandards, /# RTC SDK Package Standards/);
    assert.match(repairedPackageStandards, /TypeScript Standard/);
    assert.match(repairedPackageStandards, /Cross-Language Standard/);
    assert.match(repairedPackageStandards, /providerActivationContract/);
    assert.match(repairedPackageStandards, /providerPackageBoundaryContract/);
    assert.match(repairedPackageStandards, /providerPackageBoundary/);

    const repairedProviderAdapterStandard = readFileSync(providerAdapterStandardPath, 'utf8');
    assert.match(repairedProviderAdapterStandard, /# RTC Provider Adapter Standard/);
    assert.match(repairedProviderAdapterStandard, /JDBC-Style Rule/);
    assert.match(repairedProviderAdapterStandard, /registerRtcProviderModules/);
    assert.match(repairedProviderAdapterStandard, /providerActivationContract/);
    assert.match(repairedProviderAdapterStandard, /providerPackageBoundaryContract/);
    assert.match(repairedProviderAdapterStandard, /providerPackageBoundary/);

    const repairedProvidersReadme = readFileSync(providersReadmePath, 'utf8');
    assert.match(repairedProvidersReadme, /# RTC TypeScript Provider Packages/);
    assert.match(repairedProvidersReadme, /RtcProviderModule/);
    assert.match(repairedProvidersReadme, /provider-package-catalog\.ts/);
    assert.match(repairedProvidersReadme, /reference-baseline/);

    const repairedMatrix = readFileSync(matrixPath, 'utf8');
    assert.match(repairedMatrix, /\| Capability key \| Category \| Surface \|/);
    assert.match(repairedMatrix, /\| `session` \| `required-baseline` \| `cross-surface` \|/);
    assert.match(repairedMatrix, /\| `recording` \| `optional-advanced` \| `control-plane` \|/);
    assert.match(repairedMatrix, /\| Language \| Public package \| Control SDK \| Runtime bridge \| Maturity tier \| Current role \|/);
    assert.match(repairedMatrix, /\| `volcengine` \| `tier-a` \|/);
    assert.match(repairedMatrix, /\| Provider key \| Runtime bridge status \| Vendor SDK requirement \| SDK provisioning \| Binding strategy \| Bundle policy \|/);
    assert.match(repairedMatrix, /\| `volcengine` \| `reference-baseline` \| `required` \| `consumer-supplied` \| `native-factory` \| `must-not-bundle` \|/);
    assert.match(repairedMatrix, /\| TypeScript \| `@sdkwork\/rtc-sdk` \| Yes \| Yes \| `reference` \|/);
    assert.match(repairedMatrix, /\| Language \| Provider key \| Activation status \| Runtime bridge \| Root public \| Package boundary \|/);
    assert.match(repairedMatrix, /\| TypeScript \| `volcengine` \| `root-public-builtin` \| Yes \| Yes \| Yes \|/);
    assert.match(repairedMatrix, /\| Java \| `agora` \| `control-metadata-only` \| No \| No \| No \|/);
    assert.match(repairedMatrix, /Reserved Language Metadata Scaffold Matrix/);
    assert.match(repairedMatrix, /Provider activation catalog/);
    assert.match(repairedMatrix, /Provider extension catalog/);
    assert.match(repairedMatrix, /RtcProviderActivationCatalog\.java/);
    assert.match(repairedMatrix, /RtcProviderExtensionCatalog\.java/);
    assert.match(repairedMatrix, /Reserved Language Resolution Scaffold Matrix/);
    assert.match(repairedMatrix, /Reserved Language Provider Package Scaffold Matrix/);
    assert.match(repairedMatrix, /Directory pattern/);
    assert.match(repairedMatrix, /Package pattern/);
    assert.match(repairedMatrix, /Source file pattern/);
    assert.match(repairedMatrix, /Source symbol pattern/);
    assert.match(repairedMatrix, /Template tokens/);
    assert.match(repairedMatrix, /Source template tokens/);
    assert.match(repairedMatrix, /Runtime bridge status/);
    assert.match(repairedMatrix, /Default provider package identity/);
    assert.match(repairedMatrix, /Default provider source path/);
    assert.match(repairedMatrix, /Default provider source symbol/);
    assert.match(repairedMatrix, /future-runtime-bridge-only/);
    assert.match(repairedMatrix, /`false`/);
    assert.match(repairedMatrix, /Driver manager/);
    assert.match(repairedMatrix, /Data source/);
    assert.match(repairedMatrix, /Provider support/);
    assert.match(
      repairedMatrix,
      /TypeScript and Flutter are the executable reference baselines in the current landing\./,
    );
    assert.match(
      repairedMatrix,
      /A provider package boundary may stay reserved even when the root workspace already has a verified runtime bridge\./,
    );
    assert.doesNotMatch(
      repairedMatrix,
      /TypeScript is the only executable reference baseline in the first landing\./,
    );

    const repairedVerificationMatrix = readFileSync(verificationMatrixPath, 'utf8');
    assert.match(repairedVerificationMatrix, /# RTC SDK Verification Matrix/);
    assert.match(repairedVerificationMatrix, /Root Materialization Entry Point/);
    assert.match(repairedVerificationMatrix, /node \.\\bin\\materialize-sdk\.mjs/);
    assert.match(repairedVerificationMatrix, /providerActivationContract/);
    assert.match(repairedVerificationMatrix, /providerPackageBoundaryContract/);
    assert.match(repairedVerificationMatrix, /providerPackageBoundary/);
    assert.match(repairedVerificationMatrix, /typescript-volcengine-signaling-usage\.md/);
    assert.match(repairedVerificationMatrix, /flutter-volcengine-signaling-usage\.md/);
    assert.match(repairedVerificationMatrix, /vendorSdkPackage/);
    assert.match(repairedVerificationMatrix, /vendorSdkImportPath/);
    assert.match(repairedVerificationMatrix, /signalingSdkPackage/);
    assert.match(repairedVerificationMatrix, /signalingSdkImportPath/);
    assert.match(repairedVerificationMatrix, /recommendedEntrypoint/);
    assert.match(repairedVerificationMatrix, /smokeCommand/);
    assert.match(repairedVerificationMatrix, /smokeMode/);
    assert.match(repairedVerificationMatrix, /smokeVariants/);
    assert.match(repairedVerificationMatrix, /runtime-backed/);
    assert.match(repairedVerificationMatrix, /analysis-backed/);

    const repairedJavaReadme = readFileSync(javaReadmePath, 'utf8');
    assert.match(repairedJavaReadme, /# SDKWork RTC SDK Java Workspace/);
    assert.match(repairedJavaReadme, /Language:\s*`java`/);
    assert.match(repairedJavaReadme, /com\.sdkwork:rtc-sdk/);
    assert.match(repairedJavaReadme, /maturity tier:\s*reserved/);
    assert.match(repairedJavaReadme, /Current role:[\s\S]*Reserved workspace skeleton/);
    assert.match(repairedJavaReadme, /reserved Java standard boundary/);
    assert.match(repairedJavaReadme, /RtcProviderExtensionCatalog\.java/);
    assert.match(repairedJavaReadme, /Resolution scaffold:/);
    assert.match(repairedJavaReadme, /Provider package scaffold:/);
    assert.match(repairedJavaReadme, /providers\/provider-package-scaffold\.md/);
    assert.match(repairedJavaReadme, /com\.sdkwork:rtc-sdk-provider-\{providerKey\}/);
    assert.match(repairedJavaReadme, /source file pattern:\s*`src\/main\/java\/com\/sdkwork\/rtc\/provider\/\{providerKey\}\/RtcProvider\{providerPascal\}PackageContract\.java`/i);
    assert.match(repairedJavaReadme, /source symbol pattern:\s*`RtcProvider\{providerPascal\}PackageContract`/i);
    assert.match(repairedJavaReadme, /template tokens:\s*`\{providerKey\}`/i);
    assert.match(repairedJavaReadme, /source template tokens:\s*`\{providerKey\}`,\s*`\{providerPascal\}`/i);
    assert.match(repairedJavaReadme, /status:\s*`future-runtime-bridge-only`/i);
    assert.match(repairedJavaReadme, /runtime bridge status:\s*`reserved`/i);
    assert.match(repairedJavaReadme, /root public exposure:\s*`false`/i);
    assert.match(repairedJavaReadme, /RtcDriverManager\.java/);
    assert.match(repairedJavaReadme, /RtcDataSource\.java/);
    assert.match(repairedJavaReadme, /RtcProviderSupport\.java/);
    assert.match(repairedJavaReadme, /\.\.\/docs\/provider-adapter-standard\.md/);

    const repairedAgoraManifest = readJson(agoraManifestPath);
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.registrationContract, 'RtcProviderModule');
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.sourceModule, '../../src/providers/agora.ts');
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.driverFactory, 'createAgoraRtcDriver');
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.moduleSymbol, 'AGORA_RTC_PROVIDER_MODULE');
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.rootPublic, true);
    assert.equal(repairedAgoraManifest.exports['.'].import, './index.js');
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.typescriptAdapter.runtimeBridgeStatus, 'reference-baseline');
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.typescriptAdapter.officialVendorSdkRequirement, 'required');

    const repairedAgoraEntrypoint = readFileSync(agoraEntrypointPath, 'utf8');
    assert.match(repairedAgoraEntrypoint, /createAgoraRtcDriver/);
    assert.match(repairedAgoraEntrypoint, /AGORA_RTC_PROVIDER_MODULE/);

    const repairedCapabilityCatalog = readFileSync(catalogPath, 'utf8');
    assert.match(repairedCapabilityCatalog, /RTC_CAPABILITY_CATALOG/);
    assert.match(repairedCapabilityCatalog, /SESSION_RTC_CAPABILITY_DESCRIPTOR/);
    assert.match(repairedCapabilityCatalog, /surface:\s*'cross-surface'/);
    assert.match(repairedCapabilityCatalog, /getRtcCapabilityDescriptor/);

    const repairedProviderCatalog = readFileSync(providerCatalogPath, 'utf8');
    assert.match(repairedProviderCatalog, /OFFICIAL_RTC_PROVIDER_CATALOG/);
    assert.match(repairedProviderCatalog, /VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY/);
    assert.match(repairedProviderCatalog, /defaultSelected:\s*true/);
    assert.match(repairedProviderCatalog, /requiredCapabilities/);
    assert.match(repairedProviderCatalog, /optionalCapabilities/);

    const repairedProviderActivationCatalog = readFileSync(providerActivationCatalogPath, 'utf8');
    assert.match(repairedProviderActivationCatalog, /RTC_PROVIDER_ACTIVATION_CATALOG/);
    assert.match(repairedProviderActivationCatalog, /VOLCENGINE_RTC_PROVIDER_ACTIVATION_ENTRY/);
    assert.match(repairedProviderActivationCatalog, /root-public-builtin/);
    assert.match(repairedProviderActivationCatalog, /package-boundary/);

    const repairedTypeScriptManifest = readJson(typescriptManifestPath);
    assert.equal(repairedTypeScriptManifest.name, '@sdkwork/rtc-sdk');
    assert.equal(repairedTypeScriptManifest.peerDependencies['@sdkwork/rtc-sdk'], undefined);
    assert.equal(repairedTypeScriptManifest.peerDependencies['@volcengine/rtc'], '^4.68.3');
    assert.equal(repairedTypeScriptManifest.peerDependenciesMeta['@sdkwork/rtc-sdk'], undefined);
    assert.equal(repairedTypeScriptManifest.peerDependenciesMeta['@volcengine/rtc']?.optional, true);

    const repairedJavaProviderPackageScaffold = readFileSync(javaProviderPackageScaffoldPath, 'utf8');
    assert.match(repairedJavaProviderPackageScaffold, /one provider per package boundary/i);
    assert.match(repairedJavaProviderPackageScaffold, /com\.sdkwork:rtc-sdk-provider-\{providerKey\}/);
    assert.match(repairedJavaProviderPackageScaffold, /providers\/rtc-sdk-provider-\{providerKey\}/);
    assert.match(repairedJavaProviderPackageScaffold, /source file pattern:\s*`src\/main\/java\/com\/sdkwork\/rtc\/provider\/\{providerKey\}\/RtcProvider\{providerPascal\}PackageContract\.java`/i);
    assert.match(repairedJavaProviderPackageScaffold, /source symbol pattern:\s*`RtcProvider\{providerPascal\}PackageContract`/i);
    assert.match(repairedJavaProviderPackageScaffold, /template tokens:\s*`\{providerKey\}`/i);
    assert.match(repairedJavaProviderPackageScaffold, /source template tokens:\s*`\{providerKey\}`,\s*`\{providerPascal\}`/i);
    assert.match(repairedJavaProviderPackageScaffold, /status:\s*`future-runtime-bridge-only`/i);
    assert.match(repairedJavaProviderPackageScaffold, /runtime bridge status:\s*`reserved`/i);
    assert.match(repairedJavaProviderPackageScaffold, /root public exposure:\s*`false`/i);
    assert.match(repairedJavaProviderPackageScaffold, /pluginId/);
    assert.match(repairedJavaProviderPackageScaffold, /driverId/);
    assert.match(repairedJavaProviderPackageScaffold, /providers\/rtc-sdk-provider-volcengine\/pom\.xml/);
    assert.match(repairedJavaProviderPackageScaffold, /`Volcengine`/);

    const repairedJavaAgoraProviderManifest = readFileSync(javaAgoraProviderManifestPath, 'utf8');
    assert.match(repairedJavaAgoraProviderManifest, /rtc-agora/);
    assert.match(repairedJavaAgoraProviderManifest, /sdkwork-rtc-driver-agora/);
    assert.match(repairedJavaAgoraProviderManifest, /com\.sdkwork:rtc-sdk-provider-agora/);
    assert.match(repairedJavaAgoraProviderManifest, /src\/main\/java\/com\/sdkwork\/rtc\/provider\/agora\/RtcProviderAgoraPackageContract\.java/);
    assert.match(repairedJavaAgoraProviderManifest, /RtcProviderAgoraPackageContract/);
    assert.match(repairedJavaAgoraProviderManifest, /future-runtime-bridge-only/);
    assert.match(repairedJavaAgoraProviderManifest, /reserved/);

    const repairedJavaAgoraProviderReadme = readFileSync(javaAgoraProviderReadmePath, 'utf8');
    assert.match(repairedJavaAgoraProviderReadme, /Java Agora RTC Provider Package/);
    assert.match(repairedJavaAgoraProviderReadme, /rtc-agora/);
    assert.match(repairedJavaAgoraProviderReadme, /sdkwork-rtc-driver-agora/);
    assert.match(repairedJavaAgoraProviderReadme, /com\.sdkwork:rtc-sdk-provider-agora/);
    assert.match(repairedJavaAgoraProviderReadme, /providers\/rtc-sdk-provider-agora\/pom\.xml/);
    assert.match(repairedJavaAgoraProviderReadme, /RtcProviderAgoraPackageContract/);
    assert.match(repairedJavaAgoraProviderReadme, /future-runtime-bridge-only/);
    assert.match(repairedJavaAgoraProviderReadme, /reserved/);

    const repairedJavaAgoraProviderSource = readFileSync(javaAgoraProviderSourcePath, 'utf8');
    assert.match(repairedJavaAgoraProviderSource, /package com\.sdkwork\.rtc\.provider\.agora;/);
    assert.match(repairedJavaAgoraProviderSource, /RtcProviderAgoraPackageContract/);
    assert.match(repairedJavaAgoraProviderSource, /rtc-agora/);
    assert.match(repairedJavaAgoraProviderSource, /sdkwork-rtc-driver-agora/);
    assert.match(repairedJavaAgoraProviderSource, /com\.sdkwork:rtc-sdk-provider-agora/);
    assert.match(repairedJavaAgoraProviderSource, /future-runtime-bridge-only/);
    assert.match(repairedJavaAgoraProviderSource, /reserved/);

    const repairedFlutterManifest = readFileSync(flutterManifestPath, 'utf8');
    assert.match(repairedFlutterManifest, /^name:\s+rtc_sdk/m);
    assert.match(repairedFlutterManifest, /build system:\s+flutter-pub/);
    const repairedFlutterDependencies = extractYamlSectionTopLevelKeys(
      repairedFlutterManifest,
      'dependencies',
    );
    assert.equal(repairedFlutterDependencies.has('rtc_sdk'), false);
    assert.equal(repairedFlutterDependencies.has('volc_engine_rtc'), true);

    const repairedPythonProviderCatalog = readFileSync(pythonProviderCatalogPath, 'utf8');
    assert.match(repairedPythonProviderCatalog, /DEFAULT_RTC_PROVIDER_KEY = "volcengine"/);
    assert.match(repairedPythonProviderCatalog, /class RtcProviderCatalog/);
    assert.match(repairedPythonProviderCatalog, /RtcProviderCatalogEntry\("volcengine"/);

    const repairedPythonProviderPackageCatalog = readFileSync(
      pythonProviderPackageCatalogPath,
      'utf8',
    );
    assert.match(repairedPythonProviderPackageCatalog, /class RtcProviderPackageCatalog/);
    assert.match(repairedPythonProviderPackageCatalog, /RtcProviderPackageCatalogEntry/);
    assert.match(repairedPythonProviderPackageCatalog, /packageIdentity/);
    assert.match(repairedPythonProviderPackageCatalog, /manifestPath/);
    assert.match(repairedPythonProviderPackageCatalog, /sourceSymbol/);
    assert.match(repairedPythonProviderPackageCatalog, /sdkwork-rtc-driver-volcengine/);
    assert.match(
      repairedPythonProviderPackageCatalog,
      /sdkwork_rtc_sdk_provider_volcengine\/__init__\.py/,
    );
    assert.match(repairedPythonProviderPackageCatalog, /future-runtime-bridge-only/);
    assert.match(repairedPythonProviderPackageCatalog, /reserved/);

    const repairedPythonProviderActivationCatalog = readFileSync(
      pythonProviderActivationCatalogPath,
      'utf8',
    );
    assert.match(repairedPythonProviderActivationCatalog, /class RtcProviderActivationCatalog/);
    assert.match(repairedPythonProviderActivationCatalog, /RtcProviderActivationCatalogEntry/);
    assert.match(repairedPythonProviderActivationCatalog, /control-metadata-only/);
    assert.match(repairedPythonProviderActivationCatalog, /sdkwork-rtc-driver-volcengine/);

    const repairedRustDriverManager = readFileSync(rustDriverManagerPath, 'utf8');
    assert.match(repairedRustDriverManager, /pub struct RtcDriverManager/);
    assert.match(repairedRustDriverManager, /resolveSelection/);
    assert.match(repairedRustDriverManager, /describeProviderSupport/);
    assert.match(repairedRustDriverManager, /listProviderSupport/);
    assert.equal(existsSync(legacyCatalogPath), false);

    const secondRun = materializerModule.materializeRtcSdkWorkspace(fixture.workspaceCopy);
    assert.deepEqual(secondRun.changedFiles, []);
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});
