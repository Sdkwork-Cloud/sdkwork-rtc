import { RtcSdkException } from './errors.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcClient } from './client.js';
import type { RtcCloseable } from './types.js';
import type {
  RtcCallAutoPublishOptions,
  RtcCallSessionRecord,
  RtcCallSessionSnapshot,
  RtcCallSignal,
  RtcCallSignalHandler,
  RtcCallSignalingAdapter,
  RtcIncomingCallAcceptOptions,
  RtcIncomingCallRejectOptions,
  RtcOutgoingCallOptions,
} from './call-types.js';
import {
  createRtcCallTrackId,
  DEFAULT_RTC_CALL_SUBSCRIBE_SIGNALS,
} from './call-types.js';

export interface StandardRtcCallSessionOptions<TNativeClient = unknown> {
  mediaClient: RtcClient<TNativeClient>;
  signaling: RtcCallSignalingAdapter;
}

function createRtcCallSessionIdleSnapshot(): RtcCallSessionSnapshot {
  return {
    state: 'idle',
  };
}

export class StandardRtcCallSession<TNativeClient = unknown> implements RtcCloseable {
  readonly #mediaClient: RtcClient<TNativeClient>;
  readonly #signaling: RtcCallSignalingAdapter;
  readonly #signalHandlers = new Set<RtcCallSignalHandler>();
  #signalSubscription?: { unsubscribe(): void };
  #snapshot: RtcCallSessionSnapshot = createRtcCallSessionIdleSnapshot();

  constructor(options: StandardRtcCallSessionOptions<TNativeClient>) {
    this.#mediaClient = options.mediaClient;
    this.#signaling = options.signaling;
  }

  getSnapshot(): RtcCallSessionSnapshot {
    return freezeRtcRuntimeValue({
      ...this.#snapshot,
    });
  }

  onSignal(handler: RtcCallSignalHandler): () => void {
    this.#signalHandlers.add(handler);
    return () => {
      this.#signalHandlers.delete(handler);
    };
  }

