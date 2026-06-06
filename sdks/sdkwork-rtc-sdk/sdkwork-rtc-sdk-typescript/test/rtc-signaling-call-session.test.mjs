import assert from 'node:assert/strict';
import test from 'node:test';

function createMockRtcClient() {
  const mediaCalls = [];
  const metadata = {
    providerKey: 'volcengine',
    pluginId: 'rtc-volcengine',
    driverId: 'sdkwork-rtc-driver-volcengine',
    displayName: 'Volcengine RTC',
    defaultSelected: true,
    urlSchemes: ['rtc:volcengine'],
    requiredCapabilities: [],
    optionalCapabilities: [],
    extensionKeys: [],
  };

  return {
    mediaCalls,
    client: {
      metadata,
      capabilities: {
        required: [],
        optional: [],
      },
      selection: {
        providerKey: 'volcengine',
        source: 'default_provider',
      },
      async join(options) {
        mediaCalls.push(['join', options]);
        return {
          sessionId: options.sessionId,
          roomId: options.roomId,
          participantId: options.participantId,
          providerKey: 'volcengine',
          connectionState: 'joined',
        };
      },
      async leave() {
        mediaCalls.push(['leave']);
        return {
          sessionId: 'rtc-session-1',
          roomId: 'room-1',
          participantId: 'caller-1',
          providerKey: 'volcengine',
          connectionState: 'left',
        };
      },
      async publish(options) {
        mediaCalls.push(['publish', options]);
        return {
          trackId: options.trackId,
          kind: options.kind,
          muted: false,
        };
      },
      async unpublish(trackId) {
        mediaCalls.push(['unpublish', trackId]);
      },
      async muteAudio(muted = true) {
        mediaCalls.push(['muteAudio', muted]);
        return {
          kind: 'audio',
          muted,
        };
      },
      async muteVideo(muted = true) {
        mediaCalls.push(['muteVideo', muted]);
        return {
          kind: 'video',
          muted,
        };
      },
      describeCapability() {
        return undefined;
      },
      negotiateCapabilities() {
        return undefined;
      },
      getProviderExtensions() {
        return [];
      },
      supportsProviderExtension() {
        return false;
      },
      supportsCapability() {
        return true;
      },
      requireCapability() {},
      unwrap() {
        return {
          provider: 'volcengine',
        };
      },
    },
  };
}

async function loadSdk() {
  return import('../dist/index.js');
}

