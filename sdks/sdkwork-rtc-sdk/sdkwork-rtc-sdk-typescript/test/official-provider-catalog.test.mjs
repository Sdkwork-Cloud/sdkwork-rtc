import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

async function loadCatalog() {
  return import('../dist/provider-catalog.js');
}

async function loadActivationCatalog() {
  return import('../dist/provider-activation-catalog.js');
}

async function loadLanguageWorkspaceCatalog() {
  return import('../dist/language-workspace-catalog.js');
}

function readAssemblyProviders() {
  const assemblyPath = path.resolve('..', '.sdkwork-assembly.json');
  const assembly = JSON.parse(readFileSync(assemblyPath, 'utf8'));
  return assembly.providers;
}

function readAssembly() {
  const assemblyPath = path.resolve('..', '.sdkwork-assembly.json');
  return JSON.parse(readFileSync(assemblyPath, 'utf8'));
}

test('materialized rtc provider catalog matches the assembly provider registry snapshot', async () => {
  const catalog = await loadCatalog();

  const expectedProviders = readAssemblyProviders();

  assert.deepEqual(
    catalog.OFFICIAL_RTC_PROVIDER_KEYS,
    expectedProviders.map((provider) => provider.providerKey),
  );
  assert.deepEqual(
    catalog.BUILTIN_RTC_PROVIDER_KEYS,
    expectedProviders
      .filter((provider) => provider.builtin)
      .map((provider) => provider.providerKey),
  );
  assert.deepEqual(
    catalog.OFFICIAL_RTC_PROVIDER_CATALOG.map((provider) => ({
      providerKey: provider.providerKey,
      pluginId: provider.pluginId,
      driverId: provider.driverId,
      displayName: provider.displayName,
      tier: provider.tier,
      builtin: provider.builtin,
      defaultSelected: provider.defaultSelected,
      urlSchemes: provider.urlSchemes,
      requiredCapabilities: provider.requiredCapabilities,
      optionalCapabilities: provider.optionalCapabilities,
      typescriptAdapter: provider.typescriptAdapter,
    })),
    expectedProviders.map((provider) => ({
      providerKey: provider.providerKey,
      pluginId: provider.pluginId,
      driverId: provider.driverId,
      displayName: provider.displayName,
      tier: provider.tier,
      builtin: provider.builtin,
      defaultSelected: provider.defaultSelected,
      urlSchemes: provider.urlSchemes,
      requiredCapabilities: provider.requiredCapabilities,
      optionalCapabilities: provider.optionalCapabilities,
      typescriptAdapter: provider.typescriptAdapter,
    })),
  );
});

test('root sdk metadata accessors align with the materialized provider catalog', async () => {
  const {
    getBuiltinRtcProviderMetadata,
    getBuiltinRtcProviderMetadataByKey,
    getOfficialRtcProviderMetadata,
    getOfficialRtcProviderMetadataByKey,
    getRtcProviderByProviderKey,
    OFFICIAL_RTC_PROVIDER_KEYS,
  } = await loadSdk();
  const catalog = await loadCatalog();

  const builtinKeys = getBuiltinRtcProviderMetadata().map((provider) => provider.providerKey);
  const officialKeys = getOfficialRtcProviderMetadata().map((provider) => provider.providerKey);

  assert.deepEqual(builtinKeys, catalog.BUILTIN_RTC_PROVIDER_KEYS);
  assert.deepEqual(officialKeys, catalog.OFFICIAL_RTC_PROVIDER_KEYS);
  assert.deepEqual(OFFICIAL_RTC_PROVIDER_KEYS, catalog.OFFICIAL_RTC_PROVIDER_KEYS);
  assert.deepEqual(getOfficialRtcProviderMetadata(), catalog.OFFICIAL_RTC_PROVIDER_CATALOG);
  for (const builtinProvider of catalog.BUILTIN_RTC_PROVIDER_CATALOG) {
    assert.deepEqual(
      getBuiltinRtcProviderMetadataByKey(builtinProvider.providerKey),
      builtinProvider,
    );
    assert.deepEqual(
      catalog.getBuiltinRtcProviderMetadataByKey(builtinProvider.providerKey),
      builtinProvider,
    );
  }
  assert.deepEqual(
    getOfficialRtcProviderMetadataByKey('agora'),
    catalog.AGORA_RTC_PROVIDER_CATALOG_ENTRY,
  );
  assert.deepEqual(
    getRtcProviderByProviderKey('agora'),
    catalog.AGORA_RTC_PROVIDER_CATALOG_ENTRY,
  );
  assert.equal(getRtcProviderByProviderKey('vendor-x'), undefined);
  assert.equal(getOfficialRtcProviderMetadataByKey('vendor-x'), undefined);
  assert.deepEqual(
    catalog.getOfficialRtcProviderMetadataByKey('agora'),
    catalog.AGORA_RTC_PROVIDER_CATALOG_ENTRY,
  );
  assert.deepEqual(
    catalog.getRtcProviderByProviderKey('agora'),
    catalog.AGORA_RTC_PROVIDER_CATALOG_ENTRY,
  );
});

