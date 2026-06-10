import assert from 'node:assert/strict';
import test from 'node:test';
import { loadProviderPackage } from './provider-test-helpers.mjs';

test('official Volcengine Web bridge lazily maps the runtime surface to the vendor SDK', async () => {
  const { sdk, namespace } = await loadProviderPackage('volcengine');
  const { createOfficialVolcengineWebRtcDriver } = namespace;

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
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
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
    ['unpublishStream', 'audio'],
    ['stopAudioCapture'],
    ['leaveRoom', undefined],
    ['destroyEngine', engine],
  ]);
});

test('official Volcengine Web bridge releases local capture when audio and video tracks are unpublished', async () => {
  const { sdk, namespace } = await loadProviderPackage('volcengine');
  const { createOfficialVolcengineWebRtcDriver } = namespace;

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
    },
    async stopVideoCapture() {
      calls.push(['stopVideoCapture']);
    },
    async startAudioCapture(deviceId) {
      calls.push(['startAudioCapture', deviceId]);
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
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    nativeConfig: {
      appId: 'volc-unpublish-app',
      capture: {
        audioDeviceId: 'mic-unpublish',
        videoDeviceId: 'cam-unpublish',
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-unpublish-session',
    roomId: 'room-unpublish',
    participantId: 'user-unpublish',
    token: 'token-unpublish',
  });
  await client.publish({
    trackId: 'audio-track-unpublish',
    kind: 'audio',
  });
  await client.publish({
    trackId: 'video-track-unpublish',
    kind: 'video',
  });
  await client.unpublish('audio-track-unpublish');
  await client.unpublish('video-track-unpublish');
  await client.leave();

  assert.deepEqual(calls, [
    ['createEngine', 'volc-unpublish-app', undefined],
    [
      'joinRoom',
      'token-unpublish',
      'room-unpublish',
      {
        userId: 'user-unpublish',
        extraInfo: undefined,
      },
      undefined,
    ],
    ['startAudioCapture', 'mic-unpublish'],
    ['publishStream', 'audio'],
    ['startVideoCapture', 'cam-unpublish'],
    ['publishStream', 'video'],
    ['unpublishStream', 'audio'],
    ['stopAudioCapture'],
    ['unpublishStream', 'video'],
    ['stopVideoCapture'],
    ['leaveRoom', undefined],
    ['destroyEngine', engine],
  ]);
});

test('official Volcengine Web bridge uses one native audio publication for multiple same-kind tracks', async () => {
  const { sdk, namespace } = await loadProviderPackage('volcengine');
  const { createOfficialVolcengineWebRtcDriver } = namespace;

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
    },
    async stopVideoCapture() {
      calls.push(['stopVideoCapture']);
    },
    async startAudioCapture(deviceId) {
      calls.push(['startAudioCapture', deviceId]);
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
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    nativeConfig: {
      appId: 'volc-same-kind-app',
      capture: {
        audioDeviceId: 'mic-same-kind',
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-same-kind-session',
    roomId: 'room-same-kind',
    participantId: 'user-same-kind',
    token: 'token-same-kind',
  });
  await client.publish({
    trackId: 'audio-track-same-kind-1',
    kind: 'audio',
  });
  await client.publish({
    trackId: 'audio-track-same-kind-2',
    kind: 'audio',
  });
  await client.unpublish('audio-track-same-kind-1');
  await client.unpublish('audio-track-same-kind-2');
  await client.leave();

  assert.deepEqual(calls, [
    ['createEngine', 'volc-same-kind-app', undefined],
    [
      'joinRoom',
      'token-same-kind',
      'room-same-kind',
      {
        userId: 'user-same-kind',
        extraInfo: undefined,
      },
      undefined,
    ],
    ['startAudioCapture', 'mic-same-kind'],
    ['publishStream', 'audio'],
    ['unpublishStream', 'audio'],
    ['stopAudioCapture'],
    ['leaveRoom', undefined],
    ['destroyEngine', engine],
  ]);
});

