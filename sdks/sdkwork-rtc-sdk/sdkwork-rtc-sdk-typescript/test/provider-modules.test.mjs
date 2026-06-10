import assert from 'node:assert/strict';
import test from 'node:test';
import {
  loadProviderPackage,
  loadSdk,
} from './provider-test-helpers.mjs';

const executableProviderKeys = [
  'volcengine',
  'aliyun',
  'tencent',
  'agora',
  'zego',
  'livekit',
  'twilio',
  'jitsi',
  'janus',
  'mediasoup',
];

test('provider package modules keep stable package boundaries', async () => {
  const modules = [];

  for (const providerKey of executableProviderKeys) {
    const { packageEntry, providerModule } = await loadProviderPackage(providerKey);
    modules.push({
      packageEntry,
      providerModule,
    });
  }

  assert.deepEqual(
    modules.map(({ packageEntry, providerModule }) => ({
      providerKey: providerModule.metadata.providerKey,
      packageName: providerModule.packageName,
      metadataPackageName: providerModule.metadata.typescriptPackage.packageName,
      builtin: providerModule.builtin,
      rootPublic: packageEntry.rootPublic,
      status: packageEntry.status,
      typescriptAdapter: providerModule.typescriptAdapter,
    })),
    modules.map(({ packageEntry, providerModule }) => ({
      providerKey: packageEntry.providerKey,
      packageName: packageEntry.packageIdentity,
      metadataPackageName: packageEntry.packageIdentity,
      builtin: providerModule.metadata.builtin,
      rootPublic: false,
      status: 'package_reference_boundary',
      typescriptAdapter: providerModule.metadata.typescriptAdapter,
    })),
  );

  for (const { packageEntry, providerModule } of modules) {
    assert.equal(Object.isFrozen(providerModule), true);
    assert.equal(providerModule.packageName, providerModule.metadata.typescriptPackage.packageName);
    assert.equal(providerModule.packageName, packageEntry.packageIdentity);
    assert.equal(providerModule.builtin, providerModule.metadata.builtin);
    assert.equal(packageEntry.rootPublic, false);
  }
});

test('registerRtcProviderModule registers provider packages through the module contract', async () => {
  const { RtcDriverManager, registerRtcProviderModule } = await loadSdk();
  const { providerModule } = await loadProviderPackage('volcengine');

  const nativeClient = { sdk: 'volcengine-web-native' };
  const manager = registerRtcProviderModule(new RtcDriverManager(), providerModule, {
    nativeFactory: async () => nativeClient,
  });

  const client = await manager.connect({ providerKey: 'volcengine' });
  assert.equal(client.unwrap(), nativeClient);
});

test('registerRtcProviderModules registers provider packages through the batch module contract', async () => {
  const { RtcDriverManager, registerRtcProviderModules } = await loadSdk();
  const { providerModule } = await loadProviderPackage('agora');

  const nativeClient = { sdk: 'agora-web-native' };
  const manager = registerRtcProviderModules(new RtcDriverManager(), [
    {
      providerModule,
      options: {
        nativeFactory: async () => nativeClient,
      },
    },
  ]);

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

test('registerRtcProviderModules keeps driver manager unchanged when any registration fails', async () => {
  const { RtcDriverManager, RtcSdkException, registerRtcProviderModules } = await loadSdk();
  const { namespace, packageEntry, providerModule } = await loadProviderPackage('agora');
  const createDriver = namespace[packageEntry.driverFactory];
  const metadata = namespace[packageEntry.metadataSymbol];

  const manager = new RtcDriverManager();

  assert.throws(
    () =>
      registerRtcProviderModules(manager, [
        {
          providerModule,
          options: {
            nativeFactory: async () => ({ sdk: 'agora-web-native' }),
          },
        },
        {
          providerModule: {
            packageName: '@sdkwork/rtc-sdk-provider-agora-drift',
            metadata,
            builtin: metadata.builtin,
            typescriptAdapter: metadata.typescriptAdapter,
            createDriver(options = {}) {
              return createDriver(options);
            },
          },
        },
      ]),
    (error) =>
      error instanceof RtcSdkException &&
      error.code === 'provider_module_contract_mismatch' &&
      /package/i.test(error.message),
  );

  assert.deepEqual(manager.describeProviderSupport('agora'), {
    providerKey: 'agora',
    status: 'official_unregistered',
    builtin: true,
    official: true,
    registered: false,
  });
});

test('registerRtcProviderModule rejects provider module package contract drift', async () => {
  const { RtcDriverManager, RtcSdkException, registerRtcProviderModule } = await loadSdk();
  const { namespace, packageEntry } = await loadProviderPackage('agora');
  const createDriver = namespace[packageEntry.driverFactory];
  const metadata = namespace[packageEntry.metadataSymbol];

  assert.throws(
    () =>
      registerRtcProviderModule(
        new RtcDriverManager(),
        {
          packageName: '@sdkwork/rtc-sdk-provider-agora-drift',
          metadata,
          builtin: metadata.builtin,
          typescriptAdapter: metadata.typescriptAdapter,
          createDriver(options = {}) {
            return createDriver(options);
          },
        },
      ),
    (error) =>
      error instanceof RtcSdkException &&
      error.code === 'provider_module_contract_mismatch' &&
      /package/i.test(error.message),
  );
});