test('materialized rtc provider catalog exposes assembly-driven default provider constants', async () => {
  const catalog = await loadCatalog();
  const assembly = readAssembly();
  const defaultProvider = catalog.OFFICIAL_RTC_PROVIDER_CATALOG.find(
    (provider) => provider.providerKey === catalog.DEFAULT_RTC_PROVIDER_KEY,
  );

  assert.equal(catalog.DEFAULT_RTC_PROVIDER_KEY, assembly.defaults.providerKey);
  assert.equal(catalog.DEFAULT_RTC_PROVIDER_PLUGIN_ID, assembly.defaults.pluginId);
  assert.equal(catalog.DEFAULT_RTC_PROVIDER_DRIVER_ID, assembly.defaults.driverId);
  assert.ok(defaultProvider);
  assert.equal(defaultProvider.defaultSelected, true);
  assert.equal(defaultProvider.pluginId, catalog.DEFAULT_RTC_PROVIDER_PLUGIN_ID);
  assert.equal(defaultProvider.driverId, catalog.DEFAULT_RTC_PROVIDER_DRIVER_ID);
});

test('materialized rtc provider catalog exposes typescript runtime bridge prerequisites', async () => {
  const catalog = await loadCatalog();

  for (const provider of catalog.OFFICIAL_RTC_PROVIDER_CATALOG) {
    assert.equal(provider.typescriptAdapter.runtimeBridgeStatus, 'reference-baseline');
    assert.equal(provider.typescriptAdapter.officialVendorSdkRequirement, 'required');
  }
});

test('materialized rtc provider activation catalog matches the assembly language activation snapshot', async () => {
  const activationCatalog = await loadActivationCatalog();
  const rootSdk = await loadSdk();
  const assembly = readAssembly();
  const typescriptLanguage = assembly.languages.find((languageEntry) => languageEntry.language === 'typescript');
  const providerByKey = new Map(assembly.providers.map((provider) => [provider.providerKey, provider]));

  assert.deepEqual(
    activationCatalog.RTC_PROVIDER_ACTIVATION_CATALOG.map((entry) => ({
      providerKey: entry.providerKey,
      pluginId: entry.pluginId,
      driverId: entry.driverId,
      activationStatus: entry.activationStatus,
      runtimeBridge: entry.runtimeBridge,
      rootPublic: entry.rootPublic,
      packageBoundary: entry.packageBoundary,
      builtin: entry.builtin,
      packageIdentity: entry.packageIdentity,
    })),
    typescriptLanguage.providerActivations.map((providerActivation) => {
      const provider = providerByKey.get(providerActivation.providerKey);
      return {
        providerKey: provider.providerKey,
        pluginId: provider.pluginId,
        driverId: provider.driverId,
        activationStatus: providerActivation.activationStatus,
        runtimeBridge: providerActivation.activationStatus !== 'control-metadata-only',
        rootPublic: providerActivation.activationStatus === 'root-public-builtin',
        packageBoundary: providerActivation.activationStatus !== 'control-metadata-only',
        builtin: provider.builtin,
        packageIdentity: provider.typescriptPackage.packageName,
      };
    }),
  );
  assert.equal(typeof rootSdk.getRtcProviderActivationByProviderKey, 'function');
  assert.deepEqual(
    rootSdk.getRtcProviderActivationByProviderKey('volcengine'),
    activationCatalog.VOLCENGINE_RTC_PROVIDER_ACTIVATION_ENTRY,
  );
  assert.equal(rootSdk.getRtcProviderActivationByProviderKey('vendor-x'), undefined);
  assert.deepEqual(
    activationCatalog.getRtcProviderActivationByProviderKey('agora'),
    activationCatalog.AGORA_RTC_PROVIDER_ACTIVATION_ENTRY,
  );
  assert.equal(activationCatalog.getRtcProviderActivationByProviderKey('vendor-x'), undefined);
});

