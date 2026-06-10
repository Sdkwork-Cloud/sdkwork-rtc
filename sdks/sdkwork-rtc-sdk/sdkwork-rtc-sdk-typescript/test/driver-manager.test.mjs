import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createManagerWithProviderPackages,
  loadProviderPackage,
  loadSdk,
} from './provider-test-helpers.mjs';

test('driver manager resolves a provider package by explicit provider key', async () => {
  const { manager } = await createManagerWithProviderPackages(['volcengine', 'aliyun']);

  const driver = manager.resolve({ providerKey: 'aliyun' });
  assert.equal(driver.metadata.providerKey, 'aliyun');
  assert.equal(driver.metadata.pluginId, 'rtc-aliyun');
});

test('driver manager resolves a provider package by rtc provider url', async () => {
  const { manager } = await createManagerWithProviderPackages(['volcengine', 'tencent']);

  const driver = manager.resolve({ providerUrl: 'rtc:tencent://app/default' });
  assert.equal(driver.metadata.providerKey, 'tencent');
  assert.equal(driver.metadata.driverId, 'sdkwork-rtc-driver-tencent');
});

test('driver manager throws a stable invalid_provider_url error for malformed rtc urls', async () => {
  const { sdk, manager } = await createManagerWithProviderPackages(['volcengine']);

  await assert.rejects(
    async () => manager.connect({ providerUrl: 'https://example.test/not-an-rtc-url' }),
    (error) => {
      assert.ok(error instanceof sdk.RtcSdkException);
      assert.equal(error.code, 'invalid_provider_url');
      return true;
    },
  );
});

test('driver manager throws a stable driver_not_found error for unknown providers', async () => {
  const { sdk, manager } = await createManagerWithProviderPackages(['volcengine']);

  await assert.rejects(
    async () => manager.connect({ providerKey: 'vendor-x' }),
    (error) => {
      assert.ok(error instanceof sdk.RtcSdkException);
      assert.equal(error.code, 'driver_not_found');
      return true;
    },
  );
});

test('driver manager can inspect provider metadata without creating a client', async () => {
  const { manager } = await createManagerWithProviderPackages(['volcengine', 'tencent']);

  assert.equal(manager.hasDriver('volcengine'), true);
  assert.equal(manager.hasDriver('aliyun'), false);
  assert.equal(manager.getMetadata({ providerUrl: 'rtc:tencent://cluster/prod' }).providerKey, 'tencent');
  assert.equal(manager.getDefaultMetadata().providerKey, 'volcengine');
});

test('driver manager rejects duplicate provider registration', async () => {
  const { sdk, namespace, packageEntry } = await loadProviderPackage('volcengine');
  const createDriver = namespace[packageEntry.driverFactory];
  const manager = new sdk.RtcDriverManager({
    drivers: [createDriver()],
  });

  assert.throws(
    () => manager.register(createDriver()),
    (error) => {
      assert.ok(error instanceof sdk.RtcSdkException);
      assert.equal(error.code, 'driver_already_registered');
      assert.equal(error.providerKey, 'volcengine');
      return true;
    },
  );
});

test('driver manager rejects registering drivers for unknown providers', async () => {
  const { RtcDriverManager, RtcSdkException, createRtcProviderDriver } = await loadSdk();

  const manager = new RtcDriverManager();
  const driver = createRtcProviderDriver({
    metadata: {
      providerKey: 'vendor-x',
      pluginId: 'rtc-vendor-x',
      driverId: 'sdkwork-rtc-driver-vendor-x',
      displayName: 'Vendor X RTC',
      defaultSelected: false,
      urlSchemes: ['rtc:vendor-x'],
      requiredCapabilities: ['session', 'credential', 'provider.webhook', 'health', 'media.audio', 'media.video', 'live.broadcast', 'live.audience', 'provider.event-normalization'],
      optionalCapabilities: ['screen-share'],
      extensionKeys: ['vendor-x.native-client'],
    },
  });

  assert.throws(
    () => manager.register(driver),
    (error) => {
      assert.ok(error instanceof RtcSdkException);
      assert.equal(error.code, 'provider_not_official');
      assert.equal(error.providerKey, 'vendor-x');
      return true;
    },
  );
});