test('official Volcengine Web bridge keeps additional same-kind tracks muted until explicit unmute', async () => {
  const { sdk, namespace } = await loadProviderPackage('volcengine');
  const { createOfficialVolcengineWebRtcDriver } = namespace;

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
    },
    async stopVideoCapture() {
      calls.push(['stopVideoCapture']);
    },
    async startAudioCapture(deviceId) {
      calls.push(['startAudioCapture', deviceId]);
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
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    nativeConfig: {
      appId: 'volc-muted-same-kind-app',
      capture: {
        audioDeviceId: 'mic-muted-same-kind',
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-muted-same-kind-session',
    roomId: 'room-muted-same-kind',
    participantId: 'user-muted-same-kind',
    token: 'token-muted-same-kind',
  });
  await client.publish({
    trackId: 'audio-track-muted-kind-1',
    kind: 'audio',
  });
  await client.muteAudio(true);

  const callsAfterMute = [
    ['createEngine', 'volc-muted-same-kind-app', undefined],
    [
      'joinRoom',
      'token-muted-same-kind',
      'room-muted-same-kind',
      {
        userId: 'user-muted-same-kind',
        extraInfo: undefined,
      },
      undefined,
    ],
    ['startAudioCapture', 'mic-muted-same-kind'],
    ['publishStream', 'audio'],
    ['stopAudioCapture'],
    ['unpublishStream', 'audio'],
  ];
  assert.deepEqual(calls, callsAfterMute);
  assert.deepEqual(
    await client.publish({
      trackId: 'audio-track-muted-kind-2',
      kind: 'audio',
    }),
    {
      trackId: 'audio-track-muted-kind-2',
      kind: 'audio',
      muted: true,
    },
  );
  assert.deepEqual(calls, callsAfterMute);

  assert.deepEqual(await client.muteAudio(false), {
    kind: 'audio',
    muted: false,
  });
  await client.unpublish('audio-track-muted-kind-1');
  await client.unpublish('audio-track-muted-kind-2');
  await client.leave();

  assert.deepEqual(calls, [
    ...callsAfterMute,
    ['startAudioCapture', 'mic-muted-same-kind'],
    ['publishStream', 'audio'],
    ['unpublishStream', 'audio'],
    ['stopAudioCapture'],
    ['leaveRoom', undefined],
    ['destroyEngine', engine],
  ]);
});

test('official Volcengine Web bridge rejects reusing a track id for another media kind', async () => {
  const { sdk, namespace } = await loadProviderPackage('volcengine');
  const { createOfficialVolcengineWebRtcDriver } = namespace;

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
    },
    async stopVideoCapture() {
      calls.push(['stopVideoCapture']);
    },
    async startAudioCapture(deviceId) {
      calls.push(['startAudioCapture', deviceId]);
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
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    nativeConfig: {
      appId: 'volc-track-conflict-app',
      capture: {
        audioDeviceId: 'mic-track-conflict',
        videoDeviceId: 'cam-track-conflict',
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-track-conflict-session',
    roomId: 'room-track-conflict',
    participantId: 'user-track-conflict',
    token: 'token-track-conflict',
  });
  await client.publish({
    trackId: 'track-conflict',
    kind: 'audio',
  });

  await assert.rejects(
    async () =>
      client.publish({
        trackId: 'track-conflict',
        kind: 'video',
      }),
    (error) => {
      assert.ok(error instanceof sdk.RtcSdkException);
      assert.equal(error.code, 'vendor_error');
      assert.equal(error.providerKey, 'volcengine');
      assert.equal(error.details?.trackId, 'track-conflict');
      assert.equal(error.details?.existingKind, 'audio');
      assert.equal(error.details?.requestedKind, 'video');
      return true;
    },
  );
  assert.deepEqual(calls, [
    ['createEngine', 'volc-track-conflict-app', undefined],
    [
      'joinRoom',
      'token-track-conflict',
      'room-track-conflict',
      {
        userId: 'user-track-conflict',
        extraInfo: undefined,
      },
      undefined,
    ],
    ['startAudioCapture', 'mic-track-conflict'],
    ['publishStream', 'audio'],
  ]);

  await client.leave();
});

