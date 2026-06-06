import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

test('built-in provider modules keep stable package boundaries', async () => {
  const { getBuiltinRtcProviderModules } = await loadSdk();

  const modules = getBuiltinRtcProviderModules();

  assert.deepEqual(
    modules.map((entry) => ({
      providerKey: entry.metadata.providerKey,
      packageName: entry.packageName,
      metadataPackageName: entry.metadata.typescriptPackage.packageName,
      builtin: entry.builtin,
      typescriptAdapter: entry.typescriptAdapter,
    })),
    [
      {
        providerKey: 'volcengine',
        packageName: '@sdkwork/rtc-sdk-provider-volcengine',
        metadataPackageName: '@sdkwork/rtc-sdk-provider-volcengine',
        builtin: true,
        typescriptAdapter: {
          sdkProvisioning: 'consumer-supplied',
          bindingStrategy: 'native-factory',
          bundlePolicy: 'must-not-bundle',
          runtimeBridgeStatus: 'reference-baseline',
          officialVendorSdkRequirement: 'required',
        },
      },
      {
        providerKey: 'aliyun',
        packageName: '@sdkwork/rtc-sdk-provider-aliyun',
        metadataPackageName: '@sdkwork/rtc-sdk-provider-aliyun',
        builtin: true,
        typescriptAdapter: {
          sdkProvisioning: 'consumer-supplied',
          bindingStrategy: 'native-factory',
          bundlePolicy: 'must-not-bundle',
          runtimeBridgeStatus: 'reference-baseline',
          officialVendorSdkRequirement: 'required',
        },
      },
      {
        providerKey: 'tencent',
        packageName: '@sdkwork/rtc-sdk-provider-tencent',
        metadataPackageName: '@sdkwork/rtc-sdk-provider-tencent',
        builtin: true,
        typescriptAdapter: {
          sdkProvisioning: 'consumer-supplied',
          bindingStrategy: 'native-factory',
          bundlePolicy: 'must-not-bundle',
          runtimeBridgeStatus: 'reference-baseline',
          officialVendorSdkRequirement: 'required',
        },
      },
      {
        providerKey: 'agora',
        packageName: '@sdkwork/rtc-sdk-provider-agora',
        metadataPackageName: '@sdkwork/rtc-sdk-provider-agora',
        builtin: true,
        typescriptAdapter: {
          sdkProvisioning: 'consumer-supplied',
          bindingStrategy: 'native-factory',
          bundlePolicy: 'must-not-bundle',
          runtimeBridgeStatus: 'reference-baseline',
          officialVendorSdkRequirement: 'required',
        },
      },
      {
        providerKey: 'livekit',
        packageName: '@sdkwork/rtc-sdk-provider-livekit',
        metadataPackageName: '@sdkwork/rtc-sdk-provider-livekit',
        builtin: true,
        typescriptAdapter: {
          sdkProvisioning: 'consumer-supplied',
          bindingStrategy: 'native-factory',
          bundlePolicy: 'must-not-bundle',
          runtimeBridgeStatus: 'reference-baseline',
          officialVendorSdkRequirement: 'required',
        },
      },
    ],
  );

  for (const module of modules) {
    assert.equal(Object.isFrozen(module), true);
    assert.equal(module.packageName, module.metadata.typescriptPackage.packageName);
    assert.equal(module.builtin, module.metadata.typescriptPackage.rootPublic);
  }

  assert.equal(Object.isFrozen(modules), true);
});

test('registerRtcProviderModule registers built-in providers through the module contract', async () => {
  const {
    RtcDriverManager,
    getBuiltinRtcProviderModules,
    registerRtcProviderModule,
  } = await loadSdk();

  const nativeClient = { sdk: 'volcengine-web-native' };
  const volcengineModule = getBuiltinRtcProviderModules().find(
    (entry) => entry.metadata.providerKey === 'volcengine',
  );

  assert.ok(volcengineModule);

  const manager = registerRtcProviderModule(new RtcDriverManager(), volcengineModule, {
    nativeFactory: async () => nativeClient,
  });

  const client = await manager.connect({ providerKey: 'volcengine' });
  assert.equal(client.unwrap(), nativeClient);
});

test('registerRtcProviderModules registers official package-boundary providers through the batch module contract', async () => {
  const { RtcDriverManager, registerRtcProviderModules } = await loadSdk();
  const { AGORA_RTC_PROVIDER_MODULE } = await import('../dist/providers/agora.js');

  const nativeClient = { sdk: 'agora-web-native' };
  const manager = registerRtcProviderModules(new RtcDriverManager(), [
    {
      providerModule: AGORA_RTC_PROVIDER_MODULE,
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
  const { AGORA_RTC_PROVIDER_METADATA, AGORA_RTC_PROVIDER_MODULE, createAgoraRtcDriver } =
    await import('../dist/providers/agora.js');

  const manager = new RtcDriverManager();

  assert.throws(
    () =>
      registerRtcProviderModules(manager, [
        {
          providerModule: AGORA_RTC_PROVIDER_MODULE,
          options: {
            nativeFactory: async () => ({ sdk: 'agora-web-native' }),
          },
        },
        {
          providerModule: {
            packageName: '@sdkwork/rtc-sdk-provider-agora-drift',
            metadata: AGORA_RTC_PROVIDER_METADATA,
            builtin: false,
            typescriptAdapter: AGORA_RTC_PROVIDER_METADATA.typescriptAdapter,
            createDriver(options = {}) {
              return createAgoraRtcDriver(options);
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
  const { AGORA_RTC_PROVIDER_METADATA, createAgoraRtcDriver } = await import('../dist/providers/agora.js');

  assert.throws(
    () =>
      registerRtcProviderModule(
        new RtcDriverManager(),
        {
          packageName: '@sdkwork/rtc-sdk-provider-agora-drift',
          metadata: AGORA_RTC_PROVIDER_METADATA,
          builtin: false,
          typescriptAdapter: AGORA_RTC_PROVIDER_METADATA.typescriptAdapter,
          createDriver(options = {}) {
            return createAgoraRtcDriver(options);
          },
        },
      ),
    (error) =>
      error instanceof RtcSdkException &&
      error.code === 'provider_module_contract_mismatch' &&
      /package/i.test(error.message),
  );
});
