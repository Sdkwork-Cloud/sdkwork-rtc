import type { RtcTrackKind, RtcSessionConnectionState } from './types.js';

export const RTC_CALL_TRACK_ID_SEPARATOR = '-';
export const DEFAULT_RTC_CALL_SUBSCRIBE_SIGNALS = true;

export function createRtcCallTrackId(
  rtcSessionId: string,
  kind: RtcTrackKind,
): string {
  return `${rtcSessionId}${RTC_CALL_TRACK_ID_SEPARATOR}${kind}`;
}

export type RtcCallState =
  | 'idle'
  | 'started'
  | 'accepted'
  | 'connected'
  | 'rejected'
  | 'ended';

export interface RtcCallSignal {
  rtcSessionId: string;
  conversationId?: string;
  rtcMode?: string;
  signalType: string;
  payload: unknown;
  rawPayload: string;
  senderId?: string;
  signalingStreamId?: string;
  occurredAt?: string;
}

export interface RtcCallParticipantCredential {
  rtcSessionId: string;
  participantId: string;
  credential: string;
  expiresAt?: string;
}

export interface RtcCallSessionRecord {
  rtcSessionId: string;
  conversationId?: string;
  rtcMode?: string;
  state: Extract<RtcCallState, 'started' | 'accepted' | 'rejected' | 'ended'>;
  signalingStreamId?: string;
  initiatorId?: string;
  providerPluginId?: string;
  providerSessionId?: string;
  accessEndpoint?: string;
  providerRegion?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface RtcCallSessionSnapshot {
  rtcSessionId?: string;
  conversationId?: string;
  rtcMode?: string;
  roomId?: string;
  participantId?: string;
  providerKey?: string;
  signalingStreamId?: string;
  providerPluginId?: string;
  providerSessionId?: string;
  accessEndpoint?: string;
  providerRegion?: string;
  startedAt?: string;
  endedAt?: string;
  state: RtcCallState;
  mediaConnectionState?: RtcSessionConnectionState;
}

export interface RtcCallAutoPublishOptions {
  audio?: boolean;
  video?: boolean;
}

export interface RtcCallSignalSendOptions {
  signalingStreamId?: string;
  schemaRef?: string;
}

export interface RtcOutgoingCallOptions {
  rtcSessionId: string;
  conversationId?: string;
  rtcMode: string;
  roomId?: string;
  participantId: string;
  signalingStreamId?: string;
  subscribeSignals?: boolean;
  autoPublish?: RtcCallAutoPublishOptions;
}

export interface RtcIncomingCallAcceptOptions {
  rtcSessionId: string;
  conversationId?: string;
  rtcMode?: string;
  roomId?: string;
  participantId: string;
  subscribeSignals?: boolean;
  autoPublish?: RtcCallAutoPublishOptions;
}

export interface RtcIncomingCallRejectOptions {
  rtcSessionId: string;
}

export interface RtcCallSignalSubscription {
  unsubscribe(): void;
}

export type RtcCallSignalHandler = (signal: RtcCallSignal) => void;

export interface RtcCallSignalingAdapter {
  createSession(request: {
    rtcSessionId: string;
    conversationId?: string;
    rtcMode: string;
  }): Promise<RtcCallSessionRecord> | RtcCallSessionRecord;
  inviteSession(
    rtcSessionId: string,
    request: {
      signalingStreamId?: string;
    },
  ): Promise<RtcCallSessionRecord> | RtcCallSessionRecord;
  acceptSession(
    rtcSessionId: string,
    request?: Record<string, never>,
  ): Promise<RtcCallSessionRecord> | RtcCallSessionRecord;
  rejectSession(
    rtcSessionId: string,
    request?: Record<string, never>,
  ): Promise<RtcCallSessionRecord> | RtcCallSessionRecord;
  endSession(
    rtcSessionId: string,
    request?: Record<string, never>,
  ): Promise<RtcCallSessionRecord> | RtcCallSessionRecord;
  sendSignal(
    rtcSessionId: string,
    signalType: string,
    payload: unknown,
    options?: RtcCallSignalSendOptions,
  ): Promise<RtcCallSignal> | RtcCallSignal;
  issueParticipantCredential(
    rtcSessionId: string,
    request: {
      participantId: string;
    },
  ): Promise<RtcCallParticipantCredential> | RtcCallParticipantCredential;
  subscribeSessionSignals(
    rtcSessionId: string,
    handler: RtcCallSignalHandler,
  ): Promise<RtcCallSignalSubscription> | RtcCallSignalSubscription;
}

export interface RtcCallTrackPublicationRequest {
  trackId: string;
  kind: Extract<RtcTrackKind, 'audio' | 'video'>;
}
