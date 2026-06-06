import { RtcSdkException } from './errors.js';
import type { RtcCloseable } from './types.js';
import type {
  RtcCallSignal,
  RtcCallSignalingAdapter,
} from './call-types.js';
import type { StandardRtcCallSession } from './call-session.js';
import {
  createRtcSignalingAdapter,
  RtcSignalingRealtimeDispatcher,
} from './signaling-adapter.js';
import {
  RTC_CALL_ACCEPTED_SIGNAL_TYPE,
  RTC_CALL_ANSWER_SIGNAL_TYPE,
  RTC_CALL_ENDED_SIGNAL_TYPE,
  RTC_CALL_ICE_CANDIDATE_SCHEMA_REF,
  RTC_CALL_ICE_CANDIDATE_SIGNAL_TYPE,
  RTC_CALL_INVITE_SCHEMA_REF,
  RTC_CALL_INVITE_SIGNAL_TYPE,
  RTC_CALL_LIFECYCLE_SCHEMA_REF,
  RTC_CALL_OFFER_SIGNAL_TYPE,
  RTC_CALL_REJECTED_SIGNAL_TYPE,
  RTC_CALL_SESSION_DESCRIPTION_SCHEMA_REF,
} from './call-controller-contract.js';
import type {
  RtcCallControllerDirection,
  RtcCallControllerState,
} from './call-controller-contract.js';
import type {
  CreateStandardRtcCallControllerOptions,
  RtcCallControllerAcceptOptions,
  RtcCallControllerEndOptions,
  RtcCallControllerEventHandler,
  RtcCallControllerOutgoingOptions,
  RtcCallControllerRejectOptions,
  RtcCallControllerSnapshot,
  RtcCallControllerSnapshotHandler,
  RtcCallIceCandidatePayload,
  RtcCallSessionDescriptionPayload,
} from './call-controller-models.js';
import {
  type RtcCallControllerSignalingTransportLike,
  publishRtcConversationSignal,
  toRtcIncomingCallInvitation,
} from './call-controller-message.js';
import {
  emitRtcCallControllerIncomingInvitation,
  emitRtcCallControllerSignal,
  emitRtcCallControllerSnapshot,
} from './call-controller-emission.js';
import {
  RtcCallControllerConversationSubscriptionManager,
  RtcCallControllerSessionSubscriptionManager,
} from './call-controller-subscription.js';
import {
  createRtcCallControllerAcceptedLifecyclePayload,
  createRtcCallControllerEndedLifecyclePayload,
  createRtcCallControllerOutgoingInvitationPayload,
  createRtcCallControllerRejectedLifecyclePayload,
  createRtcCallControllerSignalSendOptions,
  createRtcCallControllerTerminalSessionRecord,
} from './call-controller-lifecycle.js';
import {
  createRtcCallControllerSnapshot,
  hasRtcCallControllerActiveCall,
  resolveRtcCallControllerTerminalState,
  resolveRtcCallControllerWatchState,
} from './call-controller-state.js';

export class StandardRtcCallController<TNativeClient = unknown> implements RtcCloseable {
  readonly #transport: RtcCallControllerSignalingTransportLike;
  readonly #callSession: StandardRtcCallSession<TNativeClient>;
  readonly #signaling: RtcCallSignalingAdapter;
  readonly #realtimeDispatcher: RtcSignalingRealtimeDispatcher;
  readonly #sessionSubscriptionManager: RtcCallControllerSessionSubscriptionManager;
  readonly #conversationSubscriptionManager: RtcCallControllerConversationSubscriptionManager;
  readonly #eventHandlers = new Set<RtcCallControllerEventHandler>();
  readonly #snapshotHandlers = new Set<RtcCallControllerSnapshotHandler>();
  readonly #watchedConversationIds = new Set<string>();
  #controllerState: RtcCallControllerState = 'idle';
  #direction?: RtcCallControllerDirection;
  #activeInvitation?: import('./call-controller-models.js').RtcIncomingCallInvitation;
  #lastSignal?: RtcCallSignal;
  #lastError?: unknown;

