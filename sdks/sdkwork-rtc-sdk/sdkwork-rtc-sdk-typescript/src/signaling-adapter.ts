import { RtcSdkException } from './errors.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import { describeRtcSignalingTransport } from './signaling-transport.js';
import type {
  RtcCallParticipantCredential,
  RtcCallSessionRecord,
  RtcCallSignal,
  RtcCallSignalHandler,
  RtcCallSignalSubscription,
  RtcCallSignalingAdapter,
} from './call-types.js';

const DEFAULT_RTC_IM_REALTIME_RECONNECT_INTERVAL_MS = 1000;
const DEFAULT_CONVERSATION_EVENT_TYPES = Object.freeze([
  'message.created',
  'message.updated',
  'message.recalled',
]);
const DEFAULT_RTC_SESSION_EVENT_TYPES = Object.freeze(['rtc.signal']);

export interface RtcSignalingSessionLike {
  rtcSessionId: string | number;
  conversationId?: string;
  rtcMode?: string;
  initiatorId?: string;
  providerPluginId?: string;
  providerSessionId?: string;
  accessEndpoint?: string;
  providerRegion?: string;
  state: 'started' | 'accepted' | 'rejected' | 'ended';
  signalingStreamId?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface RtcSignalingEventLike {
  rtcSessionId: string | number;
  conversationId?: string;
  rtcMode?: string;
  signalType: string;
  schemaRef?: string;
  payload: unknown;
  rawSignal?: {
    payload?: unknown;
  };
  sender?: {
    id?: string;
  };
  signalingStreamId?: string;
  occurredAt?: string;
}

export interface RtcSignalingParticipantCredentialLike {
  rtcSessionId: string | number;
  participantId: string | number;
  credential: string;
  expiresAt?: string;
}

export interface RtcSignalingLiveAckStateLike {
  ackedThroughSeq?: number;
  trimmedThroughSeq?: number;
}

export interface RtcSignalingLiveSignalContextLike {
  scopeId?: string | number;
  receivedAt?: string;
  ack?(): Promise<RtcSignalingLiveAckStateLike> | RtcSignalingLiveAckStateLike;
}

export interface RtcSignalingLiveSignalStreamLike {
  onRtcSession(
    rtcSessionId: string | number,
    handler: (
      signal: RtcSignalingEventLike,
      context: RtcSignalingLiveSignalContextLike,
    ) => void,
  ): () => void;
}

export interface RtcSignalingLiveMessageContextLike {
  conversationId?: string | number;
  scopeId?: string | number;
  receivedAt?: string;
  ack?(): Promise<RtcSignalingLiveAckStateLike> | RtcSignalingLiveAckStateLike;
}

export interface RtcSignalingDecodedConversationSignalMessageLike {
  type: 'signal';
  content: {
    signalType?: string;
    schemaRef?: string;
    payload?: unknown;
    rawPayload?: string;
    state?: string;
  };
}

export interface RtcSignalingLiveMessageStreamLike {
  onConversation(
    conversationId: string | number,
    handler: (
      message: RtcSignalingDecodedConversationSignalMessageLike | Record<string, unknown>,
      context: RtcSignalingLiveMessageContextLike,
    ) => void,
  ): () => void;
}

export interface RtcSignalingLiveLifecycleStateLike {
  status: 'connected' | 'error' | 'closed' | string;
}

export interface RtcSignalingLiveLifecycleStreamLike {
  onStateChange?(
    handler: (state: RtcSignalingLiveLifecycleStateLike) => void,
  ): () => void;
}

export interface RtcSignalingLiveConnectionLike {
  readonly signals: RtcSignalingLiveSignalStreamLike;
  readonly messages?: RtcSignalingLiveMessageStreamLike;
  readonly lifecycle?: RtcSignalingLiveLifecycleStreamLike;
  disconnect?(): void;
}

export interface RtcSignalingRealtimeSubscriptionItemLike {
  scopeType: string;
  scopeId: string;
  eventTypes?: readonly string[];
}

export type RtcSignalingWebSocketAuthMode =
  | 'automatic'
  | 'headerBearer'
  | 'queryBearer'
  | 'none';

export interface RtcSignalingWebSocketCredentialRequestLike {
  mode: Exclude<RtcSignalingWebSocketAuthMode, 'automatic'>;
  url: string;
  deviceId?: string;
  authToken?: string;
  headerName: string;
  queryParameterName: string;
  scheme: string;
}

export type RtcSignalingWebSocketCredentialProviderLike = (
  request: RtcSignalingWebSocketCredentialRequestLike,
) => string | undefined | Promise<string | undefined>;

export interface RtcSignalingWebSocketAuthOptionsLike {
  mode?: RtcSignalingWebSocketAuthMode;
  headerName?: string;
  queryParameterName?: string;
  scheme?: string;
  credentialProvider?: RtcSignalingWebSocketCredentialProviderLike;
}

export interface RtcSignalingConnectOptions {
  deviceId?: string;
  url?: string;
  headers?: Record<string, string>;
  protocols?: readonly string[];
  requestTimeoutMs?: number;
  socket?: unknown;
  webSocketAuth?: RtcSignalingWebSocketAuthOptionsLike;
  subscriptions?: {
    conversations?: readonly string[];
    rtcSessions?: readonly string[];
    items?: readonly RtcSignalingRealtimeSubscriptionItemLike[];
  };
}

export interface RtcSignalingTransportLike {
  createSession(body: {
    rtcSessionId: string;
    conversationId?: string;
    rtcMode: string;
  }): Promise<RtcSignalingSessionLike> | RtcSignalingSessionLike;
  inviteSession(
    rtcSessionId: string | number,
    body: {
      signalingStreamId?: string;
    },
  ): Promise<RtcSignalingSessionLike> | RtcSignalingSessionLike;
  acceptSession(
    rtcSessionId: string | number,
    body?: Record<string, never>,
  ): Promise<RtcSignalingSessionLike> | RtcSignalingSessionLike;
  rejectSession(
    rtcSessionId: string | number,
    body?: Record<string, never>,
  ): Promise<RtcSignalingSessionLike> | RtcSignalingSessionLike;
  endSession(
    rtcSessionId: string | number,
    body?: Record<string, never>,
  ): Promise<RtcSignalingSessionLike> | RtcSignalingSessionLike;
  postJsonSignal(
    rtcSessionId: string | number,
    signalType: string,
    options: {
      payload: unknown;
      signalingStreamId?: string;
      schemaRef?: string;
    },
  ): Promise<RtcSignalingEventLike> | RtcSignalingEventLike;
  issueParticipantCredential(
    rtcSessionId: string | number,
    body: {
      participantId: string;
    },
  ): Promise<RtcSignalingParticipantCredentialLike> | RtcSignalingParticipantCredentialLike;
  readonly realtime?: {
    replaceSubscriptions?(
      body: {
        deviceId?: string;
        items: readonly RtcSignalingRealtimeSubscriptionItemLike[];
      },
    ): Promise<unknown> | unknown;
  };
  connect?(
    options?: RtcSignalingConnectOptions,
  ): Promise<RtcSignalingLiveConnectionLike> | RtcSignalingLiveConnectionLike;
}

export type RtcSignalingConversationSignalHandler = (
  message: RtcSignalingDecodedConversationSignalMessageLike | Record<string, unknown>,
  context: RtcSignalingLiveMessageContextLike,
) => void | Promise<void>;

export interface CreateRtcSignalingAdapterOptions {
  transport: RtcSignalingTransportLike;
  deviceId: string;
  liveConnection?: RtcSignalingLiveConnectionLike;
  connectOptions?: RtcSignalingConnectOptions;
  realtimeDispatcher?: RtcSignalingRealtimeDispatcher;
  reconnectIntervalMs?: number;
}

function toSessionRecord(session: RtcSignalingSessionLike): RtcCallSessionRecord {
  return freezeRtcRuntimeValue({
    rtcSessionId: String(session.rtcSessionId),
    conversationId: session.conversationId,
    rtcMode: session.rtcMode,
    state: session.state,
    signalingStreamId: session.signalingStreamId,
    initiatorId: session.initiatorId,
    providerPluginId: session.providerPluginId,
    providerSessionId: session.providerSessionId,
    accessEndpoint: session.accessEndpoint,
    providerRegion: session.providerRegion,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
  });
}

function toParticipantCredential(
  credential: RtcSignalingParticipantCredentialLike,
): RtcCallParticipantCredential {
  return freezeRtcRuntimeValue({
    rtcSessionId: String(credential.rtcSessionId),
    participantId: String(credential.participantId),
    credential: credential.credential,
    expiresAt: credential.expiresAt,
  });
}

function parseStructuredPayload(payload: unknown): unknown {
  if (typeof payload !== 'string') {
    return payload;
  }

  const trimmed = payload.trim();
  if (!trimmed) {
    return payload;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return payload;
  }
}

function stringifySignalPayload(signal: RtcSignalingEventLike): string {
  const rawPayload = signal.rawSignal?.payload;
  if (typeof rawPayload === 'string') {
    return rawPayload;
  }

  if (typeof signal.payload === 'string') {
    return signal.payload;
  }

  try {
    return JSON.stringify(signal.payload);
  } catch {
    return String(signal.payload);
  }
}

function toSignal(signal: RtcSignalingEventLike): RtcCallSignal {
  const rawPayload = stringifySignalPayload(signal);
  return freezeRtcRuntimeValue({
    rtcSessionId: String(signal.rtcSessionId),
    conversationId: signal.conversationId,
    rtcMode: signal.rtcMode,
    signalType: signal.signalType,
    payload: parseStructuredPayload(signal.payload),
    rawPayload,
    senderId: signal.sender?.id,
    signalingStreamId: signal.signalingStreamId,
    occurredAt: signal.occurredAt,
  });
}

function hasRtcConversationSignalMessage(
  message: RtcSignalingDecodedConversationSignalMessageLike | Record<string, unknown>,
): boolean {
  return (
    Boolean(message)
    && typeof message === 'object'
    && !Array.isArray(message)
    && (message as { type?: unknown }).type === 'signal'
  );
}

function buildConversationSubscriptionItems(
  conversationIds: readonly string[],
): RtcSignalingRealtimeSubscriptionItemLike[] {
  return conversationIds.map((conversationId) => ({
    scopeType: 'conversation',
    scopeId: conversationId,
    eventTypes: DEFAULT_CONVERSATION_EVENT_TYPES,
  }));
}

function buildRtcSessionSubscriptionItems(
  rtcSessionIds: readonly string[],
): RtcSignalingRealtimeSubscriptionItemLike[] {
  return rtcSessionIds.map((rtcSessionId) => ({
    scopeType: 'rtc_session',
    scopeId: rtcSessionId,
    eventTypes: DEFAULT_RTC_SESSION_EVENT_TYPES,
  }));
}

function dedupeSubscriptionItems(
  items: readonly RtcSignalingRealtimeSubscriptionItemLike[],
): RtcSignalingRealtimeSubscriptionItemLike[] {
  const deduped = new Map<string, RtcSignalingRealtimeSubscriptionItemLike>();
  for (const item of items) {
    const eventTypesKey = [...(item.eventTypes ?? [])].join('|');
    const key = `${item.scopeType}:${item.scopeId}:${eventTypesKey}`;
    deduped.set(key, item);
  }
  return [...deduped.values()];
}

function toSortedScopeIds(scopeIds: Iterable<string>): string[] {
  return [...new Set(scopeIds)].sort();
}

function mergeScopeIds(
  baseline: readonly string[] | undefined,
  dynamicScopeIds: Iterable<string>,
): string[] {
  return toSortedScopeIds([...(baseline ?? []), ...dynamicScopeIds]);
}

function isReconnectableLiveState(status: string): boolean {
  return status === 'error' || status === 'closed';
}

function swallowAsyncError(task: Promise<unknown>): void {
  void task.catch(() => {});
}

export class RtcSignalingRealtimeDispatcher {
  readonly #transport: RtcSignalingTransportLike;
  readonly #deviceId: string;
  readonly #connectOptions?: RtcSignalingConnectOptions;
  readonly #providedLiveConnection?: RtcSignalingLiveConnectionLike;
  readonly #reconnectIntervalMs: number;
  readonly #sessionHandlersById = new Map<string, Set<RtcCallSignalHandler>>();
  readonly #conversationHandlersById = new Map<
    string,
    Set<RtcSignalingConversationSignalHandler>
  >();
  readonly #sessionUnsubscribers = new Map<string, () => void>();
  readonly #conversationUnsubscribers = new Map<string, () => void>();
  #liveConnection?: RtcSignalingLiveConnectionLike;
  #ownsLiveConnection = false;
  #lifecycleUnsubscribe?: () => void;
  #connectTask?: Promise<void>;
  #reconnectTimer?: ReturnType<typeof setTimeout>;
  #subscriptionRevision = 0;
  #appliedSubscriptionRevision = -1;