test('official Volcengine Web bridge rejects reusing a media track id for screen share', async () => {
  const { sdk, namespace } = await loadProviderPackage('volcengine');
  const { createOfficialVolcengineWebRtcDriver } = namespace;

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
    },
    async stopVideoCapture() {
      calls.push(['stopVideoCapture']);
    },
    async startAudioCapture(deviceId) {
      calls.push(['startAudioCapture', deviceId]);
    },
    async stopAudioCapture() {
      calls.push(['stopAudioCapture']);
    },
    async startScreenCapture(screenCaptureConfig) {
      calls.push(['startScreenCapture', screenCaptureConfig]);
    },
    async stopScreenCapture() {
      calls.push(['stopScreenCapture']);
    },
    async publishScreen() {
      calls.push(['publishScreen']);
    },
    async unpublishScreen() {
      calls.push(['unpublishScreen']);
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
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    nativeConfig: {
      appId: 'volc-screen-track-conflict-app',
      capture: {
        audioDeviceId: 'mic-screen-track-conflict',
        screen: {
          audio: true,
          video: true,
        },
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-screen-track-conflict-session',
    roomId: 'room-screen-track-conflict',
    participantId: 'user-screen-track-conflict',
    token: 'token-screen-track-conflict',
  });
  await client.publish({
    trackId: 'track-conflict',
    kind: 'audio',
  });

  await assert.rejects(
    async () =>
      client.startScreenShare({
        trackId: 'track-conflict',
      }),
    (error) => {
      assert.ok(error instanceof sdk.RtcSdkException);
      assert.equal(error.code, 'vendor_error');
      assert.equal(error.providerKey, 'volcengine');
      assert.equal(error.details?.trackId, 'track-conflict');
      assert.equal(error.details?.existingKind, 'audio');
      assert.equal(error.details?.requestedKind, 'screen-share');
      return true;
    },
  );
  assert.deepEqual(calls, [
    ['createEngine', 'volc-screen-track-conflict-app', undefined],
    [
      'joinRoom',
      'token-screen-track-conflict',
      'room-screen-track-conflict',
      {
        userId: 'user-screen-track-conflict',
        extraInfo: undefined,
      },
      undefined,
    ],
    ['startAudioCapture', 'mic-screen-track-conflict'],
    ['publishStream', 'audio'],
  ]);

  await client.leave();
});

test('official Volcengine Web bridge accepts the current vendor default export shape', async () => {
  const { sdk, namespace } = await loadProviderPackage('volcengine');
  const { createOfficialVolcengineWebRtcDriver } = namespace;

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
  const defaultSdkModule = {
    createEngine(appId, engineConfig) {
      calls.push(['createEngine', appId, engineConfig]);
      return engine;
    },
    destroyEngine(engineInstance) {
      calls.push(['destroyEngine', engineInstance]);
    },
  };
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => ({
          default: defaultSdkModule,
        }),
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    nativeConfig: {
      appId: 'volc-app-default-export',
      roomConfig: {
        profile: 'communication',
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-session-default-export',
    roomId: 'room-default-export',
    participantId: 'user-default-export',
    token: 'token-default-export',
  });
  await client.publish({
    trackId: 'audio-track-default-export',
    kind: 'audio',
  });
  await client.leave();

  assert.deepEqual(calls, [
    ['createEngine', 'volc-app-default-export', undefined],
    [
      'joinRoom',
      'token-default-export',
      'room-default-export',
      {
        userId: 'user-default-export',
        extraInfo: undefined,
      },
      { profile: 'communication' },
    ],
    ['startAudioCapture', undefined],
    ['publishStream', 'audio'],
    ['unpublishStream', 'audio'],
    ['stopAudioCapture'],
    ['leaveRoom', undefined],
    ['destroyEngine', engine],
  ]);
});

