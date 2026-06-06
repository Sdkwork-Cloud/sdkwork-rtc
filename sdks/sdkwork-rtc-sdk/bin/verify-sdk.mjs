#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildRtcSdkMaterializationPlan, RTC_SDK_STALE_MATERIALIZED_FILES } from './materialize-sdk.mjs';
import { assertRtcAssemblyWorkspaceBaseline } from './rtc-standard-assembly-baseline.mjs';
import { readJsonFile, resolveRtcSdkWorkspaceRoot } from './rtc-standard-file-helpers.mjs';
import {
  buildLanguageProviderActivationCatalogEntries,
  buildProviderPackageManifestPath,
  buildProviderPackageReadmePath,
  buildProviderPackageSourcePath,
  buildProviderPackageSourceRelativePath,
  buildProviderPackageSourceSymbol,
  buildReservedProviderPackageCatalogEntries,
  extractTemplateTokens,
  getCanonicalTypeScriptProviderPackageContract,
  materializeProviderPackagePattern,
  normalizeStringArray,
  toPascalCase,
  toUpperSnakeCase,
} from './rtc-standard-shared-helpers.mjs';
import {
  OPTIONAL_RTC_CAPABILITIES,
  REQUIRED_RTC_CAPABILITIES,
  RTC_CAPABILITY_CATEGORIES,
  RTC_CAPABILITY_NEGOTIATION_RULES,
  RTC_CAPABILITY_NEGOTIATION_STATUSES,
  DEFAULT_SIGNALING_TRANSPORT_STANDARD,
  DEFAULT_LOOKUP_HELPER_NAMING_STANDARD,
  RTC_CAPABILITY_SURFACES,
  DEFAULT_ROOT_PUBLIC_SURFACE_STANDARD,
  RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM,
  RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM,
  RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM,
  RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM,
  RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM,
  RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM,
  RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS,
  RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES,
  RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS,
  RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES,
  RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS,
  RTC_RUNTIME_SURFACE_FAILURE_CODE,
  RTC_RUNTIME_SURFACE_METHODS,
  RTC_SDK_ERROR_CODES,
  RTC_SDK_ERROR_FALLBACK_CODE,
  DEFAULT_TYPESCRIPT_ADAPTER_CONTRACT,
  DEFAULT_TYPESCRIPT_PACKAGE_STANDARD,
  RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS,
  RTC_LANGUAGE_MATURITY_TIERS,
  RTC_LANGUAGE_MATURITY_TIER_SUMMARIES,
  RTC_PROVIDER_ACTIVATION_STATUSES,
  RTC_PROVIDER_EXTENSION_ACCESSES,
  RTC_PROVIDER_EXTENSION_STATUSES,
  RTC_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS,
  RTC_PROVIDER_PACKAGE_BOUNDARY_MODES,
  RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES,
  RTC_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES,
  RTC_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS,
  RTC_PROVIDER_SELECTION_SOURCES,
  RTC_PROVIDER_SUPPORT_STATUSES,
  RTC_PROVIDER_TIERS,
  RTC_PROVIDER_TIER_SUMMARIES,
  TYPESCRIPT_ADAPTER_BINDING_STRATEGIES,
  TYPESCRIPT_ADAPTER_BUNDLE_POLICIES,
  TYPESCRIPT_ADAPTER_OFFICIAL_VENDOR_SDK_REQUIREMENTS,
  TYPESCRIPT_ADAPTER_RUNTIME_BRIDGE_STATUSES,
  TYPESCRIPT_ADAPTER_SDK_PROVISIONING_VALUES,
} from './rtc-standard-contract-constants.mjs';
import {
  KNOWN_LANGUAGE_WORKSPACE_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS,
  KNOWN_LANGUAGE_WORKSPACE_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS,
  KNOWN_PROVIDER_PACKAGE_TEMPLATE_TOKENS,
  KNOWN_RESERVED_PROVIDER_PACKAGE_RUNTIME_BRIDGE_STATUSES,
  KNOWN_RESERVED_PROVIDER_PACKAGE_SCAFFOLD_STATUSES,
  LEGACY_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_TERMS,
  REQUIRED_RESERVED_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS,
  REQUIRED_RESERVED_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
  REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS,
  REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
} from './verify-sdk-standard-constants.mjs';
import {
  escapeRegExp,
  getGoPublicStructFieldContracts,
  getReservedLanguageLookupHelperPatterns,
  getReservedLanguageRootPublicContract,
  matchesReservedLanguageToken,
} from './verify-sdk-language-helpers.mjs';
import {
  RTC_FLUTTER_REQUIRED_STANDARD_FILES,
  RTC_ROOT_REQUIRED_CONTRACT_FILES,
  RTC_TYPESCRIPT_PROVIDER_PACKAGE_ROOT_README,
  RTC_TYPESCRIPT_REQUIRED_STANDARD_FILES,
} from './rtc-standard-workspace-file-contracts.mjs';
import { verifyFlutterRtcSignalingBoundary } from './verify-flutter-rtc-signaling-boundary.mjs';
import { verifyFlutterTypeScriptParity } from './verify-flutter-typescript-parity.mjs';

function fail(message) {
  throw new Error(message);
}

const KNOWN_LANGUAGE_WORKSPACE_PROVIDER_PACKAGE_BOUNDARY_MODES =
  RTC_PROVIDER_PACKAGE_BOUNDARY_MODES;
const KNOWN_LANGUAGE_WORKSPACE_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES =
  RTC_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES;
