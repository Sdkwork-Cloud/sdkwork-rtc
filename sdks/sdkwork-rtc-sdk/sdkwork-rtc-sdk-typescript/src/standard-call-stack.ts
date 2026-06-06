import type { RtcCallSignalingAdapter } from './call-types.js';
import { createBuiltinRtcDriverManagerInternal } from './builtin-driver-manager.js';
import { StandardRtcCallSession } from './call-session.js';
import {
  createStandardRtcCallController,
  type CreateStandardRtcCallControllerOptions,
  type StandardRtcCallController,
} from './call-controller.js';
import { RtcDataSource, type RtcDataSourceConfig } from './data-source.js';
import { RtcDriverManager } from './driver-manager.js';
import {
  createRtcSignalingAdapter,
  RtcSignalingRealtimeDispatcher,
  type RtcSignalingConnectOptions,
  type RtcSignalingLiveConnectionLike,
  type RtcSignalingTransportLike,
} from './signaling-adapter.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcClient } from './client.js';
import type { RtcCloseable } from './types.js';

export interface StandardRtcCallStack<TNativeClient = unknown> extends RtcCloseable {
  readonly driverManager: RtcDriverManager;
  readonly dataSource: RtcDataSource;
  readonly mediaClient: RtcClient<TNativeClient>;
  readonly signaling: RtcCallSignalingAdapter;
  readonly callSession: StandardRtcCallSession<TNativeClient>;
  readonly realtimeDispatcher: RtcSignalingRealtimeDispatcher;
}

export interface StandardRtcCallControllerStack<TNativeClient = unknown>
  extends StandardRtcCallStack<TNativeClient> {
  readonly callController: StandardRtcCallController<TNativeClient>;
}

export interface CreateStandardRtcCallStackOptions<TNativeClient = unknown> {
  transport?: RtcSignalingTransportLike;
  deviceId: string;
  liveConnection?: RtcSignalingLiveConnectionLike;
  connectOptions?: RtcSignalingConnectOptions;
  realtimeDispatcher?: RtcSignalingRealtimeDispatcher;
  reconnectIntervalMs?: number;
  driverManager?: RtcDriverManager;
  dataSourceConfig?: Omit<RtcDataSourceConfig, 'driverManager'>;
}

export interface CreateStandardRtcCallControllerStackOptions<TNativeClient = unknown>
  extends CreateStandardRtcCallStackOptions<TNativeClient> {
  watchConversationIds?: readonly (string | number)[];
}

export async function createStandardRtcCallStack<TNativeClient = unknown>(
  options: CreateStandardRtcCallStackOptions<TNativeClient>,
): Promise<StandardRtcCallStack<TNativeClient>> {
  const transport = requireRtcSignalingTransport(options.transport);
  const driverManager = options.driverManager ?? createBuiltinRtcDriverManagerInternal();
  const dataSource = new RtcDataSource({
    ...options.dataSourceConfig,
    driverManager,
  });
  const mediaClient = await dataSource.createClient<TNativeClient>();
  const realtimeDispatcher =
    options.realtimeDispatcher
    ?? new RtcSignalingRealtimeDispatcher({
      transport,
      deviceId: options.deviceId,
      liveConnection: options.liveConnection,
      connectOptions: options.connectOptions,
      reconnectIntervalMs: options.reconnectIntervalMs,
    });
  const signaling = createRtcSignalingAdapter({
    ...options,
    transport,
    realtimeDispatcher,
  });
  const callSession = new StandardRtcCallSession<TNativeClient>({
    mediaClient,
    signaling,
  });

  return freezeRtcRuntimeValue({
    driverManager,
    dataSource,
    mediaClient,
    signaling,
    callSession,
    realtimeDispatcher,
    async close() {
      await callSession.close();
    },
  });
}

function requireRtcSignalingTransport(
  transport: RtcSignalingTransportLike | undefined,
): RtcSignalingTransportLike {
  if (!transport) {
    throw new TypeError('createStandardRtcCallStack requires an RTC signaling transport.');
  }
  return transport;
}

export async function createStandardRtcCallControllerStack<TNativeClient = unknown>(
  options: CreateStandardRtcCallControllerStackOptions<TNativeClient>,
): Promise<StandardRtcCallControllerStack<TNativeClient>> {
  const transport = requireRtcSignalingTransport(options.transport);
  const rtcStack = await createStandardRtcCallStack<TNativeClient>(options);
  const callController = await createStandardRtcCallController<TNativeClient>({
    ...options,
    transport,
    callSession: rtcStack.callSession,
    signaling: rtcStack.signaling,
    realtimeDispatcher: rtcStack.realtimeDispatcher,
  } satisfies CreateStandardRtcCallControllerOptions<TNativeClient>);

  return freezeRtcRuntimeValue({
    ...rtcStack,
    callController,
    async close() {
      await callController.close();
    },
  });
}
