import assert from 'node:assert/strict';
import test from 'node:test';
import { loadProviderPackage } from './provider-test-helpers.mjs';

test('official Tencent Web bridge lazily maps the runtime surface to TRTC Web SDK v5', async () => {
  const { sdk, namespace } = await loadProviderPackage('tencent');
  const { createOfficialTencentWebRtcDriver } = namespace;

  const calls = [];
  const trtc = {
    async enterRoom(options) {
      calls.push(['enterRoom', options]);
    },
    async exitRoom() {
      calls.push(['exitRoom']);
    },
    async destroy() {
      calls.push(['destroy']);
    },
    async startLocalAudio(options) {
      calls.push(['startLocalAudio', options]);
    },
    async stopLocalAudio() {
      calls.push(['stopLocalAudio']);
    },
    async startLocalVideo(options) {
      calls.push(['startLocalVideo', options]);
    },
    async stopLocalVideo() {
      calls.push(['stopLocalVideo']);
    },
    async startScreenShare(options) {
      calls.push(['startScreenShare', options]);
    },
    async stopScreenShare() {
      calls.push(['stopScreenShare']);
    },
  };
  const sdkModule = {
    create() {
      calls.push(['create']);
      return trtc;
    },
  };
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialTencentWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'tencent',
    nativeConfig: {
      sdkAppId: 1400000001,
      userSig: 'user-sig-1',
      scene: 'rtc',
      role: 'anchor',
      privateMapKey: 'private-map-key-1',
      audio: {
        microphoneId: 'mic-1',
        profile: 'standard',
      },
      video: {
        cameraId: 'cam-1',
        view: '#local-video',
        profile: '720p',
      },
      screen: {
        option: {
          systemAudio: true,
        },
      },
    },
  });

  const client = await dataSource.createClient();
  assert.deepEqual(calls, []);

  assert.deepEqual(
    await client.join({
      sessionId: 'rtc-session-1',
      roomId: '100001',
      participantId: 'user-1',
    }),
    {
      sessionId: 'rtc-session-1',
      roomId: '100001',
      participantId: 'user-1',
      providerKey: 'tencent',
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
  await client.unpublish('video-track-1');
  assert.deepEqual(await client.leave(), {
    sessionId: 'rtc-session-1',
    roomId: '100001',
    participantId: 'user-1',
    providerKey: 'tencent',
    connectionState: 'left',
  });

  assert.deepEqual(calls, [
    ['create'],
    [
      'enterRoom',
      {
        sdkAppId: 1400000001,
        roomId: 100001,
        userId: 'user-1',
        userSig: 'user-sig-1',
        scene: 'rtc',
        role: 'anchor',
        privateMapKey: 'private-map-key-1',
      },
    ],
    [
      'startLocalAudio',
      {
        microphoneId: 'mic-1',
        profile: 'standard',
      },
    ],
    [
      'startLocalVideo',
      {
        cameraId: 'cam-1',
        view: '#local-video',
        profile: '720p',
      },
    ],
    ['stopLocalAudio'],
    [
      'startLocalAudio',
      {
        microphoneId: 'mic-1',
        profile: 'standard',
      },
    ],
    ['stopLocalVideo'],
    [
      'startScreenShare',
      {
        option: {
          systemAudio: true,
        },
      },
    ],
    ['stopScreenShare'],
    ['stopLocalAudio'],
    ['exitRoom'],
    ['destroy'],
  ]);
});

test('official Tencent Web bridge rejects a second active screen-share track', async () => {
  const { sdk, namespace } = await loadProviderPackage('tencent');
  const { createOfficialTencentWebRtcDriver } = namespace;

  const calls = [];
  const trtc = {
    async enterRoom(options) {
      calls.push(['enterRoom', options]);
    },
    async exitRoom() {
      calls.push(['exitRoom']);
    },
    async destroy() {
      calls.push(['destroy']);
    },
    async startLocalAudio(options) {
      calls.push(['startLocalAudio', options]);
    },
    async stopLocalAudio() {
      calls.push(['stopLocalAudio']);
    },
    async startLocalVideo(options) {
      calls.push(['startLocalVideo', options]);
    },
    async stopLocalVideo() {
      calls.push(['stopLocalVideo']);
    },
    async startScreenShare(options) {
      calls.push(['startScreenShare', options]);
    },
    async stopScreenShare() {
      calls.push(['stopScreenShare']);
    },
  };
  const sdkModule = {
    create() {
      calls.push(['create']);
      return trtc;
    },
  };
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialTencentWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'tencent',
    nativeConfig: {
      sdkAppId: 1400000008,
      userSig: 'user-sig-second-screen',
      screen: {
        option: {
          systemAudio: true,
        },
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-second-screen-session',
    roomId: '100008',
    participantId: 'screen-user',
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
      assert.equal(error.providerKey, 'tencent');
      assert.equal(error.details?.activeTrackId, 'screen-track-1');
      assert.equal(error.details?.requestedTrackId, 'screen-track-2');
      assert.equal(error.details?.kind, 'screen-share');
      return true;
    },
  );

  assert.deepEqual(calls, [
    ['create'],
    [
      'enterRoom',
      {
        sdkAppId: 1400000008,
        roomId: 100008,
        userId: 'screen-user',
        userSig: 'user-sig-second-screen',
      },
    ],
    [
      'startScreenShare',
      {
        option: {
          systemAudio: true,
        },
      },
    ],
  ]);

  await client.leave();
});