  constructor(options: CreateStandardRtcCallControllerOptions<TNativeClient>) {
    this.#transport = options.transport as RtcCallControllerSignalingTransportLike;
    this.#callSession = options.callSession;
    this.#realtimeDispatcher =
      options.realtimeDispatcher
      ?? new RtcSignalingRealtimeDispatcher({
        transport: options.transport,
        deviceId: options.deviceId,
        liveConnection: options.liveConnection,
        connectOptions: options.connectOptions,
        reconnectIntervalMs: options.reconnectIntervalMs,
      });
    this.#signaling =
      options.signaling
      ?? createRtcSignalingAdapter({
        ...options,
        realtimeDispatcher: this.#realtimeDispatcher,
      });
    this.#sessionSubscriptionManager = new RtcCallControllerSessionSubscriptionManager({
      signaling: this.#signaling,
      onSignal: (signal) => this.#handleSessionSignal(signal),
    });
    this.#conversationSubscriptionManager =
      new RtcCallControllerConversationSubscriptionManager({
        realtimeDispatcher: this.#realtimeDispatcher,
        onMessage: (message, context) => this.#handleConversationMessage(message, context),
      });
    for (const conversationId of options.watchConversationIds ?? []) {
      this.#watchedConversationIds.add(String(conversationId));
    }
  }

  getSnapshot(): RtcCallControllerSnapshot {
    return this.#createSnapshot();
  }

  onEvent(handler: RtcCallControllerEventHandler): () => void {
    this.#eventHandlers.add(handler);
    return () => {
      this.#eventHandlers.delete(handler);
    };
  }

  onSnapshot(handler: RtcCallControllerSnapshotHandler): () => void {
    this.#snapshotHandlers.add(handler);
    return () => {
      this.#snapshotHandlers.delete(handler);
    };
  }

  async replaceWatchedConversations(
    conversationIds: readonly (string | number)[],
  ): Promise<RtcCallControllerSnapshot> {
    const nextConversationIds = new Set<string>();
    for (const conversationId of conversationIds) {
      nextConversationIds.add(String(conversationId));
    }

    await this.#reconnectInvitationWatch([...nextConversationIds]);
    this.#watchedConversationIds.clear();
    for (const conversationId of nextConversationIds) {
      this.#watchedConversationIds.add(conversationId);
    }
    this.#controllerState = resolveRtcCallControllerWatchState({
      watchedConversationCount: this.#watchedConversationIds.size,
      activeSessionId: this.#sessionSubscriptionManager.activeSessionId,
      controllerState: this.#controllerState,
    });
    return this.#emitSnapshot();
  }

  async startOutgoing(
    options: RtcCallControllerOutgoingOptions,
  ): Promise<RtcCallControllerSnapshot> {
    this.#ensureNoConflictingActiveCall(options.rtcSessionId);

    const sessionSnapshot = await this.#callSession.startOutgoing({
      ...options,
      subscribeSignals: false,
    });

    await this.#subscribeToSessionSignals(options.rtcSessionId);

    const invitation = createRtcCallControllerOutgoingInvitationPayload({
      options,
      sessionSnapshot,
      sentAt: new Date().toISOString(),
    });
    await this.#publishOutgoingInvitation(options, invitation);

    this.#direction = 'outgoing';
    this.#activeInvitation = undefined;
    this.#controllerState = 'outgoing_ringing';
    return this.#emitSnapshot();
  }

  async acceptIncoming(
    options: RtcCallControllerAcceptOptions,
  ): Promise<RtcCallControllerSnapshot> {
    this.#ensureNoConflictingActiveCall(options.rtcSessionId);
    await this.#subscribeToSessionSignals(options.rtcSessionId);
    this.#controllerState = 'connecting';
    this.#emitSnapshot();

    await this.#callSession.acceptIncoming({
      ...options,
      conversationId: options.conversationId ?? this.#activeInvitation?.conversationId,
      rtcMode: options.rtcMode ?? this.#activeInvitation?.rtcMode,
      roomId: options.roomId ?? this.#activeInvitation?.roomId,
      subscribeSignals: false,
    });

    await this.#signaling.sendSignal(
      options.rtcSessionId,
      RTC_CALL_ACCEPTED_SIGNAL_TYPE,
      createRtcCallControllerAcceptedLifecyclePayload({
        options,
        sessionSnapshot: this.#callSession.getSnapshot(),
        occurredAt: new Date().toISOString(),
      }),
      createRtcCallControllerSignalSendOptions({
        sessionSnapshot: this.#callSession.getSnapshot(),
        activeInvitation: this.#activeInvitation,
        schemaRef: RTC_CALL_LIFECYCLE_SCHEMA_REF,
      }),
    );

    this.#direction = 'incoming';
    this.#activeInvitation = undefined;
    this.#controllerState = 'connected';
    return this.#emitSnapshot();
  }

  async rejectIncoming(
    options: RtcCallControllerRejectOptions,
  ): Promise<RtcCallControllerSnapshot> {
    await this.#signaling.sendSignal(
      options.rtcSessionId,
      RTC_CALL_REJECTED_SIGNAL_TYPE,
      createRtcCallControllerRejectedLifecyclePayload({
        options,
        activeInvitation: this.#activeInvitation,
        occurredAt: new Date().toISOString(),
      }),
      createRtcCallControllerSignalSendOptions({
        sessionSnapshot: this.#callSession.getSnapshot(),
        activeInvitation: this.#activeInvitation,
        schemaRef: RTC_CALL_LIFECYCLE_SCHEMA_REF,
      }),
    );

    await this.#callSession.rejectIncoming(options);
    this.#direction = 'incoming';
    this.#activeInvitation = undefined;
    this.#controllerState = 'rejected';
    this.#sessionSubscriptionManager.clear();
    return this.#emitSnapshot();
  }

  async end(
    options: RtcCallControllerEndOptions = {},
  ): Promise<RtcCallControllerSnapshot> {
    const sessionSnapshot = this.#callSession.getSnapshot();
    const rtcSessionId = sessionSnapshot.rtcSessionId ?? this.#activeInvitation?.rtcSessionId;
    if (!rtcSessionId) {
      throw new RtcSdkException({
        code: 'call_state_invalid',
        message: 'RTC call controller has no active session to end.',
      });
    }

    await this.#signaling.sendSignal(
      rtcSessionId,
      RTC_CALL_ENDED_SIGNAL_TYPE,
      createRtcCallControllerEndedLifecyclePayload({
        rtcSessionId,
        options,
        sessionSnapshot,
        activeInvitation: this.#activeInvitation,
        occurredAt: new Date().toISOString(),
      }),
      createRtcCallControllerSignalSendOptions({
        sessionSnapshot,
        activeInvitation: this.#activeInvitation,
        schemaRef: RTC_CALL_LIFECYCLE_SCHEMA_REF,
      }),
    );

    await this.#callSession.end();
    this.#activeInvitation = undefined;
    this.#controllerState = 'ended';
    this.#sessionSubscriptionManager.clear();
    return this.#emitSnapshot();
  }

  async sendSignal(signalType: string, payload: unknown): Promise<RtcCallSignal> {
    const signal = await this.#callSession.sendSignal(signalType, payload);
    this.#lastSignal = signal;
    this.#emitSignal(signal);
    return signal;
  }

  sendOffer(payload: RtcCallSessionDescriptionPayload): Promise<RtcCallSignal> {
    return this.#sendTypedSignal(
      RTC_CALL_OFFER_SIGNAL_TYPE,
      payload,
      RTC_CALL_SESSION_DESCRIPTION_SCHEMA_REF,
    );
  }

  sendAnswer(payload: RtcCallSessionDescriptionPayload): Promise<RtcCallSignal> {
    return this.#sendTypedSignal(
      RTC_CALL_ANSWER_SIGNAL_TYPE,
      payload,
      RTC_CALL_SESSION_DESCRIPTION_SCHEMA_REF,
    );
  }

  sendIceCandidate(payload: RtcCallIceCandidatePayload): Promise<RtcCallSignal> {
    return this.#sendTypedSignal(
      RTC_CALL_ICE_CANDIDATE_SIGNAL_TYPE,
      payload,
      RTC_CALL_ICE_CANDIDATE_SCHEMA_REF,
    );
  }

  async close(): Promise<void> {
    this.#sessionSubscriptionManager.clear();
    this.#conversationSubscriptionManager.disconnect();
    await this.#callSession.close();
    this.#watchedConversationIds.clear();
    this.#controllerState = 'idle';
    this.#activeInvitation = undefined;
    this.#direction = undefined;
    this.#lastSignal = undefined;
    this.#lastError = undefined;
    this.#emitSnapshot();
  }

  async #subscribeToSessionSignals(rtcSessionId: string): Promise<void> {
    await this.#sessionSubscriptionManager.subscribe(rtcSessionId);
  }

  async #handleSessionSignal(signal: RtcCallSignal): Promise<void> {
    this.#lastSignal = signal;

    if (signal.signalType === RTC_CALL_ACCEPTED_SIGNAL_TYPE) {
      this.#controllerState = 'connected';
      this.#direction ??= 'outgoing';
    } else {
      const nextState = resolveRtcCallControllerTerminalState(signal.signalType);
      if (!nextState) {
        this.#emitSignal(signal);
        return;
      }

      await this.#callSession.leaveMedia();
      this.#callSession.reconcileSessionRecord(
        createRtcCallControllerTerminalSessionRecord({
          signal,
          nextState,
        }),
      );
      this.#controllerState = nextState;
      this.#activeInvitation = undefined;
      this.#sessionSubscriptionManager.clear();
    }

    this.#emitSignal(signal);
  }

  async #reconnectInvitationWatch(conversationIds: readonly string[]): Promise<void> {
    await this.#conversationSubscriptionManager.reconnect(conversationIds);
  }

  async #publishOutgoingInvitation(
    options: RtcCallControllerOutgoingOptions,
    invitation: import('./call-controller-models.js').RtcCallInvitePayload,
  ): Promise<void> {
    try {
      await publishRtcConversationSignal(this.#transport, options.conversationId, {
        signalType: RTC_CALL_INVITE_SIGNAL_TYPE,
        schemaRef: RTC_CALL_INVITE_SCHEMA_REF,
        text: options.invitationText ?? 'RTC call invite',
        payload: invitation,
      });
      return;
    } catch (error) {
      if (!(error instanceof RtcSdkException) || error.code !== 'signaling_not_available') {
        throw error;
      }
    }

    await this.#signaling.sendSignal(
      options.rtcSessionId,
      RTC_CALL_INVITE_SIGNAL_TYPE,
      invitation,
      createRtcCallControllerSignalSendOptions({
        sessionSnapshot: this.#callSession.getSnapshot(),
        schemaRef: RTC_CALL_INVITE_SCHEMA_REF,
      }),
    );
  }

  async #handleConversationMessage(
    message: unknown,
    context: import('./signaling-adapter.js').RtcSignalingLiveMessageContextLike,
  ): Promise<void> {
    const invitation = toRtcIncomingCallInvitation(message, context);
    if (!invitation) {
      return;
    }

    this.#ensureNoConflictingActiveCall(invitation.rtcSessionId);
    await this.#subscribeToSessionSignals(invitation.rtcSessionId);
    this.#direction = 'incoming';
    this.#activeInvitation = invitation;
    this.#controllerState = 'incoming_ringing';
    emitRtcCallControllerIncomingInvitation({
      invitation,
      snapshot: this.#createSnapshot(),
      eventHandlers: this.#eventHandlers,
      onError: (error) => {
        this.#lastError = error;
      },
    });
    this.#emitSnapshot();
  }

  async #sendTypedSignal(
    signalType: string,
    payload: unknown,
    schemaRef: string,
  ): Promise<RtcCallSignal> {
    const sessionSnapshot = this.#callSession.getSnapshot();
    const rtcSessionId = sessionSnapshot.rtcSessionId;
    if (!rtcSessionId) {
      throw new RtcSdkException({
        code: 'call_state_invalid',
        message: 'RTC call controller has no active session for signaling.',
      });
    }

    const signal = await this.#signaling.sendSignal(rtcSessionId, signalType, payload, {
      signalingStreamId: sessionSnapshot.signalingStreamId,
      schemaRef,
    });
    this.#lastSignal = signal;
    this.#emitSignal(signal);
    return signal;
  }

  #ensureNoConflictingActiveCall(nextRtcSessionId: string): void {
    const currentSnapshot = this.#callSession.getSnapshot();
    const currentRtcSessionId = currentSnapshot.rtcSessionId ?? this.#activeInvitation?.rtcSessionId;
    const hasActiveCall = hasRtcCallControllerActiveCall({
      currentRtcSessionId,
      controllerState: this.#controllerState,
    });

    if (hasActiveCall && currentRtcSessionId !== nextRtcSessionId) {
      throw new RtcSdkException({
        code: 'call_state_invalid',
        message: 'RTC call controller already has an active session.',
        details: {
          currentRtcSessionId,
          nextRtcSessionId,
        },
      });
    }
  }

  #createSnapshot(): RtcCallControllerSnapshot {
    return createRtcCallControllerSnapshot({
      sessionSnapshot: this.#callSession.getSnapshot(),
      controllerState: this.#controllerState,
      watchedConversationIds: [...this.#watchedConversationIds],
      direction: this.#direction,
      activeInvitation: this.#activeInvitation,
      lastSignal: this.#lastSignal,
      lastError: this.#lastError,
    });
  }

  #emitSnapshot(): RtcCallControllerSnapshot {
    return emitRtcCallControllerSnapshot({
      snapshot: this.#createSnapshot(),
      snapshotHandlers: this.#snapshotHandlers,
      eventHandlers: this.#eventHandlers,
      onError: (error) => {
        this.#lastError = error;
      },
    });
  }

  #emitSignal(signal: RtcCallSignal): void {
    emitRtcCallControllerSignal({
      signal,
      snapshot: this.#createSnapshot(),
      eventHandlers: this.#eventHandlers,
      onError: (error) => {
        this.#lastError = error;
      },
    });
  }
}

export async function createStandardRtcCallController<TNativeClient = unknown>(
  options: CreateStandardRtcCallControllerOptions<TNativeClient>,
): Promise<StandardRtcCallController<TNativeClient>> {
  const controller = new StandardRtcCallController(options);
  await controller.replaceWatchedConversations(options.watchConversationIds ?? []);
  return controller;
}
