import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

test('capability sets are immutable runtime snapshots', async () => {
  const { createCapabilitySet } = await loadSdk();

  const required = ['session', 'join'];
  const optional = ['screen-share'];
  const capabilities = createCapabilitySet({
    required,
    optional,
  });

  required.push('publish');
  optional.push('recording');

  assert.equal(Object.isFrozen(capabilities), true);
  assert.equal(Object.isFrozen(capabilities.required), true);
  assert.equal(Object.isFrozen(capabilities.optional), true);
  assert.deepEqual(capabilities.required, ['session', 'join']);
  assert.deepEqual(capabilities.optional, ['screen-share']);
  assert.throws(() => capabilities.required.push('publish'), TypeError);
  assert.throws(() => {
    capabilities.optional = [];
  }, TypeError);
});

test('provider drivers snapshot metadata and expose immutable contracts', async () => {
  const { createRtcProviderDriver } = await loadSdk();

  const metadata = {
    providerKey: 'agora',
    pluginId: 'rtc-agora',
    driverId: 'sdkwork-rtc-driver-agora',
    displayName: 'Agora RTC',
    defaultSelected: false,
    urlSchemes: ['rtc:agora'],
    requiredCapabilities: ['session', 'join', 'publish', 'subscribe', 'mute', 'basic-events', 'health', 'unwrap'],
    optionalCapabilities: ['screen-share', 'recording'],
    extensionKeys: ['agora.native-client'],
  };
  const driver = createRtcProviderDriver({
    metadata,
  });

  metadata.urlSchemes.push('rtc:agora-drift');
  metadata.requiredCapabilities.push('session');
  metadata.extensionKeys.push('agora.native-client-drift');

  assert.equal(Object.isFrozen(driver), true);
  assert.equal(Object.isFrozen(driver.metadata), true);
  assert.equal(Object.isFrozen(driver.metadata.urlSchemes), true);
  assert.equal(Object.isFrozen(driver.metadata.requiredCapabilities), true);
  assert.equal(Object.isFrozen(driver.metadata.extensionKeys), true);
  assert.deepEqual(driver.metadata.urlSchemes, ['rtc:agora']);
  assert.deepEqual(driver.metadata.requiredCapabilities, [
    'session',
    'join',
    'publish',
    'subscribe',
    'mute',
    'basic-events',
    'health',
    'unwrap',
  ]);
  assert.deepEqual(driver.metadata.extensionKeys, ['agora.native-client']);
  assert.throws(() => driver.metadata.urlSchemes.push('rtc:agora-bad'), TypeError);
  assert.throws(() => {
    driver.metadata = metadata;
  }, TypeError);
});

test('driver-manager runtime descriptors are immutable snapshots', async () => {
  const {
    RtcDriverManager,
    createVolcengineRtcDriver,
    createTencentRtcDriver,
    parseRtcProviderUrl,
  } = await loadSdk();

  const manager = new RtcDriverManager({
    drivers: [createVolcengineRtcDriver(), createTencentRtcDriver()],
  });

  const parsedUrl = parseRtcProviderUrl('rtc:tencent://app/default');
  const selection = manager.resolveSelection({
    providerUrl: 'rtc:tencent://app/default',
  });
  const listedMetadata = manager.list();
  const providerSupport = manager.describeProviderSupport('tencent');
  const providerSupportList = manager.listProviderSupport();

  assert.equal(Object.isFrozen(parsedUrl), true);
  assert.equal(Object.isFrozen(selection), true);
  assert.equal(Object.isFrozen(listedMetadata), true);
  assert.equal(Object.isFrozen(providerSupport), true);
  assert.equal(Object.isFrozen(providerSupportList), true);
  assert.equal(Object.isFrozen(providerSupportList[0]), true);
  assert.equal(Object.isFrozen(manager.getMetadata({ providerKey: 'tencent' })), true);
  assert.throws(() => {
    selection.providerKey = 'aliyun';
  }, TypeError);
  assert.throws(() => providerSupportList.push(providerSupport), TypeError);
});

test('client runtime surfaces are immutable while native sdk instances stay mutable', async () => {
  const {
    RtcDataSource,
    RtcDriverManager,
    createVolcengineRtcDriver,
  } = await loadSdk();

  const nativeClient = {
    sdk: 'volcengine-web-native',
    mutableFlag: false,
  };
  let observedContext;
  const manager = new RtcDriverManager({
    drivers: [
      createVolcengineRtcDriver({
        nativeFactory: async () => nativeClient,
        runtimeController: {
          async join(options, context) {
            observedContext = context;
            context.nativeClient.mutableFlag = true;
            return {
              sessionId: options.sessionId,
              roomId: options.roomId,
              participantId: options.participantId,
              providerKey: context.metadata.providerKey,
              connectionState: 'joined',
            };
          },
        },
      }),
    ],
  });
  const dataSource = new RtcDataSource({
    driverManager: manager,
  });

  const client = await dataSource.createClient();
  const selection = dataSource.describeSelection();
  const providerSupport = dataSource.describeProviderSupport();
  const capabilityState = dataSource.describeCapability('session');
  const negotiation = dataSource.negotiateCapabilities({
    required: ['session'],
    optional: ['data-channel'],
  });

  assert.equal(Object.isFrozen(client.metadata), true);
  assert.equal(Object.isFrozen(client.capabilities), true);
  assert.equal(Object.isFrozen(client.selection), true);
  assert.equal(Object.isFrozen(selection), true);
  assert.equal(Object.isFrozen(providerSupport), true);
  assert.equal(Object.isFrozen(capabilityState), true);
  assert.equal(Object.isFrozen(negotiation), true);
  assert.equal(Object.isFrozen(negotiation.supportedRequired), true);
  assert.equal(Object.isFrozen(negotiation.missingOptional), true);
  assert.equal(Object.isFrozen(negotiation.missingBySurface), true);
  assert.throws(() => {
    client.metadata = null;
  }, TypeError);
  assert.throws(() => {
    client.selection.providerKey = 'aliyun';
  }, TypeError);

  await client.join({
    sessionId: 'session-1',
    roomId: 'room-1',
    participantId: 'local-user',
  });

  assert.ok(observedContext);
  assert.equal(Object.isFrozen(observedContext), true);
  assert.equal(Object.isFrozen(observedContext.metadata), true);
  assert.equal(Object.isFrozen(observedContext.capabilities), true);
  assert.equal(Object.isFrozen(observedContext.selection), true);
  assert.equal(Object.isFrozen(observedContext.nativeClient), false);
  assert.equal(nativeClient.mutableFlag, true);
});
