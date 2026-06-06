#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  RTC_CALL_SMOKE_DEFAULT_DEVICE_ID,
  buildRtcCallSmokeConnectOptions,
} from '../../bin/rtc-call-smoke-standard.mjs';

const DEFAULT_OPTIONS = Object.freeze({
  appId: 'volc-app-smoke',
  sessionId: 'rtc-session-smoke',
  conversationId: 'conversation-smoke',
  roomId: 'room-smoke',
  participantId: 'user-smoke',
  signalingStreamId: 'signal-smoke',
  deviceId: RTC_CALL_SMOKE_DEFAULT_DEVICE_ID,
  reuseLiveConnection: false,
  json: false,
});

function fail(message) {
  const error = new Error(message);
  error.code = 'rtc_call_smoke_invalid_config';
  throw error;
}

function writeLine(writer, line = '') {
  writer.write(`${line}\n`);
}

function normalizeOptionName(token) {
  return token.replace(/^-+/, '').trim();
}

function parseOptionEntries(argv) {
  const entries = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = String(argv[index]);
    if (!token.startsWith('-')) {
      fail(`Unexpected positional argument "${token}".`);
    }

    const normalizedToken = normalizeOptionName(token);
    if (!normalizedToken) {
      fail(`Invalid empty option token "${token}".`);
    }

    const inlineEqualsIndex = normalizedToken.indexOf('=');
    const optionName =
      inlineEqualsIndex >= 0
        ? normalizedToken.slice(0, inlineEqualsIndex)
        : normalizedToken;

    const inlineValue =
      inlineEqualsIndex >= 0
        ? normalizedToken.slice(inlineEqualsIndex + 1)
        : undefined;

    const nextToken = argv[index + 1];
    const hasSeparateValue =
      inlineValue === undefined
      && nextToken !== undefined
      && !String(nextToken).startsWith('-');

    if (inlineValue !== undefined) {
      entries[optionName] = inlineValue;
      continue;
    }

    if (hasSeparateValue) {
      entries[optionName] = nextToken;
      index += 1;
      continue;
    }

    entries[optionName] = true;
  }

  return entries;
}

function readStringOption(entries, optionName, fallback) {
  const value = entries[optionName];
  if (value === undefined || value === true) {
    return fallback;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    fail(`${optionName} must not be empty.`);
  }

  return normalized;
}

export function getRtcCallSmokeHelpText() {
  return [
    'SDKWork RTC TypeScript call smoke CLI',
    '',
    'Usage:',
    '  node ./bin/sdk-call-smoke.mjs [--json] [--app-id <id>] [--session-id <id>]',
    '',
    'Behavior:',
    '  runs the public @sdkwork/rtc-sdk surface against mocked RTC signaling adapter signaling',
    '  and a mocked official Volcengine Web SDK module',
    '  does not hit external services or require live credentials',
    '',
    'Options:',
    '  --json                        Print the smoke summary as JSON',
    '  --app-id <id>                Override the mocked Volcengine appId',
    '  --session-id <id>            Override the RTC session id',
    '  --conversation-id <id>       Override the conversation id',
    '  --room-id <id>               Override the room id',
    '  --participant-id <id>        Override the participant id',
    '  --signaling-stream-id <id>   Override the signaling stream id',
    '  --device-id <id>             Override the IM realtime device id',
    '  --reuse-live-connection      Reuse one preconnected RTC WebSocket live connection',
  ].join('\n');
}