test('RTC signaling adapter plus standard call session drives outgoing call, signal exchange, and end', async () => {
  const {
    StandardRtcCallSession,
    createRtcSignalingAdapter,
  } = await loadSdk();

  const { client, mediaCalls } = createMockRtcClient();
  const signalingCalls = [];
  let signalHandler = null;
  let disconnected = false;
  const rtcSignalingClient = {
    async createSession(body) {
      signalingCalls.push(['create', body]);
      return {
        tenantId: 'tenant-1',
        rtcSessionId: body.rtcSessionId,
        conversationId: body.conversationId,
        rtcMode: body.rtcMode,
        initiatorId: 'caller-1',
        state: 'started',
        signalingStreamId: undefined,
        startedAt: '2026-04-20T12:00:00Z',
      };
    },
    async inviteSession(rtcSessionId, body) {
      signalingCalls.push(['invite', rtcSessionId, body]);
      return {
        tenantId: 'tenant-1',
        rtcSessionId: String(rtcSessionId),
        conversationId: 'conversation-1',
        rtcMode: 'video_call',
        initiatorId: 'caller-1',
        state: 'started',
        signalingStreamId: body.signalingStreamId,
        startedAt: '2026-04-20T12:00:00Z',
      };
    },
    async acceptSession(rtcSessionId, body) {
      signalingCalls.push(['accept', rtcSessionId, body]);
      return {
        tenantId: 'tenant-1',
        rtcSessionId: String(rtcSessionId),
        conversationId: 'conversation-1',
        rtcMode: 'video_call',
        initiatorId: 'caller-1',
        state: 'accepted',
        signalingStreamId: 'signal-1',
        startedAt: '2026-04-20T12:00:00Z',
      };
    },
    async rejectSession(rtcSessionId, body) {
      signalingCalls.push(['reject', rtcSessionId, body]);
      return {
        tenantId: 'tenant-1',
        rtcSessionId: String(rtcSessionId),
        conversationId: 'conversation-1',
        rtcMode: 'video_call',
        initiatorId: 'caller-1',
        state: 'rejected',
        signalingStreamId: 'signal-1',
        startedAt: '2026-04-20T12:00:00Z',
        endedAt: '2026-04-20T12:10:00Z',
      };
    },
    async endSession(rtcSessionId, body) {
      signalingCalls.push(['end', rtcSessionId, body]);
      return {
        tenantId: 'tenant-1',
        rtcSessionId: String(rtcSessionId),
        conversationId: 'conversation-1',
        rtcMode: 'video_call',
        initiatorId: 'caller-1',
        state: 'ended',
        signalingStreamId: 'signal-1',
        startedAt: '2026-04-20T12:00:00Z',
        endedAt: '2026-04-20T12:15:00Z',
      };
    },
    async postJsonSignal(rtcSessionId, signalType, options) {
      signalingCalls.push(['postJsonSignal', rtcSessionId, signalType, options]);
      return {
        tenantId: 'tenant-1',
        rtcSessionId: String(rtcSessionId),
        conversationId: 'conversation-1',
        rtcMode: 'video_call',
        signalType,
        payload: JSON.stringify(options.payload),
        sender: {
          id: 'caller-1',
        },
        signalingStreamId: options.signalingStreamId,
        occurredAt: '2026-04-20T12:01:00Z',
      };
    },
    async issueParticipantCredential(rtcSessionId, body) {
      signalingCalls.push(['issueParticipantCredential', rtcSessionId, body]);
      return {
        tenantId: 'tenant-1',
        rtcSessionId: String(rtcSessionId),
        participantId: body.participantId,
        credential: 'volc-token-1',
        expiresAt: '2026-04-20T13:00:00Z',
      };
    },
    async connect(options) {
      signalingCalls.push(['connect', options]);
      return {
        signals: {
          onRtcSession(rtcSessionId, handler) {
            signalingCalls.push(['onRtcSession', rtcSessionId]);
            signalHandler = handler;
            return () => {
              signalingCalls.push(['unsubscribeRtcSession', rtcSessionId]);
            };
          },
        },
        disconnect() {
          disconnected = true;
        },
      };
    },
  };
  const signaling = createRtcSignalingAdapter({
    transport: rtcSignalingClient,
    deviceId: 'device-1',
  });
  const callSession = new StandardRtcCallSession({
    mediaClient: client,
    signaling,
  });
  const receivedSignals = [];
  const unsubscribeSignals = callSession.onSignal((signal) => {
    receivedSignals.push(signal);
  });

  const snapshot = await callSession.startOutgoing({
    rtcSessionId: 'rtc-session-1',
    conversationId: 'conversation-1',
    rtcMode: 'video_call',
    roomId: 'room-1',
    participantId: 'caller-1',
    signalingStreamId: 'signal-1',
    autoPublish: {
      audio: true,
      video: true,
    },
  });

  assert.equal(snapshot.state, 'connected');
  assert.equal(snapshot.providerKey, 'volcengine');
  assert.equal(snapshot.roomId, 'room-1');
  assert.equal(snapshot.participantId, 'caller-1');
  assert.deepEqual(mediaCalls, [
    [
      'join',
      {
        sessionId: 'rtc-session-1',
        roomId: 'room-1',
        participantId: 'caller-1',
        token: 'volc-token-1',
        metadata: {
          rtcMode: 'video_call',
          conversationId: 'conversation-1',
        },
      },
    ],
    [
      'publish',
      {
        trackId: 'rtc-session-1-audio',
        kind: 'audio',
        metadata: {
          source: 'auto-publish',
        },
      },
    ],
    [
      'publish',
      {
        trackId: 'rtc-session-1-video',
        kind: 'video',
        metadata: {
          source: 'auto-publish',
        },
      },
    ],
  ]);
  assert.deepEqual(signalingCalls.slice(0, 5), [
    [
      'connect',
      {
        deviceId: 'device-1',
        subscriptions: {
          rtcSessions: ['rtc-session-1'],
        },
      },
    ],
    ['onRtcSession', 'rtc-session-1'],
    [
      'create',
      {
        rtcSessionId: 'rtc-session-1',
        conversationId: 'conversation-1',
        rtcMode: 'video_call',
      },
    ],
    [
      'invite',
      'rtc-session-1',
      {
        signalingStreamId: 'signal-1',
      },
    ],
    [
      'issueParticipantCredential',
      'rtc-session-1',
      {
        participantId: 'caller-1',
      },
    ],
  ]);

  assert.equal(typeof signalHandler, 'function');
  signalHandler(
    {
      tenantId: 'tenant-1',
      rtcSessionId: 'rtc-session-1',
      conversationId: 'conversation-1',
      rtcMode: 'video_call',
      signalType: 'offer',
      payload: JSON.stringify({
        sdp: 'offer-sdp',
      }),
      sender: {
        id: 'callee-1',
      },
      signalingStreamId: 'signal-1',
      occurredAt: '2026-04-20T12:02:00Z',
    },
    {
      scopeId: 'rtc-session-1',
    },
  );
  assert.deepEqual(receivedSignals, [
    {
      rtcSessionId: 'rtc-session-1',
      conversationId: 'conversation-1',
      rtcMode: 'video_call',
      signalType: 'offer',
      payload: {
        sdp: 'offer-sdp',
      },
      rawPayload: '{"sdp":"offer-sdp"}',
      senderId: 'callee-1',
      signalingStreamId: 'signal-1',
      occurredAt: '2026-04-20T12:02:00Z',
    },
  ]);

  assert.deepEqual(
    await callSession.sendSignal('answer', {
      sdp: 'answer-sdp',
    }),
    {
      rtcSessionId: 'rtc-session-1',
      conversationId: 'conversation-1',
      rtcMode: 'video_call',
      signalType: 'answer',
      payload: {
        sdp: 'answer-sdp',
      },
      rawPayload: '{"sdp":"answer-sdp"}',
      senderId: 'caller-1',
      signalingStreamId: 'signal-1',
      occurredAt: '2026-04-20T12:01:00Z',
    },
  );

  const endedSnapshot = await callSession.end();
  unsubscribeSignals();

  assert.equal(endedSnapshot.state, 'ended');
  assert.equal(disconnected, true);
  assert.deepEqual(mediaCalls.slice(3), [['leave']]);
  assert.deepEqual(signalingCalls.slice(-2), [
    ['end', 'rtc-session-1', {}],
    ['unsubscribeRtcSession', 'rtc-session-1'],
  ]);
});

