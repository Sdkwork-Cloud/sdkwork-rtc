import type {
  RtcCallSessionSnapshot,
  RtcCallSignal,
  RtcCallSignalingAdapter,
  RtcIncomingCallAcceptOptions,
  RtcIncomingCallRejectOptions,
  RtcOutgoingCallOptions,
} from './call-types.js';
import type { StandardRtcCallSession } from './call-session.js';
import type {
  RtcSignalingConnectOptions,
  RtcSignalingLiveConnectionLike,
  RtcSignalingRealtimeDispatcher,
  RtcSignalingTransportLike,
} from './signaling-adapter.js';
import type {
  RtcCallControllerDirection,
  RtcCallControllerState,
} from './call-controller-contract.js';

export interface RtcCallInvitePayload {
  rtcSessionId: string;
  conversationId: string;
  rtcMode: string;
  roomId?: string;
  signalingStreamId?: string;
  initiatorId?: string;
  initiatorDisplayName?: string;
  sentAt?: string;
  metadata?: Record<string, unknown>;
}

export interface RtcCallLifecyclePayload {
  rtcSessionId: string;
  conversationId?: string;
  rtcMode?: string;
  participantId?: string;
  reason?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}

export interface RtcCallSessionDescriptionPayload {
  sdp: string;
}

export interface RtcCallIceCandidatePayload {
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
}

export interface RtcIncomingCallInvitation extends RtcCallInvitePayload {
  occurredAt?: string;
}

export interface RtcCallControllerSnapshot extends RtcCallSessionSnapshot {
  controllerState: RtcCallControllerState;
  direction?: RtcCallControllerDirection;
  watchedConversationIds: readonly string[];
  activeInvitation?: RtcIncomingCallInvitation;
  lastSignal?: RtcCallSignal;
  lastError?: unknown;
}

export type RtcCallControllerEvent =
  | {
      type: 'snapshot';
      snapshot: RtcCallControllerSnapshot;
    }
  | {
      type: 'incoming_invitation';
      invitation: RtcIncomingCallInvitation;
      snapshot: RtcCallControllerSnapshot;
    }
  | {
      type: 'signal';
      signal: RtcCallSignal;
      snapshot: RtcCallControllerSnapshot;
    }
  | {
      type: 'error';
      error: unknown;
      snapshot: RtcCallControllerSnapshot;
    };

export type RtcCallControllerEventHandler = (event: RtcCallControllerEvent) => void;
export type RtcCallControllerSnapshotHandler = (
  snapshot: RtcCallControllerSnapshot,
) => void;

export interface RtcCallControllerOutgoingOptions extends RtcOutgoingCallOptions {
  conversationId: string;
  invitationText?: string;
  invitationMetadata?: Record<string, unknown>;
  initiatorDisplayName?: string;
}

export interface RtcCallControllerAcceptOptions extends RtcIncomingCallAcceptOptions {
  metadata?: Record<string, unknown>;
}

export interface RtcCallControllerRejectOptions extends RtcIncomingCallRejectOptions {
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface RtcCallControllerEndOptions {
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateStandardRtcCallControllerOptions<TNativeClient = unknown>
{
  transport: RtcSignalingTransportLike;
  deviceId: string;
  liveConnection?: RtcSignalingLiveConnectionLike;
  connectOptions?: RtcSignalingConnectOptions;
  realtimeDispatcher?: RtcSignalingRealtimeDispatcher;
  reconnectIntervalMs?: number;
  callSession: StandardRtcCallSession<TNativeClient>;
  signaling?: RtcCallSignalingAdapter;
  watchConversationIds?: readonly (string | number)[];
}