const REQUIRED_RESERVED_LANGUAGE_CONTRACT_TOKENS = [
  'RtcProviderDriver',
  'RtcDriverManager',
  'RtcDataSource',
  'RtcClient',
  'RtcRuntimeController',
];
const REQUIRED_GITIGNORE_PATTERNS = [
  '/.tmp/',
  '/.sdkwork/tmp/',
  '**/node_modules/',
  '**/.npm-cache/',
  '**/.dart_tool/',
  '**/*.tgz',
  '/sdkwork-rtc-sdk-typescript/dist/',
  '/sdkwork-rtc-sdk-rust/target/',
  '/sdkwork-rtc-sdk-java/target/',
  '/sdkwork-rtc-sdk-csharp/src/**/bin/',
  '/sdkwork-rtc-sdk-csharp/src/**/obj/',
  '/sdkwork-rtc-sdk-flutter/build/',
  '/sdkwork-rtc-sdk-kotlin/build/',
  '/sdkwork-rtc-sdk-swift/.build/',
  '/sdkwork-rtc-sdk-python/**/__pycache__/',
  '/sdkwork-rtc-sdk-python/**/*.pyc',
];
const FORBIDDEN_GITIGNORE_PATTERNS = ['/.sdkwork-assembly.json'];
const REQUIRED_DOCUMENTATION_CLAUSES = [
  {
    relativePath: 'README.md',
    clauses: [
      { pattern: /DEFAULT_RTC_PROVIDER_KEY/, label: 'default provider key constant' },
      { pattern: /DEFAULT_RTC_PROVIDER_PLUGIN_ID/, label: 'default provider plugin constant' },
      { pattern: /DEFAULT_RTC_PROVIDER_DRIVER_ID/, label: 'default provider driver constant' },
      { pattern: /provider-support\.ts/, label: 'TypeScript provider support module path' },
      { pattern: /getBuiltinRtcProviderMetadataByKey/, label: 'builtin provider lookup helper' },
      { pattern: /getOfficialRtcProviderMetadataByKey/, label: 'official provider lookup helper' },
      { pattern: /getRtcProviderByProviderKey/, label: 'provider catalog lookup helper alias' },
      { pattern: /getRtcCapabilityCatalog/, label: 'capability catalog lookup helper' },
      { pattern: /getRtcCapabilityDescriptor/, label: 'capability descriptor lookup helper' },
      { pattern: /getRtcProviderPackageByProviderKey/, label: 'provider package lookup helper' },
      { pattern: /getRtcProviderPackageByPackageIdentity/, label: 'provider package identity lookup helper' },
      { pattern: /getRtcProviderActivationByProviderKey/, label: 'provider activation lookup helper' },
      { pattern: /getRtcProviderExtensionCatalog/, label: 'provider extension catalog lookup helper' },
      { pattern: /getRtcProviderExtensionDescriptor/, label: 'provider extension descriptor lookup helper' },
      {
        pattern: /getRtcProviderExtensionsForProvider/,
        label: 'provider extension by provider lookup helper',
      },
      { pattern: /hasRtcProviderExtension/, label: 'provider extension membership helper' },
      { pattern: /getRtcLanguageWorkspaceByLanguage/, label: 'language workspace lookup helper' },
      { pattern: /capability-negotiation\.ts/, label: 'TypeScript capability negotiation module path' },
      { pattern: /resolveRtcCapabilityNegotiationStatus/, label: 'capability negotiation status helper' },
      { pattern: /RTC_CAPABILITY_NEGOTIATION_STATUSES/, label: 'capability negotiation status catalog' },
      { pattern: /RTC_CAPABILITY_NEGOTIATION_RULES/, label: 'capability negotiation rule catalog' },
      { pattern: /resolveRtcProviderSupportStatus/, label: 'provider support status helper' },
      { pattern: /createRtcProviderSupportState/, label: 'provider support state helper' },
      { pattern: /provider package loader/i, label: 'provider package loader documentation' },
      { pattern: /provider-package-loader\.ts/, label: 'TypeScript provider package loader module path' },
      { pattern: /createRtcProviderPackageLoader/, label: 'provider package loader factory' },
      { pattern: /resolveRtcProviderPackageLoadTarget/, label: 'provider package load target resolver' },
      { pattern: /loadRtcProviderModule/, label: 'provider package module loader' },
      { pattern: /installRtcProviderPackage/, label: 'single provider package installer' },
      { pattern: /installRtcProviderPackages/, label: 'batch provider package installer' },
      { pattern: /reference-baseline/, label: 'TypeScript runtime bridge baseline contract' },
      { pattern: /capability negotiation/i, label: 'capability negotiation contract' },
      { pattern: /degraded/i, label: 'capability degradation contract' },
      { pattern: /unsupported/i, label: 'capability unsupported contract' },
      { pattern: /runtimeSurfaceStandard/, label: 'assembly-driven runtimeSurfaceStandard' },
      { pattern: /runtimeImmutabilityStandard/, label: 'assembly-driven runtimeImmutabilityStandard' },
      { pattern: /rootPublicSurfaceStandard/, label: 'assembly-driven rootPublicSurfaceStandard' },
      { pattern: /lookupHelperNamingStandard/, label: 'assembly-driven lookupHelperNamingStandard' },
      { pattern: /RTC_RUNTIME_SURFACE_METHODS/, label: 'rtc runtime surface method catalog contract' },
      {
        pattern: /RTC_RUNTIME_SURFACE_FAILURE_CODE/,
        label: 'rtc runtime surface failure code contract',
      },
      { pattern: /RTC_RUNTIME_IMMUTABILITY_STANDARD/, label: 'rtc runtime immutability standard contract' },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM/,
        label: 'rtc runtime immutability frozen-term contract',
      },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM/,
        label: 'rtc runtime immutability snapshot-term contract',
      },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM/,
        label: 'rtc runtime immutability controller-context contract',
      },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM/,
        label: 'rtc runtime immutability native-client contract',
      },
      { pattern: /root-public-surface\.ts/, label: 'rtc root public surface module contract' },
      { pattern: /RTC_ROOT_PUBLIC_SURFACE_STANDARD/, label: 'rtc root public surface standard contract' },
      { pattern: /lookup-helper-naming\.ts/, label: 'rtc lookup helper naming module contract' },
      { pattern: /RTC_LOOKUP_HELPER_NAMING_STANDARD/, label: 'rtc lookup helper naming standard contract' },
      { pattern: /lower-camel-rtc/, label: 'rtc lower-camel lookup helper naming profile contract' },
      { pattern: /upper-camel-rtc/, label: 'rtc upper-camel lookup helper naming profile contract' },
      { pattern: /snake-case-rtc/, label: 'rtc snake-case lookup helper naming profile contract' },
      {
        pattern: /RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS/,
        label: 'rtc root public surface provider-neutral export path contract',
      },
      {
        pattern: /RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS/,
        label: 'rtc root public surface reserved entrypoint contract',
      },
      {
        pattern: /root-public-builtin-only/,
        label: 'rtc root public builtin-only exposure term contract',
      },
      {
        pattern: /package-boundary-only/,
        label: 'rtc root public package-boundary-only exposure term contract',
      },
      { pattern: /errorCodeStandard/, label: 'assembly-driven errorCodeStandard' },
      { pattern: /RTC_SDK_ERROR_CODES/, label: 'rtc sdk error catalog contract' },
      { pattern: /RTC_SDK_ERROR_FALLBACK_CODE/, label: 'rtc sdk error fallback contract' },
      { pattern: /vendor_error/, label: 'rtc sdk canonical fallback error contract' },
      { pattern: /sdk-call-smoke\.mjs/, label: 'fast public call smoke entrypoint' },
      { pattern: /smoke-sdk\.mjs/, label: 'full regression smoke entrypoint' },
      { pattern: /--reuse-live-connection/, label: 'shared live connection smoke variant contract' },
      { pattern: /shared-`liveConnection` call-smoke variants/i, label: 'shared live connection regression contract' },
      { pattern: /full regression/i, label: 'full regression contract' },
      { pattern: /\.gitignore/, label: 'workspace gitignore contract' },
      { pattern: /non-source artifacts/i, label: 'workspace non-source artifact contract' },
      { pattern: /\.sdkwork-assembly\.json.*source/i, label: 'assembly snapshot source-of-truth contract' },
      { pattern: /language workspace catalog/i, label: 'language workspace catalog contract' },
      { pattern: /providerSelectionContract/, label: 'language workspace providerSelectionContract' },
      { pattern: /providerSupportContract/, label: 'language workspace providerSupportContract' },
      { pattern: /providerActivationContract/, label: 'language workspace providerActivationContract' },
      { pattern: /providerPackageBoundaryContract/, label: 'language workspace providerPackageBoundaryContract' },
      { pattern: /capabilityStandard/, label: 'assembly-driven capabilityStandard' },
      { pattern: /capabilityNegotiationStandard/, label: 'assembly-driven capabilityNegotiationStandard' },
      { pattern: /providerExtensionStandard/, label: 'assembly-driven providerExtensionStandard' },
      { pattern: /providerActivationStandard/, label: 'assembly-driven providerActivationStandard' },
      { pattern: /providerPackageBoundaryStandard/, label: 'assembly-driven providerPackageBoundaryStandard' },
      { pattern: /providerTierStandard/, label: 'assembly-driven providerTierStandard' },
      { pattern: /languageMaturityStandard/, label: 'assembly-driven languageMaturityStandard' },
      { pattern: /typescriptAdapterStandard/, label: 'assembly-driven typescriptAdapterStandard' },
      { pattern: /typescriptPackageStandard/, label: 'assembly-driven typescriptPackageStandard' },
      { pattern: /providerPackageBoundary/, label: 'language workspace providerPackageBoundary contract' },
      { pattern: /rootPublicPolicy/, label: 'language workspace rootPublicPolicy contract' },
      { pattern: /catalog-governed-mixed/, label: 'TypeScript mixed boundary mode contract' },
      {
        pattern: /scaffold-per-provider-package/,
        label: 'reserved scaffold boundary mode contract',
      },
      { pattern: /builtin-only/, label: 'builtin-only root public policy contract' },
      { pattern: /sdkwork-rtc-sdk-flutter\/lib\/rtc_sdk\.dart/, label: 'Flutter root barrel contract' },
      { pattern: /sdkwork-rtc-sdk-python\/sdkwork_rtc_sdk\/__init__\.py/, label: 'Python package root contract' },
      { pattern: /ProviderKey/, label: 'Go PascalCase public struct field contract' },
      { pattern: /source stub/i, label: 'reserved provider package source stub contract' },
      { pattern: /source symbol/i, label: 'reserved provider package source symbol contract' },
      {
        pattern: /official vendor sdk.*required/i,
        label: 'TypeScript official vendor sdk prerequisite contract',
      },
      {
        pattern: /@sdkwork\/rtc-sdk-provider-<providerKey>/,
        label: 'TypeScript provider package naming pattern contract',
      },
      {
        pattern: /\.\.\/\.\.\/src\/providers\/<providerKey>\.ts/,
        label: 'TypeScript provider source module naming pattern contract',
      },
      {
        pattern: /create<ProviderPascal>RtcDriver/,
        label: 'TypeScript provider driver factory naming pattern contract',
      },
      {
        pattern: /<PROVIDER_UPPER>_RTC_PROVIDER_METADATA/,
        label: 'TypeScript provider metadata symbol naming pattern contract',
      },
      {
        pattern: /<PROVIDER_UPPER>_RTC_PROVIDER_MODULE/,
        label: 'TypeScript provider module symbol naming pattern contract',
      },
    ],
  },
  {
    relativePath: 'docs/README.md',
    clauses: [
      { pattern: /provider-catalog\.ts/, label: 'internal docs TypeScript provider catalog index' },
      { pattern: /provider-selection\.ts/, label: 'internal docs TypeScript provider selection index' },
      { pattern: /provider-support\.ts/, label: 'internal docs TypeScript provider support index' },
      { pattern: /provider-package-catalog\.ts/, label: 'internal docs TypeScript provider package catalog index' },
      { pattern: /provider-activation-catalog\.ts/, label: 'internal docs TypeScript provider activation catalog index' },
      { pattern: /capability-catalog\.ts/, label: 'internal docs TypeScript capability catalog index' },
      {
        pattern: /provider-extension-catalog\.ts/,
        label: 'internal docs TypeScript provider extension catalog index',
      },
      { pattern: /language-workspace-catalog\.ts/, label: 'internal docs TypeScript language workspace catalog index' },
      { pattern: /providerSelectionContract/, label: 'internal docs providerSelectionContract coverage' },
      { pattern: /providerSupportContract/, label: 'internal docs providerSupportContract coverage' },
      { pattern: /providerActivationContract/, label: 'internal docs providerActivationContract coverage' },
      { pattern: /providerPackageBoundaryContract/, label: 'internal docs providerPackageBoundaryContract coverage' },
      { pattern: /capabilityStandard/, label: 'internal docs capabilityStandard coverage' },
      { pattern: /capabilityNegotiationStandard/, label: 'internal docs capabilityNegotiationStandard coverage' },
      { pattern: /runtimeSurfaceStandard/, label: 'internal docs runtimeSurfaceStandard coverage' },
      { pattern: /runtimeImmutabilityStandard/, label: 'internal docs runtimeImmutabilityStandard coverage' },
      { pattern: /rootPublicSurfaceStandard/, label: 'internal docs rootPublicSurfaceStandard coverage' },
      { pattern: /lookupHelperNamingStandard/, label: 'internal docs lookupHelperNamingStandard coverage' },
      { pattern: /errorCodeStandard/, label: 'internal docs errorCodeStandard coverage' },
      { pattern: /providerExtensionStandard/, label: 'internal docs providerExtensionStandard coverage' },
      { pattern: /providerActivationStandard/, label: 'internal docs providerActivationStandard coverage' },
      { pattern: /providerPackageBoundaryStandard/, label: 'internal docs providerPackageBoundaryStandard coverage' },
      { pattern: /providerTierStandard/, label: 'internal docs providerTierStandard coverage' },
      { pattern: /languageMaturityStandard/, label: 'internal docs languageMaturityStandard coverage' },
      { pattern: /typescriptAdapterStandard/, label: 'internal docs typescriptAdapterStandard coverage' },
      { pattern: /typescriptPackageStandard/, label: 'internal docs typescriptPackageStandard coverage' },
      { pattern: /providerPackageBoundary/, label: 'internal docs providerPackageBoundary coverage' },
      { pattern: /rootPublicPolicy/, label: 'internal docs rootPublicPolicy coverage' },
      { pattern: /catalog-governed-mixed/, label: 'internal docs TypeScript mixed boundary mode coverage' },
      {
        pattern: /scaffold-per-provider-package/,
        label: 'internal docs reserved scaffold boundary mode coverage',
      },
      { pattern: /builtin-only/, label: 'internal docs builtin-only root public policy coverage' },
      { pattern: /`none`/, label: 'internal docs none root public policy coverage' },
      { pattern: /getBuiltinRtcProviderMetadataByKey/, label: 'internal docs builtin provider lookup helper index' },
      { pattern: /getOfficialRtcProviderMetadataByKey/, label: 'internal docs official provider lookup helper index' },
      { pattern: /getRtcProviderByProviderKey/, label: 'internal docs provider catalog lookup helper index' },
      { pattern: /getRtcCapabilityCatalog/, label: 'internal docs capability catalog lookup helper index' },
      { pattern: /getRtcCapabilityDescriptor/, label: 'internal docs capability descriptor lookup helper index' },
      { pattern: /getRtcProviderPackageByProviderKey/, label: 'internal docs provider package lookup helper index' },
      { pattern: /getRtcProviderPackageByPackageIdentity/, label: 'internal docs provider package identity lookup helper index' },
      { pattern: /getRtcProviderActivationByProviderKey/, label: 'internal docs provider activation lookup helper index' },
      { pattern: /capability-negotiation\.ts/, label: 'internal docs capability negotiation index' },
      { pattern: /resolveRtcCapabilityNegotiationStatus/, label: 'internal docs capability negotiation helper index' },
      { pattern: /RTC_SDK_ERROR_CODES/, label: 'internal docs rtc sdk error catalog index' },
      { pattern: /RTC_SDK_ERROR_FALLBACK_CODE/, label: 'internal docs rtc sdk error fallback index' },
      { pattern: /RTC_RUNTIME_SURFACE_METHODS/, label: 'internal docs runtime surface method catalog index' },
      {
        pattern: /RTC_RUNTIME_SURFACE_FAILURE_CODE/,
        label: 'internal docs runtime surface failure code index',
      },
      { pattern: /runtime-immutability\.ts/, label: 'internal docs runtime immutability module index' },
      { pattern: /RTC_RUNTIME_IMMUTABILITY_STANDARD/, label: 'internal docs runtime immutability standard index' },
      { pattern: /root-public-surface\.ts/, label: 'internal docs root public surface module index' },
      { pattern: /RTC_ROOT_PUBLIC_SURFACE_STANDARD/, label: 'internal docs root public surface standard index' },
      { pattern: /lookup-helper-naming\.ts/, label: 'internal docs lookup helper naming module index' },
      { pattern: /RTC_LOOKUP_HELPER_NAMING_STANDARD/, label: 'internal docs lookup helper naming standard index' },
      { pattern: /root-public-builtin-only/, label: 'internal docs root public builtin-only exposure term index' },
      { pattern: /package-boundary-only/, label: 'internal docs root public package-boundary-only exposure term index' },
      { pattern: /vendor_error/, label: 'internal docs rtc sdk fallback error index' },
      { pattern: /provider-package-loader\.ts/, label: 'internal docs provider package loader index' },
      { pattern: /createRtcProviderPackageLoader/, label: 'internal docs provider package loader factory index' },
      { pattern: /resolveRtcProviderPackageLoadTarget/, label: 'internal docs provider package target resolver index' },
      { pattern: /loadRtcProviderModule/, label: 'internal docs provider package module loader index' },
      { pattern: /installRtcProviderPackage/, label: 'internal docs single provider package installer index' },
      { pattern: /installRtcProviderPackages/, label: 'internal docs batch provider package installer index' },
      { pattern: /--reuse-live-connection/, label: 'internal docs shared live connection smoke variant coverage' },
      {
        pattern: /getRtcProviderExtensionCatalog/,
        label: 'internal docs provider extension catalog lookup helper index',
      },
      {
        pattern: /getRtcProviderExtensionDescriptor/,
        label: 'internal docs provider extension descriptor lookup helper index',
      },
      {
        pattern: /getRtcProviderExtensionsForProvider/,
        label: 'internal docs provider extension by provider lookup helper index',
      },
      { pattern: /hasRtcProviderExtension/, label: 'internal docs provider extension membership helper index' },
      { pattern: /getRtcLanguageWorkspaceByLanguage/, label: 'internal docs language workspace lookup helper index' },
      { pattern: /provider package loader/i, label: 'internal docs provider package loader coverage' },
      { pattern: /sdkwork-rtc-sdk-flutter\/lib\/rtc_sdk\.dart/, label: 'internal docs Flutter root barrel index' },
      { pattern: /sdkwork-rtc-sdk-python\/sdkwork_rtc_sdk\/__init__\.py/, label: 'internal docs Python package root index' },
      { pattern: /ProviderKey/, label: 'internal docs Go PascalCase public field contract' },
      { pattern: /provider support classification/i, label: 'internal docs provider support classification index' },
      { pattern: /provider lookup by key/i, label: 'internal docs provider lookup-by-key index' },
    ],
  },
  {
    relativePath: 'docs/package-standards.md',
    clauses: [
      { pattern: /index\.js/, label: 'provider package JavaScript entrypoint' },
      { pattern: /index\.d\.ts/, label: 'provider package declaration entrypoint' },
      { pattern: /exports/, label: 'provider package exports contract' },
      { pattern: /consumer-supplied/, label: 'provider package vendor sdk provisioning contract' },
      { pattern: /native-factory/, label: 'provider package native factory binding contract' },
      { pattern: /must-not-bundle/, label: 'provider package vendor sdk bundle policy' },
      { pattern: /reference-baseline/, label: 'provider package runtime bridge baseline contract' },
      {
        pattern: /official vendor sdk.*required/i,
        label: 'provider package official vendor sdk prerequisite contract',
      },
      {
        pattern: /@sdkwork\/rtc-sdk-provider-<providerKey>/,
        label: 'provider package naming pattern contract',
      },
      {
        pattern: /\.\.\/\.\.\/src\/providers\/<providerKey>\.ts/,
        label: 'provider package source module naming pattern contract',
      },
      {
        pattern: /create<ProviderPascal>RtcDriver/,
        label: 'provider package driver factory naming pattern contract',
      },
      {
        pattern: /<PROVIDER_UPPER>_RTC_PROVIDER_METADATA/,
        label: 'provider package metadata symbol naming pattern contract',
      },
      {
        pattern: /<PROVIDER_UPPER>_RTC_PROVIDER_MODULE/,
        label: 'provider package module symbol naming pattern contract',
      },
      {
        pattern: /reserved TypeScript provider package boundaries/,
        label: 'provider package legacy TypeScript package-boundary wording prohibition',
      },
      {
        pattern: /builtin_reference_boundary/,
        label: 'provider package legacy builtin status wording prohibition',
      },
      {
        pattern: /official_reserved_boundary/,
        label: 'provider package legacy package-boundary status wording prohibition',
      },
      { pattern: /displayName/, label: 'language workspace displayName contract' },
      { pattern: /currentRole/, label: 'language workspace currentRole contract' },
      { pattern: /workspaceSummary/, label: 'language workspace workspaceSummary contract' },
      { pattern: /roleHighlights/, label: 'language workspace roleHighlights contract' },
      { pattern: /workspaceCatalogRelativePath/, label: 'language workspace catalog path contract' },
      { pattern: /language workspace catalog/i, label: 'language workspace catalog documentation contract' },
      { pattern: /providerSelectionContract/, label: 'language workspace providerSelectionContract contract' },
      { pattern: /providerSupportContract/, label: 'language workspace providerSupportContract contract' },
      { pattern: /providerActivationContract/, label: 'language workspace providerActivationContract contract' },
      { pattern: /providerPackageBoundaryContract/, label: 'language workspace providerPackageBoundaryContract contract' },
      { pattern: /providerSelectionStandard/, label: 'assembly-driven providerSelectionStandard contract' },
      { pattern: /providerSupportStandard/, label: 'assembly-driven providerSupportStandard contract' },
      { pattern: /capabilityStandard/, label: 'assembly-driven capabilityStandard contract' },
      { pattern: /capabilityNegotiationStandard/, label: 'assembly-driven capabilityNegotiationStandard contract' },
      { pattern: /runtimeSurfaceStandard/, label: 'assembly-driven runtimeSurfaceStandard contract' },
      { pattern: /runtimeImmutabilityStandard/, label: 'assembly-driven runtimeImmutabilityStandard contract' },
      { pattern: /rootPublicSurfaceStandard/, label: 'assembly-driven rootPublicSurfaceStandard contract' },
      { pattern: /lookupHelperNamingStandard/, label: 'assembly-driven lookupHelperNamingStandard contract' },
      { pattern: /errorCodeStandard/, label: 'assembly-driven errorCodeStandard contract' },
      { pattern: /providerExtensionStandard/, label: 'assembly-driven providerExtensionStandard contract' },
      { pattern: /providerActivationStandard/, label: 'assembly-driven providerActivationStandard contract' },
      { pattern: /providerPackageBoundaryStandard/, label: 'assembly-driven providerPackageBoundaryStandard contract' },
      { pattern: /providerTierStandard/, label: 'assembly-driven providerTierStandard contract' },
      { pattern: /languageMaturityStandard/, label: 'assembly-driven languageMaturityStandard contract' },
      { pattern: /typescriptAdapterStandard/, label: 'assembly-driven typescriptAdapterStandard contract' },
      { pattern: /typescriptPackageStandard/, label: 'assembly-driven typescriptPackageStandard contract' },
      { pattern: /providerActivations/, label: 'language workspace providerActivations contract' },
      { pattern: /typescriptPackage/, label: 'assembly-driven TypeScript provider package contract' },
      { pattern: /providerPackageBoundary/, label: 'language workspace provider package boundary contract' },
      {
        pattern: /rootPublicPolicy/,
        label: 'language workspace provider package rootPublicPolicy contract',
      },
      { pattern: /catalog-governed-mixed/, label: 'TypeScript mixed boundary mode contract' },
      { pattern: /scaffold-per-provider-package/, label: 'reserved scaffold boundary mode contract' },
      { pattern: /builtin-only/, label: 'builtin-only root public policy contract' },
      { pattern: /`none`/, label: 'none root public policy contract' },
      { pattern: /RTC_LOOKUP_HELPER_NAMING_STANDARD/, label: 'lookup helper naming standard contract' },
      { pattern: /lower-camel-rtc/, label: 'lower-camel lookup helper naming profile contract' },
      { pattern: /upper-camel-rtc/, label: 'upper-camel lookup helper naming profile contract' },
      { pattern: /snake-case-rtc/, label: 'snake-case lookup helper naming profile contract' },
      { pattern: /contractScaffold/, label: 'language workspace contract scaffold contract' },
      { pattern: /packageScaffold/, label: 'language workspace package scaffold contract' },
      { pattern: /providerPackageScaffold/, label: 'language workspace provider package scaffold contract' },
      { pattern: /metadataScaffold/, label: 'language workspace metadata scaffold contract' },
      { pattern: /directoryPattern/, label: 'language workspace provider package directory pattern contract' },
      { pattern: /packagePattern/, label: 'language workspace provider package identity pattern contract' },
      { pattern: /manifestFileName/, label: 'language workspace provider package manifest file contract' },
      { pattern: /readmeFileName/, label: 'language workspace provider package readme file contract' },
      { pattern: /sourceFilePattern/, label: 'language workspace provider package source file contract' },
      { pattern: /sourceSymbolPattern/, label: 'language workspace provider package source symbol contract' },
      { pattern: /templateTokens/, label: 'language workspace provider package template token contract' },
      { pattern: /sourceTemplateTokens/, label: 'language workspace provider package source template token contract' },
      { pattern: /future-runtime-bridge-only/, label: 'language workspace provider package reserved status contract' },
      { pattern: /rootPublic/, label: 'language workspace provider package rootPublic contract' },
      { pattern: /provider package boundar/i, label: 'language workspace future provider package boundary contract' },
      { pattern: /source stub/i, label: 'language workspace provider package source stub contract' },
      {
        pattern: /providerExtensionCatalogRelativePath/,
        label: 'language workspace provider extension catalog scaffold contract',
      },
      {
        pattern: /providerPackageLoaderRelativePath/,
        label: 'language workspace provider package loader scaffold contract',
      },
      {
        pattern: /providerPackageCatalogRelativePath/,
        label: 'language workspace provider package catalog scaffold contract',
      },
      {
        pattern: /providerActivationCatalogRelativePath/,
        label: 'language workspace provider activation catalog scaffold contract',
      },
      { pattern: /provider package catalog/i, label: 'language workspace provider package catalog documentation contract' },
      { pattern: /provider activation catalog/i, label: 'language workspace provider activation catalog documentation contract' },
      { pattern: /resolutionScaffold/, label: 'language workspace resolution scaffold contract' },
      { pattern: /build system/i, label: 'language workspace build system scaffold contract' },
      { pattern: /manifest/i, label: 'language workspace manifest scaffold contract' },
      { pattern: /provider catalog/i, label: 'language workspace provider catalog scaffold contract' },
      { pattern: /capability catalog/i, label: 'language workspace capability catalog scaffold contract' },
      { pattern: /provider selection/i, label: 'language workspace provider selection scaffold contract' },
      { pattern: /driver manager/i, label: 'language workspace driver manager scaffold contract' },
      { pattern: /data source/i, label: 'language workspace data source scaffold contract' },
      { pattern: /provider support/i, label: 'language workspace provider support scaffold contract' },
      { pattern: /provider package loader/i, label: 'language workspace provider package loader scaffold contract' },
      { pattern: /getRtcLanguageWorkspaceByLanguage/, label: 'language workspace lookup helper contract' },
      { pattern: /getRtcProviderByProviderKey/, label: 'provider catalog lookup helper alias contract' },
      { pattern: /getRtcProviderActivationByProviderKey/, label: 'provider activation lookup helper contract' },
      { pattern: /getRtcProviderPackageByProviderKey/, label: 'provider package lookup helper contract' },
      { pattern: /getRtcProviderPackageByPackageIdentity/, label: 'provider package identity lookup helper contract' },
      { pattern: /RtcProviderPackageLoadRequest/, label: 'provider package load request contract' },
      { pattern: /RtcProviderPackageLoader/, label: 'provider package loader contract' },
      { pattern: /createRtcProviderPackageLoader/, label: 'provider package loader factory contract' },
      { pattern: /resolveRtcProviderPackageLoadTarget/, label: 'provider package target resolver contract' },
      { pattern: /loadRtcProviderModule/, label: 'provider package module loader contract' },
      { pattern: /installRtcProviderPackage/, label: 'single provider package installer contract' },
      { pattern: /installRtcProviderPackages/, label: 'batch provider package installer contract' },
      { pattern: /provider_package_not_found/, label: 'provider package not found error contract' },
      { pattern: /provider_package_identity_mismatch/, label: 'provider package identity mismatch error contract' },
      { pattern: /provider_package_load_failed/, label: 'provider package load failure error contract' },
      { pattern: /provider_module_export_missing/, label: 'provider package module export failure contract' },
      { pattern: /getRtcCapabilityCatalog/, label: 'capability catalog lookup helper contract' },
      { pattern: /getRtcCapabilityDescriptor/, label: 'capability descriptor lookup helper contract' },
      {
        pattern: /getRtcProviderExtensionDescriptor/,
        label: 'provider extension descriptor lookup helper contract',
      },
      {
        pattern: /getRtcProviderExtensionsForProvider/,
        label: 'provider extension by provider lookup helper contract',
      },
      { pattern: /hasRtcProviderExtension/, label: 'provider extension membership helper contract' },
      { pattern: /RtcProviderSupportStateRequest/, label: 'provider support request contract' },
      { pattern: /RTC_CAPABILITY_NEGOTIATION_STATUSES/, label: 'capability negotiation status catalog contract' },
      { pattern: /RTC_CAPABILITY_NEGOTIATION_RULES/, label: 'capability negotiation rule catalog contract' },
      { pattern: /resolveRtcCapabilityNegotiationStatus/, label: 'capability negotiation resolver contract' },
      { pattern: /RTC_RUNTIME_SURFACE_METHODS/, label: 'rtc runtime surface method catalog contract' },
      {
        pattern: /RTC_RUNTIME_SURFACE_FAILURE_CODE/,
        label: 'rtc runtime surface failure code contract',
      },
      { pattern: /RTC_RUNTIME_IMMUTABILITY_STANDARD/, label: 'rtc runtime immutability standard contract' },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM/,
        label: 'rtc runtime immutability frozen-term contract',
      },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM/,
        label: 'rtc runtime immutability snapshot-term contract',
      },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM/,
        label: 'rtc runtime immutability controller-context contract',
      },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM/,
        label: 'rtc runtime immutability native-client contract',
      },
      { pattern: /RTC_ROOT_PUBLIC_SURFACE_STANDARD/, label: 'rtc root public surface standard contract' },
      {
        pattern: /RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS/,
        label: 'rtc root public surface provider-neutral export path contract',
      },
      {
        pattern: /RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS/,
        label: 'rtc root public surface reserved entrypoint contract',
      },
      { pattern: /root-public-builtin-only/, label: 'rtc root public builtin-only exposure term contract' },
      { pattern: /package-boundary-only/, label: 'rtc root public package-boundary-only exposure term contract' },
      { pattern: /RTC_SDK_ERROR_CODES/, label: 'rtc sdk error catalog contract' },
      { pattern: /RTC_SDK_ERROR_FALLBACK_CODE/, label: 'rtc sdk error fallback contract' },
      { pattern: /vendor_error/, label: 'rtc sdk canonical fallback error contract' },
      { pattern: /resolveRtcProviderSupportStatus/, label: 'provider support status helper contract' },
      { pattern: /createRtcProviderSupportState/, label: 'provider support state helper contract' },
      { pattern: /getBuiltinRtcProviderMetadataByKey/, label: 'builtin provider catalog lookup helper contract' },
      { pattern: /getOfficialRtcProviderMetadataByKey/, label: 'official provider catalog lookup helper contract' },
      { pattern: /root-public-builtin/, label: 'language provider root-public-builtin contract' },
      { pattern: /package-boundary/, label: 'language provider package-boundary contract' },
      { pattern: /control-metadata-only/, label: 'language provider control-metadata-only contract' },
      { pattern: /lib\/rtc_sdk\.dart/, label: 'Flutter root barrel contract' },
      { pattern: /sdkwork_rtc_sdk\/__init__\.py/, label: 'reserved Python package root contract' },
      { pattern: /PascalCase/, label: 'Go PascalCase public field documentation contract' },
      { pattern: /ProviderKey/, label: 'Go public ProviderKey field contract' },
      { pattern: /capabilityCatalog/, label: 'capability catalog contract' },
      { pattern: /providerExtensionCatalog/, label: 'provider extension catalog contract' },
      { pattern: /category/, label: 'capability category contract' },
      { pattern: /surface/, label: 'capability surface contract' },
      { pattern: /cross-surface/, label: 'cross-surface capability contract' },
      { pattern: /unwrap-only/, label: 'provider extension unwrap-only access contract' },
      { pattern: /extension-object/, label: 'provider extension extension-object access contract' },
      { pattern: /runtime-frozen/i, label: 'runtime-frozen TypeScript metadata contract' },
      { pattern: /immutable snapshots/i, label: 'runtime immutable snapshot contract' },
      {
        pattern: /shallow-immutable-context/i,
        label: 'runtime controller shallow-immutable context contract',
      },
      { pattern: /metadata references/i, label: 'provider driver metadata snapshot contract' },
      { pattern: /mutable-native-client/i, label: 'runtime controller mutable native client contract' },
      { pattern: /supported/, label: 'capability negotiation supported contract' },
      { pattern: /degraded/, label: 'capability negotiation degraded contract' },
      { pattern: /unsupported/, label: 'capability negotiation unsupported contract' },
      { pattern: /\.gitignore/, label: 'workspace gitignore contract' },
      { pattern: /sdkwork-rtc-sdk-typescript\/dist\//, label: 'typescript dist artifact contract' },
      { pattern: /sdkwork-rtc-sdk-rust\/target\//, label: 'rust target artifact contract' },
      { pattern: /sdkwork-rtc-sdk-java\/target\//, label: 'java target artifact contract' },
      { pattern: /__pycache__/, label: 'python pycache artifact contract' },
      { pattern: /\.sdkwork-assembly\.json/, label: 'assembly snapshot source-of-truth contract' },
    ],
  },
  {
    relativePath: 'docs/provider-adapter-standard.md',
    clauses: [
      { pattern: /index\.js/, label: 'provider adapter JavaScript entrypoint' },
      { pattern: /index\.d\.ts/, label: 'provider adapter declaration entrypoint' },
      { pattern: /exports/, label: 'provider adapter exports contract' },
      { pattern: /builtin provider packages/i, label: 'builtin provider package exposure policy' },
      { pattern: /consumer-supplied/, label: 'provider adapter vendor sdk provisioning contract' },
      { pattern: /native-factory/, label: 'provider adapter native factory binding contract' },
      { pattern: /must-not-bundle/, label: 'provider adapter vendor sdk bundle policy' },
      { pattern: /reference-baseline/, label: 'provider adapter runtime bridge baseline contract' },
      {
        pattern: /official vendor sdk.*required/i,
        label: 'provider adapter official vendor sdk prerequisite contract',
      },
      { pattern: /registerRtcProviderModules/, label: 'provider adapter batch provider module registration contract' },
      { pattern: /provider_module_contract_mismatch/, label: 'provider adapter provider module contract mismatch error' },
      { pattern: /atomic/i, label: 'provider adapter atomic batch registration contract' },
      { pattern: /control-plane/i, label: 'provider adapter control-plane capability contract' },
      { pattern: /runtime-bridge/i, label: 'provider adapter runtime-bridge capability contract' },
      { pattern: /cross-surface/i, label: 'provider adapter cross-surface capability contract' },
      { pattern: /capability negotiation/i, label: 'provider adapter capability negotiation contract' },
      { pattern: /degraded/i, label: 'provider adapter degraded capability contract' },
      { pattern: /unsupported/i, label: 'provider adapter unsupported capability contract' },
      { pattern: /runtimeSurfaceStandard/, label: 'provider adapter assembly-driven runtimeSurfaceStandard contract' },
      { pattern: /runtimeImmutabilityStandard/, label: 'provider adapter assembly-driven runtimeImmutabilityStandard contract' },
      { pattern: /rootPublicSurfaceStandard/, label: 'provider adapter assembly-driven rootPublicSurfaceStandard contract' },
      { pattern: /lookupHelperNamingStandard/, label: 'provider adapter assembly-driven lookupHelperNamingStandard contract' },
      {
        pattern: /RTC_RUNTIME_SURFACE_METHODS/,
        label: 'provider adapter rtc runtime surface method catalog contract',
      },
      {
        pattern: /RTC_RUNTIME_SURFACE_FAILURE_CODE/,
        label: 'provider adapter rtc runtime surface failure code contract',
      },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_STANDARD/,
        label: 'provider adapter rtc runtime immutability standard contract',
      },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM/,
        label: 'provider adapter rtc runtime immutability controller-context contract',
      },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM/,
        label: 'provider adapter rtc runtime immutability native-client contract',
      },
      { pattern: /root-public-surface\.ts/, label: 'provider adapter root public surface module contract' },
      { pattern: /RTC_ROOT_PUBLIC_SURFACE_STANDARD/, label: 'provider adapter rtc root public surface standard contract' },
      { pattern: /RTC_LOOKUP_HELPER_NAMING_STANDARD/, label: 'provider adapter rtc lookup helper naming standard contract' },
      { pattern: /lower-camel-rtc/, label: 'provider adapter lower-camel lookup helper naming profile contract' },
      { pattern: /upper-camel-rtc/, label: 'provider adapter upper-camel lookup helper naming profile contract' },
      { pattern: /snake-case-rtc/, label: 'provider adapter snake-case lookup helper naming profile contract' },
      { pattern: /root-public-builtin-only/, label: 'provider adapter builtin-only root public exposure term contract' },
      { pattern: /package-boundary-only/, label: 'provider adapter package-boundary-only root public exposure term contract' },
      { pattern: /errorCodeStandard/, label: 'provider adapter assembly-driven errorCodeStandard contract' },
      { pattern: /RTC_SDK_ERROR_CODES/, label: 'provider adapter rtc sdk error catalog contract' },
      { pattern: /RTC_SDK_ERROR_FALLBACK_CODE/, label: 'provider adapter rtc sdk error fallback contract' },
      { pattern: /vendor_error/, label: 'provider adapter rtc sdk canonical fallback error contract' },
      { pattern: /immutable snapshots/i, label: 'provider adapter immutable snapshot contract' },
      {
        pattern: /shallow-immutable-context/i,
        label: 'provider adapter shallow-immutable context contract',
      },
      { pattern: /mutable-native-client/i, label: 'provider adapter mutable native client contract' },
      { pattern: /provider extension metadata/i, label: 'provider adapter extension metadata contract' },
      { pattern: /unwrap-only/i, label: 'provider adapter unwrap-only extension contract' },
      { pattern: /extension-object/i, label: 'provider adapter extension-object contract' },
      { pattern: /getRtcProviderPackageByProviderKey/, label: 'provider adapter provider package lookup helper contract' },
      { pattern: /getRtcProviderPackageByPackageIdentity/, label: 'provider adapter provider package identity lookup helper contract' },
      { pattern: /createRtcProviderPackageLoader/, label: 'provider adapter provider package loader factory contract' },
      { pattern: /resolveRtcProviderPackageLoadTarget/, label: 'provider adapter provider package target resolver contract' },
      { pattern: /loadRtcProviderModule/, label: 'provider adapter provider package module loader contract' },
      { pattern: /installRtcProviderPackage/, label: 'provider adapter single package installer contract' },
      { pattern: /installRtcProviderPackages/, label: 'provider adapter batch package installer contract' },
      { pattern: /provider_package_not_found/, label: 'provider adapter package not found error contract' },
      { pattern: /provider_package_identity_mismatch/, label: 'provider adapter package identity mismatch error contract' },
      { pattern: /provider_package_load_failed/, label: 'provider adapter package load failure error contract' },
      { pattern: /provider_module_export_missing/, label: 'provider adapter package module export failure contract' },
      { pattern: /getRtcProviderActivationByProviderKey/, label: 'provider adapter provider activation lookup helper contract' },
      { pattern: /getRtcLanguageWorkspaceByLanguage/, label: 'provider adapter language workspace lookup helper contract' },
      { pattern: /getRtcProviderByProviderKey/, label: 'provider adapter provider catalog lookup helper contract' },
      { pattern: /getRtcCapabilityDescriptor/, label: 'provider adapter capability lookup helper contract' },
      {
        pattern: /getRtcProviderExtensionDescriptor/,
        label: 'provider adapter provider extension descriptor helper contract',
      },
      {
        pattern: /getRtcProviderExtensionsForProvider/,
        label: 'provider adapter provider extension by provider helper contract',
      },
      { pattern: /hasRtcProviderExtension/, label: 'provider adapter provider extension membership helper contract' },
      { pattern: /RTC_CAPABILITY_NEGOTIATION_STATUSES/, label: 'provider adapter capability negotiation status catalog contract' },
      { pattern: /RTC_CAPABILITY_NEGOTIATION_RULES/, label: 'provider adapter capability negotiation rule catalog contract' },
      { pattern: /resolveRtcCapabilityNegotiationStatus/, label: 'provider adapter capability negotiation resolver contract' },
      { pattern: /RTC_SDK_ERROR_CODES/, label: 'provider adapter rtc sdk error catalog contract' },
      { pattern: /RTC_SDK_ERROR_FALLBACK_CODE/, label: 'provider adapter rtc sdk error fallback contract' },
      { pattern: /vendor_error/, label: 'provider adapter rtc sdk canonical fallback error contract' },
      { pattern: /resolveRtcProviderSupportStatus/, label: 'provider adapter provider support status helper contract' },
      { pattern: /createRtcProviderSupportState/, label: 'provider adapter provider support state helper contract' },
      { pattern: /providerSelectionContract/, label: 'provider adapter language workspace providerSelectionContract contract' },
      { pattern: /providerSupportContract/, label: 'provider adapter language workspace providerSupportContract contract' },
      { pattern: /providerActivationContract/, label: 'provider adapter language workspace providerActivationContract contract' },
      { pattern: /providerPackageBoundaryContract/, label: 'provider adapter language workspace package boundary contract vocabulary' },
      { pattern: /capabilityStandard/, label: 'provider adapter assembly-driven capabilityStandard contract' },
      { pattern: /capabilityNegotiationStandard/, label: 'provider adapter assembly-driven capabilityNegotiationStandard contract' },
      { pattern: /runtimeSurfaceStandard/, label: 'provider adapter assembly-driven runtimeSurfaceStandard contract' },
      { pattern: /errorCodeStandard/, label: 'provider adapter assembly-driven errorCodeStandard contract' },
      { pattern: /providerExtensionStandard/, label: 'provider adapter assembly-driven providerExtensionStandard contract' },
      { pattern: /providerActivationStandard/, label: 'provider adapter assembly-driven providerActivationStandard contract' },
      { pattern: /providerPackageBoundaryStandard/, label: 'provider adapter assembly-driven providerPackageBoundaryStandard contract' },
      { pattern: /providerTierStandard/, label: 'provider adapter assembly-driven providerTierStandard contract' },
      { pattern: /languageMaturityStandard/, label: 'provider adapter assembly-driven languageMaturityStandard contract' },
      { pattern: /typescriptAdapterStandard/, label: 'provider adapter assembly-driven typescriptAdapterStandard contract' },
      { pattern: /typescriptPackageStandard/, label: 'provider adapter assembly-driven typescriptPackageStandard contract' },
      { pattern: /providerPackageBoundary/, label: 'provider adapter language workspace package boundary contract' },
      {
        pattern: /rootPublicPolicy/,
        label: 'provider adapter language workspace package boundary rootPublicPolicy contract',
      },
      { pattern: /catalog-governed-mixed/, label: 'provider adapter TypeScript mixed boundary mode contract' },
      {
        pattern: /scaffold-per-provider-package/,
        label: 'provider adapter reserved scaffold boundary mode contract',
      },
      { pattern: /builtin-only/, label: 'provider adapter builtin-only root public policy contract' },
      { pattern: /`none`/, label: 'provider adapter none root public policy contract' },
      { pattern: /templateTokens/, label: 'provider adapter reserved provider package template token contract' },
      { pattern: /sourceFilePattern/, label: 'provider adapter reserved provider package source file contract' },
      { pattern: /sourceSymbolPattern/, label: 'provider adapter reserved provider package source symbol contract' },
      { pattern: /sourceTemplateTokens/, label: 'provider adapter reserved provider package source template token contract' },
      { pattern: /future-runtime-bridge-only/, label: 'provider adapter reserved provider package status contract' },
      { pattern: /rootPublic/i, label: 'provider adapter reserved provider package rootPublic contract' },
      { pattern: /provider package catalog/i, label: 'provider adapter reserved provider package catalog contract' },
      { pattern: /source stub/i, label: 'provider adapter reserved provider package source stub contract' },
    ],
  },
  {
    relativePath: 'docs/usage-guide.md',
    clauses: [
      { pattern: /DEFAULT_RTC_PROVIDER_KEY/, label: 'usage guide default provider key constant' },
      { pattern: /DEFAULT_RTC_PROVIDER_PLUGIN_ID/, label: 'usage guide default provider plugin constant' },
      { pattern: /DEFAULT_RTC_PROVIDER_DRIVER_ID/, label: 'usage guide default provider driver constant' },
      { pattern: /createStandardRtcCallControllerStack/, label: 'usage guide recommended rtc entrypoint' },
      { pattern: /StandardRtcCallController/, label: 'usage guide standard call controller contract' },
      { pattern: /sdkwork-rtc-sdk/, label: 'usage guide signaling standard reference' },
      { pattern: /providerUrl/, label: 'usage guide providerUrl precedence reference' },
      { pattern: /providerKey/, label: 'usage guide providerKey precedence reference' },
      { pattern: /tenantOverrideProviderKey/, label: 'usage guide tenant override precedence reference' },
      { pattern: /deploymentProfileProviderKey/, label: 'usage guide deployment profile precedence reference' },
      { pattern: /defaultProvider/, label: 'usage guide default provider precedence reference' },
    ],
  },
  {
    relativePath: 'docs/typescript-volcengine-signaling-usage.md',
    clauses: [
      { pattern: /createStandardRtcCallControllerStack/, label: 'TypeScript runtime usage recommended rtc entrypoint' },
      { pattern: /StandardRtcCallController/, label: 'TypeScript runtime usage standard call controller contract' },
      { pattern: /@volcengine\/rtc/, label: 'TypeScript runtime usage vendor sdk package reference' },
      { pattern: /@sdkwork\/rtc-sdk/, label: 'TypeScript runtime usage signaling sdk package reference' },
      { pattern: /node \.\/bin\/sdk-call-smoke\.mjs --json/, label: 'TypeScript runtime usage smoke command reference' },
      { pattern: /runtime-backed/, label: 'TypeScript runtime usage smoke mode reference' },
    ],
  },
  {
    relativePath: 'docs/flutter-volcengine-signaling-usage.md',
    clauses: [
      { pattern: /createStandardRtcCallControllerStack/, label: 'Flutter runtime usage recommended rtc entrypoint' },
      { pattern: /StandardRtcCallController/, label: 'Flutter runtime usage standard call controller contract' },
      { pattern: /package:volc_engine_rtc\/volc_engine_rtc\.dart/, label: 'Flutter runtime usage vendor sdk import reference' },
      { pattern: /package:rtc_sdk\/rtc_sdk\.dart/, label: 'Flutter runtime usage signaling sdk import reference' },
      { pattern: /node \.\/bin\/sdk-call-smoke\.mjs --json/, label: 'Flutter runtime usage smoke command reference' },
      { pattern: /analysis-backed/, label: 'Flutter runtime usage smoke mode reference' },
    ],
  },
  {
    relativePath: 'docs/verification-matrix.md',
    clauses: [
      { pattern: /DEFAULT_RTC_PROVIDER_KEY/, label: 'verification of default provider key constant' },
      { pattern: /DEFAULT_RTC_PROVIDER_PLUGIN_ID/, label: 'verification of default provider plugin constant' },
      { pattern: /DEFAULT_RTC_PROVIDER_DRIVER_ID/, label: 'verification of default provider driver constant' },
      { pattern: /index\.js/, label: 'verification of provider package JavaScript entrypoint' },
      { pattern: /index\.d\.ts/, label: 'verification of provider package declaration entrypoint' },
      { pattern: /consumer-supplied/, label: 'verification of vendor sdk provisioning contract' },
      { pattern: /native-factory/, label: 'verification of native factory binding contract' },
      { pattern: /must-not-bundle/, label: 'verification of vendor sdk bundle policy' },
      { pattern: /reference-baseline/, label: 'verification of runtime bridge baseline contract' },
      {
        pattern: /official vendor sdk.*required/i,
        label: 'verification of official vendor sdk prerequisite contract',
      },
      {
        pattern: /@sdkwork\/rtc-sdk-provider-<providerKey>/,
        label: 'verification of provider package naming pattern contract',
      },
      {
        pattern: /\.\.\/\.\.\/src\/providers\/<providerKey>\.ts/,
        label: 'verification of provider source module naming pattern contract',
      },
      {
        pattern: /create<ProviderPascal>RtcDriver/,
        label: 'verification of provider driver factory naming pattern contract',
      },
      {
        pattern: /<PROVIDER_UPPER>_RTC_PROVIDER_METADATA/,
        label: 'verification of provider metadata symbol naming pattern contract',
      },
      {
        pattern: /<PROVIDER_UPPER>_RTC_PROVIDER_MODULE/,
        label: 'verification of provider module symbol naming pattern contract',
      },
      {
        pattern: /reserved TypeScript provider package boundaries/,
        label: 'verification of legacy TypeScript package-boundary wording prohibition',
      },
      {
        pattern: /builtin_reference_boundary/,
        label: 'verification of legacy builtin status wording prohibition',
      },
      {
        pattern: /official_reserved_boundary/,
        label: 'verification of legacy package-boundary status wording prohibition',
      },
      { pattern: /displayName/, label: 'verification of language workspace displayName contract' },
      { pattern: /currentRole/, label: 'verification of language workspace currentRole contract' },
      { pattern: /workspaceSummary/, label: 'verification of language workspace workspaceSummary contract' },
      { pattern: /roleHighlights/, label: 'verification of language workspace roleHighlights contract' },
      { pattern: /workspaceCatalogRelativePath/, label: 'verification of language workspace catalog path contract' },
      { pattern: /language workspace catalog/i, label: 'verification of language workspace catalog contract' },
      { pattern: /providerSelectionContract/, label: 'verification of language workspace providerSelectionContract contract' },
      { pattern: /providerSupportContract/, label: 'verification of language workspace providerSupportContract contract' },
      { pattern: /providerActivationContract/, label: 'verification of language workspace providerActivationContract contract' },
      { pattern: /providerPackageBoundaryContract/, label: 'verification of language workspace providerPackageBoundaryContract contract' },
      { pattern: /typescript-volcengine-signaling-usage\.md/, label: 'verification of TypeScript detailed runtime usage guide contract' },
      { pattern: /flutter-volcengine-signaling-usage\.md/, label: 'verification of Flutter detailed runtime usage guide contract' },
      { pattern: /vendorSdkPackage/, label: 'verification of runtime baseline vendorSdkPackage contract' },
      { pattern: /vendorSdkImportPath/, label: 'verification of runtime baseline vendorSdkImportPath contract' },
      { pattern: /signalingSdkPackage/, label: 'verification of runtime baseline signalingSdkPackage contract' },
      { pattern: /signalingSdkImportPath/, label: 'verification of runtime baseline signalingSdkImportPath contract' },
      { pattern: /recommendedEntrypoint/, label: 'verification of runtime baseline recommendedEntrypoint contract' },
      { pattern: /smokeCommand/, label: 'verification of runtime baseline smokeCommand contract' },
      { pattern: /smokeMode/, label: 'verification of runtime baseline smokeMode contract' },
      { pattern: /smokeVariants/, label: 'verification of runtime baseline smokeVariants contract' },
      { pattern: /--reuse-live-connection/, label: 'verification of shared live connection smoke variant contract' },
      { pattern: /runtimeDocumentation/, label: 'verification of runtime documentation contract' },
      { pattern: /baselineConclusion/, label: 'verification of runtime documentation baselineConclusion contract' },
      { pattern: /guideTitle/, label: 'verification of runtime documentation guideTitle contract' },
      { pattern: /runtimeLabel/, label: 'verification of runtime documentation runtimeLabel contract' },
      { pattern: /detailedGuidePath/, label: 'verification of runtime documentation detailedGuidePath contract' },
      { pattern: /detailedGuideLabel/, label: 'verification of runtime documentation detailedGuideLabel contract' },
      { pattern: /smokeNarrative/, label: 'verification of runtime documentation smokeNarrative contract' },
      { pattern: /runtime-backed/, label: 'verification of runtime-backed smoke mode contract' },
      { pattern: /analysis-backed/, label: 'verification of analysis-backed smoke mode contract' },
      { pattern: /providerSelectionStandard/, label: 'verification of assembly-driven providerSelectionStandard contract' },
      { pattern: /providerSupportStandard/, label: 'verification of assembly-driven providerSupportStandard contract' },
      { pattern: /capabilityStandard/, label: 'verification of assembly-driven capabilityStandard contract' },
      { pattern: /capabilityNegotiationStandard/, label: 'verification of assembly-driven capabilityNegotiationStandard contract' },
      { pattern: /runtimeSurfaceStandard/, label: 'verification of assembly-driven runtimeSurfaceStandard contract' },
      { pattern: /runtimeImmutabilityStandard/, label: 'verification of assembly-driven runtimeImmutabilityStandard contract' },
      { pattern: /rootPublicSurfaceStandard/, label: 'verification of assembly-driven rootPublicSurfaceStandard contract' },
      { pattern: /lookupHelperNamingStandard/, label: 'verification of assembly-driven lookupHelperNamingStandard contract' },
      { pattern: /errorCodeStandard/, label: 'verification of assembly-driven errorCodeStandard contract' },
      { pattern: /providerExtensionStandard/, label: 'verification of assembly-driven providerExtensionStandard contract' },
      { pattern: /providerActivationStandard/, label: 'verification of assembly-driven providerActivationStandard contract' },
      { pattern: /providerPackageBoundaryStandard/, label: 'verification of assembly-driven providerPackageBoundaryStandard contract' },
      { pattern: /providerTierStandard/, label: 'verification of assembly-driven providerTierStandard contract' },
      { pattern: /languageMaturityStandard/, label: 'verification of assembly-driven languageMaturityStandard contract' },
      { pattern: /typescriptAdapterStandard/, label: 'verification of assembly-driven typescriptAdapterStandard contract' },
      { pattern: /typescriptPackageStandard/, label: 'verification of assembly-driven typescriptPackageStandard contract' },
      { pattern: /providerActivations/, label: 'verification of language workspace providerActivations contract' },
      { pattern: /typescriptPackage/, label: 'verification of assembly-driven TypeScript provider package contract' },
      {
        pattern: /providerPackageBoundary/,
        label: 'verification of language workspace provider package boundary contract',
      },
      {
        pattern: /rootPublicPolicy/,
        label: 'verification of language workspace provider package rootPublicPolicy contract',
      },
      {
        pattern: /catalog-governed-mixed/,
        label: 'verification of TypeScript mixed boundary mode contract',
      },
      {
        pattern: /scaffold-per-provider-package/,
        label: 'verification of reserved scaffold boundary mode contract',
      },
      { pattern: /builtin-only/, label: 'verification of builtin-only root public policy contract' },
      { pattern: /`none`/, label: 'verification of none root public policy contract' },
      { pattern: /lookup-helper-naming\.ts/, label: 'verification of lookup helper naming module contract' },
      { pattern: /RTC_LOOKUP_HELPER_NAMING_STANDARD/, label: 'verification of lookup helper naming standard contract' },
      { pattern: /contractScaffold/, label: 'verification of language workspace contract scaffold contract' },
      { pattern: /packageScaffold/, label: 'verification of language workspace package scaffold contract' },
      {
        pattern: /providerPackageScaffold/,
        label: 'verification of language workspace provider package scaffold contract',
      },
      { pattern: /metadataScaffold/, label: 'verification of language workspace metadata scaffold contract' },
      {
        pattern: /providerPackageCatalogRelativePath/,
        label: 'verification of language workspace provider package catalog scaffold contract',
      },
      {
        pattern: /providerActivationCatalogRelativePath/,
        label: 'verification of language workspace provider activation catalog scaffold contract',
      },
      { pattern: /provider package catalog/i, label: 'verification of provider package catalog standard contract' },
      { pattern: /provider activation catalog/i, label: 'verification of provider activation catalog standard contract' },
      {
        pattern: /directoryPattern/,
        label: 'verification of language workspace provider package directory pattern contract',
      },
      {
        pattern: /packagePattern/,
        label: 'verification of language workspace provider package identity pattern contract',
      },
      {
        pattern: /manifestFileName/,
        label: 'verification of language workspace provider package manifest file contract',
      },
      {
        pattern: /readmeFileName/,
        label: 'verification of language workspace provider package readme file contract',
      },
      {
        pattern: /sourceFilePattern/,
        label: 'verification of language workspace provider package source file contract',
      },
      {
        pattern: /sourceSymbolPattern/,
        label: 'verification of language workspace provider package source symbol contract',
      },
      {
        pattern: /templateTokens/,
        label: 'verification of language workspace provider package template token contract',
      },
      {
        pattern: /sourceTemplateTokens/,
        label: 'verification of language workspace provider package source template token contract',
      },
      {
        pattern: /future-runtime-bridge-only/,
        label: 'verification of language workspace provider package reserved status contract',
      },
      {
        pattern: /rootPublic/,
        label: 'verification of language workspace provider package rootPublic contract',
      },
      {
        pattern: /provider package boundar/i,
        label: 'verification of future provider package boundary contract',
      },
      { pattern: /source stub/i, label: 'verification of provider package source stub contract' },
      {
        pattern: /providerExtensionCatalogRelativePath/,
        label: 'verification of language workspace provider extension catalog scaffold contract',
      },
      {
        pattern: /providerPackageLoaderRelativePath/,
        label: 'verification of language workspace provider package loader scaffold contract',
      },
      { pattern: /resolutionScaffold/, label: 'verification of language workspace resolution scaffold contract' },
      { pattern: /build system/i, label: 'verification of language workspace build system scaffold contract' },
      { pattern: /manifest/i, label: 'verification of language workspace manifest scaffold contract' },
      { pattern: /provider catalog/i, label: 'verification of language workspace provider catalog scaffold contract' },
      { pattern: /capability catalog/i, label: 'verification of language workspace capability catalog scaffold contract' },
      { pattern: /provider selection/i, label: 'verification of language workspace provider selection scaffold contract' },
      { pattern: /driver manager/i, label: 'verification of language workspace driver manager scaffold contract' },
      { pattern: /data source/i, label: 'verification of language workspace data source scaffold contract' },
      { pattern: /provider support/i, label: 'verification of language workspace provider support scaffold contract' },
      { pattern: /provider package loader/i, label: 'verification of language workspace provider package loader scaffold contract' },
      { pattern: /getRtcProviderPackageByProviderKey/, label: 'verification of provider package lookup helper contract' },
      { pattern: /getRtcProviderPackageByPackageIdentity/, label: 'verification of provider package identity lookup helper contract' },
      { pattern: /createRtcProviderPackageLoader/, label: 'verification of provider package loader factory contract' },
      { pattern: /resolveRtcProviderPackageLoadTarget/, label: 'verification of provider package target resolver contract' },
      { pattern: /loadRtcProviderModule/, label: 'verification of provider package module loader contract' },
      { pattern: /installRtcProviderPackage/, label: 'verification of single provider package installer contract' },
      { pattern: /installRtcProviderPackages/, label: 'verification of batch provider package installer contract' },
      { pattern: /getRtcProviderActivationByProviderKey/, label: 'verification of provider activation lookup helper contract' },
      { pattern: /getRtcLanguageWorkspaceByLanguage/, label: 'verification of language workspace lookup helper contract' },
      { pattern: /lib\/rtc_sdk\.dart/, label: 'verification of Flutter root barrel contract' },
      { pattern: /sdkwork_rtc_sdk\/__init__\.py/, label: 'verification of Python package root contract' },
      { pattern: /ProviderKey/, label: 'verification of Go PascalCase public field contract' },
      { pattern: /getRtcProviderByProviderKey/, label: 'verification of provider catalog lookup helper contract' },
      { pattern: /getRtcCapabilityCatalog/, label: 'verification of capability catalog lookup helper contract' },
      { pattern: /getRtcCapabilityDescriptor/, label: 'verification of capability descriptor lookup helper contract' },
      {
        pattern: /getRtcProviderExtensionDescriptor/,
        label: 'verification of provider extension descriptor lookup helper contract',
      },
      {
        pattern: /getRtcProviderExtensionsForProvider/,
        label: 'verification of provider extension by provider lookup helper contract',
      },
      { pattern: /hasRtcProviderExtension/, label: 'verification of provider extension membership helper contract' },
      { pattern: /RTC_CAPABILITY_NEGOTIATION_STATUSES/, label: 'verification of capability negotiation status catalog contract' },
      { pattern: /RTC_CAPABILITY_NEGOTIATION_RULES/, label: 'verification of capability negotiation rule catalog contract' },
      { pattern: /resolveRtcCapabilityNegotiationStatus/, label: 'verification of capability negotiation resolver contract' },
      { pattern: /RTC_RUNTIME_SURFACE_METHODS/, label: 'verification of runtime surface method catalog contract' },
      {
        pattern: /RTC_RUNTIME_SURFACE_FAILURE_CODE/,
        label: 'verification of runtime surface failure code contract',
      },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_STANDARD/,
        label: 'verification of runtime immutability standard contract',
      },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM/,
        label: 'verification of runtime immutability frozen-term contract',
      },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM/,
        label: 'verification of runtime immutability snapshot-term contract',
      },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM/,
        label: 'verification of runtime immutability controller-context contract',
      },
      {
        pattern: /RTC_ROOT_PUBLIC_SURFACE_STANDARD/,
        label: 'verification of root public surface standard contract',
      },
      {
        pattern: /RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS/,
        label: 'verification of root public surface provider-neutral export path contract',
      },
      {
        pattern: /RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS/,
        label: 'verification of root public surface reserved entrypoint contract',
      },
      { pattern: /root-public-surface\.ts/, label: 'verification of root public surface module contract' },
      {
        pattern: /RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM/,
        label: 'verification of runtime immutability native-client contract',
      },
      { pattern: /RTC_SDK_ERROR_CODES/, label: 'verification of rtc sdk error catalog contract' },
      { pattern: /RTC_SDK_ERROR_FALLBACK_CODE/, label: 'verification of rtc sdk error fallback contract' },
      { pattern: /vendor_error/, label: 'verification of rtc sdk canonical fallback error contract' },
      { pattern: /resolveRtcProviderSupportStatus/, label: 'verification of provider support status helper contract' },
      { pattern: /createRtcProviderSupportState/, label: 'verification of provider support state helper contract' },
      { pattern: /root-public-builtin/, label: 'verification of language provider root-public-builtin contract' },
      { pattern: /package-boundary/, label: 'verification of language provider package-boundary contract' },
      { pattern: /control-metadata-only/, label: 'verification of language provider control-metadata-only contract' },
      { pattern: /capabilityCatalog/, label: 'verification of capability catalog contract' },
      { pattern: /providerExtensionCatalog/, label: 'verification of provider extension catalog contract' },
      { pattern: /cross-surface/, label: 'verification of cross-surface capability contract' },
      { pattern: /capability negotiation/i, label: 'verification of capability negotiation contract' },
      { pattern: /degraded/i, label: 'verification of degraded capability contract' },
      { pattern: /unsupported/i, label: 'verification of unsupported capability contract' },
      { pattern: /runtime-frozen/i, label: 'verification of runtime-frozen TypeScript metadata contract' },
      { pattern: /immutable snapshots/i, label: 'verification of runtime immutable snapshot contract' },
      {
        pattern: /shallow-immutable-context/i,
        label: 'verification of runtime controller shallow-immutable context contract',
      },
      {
        pattern: /metadata references/i,
        label: 'verification of provider driver metadata snapshot contract',
      },
      {
        pattern: /mutable-native-client/i,
        label: 'verification of runtime controller mutable native client contract',
      },
      { pattern: /registerRtcProviderModules/, label: 'verification of batch provider module registration contract' },
      { pattern: /provider_module_contract_mismatch/, label: 'verification of provider module contract mismatch error' },
      { pattern: /atomic/i, label: 'verification of atomic batch provider module registration contract' },
      { pattern: /getBuiltinRtcProviderMetadataByKey/, label: 'verification of builtin provider lookup helper contract' },
      { pattern: /getOfficialRtcProviderMetadataByKey/, label: 'verification of official provider lookup helper contract' },
      { pattern: /getRtcProviderByProviderKey/, label: 'verification of provider catalog lookup helper alias contract' },
      { pattern: /unwrap-only/, label: 'verification of unwrap-only provider extension access contract' },
      { pattern: /extension-object/, label: 'verification of extension-object provider extension access contract' },
      { pattern: /sdk-call-smoke\.mjs/, label: 'verification of fast public call smoke entrypoint' },
      { pattern: /smoke-sdk\.mjs/, label: 'verification of full regression smoke entrypoint' },
      { pattern: /compileall/i, label: 'verification of python smoke compile command' },
      { pattern: /flutter analyze/i, label: 'verification of flutter smoke analyze command' },
      { pattern: /cargo check/i, label: 'verification of rust smoke compile command' },
      { pattern: /go build/i, label: 'verification of go smoke build command' },
      { pattern: /dotnet build/i, label: 'verification of csharp smoke build command' },
      { pattern: /javac/i, label: 'verification of java smoke compile command' },
      { pattern: /swift build/i, label: 'verification of swift smoke build command' },
      { pattern: /kotlinc/i, label: 'verification of kotlin smoke compile command' },
      { pattern: /\.gitignore/, label: 'verification of workspace gitignore contract' },
      { pattern: /sdkwork-rtc-sdk-typescript\/dist\//, label: 'verification of typescript dist artifact contract' },
      { pattern: /sdkwork-rtc-sdk-rust\/target\//, label: 'verification of rust target artifact contract' },
      { pattern: /sdkwork-rtc-sdk-java\/target\//, label: 'verification of java target artifact contract' },
      { pattern: /__pycache__/, label: 'verification of python pycache artifact contract' },
      { pattern: /\.sdkwork-assembly\.json/, label: 'verification of assembly source-of-truth contract' },
    ],
  },
];
const REQUIRED_SCRIPT_CLAUSES = [
  {
    relativePath: 'bin/rtc-call-smoke-standard.mjs',
    clauses: [
      {
        pattern: /RTC_CALL_SMOKE_REUSE_LIVE_CONNECTION_VARIANT/,
        label: 'shared live connection smoke variant descriptor',
      },
      {
        pattern: /buildRtcRootCallSmokeSteps/,
        label: 'shared root smoke step builder',
      },
      {
        pattern: /renderRtcCallSmokeForwardedVariantHelp/,
        label: 'shared dispatcher forwarded variant help renderer',
      },
    ],
  },
  {
    relativePath: 'bin/materialize-sdk.mjs',
    clauses: [
      {
        pattern: /rtc-call-smoke-standard\.mjs/,
        label: 'shared rtc smoke standard helper import',
      },
      {
        pattern: /renderRtcRootCallSmokeCommandVariants/,
        label: 'shared root call smoke command variant renderer usage',
      },
    ],
  },
  {
    relativePath: 'bin/smoke-sdk.mjs',
    clauses: [
      {
        pattern: /rtc-call-smoke-standard\.mjs/,
        label: 'shared rtc smoke standard helper import',
      },
      {
        pattern: /buildRtcRootCallSmokeSteps/,
        label: 'shared root smoke step builder usage',
      },
    ],
  },
  {
    relativePath: 'bin/sdk-call-smoke.mjs',
    clauses: [
      {
        pattern: /rtc-call-smoke-standard\.mjs/,
        label: 'shared rtc smoke standard helper import',
      },
      {
        pattern: /renderRtcCallSmokeForwardedVariantHelp/,
        label: 'shared dispatcher forwarded variant help usage',
      },
    ],
  },
];