test('official Volcengine Web bridge maps explicit screen-share operations to the vendor SDK', async () => {
  const { sdk, namespace } = await loadProviderPackage('volcengine');
  const { createOfficialVolcengineWebRtcDriver } = namespace;

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
    async startScreenCapture(screenCaptureConfig) {
      calls.push(['startScreenCapture', screenCaptureConfig]);
    },
    async stopScreenCapture() {
      calls.push(['stopScreenCapture']);
    },
    async publishScreen() {
      calls.push(['publishScreen']);
    },
    async unpublishScreen() {
      calls.push(['unpublishScreen']);
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
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    nativeConfig: {
      appId: 'volc-screen-app',
      capture: {
        screen: {
          audio: true,
          video: true,
        },
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-screen-session',
    roomId: 'room-screen',
    participantId: 'screen-user',
    token: 'screen-token',
  });
  assert.deepEqual(
    await client.startScreenShare({
      trackId: 'screen-track-1',
    }),
    {
      trackId: 'screen-track-1',
      kind: 'screen-share',
      muted: false,
    },
  );
  assert.deepEqual(
    await client.startScreenShare({
      trackId: 'screen-track-1',
    }),
    {
      trackId: 'screen-track-1',
      kind: 'screen-share',
      muted: false,
    },
  );
  await client.stopScreenShare('screen-track-1');
  await client.leave();

  assert.deepEqual(calls, [
    ['createEngine', 'volc-screen-app', undefined],
    [
      'joinRoom',
      'screen-token',
      'room-screen',
      {
        userId: 'screen-user',
        extraInfo: undefined,
      },
      undefined,
    ],
    [
      'startScreenCapture',
      {
        audio: true,
        video: true,
      },
    ],
    ['publishScreen'],
    ['unpublishScreen'],
    ['stopScreenCapture'],
    ['leaveRoom', undefined],
    ['destroyEngine', engine],
  ]);
});

test('official Volcengine Web bridge rejects a second active screen-share track', async () => {
  const { sdk, namespace } = await loadProviderPackage('volcengine');
  const { createOfficialVolcengineWebRtcDriver } = namespace;

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
    },
    async stopVideoCapture() {
      calls.push(['stopVideoCapture']);
    },
    async startAudioCapture(deviceId) {
      calls.push(['startAudioCapture', deviceId]);
    },
    async stopAudioCapture() {
      calls.push(['stopAudioCapture']);
    },
    async startScreenCapture(screenCaptureConfig) {
      calls.push(['startScreenCapture', screenCaptureConfig]);
    },
    async stopScreenCapture() {
      calls.push(['stopScreenCapture']);
    },
    async publishScreen() {
      calls.push(['publishScreen']);
    },
    async unpublishScreen() {
      calls.push(['unpublishScreen']);
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
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    nativeConfig: {
      appId: 'volc-second-screen-app',
      capture: {
        screen: {
          audio: true,
          video: true,
        },
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-second-screen-session',
    roomId: 'room-second-screen',
    participantId: 'screen-user',
    token: 'screen-token',
  });
  await client.startScreenShare({
    trackId: 'screen-track-1',
  });

  await assert.rejects(
    async () =>
      client.startScreenShare({
        trackId: 'screen-track-2',
      }),
    (error) => {
      assert.ok(error instanceof sdk.RtcSdkException);
      assert.equal(error.code, 'vendor_error');
      assert.equal(error.providerKey, 'volcengine');
      assert.equal(error.details?.activeTrackId, 'screen-track-1');
      assert.equal(error.details?.requestedTrackId, 'screen-track-2');
      assert.equal(error.details?.kind, 'screen-share');
      return true;
    },
  );

  assert.deepEqual(calls, [
    ['createEngine', 'volc-second-screen-app', undefined],
    [
      'joinRoom',
      'screen-token',
      'room-second-screen',
      {
        userId: 'screen-user',
        extraInfo: undefined,
      },
      undefined,
    ],
    [
      'startScreenCapture',
      {
        audio: true,
        video: true,
      },
    ],
    ['publishScreen'],
  ]);

  await client.leave();
});

test('official Volcengine Web bridge requires joining before local media operations', async () => {
  const { sdk, namespace } = await loadProviderPackage('volcengine');
  const { createOfficialVolcengineWebRtcDriver } = namespace;

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
    },
    async stopVideoCapture() {
      calls.push(['stopVideoCapture']);
    },
    async startAudioCapture(deviceId) {
      calls.push(['startAudioCapture', deviceId]);
    },
    async stopAudioCapture() {
      calls.push(['stopAudioCapture']);
    },
    async startScreenCapture(screenCaptureConfig) {
      calls.push(['startScreenCapture', screenCaptureConfig]);
    },
    async stopScreenCapture() {
      calls.push(['stopScreenCapture']);
    },
    async publishScreen() {
      calls.push(['publishScreen']);
    },
    async unpublishScreen() {
      calls.push(['unpublishScreen']);
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
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    nativeConfig: {
      appId: 'volc-prejoin-app',
      capture: {
        audioDeviceId: 'mic-prejoin',
        videoDeviceId: 'cam-prejoin',
        screen: {
          video: true,
        },
      },
    },
  });

  const client = await dataSource.createClient();
  const assertRequiresJoin = async (operation) => {
    await assert.rejects(operation, (error) => {
      assert.ok(error instanceof sdk.RtcSdkException);
      assert.equal(error.code, 'vendor_error');
      assert.equal(error.providerKey, 'volcengine');
      assert.equal(error.details?.requiredState, 'joined');
      assert.equal(error.details?.currentState, 'left');
      return true;
    });
  };

  await assertRequiresJoin(() =>
    client.publish({
      trackId: 'audio-track-prejoin',
      kind: 'audio',
    }),
  );
  await assertRequiresJoin(() =>
    client.startScreenShare({
      trackId: 'screen-track-prejoin',
    }),
  );
  await assertRequiresJoin(() => client.muteAudio(true));
  await assertRequiresJoin(() => client.muteVideo(true));

  assert.deepEqual(calls, []);
});

