import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

test('driver manager resolves a built-in provider by explicit provider key', async () => {
  const { RtcDriverManager, createVolcengineRtcDriver, createAliyunRtcDriver } = await loadSdk();

  const manager = new RtcDriverManager({
    defaultProviderKey: 'volcengine',
    drivers: [createVolcengineRtcDriver(), createAliyunRtcDriver()],
  });

  const driver = manager.resolve({ providerKey: 'aliyun' });
  assert.equal(driver.metadata.providerKey, 'aliyun');
  assert.equal(driver.metadata.pluginId, 'rtc-aliyun');
});

test('driver manager resolves a built-in provider by rtc provider url', async () => {
  const { RtcDriverManager, createVolcengineRtcDriver, createTencentRtcDriver } = await loadSdk();

  const manager = new RtcDriverManager({
    defaultProviderKey: 'volcengine',
    drivers: [createVolcengineRtcDriver(), createTencentRtcDriver()],
  });

  const driver = manager.resolve({ providerUrl: 'rtc:tencent://app/default' });
  assert.equal(driver.metadata.providerKey, 'tencent');
  assert.equal(driver.metadata.driverId, 'sdkwork-rtc-driver-tencent');
});

test('driver manager throws a stable invalid_provider_url error for malformed rtc urls', async () => {
  const { RtcDriverManager, RtcSdkException, createVolcengineRtcDriver } = await loadSdk();

  const manager = new RtcDriverManager({
    defaultProviderKey: 'volcengine',
    drivers: [createVolcengineRtcDriver()],
  });

  await assert.rejects(
    async () => manager.connect({ providerUrl: 'https://example.test/not-an-rtc-url' }),
    (error) => {
      assert.ok(error instanceof RtcSdkException);
      assert.equal(error.code, 'invalid_provider_url');
      return true;
    },
  );
});

test('driver manager throws a stable driver_not_found error for unknown providers', async () => {
  const { RtcDriverManager, RtcSdkException, createVolcengineRtcDriver } = await loadSdk();

  const manager = new RtcDriverManager({
    defaultProviderKey: 'volcengine',
    drivers: [createVolcengineRtcDriver()],
  });

  await assert.rejects(
    async () => manager.connect({ providerKey: 'vendor-x' }),
    (error) => {
      assert.ok(error instanceof RtcSdkException);
      assert.equal(error.code, 'driver_not_found');
      return true;
    },
  );
});

test('driver manager can inspect provider metadata without creating a client', async () => {
  const {
    RtcDriverManager,
    createVolcengineRtcDriver,
    createTencentRtcDriver,
  } = await loadSdk();

  const manager = new RtcDriverManager({
    defaultProviderKey: 'volcengine',
    drivers: [createVolcengineRtcDriver(), createTencentRtcDriver()],
  });

  assert.equal(manager.hasDriver('volcengine'), true);
  assert.equal(manager.hasDriver('aliyun'), false);
  assert.equal(manager.getMetadata({ providerUrl: 'rtc:tencent://cluster/prod' }).providerKey, 'tencent');
  assert.equal(manager.getDefaultMetadata().providerKey, 'volcengine');
});

test('driver manager rejects duplicate provider registration', async () => {
  const {
    RtcDriverManager,
    RtcSdkException,
    createVolcengineRtcDriver,
  } = await loadSdk();

  const manager = new RtcDriverManager({
    drivers: [createVolcengineRtcDriver()],
  });

  assert.throws(
    () => manager.register(createVolcengineRtcDriver()),
    (error) => {
      assert.ok(error instanceof RtcSdkException);
      assert.equal(error.code, 'driver_already_registered');
      assert.equal(error.providerKey, 'volcengine');
      return true;
    },
  );
});

test('driver manager rejects registering drivers for unknown providers', async () => {
  const {
    RtcDriverManager,
    RtcSdkException,
    createRtcProviderDriver,
  } = await loadSdk();

  const manager = new RtcDriverManager();
  const driver = createRtcProviderDriver({
    metadata: {
      providerKey: 'vendor-x',
      pluginId: 'rtc-vendor-x',
      driverId: 'sdkwork-rtc-driver-vendor-x',
      displayName: 'Vendor X RTC',
      defaultSelected: false,
      urlSchemes: ['rtc:vendor-x'],
      requiredCapabilities: ['session', 'join', 'publish', 'subscribe', 'mute', 'basic-events', 'health', 'unwrap'],
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
  } = await loadSdk();

  const manager = new RtcDriverManager();
  const driftedDriver = createRtcProviderDriver({
    metadata: {
      providerKey: 'agora',
      pluginId: 'rtc-agora-custom',
      driverId: 'sdkwork-rtc-driver-agora',
      displayName: 'Agora RTC',
      defaultSelected: false,
      urlSchemes: ['rtc:agora'],
      requiredCapabilities: ['session', 'join', 'publish', 'subscribe', 'mute', 'basic-events', 'health', 'unwrap'],
      optionalCapabilities: ['screen-share', 'recording', 'cloud-mix', 'data-channel', 'spatial-audio', 'e2ee'],
      extensionKeys: ['agora.native-client'],
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
  const {
    RtcDriverManager,
    RtcSdkException,
    createVolcengineRtcDriver,
  } = await loadSdk();

  const manager = new RtcDriverManager({
    drivers: [createVolcengineRtcDriver()],
  });

  assert.equal(manager.getMetadata({ providerKey: 'agora' }).providerKey, 'agora');

  await assert.rejects(
    async () => manager.connect({ providerKey: 'agora' }),
    (error) => {
      assert.ok(error instanceof RtcSdkException);
      assert.equal(error.code, 'provider_not_supported');
      assert.equal(error.providerKey, 'agora');
      return true;
    },
  );
});

test('driver manager exposes stable provider selection precedence', async () => {
  const {
    RtcDriverManager,
    createVolcengineRtcDriver,
    createAliyunRtcDriver,
    createTencentRtcDriver,
  } = await loadSdk();

  const manager = new RtcDriverManager({
    defaultProviderKey: 'volcengine',
    drivers: [
      createVolcengineRtcDriver(),
      createAliyunRtcDriver(),
      createTencentRtcDriver(),
    ],
  });

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
  const {
    RtcDriverManager,
    createVolcengineRtcDriver,
    createTencentRtcDriver,
  } = await loadSdk();

  const manager = new RtcDriverManager({
    drivers: [createVolcengineRtcDriver(), createTencentRtcDriver()],
  });

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
  const {
    RtcDriverManager,
    createVolcengineRtcDriver,
    createTencentRtcDriver,
  } = await loadSdk();

  const manager = new RtcDriverManager({
    drivers: [createVolcengineRtcDriver(), createTencentRtcDriver()],
  });
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
