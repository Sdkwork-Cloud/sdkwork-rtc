import {
  RTC_CAPABILITY_CATEGORIES,
  RTC_CAPABILITY_NEGOTIATION_RULES,
  RTC_CAPABILITY_NEGOTIATION_STATUSES,
  DEFAULT_SIGNALING_TRANSPORT_STANDARD,
  DEFAULT_LOOKUP_HELPER_NAMING_STANDARD,
  DEFAULT_ROOT_PUBLIC_SURFACE_STANDARD,
  RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM,
  RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM,
  RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM,
  RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM,
  RTC_CAPABILITY_SURFACES,
  RTC_RUNTIME_SURFACE_FAILURE_CODE,
  RTC_RUNTIME_SURFACE_METHODS,
  RTC_SDK_ERROR_CODES,
  RTC_SDK_ERROR_FALLBACK_CODE,
  BUILTIN_RTC_PROVIDER_KEYS,
  DEFAULT_RTC_PROVIDER_KEY,
  DEFAULT_TYPESCRIPT_ADAPTER_CONTRACT,
  DEFAULT_TYPESCRIPT_PACKAGE_STANDARD,
  RTC_LANGUAGE_MATURITY_TIERS,
  RTC_LANGUAGE_MATURITY_TIER_SUMMARIES,
  OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS,
  RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS,
  RTC_PROVIDER_ACTIVATION_STATUSES,
  RTC_PROVIDER_EXTENSION_ACCESSES,
  RTC_PROVIDER_EXTENSION_STATUSES,
  RTC_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS,
  RTC_PROVIDER_PACKAGE_BOUNDARY_MODES,
  RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES,
  RTC_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES,
  RTC_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS,
  RTC_PROVIDER_TIERS,
  RTC_PROVIDER_TIER_SUMMARIES,
  RTC_PROVIDER_SELECTION_PRECEDENCE,
  RTC_PROVIDER_SELECTION_SOURCES,
  RTC_PROVIDER_SUPPORT_STATUSES,
  TYPESCRIPT_ADAPTER_BINDING_STRATEGIES,
  TYPESCRIPT_ADAPTER_BUNDLE_POLICIES,
  TYPESCRIPT_ADAPTER_OFFICIAL_VENDOR_SDK_REQUIREMENTS,
  TYPESCRIPT_ADAPTER_RUNTIME_BRIDGE_STATUSES,
  TYPESCRIPT_ADAPTER_SDK_PROVISIONING_VALUES,
} from './rtc-standard-contract-constants.mjs';