test('driver manager rejects registering official providers with metadata drift', async () => {
  const {
    RtcDriverManager,
    RtcSdkException,
    createRtcProviderDriver,
    getOfficialRtcProviderMetadataByKey,
  } = await loadSdk();

  const officialAgora = getOfficialRtcProviderMetadataByKey('agora');
  assert.ok(officialAgora);

  const manager = new RtcDriverManager();
  const driftedDriver = createRtcProviderDriver({
    metadata: {
      ...officialAgora,
      pluginId: 'rtc-agora-custom',
    },
  });

  assert.throws(
    () => manager.register(driftedDriver),
    (error) => {
      assert.ok(error instanceof RtcSdkException);
      assert.equal(error.code, 'provider_metadata_mismatch');
      assert.equal(error.providerKey, 'agora');
      assert.equal(error.pluginId, 'rtc-agora-custom');
      return true;
    },
  );
});

test('driver manager distinguishes official-but-unregistered providers from unknown providers', async () => {
  const { sdk, manager } = await createManagerWithProviderPackages(['volcengine']);

  assert.equal(manager.getMetadata({ providerKey: 'agora' }).providerKey, 'agora');

  await assert.rejects(
    async () => manager.connect({ providerKey: 'agora' }),
    (error) => {
      assert.ok(error instanceof sdk.RtcSdkException);
      assert.equal(error.code, 'provider_not_supported');
      assert.equal(error.providerKey, 'agora');
      return true;
    },
  );
});

test('driver manager exposes stable provider selection precedence', async () => {
  const { manager } = await createManagerWithProviderPackages([
    'volcengine',
    'aliyun',
    'tencent',
  ]);

  assert.deepEqual(
    manager.resolveSelection({
      tenantOverrideProviderKey: 'aliyun',
      deploymentProfileProviderKey: 'tencent',
    }),
    {
      providerKey: 'aliyun',
      source: 'tenant_override',
    },
  );

  assert.deepEqual(
    manager.resolveSelection({
      providerKey: 'tencent',
      tenantOverrideProviderKey: 'aliyun',
      deploymentProfileProviderKey: 'volcengine',
    }),
    {
      providerKey: 'tencent',
      source: 'provider_key',
    },
  );

  assert.deepEqual(
    manager.resolveSelection({
      providerUrl: 'rtc:aliyun://cluster/main',
      providerKey: 'tencent',
      tenantOverrideProviderKey: 'volcengine',
    }),
    {
      providerKey: 'aliyun',
      source: 'provider_url',
    },
  );

  assert.deepEqual(
    manager.resolveSelection({
      deploymentProfileProviderKey: 'tencent',
    }),
    {
      providerKey: 'tencent',
      source: 'deployment_profile',
    },
  );

  assert.deepEqual(manager.resolveSelection({}), {
    providerKey: 'volcengine',
    source: 'default_provider',
  });
});

test('driver manager exposes provider support-state introspection', async () => {
  const { manager } = await createManagerWithProviderPackages(['volcengine', 'tencent']);

  assert.deepEqual(manager.describeProviderSupport('volcengine'), {
    providerKey: 'volcengine',
    status: 'builtin_registered',
    builtin: true,
    official: true,
    registered: true,
  });

  assert.deepEqual(manager.describeProviderSupport('tencent'), {
    providerKey: 'tencent',
    status: 'builtin_registered',
    builtin: true,
    official: true,
    registered: true,
  });

  assert.deepEqual(manager.describeProviderSupport('agora'), {
    providerKey: 'agora',
    status: 'official_unregistered',
    builtin: true,
    official: true,
    registered: false,
  });

  assert.deepEqual(manager.describeProviderSupport('vendor-x'), {
    providerKey: 'vendor-x',
    status: 'unknown',
    builtin: false,
    official: false,
    registered: false,
  });
});

test('driver manager lists provider support-state across the official provider catalog', async () => {
  const { manager } = await createManagerWithProviderPackages(['volcengine', 'tencent']);
  const providerSupport = manager.listProviderSupport();

  assert.equal(Array.isArray(providerSupport), true);
  assert.equal(providerSupport.length, 10);
  assert.deepEqual(
    providerSupport.find((entry) => entry.providerKey === 'volcengine'),
    {
      providerKey: 'volcengine',
      status: 'builtin_registered',
      builtin: true,
      official: true,
      registered: true,
    },
  );
  assert.deepEqual(
    providerSupport.find((entry) => entry.providerKey === 'agora'),
    {
      providerKey: 'agora',
      status: 'official_unregistered',
      builtin: true,
      official: true,
      registered: false,
    },
  );
  assert.equal(
    providerSupport.some((entry) => entry.providerKey === 'vendor-x'),
    false,
  );
});