export function parseRtcCallSmokeArgs(argv) {
  const entries = parseOptionEntries(argv);
  const helpRequested = entries.help === true || entries.h === true;

  if (helpRequested) {
    return {
      help: true,
      ...DEFAULT_OPTIONS,
    };
  }

  return {
    help: false,
    appId: readStringOption(entries, 'app-id', DEFAULT_OPTIONS.appId),
    sessionId: readStringOption(entries, 'session-id', DEFAULT_OPTIONS.sessionId),
    conversationId: readStringOption(entries, 'conversation-id', DEFAULT_OPTIONS.conversationId),
    roomId: readStringOption(entries, 'room-id', DEFAULT_OPTIONS.roomId),
    participantId: readStringOption(entries, 'participant-id', DEFAULT_OPTIONS.participantId),
    signalingStreamId: readStringOption(
      entries,
      'signaling-stream-id',
      DEFAULT_OPTIONS.signalingStreamId,
    ),
    deviceId: readStringOption(entries, 'device-id', DEFAULT_OPTIONS.deviceId),
    reuseLiveConnection: entries['reuse-live-connection'] === true,
    json: entries.json === true,
  };
}

function createVolcengineSdkModule(runtimeCalls) {
  const engine = {
    async joinRoom(token, roomId, userInfo, roomConfig) {
      runtimeCalls.push(['joinRoom', token, roomId, userInfo, roomConfig]);
    },
    async leaveRoom(waitAck) {
      runtimeCalls.push(['leaveRoom', waitAck]);
    },
    async publishStream(mediaType) {
      runtimeCalls.push(['publishStream', mediaType]);
    },
    async unpublishStream(mediaType) {
      runtimeCalls.push(['unpublishStream', mediaType]);
    },
    async startVideoCapture(deviceId) {
      runtimeCalls.push(['startVideoCapture', deviceId]);
      return {};
    },
    async stopVideoCapture() {
      runtimeCalls.push(['stopVideoCapture']);
    },
    async startAudioCapture(deviceId) {
      runtimeCalls.push(['startAudioCapture', deviceId]);
      return {};
    },
    async stopAudioCapture() {
      runtimeCalls.push(['stopAudioCapture']);
    },
  };

  return {
    createEngine(appId, engineConfig) {
      runtimeCalls.push(['createEngine', appId, engineConfig]);
      return engine;
    },
    destroyEngine(engineInstance) {
      runtimeCalls.push(['destroyEngine', engineInstance === engine ? 'engine' : 'unknown']);
    },
  };
}

function createRtcSignalingClientStub(signalingCalls, config) {
  return {
    realtime: {
      async replaceSubscriptions(body) {
        signalingCalls.push(['replaceSubscriptions', body]);
        return {
          deviceId: body.deviceId ?? config.deviceId,
          items: body.items ?? [],
        };
      },
    },
    createSignalMessage(body) {
      signalingCalls.push(['createSignalMessage', body]);
      return {
        kind: 'signal',
        conversationId: body.conversationId,
        signalType: body.signalType,
        schemaRef: body.schemaRef,
        encoding: body.encoding,
        payload: body.payload,
        text: body.text,
      };
    },
    async send(message) {
      signalingCalls.push(['send', message]);
      return {
        messageId: 'signal-message-smoke',
      };
    },
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
      signalingCalls.push(['invite', String(rtcSessionId), body]);
      return {
        rtcSessionId: String(rtcSessionId),
        conversationId: config.conversationId,
        rtcMode: 'video_call',
        state: 'started',
        signalingStreamId: body.signalingStreamId,
      };
    },
    async acceptSession(rtcSessionId) {
      signalingCalls.push(['accept', String(rtcSessionId)]);
      return {
        rtcSessionId: String(rtcSessionId),
        conversationId: config.conversationId,
        rtcMode: 'video_call',
        state: 'accepted',
        signalingStreamId: config.signalingStreamId,
      };
    },
    async rejectSession(rtcSessionId) {
      signalingCalls.push(['reject', String(rtcSessionId)]);
      return {
        rtcSessionId: String(rtcSessionId),
        conversationId: config.conversationId,
        rtcMode: 'video_call',
        state: 'rejected',
        signalingStreamId: config.signalingStreamId,
      };
    },
    async endSession(rtcSessionId) {
      signalingCalls.push(['end', String(rtcSessionId)]);
      return {
        rtcSessionId: String(rtcSessionId),
        conversationId: config.conversationId,
        rtcMode: 'video_call',
        state: 'ended',
        signalingStreamId: config.signalingStreamId,
      };
    },
    async postJsonSignal(rtcSessionId, signalType, options) {
      signalingCalls.push(['postJsonSignal', String(rtcSessionId), signalType, options]);
      return {
        rtcSessionId: String(rtcSessionId),
        conversationId: config.conversationId,
        rtcMode: 'video_call',
        signalType,
        payload: JSON.stringify(options.payload),
        signalingStreamId: options.signalingStreamId,
        occurredAt: '2026-04-21T00:00:00.000Z',
      };
    },
    async issueParticipantCredential(rtcSessionId, body) {
      signalingCalls.push(['issueParticipantCredential', String(rtcSessionId), body]);
      return {
        rtcSessionId: String(rtcSessionId),
        participantId: body.participantId,
        credential: 'volc-token-smoke',
      };
    },
    async connect(options) {
      signalingCalls.push(['connect', options]);
      return {
        messages: {
          onConversation(conversationId) {
            signalingCalls.push(['onConversation', String(conversationId)]);
            return () => {
              signalingCalls.push(['unsubscribeConversation', String(conversationId)]);
            };
          },
        },
        signals: {
          onRtcSession(rtcSessionId) {
            signalingCalls.push(['onRtcSession', String(rtcSessionId)]);
            return () => {
              signalingCalls.push(['unsubscribeRtcSession', String(rtcSessionId)]);
            };
          },
        },
        disconnect() {
          signalingCalls.push(['disconnect']);
        },
      };
    },
  };
}

