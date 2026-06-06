import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

function createMockRtcEnvironment(sdk) {
  const mediaCalls = [];
  const signalingCalls = [];
  const connectCalls = [];
  const subscriptionCalls = [];
  const sentMessages = [];
  const sessionHandlers = new Map();
  const conversationHandlers = new Map();

  const driverManager = new sdk.RtcDriverManager({
    drivers: [
      sdk.createVolcengineRtcDriver({
        nativeFactory: async () => ({
          runtime: 'mock-volcengine-web',
        }),
        runtimeController: {
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
              participantId: 'user-1',
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
        },
      }),
    ],
  });

  const rtcSignalingClient = {
    realtime: {
      async replaceSubscriptions(body) {
        subscriptionCalls.push(body);
        return {
          deviceId: body.deviceId ?? 'device-1',
          items: body.items ?? [],
        };
      },
    },
    async createSession(body) {
      signalingCalls.push(['create', body]);
      return {
        tenantId: 'tenant-1',
        rtcSessionId: body.rtcSessionId,
        conversationId: body.conversationId,
        rtcMode: body.rtcMode,
        initiatorId: 'caller-1',
        state: 'started',
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
        endedAt: '2026-04-20T12:03:00Z',
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
        endedAt: '2026-04-20T12:05:00Z',
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
          id: 'local-user',
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
    createSignalMessage(input) {
      sentMessages.push(['createSignalMessage', input]);
      return {
        kind: 'conversation-signal',
        input,
      };
    },
    async send(message) {
      sentMessages.push(['send', message]);
      return {
        messageId: 'message-1',
      };
    },
    async connect(options) {
      connectCalls.push(options);
      return {
        messages: {
          onConversation(conversationId, handler) {
            conversationHandlers.set(String(conversationId), handler);
            return () => {
              conversationHandlers.delete(String(conversationId));
            };
          },
        },
        signals: {
          onRtcSession(rtcSessionId, handler) {
            sessionHandlers.set(String(rtcSessionId), handler);
            return () => {
              sessionHandlers.delete(String(rtcSessionId));
            };
          },
        },
        disconnect() {},
      };
    },
  };

  return {
    driverManager,
    rtcSignalingClient,
    mediaCalls,
    signalingCalls,
    connectCalls,
    subscriptionCalls,
    sentMessages,
    sessionHandlers,
    conversationHandlers,
  };
}

async function flushAsyncSignals() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test('standard rtc call controller stack publishes invite, exchanges typed signals, and reconciles remote end', async () => {
  const sdk = await loadSdk();
  const env = createMockRtcEnvironment(sdk);

  const rtcStack = await sdk.createStandardRtcCallControllerStack({
    transport: env.rtcSignalingClient,
    deviceId: 'device-1',
    watchConversationIds: ['conversation-1'],
    driverManager: env.driverManager,
    dataSourceConfig: {
      nativeConfig: {
        appId: 'volc-app-id',
      },
    },
  });

  assert.equal(rtcStack.callController.getSnapshot().controllerState, 'watching');
  assert.equal(typeof rtcStack.realtimeDispatcher.subscribeSessionSignals, 'function');
  assert.equal(typeof rtcStack.realtimeDispatcher.subscribeConversationSignals, 'function');

  await rtcStack.callController.startOutgoing({
    rtcSessionId: 'rtc-session-1',
    conversationId: 'conversation-1',
    rtcMode: 'video_call',
    roomId: 'room-1',
    participantId: 'caller-1',
    signalingStreamId: 'signal-1',
    autoPublish: {
      audio: true,
    },
  });

  const inviteInput = env.sentMessages.find(
    ([type]) => type === 'createSignalMessage',
  )?.[1];
  assert.equal(inviteInput.signalType, sdk.RTC_CALL_INVITE_SIGNAL_TYPE);
  assert.equal(inviteInput.schemaRef, sdk.RTC_CALL_INVITE_SCHEMA_REF);
  assert.equal(JSON.parse(inviteInput.payload).rtcSessionId, 'rtc-session-1');
  assert.equal(rtcStack.callController.getSnapshot().controllerState, 'outgoing_ringing');
  assert.equal(env.connectCalls.length, 1);

  let acceptedAckCount = 0;

  await env.sessionHandlers.get('rtc-session-1')(
    {
      tenantId: 'tenant-1',
      rtcSessionId: 'rtc-session-1',
      conversationId: 'conversation-1',
      rtcMode: 'video_call',
      signalType: sdk.RTC_CALL_ACCEPTED_SIGNAL_TYPE,
      payload: JSON.stringify({
        rtcSessionId: 'rtc-session-1',
      }),
      sender: {
        id: 'callee-1',
      },
      signalingStreamId: 'signal-1',
      occurredAt: '2026-04-20T12:02:00Z',
    },
    {
      scopeId: 'rtc-session-1',
      ack: async () => {
        acceptedAckCount += 1;
        return {
          ackedThroughSeq: acceptedAckCount,
        };
      },
    },
  );
  await flushAsyncSignals();

  assert.equal(rtcStack.callController.getSnapshot().controllerState, 'connected');
  assert.equal(acceptedAckCount, 1);

  const offerSignal = await rtcStack.callController.sendOffer({
    sdp: 'offer-sdp',
  });
  assert.equal(offerSignal.signalType, sdk.RTC_CALL_OFFER_SIGNAL_TYPE);

  const typedPost = env.signalingCalls.find(
    (entry) =>
      entry[0] === 'postJsonSignal'
      && entry[2] === sdk.RTC_CALL_OFFER_SIGNAL_TYPE,
  );
  assert.equal(
    typedPost[3].schemaRef,
    sdk.RTC_CALL_SESSION_DESCRIPTION_SCHEMA_REF,
  );

  await env.sessionHandlers.get('rtc-session-1')(
    {
      tenantId: 'tenant-1',
      rtcSessionId: 'rtc-session-1',
      conversationId: 'conversation-1',
      rtcMode: 'video_call',
      signalType: sdk.RTC_CALL_ENDED_SIGNAL_TYPE,
      payload: JSON.stringify({
        rtcSessionId: 'rtc-session-1',
      }),
      sender: {
        id: 'callee-1',
      },
      signalingStreamId: 'signal-1',
      occurredAt: '2026-04-20T12:03:00Z',
    },
    {
      scopeId: 'rtc-session-1',
    },
  );
  await flushAsyncSignals();

  assert.equal(rtcStack.callController.getSnapshot().controllerState, 'ended');
  assert.deepEqual(env.mediaCalls.slice(-1), [['leave']]);
});

test('standard rtc call controller turns conversation invite signals into incoming call orchestration', async () => {
  const sdk = await loadSdk();
  const env = createMockRtcEnvironment(sdk);

  const rtcStack = await sdk.createStandardRtcCallControllerStack({
    transport: env.rtcSignalingClient,
    deviceId: 'device-1',
    watchConversationIds: ['conversation-1'],
    driverManager: env.driverManager,
    dataSourceConfig: {
      nativeConfig: {
        appId: 'volc-app-id',
      },
    },
  });

  let inviteAckCount = 0;
  await env.conversationHandlers.get('conversation-1')(
    {
      type: 'signal',
      content: {
        signalType: sdk.RTC_CALL_INVITE_SIGNAL_TYPE,
        payload: {
          rtcSessionId: 'rtc-session-2',
          conversationId: 'conversation-1',
          rtcMode: 'video_call',
          roomId: 'room-2',
          signalingStreamId: 'signal-2',
          initiatorId: 'caller-1',
          sentAt: '2026-04-20T12:00:00Z',
        },
      },
    },
    {
      conversationId: 'conversation-1',
      receivedAt: '2026-04-20T12:00:00Z',
      ack: async () => {
        inviteAckCount += 1;
        return {
          ackedThroughSeq: inviteAckCount,
        };
      },
    },
  );
  await flushAsyncSignals();

  assert.equal(
    rtcStack.callController.getSnapshot().controllerState,
    'incoming_ringing',
  );
  assert.equal(
    rtcStack.callController.getSnapshot().activeInvitation?.rtcSessionId,
    'rtc-session-2',
  );
  assert.equal(inviteAckCount, 1);
  assert.equal(env.connectCalls.length, 1);

  await rtcStack.callController.acceptIncoming({
    rtcSessionId: 'rtc-session-2',
    participantId: 'callee-1',
    autoPublish: {
      audio: true,
    },
  });

  const acceptedPost = env.signalingCalls.find(
    (entry) =>
      entry[0] === 'postJsonSignal'
      && entry[2] === sdk.RTC_CALL_ACCEPTED_SIGNAL_TYPE,
  );

  assert.equal(rtcStack.callController.getSnapshot().controllerState, 'connected');
  assert.equal(acceptedPost[3].schemaRef, sdk.RTC_CALL_LIFECYCLE_SCHEMA_REF);
  assert.deepEqual(env.mediaCalls.slice(0, 2), [
    [
      'join',
      {
        sessionId: 'rtc-session-2',
        roomId: 'room-2',
        participantId: 'callee-1',
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
        trackId: 'rtc-session-2-audio',
        kind: 'audio',
        metadata: {
          source: 'auto-publish',
        },
      },
    ],
  ]);
});

test('standard rtc call controller reuses a provided RTC liveConnection without opening a second socket', async () => {
  const sdk = await loadSdk();
  const env = createMockRtcEnvironment(sdk);
  const sharedLiveConnection = await env.rtcSignalingClient.connect({
    deviceId: 'device-1',
    subscriptions: {
      conversations: ['conversation-1'],
    },
  });

  assert.equal(env.connectCalls.length, 1);

  const rtcStack = await sdk.createStandardRtcCallControllerStack({
    transport: env.rtcSignalingClient,
    deviceId: 'device-1',
    liveConnection: sharedLiveConnection,
    watchConversationIds: ['conversation-1'],
    driverManager: env.driverManager,
    dataSourceConfig: {
      nativeConfig: {
        appId: 'volc-app-id',
      },
    },
  });

  assert.equal(env.connectCalls.length, 1);
  assert.equal(rtcStack.callController.getSnapshot().controllerState, 'watching');
  assert.deepEqual(env.subscriptionCalls.at(-1), {
    deviceId: 'device-1',
    items: [
      {
        scopeType: 'conversation',
        scopeId: 'conversation-1',
        eventTypes: ['message.created', 'message.updated', 'message.recalled'],
      },
    ],
  });

  await rtcStack.callController.startOutgoing({
    rtcSessionId: 'rtc-session-live-reuse',
    conversationId: 'conversation-1',
    rtcMode: 'video_call',
    roomId: 'room-live-reuse',
    participantId: 'caller-1',
    signalingStreamId: 'signal-live-reuse',
  });

  assert.equal(env.connectCalls.length, 1);
  assert.deepEqual(env.subscriptionCalls.at(-1), {
    deviceId: 'device-1',
    items: [
      {
        scopeType: 'conversation',
        scopeId: 'conversation-1',
        eventTypes: ['message.created', 'message.updated', 'message.recalled'],
      },
      {
        scopeType: 'rtc_session',
        scopeId: 'rtc-session-live-reuse',
        eventTypes: ['rtc.signal'],
      },
    ],
  });

  await rtcStack.close();

  assert.equal(env.connectCalls.length, 1);
});

test('standard rtc call controller close clears watched conversations and returns to idle', async () => {
  const sdk = await loadSdk();
  const env = createMockRtcEnvironment(sdk);

  const rtcStack = await sdk.createStandardRtcCallControllerStack({
    transport: env.rtcSignalingClient,
    deviceId: 'device-1',
    watchConversationIds: ['conversation-1'],
    driverManager: env.driverManager,
    dataSourceConfig: {
      nativeConfig: {
        appId: 'volc-app-id',
      },
    },
  });

  assert.deepEqual(
    rtcStack.callController.getSnapshot().watchedConversationIds,
    ['conversation-1'],
  );
  assert.equal(typeof rtcStack.close, 'function');

  await rtcStack.callController.startOutgoing({
    rtcSessionId: 'rtc-session-dispose',
    conversationId: 'conversation-1',
    rtcMode: 'video_call',
    roomId: 'room-dispose',
    participantId: 'caller-1',
    signalingStreamId: 'signal-dispose',
  });

  await rtcStack.callController.sendOffer({
    sdp: 'offer-before-dispose',
  });
  assert.equal(
    rtcStack.callController.getSnapshot().lastSignal?.signalType,
    sdk.RTC_CALL_OFFER_SIGNAL_TYPE,
  );

  await rtcStack.close();

  assert.equal(rtcStack.callController.getSnapshot().controllerState, 'idle');
  assert.deepEqual(rtcStack.callController.getSnapshot().watchedConversationIds, []);
  assert.equal(rtcStack.callController.getSnapshot().lastSignal, undefined);
  assert.equal(rtcStack.callController.getSnapshot().lastError, undefined);
  assert.equal(rtcStack.callSession.getSnapshot().state, 'idle');
  assert.equal(rtcStack.callSession.getSnapshot().rtcSessionId, undefined);
  assert.equal(rtcStack.callSession.getSnapshot().mediaConnectionState, undefined);
  assert.deepEqual(env.mediaCalls.slice(-1), [['leave']]);
  assert.equal(
    env.signalingCalls.some(([type]) => type === 'end'),
    false,
  );
});
