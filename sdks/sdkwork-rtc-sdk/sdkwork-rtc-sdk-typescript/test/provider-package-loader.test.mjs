import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const packageRoot = path.resolve('.');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

async function loadSdk() {
  return import('../dist/index.js');
}

function createPackageImporter() {
  return async (_packageIdentity, packageEntry) => {
    const manifestPath = path.join(packageRoot, packageEntry.manifestPath);
    const manifest = readJson(manifestPath);
    const entrypointPath = path.join(path.dirname(manifestPath), manifest.exports['.'].import);
    return import(pathToFileURL(entrypointPath).href);
  };
}

test('loadRtcProviderModule resolves provider packages by providerKey and packageIdentity', async () => {
  const {
    createRtcProviderPackageLoader,
    loadRtcProviderModule,
    getRtcProviderPackageByProviderKey,
    getRtcProviderPackageByPackageIdentity,
  } = await loadSdk();

  const agoraPackage = getRtcProviderPackageByProviderKey('agora');
  assert.ok(agoraPackage);

  const loader = createRtcProviderPackageLoader(createPackageImporter());
  const byProviderKey = await loadRtcProviderModule({ providerKey: 'agora' }, loader);
  const byPackageIdentity = await loadRtcProviderModule(
    { packageIdentity: agoraPackage.packageIdentity },
    loader,
  );

  assert.equal(byProviderKey.packageName, '@sdkwork/rtc-sdk-provider-agora');
  assert.equal(byProviderKey.metadata.providerKey, 'agora');
  assert.equal(byPackageIdentity.packageName, '@sdkwork/rtc-sdk-provider-agora');
  assert.equal(byPackageIdentity.metadata.providerKey, 'agora');
  assert.deepEqual(
    getRtcProviderPackageByPackageIdentity(agoraPackage.packageIdentity),
    agoraPackage,
  );
});

test('installRtcProviderPackage installs a package-boundary provider through the standard loader SPI', async () => {
  const {
    RtcDriverManager,
    createRtcProviderPackageLoader,
    installRtcProviderPackage,
  } = await loadSdk();

  const nativeClient = { sdk: 'agora-web-native' };
  const manager = await installRtcProviderPackage(
    new RtcDriverManager(),
    {
      providerKey: 'agora',
      options: {
        nativeFactory: async () => nativeClient,
      },
    },
    createRtcProviderPackageLoader(createPackageImporter()),
  );

  const client = await manager.connect({ providerKey: 'agora' });
  assert.equal(client.unwrap(), nativeClient);
  assert.deepEqual(manager.describeProviderSupport('agora'), {
    providerKey: 'agora',
    status: 'builtin_registered',
    builtin: true,
    official: true,
    registered: true,
  });
});

test('installRtcProviderPackages keeps registration atomic after loading all provider packages', async () => {
  const {
    RtcDriverManager,
    RtcSdkException,
    createRtcProviderPackageLoader,
    installRtcProviderPackages,
  } = await loadSdk();

  const manager = new RtcDriverManager();
  const loader = createRtcProviderPackageLoader(createPackageImporter());

  await assert.rejects(
    async () =>
      installRtcProviderPackages(
        manager,
        [
          {
            providerKey: 'agora',
            options: {
              nativeFactory: async () => ({ sdk: 'agora-web-native' }),
            },
          },
          {
            providerKey: 'agora',
            options: {
              nativeFactory: async () => ({ sdk: 'agora-web-native-2' }),
            },
          },
        ],
        loader,
      ),
    (error) =>
      error instanceof RtcSdkException &&
      error.code === 'driver_already_registered' &&
      error.providerKey === 'agora',
  );

  assert.deepEqual(manager.describeProviderSupport('agora'), {
    providerKey: 'agora',
    status: 'official_unregistered',
    builtin: true,
    official: true,
    registered: false,
  });
});

test('loadRtcProviderModule exposes stable package-loading failures', async () => {
  const {
    RtcSdkException,
    createRtcProviderPackageLoader,
    loadRtcProviderModule,
  } = await loadSdk();

  await assert.rejects(
    async () =>
      loadRtcProviderModule(
        {
          providerKey: 'vendor-x',
        },
        createRtcProviderPackageLoader(createPackageImporter()),
      ),
    (error) => error instanceof RtcSdkException && error.code === 'provider_package_not_found',
  );

  await assert.rejects(
    async () =>
      loadRtcProviderModule(
        {
          providerKey: 'agora',
          packageIdentity: '@sdkwork/rtc-sdk-provider-twilio',
        },
        createRtcProviderPackageLoader(createPackageImporter()),
      ),
    (error) =>
      error instanceof RtcSdkException &&
      error.code === 'provider_package_identity_mismatch',
  );

  await assert.rejects(
    async () =>
      loadRtcProviderModule(
        {
          providerKey: 'agora',
        },
        createRtcProviderPackageLoader(async () => {
          throw new Error('simulated loader failure');
        }),
      ),
    (error) =>
      error instanceof RtcSdkException &&
      error.code === 'provider_package_load_failed',
  );

  await assert.rejects(
    async () =>
      loadRtcProviderModule(
        {
          providerKey: 'agora',
        },
        async () => ({}),
      ),
    (error) =>
      error instanceof RtcSdkException &&
      error.code === 'provider_module_export_missing',
  );
});