function assertReservedLanguageToken(language, content, token, message) {
  if (!matchesReservedLanguageToken(language, content, token)) {
    fail(message);
  }
}

function assertRequiredTerms(content, terms, label) {
  for (const term of terms) {
    if (!new RegExp(escapeRegExp(term)).test(content)) {
      fail(`${label} is missing required term: ${term}`);
    }
  }
}

function assertExactNormalizedTerms(actualValues, expectedValues, label) {
  const actual = normalizeStringArray(actualValues);
  const expected = normalizeStringArray(expectedValues);
  if (actual.length !== expected.length || actual.some((term, index) => term !== expected[index])) {
    fail(
      `${label} must be exactly [${renderNormalizedStringArray(expected)}], received [${renderNormalizedStringArray(actual)}]`,
    );
  }
}

function assertNoLegacyTypeScriptProviderPackageBoundaryTerms(content, label) {
  for (const term of LEGACY_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_TERMS) {
    if (new RegExp(escapeRegExp(term), 'i').test(content)) {
      fail(`${label} uses legacy TypeScript provider package boundary wording: ${term}`);
    }
  }
}

function assertLanguageWorkspaceProviderPackageBoundaryContent(languageEntry, content, label) {
  if (!new RegExp(escapeRegExp(languageEntry.providerPackageBoundary.mode)).test(content)) {
    fail(`${label} is missing providerPackageBoundary.mode for ${languageEntry.language}`);
  }

  if (!new RegExp(escapeRegExp(languageEntry.providerPackageBoundary.rootPublicPolicy)).test(content)) {
    fail(`${label} is missing providerPackageBoundary.rootPublicPolicy for ${languageEntry.language}`);
  }

  assertRequiredTerms(
    content,
    languageEntry.providerPackageBoundary.lifecycleStatusTerms,
    `${label} providerPackageBoundary.lifecycleStatusTerms`,
  );
  assertRequiredTerms(
    content,
    languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms,
    `${label} providerPackageBoundary.runtimeBridgeStatusTerms`,
  );
}