test('standard call session accepts and rejects incoming calls through the signaling adapter', async () => {
  const {
    StandardRtcCallSession,
  } = await loadSdk();

  const { client, mediaCalls } = createMockRtcClient();
  const signalingCalls = [];
  const signaling = {
    async subscribeSessionSignals() {
      return {
        unsubscribe() {},
      };
    },
    async acceptSession(rtcSessionId, options = {}) {
      signalingCalls.push(['acceptSession', rtcSessionId, options]);
      return {
        rtcSessionId,
        conversationId: 'conversation-1',
        rtcMode: 'video_call',
        state: 'accepted',
        signalingStreamId: 'signal-1',
      };
    },
    async rejectSession(rtcSessionId, options = {}) {
      signalingCalls.push(['rejectSession', rtcSessionId, options]);
      return {
        rtcSessionId,
        conversationId: 'conversation-1',
        rtcMode: 'video_call',
        state: 'rejected',
        signalingStreamId: 'signal-1',
      };
    },
    async issueParticipantCredential(rtcSessionId, body) {
      signalingCalls.push(['issueParticipantCredential', rtcSessionId, body]);
      return {
        rtcSessionId,
        participantId: body.participantId,
        credential: 'volc-token-2',
      };
    },
    async endSession() {
      throw new Error('not used');
    },
    async sendSignal() {
      throw new Error('not used');
    },
    async createSession() {
      throw new Error('not used');
    },
    async inviteSession() {
      throw new Error('not used');
    },
  };

  const acceptedCall = new StandardRtcCallSession({
    mediaClient: client,
    signaling,
  });
  const acceptedSnapshot = await acceptedCall.acceptIncoming({
    rtcSessionId: 'rtc-session-2',
    conversationId: 'conversation-1',
    rtcMode: 'video_call',
    roomId: 'room-2',
    participantId: 'callee-1',
    autoPublish: {
      audio: true,
    },
  });

  assert.equal(acceptedSnapshot.state, 'connected');
  assert.deepEqual(signalingCalls.slice(0, 2), [
    ['acceptSession', 'rtc-session-2', {}],
    ['issueParticipantCredential', 'rtc-session-2', { participantId: 'callee-1' }],
  ]);
  assert.deepEqual(mediaCalls.slice(0, 2), [
    [
      'join',
      {
        sessionId: 'rtc-session-2',
        roomId: 'room-2',
        participantId: 'callee-1',
        token: 'volc-token-2',
        metadata: {
          rtcMode: 'video_call',
          conversationId: 'conversation-1',
        },
      },
    ],
    [
      'publish',
      {
        trackId: 'rtc-session-2-audio',
        kind: 'audio',
        metadata: {
          source: 'auto-publish',
        },
      },
    ],
  ]);

  const rejectedCall = new StandardRtcCallSession({
    mediaClient: client,
    signaling,
  });
  const rejectedSnapshot = await rejectedCall.rejectIncoming({
    rtcSessionId: 'rtc-session-3',
  });
  assert.equal(rejectedSnapshot.state, 'rejected');
  assert.deepEqual(signalingCalls.slice(-1), [['rejectSession', 'rtc-session-3', {}]]);
});

