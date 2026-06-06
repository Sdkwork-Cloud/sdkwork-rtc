import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

test('data source defaults provider selection to volcengine', async () => {
  const { RtcDataSource, createBuiltinRtcDriverManager } = await loadSdk();

  const dataSource = new RtcDataSource({
    driverManager: createBuiltinRtcDriverManager(),
  });

  const client = await dataSource.createClient();
  assert.deepEqual(dataSource.describeSelection(), {
    providerKey: 'volcengine',
    source: 'default_provider',
  });
  assert.equal(client.metadata.providerKey, 'volcengine');
  assert.equal(client.metadata.defaultSelected, true);
});

test('data source preserves provider metadata and capability declarations', async () => {
  const { RtcDataSource, createBuiltinRtcDriverManager, hasCapability } = await loadSdk();

  const dataSource = new RtcDataSource({
    driverManager: createBuiltinRtcDriverManager(),
    providerKey: 'aliyun',
  });

  const client = await dataSource.createClient();

  assert.equal(client.metadata.providerKey, 'aliyun');
  assert.equal(hasCapability(client.capabilities, 'session'), true);
  assert.equal(hasCapability(client.capabilities, 'screen-share'), true);
});

test('data source unwrap returns the native client instance created by the adapter', async () => {
  const {
    RtcDataSource,
    RtcDriverManager,
    createVolcengineRtcDriver,
  } = await loadSdk();

  const nativeClient = { sdk: 'volcengine-web-native' };
  const manager = new RtcDriverManager({
    drivers: [
      createVolcengineRtcDriver({
        nativeFactory: async () => nativeClient,
      }),
    ],
  });
  const dataSource = new RtcDataSource({
    driverManager: manager,
  });

  const client = await dataSource.createClient();
  assert.equal(client.unwrap(), nativeClient);
});

test('data source describe resolves metadata before client creation', async () => {
  const { RtcDataSource, createBuiltinRtcDriverManager } = await loadSdk();

  const dataSource = new RtcDataSource({
    driverManager: createBuiltinRtcDriverManager(),
    providerUrl: 'rtc:tencent://room-service/default',
  });

  const metadata = dataSource.describe();
  assert.equal(metadata.providerKey, 'tencent');
  assert.equal(metadata.pluginId, 'rtc-tencent');
});

test('data source exposes stable provider selection introspection', async () => {
  const { RtcDataSource, createBuiltinRtcDriverManager } = await loadSdk();

  const dataSource = new RtcDataSource({
    driverManager: createBuiltinRtcDriverManager(),
    deploymentProfileProviderKey: 'tencent',
    tenantOverrideProviderKey: 'aliyun',
  });

  assert.deepEqual(dataSource.describeSelection(), {
    providerKey: 'aliyun',
    source: 'tenant_override',
  });
  assert.deepEqual(
    dataSource.describeSelection({ providerUrl: 'rtc:volcengine://default/main' }),
    {
      providerKey: 'volcengine',
      source: 'provider_url',
    },
  );
});

test('data source can describe provider support state without connecting', async () => {
  const { RtcDataSource, createBuiltinRtcDriverManager } = await loadSdk();

  const dataSource = new RtcDataSource({
    driverManager: createBuiltinRtcDriverManager(),
    providerKey: 'agora',
  });

  assert.deepEqual(dataSource.describeProviderSupport(), {
    providerKey: 'agora',
    status: 'builtin_registered',
    builtin: true,
    official: true,
    registered: true,
  });
  assert.deepEqual(
    dataSource.describeProviderSupport({ providerKey: 'volcengine' }),
    {
      providerKey: 'volcengine',
      status: 'builtin_registered',
      builtin: true,
      official: true,
      registered: true,
    },
  );
});

test('data source can list provider support state matrix without connecting', async () => {
  const { RtcDataSource, createBuiltinRtcDriverManager } = await loadSdk();

  const dataSource = new RtcDataSource({
    driverManager: createBuiltinRtcDriverManager(),
  });
  const providerSupport = dataSource.listProviderSupport();

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
    providerSupport.find((entry) => entry.providerKey === 'livekit'),
    {
      providerKey: 'livekit',
      status: 'builtin_registered',
      builtin: true,
      official: true,
      registered: true,
    },
  );
});