test('official Tencent Web bridge requires joining before local media operations', async () => {
  const { sdk, namespace } = await loadProviderPackage('tencent');
  const { createOfficialTencentWebRtcDriver } = namespace;

  const calls = [];
  const trtc = {
    async enterRoom(options) {
      calls.push(['enterRoom', options]);
    },
    async exitRoom() {
      calls.push(['exitRoom']);
    },
    async destroy() {
      calls.push(['destroy']);
    },
    async startLocalAudio(options) {
      calls.push(['startLocalAudio', options]);
    },
    async stopLocalAudio() {
      calls.push(['stopLocalAudio']);
    },
    async startLocalVideo(options) {
      calls.push(['startLocalVideo', options]);
    },
    async stopLocalVideo() {
      calls.push(['stopLocalVideo']);
    },
    async startScreenShare(options) {
      calls.push(['startScreenShare', options]);
    },
    async stopScreenShare() {
      calls.push(['stopScreenShare']);
    },
  };
  const sdkModule = {
    create() {
      calls.push(['create']);
      return trtc;
    },
  };
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialTencentWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'tencent',
    nativeConfig: {
      sdkAppId: 1400000010,
      userSig: 'user-sig-prejoin',
      audio: {
        microphoneId: 'mic-prejoin',
      },
      video: {
        cameraId: 'cam-prejoin',
      },
      screen: {
        option: {
          systemAudio: true,
        },
      },
    },
  });

  const client = await dataSource.createClient();
  const assertRequiresJoin = async (operation) => {
    await assert.rejects(operation, (error) => {
      assert.ok(error instanceof sdk.RtcSdkException);
      assert.equal(error.code, 'vendor_error');
      assert.equal(error.providerKey, 'tencent');
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

test('official Tencent Web bridge drains active media before leave', async () => {
  const { sdk, namespace } = await loadProviderPackage('tencent');
  const { createOfficialTencentWebRtcDriver } = namespace;

  const calls = [];
  const trtc = {
    async enterRoom(options) {
      calls.push(['enterRoom', options]);
    },
    async exitRoom() {
      calls.push(['exitRoom']);
    },
    async destroy() {
      calls.push(['destroy']);
    },
    async startLocalAudio(options) {
      calls.push(['startLocalAudio', options]);
    },
    async stopLocalAudio() {
      calls.push(['stopLocalAudio']);
    },
    async startLocalVideo(options) {
      calls.push(['startLocalVideo', options]);
    },
    async stopLocalVideo() {
      calls.push(['stopLocalVideo']);
    },
    async startScreenShare(options) {
      calls.push(['startScreenShare', options]);
    },
    async stopScreenShare() {
      calls.push(['stopScreenShare']);
    },
  };
  const sdkModule = {
    create() {
      calls.push(['create']);
      return trtc;
    },
  };
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialTencentWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'tencent',
    nativeConfig: {
      sdkAppId: 1400000009,
      userSig: 'user-sig-leave-drain',
      audio: {
        microphoneId: 'mic-leave-drain',
      },
      video: {
        cameraId: 'cam-leave-drain',
      },
      screen: {
        option: {
          systemAudio: true,
        },
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-leave-drain-session',
    roomId: '100009',
    participantId: 'leave-drain-user',
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
    ['create'],
    [
      'enterRoom',
      {
        sdkAppId: 1400000009,
        roomId: 100009,
        userId: 'leave-drain-user',
        userSig: 'user-sig-leave-drain',
      },
    ],
    [
      'startLocalAudio',
      {
        microphoneId: 'mic-leave-drain',
      },
    ],
    [
      'startLocalVideo',
      {
        cameraId: 'cam-leave-drain',
      },
    ],
    [
      'startScreenShare',
      {
        option: {
          systemAudio: true,
        },
      },
    ],
    ['stopLocalAudio'],
    ['stopLocalVideo'],
    ['stopScreenShare'],
    ['exitRoom'],
    ['destroy'],
  ]);
});

test('official Tencent Web bridge accepts the current vendor default export shape', async () => {
  const { sdk, namespace } = await loadProviderPackage('tencent');
  const { createOfficialTencentWebRtcDriver } = namespace;

  const calls = [];
  const trtc = {
    async enterRoom(options) {
      calls.push(['enterRoom', options]);
    },
    async exitRoom() {
      calls.push(['exitRoom']);
    },
    async destroy() {
      calls.push(['destroy']);
    },
    async startLocalAudio(options) {
      calls.push(['startLocalAudio', options]);
    },
    async stopLocalAudio() {
      calls.push(['stopLocalAudio']);
    },
    async startLocalVideo(options) {
      calls.push(['startLocalVideo', options]);
    },
    async stopLocalVideo() {
      calls.push(['stopLocalVideo']);
    },
    async startScreenShare(options) {
      calls.push(['startScreenShare', options]);
    },
    async stopScreenShare() {
      calls.push(['stopScreenShare']);
    },
  };
  const defaultSdkModule = {
    create() {
      calls.push(['create']);
      return trtc;
    },
  };
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialTencentWebRtcDriver({
        loadSdk: async () => ({
          default: defaultSdkModule,
        }),
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'tencent',
    nativeConfig: {
      sdkAppId: '1400000002',
      userSig: 'user-sig-default-export',
      audio: {
        profile: 'speech',
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-session-default-export',
    roomId: 'room-default-export',
    participantId: 'user-default-export',
  });
  await client.publish({
    trackId: 'audio-track-default-export',
    kind: 'audio',
  });
  await client.leave();

  assert.deepEqual(calls, [
    ['create'],
    [
      'enterRoom',
      {
        sdkAppId: 1400000002,
        roomId: 'room-default-export',
        userId: 'user-default-export',
        userSig: 'user-sig-default-export',
      },
    ],
    [
      'startLocalAudio',
      {
        profile: 'speech',
      },
    ],
    ['stopLocalAudio'],
    ['exitRoom'],
    ['destroy'],
  ]);
});

test('official Tencent Web bridge releases local audio and video when tracks are unpublished', async () => {
  const { sdk, namespace } = await loadProviderPackage('tencent');
  const { createOfficialTencentWebRtcDriver } = namespace;

  const calls = [];
  const trtc = {
    async enterRoom(options) {
      calls.push(['enterRoom', options]);
    },
    async exitRoom() {
      calls.push(['exitRoom']);
    },
    async destroy() {
      calls.push(['destroy']);
    },
    async startLocalAudio(options) {
      calls.push(['startLocalAudio', options]);
    },
    async stopLocalAudio() {
      calls.push(['stopLocalAudio']);
    },
    async startLocalVideo(options) {
      calls.push(['startLocalVideo', options]);
    },
    async stopLocalVideo() {
      calls.push(['stopLocalVideo']);
    },
    async startScreenShare(options) {
      calls.push(['startScreenShare', options]);
    },
    async stopScreenShare() {
      calls.push(['stopScreenShare']);
    },
  };
  const sdkModule = {
    create() {
      calls.push(['create']);
      return trtc;
    },
  };
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialTencentWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'tencent',
    nativeConfig: {
      sdkAppId: 1400000003,
      userSig: 'user-sig-unpublish',
      audio: {
        microphoneId: 'mic-unpublish',
      },
      video: {
        cameraId: 'cam-unpublish',
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-unpublish-session',
    roomId: '100003',
    participantId: 'user-unpublish',
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
    ['create'],
    [
      'enterRoom',
      {
        sdkAppId: 1400000003,
        roomId: 100003,
        userId: 'user-unpublish',
        userSig: 'user-sig-unpublish',
      },
    ],
    [
      'startLocalAudio',
      {
        microphoneId: 'mic-unpublish',
      },
    ],
    [
      'startLocalVideo',
      {
        cameraId: 'cam-unpublish',
      },
    ],
    ['stopLocalAudio'],
    ['stopLocalVideo'],
    ['exitRoom'],
    ['destroy'],
  ]);
});

test('official Tencent Web bridge uses one native video publication for multiple same-kind tracks', async () => {
  const { sdk, namespace } = await loadProviderPackage('tencent');
  const { createOfficialTencentWebRtcDriver } = namespace;

  const calls = [];
  const trtc = {
    async enterRoom(options) {
      calls.push(['enterRoom', options]);
    },
    async exitRoom() {
      calls.push(['exitRoom']);
    },
    async destroy() {
      calls.push(['destroy']);
    },
    async startLocalAudio(options) {
      calls.push(['startLocalAudio', options]);
    },
    async stopLocalAudio() {
      calls.push(['stopLocalAudio']);
    },
    async startLocalVideo(options) {
      calls.push(['startLocalVideo', options]);
    },
    async stopLocalVideo() {
      calls.push(['stopLocalVideo']);
    },
    async startScreenShare(options) {
      calls.push(['startScreenShare', options]);
    },
    async stopScreenShare() {
      calls.push(['stopScreenShare']);
    },
  };
  const sdkModule = {
    create() {
      calls.push(['create']);
      return trtc;
    },
  };
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialTencentWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'tencent',
    nativeConfig: {
      sdkAppId: 1400000004,
      userSig: 'user-sig-same-kind',
      video: {
        cameraId: 'cam-same-kind',
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-same-kind-session',
    roomId: '100004',
    participantId: 'user-same-kind',
  });
  await client.publish({
    trackId: 'video-track-same-kind-1',
    kind: 'video',
  });
  await client.publish({
    trackId: 'video-track-same-kind-2',
    kind: 'video',
  });
  await client.unpublish('video-track-same-kind-1');
  await client.unpublish('video-track-same-kind-2');
  await client.leave();

  assert.deepEqual(calls, [
    ['create'],
    [
      'enterRoom',
      {
        sdkAppId: 1400000004,
        roomId: 100004,
        userId: 'user-same-kind',
        userSig: 'user-sig-same-kind',
      },
    ],
    [
      'startLocalVideo',
      {
        cameraId: 'cam-same-kind',
      },
    ],
    ['stopLocalVideo'],
    ['exitRoom'],
    ['destroy'],
  ]);
});

test('official Tencent Web bridge keeps additional same-kind tracks muted until explicit unmute', async () => {
  const { sdk, namespace } = await loadProviderPackage('tencent');
  const { createOfficialTencentWebRtcDriver } = namespace;

  const calls = [];
  const trtc = {
    async enterRoom(options) {
      calls.push(['enterRoom', options]);
    },
    async exitRoom() {
      calls.push(['exitRoom']);
    },
    async destroy() {
      calls.push(['destroy']);
    },
    async startLocalAudio(options) {
      calls.push(['startLocalAudio', options]);
    },
    async stopLocalAudio() {
      calls.push(['stopLocalAudio']);
    },
    async startLocalVideo(options) {
      calls.push(['startLocalVideo', options]);
    },
    async stopLocalVideo() {
      calls.push(['stopLocalVideo']);
    },
    async startScreenShare(options) {
      calls.push(['startScreenShare', options]);
    },
    async stopScreenShare() {
      calls.push(['stopScreenShare']);
    },
  };
  const sdkModule = {
    create() {
      calls.push(['create']);
      return trtc;
    },
  };
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialTencentWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'tencent',
    nativeConfig: {
      sdkAppId: 1400000005,
      userSig: 'user-sig-muted-same-kind',
      audio: {
        microphoneId: 'mic-muted-same-kind',
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-muted-same-kind-session',
    roomId: '100005',
    participantId: 'user-muted-same-kind',
  });
  await client.publish({
    trackId: 'audio-track-muted-kind-1',
    kind: 'audio',
  });
  await client.muteAudio(true);

  const callsAfterMute = [
    ['create'],
    [
      'enterRoom',
      {
        sdkAppId: 1400000005,
        roomId: 100005,
        userId: 'user-muted-same-kind',
        userSig: 'user-sig-muted-same-kind',
      },
    ],
    [
      'startLocalAudio',
      {
        microphoneId: 'mic-muted-same-kind',
      },
    ],
    ['stopLocalAudio'],
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
    [
      'startLocalAudio',
      {
        microphoneId: 'mic-muted-same-kind',
      },
    ],
    ['stopLocalAudio'],
    ['exitRoom'],
    ['destroy'],
  ]);
});

test('official Tencent Web bridge rejects reusing a track id for another media kind', async () => {
  const { sdk, namespace } = await loadProviderPackage('tencent');
  const { createOfficialTencentWebRtcDriver } = namespace;

  const calls = [];
  const trtc = {
    async enterRoom(options) {
      calls.push(['enterRoom', options]);
    },
    async exitRoom() {
      calls.push(['exitRoom']);
    },
    async destroy() {
      calls.push(['destroy']);
    },
    async startLocalAudio(options) {
      calls.push(['startLocalAudio', options]);
    },
    async stopLocalAudio() {
      calls.push(['stopLocalAudio']);
    },
    async startLocalVideo(options) {
      calls.push(['startLocalVideo', options]);
    },
    async stopLocalVideo() {
      calls.push(['stopLocalVideo']);
    },
    async startScreenShare(options) {
      calls.push(['startScreenShare', options]);
    },
    async stopScreenShare() {
      calls.push(['stopScreenShare']);
    },
  };
  const sdkModule = {
    create() {
      calls.push(['create']);
      return trtc;
    },
  };
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialTencentWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'tencent',
    nativeConfig: {
      sdkAppId: 1400000006,
      userSig: 'user-sig-track-conflict',
      audio: {
        microphoneId: 'mic-track-conflict',
      },
      video: {
        cameraId: 'cam-track-conflict',
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-track-conflict-session',
    roomId: '100006',
    participantId: 'user-track-conflict',
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
      assert.equal(error.providerKey, 'tencent');
      assert.equal(error.details?.trackId, 'track-conflict');
      assert.equal(error.details?.existingKind, 'audio');
      assert.equal(error.details?.requestedKind, 'video');
      return true;
    },
  );
  assert.deepEqual(calls, [
    ['create'],
    [
      'enterRoom',
      {
        sdkAppId: 1400000006,
        roomId: 100006,
        userId: 'user-track-conflict',
        userSig: 'user-sig-track-conflict',
      },
    ],
    [
      'startLocalAudio',
      {
        microphoneId: 'mic-track-conflict',
      },
    ],
  ]);

  await client.leave();
});

test('official Tencent Web bridge rejects reusing a media track id for screen share', async () => {
  const { sdk, namespace } = await loadProviderPackage('tencent');
  const { createOfficialTencentWebRtcDriver } = namespace;

  const calls = [];
  const trtc = {
    async enterRoom(options) {
      calls.push(['enterRoom', options]);
    },
    async exitRoom() {
      calls.push(['exitRoom']);
    },
    async destroy() {
      calls.push(['destroy']);
    },
    async startLocalAudio(options) {
      calls.push(['startLocalAudio', options]);
    },
    async stopLocalAudio() {
      calls.push(['stopLocalAudio']);
    },
    async startLocalVideo(options) {
      calls.push(['startLocalVideo', options]);
    },
    async stopLocalVideo() {
      calls.push(['stopLocalVideo']);
    },
    async startScreenShare(options) {
      calls.push(['startScreenShare', options]);
    },
    async stopScreenShare() {
      calls.push(['stopScreenShare']);
    },
  };
  const sdkModule = {
    create() {
      calls.push(['create']);
      return trtc;
    },
  };
  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialTencentWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'tencent',
    nativeConfig: {
      sdkAppId: 1400000007,
      userSig: 'user-sig-screen-track-conflict',
      audio: {
        microphoneId: 'mic-screen-track-conflict',
      },
      screen: {
        option: {
          systemAudio: true,
        },
      },
    },
  });

  const client = await dataSource.createClient();
  await client.join({
    sessionId: 'rtc-screen-track-conflict-session',
    roomId: '100007',
    participantId: 'user-screen-track-conflict',
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
      assert.equal(error.providerKey, 'tencent');
      assert.equal(error.details?.trackId, 'track-conflict');
      assert.equal(error.details?.existingKind, 'audio');
      assert.equal(error.details?.requestedKind, 'screen-share');
      return true;
    },
  );
  assert.deepEqual(calls, [
    ['create'],
    [
      'enterRoom',
      {
        sdkAppId: 1400000007,
        roomId: 100007,
        userId: 'user-screen-track-conflict',
        userSig: 'user-sig-screen-track-conflict',
      },
    ],
    [
      'startLocalAudio',
      {
        microphoneId: 'mic-screen-track-conflict',
      },
    ],
  ]);

  await client.leave();
});

test('official Tencent Web bridge fails with a stable error when required config is missing', async () => {
  const { sdk, namespace } = await loadProviderPackage('tencent');
  const { createOfficialTencentWebRtcDriver } = namespace;

  const manager = new sdk.RtcDriverManager({
    drivers: [
      createOfficialTencentWebRtcDriver({
        loadSdk: async () => ({
          create() {
            throw new Error('should not be called without required config');
          },
        }),
      }),
    ],
  });
  const dataSource = new sdk.RtcDataSource({
    driverManager: manager,
    providerKey: 'tencent',
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
      assert.equal(error.providerKey, 'tencent');
      assert.deepEqual(error.details?.missingConfigKeys, ['sdkAppId', 'userSig']);
      return true;
    },
  );
});