test('standard call session close releases local media state without ending the remote session', async () => {
  const {
    StandardRtcCallSession,
    createRtcSignalingAdapter,
  } = await loadSdk();

  const { client, mediaCalls } = createMockRtcClient();
  const signalingCalls = [];
  let disconnected = false;
  const rtcSignalingClient = {
    async createSession(body) {
      signalingCalls.push(['create', body]);
      return {
        rtcSessionId: body.rtcSessionId,
        conversationId: body.conversationId,
        rtcMode: body.rtcMode,
        state: 'started',
      };
    },
    async inviteSession(rtcSessionId, body) {
      signalingCalls.push(['invite', rtcSessionId, body]);
      return {
        rtcSessionId: String(rtcSessionId),
        conversationId: 'conversation-1',
        rtcMode: 'video_call',
        state: 'started',
        signalingStreamId: body.signalingStreamId,
      };
    },
    async acceptSession() {
      throw new Error('not used');
    },
    async rejectSession() {
      throw new Error('not used');
    },
    async endSession() {
      signalingCalls.push(['end']);
      throw new Error('not used');
    },
    async postJsonSignal() {
      throw new Error('not used');
    },
    async issueParticipantCredential(rtcSessionId, body) {
      signalingCalls.push(['issueParticipantCredential', rtcSessionId, body]);
      return {
        rtcSessionId: String(rtcSessionId),
        participantId: body.participantId,
        credential: 'volc-token-3',
      };
    },
    async connect(options) {
      signalingCalls.push(['connect', options]);
      return {
        signals: {
          onRtcSession(rtcSessionId) {
            signalingCalls.push(['onRtcSession', rtcSessionId]);
            return () => {
              signalingCalls.push(['unsubscribeRtcSession', rtcSessionId]);
            };
          },
        },
        disconnect() {
          disconnected = true;
        },
      };
    },
  };
  const signaling = createRtcSignalingAdapter({
    transport: rtcSignalingClient,
    deviceId: 'device-2',
  });
  const callSession = new StandardRtcCallSession({
    mediaClient: client,
    signaling,
  });

  await callSession.startOutgoing({
    rtcSessionId: 'rtc-session-dispose',
    conversationId: 'conversation-1',
    rtcMode: 'video_call',
    roomId: 'room-dispose',
    participantId: 'caller-1',
    signalingStreamId: 'signal-dispose',
  });

  await callSession.close();

  assert.equal(callSession.getSnapshot().state, 'idle');
  assert.equal(callSession.getSnapshot().rtcSessionId, undefined);
  assert.equal(callSession.getSnapshot().mediaConnectionState, undefined);
  assert.equal(disconnected, true);
  assert.deepEqual(mediaCalls.slice(-1), [['leave']]);
  assert.equal(
    signalingCalls.some(([type]) => type === 'end'),
    false,
  );
  assert.deepEqual(signalingCalls.slice(-1), [['unsubscribeRtcSession', 'rtc-session-dispose']]);
});