function hasExactArray(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

export const RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_MODES = ['runtime-backed', 'analysis-backed'];
const RTC_LANGUAGE_RUNTIME_DOCUMENTATION_REQUIRED_FIELDS = [
  'baselineConclusion',
  'guideTitle',
  'runtimeLabel',
  'detailedGuidePath',
  'detailedGuideLabel',
  'smokeNarrative',
];

export function getRtcAssemblyLanguageEntries(assembly) {
  const languageEntries = assembly?.languages ?? [];
  if (!Array.isArray(languageEntries)) {
    throw new Error('assembly.languages must be an array');
  }

  return languageEntries;
}

export function getRtcLanguageEntryByLanguage(assembly, language) {
  return getRtcAssemblyLanguageEntries(assembly).find(
    (languageEntry) => languageEntry.language === language,
  );
}

export function isRtcExecutableLanguageEntry(languageEntry) {
  return (
    languageEntry?.runtimeBridge === true &&
    languageEntry?.maturityTier === 'reference' &&
    typeof languageEntry?.workspace === 'string' &&
    languageEntry.workspace.length > 0 &&
    languageEntry?.runtimeBaseline != null
  );
}

export function getRtcExecutableLanguageEntries(assembly) {
  return getRtcAssemblyLanguageEntries(assembly).filter(isRtcExecutableLanguageEntry);
}

export function getRtcExecutableLanguageEntryByLanguage(assembly, language) {
  return getRtcExecutableLanguageEntries(assembly).find(
    (languageEntry) => languageEntry.language === language,
  );
}

export function getRtcExecutableLanguageEntriesBySmokeMode(assembly, smokeMode) {
  if (!RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_MODES.includes(smokeMode)) {
    throw new Error(
      `Unknown RTC runtime baseline smoke mode: ${smokeMode}. Expected one of ${RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_MODES.join(', ')}`,
    );
  }

  return getRtcExecutableLanguageEntries(assembly).filter(
    (languageEntry) => languageEntry.runtimeBaseline?.smokeMode === smokeMode,
  );
}

export function getRtcDefaultCallSmokeLanguage(assembly) {
  const runtimeBackedEntries = getRtcExecutableLanguageEntriesBySmokeMode(
    assembly,
    'runtime-backed',
  );
  if (runtimeBackedEntries.length > 0) {
    return runtimeBackedEntries[0].language;
  }

  const executableEntries = getRtcExecutableLanguageEntries(assembly);
  if (executableEntries.length === 0) {
    throw new Error('Assembly does not declare any executable RTC language entries');
  }

  return executableEntries[0].language;
}

export function assertRtcAssemblyWorkspaceBaseline(assembly) {
  if (assembly.workspace !== 'sdkwork-rtc-sdk') {
    throw new Error(`Unexpected workspace name: ${assembly.workspace}`);
  }

  if (assembly.defaults?.providerKey !== DEFAULT_RTC_PROVIDER_KEY) {
    throw new Error(
      `Default provider must be ${DEFAULT_RTC_PROVIDER_KEY}, received: ${assembly.defaults?.providerKey ?? '<missing>'}`,
    );
  }

  const officialLanguages = assembly.officialLanguages ?? [];
  if (
    !Array.isArray(officialLanguages) ||
    !hasExactArray(officialLanguages, OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS)
  ) {
    throw new Error(
      `officialLanguages must declare the full nine-language family: ${OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS.join(', ')}`,
    );
  }

  const providers = assembly.providers ?? [];
  const builtinProviderKeys = providers
    .filter((provider) => provider.builtin)
    .map((provider) => provider.providerKey);
  if (!hasExactArray(builtinProviderKeys, BUILTIN_RTC_PROVIDER_KEYS)) {
    throw new Error(`Builtin providers must be ${BUILTIN_RTC_PROVIDER_KEYS.join(', ')}`);
  }

  const defaultProviderEntry = providers.find(
    (provider) => provider.providerKey === DEFAULT_RTC_PROVIDER_KEY,
  );
  if (!defaultProviderEntry?.builtin) {
    throw new Error('Default provider must point at a builtin providers entry');
  }

  if (!defaultProviderEntry?.defaultSelected) {
    throw new Error('Default provider must also be marked as the default-selected provider');
  }

  const defaultSelectedProviders = providers
    .filter((provider) => provider.defaultSelected)
    .map((provider) => provider.providerKey);
  if (!hasExactArray(defaultSelectedProviders, [DEFAULT_RTC_PROVIDER_KEY])) {
    throw new Error(
      'Assembly must declare exactly one defaultSelected provider and it must match defaults.providerKey',
    );
  }

  const providerSelectionStandard = assembly.providerSelectionStandard ?? {};
  if (!hasExactArray(providerSelectionStandard.sourceTerms, RTC_PROVIDER_SELECTION_SOURCES)) {
    throw new Error(
      `providerSelectionStandard.sourceTerms must be ${RTC_PROVIDER_SELECTION_SOURCES.join(', ')}`,
    );
  }

  if (!hasExactArray(providerSelectionStandard.precedence, RTC_PROVIDER_SELECTION_PRECEDENCE)) {
    throw new Error(
      `providerSelectionStandard.precedence must be ${RTC_PROVIDER_SELECTION_PRECEDENCE.join(', ')}`,
    );
  }

  const canonicalDefaultSelectionSource =
    RTC_PROVIDER_SELECTION_SOURCES[RTC_PROVIDER_SELECTION_SOURCES.length - 1];
  if (providerSelectionStandard.defaultSource !== canonicalDefaultSelectionSource) {
    throw new Error(
      `providerSelectionStandard.defaultSource must be ${canonicalDefaultSelectionSource}, received: ${providerSelectionStandard.defaultSource ?? '<missing>'}`,
    );
  }

  const providerSupportStandard = assembly.providerSupportStandard ?? {};
  if (!hasExactArray(providerSupportStandard.statusTerms, RTC_PROVIDER_SUPPORT_STATUSES)) {
    throw new Error(
      `providerSupportStandard.statusTerms must be ${RTC_PROVIDER_SUPPORT_STATUSES.join(', ')}`,
    );
  }

  const providerActivationStandard = assembly.providerActivationStandard ?? {};
  if (!hasExactArray(providerActivationStandard.statusTerms, RTC_PROVIDER_ACTIVATION_STATUSES)) {
    throw new Error(
      `providerActivationStandard.statusTerms must be ${RTC_PROVIDER_ACTIVATION_STATUSES.join(', ')}`,
    );
  }

  const capabilityStandard = assembly.capabilityStandard ?? {};
  if (!hasExactArray(capabilityStandard.categoryTerms, RTC_CAPABILITY_CATEGORIES)) {
    throw new Error(
      `capabilityStandard.categoryTerms must be ${RTC_CAPABILITY_CATEGORIES.join(', ')}`,
    );
  }

  if (!hasExactArray(capabilityStandard.surfaceTerms, RTC_CAPABILITY_SURFACES)) {
    throw new Error(
      `capabilityStandard.surfaceTerms must be ${RTC_CAPABILITY_SURFACES.join(', ')}`,
    );
  }

  const capabilityNegotiationStandard = assembly.capabilityNegotiationStandard ?? {};
  if (
    !hasExactArray(
      capabilityNegotiationStandard.statusTerms,
      RTC_CAPABILITY_NEGOTIATION_STATUSES,
    )
  ) {
    throw new Error(
      `capabilityNegotiationStandard.statusTerms must be ${RTC_CAPABILITY_NEGOTIATION_STATUSES.join(', ')}`,
    );
  }

  if (
    JSON.stringify(capabilityNegotiationStandard.statusRules ?? {}) !==
    JSON.stringify(RTC_CAPABILITY_NEGOTIATION_RULES)
  ) {
    throw new Error(
      'capabilityNegotiationStandard.statusRules must exactly match the canonical negotiation rules',
    );
  }

  const runtimeSurfaceStandard = assembly.runtimeSurfaceStandard ?? {};
  if (!hasExactArray(runtimeSurfaceStandard.methodTerms, RTC_RUNTIME_SURFACE_METHODS)) {
    throw new Error(
      `runtimeSurfaceStandard.methodTerms must be ${RTC_RUNTIME_SURFACE_METHODS.join(', ')}`,
    );
  }

  if (runtimeSurfaceStandard.failureCode !== RTC_RUNTIME_SURFACE_FAILURE_CODE) {
    throw new Error(
      `runtimeSurfaceStandard.failureCode must be ${RTC_RUNTIME_SURFACE_FAILURE_CODE}, received: ${runtimeSurfaceStandard.failureCode ?? '<missing>'}`,
    );
  }

  const signalingTransportStandard = assembly.signalingTransportStandard ?? {};
  if (
    JSON.stringify(signalingTransportStandard) !==
    JSON.stringify(DEFAULT_SIGNALING_TRANSPORT_STANDARD)
  ) {
    throw new Error(
      'signalingTransportStandard must exactly match the canonical WebSocket signaling transport contract',
    );
  }

  const runtimeImmutabilityStandard = assembly.runtimeImmutabilityStandard ?? {};
  if (runtimeImmutabilityStandard.frozenTerm !== RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM) {
    throw new Error(
      `runtimeImmutabilityStandard.frozenTerm must be ${RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM}, received: ${runtimeImmutabilityStandard.frozenTerm ?? '<missing>'}`,
    );
  }

  if (runtimeImmutabilityStandard.snapshotTerm !== RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM) {
    throw new Error(
      `runtimeImmutabilityStandard.snapshotTerm must be ${RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM}, received: ${runtimeImmutabilityStandard.snapshotTerm ?? '<missing>'}`,
    );
  }

  if (
    runtimeImmutabilityStandard.controllerContextTerm !==
    RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM
  ) {
    throw new Error(
      `runtimeImmutabilityStandard.controllerContextTerm must be ${RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM}, received: ${runtimeImmutabilityStandard.controllerContextTerm ?? '<missing>'}`,
    );
  }

  if (
    runtimeImmutabilityStandard.nativeClientTerm !== RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM
  ) {
    throw new Error(
      `runtimeImmutabilityStandard.nativeClientTerm must be ${RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM}, received: ${runtimeImmutabilityStandard.nativeClientTerm ?? '<missing>'}`,
    );
  }

  const rootPublicSurfaceStandard = assembly.rootPublicSurfaceStandard ?? {};
  if (
    JSON.stringify(rootPublicSurfaceStandard) !==
    JSON.stringify(DEFAULT_ROOT_PUBLIC_SURFACE_STANDARD)
  ) {
    throw new Error(
      'rootPublicSurfaceStandard must exactly match the canonical root public surface contract',
    );
  }

  const lookupHelperNamingStandard = assembly.lookupHelperNamingStandard ?? {};
  if (
    JSON.stringify(lookupHelperNamingStandard) !==
    JSON.stringify(DEFAULT_LOOKUP_HELPER_NAMING_STANDARD)
  ) {
    throw new Error(
      'lookupHelperNamingStandard must exactly match the canonical lookup helper naming contract',
    );
  }

  const errorCodeStandard = assembly.errorCodeStandard ?? {};
  if (!hasExactArray(errorCodeStandard.codeTerms, RTC_SDK_ERROR_CODES)) {
    throw new Error(
      `errorCodeStandard.codeTerms must be ${RTC_SDK_ERROR_CODES.join(', ')}`,
    );
  }

  if (errorCodeStandard.fallbackCode !== RTC_SDK_ERROR_FALLBACK_CODE) {
    throw new Error(
      `errorCodeStandard.fallbackCode must be ${RTC_SDK_ERROR_FALLBACK_CODE}, received: ${errorCodeStandard.fallbackCode ?? '<missing>'}`,
    );
  }

  const providerExtensionStandard = assembly.providerExtensionStandard ?? {};
  if (!hasExactArray(providerExtensionStandard.accessTerms, RTC_PROVIDER_EXTENSION_ACCESSES)) {
    throw new Error(
      `providerExtensionStandard.accessTerms must be ${RTC_PROVIDER_EXTENSION_ACCESSES.join(', ')}`,
    );
  }

  if (!hasExactArray(providerExtensionStandard.statusTerms, RTC_PROVIDER_EXTENSION_STATUSES)) {
    throw new Error(
      `providerExtensionStandard.statusTerms must be ${RTC_PROVIDER_EXTENSION_STATUSES.join(', ')}`,
    );
  }

  const providerTierStandard = assembly.providerTierStandard ?? {};
  if (!hasExactArray(providerTierStandard.tierTerms, RTC_PROVIDER_TIERS)) {
    throw new Error(
      `providerTierStandard.tierTerms must be ${RTC_PROVIDER_TIERS.join(', ')}`,
    );
  }

  if (
    JSON.stringify(providerTierStandard.tierSummaries ?? {}) !==
    JSON.stringify(RTC_PROVIDER_TIER_SUMMARIES)
  ) {
    throw new Error('providerTierStandard.tierSummaries must exactly match the canonical tier summaries');
  }

  const languageMaturityStandard = assembly.languageMaturityStandard ?? {};
  if (!hasExactArray(languageMaturityStandard.tierTerms, RTC_LANGUAGE_MATURITY_TIERS)) {
    throw new Error(
      `languageMaturityStandard.tierTerms must be ${RTC_LANGUAGE_MATURITY_TIERS.join(', ')}`,
    );
  }

  if (
    JSON.stringify(languageMaturityStandard.tierSummaries ?? {}) !==
    JSON.stringify(RTC_LANGUAGE_MATURITY_TIER_SUMMARIES)
  ) {
    throw new Error(
      'languageMaturityStandard.tierSummaries must exactly match the canonical maturity summaries',
    );
  }

  const typescriptAdapterStandard = assembly.typescriptAdapterStandard ?? {};
  if (
    !hasExactArray(
      typescriptAdapterStandard.sdkProvisioningTerms,
      TYPESCRIPT_ADAPTER_SDK_PROVISIONING_VALUES,
    )
  ) {
    throw new Error(
      `typescriptAdapterStandard.sdkProvisioningTerms must be ${TYPESCRIPT_ADAPTER_SDK_PROVISIONING_VALUES.join(', ')}`,
    );
  }

  if (
    !hasExactArray(
      typescriptAdapterStandard.bindingStrategyTerms,
      TYPESCRIPT_ADAPTER_BINDING_STRATEGIES,
    )
  ) {
    throw new Error(
      `typescriptAdapterStandard.bindingStrategyTerms must be ${TYPESCRIPT_ADAPTER_BINDING_STRATEGIES.join(', ')}`,
    );
  }

  if (
    !hasExactArray(
      typescriptAdapterStandard.bundlePolicyTerms,
      TYPESCRIPT_ADAPTER_BUNDLE_POLICIES,
    )
  ) {
    throw new Error(
      `typescriptAdapterStandard.bundlePolicyTerms must be ${TYPESCRIPT_ADAPTER_BUNDLE_POLICIES.join(', ')}`,
    );
  }

  if (
    !hasExactArray(
      typescriptAdapterStandard.runtimeBridgeStatusTerms,
      TYPESCRIPT_ADAPTER_RUNTIME_BRIDGE_STATUSES,
    )
  ) {
    throw new Error(
      `typescriptAdapterStandard.runtimeBridgeStatusTerms must be ${TYPESCRIPT_ADAPTER_RUNTIME_BRIDGE_STATUSES.join(', ')}`,
    );
  }

  if (
    !hasExactArray(
      typescriptAdapterStandard.officialVendorSdkRequirementTerms,
      TYPESCRIPT_ADAPTER_OFFICIAL_VENDOR_SDK_REQUIREMENTS,
    )
  ) {
    throw new Error(
      `typescriptAdapterStandard.officialVendorSdkRequirementTerms must be ${TYPESCRIPT_ADAPTER_OFFICIAL_VENDOR_SDK_REQUIREMENTS.join(', ')}`,
    );
  }

  if (
    JSON.stringify(typescriptAdapterStandard.referenceContract ?? {}) !==
    JSON.stringify(DEFAULT_TYPESCRIPT_ADAPTER_CONTRACT)
  ) {
    throw new Error(
      'typescriptAdapterStandard.referenceContract must exactly match the canonical TypeScript adapter baseline',
    );
  }

  const typescriptPackageStandard = assembly.typescriptPackageStandard ?? {};
  if (
    JSON.stringify(typescriptPackageStandard) !==
    JSON.stringify(DEFAULT_TYPESCRIPT_PACKAGE_STANDARD)
  ) {
    throw new Error(
      'typescriptPackageStandard must exactly match the canonical TypeScript package naming standard',
    );
  }

  const providerPackageBoundaryStandard = assembly.providerPackageBoundaryStandard ?? {};
  if (!hasExactArray(providerPackageBoundaryStandard.modeTerms, RTC_PROVIDER_PACKAGE_BOUNDARY_MODES)) {
    throw new Error(
      `providerPackageBoundaryStandard.modeTerms must be ${RTC_PROVIDER_PACKAGE_BOUNDARY_MODES.join(', ')}`,
    );
  }

  if (
    !hasExactArray(
      providerPackageBoundaryStandard.rootPublicPolicyTerms,
      RTC_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES,
    )
  ) {
    throw new Error(
      `providerPackageBoundaryStandard.rootPublicPolicyTerms must be ${RTC_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES.join(', ')}`,
    );
  }

  if (
    !hasExactArray(
      providerPackageBoundaryStandard.lifecycleStatusTerms,
      RTC_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS,
    )
  ) {
    throw new Error(
      `providerPackageBoundaryStandard.lifecycleStatusTerms must be ${RTC_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS.join(', ')}`,
    );
  }

  if (
    !hasExactArray(
      providerPackageBoundaryStandard.runtimeBridgeStatusTerms,
      RTC_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS,
    )
  ) {
    throw new Error(
      `providerPackageBoundaryStandard.runtimeBridgeStatusTerms must be ${RTC_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS.join(', ')}`,
    );
  }

  const referenceProfile = providerPackageBoundaryStandard.profiles?.reference ?? {};
  if (referenceProfile.mode !== RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reference.mode) {
    throw new Error(
      `providerPackageBoundaryStandard.profiles.reference.mode must be ${RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reference.mode}`,
    );
  }

  if (
    referenceProfile.rootPublicPolicy !==
    RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reference.rootPublicPolicy
  ) {
    throw new Error(
      `providerPackageBoundaryStandard.profiles.reference.rootPublicPolicy must be ${RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reference.rootPublicPolicy}`,
    );
  }

  if (
    !hasExactArray(
      referenceProfile.lifecycleStatusTerms,
      RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reference.lifecycleStatusTerms,
    )
  ) {
    throw new Error(
      `providerPackageBoundaryStandard.profiles.reference.lifecycleStatusTerms must be ${RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reference.lifecycleStatusTerms.join(', ')}`,
    );
  }

  if (
    !hasExactArray(
      referenceProfile.runtimeBridgeStatusTerms,
      RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reference.runtimeBridgeStatusTerms,
    )
  ) {
    throw new Error(
      `providerPackageBoundaryStandard.profiles.reference.runtimeBridgeStatusTerms must be ${RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reference.runtimeBridgeStatusTerms.join(', ')}`,
    );
  }

  const reservedProfile = providerPackageBoundaryStandard.profiles?.reserved ?? {};
  if (reservedProfile.mode !== RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reserved.mode) {
    throw new Error(
      `providerPackageBoundaryStandard.profiles.reserved.mode must be ${RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reserved.mode}`,
    );
  }

  if (
    reservedProfile.rootPublicPolicy !==
    RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reserved.rootPublicPolicy
  ) {
    throw new Error(
      `providerPackageBoundaryStandard.profiles.reserved.rootPublicPolicy must be ${RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reserved.rootPublicPolicy}`,
    );
  }

  if (
    !hasExactArray(
      reservedProfile.lifecycleStatusTerms,
      RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reserved.lifecycleStatusTerms,
    )
  ) {
    throw new Error(
      `providerPackageBoundaryStandard.profiles.reserved.lifecycleStatusTerms must be ${RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reserved.lifecycleStatusTerms.join(', ')}`,
    );
  }

  if (
    !hasExactArray(
      reservedProfile.runtimeBridgeStatusTerms,
      RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reserved.runtimeBridgeStatusTerms,
    )
  ) {
    throw new Error(
      `providerPackageBoundaryStandard.profiles.reserved.runtimeBridgeStatusTerms must be ${RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES.reserved.runtimeBridgeStatusTerms.join(', ')}`,
    );
  }

  for (const languageEntry of assembly.languages ?? []) {
    const expectsRuntimeBaseline =
      languageEntry.runtimeBridge === true && languageEntry.maturityTier === 'reference';
    const runtimeBaseline = languageEntry.runtimeBaseline;
    const runtimeDocumentation = languageEntry.runtimeDocumentation;

    if (expectsRuntimeBaseline && !runtimeBaseline) {
      throw new Error(
        `Reference runtime language ${languageEntry.language} must declare runtimeBaseline metadata`,
      );
    }

    if (expectsRuntimeBaseline && !runtimeDocumentation) {
      throw new Error(
        `Reference runtime language ${languageEntry.language} must declare runtimeDocumentation metadata`,
      );
    }

    if (!expectsRuntimeBaseline && runtimeDocumentation) {
      throw new Error(
        `Non-executable language ${languageEntry.language} must not declare runtimeDocumentation metadata`,
      );
    }

    if (!runtimeBaseline) {
      continue;
    }

    for (const field of [
      'vendorSdkPackage',
      'vendorSdkImportPath',
      'signalingSdkPackage',
      'signalingSdkImportPath',
      'recommendedEntrypoint',
      'smokeCommand',
    ]) {
      if (typeof runtimeBaseline[field] !== 'string' || runtimeBaseline[field].length === 0) {
        throw new Error(
          `language ${languageEntry.language} runtimeBaseline.${field} must be a non-empty string`,
        );
      }
    }

    if (!RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_MODES.includes(runtimeBaseline.smokeMode)) {
      throw new Error(
        `language ${languageEntry.language} runtimeBaseline.smokeMode must be one of ${RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_MODES.join(', ')}`,
      );
    }

    if (
      !Array.isArray(runtimeBaseline.smokeVariants) ||
      runtimeBaseline.smokeVariants.length === 0
    ) {
      throw new Error(
        `language ${languageEntry.language} runtimeBaseline.smokeVariants must be a non-empty array`,
      );
    }

    if (
      runtimeBaseline.smokeVariants[0] !==
      RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS[0]
    ) {
      throw new Error(
        `language ${languageEntry.language} runtimeBaseline.smokeVariants must start with ${RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS[0]}`,
      );
    }

    const uniqueSmokeVariants = [...new Set(runtimeBaseline.smokeVariants)];
    if (!hasExactArray(runtimeBaseline.smokeVariants, uniqueSmokeVariants)) {
      throw new Error(
        `language ${languageEntry.language} runtimeBaseline.smokeVariants must not contain duplicates`,
      );
    }

    for (const smokeVariant of runtimeBaseline.smokeVariants) {
      if (
        typeof smokeVariant !== 'string' ||
        !RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS.includes(smokeVariant)
      ) {
        throw new Error(
          `language ${languageEntry.language} runtimeBaseline.smokeVariants must use only ${RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS.join(', ')}`,
        );
      }
    }

    const canonicalSmokeVariants = RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS.filter((variant) =>
      runtimeBaseline.smokeVariants.includes(variant),
    );
    if (!hasExactArray(runtimeBaseline.smokeVariants, canonicalSmokeVariants)) {
      throw new Error(
        `language ${languageEntry.language} runtimeBaseline.smokeVariants must preserve canonical order ${RTC_LANGUAGE_RUNTIME_BASELINE_SMOKE_VARIANTS.join(', ')}`,
      );
    }

    for (const field of RTC_LANGUAGE_RUNTIME_DOCUMENTATION_REQUIRED_FIELDS) {
      if (
        typeof runtimeDocumentation?.[field] !== 'string' ||
        runtimeDocumentation[field].length === 0
      ) {
        throw new Error(
          `language ${languageEntry.language} runtimeDocumentation.${field} must be a non-empty string`,
        );
      }
    }
  }

  return {
    officialLanguages,
    providers,
    providerSelectionStandard,
    providerSupportStandard,
    providerActivationStandard,
    capabilityStandard,
    capabilityNegotiationStandard,
    runtimeSurfaceStandard,
    signalingTransportStandard,
    runtimeImmutabilityStandard,
    rootPublicSurfaceStandard,
    lookupHelperNamingStandard,
    errorCodeStandard,
    providerExtensionStandard,
    providerTierStandard,
    languageMaturityStandard,
    typescriptAdapterStandard,
    typescriptPackageStandard,
    providerPackageBoundaryStandard,
  };
}