function createTextSummary(summary) {
  return [
    'SDKWork RTC TypeScript call smoke',
    `default provider: ${summary.defaultProviderKey}`,
    `selected provider: ${summary.selectedProviderKey}`,
    `media provider: ${summary.mediaProviderKey}`,
    `live connection mode: ${summary.reusedLiveConnection ? 'reused' : 'rtc-owned'}`,
    `signaling transport: ${summary.signalingTransport.transportTerm}`,
    `signaling auth mode: ${summary.signalingTransport.authMode}`,
    `signaling device id: ${summary.signalingTransport.deviceId}`,
    `signaling connectOptions.deviceId: ${summary.signalingTransport.connectOptionsDeviceId ?? 'n/a'}`,
    `signaling shared live connection: ${summary.signalingTransport.usesSharedLiveConnection}`,
    `signaling polling fallback: ${summary.signalingTransport.pollingFallbackTerm}`,
    `connect call count: ${summary.connectCallCount}`,
    `ended controller state: ${summary.endedControllerState}`,
    `closed controller state: ${summary.closedControllerState}`,
    `runtime calls: ${summary.runtimeCalls.map(([name]) => name).join(', ')}`,
    `signaling calls: ${summary.signalingCalls.map(([name]) => name).join(', ')}`,
    `event types: ${summary.eventTypes.join(', ')}`,
  ].join('\n');
}

