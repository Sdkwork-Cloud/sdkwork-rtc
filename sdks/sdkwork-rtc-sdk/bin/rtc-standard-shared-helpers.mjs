import { DEFAULT_TYPESCRIPT_PACKAGE_STANDARD } from './rtc-standard-contract-constants.mjs';

function normalizeRelativePath(value) {
  return String(value).replace(/\\/g, '/');
}

export function toPascalCase(value) {
  return String(value)
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function toUpperSnakeCase(value) {
  return String(value).replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase();
}

export function getCanonicalTypeScriptProviderPackageContract(
  providerKey,
  packageStandard = DEFAULT_TYPESCRIPT_PACKAGE_STANDARD,
) {
  const rootPublicRule = packageStandard?.rootPublicRule ?? DEFAULT_TYPESCRIPT_PACKAGE_STANDARD.rootPublicRule;

  return {
    packageName: materializeProviderPackagePattern(
      packageStandard?.packageNamePattern ??
        DEFAULT_TYPESCRIPT_PACKAGE_STANDARD.packageNamePattern,
      providerKey,
    ),
    sourceModule: materializeProviderPackagePattern(
      packageStandard?.sourceModulePattern ??
        DEFAULT_TYPESCRIPT_PACKAGE_STANDARD.sourceModulePattern,
      providerKey,
    ),
    driverFactory: materializeProviderPackagePattern(
      packageStandard?.driverFactoryPattern ??
        DEFAULT_TYPESCRIPT_PACKAGE_STANDARD.driverFactoryPattern,
      providerKey,
    ),
    metadataSymbol: materializeProviderPackagePattern(
      packageStandard?.metadataSymbolPattern ??
        DEFAULT_TYPESCRIPT_PACKAGE_STANDARD.metadataSymbolPattern,
      providerKey,
    ),
    moduleSymbol: materializeProviderPackagePattern(
      packageStandard?.moduleSymbolPattern ??
        DEFAULT_TYPESCRIPT_PACKAGE_STANDARD.moduleSymbolPattern,
      providerKey,
    ),
    rootPublicRule,
  };
}

export function extractTemplateTokens(value) {
  return [...new Set(String(value).match(/\{[A-Za-z][A-Za-z0-9]*\}/g) ?? [])].sort();
}

export function normalizeStringArray(values) {
  return [...new Set((values ?? []).map((value) => String(value)))].sort();
}

export function materializeProviderPackagePattern(pattern, providerKey) {
  return String(pattern)
    .replaceAll('{providerKey}', providerKey)
    .replaceAll('{providerPascal}', toPascalCase(providerKey))
    .replaceAll('{providerUpperSnake}', toUpperSnakeCase(providerKey));
}

export function buildProviderPackageManifestPath(providerPackageScaffold, providerKey) {
  const directoryPath = materializeProviderPackagePattern(
    providerPackageScaffold.directoryPattern,
    providerKey,
  );
  const manifestFileName = materializeProviderPackagePattern(
    providerPackageScaffold.manifestFileName,
    providerKey,
  );

  return normalizeRelativePath(`${directoryPath}/${manifestFileName}`);
}

export function buildProviderPackageReadmePath(providerPackageScaffold, providerKey) {
  const directoryPath = materializeProviderPackagePattern(
    providerPackageScaffold.directoryPattern,
    providerKey,
  );

  return normalizeRelativePath(`${directoryPath}/${providerPackageScaffold.readmeFileName}`);
}

export function buildProviderPackageSourceRelativePath(providerPackageScaffold, providerKey) {
  return normalizeRelativePath(
    materializeProviderPackagePattern(providerPackageScaffold.sourceFilePattern, providerKey),
  );
}

export function buildProviderPackageSourcePath(providerPackageScaffold, providerKey) {
  const directoryPath = materializeProviderPackagePattern(
    providerPackageScaffold.directoryPattern,
    providerKey,
  );
  const sourceRelativePath = buildProviderPackageSourceRelativePath(
    providerPackageScaffold,
    providerKey,
  );

  return normalizeRelativePath(`${directoryPath}/${sourceRelativePath}`);
}

export function buildProviderPackageSourceRoot(providerPackageScaffold, providerKey) {
  const sourceRelativePath = buildProviderPackageSourceRelativePath(
    providerPackageScaffold,
    providerKey,
  );
  const segments = sourceRelativePath.split('/');
  segments.pop();
  return segments.join('/') || '.';
}

export function buildProviderPackageSourceSymbol(providerPackageScaffold, providerKey) {
  return materializeProviderPackagePattern(providerPackageScaffold.sourceSymbolPattern, providerKey);
}

export function buildReservedProviderPackageCatalogEntries(languageEntry, providers) {
  const providerPackageScaffold = languageEntry.providerPackageScaffold;
  if (!providerPackageScaffold) {
    return [];
  }

  return (providers ?? []).map((provider) => ({
    providerKey: provider.providerKey,
    pluginId: provider.pluginId,
    driverId: provider.driverId,
    packageIdentity: materializeProviderPackagePattern(
      providerPackageScaffold.packagePattern,
      provider.providerKey,
    ),
    manifestPath: buildProviderPackageManifestPath(providerPackageScaffold, provider.providerKey),
    readmePath: buildProviderPackageReadmePath(providerPackageScaffold, provider.providerKey),
    sourcePath: buildProviderPackageSourcePath(providerPackageScaffold, provider.providerKey),
    sourceSymbol: buildProviderPackageSourceSymbol(providerPackageScaffold, provider.providerKey),
    builtin: provider.builtin === true,
    rootPublic: providerPackageScaffold.rootPublic,
    status: providerPackageScaffold.status,
    runtimeBridgeStatus: providerPackageScaffold.runtimeBridgeStatus,
  }));
}

export function describeProviderActivationStatus(activationStatus) {
  switch (activationStatus) {
    case 'root-public-builtin':
      return {
        runtimeBridge: true,
        rootPublic: true,
        packageBoundary: true,
      };
    case 'package-boundary':
      return {
        runtimeBridge: true,
        rootPublic: false,
        packageBoundary: true,
      };
    case 'control-metadata-only':
    default:
      return {
        runtimeBridge: false,
        rootPublic: false,
        packageBoundary: false,
      };
  }
}

export function buildLanguageProviderActivationCatalogEntries(languageEntry, providers) {
  const providerByKey = new Map((providers ?? []).map((provider) => [provider.providerKey, provider]));
  const providerPackageScaffold = languageEntry.providerPackageScaffold;

  return (languageEntry.providerActivations ?? []).map((providerActivation) => {
    const provider = providerByKey.get(providerActivation.providerKey);
    if (!provider) {
      throw new Error(
        `Unknown provider activation ${providerActivation.providerKey} for ${languageEntry.language}`,
      );
    }

    const activationDetails = describeProviderActivationStatus(providerActivation.activationStatus);
    const packageIdentity = providerPackageScaffold
      ? materializeProviderPackagePattern(
          providerPackageScaffold.packagePattern,
          provider.providerKey,
        )
      : provider.typescriptPackage?.packageName ?? provider.providerKey;

    return {
      providerKey: provider.providerKey,
      pluginId: provider.pluginId,
      driverId: provider.driverId,
      activationStatus: providerActivation.activationStatus,
      runtimeBridge: activationDetails.runtimeBridge,
      rootPublic: activationDetails.rootPublic,
      packageBoundary: activationDetails.packageBoundary,
      builtin: provider.builtin === true,
      packageIdentity,
    };
  });
}