  constructor(options: Pick<
    CreateRtcSignalingAdapterOptions,
    'transport' | 'deviceId' | 'liveConnection' | 'connectOptions' | 'reconnectIntervalMs'
  >) {
    this.#transport = options.transport;
    this.#deviceId = describeRtcSignalingTransport({
      deviceId: options.deviceId,
      connectOptions: options.connectOptions,
      liveConnection: options.liveConnection,
    }).deviceId;
    this.#connectOptions = options.connectOptions;
    this.#providedLiveConnection = options.liveConnection;
    this.#reconnectIntervalMs =
      options.reconnectIntervalMs ?? DEFAULT_RTC_IM_REALTIME_RECONNECT_INTERVAL_MS;
  }

  async subscribeSessionSignals(
    rtcSessionId: string,
    handler: RtcCallSignalHandler,
  ): Promise<RtcCallSignalSubscription> {
    const normalizedRtcSessionId = String(rtcSessionId);
    const handlers = this.#sessionHandlersById.get(normalizedRtcSessionId) ?? new Set();
    handlers.add(handler);
    this.#sessionHandlersById.set(normalizedRtcSessionId, handlers);
    this.#markSubscriptionStateChanged();

    try {
      await this.#ensureLiveConnection();
      await this.#syncSubscriptionsIfNeeded();
      this.#ensureRtcSessionBinding(normalizedRtcSessionId);
    } catch (error) {
      this.#removeSessionHandler(normalizedRtcSessionId, handler);
      this.#disposeRtcSessionBindingIfUnused(normalizedRtcSessionId);
      this.#markSubscriptionStateChanged();
      swallowAsyncError(this.#syncSubscriptionsIfNeeded());
      this.#closeIfIdle();
      throw error;
    }

    return freezeRtcRuntimeValue({
      unsubscribe: () => {
        this.#removeSessionHandler(normalizedRtcSessionId, handler);
        this.#disposeRtcSessionBindingIfUnused(normalizedRtcSessionId);
        this.#markSubscriptionStateChanged();
        swallowAsyncError(this.#syncSubscriptionsIfNeeded());
        this.#closeIfIdle();
      },
    });
  }

  async subscribeConversationSignals(
    conversationId: string,
    handler: RtcSignalingConversationSignalHandler,
  ): Promise<RtcCallSignalSubscription> {
    const normalizedConversationId = String(conversationId);
    const handlers =
      this.#conversationHandlersById.get(normalizedConversationId) ?? new Set();
    handlers.add(handler);
    this.#conversationHandlersById.set(normalizedConversationId, handlers);
    this.#markSubscriptionStateChanged();

    try {
      await this.#ensureLiveConnection();
      await this.#syncSubscriptionsIfNeeded();
      this.#ensureConversationBinding(normalizedConversationId);
    } catch (error) {
      this.#removeConversationHandler(normalizedConversationId, handler);
      this.#disposeConversationBindingIfUnused(normalizedConversationId);
      this.#markSubscriptionStateChanged();
      swallowAsyncError(this.#syncSubscriptionsIfNeeded());
      this.#closeIfIdle();
      throw error;
    }

    return freezeRtcRuntimeValue({
      unsubscribe: () => {
        this.#removeConversationHandler(normalizedConversationId, handler);
        this.#disposeConversationBindingIfUnused(normalizedConversationId);
        this.#markSubscriptionStateChanged();
        swallowAsyncError(this.#syncSubscriptionsIfNeeded());
        this.#closeIfIdle();
      },
    });
  }

  async #ensureLiveConnection(): Promise<void> {
    if (!this.#hasSubscriptions()) {
      return;
    }

    if (this.#liveConnection) {
      return;
    }

    if (!this.#connectTask) {
      this.#connectTask = this.#connectLiveConnection();
    }

    await this.#connectTask;
  }

  async #connectLiveConnection(): Promise<void> {
    try {
      if (this.#providedLiveConnection) {
        this.#attachLiveConnection(this.#providedLiveConnection, false);
        this.#appliedSubscriptionRevision = -1;
        await this.#syncSubscriptionsIfNeeded();
        return;
      }

      if (typeof this.#transport.connect !== 'function') {
        throw new RtcSdkException({
          code: 'signaling_not_available',
          message:
            'RTC live signaling connection is not available. Provide transport.connect() or a liveConnection.',
        });
      }

      const requestedRevision = this.#subscriptionRevision;
      const liveConnection = await this.#transport.connect({
        ...this.#connectOptions,
        deviceId: this.#deviceId,
        subscriptions: this.#buildSubscriptionGroups(),
      });

      this.#attachLiveConnection(liveConnection, true);
      this.#appliedSubscriptionRevision = requestedRevision;
      await this.#syncSubscriptionsIfNeeded();
    } finally {
      this.#connectTask = undefined;
    }
  }

  #attachLiveConnection(
    liveConnection: RtcSignalingLiveConnectionLike,
    ownsLiveConnection: boolean,
  ): void {
    this.#tearDownLiveBindings(false);
    this.#liveConnection = liveConnection;
    this.#ownsLiveConnection = ownsLiveConnection;
    this.#lifecycleUnsubscribe = liveConnection.lifecycle?.onStateChange?.((state) => {
      if (!this.#ownsLiveConnection || !this.#hasSubscriptions()) {
        return;
      }

      if (!isReconnectableLiveState(state.status)) {
        return;
      }

      this.#tearDownLiveBindings(true);
      this.#scheduleReconnect();
    });
    this.#rebindScopeListeners();
  }

  #rebindScopeListeners(): void {
    for (const unsubscribe of this.#sessionUnsubscribers.values()) {
      unsubscribe();
    }
    this.#sessionUnsubscribers.clear();

    for (const unsubscribe of this.#conversationUnsubscribers.values()) {
      unsubscribe();
    }
    this.#conversationUnsubscribers.clear();

    for (const rtcSessionId of this.#sessionHandlersById.keys()) {
      this.#ensureRtcSessionBinding(rtcSessionId);
    }

    for (const conversationId of this.#conversationHandlersById.keys()) {
      this.#ensureConversationBinding(conversationId);
    }
  }

  #ensureRtcSessionBinding(rtcSessionId: string): void {
    if (this.#sessionUnsubscribers.has(rtcSessionId)) {
      return;
    }

    if (!this.#liveConnection) {
      return;
    }

    if (!this.#liveConnection.signals) {
      throw new RtcSdkException({
        code: 'signaling_not_available',
        message:
          'RTC live signaling connection is missing live.signals.onRtcSession(...) support.',
        details: {
          rtcSessionId,
        },
      });
    }

    const unsubscribe = this.#liveConnection.signals.onRtcSession(
      rtcSessionId,
      (signal, context) => {
        swallowAsyncError(this.#dispatchRtcSessionSignal(rtcSessionId, signal, context));
      },
    );
    this.#sessionUnsubscribers.set(rtcSessionId, unsubscribe);
  }

  #ensureConversationBinding(conversationId: string): void {
    if (this.#conversationUnsubscribers.has(conversationId)) {
      return;
    }

    if (!this.#liveConnection) {
      return;
    }

    if (!this.#liveConnection.messages) {
      throw new RtcSdkException({
        code: 'signaling_not_available',
        message:
          'RTC live invitation watch is missing live.messages.onConversation(...) support.',
        details: {
          conversationId,
        },
      });
    }

    const unsubscribe = this.#liveConnection.messages.onConversation(
      conversationId,
      (message, context) => {
        swallowAsyncError(
          this.#dispatchConversationSignal(conversationId, message, context),
        );
      },
    );
    this.#conversationUnsubscribers.set(conversationId, unsubscribe);
  }

  async #dispatchRtcSessionSignal(
    rtcSessionId: string,
    signal: RtcSignalingEventLike,
    context: RtcSignalingLiveSignalContextLike,
  ): Promise<void> {
    const handlers = [...(this.#sessionHandlersById.get(rtcSessionId) ?? [])];
    const normalizedSignal = toSignal(signal);

    try {
      for (const handler of handlers) {
        await handler(normalizedSignal);
      }
    } finally {
      if (typeof context.ack === 'function') {
        swallowAsyncError(Promise.resolve(context.ack()));
      }
    }
  }

  async #dispatchConversationSignal(
    conversationId: string,
    message: RtcSignalingDecodedConversationSignalMessageLike | Record<string, unknown>,
    context: RtcSignalingLiveMessageContextLike,
  ): Promise<void> {
    const handlers = [...(this.#conversationHandlersById.get(conversationId) ?? [])];
    const shouldAck = hasRtcConversationSignalMessage(message);

    try {
      for (const handler of handlers) {
        await handler(message, context);
      }
    } finally {
      if (shouldAck && typeof context.ack === 'function') {
        swallowAsyncError(Promise.resolve(context.ack()));
      }
    }
  }

  async #syncSubscriptions(): Promise<void> {
    if (typeof this.#transport.realtime?.replaceSubscriptions !== 'function') {
      this.#appliedSubscriptionRevision = this.#subscriptionRevision;
      return;
    }

    await this.#transport.realtime.replaceSubscriptions({
      deviceId: this.#deviceId,
      items: this.#buildSubscriptionItems(),
    });
    this.#appliedSubscriptionRevision = this.#subscriptionRevision;
  }

  async #syncSubscriptionsIfNeeded(): Promise<void> {
    if (
      !this.#liveConnection
      || this.#appliedSubscriptionRevision === this.#subscriptionRevision
    ) {
      return;
    }

    await this.#syncSubscriptions();
  }

  #buildSubscriptionGroups(): NonNullable<RtcSignalingConnectOptions['subscriptions']> {
    const conversations = mergeScopeIds(
      this.#connectOptions?.subscriptions?.conversations,
      this.#conversationHandlersById.keys(),
    );
    const rtcSessions = mergeScopeIds(
      this.#connectOptions?.subscriptions?.rtcSessions,
      this.#sessionHandlersById.keys(),
    );
    const items = this.#connectOptions?.subscriptions?.items;

    return {
      ...(conversations.length
        ? {
            conversations,
          }
        : {}),
      ...(rtcSessions.length
        ? {
            rtcSessions,
          }
        : {}),
      ...(items?.length
        ? {
            items,
          }
        : {}),
    };
  }

  #buildSubscriptionItems(): RtcSignalingRealtimeSubscriptionItemLike[] {
    const groups = this.#buildSubscriptionGroups();
    return dedupeSubscriptionItems([
      ...buildConversationSubscriptionItems(groups.conversations ?? []),
      ...buildRtcSessionSubscriptionItems(groups.rtcSessions ?? []),
      ...(groups.items ?? []),
    ]);
  }

  #markSubscriptionStateChanged(): void {
    this.#subscriptionRevision += 1;
  }

  #scheduleReconnect(): void {
    if (
      !this.#hasSubscriptions()
      || this.#providedLiveConnection
      || this.#connectTask
      || this.#reconnectTimer
    ) {
      return;
    }

    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = undefined;
      if (!this.#hasSubscriptions() || this.#liveConnection) {
        return;
      }
      swallowAsyncError(this.#ensureLiveConnection());
    }, this.#reconnectIntervalMs);
  }

  #closeIfIdle(): void {
    if (this.#hasSubscriptions()) {
      return;
    }

    if (this.#reconnectTimer) {
      clearTimeout(this.#reconnectTimer);
      this.#reconnectTimer = undefined;
    }

    this.#tearDownLiveBindings(true);
  }

  #tearDownLiveBindings(disconnectLiveConnection: boolean): void {
    for (const unsubscribe of this.#sessionUnsubscribers.values()) {
      unsubscribe();
    }
    this.#sessionUnsubscribers.clear();

    for (const unsubscribe of this.#conversationUnsubscribers.values()) {
      unsubscribe();
    }
    this.#conversationUnsubscribers.clear();

    this.#lifecycleUnsubscribe?.();
    this.#lifecycleUnsubscribe = undefined;

    const liveConnection = this.#liveConnection;
    const ownsLiveConnection = this.#ownsLiveConnection;
    this.#liveConnection = undefined;
    this.#ownsLiveConnection = false;

    if (disconnectLiveConnection && ownsLiveConnection) {
      liveConnection?.disconnect?.();
    }
  }

  #removeSessionHandler(rtcSessionId: string, handler: RtcCallSignalHandler): void {
    const handlers = this.#sessionHandlersById.get(rtcSessionId);
    if (!handlers) {
      return;
    }

    handlers.delete(handler);
    if (!handlers.size) {
      this.#sessionHandlersById.delete(rtcSessionId);
    }
  }

  #disposeRtcSessionBindingIfUnused(rtcSessionId: string): void {
    if (this.#sessionHandlersById.has(rtcSessionId)) {
      return;
    }

    const unsubscribe = this.#sessionUnsubscribers.get(rtcSessionId);
    unsubscribe?.();
    this.#sessionUnsubscribers.delete(rtcSessionId);
  }

  #removeConversationHandler(
    conversationId: string,
    handler: RtcSignalingConversationSignalHandler,
  ): void {
    const handlers = this.#conversationHandlersById.get(conversationId);
    if (!handlers) {
      return;
    }

    handlers.delete(handler);
    if (!handlers.size) {
      this.#conversationHandlersById.delete(conversationId);
    }
  }

  #disposeConversationBindingIfUnused(conversationId: string): void {
    if (this.#conversationHandlersById.has(conversationId)) {
      return;
    }

    const unsubscribe = this.#conversationUnsubscribers.get(conversationId);
    unsubscribe?.();
    this.#conversationUnsubscribers.delete(conversationId);
  }

  #hasSubscriptions(): boolean {
    return (
      this.#sessionHandlersById.size > 0 || this.#conversationHandlersById.size > 0
    );
  }
}