function assertLanguageWorkspaceProviderSelectionContractContent(language, contract, content, label) {
  if (!contract) {
    fail(`${label} is missing providerSelectionContract for ${language}`);
  }

  assertRequiredTerms(
    content,
    contract.sourceTerms,
    `${label} providerSelectionContract.sourceTerms`,
  );
  assertRequiredTerms(
    content,
    contract.precedence,
    `${label} providerSelectionContract.precedence`,
  );

  if (!new RegExp(escapeRegExp(contract.defaultSource)).test(content)) {
    fail(`${label} is missing providerSelectionContract.defaultSource for ${language}`);
  }
}

function assertLanguageWorkspaceProviderSupportContractContent(language, contract, content, label) {
  if (!contract) {
    fail(`${label} is missing providerSupportContract for ${language}`);
  }

  assertRequiredTerms(
    content,
    contract.statusTerms,
    `${label} providerSupportContract.statusTerms`,
  );
}

function assertLanguageWorkspaceProviderActivationContractContent(language, contract, content, label) {
  if (!contract) {
    fail(`${label} is missing providerActivationContract for ${language}`);
  }

  assertRequiredTerms(
    content,
    contract.statusTerms,
    `${label} providerActivationContract.statusTerms`,
  );
}

function assertLanguageWorkspaceRuntimeBaselineContent(language, runtimeBaseline, content, label) {
  if (!runtimeBaseline) {
    fail(`${label} is missing runtimeBaseline for ${language}`);
  }

  for (const value of [
    runtimeBaseline.vendorSdkPackage,
    runtimeBaseline.vendorSdkImportPath,
    runtimeBaseline.signalingSdkPackage,
    runtimeBaseline.signalingSdkImportPath,
    runtimeBaseline.recommendedEntrypoint,
    runtimeBaseline.smokeCommand,
    runtimeBaseline.smokeMode,
  ]) {
    if (!new RegExp(escapeRegExp(value)).test(content)) {
      fail(`${label} is missing runtimeBaseline value for ${language}: ${value}`);
    }
  }

  for (const smokeVariant of runtimeBaseline.smokeVariants ?? []) {
    if (!new RegExp(escapeRegExp(smokeVariant)).test(content)) {
      fail(`${label} is missing runtimeBaseline smoke variant for ${language}: ${smokeVariant}`);
    }
  }
}

function assertLanguageWorkspaceRuntimeDocumentationContent(
  language,
  runtimeDocumentation,
  content,
  label,
) {
  if (!runtimeDocumentation) {
    fail(`${label} is missing runtimeDocumentation for ${language}`);
  }

  for (const value of [
    runtimeDocumentation.baselineConclusion,
    runtimeDocumentation.guideTitle,
    runtimeDocumentation.runtimeLabel,
    runtimeDocumentation.detailedGuidePath,
    runtimeDocumentation.detailedGuideLabel,
    runtimeDocumentation.smokeNarrative,
  ]) {
    if (!new RegExp(escapeRegExp(value)).test(content)) {
      fail(`${label} is missing runtimeDocumentation value for ${language}: ${value}`);
    }
  }
}