test('official Volcengine Web bridge drains active media before leave', async () => {
  const { sdk, namespace } = await loadProviderPackage('volcengine');
  const { createOfficialVolcengineWebRtcDriver } = namespace;

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
    },
    async stopVideoCapture() {
      calls.push(['stopVideoCapture']);
    },
    async startAudioCapture(deviceId) {
      calls.push(['startAudioCapture', deviceId]);
    },
    async stopAudioCapture() {
      calls.push(['stopAudioCapture']);
    },
    async startScreenCapture(screenCaptureConfig) {
      calls.push(['startScreenCapture', screenCaptureConfig]);
    },
    async stopScreenCapture() {
      calls.push(['stopScreenCapture']);
    },
    async publishScreen() {
      calls.push(['publishScreen']);
    },
    async unpublishScreen() {
      calls.push(['unpublishScreen']);
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
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    nativeConfig: {
      appId: 'volc-leave-drain-app',
      capture: {
        audioDeviceId: 'mic-leave-drain',
        videoDeviceId: 'cam-leave-drain',
        screen: {
          video: true,
        },
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-leave-drain-session',
    roomId: 'room-leave-drain',
    participantId: 'leave-drain-user',
    token: 'leave-drain-token',
  });
  await client.publish({
    trackId: 'audio-track-leave-drain',
    kind: 'audio',
  });
  await client.publish({
    trackId: 'video-track-leave-drain',
    kind: 'video',
  });
  await client.startScreenShare({
    trackId: 'screen-track-leave-drain',
  });
  await client.leave();

  assert.deepEqual(calls, [
    ['createEngine', 'volc-leave-drain-app', undefined],
    [
      'joinRoom',
      'leave-drain-token',
      'room-leave-drain',
      {
        userId: 'leave-drain-user',
        extraInfo: undefined,
      },
      undefined,
    ],
    ['startAudioCapture', 'mic-leave-drain'],
    ['publishStream', 'audio'],
    ['startVideoCapture', 'cam-leave-drain'],
    ['publishStream', 'video'],
    [
      'startScreenCapture',
      {
        video: true,
      },
    ],
    ['publishScreen'],
    ['unpublishStream', 'audio'],
    ['stopAudioCapture'],
    ['unpublishStream', 'video'],
    ['stopVideoCapture'],
    ['unpublishScreen'],
    ['stopScreenCapture'],
    ['leaveRoom', undefined],
    ['destroyEngine', engine],
  ]);
});

test('official Volcengine Web bridge fails with a stable error when appId is missing', async () => {
  const { sdk, namespace } = await loadProviderPackage('volcengine');
  const { createOfficialVolcengineWebRtcDriver } = namespace;

  const manager = new sdk.RtcDriverManager({
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
  const dataSource = new sdk.RtcDataSource({
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
      assert.ok(error instanceof sdk.RtcSdkException);
      assert.equal(error.code, 'invalid_native_config');
      assert.equal(error.providerKey, 'volcengine');
      assert.deepEqual(error.details?.missingConfigKeys, ['appId']);
      return true;
    },
  );
});
