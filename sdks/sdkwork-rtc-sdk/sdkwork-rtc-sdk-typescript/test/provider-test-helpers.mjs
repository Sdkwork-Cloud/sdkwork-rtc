import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const packageRoot = path.resolve('.');

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export async function loadSdk() {
  return import('../dist/index.js');
}

export function createProviderPackageImporter() {
  return async (_packageIdentity, packageEntry) => {
    const manifestPath = path.join(packageRoot, packageEntry.manifestPath);
    const manifest = readJson(manifestPath);
    const entrypointPath = path.join(path.dirname(manifestPath), manifest.exports['.'].import);
    return import(pathToFileURL(entrypointPath).href);
  };
}

export async function loadProviderPackage(providerKey) {
  const sdk = await loadSdk();
  const packageEntry = sdk.getRtcProviderPackageByProviderKey(providerKey);

  if (!packageEntry) {
    throw new Error(`Unknown RTC provider package: ${providerKey}`);
  }

  const namespace = await createProviderPackageImporter()(
    packageEntry.packageIdentity,
    packageEntry,
  );

  return {
    sdk,
    packageEntry,
    namespace,
    providerModule: namespace[packageEntry.moduleSymbol],
  };
}

export async function createManagerWithProviderPackages(providerKeys, optionsByProviderKey = {}) {
  const sdk = await loadSdk();
  const loader = sdk.createRtcProviderPackageLoader(createProviderPackageImporter());
  const manager = await sdk.installRtcProviderPackages(
    new sdk.RtcDriverManager(),
    providerKeys.map((providerKey) => ({
      providerKey,
      options: optionsByProviderKey[providerKey] ?? {},
    })),
    loader,
  );

  return {
    sdk,
    manager,
  };
}