export function createRtcSignalingAdapter(
  options: CreateRtcSignalingAdapterOptions,
): RtcCallSignalingAdapter {
  const realtimeDispatcher =
    options.realtimeDispatcher
    ?? new RtcSignalingRealtimeDispatcher({
      transport: options.transport,
      deviceId: options.deviceId,
      liveConnection: options.liveConnection,
      connectOptions: options.connectOptions,
      reconnectIntervalMs: options.reconnectIntervalMs,
    });

  return freezeRtcRuntimeValue({
    async createSession(request) {
      return toSessionRecord(await options.transport.createSession(request));
    },
    async inviteSession(rtcSessionId, request) {
      return toSessionRecord(await options.transport.inviteSession(rtcSessionId, request));
    },
    async acceptSession(rtcSessionId, request = {}) {
      return toSessionRecord(await options.transport.acceptSession(rtcSessionId, request));
    },
    async rejectSession(rtcSessionId, request = {}) {
      return toSessionRecord(await options.transport.rejectSession(rtcSessionId, request));
    },
    async endSession(rtcSessionId, request = {}) {
      return toSessionRecord(await options.transport.endSession(rtcSessionId, request));
    },
    async sendSignal(rtcSessionId, signalType, payload, signalOptions = {}) {
      return toSignal(
        await options.transport.postJsonSignal(rtcSessionId, signalType, {
          payload,
          signalingStreamId: signalOptions.signalingStreamId,
          schemaRef: signalOptions.schemaRef,
        }),
      );
    },
    async issueParticipantCredential(rtcSessionId, request) {
      return toParticipantCredential(
        await options.transport.issueParticipantCredential(rtcSessionId, request),
      );
    },
    async subscribeSessionSignals(
      rtcSessionId: string,
      handler: RtcCallSignalHandler,
    ): Promise<RtcCallSignalSubscription> {
      return realtimeDispatcher.subscribeSessionSignals(rtcSessionId, handler);
    },
  });
}