function extractYamlSectionTopLevelKeys(content, sectionName) {
  const keys = new Set();
  const lines = content.split(/\r?\n/);
  let inSection = false;
  let sectionIndent = 0;

  for (const line of lines) {
    const sectionMatch = line.match(new RegExp(`^(\\s*)${escapeRegExp(sectionName)}:\\s*$`));

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

function assertTypeScriptRuntimeBaselineManifest(languageEntry, workspaceRoot) {
  const manifestPath = path.join(workspaceRoot, languageEntry.workspace, 'package.json');

  if (!existsSync(manifestPath)) {
    fail(`Missing TypeScript workspace manifest: ${languageEntry.workspace}/package.json`);
  }

  const manifest = readJsonFile(manifestPath);
  const peerDependencies = manifest.peerDependencies;
  const peerDependenciesMeta = manifest.peerDependenciesMeta;

  if (!peerDependencies || typeof peerDependencies !== 'object' || Array.isArray(peerDependencies)) {
    fail('TypeScript workspace manifest must declare peerDependencies');
  }

  if (
    !peerDependenciesMeta ||
    typeof peerDependenciesMeta !== 'object' ||
    Array.isArray(peerDependenciesMeta)
  ) {
    fail('TypeScript workspace manifest must declare peerDependenciesMeta');
  }

  const externalRuntimePackages = [
    languageEntry.runtimeBaseline.vendorSdkPackage,
    ...(languageEntry.runtimeBaseline.signalingSdkPackage === languageEntry.publicPackage
      ? []
      : [languageEntry.runtimeBaseline.signalingSdkPackage]),
  ];

  for (const packageName of externalRuntimePackages) {
    if (typeof peerDependencies[packageName] !== 'string' || peerDependencies[packageName].length === 0) {
      fail(`TypeScript workspace manifest must declare peer dependency for runtimeBaseline package ${packageName}`);
    }

    if (peerDependenciesMeta[packageName]?.optional !== true) {
      fail(`TypeScript workspace manifest must mark runtimeBaseline peer dependency as optional: ${packageName}`);
    }
  }
}

function assertFlutterRuntimeBaselineManifest(languageEntry, workspaceRoot) {
  const manifestPath = path.join(workspaceRoot, languageEntry.workspace, 'pubspec.yaml');

  if (!existsSync(manifestPath)) {
    fail(`Missing Flutter workspace manifest: ${languageEntry.workspace}/pubspec.yaml`);
  }

  const manifestContent = readFileSync(manifestPath, 'utf8');
  const dependencyKeys = extractYamlSectionTopLevelKeys(manifestContent, 'dependencies');

  const externalRuntimePackages = [
    languageEntry.runtimeBaseline.vendorSdkPackage,
    ...(languageEntry.runtimeBaseline.signalingSdkPackage === languageEntry.publicPackage
      ? []
      : [languageEntry.runtimeBaseline.signalingSdkPackage]),
  ];

  for (const packageName of externalRuntimePackages) {
    if (!dependencyKeys.has(packageName)) {
      fail(`Flutter workspace manifest must declare dependency for runtimeBaseline package ${packageName}`);
    }
  }
}

function assertExecutableLanguageRuntimeBaselineManifest(languageEntry, workspaceRoot) {
  switch (languageEntry.language) {
    case 'typescript':
      assertTypeScriptRuntimeBaselineManifest(languageEntry, workspaceRoot);
      return;
    case 'flutter':
      assertFlutterRuntimeBaselineManifest(languageEntry, workspaceRoot);
      return;
    default:
      fail(`Unsupported executable runtimeBaseline manifest verifier for ${languageEntry.language}`);
  }
}

function assertLanguageWorkspaceProviderPackageBoundaryContractContent(
  language,
  contract,
  content,
  label,
) {
  if (!contract) {
    fail(`${label} is missing providerPackageBoundaryContract for ${language}`);
  }

  assertRequiredTerms(
    content,
    contract.modeTerms,
    `${label} providerPackageBoundaryContract.modeTerms`,
  );
  assertRequiredTerms(
    content,
    contract.rootPublicPolicyTerms,
    `${label} providerPackageBoundaryContract.rootPublicPolicyTerms`,
  );
  assertRequiredTerms(
    content,
    contract.lifecycleStatusTerms,
    `${label} providerPackageBoundaryContract.lifecycleStatusTerms`,
  );
  assertRequiredTerms(
    content,
    contract.runtimeBridgeStatusTerms,
    `${label} providerPackageBoundaryContract.runtimeBridgeStatusTerms`,
  );
}

function renderNormalizedStringArray(values) {
  return normalizeStringArray(values).join(', ');
}


export function verifyRtcSdkWorkspace(workspaceRoot) {
  const requiredFiles = [
    ...RTC_ROOT_REQUIRED_CONTRACT_FILES,
    'bin/materialize-sdk.mjs',
    'bin/materialize-sdk.ps1',
    'bin/materialize-sdk.sh',
    'bin/smoke-sdk.mjs',
    'bin/smoke-sdk.ps1',
    'bin/smoke-sdk.sh',
  ];

  for (const relativePath of requiredFiles) {
    const fullPath = path.join(workspaceRoot, relativePath);
    if (!existsSync(fullPath)) {
      fail(`Missing required file: ${relativePath}`);
    }
  }

  for (const documentRule of REQUIRED_DOCUMENTATION_CLAUSES) {
    const content = readFileSync(path.join(workspaceRoot, documentRule.relativePath), 'utf8');
    for (const clause of documentRule.clauses) {
      if (!clause.pattern.test(content)) {
        fail(
          `Missing required documentation clause in ${documentRule.relativePath}: ${clause.label}`,
        );
      }
    }
  }

  for (const scriptRule of REQUIRED_SCRIPT_CLAUSES) {
    const content = readFileSync(path.join(workspaceRoot, scriptRule.relativePath), 'utf8');
    for (const clause of scriptRule.clauses) {
      if (!clause.pattern.test(content)) {
        fail(`Missing required script clause in ${scriptRule.relativePath}: ${clause.label}`);
      }
    }
  }

  const gitignoreContent = readFileSync(path.join(workspaceRoot, '.gitignore'), 'utf8');
  for (const requiredPattern of REQUIRED_GITIGNORE_PATTERNS) {
    if (!gitignoreContent.includes(requiredPattern)) {
      fail(`Missing required .gitignore pattern: ${requiredPattern}`);
    }
  }
  for (const forbiddenPattern of FORBIDDEN_GITIGNORE_PATTERNS) {
    if (gitignoreContent.includes(forbiddenPattern)) {
      fail(`Forbidden .gitignore pattern detected: ${forbiddenPattern}`);
    }
  }

  const assemblyPath = path.join(workspaceRoot, '.sdkwork-assembly.json');
  const assembly = readJsonFile(assemblyPath);
  const {
    officialLanguages,
    providers,
    providerSelectionStandard,
    providerSupportStandard,
    capabilityStandard,
    capabilityNegotiationStandard,
    runtimeSurfaceStandard,
    signalingTransportStandard,
    runtimeImmutabilityStandard,
    rootPublicSurfaceStandard,
    lookupHelperNamingStandard,
    errorCodeStandard,
    providerExtensionStandard,
    providerActivationStandard,
    providerPackageBoundaryStandard,
    providerTierStandard,
    languageMaturityStandard,
    typescriptAdapterStandard,
    typescriptPackageStandard,
  } = assertRtcAssemblyWorkspaceBaseline(assembly);
  const officialProviderKeys = providers.map((provider) => provider.providerKey);
  const providerByKey = new Map(providers.map((provider) => [provider.providerKey, provider]));
  const usageGuideContent = readFileSync(path.join(workspaceRoot, 'docs', 'usage-guide.md'), 'utf8');
  const typescriptRuntimeUsageContent = readFileSync(
    path.join(workspaceRoot, 'docs', 'typescript-volcengine-signaling-usage.md'),
    'utf8',
  );
  const flutterRuntimeUsageContent = readFileSync(
    path.join(workspaceRoot, 'docs', 'flutter-volcengine-signaling-usage.md'),
    'utf8',
  );
  const capabilityCatalog = assembly.capabilityCatalog ?? [];
  const providerExtensionCatalog = assembly.providerExtensionCatalog ?? [];
  const capabilityDescriptorByKey = new Map();
  const providerExtensionDescriptorByKey = new Map();

  for (const defaultValue of [
    assembly.defaults?.providerKey ?? '',
    assembly.defaults?.pluginId ?? '',
    assembly.defaults?.driverId ?? '',
  ]) {
    if (defaultValue && !new RegExp(escapeRegExp(defaultValue)).test(usageGuideContent)) {
      fail(`Usage guide is missing default contract value: ${defaultValue}`);
    }
  }

  for (const languageEntry of officialLanguages.filter((entry) => entry.runtimeBaseline)) {
    assertLanguageWorkspaceRuntimeBaselineContent(
      languageEntry.language,
      languageEntry.runtimeBaseline,
      usageGuideContent,
      'docs/usage-guide.md',
    );
    assertLanguageWorkspaceRuntimeDocumentationContent(
      languageEntry.language,
      languageEntry.runtimeDocumentation,
      usageGuideContent,
      'docs/usage-guide.md',
    );
  }

  const typescriptLanguageEntry = officialLanguages.find((entry) => entry.language === 'typescript');
  if (typescriptLanguageEntry?.runtimeBaseline) {
    assertLanguageWorkspaceRuntimeBaselineContent(
      typescriptLanguageEntry.language,
      typescriptLanguageEntry.runtimeBaseline,
      typescriptRuntimeUsageContent,
      'docs/typescript-volcengine-signaling-usage.md',
    );
  }

  const flutterLanguageEntry = officialLanguages.find((entry) => entry.language === 'flutter');
  if (flutterLanguageEntry?.runtimeBaseline) {
    assertLanguageWorkspaceRuntimeBaselineContent(
      flutterLanguageEntry.language,
      flutterLanguageEntry.runtimeBaseline,
      flutterRuntimeUsageContent,
      'docs/flutter-volcengine-signaling-usage.md',
    );
  }

  if (!Array.isArray(capabilityCatalog) || capabilityCatalog.length === 0) {
    fail('capabilityCatalog must declare the workspace capability descriptors');
  }

  for (const descriptor of capabilityCatalog) {
    if (typeof descriptor.capabilityKey !== 'string' || descriptor.capabilityKey.length === 0) {
      fail('Capability descriptor capabilityKey must be declared');
    }

    if (capabilityDescriptorByKey.has(descriptor.capabilityKey)) {
      fail(`Capability descriptor capabilityKey must be unique: ${descriptor.capabilityKey}`);
    }
    capabilityDescriptorByKey.set(descriptor.capabilityKey, descriptor);

    if (typeof descriptor.category !== 'string' || descriptor.category.length === 0) {
      fail(`Capability descriptor category must be declared for ${descriptor.capabilityKey}`);
    }

    if (!capabilityStandard.categoryTerms.includes(descriptor.category)) {
      fail(`Capability descriptor category is not recognized for ${descriptor.capabilityKey}`);
    }

    if (typeof descriptor.surface !== 'string' || descriptor.surface.length === 0) {
      fail(`Capability descriptor surface must be declared for ${descriptor.capabilityKey}`);
    }

    if (!capabilityStandard.surfaceTerms.includes(descriptor.surface)) {
      fail(`Capability descriptor surface is not recognized for ${descriptor.capabilityKey}`);
    }
  }

  const declaredProviderCapabilities = [
    ...new Set(
      providers.flatMap((provider) => [
        ...(provider.requiredCapabilities ?? []),
        ...(provider.optionalCapabilities ?? []),
      ]),
    ),
  ].sort();
  const declaredCapabilityCatalogKeys = [...capabilityDescriptorByKey.keys()].sort();

  if (JSON.stringify(declaredCapabilityCatalogKeys) !== JSON.stringify(declaredProviderCapabilities)) {
    fail('capabilityCatalog must exactly cover the workspace provider capability set');
  }

  if (!Array.isArray(providerExtensionCatalog) || providerExtensionCatalog.length === 0) {
    fail('providerExtensionCatalog must declare the workspace provider extension descriptors');
  }

  for (const descriptor of providerExtensionCatalog) {
    if (typeof descriptor.extensionKey !== 'string' || descriptor.extensionKey.length === 0) {
      fail('Provider extension descriptor extensionKey must be declared');
    }

    if (providerExtensionDescriptorByKey.has(descriptor.extensionKey)) {
      fail(`Provider extension descriptor extensionKey must be unique: ${descriptor.extensionKey}`);
    }
    providerExtensionDescriptorByKey.set(descriptor.extensionKey, descriptor);

    if (typeof descriptor.providerKey !== 'string' || descriptor.providerKey.length === 0) {
      fail(`Provider extension descriptor providerKey must be declared for ${descriptor.extensionKey}`);
    }

    if (!providerByKey.has(descriptor.providerKey)) {
      fail(`Provider extension descriptor providerKey must exist in the provider catalog: ${descriptor.extensionKey}`);
    }

    if (typeof descriptor.displayName !== 'string' || descriptor.displayName.length === 0) {
      fail(`Provider extension descriptor displayName must be declared for ${descriptor.extensionKey}`);
    }

    if (typeof descriptor.surface !== 'string' || descriptor.surface.length === 0) {
      fail(`Provider extension descriptor surface must be declared for ${descriptor.extensionKey}`);
    }

    if (!capabilityStandard.surfaceTerms.includes(descriptor.surface)) {
      fail(`Provider extension descriptor surface is not recognized for ${descriptor.extensionKey}`);
    }

    if (typeof descriptor.access !== 'string' || descriptor.access.length === 0) {
      fail(`Provider extension descriptor access must be declared for ${descriptor.extensionKey}`);
    }

    if (!providerExtensionStandard.accessTerms.includes(descriptor.access)) {
      fail(`Provider extension descriptor access is not recognized for ${descriptor.extensionKey}`);
    }

    if (typeof descriptor.status !== 'string' || descriptor.status.length === 0) {
      fail(`Provider extension descriptor status must be declared for ${descriptor.extensionKey}`);
    }

    if (!providerExtensionStandard.statusTerms.includes(descriptor.status)) {
      fail(`Provider extension descriptor status is not recognized for ${descriptor.extensionKey}`);
    }
  }

  if (
    !Array.isArray(providerSelectionStandard?.sourceTerms) ||
    providerSelectionStandard.sourceTerms.length === 0
  ) {
    fail('providerSelectionStandard.sourceTerms must be a non-empty array');
  }

  if (
    !Array.isArray(providerSelectionStandard?.precedence) ||
    providerSelectionStandard.precedence.length === 0
  ) {
    fail('providerSelectionStandard.precedence must be a non-empty array');
  }

  assertExactNormalizedTerms(
    providerSelectionStandard.sourceTerms,
    RTC_PROVIDER_SELECTION_SOURCES,
    'Assembly providerSelectionStandard.sourceTerms',
  );
  assertExactNormalizedTerms(
    providerSelectionStandard.precedence,
    RTC_PROVIDER_SELECTION_SOURCES,
    'Assembly providerSelectionStandard.precedence',
  );

  const canonicalDefaultSelectionSource =
    RTC_PROVIDER_SELECTION_SOURCES[RTC_PROVIDER_SELECTION_SOURCES.length - 1];
  if (providerSelectionStandard.defaultSource !== canonicalDefaultSelectionSource) {
    fail(
      `Assembly providerSelectionStandard.defaultSource must be ${canonicalDefaultSelectionSource}`,
    );
  }

  if (
    !Array.isArray(providerSupportStandard?.statusTerms) ||
    providerSupportStandard.statusTerms.length === 0
  ) {
    fail('providerSupportStandard.statusTerms must be a non-empty array');
  }

  assertExactNormalizedTerms(
    providerSupportStandard.statusTerms,
    RTC_PROVIDER_SUPPORT_STATUSES,
    'Assembly providerSupportStandard.statusTerms',
  );

  if (
    !Array.isArray(capabilityStandard?.categoryTerms) ||
    capabilityStandard.categoryTerms.length === 0
  ) {
    fail('capabilityStandard.categoryTerms must be a non-empty array');
  }

  if (
    !Array.isArray(capabilityStandard?.surfaceTerms) ||
    capabilityStandard.surfaceTerms.length === 0
  ) {
    fail('capabilityStandard.surfaceTerms must be a non-empty array');
  }

  assertExactNormalizedTerms(
    capabilityStandard.categoryTerms,
    RTC_CAPABILITY_CATEGORIES,
    'Assembly capabilityStandard.categoryTerms',
  );
  assertExactNormalizedTerms(
    capabilityStandard.surfaceTerms,
    RTC_CAPABILITY_SURFACES,
    'Assembly capabilityStandard.surfaceTerms',
  );

  if (
    !Array.isArray(capabilityNegotiationStandard?.statusTerms) ||
    capabilityNegotiationStandard.statusTerms.length === 0
  ) {
    fail('capabilityNegotiationStandard.statusTerms must be a non-empty array');
  }

  assertExactNormalizedTerms(
    capabilityNegotiationStandard.statusTerms,
    RTC_CAPABILITY_NEGOTIATION_STATUSES,
    'Assembly capabilityNegotiationStandard.statusTerms',
  );

  if (
    JSON.stringify(capabilityNegotiationStandard?.statusRules ?? {}) !==
    JSON.stringify(RTC_CAPABILITY_NEGOTIATION_RULES)
  ) {
    fail('capabilityNegotiationStandard.statusRules must exactly match the canonical negotiation rules');
  }

  if (
    !Array.isArray(runtimeSurfaceStandard?.methodTerms) ||
    runtimeSurfaceStandard.methodTerms.length === 0
  ) {
    fail('runtimeSurfaceStandard.methodTerms must be a non-empty array');
  }

  assertExactNormalizedTerms(
    runtimeSurfaceStandard.methodTerms,
    RTC_RUNTIME_SURFACE_METHODS,
    'Assembly runtimeSurfaceStandard.methodTerms',
  );

  if (runtimeSurfaceStandard.failureCode !== RTC_RUNTIME_SURFACE_FAILURE_CODE) {
    fail(
      `runtimeSurfaceStandard.failureCode must be ${RTC_RUNTIME_SURFACE_FAILURE_CODE}`,
    );
  }

  if (
    JSON.stringify(signalingTransportStandard ?? {}) !==
    JSON.stringify(DEFAULT_SIGNALING_TRANSPORT_STANDARD)
  ) {
    fail(
      'signalingTransportStandard must exactly match the canonical WebSocket signaling transport contract',
    );
  }

  if (runtimeImmutabilityStandard?.frozenTerm !== RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM) {
    fail(
      `runtimeImmutabilityStandard.frozenTerm must be ${RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM}`,
    );
  }

  if (runtimeImmutabilityStandard?.snapshotTerm !== RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM) {
    fail(
      `runtimeImmutabilityStandard.snapshotTerm must be ${RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM}`,
    );
  }

  if (
    runtimeImmutabilityStandard?.controllerContextTerm !==
    RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM
  ) {
    fail(
      `runtimeImmutabilityStandard.controllerContextTerm must be ${RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM}`,
    );
  }

  if (
    runtimeImmutabilityStandard?.nativeClientTerm !== RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM
  ) {
    fail(
      `runtimeImmutabilityStandard.nativeClientTerm must be ${RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM}`,
    );
  }

  if (
    JSON.stringify(rootPublicSurfaceStandard ?? {}) !==
    JSON.stringify(DEFAULT_ROOT_PUBLIC_SURFACE_STANDARD)
  ) {
    fail(
      'rootPublicSurfaceStandard must exactly match the canonical root public surface contract',
    );
  }

  if (
    JSON.stringify(lookupHelperNamingStandard ?? {}) !==
    JSON.stringify(DEFAULT_LOOKUP_HELPER_NAMING_STANDARD)
  ) {
    fail(
      'lookupHelperNamingStandard must exactly match the canonical lookup helper naming contract',
    );
  }

  if (!errorCodeStandard?.codeTerms?.includes(runtimeSurfaceStandard.failureCode)) {
    fail('runtimeSurfaceStandard.failureCode must also be declared in errorCodeStandard.codeTerms');
  }

  if (!Array.isArray(errorCodeStandard?.codeTerms) || errorCodeStandard.codeTerms.length === 0) {
    fail('errorCodeStandard.codeTerms must be a non-empty array');
  }

  assertExactNormalizedTerms(
    errorCodeStandard.codeTerms,
    RTC_SDK_ERROR_CODES,
    'Assembly errorCodeStandard.codeTerms',
  );

  if (errorCodeStandard.fallbackCode !== RTC_SDK_ERROR_FALLBACK_CODE) {
    fail(
      `errorCodeStandard.fallbackCode must be ${RTC_SDK_ERROR_FALLBACK_CODE}`,
    );
  }

  if (
    !Array.isArray(providerExtensionStandard?.accessTerms) ||
    providerExtensionStandard.accessTerms.length === 0
  ) {
    fail('providerExtensionStandard.accessTerms must be a non-empty array');
  }

  if (
    !Array.isArray(providerExtensionStandard?.statusTerms) ||
    providerExtensionStandard.statusTerms.length === 0
  ) {
    fail('providerExtensionStandard.statusTerms must be a non-empty array');
  }

  assertExactNormalizedTerms(
    providerExtensionStandard.accessTerms,
    RTC_PROVIDER_EXTENSION_ACCESSES,
    'Assembly providerExtensionStandard.accessTerms',
  );
  assertExactNormalizedTerms(
    providerExtensionStandard.statusTerms,
    RTC_PROVIDER_EXTENSION_STATUSES,
    'Assembly providerExtensionStandard.statusTerms',
  );

  if (
    !Array.isArray(providerActivationStandard?.statusTerms) ||
    providerActivationStandard.statusTerms.length === 0
  ) {
    fail('providerActivationStandard.statusTerms must be a non-empty array');
  }

  assertExactNormalizedTerms(
    providerActivationStandard.statusTerms,
    RTC_PROVIDER_ACTIVATION_STATUSES,
    'Assembly providerActivationStandard.statusTerms',
  );

  if (
    !Array.isArray(providerPackageBoundaryStandard?.modeTerms) ||
    providerPackageBoundaryStandard.modeTerms.length === 0
  ) {
    fail('providerPackageBoundaryStandard.modeTerms must be a non-empty array');
  }
  if (
    !Array.isArray(providerPackageBoundaryStandard?.rootPublicPolicyTerms) ||
    providerPackageBoundaryStandard.rootPublicPolicyTerms.length === 0
  ) {
    fail('providerPackageBoundaryStandard.rootPublicPolicyTerms must be a non-empty array');
  }
  if (
    !Array.isArray(providerPackageBoundaryStandard?.lifecycleStatusTerms) ||
    providerPackageBoundaryStandard.lifecycleStatusTerms.length === 0
  ) {
    fail('providerPackageBoundaryStandard.lifecycleStatusTerms must be a non-empty array');
  }
  if (
    !Array.isArray(providerPackageBoundaryStandard?.runtimeBridgeStatusTerms) ||
    providerPackageBoundaryStandard.runtimeBridgeStatusTerms.length === 0
  ) {
    fail('providerPackageBoundaryStandard.runtimeBridgeStatusTerms must be a non-empty array');
  }

  assertExactNormalizedTerms(
    providerPackageBoundaryStandard.modeTerms,
    RTC_PROVIDER_PACKAGE_BOUNDARY_MODES,
    'Assembly providerPackageBoundaryStandard.modeTerms',
  );
  assertExactNormalizedTerms(
    providerPackageBoundaryStandard.rootPublicPolicyTerms,
    RTC_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES,
    'Assembly providerPackageBoundaryStandard.rootPublicPolicyTerms',
  );
  assertExactNormalizedTerms(
    providerPackageBoundaryStandard.lifecycleStatusTerms,
    RTC_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS,
    'Assembly providerPackageBoundaryStandard.lifecycleStatusTerms',
  );
  assertExactNormalizedTerms(
    providerPackageBoundaryStandard.runtimeBridgeStatusTerms,
    RTC_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS,
    'Assembly providerPackageBoundaryStandard.runtimeBridgeStatusTerms',
  );

  if (
    JSON.stringify(providerPackageBoundaryStandard?.profiles ?? {}) !==
    JSON.stringify(RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES)
  ) {
    fail('providerPackageBoundaryStandard.profiles must exactly match the canonical profile map');
  }

  if (
    !Array.isArray(providerTierStandard?.tierTerms) ||
    providerTierStandard.tierTerms.length === 0
  ) {
    fail('providerTierStandard.tierTerms must be a non-empty array');
  }

  assertExactNormalizedTerms(
    providerTierStandard.tierTerms,
    RTC_PROVIDER_TIERS,
    'Assembly providerTierStandard.tierTerms',
  );

  if (
    JSON.stringify(providerTierStandard?.tierSummaries ?? {}) !==
    JSON.stringify(RTC_PROVIDER_TIER_SUMMARIES)
  ) {
    fail('providerTierStandard.tierSummaries must exactly match the canonical tier summaries');
  }

  if (
    !Array.isArray(languageMaturityStandard?.tierTerms) ||
    languageMaturityStandard.tierTerms.length === 0
  ) {
    fail('languageMaturityStandard.tierTerms must be a non-empty array');
  }

  assertExactNormalizedTerms(
    languageMaturityStandard.tierTerms,
    RTC_LANGUAGE_MATURITY_TIERS,
    'Assembly languageMaturityStandard.tierTerms',
  );

  if (
    JSON.stringify(languageMaturityStandard?.tierSummaries ?? {}) !==
    JSON.stringify(RTC_LANGUAGE_MATURITY_TIER_SUMMARIES)
  ) {
    fail(
      'languageMaturityStandard.tierSummaries must exactly match the canonical maturity summaries',
    );
  }

  if (
    !Array.isArray(typescriptAdapterStandard?.sdkProvisioningTerms) ||
    typescriptAdapterStandard.sdkProvisioningTerms.length === 0
  ) {
    fail('typescriptAdapterStandard.sdkProvisioningTerms must be a non-empty array');
  }

  if (
    !Array.isArray(typescriptAdapterStandard?.bindingStrategyTerms) ||
    typescriptAdapterStandard.bindingStrategyTerms.length === 0
  ) {
    fail('typescriptAdapterStandard.bindingStrategyTerms must be a non-empty array');
  }

  if (
    !Array.isArray(typescriptAdapterStandard?.bundlePolicyTerms) ||
    typescriptAdapterStandard.bundlePolicyTerms.length === 0
  ) {
    fail('typescriptAdapterStandard.bundlePolicyTerms must be a non-empty array');
  }

  if (
    !Array.isArray(typescriptAdapterStandard?.runtimeBridgeStatusTerms) ||
    typescriptAdapterStandard.runtimeBridgeStatusTerms.length === 0
  ) {
    fail('typescriptAdapterStandard.runtimeBridgeStatusTerms must be a non-empty array');
  }

  if (
    !Array.isArray(typescriptAdapterStandard?.officialVendorSdkRequirementTerms) ||
    typescriptAdapterStandard.officialVendorSdkRequirementTerms.length === 0
  ) {
    fail('typescriptAdapterStandard.officialVendorSdkRequirementTerms must be a non-empty array');
  }

  assertExactNormalizedTerms(
    typescriptAdapterStandard.sdkProvisioningTerms,
    TYPESCRIPT_ADAPTER_SDK_PROVISIONING_VALUES,
    'Assembly typescriptAdapterStandard.sdkProvisioningTerms',
  );
  assertExactNormalizedTerms(
    typescriptAdapterStandard.bindingStrategyTerms,
    TYPESCRIPT_ADAPTER_BINDING_STRATEGIES,
    'Assembly typescriptAdapterStandard.bindingStrategyTerms',
  );
  assertExactNormalizedTerms(
    typescriptAdapterStandard.bundlePolicyTerms,
    TYPESCRIPT_ADAPTER_BUNDLE_POLICIES,
    'Assembly typescriptAdapterStandard.bundlePolicyTerms',
  );
  assertExactNormalizedTerms(
    typescriptAdapterStandard.runtimeBridgeStatusTerms,
    TYPESCRIPT_ADAPTER_RUNTIME_BRIDGE_STATUSES,
    'Assembly typescriptAdapterStandard.runtimeBridgeStatusTerms',
  );
  assertExactNormalizedTerms(
    typescriptAdapterStandard.officialVendorSdkRequirementTerms,
    TYPESCRIPT_ADAPTER_OFFICIAL_VENDOR_SDK_REQUIREMENTS,
    'Assembly typescriptAdapterStandard.officialVendorSdkRequirementTerms',
  );

  if (
    JSON.stringify(typescriptAdapterStandard?.referenceContract ?? {}) !==
    JSON.stringify(DEFAULT_TYPESCRIPT_ADAPTER_CONTRACT)
  ) {
    fail(
      'typescriptAdapterStandard.referenceContract must exactly match the canonical TypeScript adapter baseline',
    );
  }

  if (
    JSON.stringify(typescriptPackageStandard ?? {}) !==
    JSON.stringify(DEFAULT_TYPESCRIPT_PACKAGE_STANDARD)
  ) {
    fail(
      'typescriptPackageStandard must exactly match the canonical TypeScript package naming standard',
    );
  }

  for (const languageEntry of assembly.languages ?? []) {
    if (typeof languageEntry.displayName !== 'string' || languageEntry.displayName.length === 0) {
      fail(`Language workspace contract displayName must be declared for ${languageEntry.language}`);
    }

    if (
      typeof languageEntry.workspaceCatalogRelativePath !== 'string' ||
      languageEntry.workspaceCatalogRelativePath.length === 0
    ) {
      fail(`Language workspace contract workspaceCatalogRelativePath must be declared for ${languageEntry.language}`);
    }

    if (typeof languageEntry.maturityTier !== 'string' || languageEntry.maturityTier.length === 0) {
      fail(`Language maturityTier must be declared for ${languageEntry.language}`);
    }

    if (!languageMaturityStandard.tierTerms.includes(languageEntry.maturityTier)) {
      fail(`Language maturityTier is not recognized for ${languageEntry.language}: ${languageEntry.maturityTier}`);
    }

    if (typeof languageEntry.currentRole !== 'string' || languageEntry.currentRole.length === 0) {
      fail(`Language workspace contract currentRole must be declared for ${languageEntry.language}`);
    }

    if (typeof languageEntry.workspaceSummary !== 'string' || languageEntry.workspaceSummary.length === 0) {
      fail(`Language workspace contract workspaceSummary must be declared for ${languageEntry.language}`);
    }

    if (!Array.isArray(languageEntry.roleHighlights)) {
      fail(`Language workspace contract roleHighlights must be an array for ${languageEntry.language}`);
    }

    if (typeof languageEntry.providerPackageBoundary?.mode !== 'string') {
      fail(`Language workspace contract providerPackageBoundary.mode must be declared for ${languageEntry.language}`);
    }

    if (
      !KNOWN_LANGUAGE_WORKSPACE_PROVIDER_PACKAGE_BOUNDARY_MODES.includes(
        languageEntry.providerPackageBoundary.mode,
      )
    ) {
      fail(
        `Language workspace contract providerPackageBoundary.mode is not recognized for ${languageEntry.language}: ${languageEntry.providerPackageBoundary.mode}`,
      );
    }

    if (typeof languageEntry.providerPackageBoundary?.rootPublicPolicy !== 'string') {
      fail(
        `Language workspace contract providerPackageBoundary.rootPublicPolicy must be declared for ${languageEntry.language}`,
      );
    }

    if (
      !KNOWN_LANGUAGE_WORKSPACE_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES.includes(
        languageEntry.providerPackageBoundary.rootPublicPolicy,
      )
    ) {
      fail(
        `Language workspace contract providerPackageBoundary.rootPublicPolicy is not recognized for ${languageEntry.language}: ${languageEntry.providerPackageBoundary.rootPublicPolicy}`,
      );
    }

    if (
      !Array.isArray(languageEntry.providerPackageBoundary?.lifecycleStatusTerms) ||
      languageEntry.providerPackageBoundary.lifecycleStatusTerms.length === 0
    ) {
      fail(
        `Language workspace contract providerPackageBoundary.lifecycleStatusTerms must be a non-empty array for ${languageEntry.language}`,
      );
    }

    if (
      !Array.isArray(languageEntry.providerPackageBoundary?.runtimeBridgeStatusTerms) ||
      languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms.length === 0
    ) {
      fail(
        `Language workspace contract providerPackageBoundary.runtimeBridgeStatusTerms must be a non-empty array for ${languageEntry.language}`,
      );
    }

    const declaredProviderPackageBoundaryLifecycleStatusTerms = normalizeStringArray(
      languageEntry.providerPackageBoundary.lifecycleStatusTerms,
    );
    for (const term of declaredProviderPackageBoundaryLifecycleStatusTerms) {
      if (!KNOWN_LANGUAGE_WORKSPACE_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS.includes(term)) {
        fail(
          `Language workspace contract providerPackageBoundary.lifecycleStatusTerms contains an unsupported term for ${languageEntry.language}: ${term}`,
        );
      }
    }

    const declaredProviderPackageBoundaryRuntimeBridgeStatusTerms = normalizeStringArray(
      languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms,
    );
    for (const term of declaredProviderPackageBoundaryRuntimeBridgeStatusTerms) {
      if (
        !KNOWN_LANGUAGE_WORKSPACE_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS.includes(term)
      ) {
        fail(
          `Language workspace contract providerPackageBoundary.runtimeBridgeStatusTerms contains an unsupported term for ${languageEntry.language}: ${term}`,
        );
      }
    }

    if (languageEntry.language === 'typescript') {
      if (languageEntry.providerPackageBoundary.mode !== 'catalog-governed-mixed') {
        fail(
          'TypeScript language workspace providerPackageBoundary.mode must stay catalog-governed-mixed',
        );
      }

      if (languageEntry.providerPackageBoundary.rootPublicPolicy !== 'builtin-only') {
        fail(
          'TypeScript language workspace providerPackageBoundary.rootPublicPolicy must stay builtin-only',
        );
      }

      assertExactNormalizedTerms(
        languageEntry.providerPackageBoundary.lifecycleStatusTerms,
        REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
        'TypeScript language workspace providerPackageBoundary.lifecycleStatusTerms',
      );
      assertExactNormalizedTerms(
        languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms,
        REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS,
        'TypeScript language workspace providerPackageBoundary.runtimeBridgeStatusTerms',
      );

      if (languageEntry.providerPackageScaffold != null) {
        fail('TypeScript language workspace must not declare providerPackageScaffold');
      }

      const roleHighlightsContent = languageEntry.roleHighlights.join('\n');
      assertRequiredTerms(
        roleHighlightsContent,
        REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
        'TypeScript language workspace roleHighlights',
      );
      assertNoLegacyTypeScriptProviderPackageBoundaryTerms(
        roleHighlightsContent,
        'TypeScript language workspace roleHighlights',
      );
    }

    if (!Array.isArray(languageEntry.providerActivations)) {
      fail(`Language workspace contract providerActivations must be an array for ${languageEntry.language}`);
    }

    if (languageEntry.language !== 'typescript') {
      if (languageEntry.providerPackageBoundary.mode !== 'scaffold-per-provider-package') {
        fail(
          `Language workspace contract providerPackageBoundary.mode must stay scaffold-per-provider-package for ${languageEntry.language}`,
        );
      }

      if (languageEntry.providerPackageBoundary.rootPublicPolicy !== 'none') {
        fail(
          `Language workspace contract providerPackageBoundary.rootPublicPolicy must stay none for ${languageEntry.language}`,
        );
      }

      assertExactNormalizedTerms(
        languageEntry.providerPackageBoundary.lifecycleStatusTerms,
        REQUIRED_RESERVED_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
        `Language workspace contract providerPackageBoundary.lifecycleStatusTerms for ${languageEntry.language}`,
      );
      assertExactNormalizedTerms(
        languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms,
        REQUIRED_RESERVED_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS,
        `Language workspace contract providerPackageBoundary.runtimeBridgeStatusTerms for ${languageEntry.language}`,
      );

      if (typeof languageEntry.contractScaffold?.relativePath !== 'string') {
        fail(`Language workspace contract contractScaffold.relativePath must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.contractScaffold?.symbol !== 'string') {
        fail(`Language workspace contract contractScaffold.symbol must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.packageScaffold?.buildSystem !== 'string') {
        fail(`Language workspace contract packageScaffold.buildSystem must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.packageScaffold?.manifestRelativePath !== 'string') {
        fail(`Language workspace contract packageScaffold.manifestRelativePath must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.providerPackageScaffold?.relativePath !== 'string') {
        fail(`Language workspace contract providerPackageScaffold.relativePath must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.providerPackageScaffold?.directoryPattern !== 'string') {
        fail(`Language workspace contract providerPackageScaffold.directoryPattern must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.providerPackageScaffold?.packagePattern !== 'string') {
        fail(`Language workspace contract providerPackageScaffold.packagePattern must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.providerPackageScaffold?.manifestFileName !== 'string') {
        fail(`Language workspace contract providerPackageScaffold.manifestFileName must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.providerPackageScaffold?.readmeFileName !== 'string') {
        fail(`Language workspace contract providerPackageScaffold.readmeFileName must be declared for ${languageEntry.language}`);
      }

      if (extractTemplateTokens(languageEntry.providerPackageScaffold.readmeFileName).length !== 0) {
        fail(`Language workspace contract providerPackageScaffold.readmeFileName must not use template tokens for ${languageEntry.language}`);
      }

      if (typeof languageEntry.providerPackageScaffold?.sourceFilePattern !== 'string') {
        fail(`Language workspace contract providerPackageScaffold.sourceFilePattern must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.providerPackageScaffold?.sourceSymbolPattern !== 'string') {
        fail(`Language workspace contract providerPackageScaffold.sourceSymbolPattern must be declared for ${languageEntry.language}`);
      }

      if (
        !Array.isArray(languageEntry.providerPackageScaffold?.templateTokens) ||
        languageEntry.providerPackageScaffold.templateTokens.length === 0
      ) {
        fail(`Language workspace contract providerPackageScaffold.templateTokens must be a non-empty array for ${languageEntry.language}`);
      }

      if (
        !Array.isArray(languageEntry.providerPackageScaffold?.sourceTemplateTokens) ||
        languageEntry.providerPackageScaffold.sourceTemplateTokens.length === 0
      ) {
        fail(`Language workspace contract providerPackageScaffold.sourceTemplateTokens must be a non-empty array for ${languageEntry.language}`);
      }

      const declaredProviderPackageTemplateTokens = normalizeStringArray(
        languageEntry.providerPackageScaffold.templateTokens,
      );
      for (const token of declaredProviderPackageTemplateTokens) {
        if (!KNOWN_PROVIDER_PACKAGE_TEMPLATE_TOKENS.includes(token)) {
          fail(`Language workspace contract providerPackageScaffold.templateTokens contains an unsupported token for ${languageEntry.language}: ${token}`);
        }
      }

      const declaredProviderPackageSourceTemplateTokens = normalizeStringArray(
        languageEntry.providerPackageScaffold.sourceTemplateTokens,
      );
      for (const token of declaredProviderPackageSourceTemplateTokens) {
        if (!KNOWN_PROVIDER_PACKAGE_TEMPLATE_TOKENS.includes(token)) {
          fail(`Language workspace contract providerPackageScaffold.sourceTemplateTokens contains an unsupported token for ${languageEntry.language}: ${token}`);
        }
      }

      const usedProviderPackageTemplateTokens = normalizeStringArray([
        ...extractTemplateTokens(languageEntry.providerPackageScaffold.directoryPattern),
        ...extractTemplateTokens(languageEntry.providerPackageScaffold.packagePattern),
        ...extractTemplateTokens(languageEntry.providerPackageScaffold.manifestFileName),
      ]);
      if (usedProviderPackageTemplateTokens.length === 0) {
        fail(`Language workspace contract providerPackageScaffold must use at least one template token for ${languageEntry.language}`);
      }

      if (
        declaredProviderPackageTemplateTokens.length !== usedProviderPackageTemplateTokens.length ||
        declaredProviderPackageTemplateTokens.some(
          (token, index) => token !== usedProviderPackageTemplateTokens[index],
        )
      ) {
        fail(
          `Language workspace contract providerPackageScaffold.templateTokens must exactly match the tokens used by the patterns for ${languageEntry.language}: declared [${renderNormalizedStringArray(
            declaredProviderPackageTemplateTokens,
          )}], used [${renderNormalizedStringArray(usedProviderPackageTemplateTokens)}]`,
        );
      }

      const usedProviderPackageSourceTemplateTokens = normalizeStringArray([
        ...extractTemplateTokens(languageEntry.providerPackageScaffold.sourceFilePattern),
        ...extractTemplateTokens(languageEntry.providerPackageScaffold.sourceSymbolPattern),
      ]);
      if (usedProviderPackageSourceTemplateTokens.length === 0) {
        fail(`Language workspace contract providerPackageScaffold source patterns must use at least one template token for ${languageEntry.language}`);
      }

      if (
        declaredProviderPackageSourceTemplateTokens.length !==
          usedProviderPackageSourceTemplateTokens.length ||
        declaredProviderPackageSourceTemplateTokens.some(
          (token, index) => token !== usedProviderPackageSourceTemplateTokens[index],
        )
      ) {
        fail(
          `Language workspace contract providerPackageScaffold.sourceTemplateTokens must exactly match the tokens used by the source patterns for ${languageEntry.language}: declared [${renderNormalizedStringArray(
            declaredProviderPackageSourceTemplateTokens,
          )}], used [${renderNormalizedStringArray(usedProviderPackageSourceTemplateTokens)}]`,
        );
      }

      if (typeof languageEntry.providerPackageScaffold?.runtimeBridgeStatus !== 'string') {
        fail(`Language workspace contract providerPackageScaffold.runtimeBridgeStatus must be declared for ${languageEntry.language}`);
      }

      if (
        !KNOWN_RESERVED_PROVIDER_PACKAGE_RUNTIME_BRIDGE_STATUSES.includes(
          languageEntry.providerPackageScaffold.runtimeBridgeStatus,
        )
      ) {
        fail(`Language workspace contract providerPackageScaffold.runtimeBridgeStatus is not recognized for ${languageEntry.language}`);
      }

      if (typeof languageEntry.providerPackageScaffold?.rootPublic !== 'boolean') {
        fail(`Language workspace contract providerPackageScaffold.rootPublic must be declared for ${languageEntry.language}`);
      }

      if (languageEntry.providerPackageScaffold.rootPublic !== false) {
        fail(`Language workspace contract providerPackageScaffold.rootPublic must stay false for ${languageEntry.language}`);
      }

      if (typeof languageEntry.providerPackageScaffold?.status !== 'string') {
        fail(`Language workspace contract providerPackageScaffold.status must be declared for ${languageEntry.language}`);
      }

      if (
        !KNOWN_RESERVED_PROVIDER_PACKAGE_SCAFFOLD_STATUSES.includes(
          languageEntry.providerPackageScaffold.status,
        )
      ) {
        fail(`Language workspace contract providerPackageScaffold.status is not recognized for ${languageEntry.language}`);
      }

      assertExactNormalizedTerms(
        [languageEntry.providerPackageScaffold.status],
        languageEntry.providerPackageBoundary.lifecycleStatusTerms,
        `Language workspace contract providerPackageScaffold.status alignment for ${languageEntry.language}`,
      );
      assertExactNormalizedTerms(
        [languageEntry.providerPackageScaffold.runtimeBridgeStatus],
        languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms,
        `Language workspace contract providerPackageScaffold.runtimeBridgeStatus alignment for ${languageEntry.language}`,
      );

      if (typeof languageEntry.metadataScaffold?.providerCatalogRelativePath !== 'string') {
        fail(`Language workspace contract metadataScaffold.providerCatalogRelativePath must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.metadataScaffold?.providerPackageCatalogRelativePath !== 'string') {
        fail(`Language workspace contract metadataScaffold.providerPackageCatalogRelativePath must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.metadataScaffold?.providerActivationCatalogRelativePath !== 'string') {
        fail(`Language workspace contract metadataScaffold.providerActivationCatalogRelativePath must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.metadataScaffold?.capabilityCatalogRelativePath !== 'string') {
        fail(`Language workspace contract metadataScaffold.capabilityCatalogRelativePath must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.metadataScaffold?.providerExtensionCatalogRelativePath !== 'string') {
        fail(`Language workspace contract metadataScaffold.providerExtensionCatalogRelativePath must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.metadataScaffold?.providerSelectionRelativePath !== 'string') {
        fail(`Language workspace contract metadataScaffold.providerSelectionRelativePath must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.resolutionScaffold?.driverManagerRelativePath !== 'string') {
        fail(`Language workspace contract resolutionScaffold.driverManagerRelativePath must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.resolutionScaffold?.dataSourceRelativePath !== 'string') {
        fail(`Language workspace contract resolutionScaffold.dataSourceRelativePath must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.resolutionScaffold?.providerSupportRelativePath !== 'string') {
        fail(`Language workspace contract resolutionScaffold.providerSupportRelativePath must be declared for ${languageEntry.language}`);
      }

      if (typeof languageEntry.resolutionScaffold?.providerPackageLoaderRelativePath !== 'string') {
        fail(`Language workspace contract resolutionScaffold.providerPackageLoaderRelativePath must be declared for ${languageEntry.language}`);
      }
    }

    if (languageEntry.providerActivations.length !== officialProviderKeys.length) {
      fail(`Language provider activation matrix must declare every official provider for ${languageEntry.language}`);
    }

    const seenProviderActivationKeys = new Set();
    let hasExecutableProviderActivation = false;
    for (const providerActivation of languageEntry.providerActivations) {
      if (typeof providerActivation.providerKey !== 'string' || providerActivation.providerKey.length === 0) {
        fail(`Language provider activation providerKey must be declared for ${languageEntry.language}`);
      }

      if (seenProviderActivationKeys.has(providerActivation.providerKey)) {
        fail(`Language provider activation providerKey must be unique for ${languageEntry.language}: ${providerActivation.providerKey}`);
      }
      seenProviderActivationKeys.add(providerActivation.providerKey);

      if (!providerByKey.has(providerActivation.providerKey)) {
        fail(`Language provider activation providerKey must exist in the official provider catalog for ${languageEntry.language}: ${providerActivation.providerKey}`);
      }

      if (typeof providerActivation.activationStatus !== 'string' || providerActivation.activationStatus.length === 0) {
        fail(`Language provider activation activationStatus must be declared for ${languageEntry.language}: ${providerActivation.providerKey}`);
      }

      if (!providerActivationStandard.statusTerms.includes(providerActivation.activationStatus)) {
        fail(`Language provider activation activationStatus is not recognized for ${languageEntry.language}: ${providerActivation.providerKey}`);
      }

      const provider = providerByKey.get(providerActivation.providerKey);

      if (providerActivation.activationStatus === 'root-public-builtin') {
        if (!languageEntry.runtimeBridge) {
          fail(`Language provider activation root-public-builtin requires runtimeBridge support for ${languageEntry.language}: ${providerActivation.providerKey}`);
        }

        if (!provider?.builtin) {
          fail(`Language provider activation root-public-builtin requires a builtin provider for ${languageEntry.language}: ${providerActivation.providerKey}`);
        }
      }

      if (providerActivation.activationStatus === 'package-boundary') {
        if (!languageEntry.runtimeBridge) {
          fail(`Language provider activation package-boundary requires runtimeBridge support for ${languageEntry.language}: ${providerActivation.providerKey}`);
        }

        if (provider?.builtin) {
          fail(`Language provider activation package-boundary must not be used for builtin providers for ${languageEntry.language}: ${providerActivation.providerKey}`);
        }
      }

      if (providerActivation.activationStatus !== 'control-metadata-only') {
        hasExecutableProviderActivation = true;
      }
    }

    if (languageEntry.runtimeBridge && !hasExecutableProviderActivation) {
      fail(`Language provider activation matrix must expose at least one executable provider for runtimeBridge-enabled language ${languageEntry.language}`);
    }
  }

  for (const provider of providers) {
    if (typeof provider.tier !== 'string' || provider.tier.length === 0) {
      fail(`Provider tier must be declared for ${provider.providerKey}`);
    }

    if (!providerTierStandard.tierTerms.includes(provider.tier)) {
      fail(`Provider tier is not recognized for ${provider.providerKey}: ${provider.tier}`);
    }

    if (typeof provider.defaultSelected !== 'boolean') {
      fail(`Provider defaultSelected flag is missing for ${provider.providerKey}`);
    }

    if (!Array.isArray(provider.urlSchemes) || provider.urlSchemes.length === 0) {
      fail(`Provider urlSchemes must be a non-empty array for ${provider.providerKey}`);
    }

    if (!provider.urlSchemes.includes(`rtc:${provider.providerKey}`)) {
      fail(`Provider urlSchemes must include rtc:${provider.providerKey}`);
    }

    if (
      JSON.stringify(provider.requiredCapabilities ?? []) !==
      JSON.stringify(REQUIRED_RTC_CAPABILITIES)
    ) {
      fail(`Provider required capability baseline drift for ${provider.providerKey}`);
    }

    for (const capability of provider.requiredCapabilities ?? []) {
      if (!capabilityDescriptorByKey.has(capability)) {
        fail(`Provider required capability ${capability} must exist in capabilityCatalog for ${provider.providerKey}`);
      }

      if (capabilityDescriptorByKey.get(capability).category !== 'required-baseline') {
        fail(`Provider required capability ${capability} must resolve to required-baseline for ${provider.providerKey}`);
      }
    }

    if (!Array.isArray(provider.optionalCapabilities)) {
      fail(`Provider optionalCapabilities must be declared for ${provider.providerKey}`);
    }

    for (const capability of provider.optionalCapabilities) {
      if (!OPTIONAL_RTC_CAPABILITIES.includes(capability)) {
        fail(`Provider optional capability ${capability} is not recognized for ${provider.providerKey}`);
      }

      if (!capabilityDescriptorByKey.has(capability)) {
        fail(`Provider optional capability ${capability} must exist in capabilityCatalog for ${provider.providerKey}`);
      }

      if (capabilityDescriptorByKey.get(capability).category !== 'optional-advanced') {
        fail(`Provider optional capability ${capability} must resolve to optional-advanced for ${provider.providerKey}`);
      }
    }

    if (!Array.isArray(provider.extensionKeys)) {
      fail(`Provider extensionKeys must be declared for ${provider.providerKey}`);
    }

    for (const extensionKey of provider.extensionKeys) {
      const descriptor = providerExtensionDescriptorByKey.get(extensionKey);
      if (!descriptor) {
        fail(`Provider extension key ${extensionKey} must exist in providerExtensionCatalog for ${provider.providerKey}`);
      }

      if (descriptor.providerKey !== provider.providerKey) {
        fail(`Provider extension key ${extensionKey} must resolve back to ${provider.providerKey}`);
      }
    }

    if (typeof provider.typescriptAdapter?.sdkProvisioning !== 'string') {
      fail(`Provider TypeScript adapter sdkProvisioning must be declared for ${provider.providerKey}`);
    }

    if (!typescriptAdapterStandard.sdkProvisioningTerms.includes(provider.typescriptAdapter.sdkProvisioning)) {
      fail(`Provider TypeScript adapter sdkProvisioning is not recognized for ${provider.providerKey}`);
    }

    if (typeof provider.typescriptAdapter?.bindingStrategy !== 'string') {
      fail(`Provider TypeScript adapter bindingStrategy must be declared for ${provider.providerKey}`);
    }

    if (!typescriptAdapterStandard.bindingStrategyTerms.includes(provider.typescriptAdapter.bindingStrategy)) {
      fail(`Provider TypeScript adapter bindingStrategy is not recognized for ${provider.providerKey}`);
    }

    if (typeof provider.typescriptAdapter?.bundlePolicy !== 'string') {
      fail(`Provider TypeScript adapter bundlePolicy must be declared for ${provider.providerKey}`);
    }

    if (!typescriptAdapterStandard.bundlePolicyTerms.includes(provider.typescriptAdapter.bundlePolicy)) {
      fail(`Provider TypeScript adapter bundlePolicy is not recognized for ${provider.providerKey}`);
    }

    if (typeof provider.typescriptAdapter?.runtimeBridgeStatus !== 'string') {
      fail(`Provider TypeScript adapter runtimeBridgeStatus must be declared for ${provider.providerKey}`);
    }

    if (
      !typescriptAdapterStandard.runtimeBridgeStatusTerms.includes(
        provider.typescriptAdapter.runtimeBridgeStatus,
      )
    ) {
      fail(`Provider TypeScript adapter runtimeBridgeStatus is not recognized for ${provider.providerKey}`);
    }

    if (typeof provider.typescriptAdapter?.officialVendorSdkRequirement !== 'string') {
      fail(
        `Provider TypeScript adapter officialVendorSdkRequirement must be declared for ${provider.providerKey}`,
      );
    }

    if (
      !typescriptAdapterStandard.officialVendorSdkRequirementTerms.includes(
        provider.typescriptAdapter.officialVendorSdkRequirement,
      )
    ) {
      fail(
        `Provider TypeScript adapter officialVendorSdkRequirement is not recognized for ${provider.providerKey}`,
      );
    }

    if (typeof provider.typescriptPackage?.packageName !== 'string') {
      fail(`Provider TypeScript package packageName must be declared for ${provider.providerKey}`);
    }

    if (typeof provider.typescriptPackage?.sourceModule !== 'string') {
      fail(`Provider TypeScript package sourceModule must be declared for ${provider.providerKey}`);
    }

    if (typeof provider.typescriptPackage?.driverFactory !== 'string') {
      fail(`Provider TypeScript package driverFactory must be declared for ${provider.providerKey}`);
    }

    if (typeof provider.typescriptPackage?.metadataSymbol !== 'string') {
      fail(`Provider TypeScript package metadataSymbol must be declared for ${provider.providerKey}`);
    }

    if (typeof provider.typescriptPackage?.moduleSymbol !== 'string') {
      fail(`Provider TypeScript package moduleSymbol must be declared for ${provider.providerKey}`);
    }

    if (typeof provider.typescriptPackage?.rootPublic !== 'boolean') {
      fail(`Provider TypeScript package rootPublic must be declared for ${provider.providerKey}`);
    }

    const canonicalTypeScriptPackage = getCanonicalTypeScriptProviderPackageContract(
      provider.providerKey,
      typescriptPackageStandard,
    );

    if (provider.typescriptPackage.packageName !== canonicalTypeScriptPackage.packageName) {
      fail(
        `Provider TypeScript package packageName must be ${canonicalTypeScriptPackage.packageName} for ${provider.providerKey}`,
      );
    }

    if (provider.typescriptPackage.sourceModule !== canonicalTypeScriptPackage.sourceModule) {
      fail(
        `Provider TypeScript package sourceModule must be ${canonicalTypeScriptPackage.sourceModule} for ${provider.providerKey}`,
      );
    }

    if (provider.typescriptPackage.driverFactory !== canonicalTypeScriptPackage.driverFactory) {
      fail(
        `Provider TypeScript package driverFactory must be ${canonicalTypeScriptPackage.driverFactory} for ${provider.providerKey}`,
      );
    }

    if (provider.typescriptPackage.metadataSymbol !== canonicalTypeScriptPackage.metadataSymbol) {
      fail(
        `Provider TypeScript package metadataSymbol must be ${canonicalTypeScriptPackage.metadataSymbol} for ${provider.providerKey}`,
      );
    }

    if (provider.typescriptPackage.moduleSymbol !== canonicalTypeScriptPackage.moduleSymbol) {
      fail(
        `Provider TypeScript package moduleSymbol must be ${canonicalTypeScriptPackage.moduleSymbol} for ${provider.providerKey}`,
      );
    }

    if (typescriptPackageStandard.rootPublicRule !== 'builtin-aligned') {
      fail(
        `typescriptPackageStandard.rootPublicRule must remain builtin-aligned, received ${typescriptPackageStandard.rootPublicRule ?? '<missing>'}`,
      );
    }

    if (provider.typescriptPackage.rootPublic !== provider.builtin) {
      fail(`Provider TypeScript package rootPublic must align with builtin status for ${provider.providerKey}`);
    }
  }

  const declaredProviderExtensionKeys = [
    ...new Set(providers.flatMap((provider) => provider.extensionKeys ?? [])),
  ].sort();
  const declaredProviderExtensionCatalogKeys = [...providerExtensionDescriptorByKey.keys()].sort();

  if (
    JSON.stringify(declaredProviderExtensionCatalogKeys) !== JSON.stringify(declaredProviderExtensionKeys)
  ) {
    fail('providerExtensionCatalog must exactly cover the workspace provider extension key set');
  }

  for (const relativePath of RTC_TYPESCRIPT_REQUIRED_STANDARD_FILES) {
    if (!existsSync(path.join(workspaceRoot, relativePath))) {
      fail(`Missing required TypeScript workspace file: ${relativePath}`);
    }
  }

  for (const relativePath of RTC_FLUTTER_REQUIRED_STANDARD_FILES) {
    if (!existsSync(path.join(workspaceRoot, relativePath))) {
      fail(`Missing required Flutter workspace file: ${relativePath}`);
    }
  }

  const typeScriptPackageTaskPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'bin',
    'package-task.mjs',
  );
  const typeScriptPackageTaskContent = readFileSync(typeScriptPackageTaskPath, 'utf8');
  if (!/generator-runtime\.mjs/.test(typeScriptPackageTaskContent)) {
    fail('TypeScript package-task.mjs must import bin/generator-runtime.mjs.');
  }
  if (!/resolveGeneratorModulePath/.test(typeScriptPackageTaskContent)) {
    fail('TypeScript package-task.mjs must resolve the generator-owned TypeScript compiler through resolveGeneratorModulePath.');
  }
  if (/sdkwork-sdk-generator/.test(typeScriptPackageTaskContent)) {
    fail('TypeScript package-task.mjs must not hardcode sdkwork-sdk-generator path math locally.');
  }

  const providerPackageRoot = path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript', 'providers');
  if (!existsSync(path.join(workspaceRoot, RTC_TYPESCRIPT_PROVIDER_PACKAGE_ROOT_README))) {
    fail(`Missing required TypeScript provider package README: ${RTC_TYPESCRIPT_PROVIDER_PACKAGE_ROOT_README}`);
  }

  const typeScriptProvidersReadme = readFileSync(
    path.join(workspaceRoot, RTC_TYPESCRIPT_PROVIDER_PACKAGE_ROOT_README),
    'utf8',
  );
  assertRequiredTerms(
    typeScriptProvidersReadme,
    REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
    'TypeScript providers README',
  );
  assertNoLegacyTypeScriptProviderPackageBoundaryTerms(
    typeScriptProvidersReadme,
    'TypeScript providers README',
  );

  for (const provider of assembly.providers ?? []) {
    const packageDir = path.join(providerPackageRoot, `rtc-sdk-provider-${provider.providerKey}`);
    const manifestPath = path.join(packageDir, 'package.json');
    const readmePath = path.join(packageDir, 'README.md');
    const entrypointPath = path.join(packageDir, 'index.js');
    const declarationPath = path.join(packageDir, 'index.d.ts');

    if (!existsSync(manifestPath)) {
      fail(`Missing required TypeScript provider package manifest: sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-${provider.providerKey}/package.json`);
    }

    if (!existsSync(readmePath)) {
      fail(`Missing required TypeScript provider package README: sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-${provider.providerKey}/README.md`);
    }

    if (!existsSync(entrypointPath)) {
      fail(`Missing required TypeScript provider package entrypoint: sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-${provider.providerKey}/index.js`);
    }

    if (!existsSync(declarationPath)) {
      fail(`Missing required TypeScript provider package declaration entrypoint: sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-${provider.providerKey}/index.d.ts`);
    }

    const manifest = readJsonFile(manifestPath);
    const expectedPackageName = provider.typescriptPackage.packageName;
    if (manifest.name !== expectedPackageName) {
      fail(`TypeScript provider package name drift for ${provider.providerKey}: expected ${expectedPackageName}`);
    }

    if (manifest.sdkworkRtcProvider?.providerKey !== provider.providerKey) {
      fail(`TypeScript provider package providerKey drift for ${provider.providerKey}`);
    }

    if (manifest.main !== './index.js') {
      fail(`TypeScript provider package main entrypoint drift for ${provider.providerKey}`);
    }

    if (manifest.types !== './index.d.ts') {
      fail(`TypeScript provider package types entrypoint drift for ${provider.providerKey}`);
    }

    if (manifest.exports?.['.']?.import !== './index.js') {
      fail(`TypeScript provider package import export drift for ${provider.providerKey}`);
    }

    if (manifest.exports?.['.']?.default !== './index.js') {
      fail(`TypeScript provider package default export drift for ${provider.providerKey}`);
    }

    if (manifest.exports?.['.']?.types !== './index.d.ts') {
      fail(`TypeScript provider package types export drift for ${provider.providerKey}`);
    }

    if (manifest.sdkworkRtcProvider?.builtin !== provider.builtin) {
      fail(`TypeScript provider package builtin drift for ${provider.providerKey}`);
    }

    if (manifest.sdkworkRtcProvider?.tier !== provider.tier) {
      fail(`TypeScript provider package tier drift for ${provider.providerKey}`);
    }

    if (manifest.sdkworkRtcProvider?.registrationContract !== 'RtcProviderModule') {
      fail(`TypeScript provider package registration contract drift for ${provider.providerKey}`);
    }

    const expectedSourceModule = provider.typescriptPackage.sourceModule;
    if (manifest.sdkworkRtcProvider?.sourceModule !== expectedSourceModule) {
      fail(`TypeScript provider package source module drift for ${provider.providerKey}`);
    }

    if (manifest.sdkworkRtcProvider?.driverFactory !== provider.typescriptPackage.driverFactory) {
      fail(`TypeScript provider package driver factory drift for ${provider.providerKey}`);
    }

    if (manifest.sdkworkRtcProvider?.metadataSymbol !== provider.typescriptPackage.metadataSymbol) {
      fail(`TypeScript provider package metadata symbol drift for ${provider.providerKey}`);
    }

    if (manifest.sdkworkRtcProvider?.moduleSymbol !== provider.typescriptPackage.moduleSymbol) {
      fail(`TypeScript provider package module symbol drift for ${provider.providerKey}`);
    }

    if (manifest.sdkworkRtcProvider?.rootPublic !== provider.typescriptPackage.rootPublic) {
      fail(`TypeScript provider package rootPublic policy drift for ${provider.providerKey}`);
    }

    if (
      JSON.stringify(manifest.sdkworkRtcProvider?.extensionKeys ?? []) !==
      JSON.stringify(provider.extensionKeys ?? [])
    ) {
      fail(`TypeScript provider package extensionKeys drift for ${provider.providerKey}`);
    }

    if (manifest.sdkworkRtcProvider?.typescriptAdapter?.sdkProvisioning !== provider.typescriptAdapter.sdkProvisioning) {
      fail(`TypeScript provider package sdkProvisioning drift for ${provider.providerKey}`);
    }

    if (manifest.sdkworkRtcProvider?.typescriptAdapter?.bindingStrategy !== provider.typescriptAdapter.bindingStrategy) {
      fail(`TypeScript provider package bindingStrategy drift for ${provider.providerKey}`);
    }

    if (manifest.sdkworkRtcProvider?.typescriptAdapter?.bundlePolicy !== provider.typescriptAdapter.bundlePolicy) {
      fail(`TypeScript provider package bundlePolicy drift for ${provider.providerKey}`);
    }

    if (
      manifest.sdkworkRtcProvider?.typescriptAdapter?.runtimeBridgeStatus !==
      provider.typescriptAdapter.runtimeBridgeStatus
    ) {
      fail(`TypeScript provider package runtimeBridgeStatus drift for ${provider.providerKey}`);
    }

    if (
      manifest.sdkworkRtcProvider?.typescriptAdapter?.officialVendorSdkRequirement !==
      provider.typescriptAdapter.officialVendorSdkRequirement
    ) {
      fail(`TypeScript provider package officialVendorSdkRequirement drift for ${provider.providerKey}`);
    }

    const sourceModulePath = path.resolve(packageDir, manifest.sdkworkRtcProvider.sourceModule);
    if (!existsSync(sourceModulePath)) {
      fail(`TypeScript provider package source module is missing for ${provider.providerKey}`);
    }

    const readme = readFileSync(readmePath, 'utf8');
    if (!/provider extension keys:/i.test(readme)) {
      fail(`TypeScript provider package README must declare provider extension keys for ${provider.providerKey}`);
    }
  }

  for (const language of officialLanguages) {
    const readmePath = path.join(workspaceRoot, `sdkwork-rtc-sdk-${language}`, 'README.md');
    if (!existsSync(readmePath)) {
      fail(`Missing required language workspace README: sdkwork-rtc-sdk-${language}/README.md`);
    }
  }

  for (const languageEntry of assembly.languages ?? []) {
    const expectsRuntimeBaseline =
      languageEntry.runtimeBridge === true && languageEntry.maturityTier === 'reference';

    if (expectsRuntimeBaseline && !languageEntry.runtimeBaseline) {
      fail(`Assembly language ${languageEntry.language} must declare runtimeBaseline`);
    }

    if (expectsRuntimeBaseline && !languageEntry.runtimeDocumentation) {
      fail(`Assembly language ${languageEntry.language} must declare runtimeDocumentation`);
    }

    if (!expectsRuntimeBaseline && languageEntry.runtimeDocumentation) {
      fail(
        `Assembly language ${languageEntry.language} must not declare runtimeDocumentation when no executable runtime baseline exists`,
      );
    }

    if (languageEntry.runtimeBaseline) {
      for (const [field, value] of Object.entries(languageEntry.runtimeBaseline)) {
        if (field === 'smokeVariants') {
          continue;
        }
        if (typeof value !== 'string' || value.length === 0) {
          fail(`Assembly language ${languageEntry.language} runtimeBaseline.${field} must be a non-empty string`);
        }
      }

      if (!['runtime-backed', 'analysis-backed'].includes(languageEntry.runtimeBaseline.smokeMode)) {
        fail(
          `Assembly language ${languageEntry.language} runtimeBaseline.smokeMode must be runtime-backed or analysis-backed`,
        );
      }

      if (
        !Array.isArray(languageEntry.runtimeBaseline.smokeVariants) ||
        languageEntry.runtimeBaseline.smokeVariants.length === 0
      ) {
        fail(
          `Assembly language ${languageEntry.language} runtimeBaseline.smokeVariants must be a non-empty array`,
        );
      }

      if (
        languageEntry.runtimeBaseline.smokeVariants[0] !==
        RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS[0]
      ) {
        fail(
          `Assembly language ${languageEntry.language} runtimeBaseline.smokeVariants must start with ${RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS[0]}`,
        );
      }

      const uniqueSmokeVariants = [...new Set(languageEntry.runtimeBaseline.smokeVariants)];
      if (
        JSON.stringify(uniqueSmokeVariants) !==
        JSON.stringify(languageEntry.runtimeBaseline.smokeVariants)
      ) {
        fail(
          `Assembly language ${languageEntry.language} runtimeBaseline.smokeVariants must not contain duplicates`,
        );
      }

      for (const smokeVariant of languageEntry.runtimeBaseline.smokeVariants) {
        if (
          typeof smokeVariant !== 'string' ||
          !RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS.includes(smokeVariant)
        ) {
          fail(
            `Assembly language ${languageEntry.language} runtimeBaseline.smokeVariants must use only ${RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS.join(', ')}`,
          );
        }
      }

      const canonicalSmokeVariants = RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS.filter((variant) =>
        languageEntry.runtimeBaseline.smokeVariants.includes(variant),
      );
      if (
        JSON.stringify(canonicalSmokeVariants) !==
        JSON.stringify(languageEntry.runtimeBaseline.smokeVariants)
      ) {
        fail(
          `Assembly language ${languageEntry.language} runtimeBaseline.smokeVariants must preserve canonical order ${RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS.join(', ')}`,
        );
      }
    }

    if (languageEntry.runtimeDocumentation) {
      for (const [field, value] of Object.entries(languageEntry.runtimeDocumentation)) {
        if (typeof value !== 'string' || value.length === 0) {
          fail(
            `Assembly language ${languageEntry.language} runtimeDocumentation.${field} must be a non-empty string`,
          );
        }
      }
    }

    const readmePath = path.join(workspaceRoot, languageEntry.workspace, 'README.md');
    const readme = readFileSync(readmePath, 'utf8');
    const workspaceCatalogPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.workspaceCatalogRelativePath,
    );

    if (!new RegExp(`#\\s+SDKWork RTC SDK ${escapeRegExp(languageEntry.displayName)} Workspace`).test(readme)) {
      fail(`Language workspace README title drift for ${languageEntry.language}`);
    }

    if (!new RegExp(`Language:\\s*\\\`${escapeRegExp(languageEntry.language)}\\\``).test(readme)) {
      fail(`Language workspace README language marker drift for ${languageEntry.language}`);
    }

    if (!/Planned public package:/.test(readme)) {
      fail(`Language workspace README package section is missing for ${languageEntry.language}`);
    }

    if (!new RegExp(escapeRegExp(languageEntry.publicPackage)).test(readme)) {
      fail(`Language workspace README package drift for ${languageEntry.language}`);
    }

    if (!new RegExp(`control SDK support:\\s*${languageEntry.controlSdk ? 'yes' : 'no'}`).test(readme)) {
      fail(`Language workspace README control boundary drift for ${languageEntry.language}`);
    }

    if (
      !new RegExp(
        `runtime bridge support:\\s*${languageEntry.runtimeBridge ? 'yes' : 'reserved'}`,
      ).test(readme)
    ) {
      fail(`Language workspace README runtime boundary drift for ${languageEntry.language}`);
    }

    if (!new RegExp(`maturity tier:\\s*${escapeRegExp(languageEntry.maturityTier)}`).test(readme)) {
      fail(`Language workspace README maturity tier drift for ${languageEntry.language}`);
    }

    if (!new RegExp(escapeRegExp(languageEntry.currentRole)).test(readme)) {
      fail(`Language workspace README currentRole drift for ${languageEntry.language}`);
    }

    if (!new RegExp(escapeRegExp(languageEntry.workspaceSummary)).test(readme)) {
      fail(`Language workspace README workspaceSummary drift for ${languageEntry.language}`);
    }

    if (!new RegExp(escapeRegExp(languageEntry.workspaceCatalogRelativePath)).test(readme)) {
      fail(`Language workspace README workspace catalog drift for ${languageEntry.language}`);
    }

    for (const roleHighlight of languageEntry.roleHighlights) {
      if (!new RegExp(escapeRegExp(roleHighlight)).test(readme)) {
        fail(`Language workspace README roleHighlight drift for ${languageEntry.language}: ${roleHighlight}`);
      }
    }

    if (!/\.\.\/docs\/provider-adapter-standard\.md/.test(readme)) {
      fail(`Language workspace README provider standard reference is missing for ${languageEntry.language}`);
    }

    if (!/\.\.\/docs\/multilanguage-capability-matrix\.md/.test(readme)) {
      fail(`Language workspace README matrix reference is missing for ${languageEntry.language}`);
    }

    if (languageEntry.language === 'typescript') {
      assertRequiredTerms(
        readme,
        REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
        'TypeScript workspace README',
      );
    }
    if (languageEntry.runtimeBaseline) {
      assertLanguageWorkspaceRuntimeBaselineContent(
        languageEntry.language,
        languageEntry.runtimeBaseline,
        readme,
        `Language workspace README for ${languageEntry.language}`,
      );
    }
    assertLanguageWorkspaceProviderPackageBoundaryContent(
      languageEntry,
      readme,
      `Language workspace README for ${languageEntry.language}`,
    );
    assertNoLegacyTypeScriptProviderPackageBoundaryTerms(
      readme,
      `Language workspace README for ${languageEntry.language}`,
    );

    if (!existsSync(workspaceCatalogPath)) {
      fail(`Missing language workspace catalog asset for ${languageEntry.language}: ${languageEntry.workspaceCatalogRelativePath}`);
    }

    const workspaceCatalogContent = readFileSync(workspaceCatalogPath, 'utf8');
    if (languageEntry.language === 'typescript') {
      assertRequiredTerms(
        workspaceCatalogContent,
        REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
        'TypeScript language workspace catalog',
      );
    }
    assertLanguageWorkspaceProviderPackageBoundaryContent(
      languageEntry,
      workspaceCatalogContent,
      `Language workspace catalog for ${languageEntry.language}`,
    );
    assertLanguageWorkspaceProviderSelectionContractContent(
      languageEntry.language,
      providerSelectionStandard,
      workspaceCatalogContent,
      `Language workspace catalog for ${languageEntry.language}`,
    );
    assertLanguageWorkspaceProviderSupportContractContent(
      languageEntry.language,
      providerSupportStandard,
      workspaceCatalogContent,
      `Language workspace catalog for ${languageEntry.language}`,
    );
    assertLanguageWorkspaceProviderActivationContractContent(
      languageEntry.language,
      providerActivationStandard,
      workspaceCatalogContent,
      `Language workspace catalog for ${languageEntry.language}`,
    );
    if (languageEntry.runtimeBaseline) {
      assertLanguageWorkspaceRuntimeBaselineContent(
        languageEntry.language,
        languageEntry.runtimeBaseline,
        workspaceCatalogContent,
        `Language workspace catalog for ${languageEntry.language}`,
      );
      assertExecutableLanguageRuntimeBaselineManifest(languageEntry, workspaceRoot);
    }
    assertLanguageWorkspaceProviderPackageBoundaryContractContent(
      languageEntry.language,
      providerPackageBoundaryStandard,
      workspaceCatalogContent,
      `Language workspace catalog for ${languageEntry.language}`,
    );
    assertNoLegacyTypeScriptProviderPackageBoundaryTerms(
      workspaceCatalogContent,
      `Language workspace catalog for ${languageEntry.language}`,
    );
    for (const token of [
      'RtcLanguageWorkspaceCatalogEntry',
      'language',
      'workspace',
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
      'runtimeBaseline',
      'providerPackageBoundaryContract',
      'providerPackageBoundary',
    ]) {
      assertReservedLanguageToken(
        languageEntry.language,
        workspaceCatalogContent,
        token,
        `Language workspace catalog token drift for ${languageEntry.language}: ${token}`,
      );
    }

    for (const expectedLanguage of assembly.languages ?? []) {
      for (const value of [
        expectedLanguage.language,
        expectedLanguage.workspace,
        expectedLanguage.displayName,
        expectedLanguage.publicPackage,
        expectedLanguage.maturityTier,
        expectedLanguage.currentRole,
        expectedLanguage.workspaceSummary,
      ]) {
        if (!new RegExp(escapeRegExp(value)).test(workspaceCatalogContent)) {
          fail(`Language workspace catalog drift for ${languageEntry.language}: ${value}`);
        }
      }
    }

    if (languageEntry.language === 'typescript') {
      if (!/getRtcLanguageWorkspaceByLanguage/.test(workspaceCatalogContent)) {
        fail('TypeScript language workspace catalog helper drift: getRtcLanguageWorkspaceByLanguage');
      }
    } else {
      for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).languageWorkspaceCatalog) {
        if (!pattern.test(workspaceCatalogContent)) {
          fail(`Reserved language workspace catalog lookup helper drift for ${languageEntry.language}: ${pattern}`);
        }
      }
    }

    const rootPublicContract = getReservedLanguageRootPublicContract(languageEntry);
    if (rootPublicContract) {
      const rootPublicPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        rootPublicContract.relativePath,
      );
      if (!existsSync(rootPublicPath)) {
        fail(`Missing reserved language root public entrypoint for ${languageEntry.language}: ${rootPublicContract.relativePath}`);
      }

      const rootPublicContent = readFileSync(rootPublicPath, 'utf8');
      for (const pattern of rootPublicContract.patterns) {
        if (!pattern.test(rootPublicContent)) {
          fail(`Reserved language root public entrypoint drift for ${languageEntry.language}: ${pattern}`);
        }
      }
    }

    for (const contract of getGoPublicStructFieldContracts(languageEntry)) {
      const contractPath = path.join(workspaceRoot, languageEntry.workspace, contract.relativePath);
      if (!existsSync(contractPath)) {
        fail(`Missing Go public struct contract asset for ${languageEntry.language}: ${contract.relativePath}`);
      }

      const contractContent = readFileSync(contractPath, 'utf8');
      for (const pattern of contract.patterns) {
        if (!pattern.test(contractContent)) {
          fail(`Go public struct field drift for ${languageEntry.language}: ${contract.relativePath}: ${pattern}`);
        }
      }
    }

    if (languageEntry.language !== 'typescript') {
      if (
        !new RegExp(
          `build system:\\s*${escapeRegExp(languageEntry.packageScaffold.buildSystem)}`,
          'i',
        ).test(readme)
      ) {
        fail(`Language workspace README package scaffold build system drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.packageScaffold.manifestRelativePath)).test(readme)
      ) {
        fail(`Language workspace README package scaffold manifest drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.providerPackageScaffold.relativePath)).test(readme)
      ) {
        fail(`Language workspace README provider package scaffold path drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.providerPackageScaffold.directoryPattern)).test(readme)
      ) {
        fail(`Language workspace README provider package scaffold directory pattern drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.providerPackageScaffold.packagePattern)).test(readme)
      ) {
        fail(`Language workspace README provider package scaffold package pattern drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.providerPackageScaffold.manifestFileName)).test(readme)
      ) {
        fail(`Language workspace README provider package scaffold manifest file drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.providerPackageScaffold.readmeFileName)).test(readme)
      ) {
        fail(`Language workspace README provider package scaffold readme file drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.providerPackageScaffold.sourceFilePattern)).test(readme)
      ) {
        fail(`Language workspace README provider package scaffold source file drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.providerPackageScaffold.sourceSymbolPattern)).test(readme)
      ) {
        fail(`Language workspace README provider package scaffold source symbol drift for ${languageEntry.language}`);
      }

      for (const templateToken of languageEntry.providerPackageScaffold.templateTokens) {
        if (!new RegExp(escapeRegExp(templateToken)).test(readme)) {
          fail(`Language workspace README provider package scaffold template token drift for ${languageEntry.language}: ${templateToken}`);
        }
      }

      for (const templateToken of languageEntry.providerPackageScaffold.sourceTemplateTokens) {
        if (!new RegExp(escapeRegExp(templateToken)).test(readme)) {
          fail(`Language workspace README provider package scaffold source template token drift for ${languageEntry.language}: ${templateToken}`);
        }
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.providerPackageScaffold.status)).test(readme)
      ) {
        fail(`Language workspace README provider package scaffold status drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.providerPackageScaffold.runtimeBridgeStatus)).test(
          readme,
        )
      ) {
        fail(`Language workspace README provider package scaffold runtime bridge status drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(`root public exposure:\\s*\\\`${languageEntry.providerPackageScaffold.rootPublic}\\\``).test(
          readme,
        )
      ) {
        fail(`Language workspace README provider package scaffold rootPublic drift for ${languageEntry.language}`);
      }

      if (!new RegExp(escapeRegExp(languageEntry.contractScaffold.relativePath)).test(readme)) {
        fail(`Language workspace README contract scaffold path drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.metadataScaffold.providerCatalogRelativePath)).test(
          readme,
        )
      ) {
        fail(`Language workspace README metadata scaffold provider catalog drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.metadataScaffold.providerPackageCatalogRelativePath)).test(
          readme,
        )
      ) {
        fail(`Language workspace README metadata scaffold provider package catalog drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(
          escapeRegExp(languageEntry.metadataScaffold.providerActivationCatalogRelativePath),
        ).test(readme)
      ) {
        fail(`Language workspace README metadata scaffold provider activation catalog drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.metadataScaffold.capabilityCatalogRelativePath)).test(
          readme,
        )
      ) {
        fail(`Language workspace README metadata scaffold capability catalog drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(
          escapeRegExp(languageEntry.metadataScaffold.providerExtensionCatalogRelativePath),
        ).test(readme)
      ) {
        fail(`Language workspace README metadata scaffold provider extension catalog drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.metadataScaffold.providerSelectionRelativePath)).test(
          readme,
        )
      ) {
        fail(`Language workspace README metadata scaffold provider selection drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.resolutionScaffold.driverManagerRelativePath)).test(
          readme,
        )
      ) {
        fail(`Language workspace README resolution scaffold driver manager drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.resolutionScaffold.dataSourceRelativePath)).test(
          readme,
        )
      ) {
        fail(`Language workspace README resolution scaffold data source drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(languageEntry.resolutionScaffold.providerSupportRelativePath)).test(
          readme,
        )
      ) {
        fail(`Language workspace README resolution scaffold provider support drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(
          escapeRegExp(languageEntry.resolutionScaffold.providerPackageLoaderRelativePath),
        ).test(readme)
      ) {
        fail(`Language workspace README resolution scaffold provider package loader drift for ${languageEntry.language}`);
      }

      const scaffoldPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        languageEntry.contractScaffold.relativePath,
      );
      if (!existsSync(scaffoldPath)) {
        fail(`Missing required language contract scaffold for ${languageEntry.language}: ${languageEntry.contractScaffold.relativePath}`);
      }

      const scaffoldContent = readFileSync(scaffoldPath, 'utf8');
      if (!new RegExp(escapeRegExp(languageEntry.contractScaffold.symbol)).test(scaffoldContent)) {
        fail(`Language contract scaffold symbol drift for ${languageEntry.language}`);
      }

      for (const token of REQUIRED_RESERVED_LANGUAGE_CONTRACT_TOKENS) {
        if (!new RegExp(escapeRegExp(token)).test(scaffoldContent)) {
          fail(`Language contract scaffold token drift for ${languageEntry.language}: ${token}`);
        }
      }

      const manifestPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        languageEntry.packageScaffold.manifestRelativePath,
      );
      if (!existsSync(manifestPath)) {
        fail(`Missing required language package scaffold for ${languageEntry.language}: ${languageEntry.packageScaffold.manifestRelativePath}`);
      }

      const manifestContent = readFileSync(manifestPath, 'utf8');
      if (!new RegExp(escapeRegExp(languageEntry.publicPackage)).test(manifestContent)) {
        fail(`Language package scaffold public package drift for ${languageEntry.language}`);
      }

      if (!new RegExp(escapeRegExp(languageEntry.packageScaffold.buildSystem)).test(manifestContent)) {
        fail(`Language package scaffold build system drift for ${languageEntry.language}`);
      }

      const providerPackageScaffold = languageEntry.providerPackageScaffold;
      const providerPackageScaffoldPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        providerPackageScaffold.relativePath,
      );
      if (!existsSync(providerPackageScaffoldPath)) {
        fail(`Missing required language provider package scaffold for ${languageEntry.language}: ${providerPackageScaffold.relativePath}`);
      }

      const providerPackageScaffoldContent = readFileSync(providerPackageScaffoldPath, 'utf8');
      for (const token of [
        'one provider per package boundary',
        'template tokens',
        'source file pattern',
        'source symbol pattern',
        'source template tokens',
        'status',
        'runtime bridge status',
        'root public exposure',
        'providerKey',
        'pluginId',
        'driverId',
      ]) {
        if (!new RegExp(escapeRegExp(token), 'i').test(providerPackageScaffoldContent)) {
          fail(`Language provider package scaffold token drift for ${languageEntry.language}: ${token}`);
        }
      }

      if (
        !new RegExp(escapeRegExp(providerPackageScaffold.directoryPattern)).test(
          providerPackageScaffoldContent,
        )
      ) {
        fail(`Language provider package scaffold directory pattern drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(providerPackageScaffold.packagePattern)).test(providerPackageScaffoldContent)
      ) {
        fail(`Language provider package scaffold package pattern drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(providerPackageScaffold.manifestFileName)).test(providerPackageScaffoldContent)
      ) {
        fail(`Language provider package scaffold manifest file drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(providerPackageScaffold.readmeFileName)).test(providerPackageScaffoldContent)
      ) {
        fail(`Language provider package scaffold readme file drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(providerPackageScaffold.sourceFilePattern)).test(providerPackageScaffoldContent)
      ) {
        fail(`Language provider package scaffold source file pattern drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(providerPackageScaffold.sourceSymbolPattern)).test(
          providerPackageScaffoldContent,
        )
      ) {
        fail(`Language provider package scaffold source symbol pattern drift for ${languageEntry.language}`);
      }

      for (const templateToken of providerPackageScaffold.templateTokens) {
        if (!new RegExp(escapeRegExp(templateToken)).test(providerPackageScaffoldContent)) {
          fail(`Language provider package scaffold template token drift for ${languageEntry.language}: ${templateToken}`);
        }
      }

      for (const templateToken of providerPackageScaffold.sourceTemplateTokens) {
        if (!new RegExp(escapeRegExp(templateToken)).test(providerPackageScaffoldContent)) {
          fail(`Language provider package scaffold source template token drift for ${languageEntry.language}: ${templateToken}`);
        }
      }

      if (!new RegExp(escapeRegExp(providerPackageScaffold.status)).test(providerPackageScaffoldContent)) {
        fail(`Language provider package scaffold status drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(escapeRegExp(providerPackageScaffold.runtimeBridgeStatus)).test(
          providerPackageScaffoldContent,
        )
      ) {
        fail(`Language provider package scaffold runtime bridge status drift for ${languageEntry.language}`);
      }

      if (
        !new RegExp(`root public exposure:\\s*\\\`${providerPackageScaffold.rootPublic}\\\``).test(
          providerPackageScaffoldContent,
        )
      ) {
        fail(`Language provider package scaffold rootPublic drift for ${languageEntry.language}`);
      }

      for (const providerKey of officialProviderKeys) {
        const providerPascal = toPascalCase(providerKey);
        const expectedPackageIdentity = materializeProviderPackagePattern(
          providerPackageScaffold.packagePattern,
          providerKey,
        );
        const expectedDirectoryPath = materializeProviderPackagePattern(
          providerPackageScaffold.directoryPattern,
          providerKey,
        );
        const expectedManifestPath = buildProviderPackageManifestPath(
          providerPackageScaffold,
          providerKey,
        );
        const expectedReadmePath = buildProviderPackageReadmePath(
          providerPackageScaffold,
          providerKey,
        );
        const expectedSourcePath = buildProviderPackageSourcePath(
          providerPackageScaffold,
          providerKey,
        );
        const expectedSourceRelativePath = buildProviderPackageSourceRelativePath(
          providerPackageScaffold,
          providerKey,
        );
        const expectedSourceSymbol = buildProviderPackageSourceSymbol(
          providerPackageScaffold,
          providerKey,
        );
        const provider = providerByKey.get(providerKey);

        if (!new RegExp(escapeRegExp(providerKey)).test(providerPackageScaffoldContent)) {
          fail(`Language provider package scaffold provider drift for ${languageEntry.language}: ${providerKey}`);
        }

        if (!new RegExp(escapeRegExp(providerPascal)).test(providerPackageScaffoldContent)) {
          fail(`Language provider package scaffold provider pascal drift for ${languageEntry.language}: ${providerKey}`);
        }

        if (!new RegExp(escapeRegExp(expectedPackageIdentity)).test(providerPackageScaffoldContent)) {
          fail(`Language provider package scaffold package identity drift for ${languageEntry.language}: ${providerKey}`);
        }

        if (!new RegExp(escapeRegExp(expectedDirectoryPath)).test(providerPackageScaffoldContent)) {
          fail(`Language provider package scaffold directory example drift for ${languageEntry.language}: ${providerKey}`);
        }

        if (!new RegExp(escapeRegExp(expectedManifestPath)).test(providerPackageScaffoldContent)) {
          fail(`Language provider package scaffold manifest path drift for ${languageEntry.language}: ${providerKey}`);
        }

        if (!new RegExp(escapeRegExp(expectedReadmePath)).test(providerPackageScaffoldContent)) {
          fail(`Language provider package scaffold readme path drift for ${languageEntry.language}: ${providerKey}`);
        }

        if (!new RegExp(escapeRegExp(expectedSourcePath)).test(providerPackageScaffoldContent)) {
          fail(`Language provider package scaffold source path drift for ${languageEntry.language}: ${providerKey}`);
        }

        if (!new RegExp(escapeRegExp(expectedSourceSymbol)).test(providerPackageScaffoldContent)) {
          fail(`Language provider package scaffold source symbol drift for ${languageEntry.language}: ${providerKey}`);
        }

        const providerManifestPath = path.join(workspaceRoot, languageEntry.workspace, expectedManifestPath);
        if (!existsSync(providerManifestPath)) {
          fail(`Missing reserved language provider package manifest for ${languageEntry.language}: ${expectedManifestPath}`);
        }

        const providerManifestContent = readFileSync(providerManifestPath, 'utf8');
        for (const token of [
          providerKey,
          provider.pluginId,
          provider.driverId,
          expectedPackageIdentity,
          expectedSourceRelativePath,
          expectedSourceSymbol,
          providerPackageScaffold.status,
          providerPackageScaffold.runtimeBridgeStatus,
          String(providerPackageScaffold.rootPublic),
        ]) {
          if (!new RegExp(escapeRegExp(token)).test(providerManifestContent)) {
            fail(`Reserved language provider package manifest drift for ${languageEntry.language}: ${providerKey}`);
          }
        }

        const providerReadmePath = path.join(workspaceRoot, languageEntry.workspace, expectedReadmePath);
        if (!existsSync(providerReadmePath)) {
          fail(`Missing reserved language provider package README for ${languageEntry.language}: ${expectedReadmePath}`);
        }

        const providerReadmeContent = readFileSync(providerReadmePath, 'utf8');
        for (const token of [
          providerKey,
          provider.pluginId,
          provider.driverId,
          expectedPackageIdentity,
          expectedDirectoryPath,
          expectedManifestPath,
          expectedReadmePath,
          expectedSourcePath,
          expectedSourceSymbol,
          providerPackageScaffold.status,
          providerPackageScaffold.runtimeBridgeStatus,
          String(providerPackageScaffold.rootPublic),
        ]) {
          if (!new RegExp(escapeRegExp(token)).test(providerReadmeContent)) {
            fail(`Reserved language provider package README drift for ${languageEntry.language}: ${providerKey}`);
          }
        }

        const providerSourcePath = path.join(workspaceRoot, languageEntry.workspace, expectedSourcePath);
        if (!existsSync(providerSourcePath)) {
          fail(`Missing reserved language provider package source scaffold for ${languageEntry.language}: ${expectedSourcePath}`);
        }

        const providerSourceContent = readFileSync(providerSourcePath, 'utf8');
        for (const token of [
          providerKey,
          provider.pluginId,
          provider.driverId,
          expectedPackageIdentity,
          expectedSourceSymbol,
          providerPackageScaffold.status,
          providerPackageScaffold.runtimeBridgeStatus,
        ]) {
          if (!new RegExp(escapeRegExp(token)).test(providerSourceContent)) {
            fail(`Reserved language provider package source scaffold drift for ${languageEntry.language}: ${providerKey}`);
          }
        }

        const expectedRootPublicLiteral = providerPackageScaffold.rootPublic ? '(true|True)' : '(false|False)';
        if (!new RegExp(`\\b${expectedRootPublicLiteral}\\b`).test(providerSourceContent)) {
          fail(`Reserved language provider package source scaffold rootPublic drift for ${languageEntry.language}: ${providerKey}`);
        }
      }

      const providerCatalogPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        languageEntry.metadataScaffold.providerCatalogRelativePath,
      );
      if (!existsSync(providerCatalogPath)) {
        fail(`Missing required language metadata scaffold for ${languageEntry.language}: ${languageEntry.metadataScaffold.providerCatalogRelativePath}`);
      }

      const providerCatalogContent = readFileSync(providerCatalogPath, 'utf8');
      for (const token of ['RtcProviderCatalog', 'DEFAULT_RTC_PROVIDER_KEY', 'providerKey', 'pluginId', 'driverId']) {
        assertReservedLanguageToken(
          languageEntry.language,
          providerCatalogContent,
          token,
          `Language metadata scaffold provider catalog token drift for ${languageEntry.language}: ${token}`,
        );
      }
      for (const providerKey of officialProviderKeys) {
        if (!new RegExp(escapeRegExp(providerKey)).test(providerCatalogContent)) {
          fail(`Language metadata scaffold provider catalog provider drift for ${languageEntry.language}: ${providerKey}`);
        }
      }

      if (languageEntry.language !== 'typescript') {
        for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerCatalog) {
          if (!pattern.test(providerCatalogContent)) {
            fail(`Language metadata scaffold provider catalog lookup helper drift for ${languageEntry.language}: ${pattern}`);
          }
        }
      }

      const providerPackageCatalogPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        languageEntry.metadataScaffold.providerPackageCatalogRelativePath,
      );
      if (!existsSync(providerPackageCatalogPath)) {
        fail(`Missing required language metadata scaffold for ${languageEntry.language}: ${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}`);
      }

      const providerPackageCatalogContent = readFileSync(providerPackageCatalogPath, 'utf8');
      for (const token of [
        'RtcProviderPackageCatalog',
        'RtcProviderPackageCatalogEntry',
        'providerKey',
        'pluginId',
        'driverId',
        'packageIdentity',
        'manifestPath',
        'readmePath',
        'sourcePath',
        'sourceSymbol',
        'builtin',
        'rootPublic',
        'status',
        'runtimeBridgeStatus',
      ]) {
        assertReservedLanguageToken(
          languageEntry.language,
          providerPackageCatalogContent,
          token,
          `Language metadata scaffold provider package catalog token drift for ${languageEntry.language}: ${token}`,
        );
      }

      for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerPackageCatalog) {
        if (!pattern.test(providerPackageCatalogContent)) {
          fail(`Language metadata scaffold provider package catalog lookup helper drift for ${languageEntry.language}: ${pattern}`);
        }
      }

      const expectedProviderPackageCatalogEntries = buildReservedProviderPackageCatalogEntries(
        languageEntry,
        providers,
      );
      for (const entry of expectedProviderPackageCatalogEntries) {
        for (const value of [
          entry.providerKey,
          entry.pluginId,
          entry.driverId,
          entry.packageIdentity,
          entry.manifestPath,
          entry.readmePath,
          entry.sourcePath,
          entry.sourceSymbol,
          entry.status,
          entry.runtimeBridgeStatus,
        ]) {
          if (!new RegExp(escapeRegExp(value)).test(providerPackageCatalogContent)) {
            fail(`Language metadata scaffold provider package catalog drift for ${languageEntry.language}: ${value}`);
          }
        }

        const expectedBuiltinLiteral = entry.builtin ? '(true|True)' : '(false|False)';
        if (!new RegExp(expectedBuiltinLiteral).test(providerPackageCatalogContent)) {
          fail(`Language metadata scaffold provider package catalog builtin drift for ${languageEntry.language}: ${entry.providerKey}`);
        }

        const expectedRootPublicLiteral = entry.rootPublic ? '(true|True)' : '(false|False)';
        if (!new RegExp(expectedRootPublicLiteral).test(providerPackageCatalogContent)) {
          fail(`Language metadata scaffold provider package catalog rootPublic drift for ${languageEntry.language}: ${entry.providerKey}`);
        }
      }

      const providerActivationCatalogPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        languageEntry.metadataScaffold.providerActivationCatalogRelativePath,
      );
      if (!existsSync(providerActivationCatalogPath)) {
        fail(`Missing required language metadata scaffold for ${languageEntry.language}: ${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}`);
      }

      const providerActivationCatalogContent = readFileSync(providerActivationCatalogPath, 'utf8');
      for (const token of [
        'RtcProviderActivationCatalog',
        'RtcProviderActivationCatalogEntry',
        'providerKey',
        'pluginId',
        'driverId',
        'activationStatus',
        'runtimeBridge',
        'rootPublic',
        'packageBoundary',
        'builtin',
        'packageIdentity',
      ]) {
        assertReservedLanguageToken(
          languageEntry.language,
          providerActivationCatalogContent,
          token,
          `Language metadata scaffold provider activation catalog token drift for ${languageEntry.language}: ${token}`,
        );
      }

      for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerActivationCatalog) {
        if (!pattern.test(providerActivationCatalogContent)) {
          fail(`Language metadata scaffold provider activation catalog lookup helper drift for ${languageEntry.language}: ${pattern}`);
        }
      }

      for (const activationStatus of providerActivationStandard.statusTerms) {
        if (!new RegExp(escapeRegExp(activationStatus)).test(providerActivationCatalogContent)) {
          fail(`Language metadata scaffold provider activation catalog status drift for ${languageEntry.language}: ${activationStatus}`);
        }
      }

      const expectedProviderActivationCatalogEntries = buildLanguageProviderActivationCatalogEntries(
        languageEntry,
        providers,
      );
      for (const entry of expectedProviderActivationCatalogEntries) {
        for (const value of [
          entry.providerKey,
          entry.pluginId,
          entry.driverId,
          entry.activationStatus,
          entry.packageIdentity,
        ]) {
          if (!new RegExp(escapeRegExp(value)).test(providerActivationCatalogContent)) {
            fail(`Language metadata scaffold provider activation catalog drift for ${languageEntry.language}: ${value}`);
          }
        }

        const expectedRuntimeBridgeLiteral = entry.runtimeBridge ? '(true|True)' : '(false|False)';
        if (!new RegExp(`\\b${expectedRuntimeBridgeLiteral}\\b`).test(providerActivationCatalogContent)) {
          fail(`Language metadata scaffold provider activation catalog runtimeBridge drift for ${languageEntry.language}: ${entry.providerKey}`);
        }

        const expectedRootPublicLiteral = entry.rootPublic ? '(true|True)' : '(false|False)';
        if (!new RegExp(`\\b${expectedRootPublicLiteral}\\b`).test(providerActivationCatalogContent)) {
          fail(`Language metadata scaffold provider activation catalog rootPublic drift for ${languageEntry.language}: ${entry.providerKey}`);
        }

        const expectedPackageBoundaryLiteral = entry.packageBoundary ? '(true|True)' : '(false|False)';
        if (!new RegExp(`\\b${expectedPackageBoundaryLiteral}\\b`).test(providerActivationCatalogContent)) {
          fail(`Language metadata scaffold provider activation catalog packageBoundary drift for ${languageEntry.language}: ${entry.providerKey}`);
        }

        const expectedBuiltinLiteral = entry.builtin ? '(true|True)' : '(false|False)';
        if (!new RegExp(`\\b${expectedBuiltinLiteral}\\b`).test(providerActivationCatalogContent)) {
          fail(`Language metadata scaffold provider activation catalog builtin drift for ${languageEntry.language}: ${entry.providerKey}`);
        }
      }

      const capabilityCatalogPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        languageEntry.metadataScaffold.capabilityCatalogRelativePath,
      );
      if (!existsSync(capabilityCatalogPath)) {
        fail(`Missing required language metadata scaffold for ${languageEntry.language}: ${languageEntry.metadataScaffold.capabilityCatalogRelativePath}`);
      }

      const capabilityCatalogContent = readFileSync(capabilityCatalogPath, 'utf8');
      for (const token of ['RtcCapabilityCatalog', 'capabilityKey', 'category', 'surface']) {
        assertReservedLanguageToken(
          languageEntry.language,
          capabilityCatalogContent,
          token,
          `Language metadata scaffold capability catalog token drift for ${languageEntry.language}: ${token}`,
        );
      }
      for (const capabilityKey of declaredCapabilityCatalogKeys) {
        if (!new RegExp(escapeRegExp(capabilityKey)).test(capabilityCatalogContent)) {
          fail(`Language metadata scaffold capability drift for ${languageEntry.language}: ${capabilityKey}`);
        }
      }
      for (const category of capabilityStandard.categoryTerms) {
        if (!new RegExp(escapeRegExp(category)).test(capabilityCatalogContent)) {
          fail(`Language metadata scaffold capability category drift for ${languageEntry.language}: ${category}`);
        }
      }
      for (const surface of capabilityStandard.surfaceTerms) {
        if (!new RegExp(escapeRegExp(surface)).test(capabilityCatalogContent)) {
          fail(`Language metadata scaffold capability surface drift for ${languageEntry.language}: ${surface}`);
        }
      }
      for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).capabilityCatalog) {
        if (!pattern.test(capabilityCatalogContent)) {
          fail(
            `Language metadata scaffold capability lookup helper drift for ${languageEntry.language}: ${pattern}`,
          );
        }
      }

      const providerExtensionCatalogPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        languageEntry.metadataScaffold.providerExtensionCatalogRelativePath,
      );
      if (!existsSync(providerExtensionCatalogPath)) {
        fail(`Missing required language metadata scaffold for ${languageEntry.language}: ${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}`);
      }

      const providerExtensionCatalogContent = readFileSync(providerExtensionCatalogPath, 'utf8');
      for (const token of [
        'RtcProviderExtensionCatalog',
        'extensionKey',
        'providerKey',
        'displayName',
        'surface',
        'access',
        'status',
      ]) {
        assertReservedLanguageToken(
          languageEntry.language,
          providerExtensionCatalogContent,
          token,
          `Language metadata scaffold provider extension catalog token drift for ${languageEntry.language}: ${token}`,
        );
      }
      for (const extensionKey of [...providerExtensionDescriptorByKey.keys()]) {
        if (!new RegExp(escapeRegExp(extensionKey)).test(providerExtensionCatalogContent)) {
          fail(`Language metadata scaffold provider extension key drift for ${languageEntry.language}: ${extensionKey}`);
        }
      }
      for (const providerKey of officialProviderKeys) {
        if (!new RegExp(escapeRegExp(providerKey)).test(providerExtensionCatalogContent)) {
          fail(`Language metadata scaffold provider extension provider drift for ${languageEntry.language}: ${providerKey}`);
        }
      }
      for (const surface of capabilityStandard.surfaceTerms) {
        if (!new RegExp(escapeRegExp(surface)).test(providerExtensionCatalogContent)) {
          fail(`Language metadata scaffold provider extension surface drift for ${languageEntry.language}: ${surface}`);
        }
      }
      for (const access of providerExtensionStandard.accessTerms) {
        if (!new RegExp(escapeRegExp(access)).test(providerExtensionCatalogContent)) {
          fail(`Language metadata scaffold provider extension access drift for ${languageEntry.language}: ${access}`);
        }
      }
      for (const status of providerExtensionStandard.statusTerms) {
        if (!new RegExp(escapeRegExp(status)).test(providerExtensionCatalogContent)) {
          fail(`Language metadata scaffold provider extension status drift for ${languageEntry.language}: ${status}`);
        }
      }
      for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language)
        .providerExtensionCatalog) {
        if (!pattern.test(providerExtensionCatalogContent)) {
          fail(
            `Language metadata scaffold provider extension lookup helper drift for ${languageEntry.language}: ${pattern}`,
          );
        }
      }

      const providerSelectionPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        languageEntry.metadataScaffold.providerSelectionRelativePath,
      );
      if (!existsSync(providerSelectionPath)) {
        fail(`Missing required language metadata scaffold for ${languageEntry.language}: ${languageEntry.metadataScaffold.providerSelectionRelativePath}`);
      }

      const providerSelectionContent = readFileSync(providerSelectionPath, 'utf8');
      for (const token of [
        'RtcProviderSelection',
        'providerKey',
        'source',
        'providerUrl',
        'tenantOverrideProviderKey',
        'deploymentProfileProviderKey',
        'default_provider',
      ]) {
        assertReservedLanguageToken(
          languageEntry.language,
          providerSelectionContent,
          token,
          `Language metadata scaffold provider selection token drift for ${languageEntry.language}: ${token}`,
        );
      }
      for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerSelection) {
        if (!pattern.test(providerSelectionContent)) {
          fail(
            `Language metadata scaffold provider selection helper drift for ${languageEntry.language}: ${pattern}`,
          );
        }
      }

      const driverManagerPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        languageEntry.resolutionScaffold.driverManagerRelativePath,
      );
      if (!existsSync(driverManagerPath)) {
        fail(`Missing required language resolution scaffold for ${languageEntry.language}: ${languageEntry.resolutionScaffold.driverManagerRelativePath}`);
      }

      const driverManagerContent = readFileSync(driverManagerPath, 'utf8');
      for (const pattern of [
        /RtcDriverManager/,
        /resolveSelection/i,
        /describeProviderSupport/i,
        /listProviderSupport/i,
      ]) {
        if (!pattern.test(driverManagerContent)) {
          fail(`Language resolution scaffold driver manager token drift for ${languageEntry.language}: ${pattern}`);
        }
      }
      for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language)
        .driverManagerDelegates) {
        if (!pattern.test(driverManagerContent)) {
          fail(
            `Language resolution scaffold driver manager delegate drift for ${languageEntry.language}: ${pattern}`,
          );
        }
      }

      const dataSourcePath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        languageEntry.resolutionScaffold.dataSourceRelativePath,
      );
      if (!existsSync(dataSourcePath)) {
        fail(`Missing required language resolution scaffold for ${languageEntry.language}: ${languageEntry.resolutionScaffold.dataSourceRelativePath}`);
      }

      const dataSourceContent = readFileSync(dataSourcePath, 'utf8');
      for (const pattern of [
        /RtcDataSource/,
        /RtcDataSourceOptions/,
        /describeSelection/i,
        /describeProviderSupport/i,
        /listProviderSupport/i,
        /defaultProviderKey|DefaultProviderKey/,
      ]) {
        if (!pattern.test(dataSourceContent)) {
          fail(`Language resolution scaffold data source token drift for ${languageEntry.language}: ${pattern}`);
        }
      }

      const providerSupportPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        languageEntry.resolutionScaffold.providerSupportRelativePath,
      );
      if (!existsSync(providerSupportPath)) {
        fail(`Missing required language resolution scaffold for ${languageEntry.language}: ${languageEntry.resolutionScaffold.providerSupportRelativePath}`);
      }

      const providerSupportContent = readFileSync(providerSupportPath, 'utf8');
      for (const token of [
        'RtcProviderSupport',
        'providerKey',
        'status',
        'builtin',
        'official',
        'registered',
        'official_unregistered',
        'unknown',
      ]) {
        assertReservedLanguageToken(
          languageEntry.language,
          providerSupportContent,
          token,
          `Language resolution scaffold provider support token drift for ${languageEntry.language}: ${token}`,
        );
      }
      for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerSupport) {
        if (!pattern.test(providerSupportContent)) {
          fail(
            `Language resolution scaffold provider support helper drift for ${languageEntry.language}: ${pattern}`,
          );
        }
      }

      const providerPackageLoaderPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        languageEntry.resolutionScaffold.providerPackageLoaderRelativePath,
      );
      if (!existsSync(providerPackageLoaderPath)) {
        fail(`Missing required language resolution scaffold for ${languageEntry.language}: ${languageEntry.resolutionScaffold.providerPackageLoaderRelativePath}`);
      }

      const providerPackageLoaderContent = readFileSync(providerPackageLoaderPath, 'utf8');
      for (const token of [
        'RtcProviderPackageLoadRequest',
        'RtcResolvedProviderPackageLoadTarget',
        'RtcProviderPackageLoader',
        'provider_package_not_found',
        'provider_package_identity_mismatch',
        'provider_package_load_failed',
        'provider_module_export_missing',
      ]) {
        assertReservedLanguageToken(
          languageEntry.language,
          providerPackageLoaderContent,
          token,
          `Language resolution scaffold provider package loader token drift for ${languageEntry.language}: ${token}`,
        );
      }
      for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerPackageLoader) {
        if (!pattern.test(providerPackageLoaderContent)) {
          fail(
            `Language resolution scaffold provider package loader helper drift for ${languageEntry.language}: ${pattern}`,
          );
        }
      }
    }
  }

  const providerCatalogPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'provider-catalog.ts',
  );
  const providerCatalogContent = readFileSync(providerCatalogPath, 'utf8');

  for (const token of [
    'RtcProviderCatalogEntry',
    'DEFAULT_RTC_PROVIDER_KEY',
    'DEFAULT_RTC_PROVIDER_PLUGIN_ID',
    'DEFAULT_RTC_PROVIDER_DRIVER_ID',
    'BUILTIN_RTC_PROVIDER_KEYS',
    'OFFICIAL_RTC_PROVIDER_KEYS',
    'BUILTIN_RTC_PROVIDER_CATALOG',
    'OFFICIAL_RTC_PROVIDER_CATALOG',
    'BUILTIN_RTC_PROVIDER_BY_KEY',
    'OFFICIAL_RTC_PROVIDER_BY_KEY',
    'getBuiltinRtcProviderMetadata',
    'getBuiltinRtcProviderMetadataByKey',
    'getOfficialRtcProviderMetadata',
    'getOfficialRtcProviderMetadataByKey',
    'getRtcProviderByProviderKey',
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(providerCatalogContent)) {
      fail(`TypeScript provider catalog token drift: ${token}`);
    }
  }

  const capabilityCatalogPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'capability-catalog.ts',
  );
  const capabilityCatalogContent = readFileSync(capabilityCatalogPath, 'utf8');

  for (const token of [
    'RtcCapabilityDescriptor',
    'REQUIRED_RTC_CAPABILITIES',
    'OPTIONAL_RTC_CAPABILITIES',
    'RTC_CAPABILITY_CATALOG',
    'capabilityKey',
    'category',
    'surface',
    'getRtcCapabilityCatalog',
    'getRtcCapabilityDescriptor',
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(capabilityCatalogContent)) {
      fail(`TypeScript capability catalog token drift: ${token}`);
    }
  }

  const providerExtensionCatalogPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'provider-extension-catalog.ts',
  );
  const providerExtensionCatalogContent = readFileSync(providerExtensionCatalogPath, 'utf8');

  for (const token of [
    'RtcProviderExtensionDescriptor',
    'RTC_PROVIDER_EXTENSION_KEYS',
    'RTC_PROVIDER_EXTENSION_CATALOG',
    'extensionKey',
    'providerKey',
    'displayName',
    'surface',
    'access',
    'status',
    'getRtcProviderExtensionCatalog',
    'getRtcProviderExtensionDescriptor',
    'getRtcProviderExtensionsForProvider',
    'getRtcProviderExtensions',
    'hasRtcProviderExtension',
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(providerExtensionCatalogContent)) {
      fail(`TypeScript provider extension catalog token drift: ${token}`);
    }
  }

  const providerPackageCatalogPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'provider-package-catalog.ts',
  );
  const providerPackageCatalogContent = readFileSync(providerPackageCatalogPath, 'utf8');
  assertRequiredTerms(
    providerPackageCatalogContent,
    REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
    'TypeScript provider package catalog',
  );
  assertNoLegacyTypeScriptProviderPackageBoundaryTerms(
    providerPackageCatalogContent,
    'TypeScript provider package catalog',
  );

  for (const token of [
    'RtcProviderPackageCatalogEntry',
    'RTC_PROVIDER_PACKAGE_STATUSES',
    'RTC_PROVIDER_PACKAGE_CATALOG',
    'providerKey',
    'pluginId',
    'driverId',
    'packageIdentity',
    'manifestPath',
    'readmePath',
    'sourcePath',
    'declarationPath',
    'sourceSymbol',
    'sourceModule',
    'driverFactory',
    'metadataSymbol',
    'moduleSymbol',
    'builtin',
    'rootPublic',
    'status',
    'runtimeBridgeStatus',
    'extensionKeys',
    'getRtcProviderPackageCatalog',
    'getRtcProviderPackageByProviderKey',
    'getRtcProviderPackageByPackageIdentity',
    'getRtcProviderPackage',
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(providerPackageCatalogContent)) {
      fail(`TypeScript provider package catalog token drift: ${token}`);
    }
  }

  for (const provider of assembly.providers ?? []) {
    for (const value of [
      provider.providerKey,
      provider.pluginId,
      provider.driverId,
      provider.typescriptPackage.packageName,
      `providers/rtc-sdk-provider-${provider.providerKey}/package.json`,
      `providers/rtc-sdk-provider-${provider.providerKey}/README.md`,
      `providers/rtc-sdk-provider-${provider.providerKey}/index.js`,
      `providers/rtc-sdk-provider-${provider.providerKey}/index.d.ts`,
      provider.typescriptPackage.moduleSymbol,
      provider.typescriptPackage.sourceModule,
      provider.typescriptPackage.driverFactory,
      provider.typescriptPackage.metadataSymbol,
      provider.typescriptPackage.moduleSymbol,
      provider.builtin
        ? 'root_public_reference_boundary'
        : 'package_reference_boundary',
      provider.typescriptAdapter.runtimeBridgeStatus,
    ]) {
      if (!new RegExp(escapeRegExp(value)).test(providerPackageCatalogContent)) {
        fail(`TypeScript provider package catalog drift for ${provider.providerKey}: ${value}`);
      }
    }
  }

  const providerPackageLoaderPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'provider-package-loader.ts',
  );
  const providerPackageLoaderContent = readFileSync(providerPackageLoaderPath, 'utf8');

  for (const token of [
    'RtcProviderPackageLoadRequest',
    'RtcResolvedProviderPackageLoadTarget',
    'RtcProviderModuleNamespace',
    'RtcProviderPackageImportFn',
    'RtcProviderPackageLoader',
    'RtcProviderPackageInstallRequest',
    'getRtcProviderPackageByProviderKey',
    'getRtcProviderPackageByPackageIdentity',
    'createRtcProviderPackageLoader',
    'resolveRtcProviderPackageLoadTarget',
    'loadRtcProviderModule',
    'installRtcProviderPackage',
    'installRtcProviderPackages',
    'provider_package_not_found',
    'provider_package_identity_mismatch',
    'provider_package_load_failed',
    'provider_module_export_missing',
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(providerPackageLoaderContent)) {
      fail(`TypeScript provider package loader token drift: ${token}`);
    }
  }

  const runtimeSurfacePath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'runtime-surface.ts',
  );
  const runtimeSurfaceContent = readFileSync(runtimeSurfacePath, 'utf8');

  for (const token of [
    'RTC_RUNTIME_SURFACE_METHODS',
    'RtcRuntimeSurfaceMethodName',
    'RTC_RUNTIME_SURFACE_FAILURE_CODE',
    'RtcRuntimeSurfaceFailureCode',
    'RTC_RUNTIME_SURFACE_STANDARD',
    'freezeRtcRuntimeValue',
    ...RTC_RUNTIME_SURFACE_METHODS,
    RTC_RUNTIME_SURFACE_FAILURE_CODE,
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(runtimeSurfaceContent)) {
      fail(`TypeScript runtime surface token drift: ${token}`);
    }
  }

  const runtimeImmutabilityPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'runtime-immutability.ts',
  );
  const runtimeImmutabilityContent = readFileSync(runtimeImmutabilityPath, 'utf8');

  for (const token of [
    'RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM',
    'RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM',
    'RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM',
    'RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM',
    'RTC_RUNTIME_IMMUTABILITY_STANDARD',
    'freezeRtcRuntimeValue',
    RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM,
    RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM,
    RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM,
    RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM,
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(runtimeImmutabilityContent)) {
      fail(`TypeScript runtime immutability token drift: ${token}`);
    }
  }

  const rootPublicSurfacePath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'root-public-surface.ts',
  );
  const rootPublicSurfaceContent = readFileSync(rootPublicSurfacePath, 'utf8');

  for (const token of [
    'RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS',
    'RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS',
    'RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES',
    'RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES',
    'RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS',
    'RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM',
    'RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM',
    'RTC_ROOT_PUBLIC_SURFACE_STANDARD',
    'RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS',
    'RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS',
    'RTC_LOOKUP_HELPER_NAMING_STANDARD',
    './lookup-helper-naming.js',
    'freezeRtcRuntimeValue',
    ...RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS,
    ...RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS,
    ...RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES,
    ...RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES,
    ...Object.keys(RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS),
    ...Object.values(RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS),
    RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM,
    RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM,
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(rootPublicSurfaceContent)) {
      fail(`TypeScript root public surface token drift: ${token}`);
    }
  }

  const lookupHelperNamingPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'lookup-helper-naming.ts',
  );
  const lookupHelperNamingContent = readFileSync(lookupHelperNamingPath, 'utf8');

  for (const token of [
    'RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS',
    'RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS',
    'RTC_LOOKUP_HELPER_NAMING_STANDARD',
    'freezeRtcRuntimeValue',
    ...DEFAULT_LOOKUP_HELPER_NAMING_STANDARD.profileTerms,
    ...DEFAULT_LOOKUP_HELPER_NAMING_STANDARD.familyTerms,
    ...Object.values(DEFAULT_LOOKUP_HELPER_NAMING_STANDARD.profiles).flatMap((profile) => [
      ...profile.languages,
      ...Object.values(profile.helpers),
    ]),
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(lookupHelperNamingContent)) {
      fail(`TypeScript lookup helper naming token drift: ${token}`);
    }
  }

  const typeScriptIndexPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'index.ts',
  );
  const typeScriptIndexContent = readFileSync(typeScriptIndexPath, 'utf8');

  for (const token of [
    './capability-negotiation.js',
    './provider-package-loader.js',
    './runtime-immutability.js',
    './root-public-surface.js',
    './runtime-surface.js',
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(typeScriptIndexContent)) {
      fail(`TypeScript index export drift: ${token}`);
    }
  }

  const expectedTypeScriptIndexExports = [
    ...RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS,
    ...RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS,
  ];
  const actualTypeScriptIndexExports = [
    ...typeScriptIndexContent.matchAll(/export \* from '([^']+)';/g),
  ].map((match) => match[1]);

  if (
    JSON.stringify(actualTypeScriptIndexExports) !== JSON.stringify(expectedTypeScriptIndexExports)
  ) {
    fail('TypeScript index export graph must exactly match rootPublicSurfaceStandard');
  }

  for (const helperName of RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES) {
    if (!new RegExp(`export function ${escapeRegExp(helperName)}\\s*\\(`).test(typeScriptIndexContent)) {
      fail(`TypeScript root inline helper drift: ${helperName}`);
    }
  }

  const providerActivationCatalogPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'provider-activation-catalog.ts',
  );
  const providerActivationCatalogContent = readFileSync(providerActivationCatalogPath, 'utf8');

  for (const token of [
    'RtcProviderActivationEntry',
    'RTC_PROVIDER_ACTIVATION_STATUSES',
    'RTC_PROVIDER_ACTIVATION_CATALOG',
    'providerKey',
    'pluginId',
    'driverId',
    'activationStatus',
    'runtimeBridge',
    'rootPublic',
    'packageBoundary',
    'builtin',
    'packageIdentity',
    'getRtcProviderActivationCatalog',
    'getRtcProviderActivationByProviderKey',
    'getRtcProviderActivation',
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(providerActivationCatalogContent)) {
      fail(`TypeScript provider activation catalog token drift: ${token}`);
    }
  }

  const languageWorkspaceCatalogPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'language-workspace-catalog.ts',
  );
  const languageWorkspaceCatalogContent = readFileSync(languageWorkspaceCatalogPath, 'utf8');
  assertRequiredTerms(
    languageWorkspaceCatalogContent,
    REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
    'TypeScript language workspace catalog',
  );
  assertNoLegacyTypeScriptProviderPackageBoundaryTerms(
    languageWorkspaceCatalogContent,
    'TypeScript language workspace catalog',
  );

  for (const token of [
    'RtcLanguageWorkspaceCatalogEntry',
    'OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS',
    'RTC_LANGUAGE_WORKSPACE_CATALOG',
    'language',
    'workspace',
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
    'getRtcLanguageWorkspaceCatalog',
    'getRtcLanguageWorkspaceByLanguage',
    'getRtcLanguageWorkspace',
    ...RTC_PROVIDER_SELECTION_SOURCES,
    ...RTC_PROVIDER_SUPPORT_STATUSES,
    ...RTC_PROVIDER_ACTIVATION_STATUSES,
    ...RTC_PROVIDER_PACKAGE_BOUNDARY_MODES,
    ...RTC_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES,
    ...RTC_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS,
    ...RTC_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS,
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(languageWorkspaceCatalogContent)) {
      fail(`TypeScript language workspace catalog token drift: ${token}`);
    }
  }

  const providerSelectionPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'provider-selection.ts',
  );
  const providerSelectionContent = readFileSync(providerSelectionPath, 'utf8');

  for (const token of [
    'RtcProviderSelectionRequest',
    'RtcProviderSelectionSource',
    'RTC_PROVIDER_SELECTION_SOURCES',
    'RTC_PROVIDER_SELECTION_PRECEDENCE',
    'providerUrl',
    'providerKey',
    'tenantOverrideProviderKey',
    'deploymentProfileProviderKey',
    'parseRtcProviderUrl',
    'resolveRtcProviderSelection',
    'defaultProviderKey',
    ...RTC_PROVIDER_SELECTION_SOURCES,
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(providerSelectionContent)) {
      fail(`TypeScript provider selection token drift: ${token}`);
    }
  }

  const capabilityNegotiationPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'capability-negotiation.ts',
  );
  const capabilityNegotiationContent = readFileSync(capabilityNegotiationPath, 'utf8');

  for (const token of [
    'RtcCapabilityNegotiationStatus',
    'RtcCapabilityNegotiationRule',
    'RTC_CAPABILITY_NEGOTIATION_STATUSES',
    'RTC_CAPABILITY_NEGOTIATION_RULES',
    'resolveRtcCapabilityNegotiationStatus',
    ...RTC_CAPABILITY_NEGOTIATION_STATUSES,
    ...Object.values(RTC_CAPABILITY_NEGOTIATION_RULES),
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(capabilityNegotiationContent)) {
      fail(`TypeScript capability negotiation token drift: ${token}`);
    }
  }

  const errorsPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'errors.ts',
  );
  const errorsContent = readFileSync(errorsPath, 'utf8');

  for (const token of [
    'RtcSdkErrorCode',
    'RtcSdkExceptionOptions',
    'RtcSdkException',
    'RTC_SDK_ERROR_CODES',
    'RTC_SDK_ERROR_FALLBACK_CODE',
    ...RTC_SDK_ERROR_CODES,
    RTC_SDK_ERROR_FALLBACK_CODE,
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(errorsContent)) {
      fail(`TypeScript errors token drift: ${token}`);
    }
  }

  const providerSupportPath = path.join(
    workspaceRoot,
    'sdkwork-rtc-sdk-typescript',
    'src',
    'provider-support.ts',
  );
  const providerSupportContent = readFileSync(providerSupportPath, 'utf8');

  for (const token of [
    'RtcProviderSupportStateRequest',
    'RtcProviderSupportStatus',
    'RTC_PROVIDER_SUPPORT_STATUSES',
    'providerKey',
    'builtin',
    'official',
    'registered',
    'resolveRtcProviderSupportStatus',
    'createRtcProviderSupportState',
    ...RTC_PROVIDER_SUPPORT_STATUSES,
  ]) {
    if (!new RegExp(escapeRegExp(token)).test(providerSupportContent)) {
      fail(`TypeScript provider support token drift: ${token}`);
    }
  }

  for (const entry of buildRtcSdkMaterializationPlan(workspaceRoot)) {
    const filePath = path.join(workspaceRoot, entry.relativePath);
    const actualContent = readFileSync(filePath, 'utf8');

    if (actualContent !== entry.content) {
      fail(`Materialized asset drift detected: ${entry.relativePath}`);
    }
  }

  for (const relativePath of RTC_SDK_STALE_MATERIALIZED_FILES) {
    if (existsSync(path.join(workspaceRoot, relativePath))) {
      fail(`Stale legacy provider catalog asset must not exist: ${relativePath}`);
    }
  }

  verifyFlutterRtcSignalingBoundary(workspaceRoot);
  verifyFlutterTypeScriptParity(workspaceRoot);
}

const workspaceRoot = resolveRtcSdkWorkspaceRoot(import.meta.url);
const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
const isCliEntry = invokedPath === import.meta.url;

if (isCliEntry) {
  try {
    verifyRtcSdkWorkspace(workspaceRoot);
    console.log('[sdkwork-rtc-sdk] verification passed');
  } catch (error) {
    console.error(`[sdkwork-rtc-sdk] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