test('materialized rtc language workspace catalog matches the assembly language workspace snapshot', async () => {
  const languageWorkspaceCatalog = await loadLanguageWorkspaceCatalog();
  const rootSdk = await loadSdk();
  const assembly = readAssembly();

  assert.deepEqual(
    languageWorkspaceCatalog.OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS,
    assembly.languages.map((languageEntry) => languageEntry.language),
  );
  assert.deepEqual(
    languageWorkspaceCatalog.RTC_LANGUAGE_WORKSPACE_CATALOG.map((entry) => ({
      language: entry.language,
      workspace: entry.workspace,
      workspaceCatalogRelativePath: entry.workspaceCatalogRelativePath,
      displayName: entry.displayName,
      publicPackage: entry.publicPackage,
      maturityTier: entry.maturityTier,
      controlSdk: entry.controlSdk,
      runtimeBridge: entry.runtimeBridge,
      currentRole: entry.currentRole,
      workspaceSummary: entry.workspaceSummary,
      roleHighlights: entry.roleHighlights,
      runtimeBaseline: entry.runtimeBaseline,
      metadataScaffold: entry.metadataScaffold,
      resolutionScaffold: entry.resolutionScaffold,
      providerPackageBoundary: entry.providerPackageBoundary,
      providerPackageScaffold: entry.providerPackageScaffold,
    })),
    assembly.languages.map((languageEntry) => ({
      language: languageEntry.language,
      workspace: languageEntry.workspace,
      workspaceCatalogRelativePath: languageEntry.workspaceCatalogRelativePath,
      displayName: languageEntry.displayName,
      publicPackage: languageEntry.publicPackage,
      maturityTier: languageEntry.maturityTier,
      controlSdk: languageEntry.controlSdk,
      runtimeBridge: languageEntry.runtimeBridge,
      currentRole: languageEntry.currentRole,
      workspaceSummary: languageEntry.workspaceSummary,
      roleHighlights: languageEntry.roleHighlights,
      runtimeBaseline: languageEntry.runtimeBaseline,
      metadataScaffold: languageEntry.metadataScaffold,
      resolutionScaffold: languageEntry.resolutionScaffold,
      providerPackageBoundary: languageEntry.providerPackageBoundary,
      providerPackageScaffold: languageEntry.providerPackageScaffold,
    })),
  );
  assert.deepEqual(languageWorkspaceCatalog.TYPESCRIPT_RTC_LANGUAGE_WORKSPACE_ENTRY.providerPackageBoundary, {
    mode: 'catalog-governed-mixed',
    rootPublicPolicy: 'builtin-only',
    lifecycleStatusTerms: ['root_public_reference_boundary', 'package_reference_boundary'],
    runtimeBridgeStatusTerms: ['reference-baseline'],
  });
  assert.equal(typeof rootSdk.getRtcLanguageWorkspaceByLanguage, 'function');
  assert.deepEqual(
    rootSdk.getRtcLanguageWorkspaceByLanguage('typescript'),
    languageWorkspaceCatalog.TYPESCRIPT_RTC_LANGUAGE_WORKSPACE_ENTRY,
  );
  assert.equal(rootSdk.getRtcLanguageWorkspaceByLanguage('ruby'), undefined);
  assert.deepEqual(
    languageWorkspaceCatalog.getRtcLanguageWorkspaceByLanguage('flutter'),
    languageWorkspaceCatalog.FLUTTER_RTC_LANGUAGE_WORKSPACE_ENTRY,
  );
  assert.deepEqual(languageWorkspaceCatalog.TYPESCRIPT_RTC_LANGUAGE_WORKSPACE_ENTRY.runtimeBaseline, {
    vendorSdkPackage: '@volcengine/rtc',
    vendorSdkImportPath: '@volcengine/rtc',
    signalingSdkPackage: '@sdkwork/rtc-sdk',
    signalingSdkImportPath: '@sdkwork/rtc-sdk',
    recommendedEntrypoint: 'createStandardRtcCallControllerStack',
    smokeCommand: 'node ./bin/sdk-call-smoke.mjs --json',
    smokeMode: 'runtime-backed',
    smokeVariants: ['default', 'reuse-live-connection'],
  });
  assert.deepEqual(languageWorkspaceCatalog.FLUTTER_RTC_LANGUAGE_WORKSPACE_ENTRY.runtimeBaseline, {
    vendorSdkPackage: 'volc_engine_rtc',
    vendorSdkImportPath: 'package:volc_engine_rtc/volc_engine_rtc.dart',
    signalingSdkPackage: 'rtc_sdk',
    signalingSdkImportPath: 'package:rtc_sdk/rtc_sdk.dart',
    recommendedEntrypoint: 'createStandardRtcCallControllerStack',
    smokeCommand: 'node ./bin/sdk-call-smoke.mjs --json',
    smokeMode: 'analysis-backed',
    smokeVariants: ['default', 'reuse-live-connection'],
  });
  assert.equal(languageWorkspaceCatalog.getRtcLanguageWorkspaceByLanguage('ruby'), undefined);
});

