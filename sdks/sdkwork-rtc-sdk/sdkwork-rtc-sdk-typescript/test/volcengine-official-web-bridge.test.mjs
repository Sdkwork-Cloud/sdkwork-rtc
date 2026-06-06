import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

test('official Volcengine Web bridge lazily maps the runtime surface to the vendor SDK', async () => {
  const {
    RtcDataSource,
    RtcDriverManager,
    createOfficialVolcengineWebRtcDriver,
  } = await loadSdk();

  const calls = [];
  const engine = {
    async joinRoom(token, roomId, userInfo, roomConfig) {
      calls.push(['joinRoom', token, roomId, userInfo, roomConfig]);
    },
    async leaveRoom(waitAck) {
      calls.push(['leaveRoom', waitAck]);
    },
    async publishStream(mediaType) {
      calls.push(['publishStream', mediaType]);
    },
    async unpublishStream(mediaType) {
      calls.push(['unpublishStream', mediaType]);
    },
    async startVideoCapture(deviceId) {
      calls.push(['startVideoCapture', deviceId]);
      return {};
    },
    async stopVideoCapture() {
      calls.push(['stopVideoCapture']);
    },
    async startAudioCapture(deviceId) {
      calls.push(['startAudioCapture', deviceId]);
      return {};
    },
    async stopAudioCapture() {
      calls.push(['stopAudioCapture']);
    },
  };
  const sdkModule = {
    createEngine(appId, engineConfig) {
      calls.push(['createEngine', appId, engineConfig]);
      return engine;
    },
    destroyEngine(engineInstance) {
      calls.push(['destroyEngine', engineInstance]);
    },
  };
  const manager = new RtcDriverManager({
    drivers: [
      createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new RtcDataSource({
    driverManager: manager,
    nativeConfig: {
      appId: 'volc-app-1',
      engineConfig: {
        env: 'test',
      },
      roomConfig: {
        profile: 'communication',
      },
      userExtraInfo: {
        displayName: 'Caller',
      },
      capture: {
        audioDeviceId: 'mic-1',
        videoDeviceId: 'cam-1',
      },
    },
  });

  const client = await dataSource.createClient();
  assert.deepEqual(calls, []);

  assert.deepEqual(
    await client.join({
      sessionId: 'rtc-session-1',
      roomId: 'room-1',
      participantId: 'user-1',
      token: 'token-1',
      metadata: {
        role: 'host',
      },
    }),
    {
      sessionId: 'rtc-session-1',
      roomId: 'room-1',
      participantId: 'user-1',
      providerKey: 'volcengine',
      connectionState: 'joined',
    },
  );
  assert.deepEqual(
    await client.publish({
      trackId: 'audio-track-1',
      kind: 'audio',
    }),
    {
      trackId: 'audio-track-1',
      kind: 'audio',
      muted: false,
    },
  );
  assert.deepEqual(
    await client.publish({
      trackId: 'video-track-1',
      kind: 'video',
    }),
    {
      trackId: 'video-track-1',
      kind: 'video',
      muted: false,
    },
  );
  assert.deepEqual(await client.muteAudio(true), {
    kind: 'audio',
    muted: true,
  });
  assert.deepEqual(await client.muteAudio(false), {
    kind: 'audio',
    muted: false,
  });
  assert.deepEqual(await client.muteVideo(true), {
    kind: 'video',
    muted: true,
  });
  await client.unpublish('video-track-1');
  assert.deepEqual(await client.leave(), {
    sessionId: 'rtc-session-1',
    roomId: 'room-1',
    participantId: 'user-1',
    providerKey: 'volcengine',
    connectionState: 'left',
  });

  assert.deepEqual(calls, [
    ['createEngine', 'volc-app-1', { env: 'test' }],
    [
      'joinRoom',
      'token-1',
      'room-1',
      {
        userId: 'user-1',
        extraInfo: JSON.stringify({
          displayName: 'Caller',
          role: 'host',
        }),
      },
      { profile: 'communication' },
    ],
    ['startAudioCapture', 'mic-1'],
    ['publishStream', 'audio'],
    ['startVideoCapture', 'cam-1'],
    ['publishStream', 'video'],
    ['stopAudioCapture'],
    ['unpublishStream', 'audio'],
    ['startAudioCapture', 'mic-1'],
    ['publishStream', 'audio'],
    ['stopVideoCapture'],
    ['unpublishStream', 'video'],
    ['unpublishStream', 'video'],
    ['leaveRoom', undefined],
    ['destroyEngine', engine],
  ]);
});

test('official Volcengine Web bridge fails with a stable error when appId is missing', async () => {
  const {
    RtcDataSource,
    RtcDriverManager,
    RtcSdkException,
    createOfficialVolcengineWebRtcDriver,
  } = await loadSdk();

  const manager = new RtcDriverManager({
    drivers: [
      createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => ({
          createEngine() {
            throw new Error('should not be called without appId');
          },
          destroyEngine() {},
        }),
      }),
    ],
  });
  const dataSource = new RtcDataSource({
    driverManager: manager,
  });
  const client = await dataSource.createClient();

  await assert.rejects(
    async () =>
      client.join({
        sessionId: 'rtc-session-1',
        roomId: 'room-1',
        participantId: 'user-1',
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