  async startOutgoing(options: RtcOutgoingCallOptions): Promise<RtcCallSessionSnapshot> {
    if (options.subscribeSignals ?? DEFAULT_RTC_CALL_SUBSCRIBE_SIGNALS) {
      await this.#ensureSignalSubscription(options.rtcSessionId);
    }

    const createdSession = await this.#signaling.createSession({
      rtcSessionId: options.rtcSessionId,
      conversationId: options.conversationId,
      rtcMode: options.rtcMode,
    });
    this.#applySessionRecord(createdSession);

    const invitedSession = await this.#signaling.inviteSession(options.rtcSessionId, {
      signalingStreamId: options.signalingStreamId,
    });
    this.#applySessionRecord(invitedSession);

    return this.#connectMedia({
      rtcSessionId: options.rtcSessionId,
      conversationId: options.conversationId ?? invitedSession.conversationId,
      rtcMode: options.rtcMode,
      roomId: options.roomId ?? options.rtcSessionId,
      participantId: options.participantId,
      autoPublish: options.autoPublish,
    });
  }

  async acceptIncoming(
    options: RtcIncomingCallAcceptOptions,
  ): Promise<RtcCallSessionSnapshot> {
    if (options.subscribeSignals ?? DEFAULT_RTC_CALL_SUBSCRIBE_SIGNALS) {
      await this.#ensureSignalSubscription(options.rtcSessionId);
    }

    const acceptedSession = await this.#signaling.acceptSession(options.rtcSessionId);
    this.#applySessionRecord(acceptedSession);

    return this.#connectMedia({
      rtcSessionId: options.rtcSessionId,
      conversationId: options.conversationId ?? acceptedSession.conversationId,
      rtcMode: options.rtcMode ?? acceptedSession.rtcMode ?? 'video_call',
      roomId: options.roomId ?? options.rtcSessionId,
      participantId: options.participantId,
      autoPublish: options.autoPublish,
    });
  }

  async rejectIncoming(
    options: RtcIncomingCallRejectOptions,
  ): Promise<RtcCallSessionSnapshot> {
    const rejectedSession = await this.#signaling.rejectSession(options.rtcSessionId);
    this.#applySessionRecord(rejectedSession);
    this.#snapshot.state = 'rejected';
    return this.getSnapshot();
  }

  reconcileSessionRecord(record: RtcCallSessionRecord): RtcCallSessionSnapshot {
    this.#applySessionRecord(record);
    return this.getSnapshot();
  }

  async leaveMedia(): Promise<RtcCallSessionSnapshot> {
    if (this.#snapshot.mediaConnectionState !== 'joined') {
      return this.getSnapshot();
    }

    const mediaSession = await this.#mediaClient.leave();
    this.#snapshot = {
      ...this.#snapshot,
      providerKey: mediaSession.providerKey,
      mediaConnectionState: mediaSession.connectionState,
    };

    return this.getSnapshot();
  }

  async sendSignal(signalType: string, payload: unknown): Promise<RtcCallSignal> {
    const rtcSessionId = this.#requireSessionId();
    return this.#signaling.sendSignal(rtcSessionId, signalType, payload, {
      signalingStreamId: this.#snapshot.signalingStreamId,
    });
  }

  async end(): Promise<RtcCallSessionSnapshot> {
    const rtcSessionId = this.#requireSessionId();
    await this.leaveMedia();

    const endedSession = await this.#signaling.endSession(rtcSessionId);
    this.#applySessionRecord(endedSession);
    this.#snapshot.state = 'ended';
    this.#disposeSignalSubscription();
    return this.getSnapshot();
  }

  async close(): Promise<void> {
    try {
      if (this.#snapshot.mediaConnectionState === 'joined') {
        await this.#mediaClient.leave();
      }
    } finally {
      this.#disposeSignalSubscription();
      this.#signalHandlers.clear();
    }

    this.#resetSnapshot();
  }

  #requireSessionId(): string {
    if (!this.#snapshot.rtcSessionId) {
      throw new RtcSdkException({
        code: 'call_state_invalid',
        message: 'RTC call session is not initialized.',
        providerKey: this.#mediaClient.metadata.providerKey,
        pluginId: this.#mediaClient.metadata.pluginId,
      });
    }

    return this.#snapshot.rtcSessionId;
  }

  async #ensureSignalSubscription(rtcSessionId: string): Promise<void> {
    if (this.#signalSubscription) {
      return;
    }

    this.#signalSubscription = await this.#signaling.subscribeSessionSignals(
      rtcSessionId,
      (signal) => {
        for (const handler of this.#signalHandlers) {
          handler(signal);
        }
      },
    );
  }

  async #connectMedia(options: {
    rtcSessionId: string;
    conversationId?: string;
    rtcMode: string;
    roomId: string;
    participantId: string;
    autoPublish?: RtcCallAutoPublishOptions;
  }): Promise<RtcCallSessionSnapshot> {
    const credential = await this.#signaling.issueParticipantCredential(options.rtcSessionId, {
      participantId: options.participantId,
    });
    const joinedSession = await this.#mediaClient.join({
      sessionId: options.rtcSessionId,
      roomId: options.roomId,
      participantId: options.participantId,
      token: credential.credential,
      metadata: {
        rtcMode: options.rtcMode,
        conversationId: options.conversationId,
      },
    });

    this.#snapshot = {
      ...this.#snapshot,
      rtcSessionId: options.rtcSessionId,
      conversationId: options.conversationId,
      rtcMode: options.rtcMode,
      roomId: options.roomId,
      participantId: options.participantId,
      providerKey: joinedSession.providerKey,
      mediaConnectionState: joinedSession.connectionState,
      state: 'connected',
    };

    await this.#autoPublishTracks(options.rtcSessionId, options.autoPublish);
    return this.getSnapshot();
  }

  async #autoPublishTracks(
    rtcSessionId: string,
    autoPublish: RtcCallAutoPublishOptions | undefined,
  ): Promise<void> {
    if (autoPublish?.audio) {
      await this.#mediaClient.publish({
        trackId: createRtcCallTrackId(rtcSessionId, 'audio'),
        kind: 'audio',
        metadata: {
          source: 'auto-publish',
        },
      });
    }

    if (autoPublish?.video) {
      await this.#mediaClient.publish({
        trackId: createRtcCallTrackId(rtcSessionId, 'video'),
        kind: 'video',
        metadata: {
          source: 'auto-publish',
        },
      });
    }
  }

  #applySessionRecord(record: RtcCallSessionRecord): void {
    this.#snapshot = {
      ...this.#snapshot,
      rtcSessionId: record.rtcSessionId,
      conversationId: record.conversationId ?? this.#snapshot.conversationId,
      rtcMode: record.rtcMode ?? this.#snapshot.rtcMode,
      signalingStreamId: record.signalingStreamId ?? this.#snapshot.signalingStreamId,
      providerPluginId: record.providerPluginId,
      providerSessionId: record.providerSessionId,
      accessEndpoint: record.accessEndpoint,
      providerRegion: record.providerRegion,
      startedAt: record.startedAt ?? this.#snapshot.startedAt,
      endedAt: record.endedAt ?? this.#snapshot.endedAt,
      state: record.state,
    };
  }

  #disposeSignalSubscription(): void {
    if (!this.#signalSubscription) {
      return;
    }

    this.#signalSubscription.unsubscribe();
    this.#signalSubscription = undefined;
  }

  #resetSnapshot(): void {
    this.#snapshot = createRtcCallSessionIdleSnapshot();
  }
}