test('materialized rtc provider catalog is runtime-frozen', async () => {
  const catalog = await loadCatalog();
  const activationCatalog = await loadActivationCatalog();
  const languageWorkspaceCatalog = await loadLanguageWorkspaceCatalog();

  assert.equal(Object.isFrozen(catalog.BUILTIN_RTC_PROVIDER_KEYS), true);
  assert.equal(Object.isFrozen(catalog.OFFICIAL_RTC_PROVIDER_KEYS), true);
  assert.equal(Object.isFrozen(catalog.BUILTIN_RTC_PROVIDER_CATALOG), true);
  assert.equal(Object.isFrozen(catalog.OFFICIAL_RTC_PROVIDER_CATALOG), true);
  assert.equal(Object.isFrozen(activationCatalog.RTC_PROVIDER_ACTIVATION_STATUSES), true);
  assert.equal(Object.isFrozen(activationCatalog.RTC_PROVIDER_ACTIVATION_CATALOG), true);
  assert.equal(Object.isFrozen(languageWorkspaceCatalog.OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS), true);
  assert.equal(Object.isFrozen(languageWorkspaceCatalog.RTC_LANGUAGE_WORKSPACE_CATALOG), true);

  const provider = catalog.OFFICIAL_RTC_PROVIDER_CATALOG[0];
  const activationEntry = activationCatalog.RTC_PROVIDER_ACTIVATION_CATALOG[0];
  const languageWorkspaceEntry = languageWorkspaceCatalog.RTC_LANGUAGE_WORKSPACE_CATALOG[0];
  assert.equal(Object.isFrozen(provider), true);
  assert.equal(Object.isFrozen(activationEntry), true);
  assert.equal(Object.isFrozen(languageWorkspaceEntry), true);
  assert.equal(Object.isFrozen(provider.urlSchemes), true);
  assert.equal(Object.isFrozen(provider.requiredCapabilities), true);
  assert.equal(Object.isFrozen(provider.optionalCapabilities), true);
  assert.equal(Object.isFrozen(provider.extensionKeys), true);
  assert.equal(Object.isFrozen(provider.typescriptAdapter), true);
  assert.equal(Object.isFrozen(provider.typescriptPackage), true);
  assert.equal(Object.isFrozen(languageWorkspaceEntry.roleHighlights), true);
  if (languageWorkspaceEntry.runtimeBaseline) {
    assert.equal(Object.isFrozen(languageWorkspaceEntry.runtimeBaseline), true);
  }
  if (languageWorkspaceEntry.metadataScaffold) {
    assert.equal(Object.isFrozen(languageWorkspaceEntry.metadataScaffold), true);
  }
  if (languageWorkspaceEntry.resolutionScaffold) {
    assert.equal(Object.isFrozen(languageWorkspaceEntry.resolutionScaffold), true);
  }
  if (languageWorkspaceEntry.providerPackageBoundary) {
    assert.equal(Object.isFrozen(languageWorkspaceEntry.providerPackageBoundary), true);
    assert.equal(
      Object.isFrozen(languageWorkspaceEntry.providerPackageBoundary.lifecycleStatusTerms),
      true,
    );
    assert.equal(
      Object.isFrozen(languageWorkspaceEntry.providerPackageBoundary.runtimeBridgeStatusTerms),
      true,
    );
  }
  if (languageWorkspaceEntry.providerPackageScaffold) {
    assert.equal(Object.isFrozen(languageWorkspaceEntry.providerPackageScaffold), true);
    assert.equal(Object.isFrozen(languageWorkspaceEntry.providerPackageScaffold.templateTokens), true);
    assert.equal(Object.isFrozen(languageWorkspaceEntry.providerPackageScaffold.sourceTemplateTokens), true);
  }
  assert.throws(() => {
    provider.displayName = 'drifted provider';
  }, /TypeError/);
  assert.throws(() => {
    activationEntry.activationStatus = 'drifted';
  }, /TypeError/);
  assert.throws(() => {
    languageWorkspaceEntry.displayName = 'drifted language';
  }, /TypeError/);
});
