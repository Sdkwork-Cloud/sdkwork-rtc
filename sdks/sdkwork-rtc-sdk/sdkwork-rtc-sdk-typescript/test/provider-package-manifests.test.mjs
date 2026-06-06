import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const packageRoot = path.resolve('.');
const providersRoot = path.join(packageRoot, 'providers');
const assemblyPath = path.resolve('..', '.sdkwork-assembly.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

async function loadRootSdk() {
  return import('../dist/index.js');
}

async function loadProviderPackageCatalog() {
  return import('../dist/provider-package-catalog.js');
}

async function loadProviderModule(providerKey) {
  return import(`../dist/providers/${providerKey}.js`);
}

async function loadProviderPackageEntrypoint(packageDir, manifest) {
  return import(pathToFileURL(path.join(packageDir, manifest.exports['.'].import)).href);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildForbiddenAppCouplingPattern() {
  const terms = [
    ['@sdkwork/im', '-sdk'].join(''),
    ['sdkwork-im', '-sdk'].join(''),
    ['sdkwork-app', 'base'].join(''),
    ['craw', '-chat'].join(''),
    ['/im', '/v3/api/rtc'].join(''),
  ];

  return new RegExp(terms.map(escapeRegExp).join('|'));
}

const FORBIDDEN_APP_COUPLING_PATTERN = buildForbiddenAppCouplingPattern();

test('materialized provider package catalog matches the assembly-driven package boundary snapshot', async () => {
  const assembly = readJson(assemblyPath);
  const packageCatalog = await loadProviderPackageCatalog();
  const rootSdk = await loadRootSdk();

  assert.equal(typeof rootSdk.getRtcProviderPackageCatalog, 'function');
  assert.equal(typeof rootSdk.getRtcProviderPackageByProviderKey, 'function');
  assert.equal(typeof rootSdk.getRtcProviderPackageByPackageIdentity, 'function');
  assert.equal(typeof rootSdk.getRtcProviderPackage, 'function');

  assert.deepEqual(
    packageCatalog.RTC_PROVIDER_PACKAGE_CATALOG.map((entry) => ({
      providerKey: entry.providerKey,
      pluginId: entry.pluginId,
      driverId: entry.driverId,
      packageIdentity: entry.packageIdentity,
      manifestPath: entry.manifestPath,
      readmePath: entry.readmePath,
      sourcePath: entry.sourcePath,
      declarationPath: entry.declarationPath,
      sourceSymbol: entry.sourceSymbol,
      sourceModule: entry.sourceModule,
      driverFactory: entry.driverFactory,
      metadataSymbol: entry.metadataSymbol,
      moduleSymbol: entry.moduleSymbol,
      builtin: entry.builtin,
      rootPublic: entry.rootPublic,
      status: entry.status,
      runtimeBridgeStatus: entry.runtimeBridgeStatus,
      requiredCapabilities: entry.requiredCapabilities,
      optionalCapabilities: entry.optionalCapabilities,
      extensionKeys: entry.extensionKeys,
    })),
    assembly.providers.map((provider) => ({
      providerKey: provider.providerKey,
      pluginId: provider.pluginId,
      driverId: provider.driverId,
      packageIdentity: provider.typescriptPackage.packageName,
      manifestPath: `providers/rtc-sdk-provider-${provider.providerKey}/package.json`,
      readmePath: `providers/rtc-sdk-provider-${provider.providerKey}/README.md`,
      sourcePath: `providers/rtc-sdk-provider-${provider.providerKey}/index.js`,
      declarationPath: `providers/rtc-sdk-provider-${provider.providerKey}/index.d.ts`,
      sourceSymbol: provider.typescriptPackage.moduleSymbol,
      sourceModule: provider.typescriptPackage.sourceModule,
      driverFactory: provider.typescriptPackage.driverFactory,
      metadataSymbol: provider.typescriptPackage.metadataSymbol,
      moduleSymbol: provider.typescriptPackage.moduleSymbol,
      builtin: provider.builtin,
      rootPublic: provider.typescriptPackage.rootPublic,
      status: provider.builtin
        ? 'root_public_reference_boundary'
        : 'package_reference_boundary',
      runtimeBridgeStatus: provider.typescriptAdapter.runtimeBridgeStatus,
      requiredCapabilities: provider.requiredCapabilities,
      optionalCapabilities: provider.optionalCapabilities,
      extensionKeys: provider.extensionKeys,
    })),
  );
  assert.deepEqual(
    rootSdk.getRtcProviderPackageCatalog(),
    packageCatalog.RTC_PROVIDER_PACKAGE_CATALOG,
  );
  assert.deepEqual(
    rootSdk.getRtcProviderPackageByProviderKey('volcengine'),
    packageCatalog.VOLCENGINE_RTC_PROVIDER_PACKAGE_ENTRY,
  );
  assert.equal(rootSdk.getRtcProviderPackageByProviderKey('vendor-x'), undefined);
  assert.deepEqual(
    packageCatalog.getRtcProviderPackageByProviderKey('agora'),
    packageCatalog.AGORA_RTC_PROVIDER_PACKAGE_ENTRY,
  );
  assert.deepEqual(
    packageCatalog.getRtcProviderPackageByPackageIdentity('@sdkwork/rtc-sdk-provider-agora'),
    packageCatalog.AGORA_RTC_PROVIDER_PACKAGE_ENTRY,
  );
  assert.deepEqual(
    rootSdk.getRtcProviderPackageByPackageIdentity('@sdkwork/rtc-sdk-provider-agora'),
    packageCatalog.AGORA_RTC_PROVIDER_PACKAGE_ENTRY,
  );
  assert.equal(packageCatalog.getRtcProviderPackageByProviderKey('vendor-x'), undefined);
  assert.equal(
    packageCatalog.getRtcProviderPackageByPackageIdentity('@sdkwork/rtc-sdk-provider-vendor-x'),
    undefined,
  );
});

test('materialized provider package catalog is runtime-frozen', async () => {
  const packageCatalog = await loadProviderPackageCatalog();
  const firstEntry = packageCatalog.RTC_PROVIDER_PACKAGE_CATALOG[0];

  assert.equal(Object.isFrozen(packageCatalog.RTC_PROVIDER_PACKAGE_STATUSES), true);
  assert.equal(Object.isFrozen(packageCatalog.RTC_PROVIDER_PACKAGE_CATALOG), true);
  assert.equal(Object.isFrozen(firstEntry), true);
  assert.equal(Object.isFrozen(firstEntry.extensionKeys), true);

  assert.throws(() => {
    firstEntry.packageIdentity = 'drifted-package';
  }, /TypeError/);
});

test('provider packages expose manifest-declared entrypoints and symbols', async () => {
  const assembly = readJson(assemblyPath);
  const rootSdk = await loadRootSdk();

  for (const provider of assembly.providers) {
    const packageDir = path.join(providersRoot, `rtc-sdk-provider-${provider.providerKey}`);
    const manifestPath = path.join(packageDir, 'package.json');
    const manifest = readJson(manifestPath);
    const providerConfig = manifest.sdkworkRtcProvider;
    const expectedStatus = provider.builtin
      ? 'root_public_reference_boundary'
      : 'package_reference_boundary';
    const entrypointPath = path.join(packageDir, 'index.js');
    const declarationPath = path.join(packageDir, 'index.d.ts');
    const readmePath = path.join(packageDir, 'README.md');
    const entrypointSource = readFileSync(entrypointPath, 'utf8');
    const declarationSource = readFileSync(declarationPath, 'utf8');
    const readme = readFileSync(readmePath, 'utf8');

    assert.equal(manifest.main, './index.js');
    assert.equal(manifest.types, './index.d.ts');
    assert.equal(manifest.exports['.'].import, './index.js');
    assert.equal(manifest.exports['.'].default, './index.js');
    assert.equal(manifest.exports['.'].types, './index.d.ts');
    assert.equal(manifest.name, provider.typescriptPackage.packageName);
    assert.equal(providerConfig.registrationContract, 'RtcProviderModule');
    assert.equal(providerConfig.sourceModule, provider.typescriptPackage.sourceModule);
    assert.equal(providerConfig.driverFactory, provider.typescriptPackage.driverFactory);
    assert.equal(providerConfig.metadataSymbol, provider.typescriptPackage.metadataSymbol);
    assert.equal(providerConfig.moduleSymbol, provider.typescriptPackage.moduleSymbol);
    assert.equal(providerConfig.rootPublic, provider.typescriptPackage.rootPublic);
    assert.equal(typeof providerConfig.rootPublic, 'boolean');
    assert.equal(providerConfig.status, expectedStatus);
    assert.deepEqual(providerConfig.requiredCapabilities, provider.requiredCapabilities);
    assert.deepEqual(providerConfig.optionalCapabilities, provider.optionalCapabilities);
    assert.deepEqual(providerConfig.extensionKeys, provider.extensionKeys);
    assert.equal(providerConfig.typescriptAdapter.sdkProvisioning, provider.typescriptAdapter.sdkProvisioning);
    assert.equal(providerConfig.typescriptAdapter.bindingStrategy, provider.typescriptAdapter.bindingStrategy);
    assert.equal(providerConfig.typescriptAdapter.bundlePolicy, provider.typescriptAdapter.bundlePolicy);
    assert.equal(
      providerConfig.typescriptAdapter.runtimeBridgeStatus,
      provider.typescriptAdapter.runtimeBridgeStatus,
    );
    assert.equal(
      providerConfig.typescriptAdapter.officialVendorSdkRequirement,
      provider.typescriptAdapter.officialVendorSdkRequirement,
    );

    const sourceModulePath = path.resolve(packageDir, providerConfig.sourceModule);
    assert.equal(existsSync(sourceModulePath), true, `expected ${sourceModulePath} to exist`);
    assert.equal(existsSync(entrypointPath), true, `expected ${entrypointPath} to exist`);
    assert.equal(existsSync(declarationPath), true, `expected ${declarationPath} to exist`);

    const providerModule = await loadProviderModule(provider.providerKey);
    const providerPackage = await loadProviderPackageEntrypoint(packageDir, manifest);

    assert.equal(typeof providerModule[providerConfig.driverFactory], 'function');
    assert.equal(typeof providerModule[providerConfig.metadataSymbol], 'object');
    assert.equal(typeof providerModule[providerConfig.moduleSymbol], 'object');
    assert.equal(typeof providerPackage[providerConfig.driverFactory], 'function');
    assert.equal(typeof providerPackage[providerConfig.metadataSymbol], 'object');
    assert.equal(typeof providerPackage[providerConfig.moduleSymbol], 'object');
    assert.equal(
      providerPackage[providerConfig.driverFactory],
      providerModule[providerConfig.driverFactory],
    );
    assert.equal(
      providerPackage[providerConfig.metadataSymbol],
      providerModule[providerConfig.metadataSymbol],
    );
    assert.equal(
      providerPackage[providerConfig.moduleSymbol],
      providerModule[providerConfig.moduleSymbol],
    );
    assert.equal(providerModule[providerConfig.moduleSymbol].packageName, manifest.name);
    assert.equal(providerModule[providerConfig.moduleSymbol].builtin, provider.builtin);
    assert.equal(
      providerModule[providerConfig.moduleSymbol].metadata.providerKey,
      provider.providerKey,
    );
    assert.deepEqual(
      rootSdk.getRtcProviderPackageByProviderKey(provider.providerKey).requiredCapabilities,
      provider.requiredCapabilities,
    );
    assert.deepEqual(
      rootSdk.getRtcProviderPackageByProviderKey(provider.providerKey).optionalCapabilities,
      provider.optionalCapabilities,
    );
    assert.deepEqual(
      providerModule[providerConfig.moduleSymbol].typescriptAdapter,
      providerConfig.typescriptAdapter,
    );
    assert.match(manifest.description, /^Reference TypeScript provider boundary/i);
    assert.match(readme, /Reference TypeScript provider package boundary/i);
    assert.doesNotMatch(readme, /Reserved TypeScript provider package boundary/i);
    assert.match(readme, /vendor sdk provisioning:\s*`consumer-supplied`/i);
    assert.match(readme, /binding strategy:\s*`native-factory`/i);
    assert.match(readme, /bundle policy:\s*`must-not-bundle`/i);
    assert.match(
      readme,
      new RegExp(
        `status:\\s*\\\`${expectedStatus}\\\``,
        'i',
      ),
    );
    assert.match(readme, /runtime bridge status:\s*`reference-baseline`/i);
    assert.match(readme, /official vendor sdk requirement:\s*`required`/i);
    assert.match(readme, /required capabilities:/i);
    assert.match(readme, /`call\.audio`/i);
    assert.match(readme, /`call\.video`/i);
    assert.match(readme, /`live\.broadcast`/i);
    assert.match(readme, /`live\.audience`/i);
    assert.match(readme, /optional capabilities:/i);
    assert.match(readme, /provider extension keys:/i);

    assert.equal(providerConfig.rootPublic, provider.builtin);
    assert.equal(providerConfig.rootPublic, providerConfig.driverFactory in rootSdk);
    assert.equal(providerConfig.rootPublic, providerConfig.moduleSymbol in rootSdk);
    assert.doesNotMatch(
      entrypointSource,
      FORBIDDEN_APP_COUPLING_PATTERN,
      `expected ${manifest.name} entrypoint to stay RTC-owned and app-independent`,
    );
    assert.doesNotMatch(
      declarationSource,
      FORBIDDEN_APP_COUPLING_PATTERN,
      `expected ${manifest.name} declarations to stay RTC-owned and app-independent`,
    );
  }
});