test('client capability checks use a stable capability_not_supported error', async () => {
  const {
    RtcDataSource,
    RtcSdkException,
    createBuiltinRtcDriverManager,
  } = await loadSdk();

  const dataSource = new RtcDataSource({
    driverManager: createBuiltinRtcDriverManager(),
    providerKey: 'aliyun',
  });
  const client = await dataSource.createClient();

  assert.deepEqual(client.selection, {
    providerKey: 'aliyun',
    source: 'provider_key',
  });
  assert.equal(client.supportsCapability('recording'), true);
  assert.equal(client.supportsCapability('data-channel'), false);
  assert.throws(
    () => client.requireCapability('data-channel'),
    (error) => {
      assert.ok(error instanceof RtcSdkException);
      assert.equal(error.code, 'capability_not_supported');
      assert.equal(error.providerKey, 'aliyun');
      return true;
    },
  );
});

test('client delegates runtime bridge operations through the provider-neutral runtime surface', async () => {
  const {
    RtcDataSource,
    RtcDriverManager,
    createVolcengineRtcDriver,
  } = await loadSdk();

  const nativeClient = { sdk: 'volcengine-web-native' };
  const calls = [];
  const manager = new RtcDriverManager({
    drivers: [
      createVolcengineRtcDriver({
        nativeFactory: async () => nativeClient,
        runtimeController: {
          async join(options, context) {
            calls.push(['join', options, context.selection.providerKey]);
            assert.equal(context.nativeClient, nativeClient);
            return {
              sessionId: options.sessionId,
              roomId: options.roomId,
              participantId: options.participantId,
              providerKey: context.metadata.providerKey,
              connectionState: 'joined',
            };
          },
          async leave(context) {
            calls.push(['leave', context.selection.providerKey]);
            return {
              sessionId: 'session-1',
              roomId: 'room-1',
              participantId: 'local-user',
              providerKey: context.metadata.providerKey,
              connectionState: 'left',
            };
          },
          async publish(options, context) {
            calls.push(['publish', options.trackId, context.selection.providerKey]);
            return {
              trackId: options.trackId,
              kind: options.kind,
              muted: false,
            };
          },
          async unpublish(trackId, context) {
            calls.push(['unpublish', trackId, context.selection.providerKey]);
          },
          async muteAudio(muted, context) {
            calls.push(['mute-audio', muted, context.selection.providerKey]);
            return {
              kind: 'audio',
              muted,
            };
          },
          async muteVideo(muted, context) {
            calls.push(['mute-video', muted, context.selection.providerKey]);
            return {
              kind: 'video',
              muted,
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

  assert.deepEqual(
    await client.join({
      sessionId: 'session-1',
      roomId: 'room-1',
      participantId: 'local-user',
    }),
    {
      sessionId: 'session-1',
      roomId: 'room-1',
      participantId: 'local-user',
      providerKey: 'volcengine',
      connectionState: 'joined',
    },
  );
  assert.deepEqual(
    await client.publish({
      trackId: 'track-audio-1',
      kind: 'audio',
    }),
    {
      trackId: 'track-audio-1',
      kind: 'audio',
      muted: false,
    },
  );
  assert.deepEqual(await client.muteAudio(), {
    kind: 'audio',
    muted: true,
  });
  assert.deepEqual(await client.muteVideo(false), {
    kind: 'video',
    muted: false,
  });
  await client.unpublish('track-audio-1');
  assert.deepEqual(await client.leave(), {
    sessionId: 'session-1',
    roomId: 'room-1',
    participantId: 'local-user',
    providerKey: 'volcengine',
    connectionState: 'left',
  });
  assert.deepEqual(calls, [
    [
      'join',
      {
        sessionId: 'session-1',
        roomId: 'room-1',
        participantId: 'local-user',
      },
      'volcengine',
    ],
    ['publish', 'track-audio-1', 'volcengine'],
    ['mute-audio', true, 'volcengine'],
    ['mute-video', false, 'volcengine'],
    ['unpublish', 'track-audio-1', 'volcengine'],
    ['leave', 'volcengine'],
  ]);
});

test('default Volcengine runtime requires explicit native appId configuration before join', async () => {
  const {
    RtcDataSource,
    RtcSdkException,
    createBuiltinRtcDriverManager,
  } = await loadSdk();

  const dataSource = new RtcDataSource({
    driverManager: createBuiltinRtcDriverManager(),
  });
  const client = await dataSource.createClient();

  await assert.rejects(
    async () =>
      client.join({
        sessionId: 'session-1',
        roomId: 'room-1',
        participantId: 'local-user',
      }),
    (error) => {
      assert.ok(error instanceof RtcSdkException);
      assert.equal(error.code, 'invalid_native_config');
      assert.equal(error.providerKey, 'volcengine');
      assert.deepEqual(error.details?.missingConfigKeys, ['appId']);
      return true;
    },
  );
});