export async function runRtcCallSmokeScenario(options = {}, deps = {}) {
  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  const runtimeCalls = [];
  const signalingCalls = [];
  const eventTypes = [];
  const snapshotStates = [];
  const loadSdk =
    deps.loadSdk
    ?? (() =>
      import(
        pathToFileURL(
          path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.js'),
        ).href
      ));
  const sdk = await loadSdk();
  const sdkModule = createVolcengineSdkModule(runtimeCalls);
  const driverManager = new sdk.RtcDriverManager({
    drivers: [
      sdk.createOfficialVolcengineWebRtcDriver({
        loadSdk: async () => sdkModule,
      }),
    ],
  });
  const rtcSignalingClient = createRtcSignalingClientStub(signalingCalls, config);
  const connectOptions = buildRtcCallSmokeConnectOptions({
    deviceId: config.deviceId,
  });
  const liveConnection =
    config.reuseLiveConnection
      ? await rtcSignalingClient.connect(
        buildRtcCallSmokeConnectOptions({
          deviceId: config.deviceId,
          conversationId: config.conversationId,
          includeConversationSubscriptions: true,
        }),
      )
      : undefined;

  const stack = await sdk.createStandardRtcCallControllerStack({
    transport: rtcSignalingClient,
    deviceId: config.deviceId,
    ...(liveConnection ? { liveConnection } : {}),
    connectOptions,
    watchConversationIds: [config.conversationId],
    driverManager,
    dataSourceConfig: {
      nativeConfig: {
        appId: config.appId,
        engineConfig: {
          env: 'sdk-call-smoke',
        },
      },
    },
  });

  const stopEventSubscription = stack.callController.onEvent((event) => {
    eventTypes.push(event.type);
  });
  const stopSnapshotSubscription = stack.callController.onSnapshot((snapshot) => {
    snapshotStates.push(snapshot.controllerState);
  });

  let endedSnapshot;
  try {
    await stack.callController.startOutgoing({
      rtcSessionId: config.sessionId,
      conversationId: config.conversationId,
      rtcMode: 'video_call',
      roomId: config.roomId,
      participantId: config.participantId,
      signalingStreamId: config.signalingStreamId,
      autoPublish: {
        audio: true,
        video: true,
      },
    });

    await stack.callController.sendOffer({
      sdp: 'offer-sdp-smoke',
    });
    await stack.callController.sendIceCandidate({
      candidate: 'candidate:1 1 udp 2122260223 10.0.0.2 55000 typ host',
    });

    endedSnapshot = await stack.callController.end();
  } finally {
    stopEventSubscription();
    stopSnapshotSubscription();
  }

  const selection = stack.dataSource.describeSelection();
  const signalingTransport = sdk.describeRtcSignalingTransport({
    deviceId: config.deviceId,
    connectOptions,
    ...(liveConnection ? { liveConnection } : {}),
  });
  const endedSummary = {
    defaultProviderKey: sdk.DEFAULT_RTC_PROVIDER_KEY,
    selectedProviderKey: selection.providerKey,
    mediaProviderKey: stack.mediaClient.metadata.providerKey,
    reusedLiveConnection: config.reuseLiveConnection,
    signalingTransport,
    connectCallCount: signalingCalls.filter(([name]) => name === 'connect').length,
    endedControllerState: endedSnapshot.controllerState,
    endedCallState: endedSnapshot.state,
    endedRtcSessionId: endedSnapshot.rtcSessionId,
    eventTypes: [...eventTypes],
    snapshotStates: [...snapshotStates],
    runtimeCalls: [...runtimeCalls],
    signalingCalls: [...signalingCalls],
  };

  await stack.close();

  return {
    ...endedSummary,
    closedControllerState: stack.callController.getSnapshot().controllerState,
    closedCallState: stack.callController.getSnapshot().state,
  };
}

export async function runRtcCallSmokeCli(argv = process.argv.slice(2), deps = {}) {
  const stdout = deps.stdout ?? process.stdout;
  const parsed = Array.isArray(argv) ? parseRtcCallSmokeArgs(argv) : argv;

  if (parsed.help) {
    writeLine(stdout, getRtcCallSmokeHelpText());
    return {
      help: true,
      exitCode: 0,
    };
  }

  const summary = await runRtcCallSmokeScenario(parsed, deps);

  if (parsed.json) {
    writeLine(stdout, JSON.stringify(summary, null, 2));
  } else {
    writeLine(stdout, createTextSummary(summary));
  }

  return {
    exitCode: 0,
    summary,
  };
}

const directInvocationPath = process.argv[1] ? fileURLToPath(import.meta.url) : null;

if (directInvocationPath && path.resolve(process.argv[1]) === directInvocationPath) {
  runRtcCallSmokeCli().catch((error) => {
    console.error(`[sdkwork-rtc-sdk-typescript] ${error.message}`);
    process.exit(1);
  });
}
