/**
 * RtcCallSignalingPort — the signaling boundary of the RTC call surface.
 *
 * Per `docs/rtc-im-boundary.md` the RTC authority workspace must not depend on
 * `sdkwork-im` SDKs, APIs, or signaling tables. Call signaling (IM calls API +
 * WebSocket call workflow) therefore stays in `sdkwork-im`, and this package
 * defines the *pure* port the host application implements and injects.
 *
 * All types here are plain data (string-based identifiers, no framework or IM
 * imports) so any host — including the IM H5 app — can adapt its signaling
 * stack without coupling this package back to it.
 */

/** Raw service-level session state (started / ringing / accepted / ended / ...). */
export type RtcCallSessionState = string;

export interface RtcCallSessionInfo {
  rtcSessionId: string;
  conversationId?: string;
  initiatorId?: string;
  initiatorKind?: string;
  providerPluginId?: string;
  providerSessionId?: string;
  accessEndpoint?: string;
  providerRegion?: string;
  rtcMode?: string;
  state: RtcCallSessionState;
  signalingStreamId?: string;
  artifactMessageId?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface RtcCallParticipantCredential {
  tenantId: string;
  rtcSessionId: string;
  participantId: string;
  credential: string;
  expiresAt: string;
}

export interface RtcCallStartOptions {
  conversationId?: string;
  rtcMode: string;
  rtcSessionId: string;
  signalingStreamId?: string;
}

export interface RtcCallWatchOptions {
  conversationIds: string[];
  /** Opaque host connection handle; the port implementation casts it to its own type. */
  connection?: unknown;
  deviceId?: string;
  principalId: string;
}

export interface RtcCallSignalingPort {
  /** Creates the session and invites the peer (outgoing call). */
  startOutgoingCall(options: RtcCallStartOptions): Promise<RtcCallSessionInfo>;
  /** Reads the current session state (used for recovery after refresh). */
  retrieve(rtcSessionId: string): Promise<RtcCallSessionInfo>;
  /** Explicitly invites participants into an existing session. */
  invite(rtcSessionId: string, options?: { signalingStreamId?: string }): Promise<RtcCallSessionInfo>;
  accept(rtcSessionId: string): Promise<RtcCallSessionInfo>;
  reject(rtcSessionId: string): Promise<RtcCallSessionInfo>;
  end(rtcSessionId: string): Promise<RtcCallSessionInfo>;
  /**
   * Issues the media join token for a participant. The returned credential is
   * handed to the media service unchanged.
   */
  issueParticipantCredential(
    rtcSessionId: string,
    options: { participantId: string },
  ): Promise<RtcCallParticipantCredential>;
  /**
   * Polls for a single pending incoming session (host connection required).
   * Returns null when no incoming call is pending.
   */
  watchIncoming(options: RtcCallWatchOptions): Promise<RtcCallSessionInfo | null>;
  /** Subscribes to live session events (accepted / rejected / ended / ...). */
  subscribe(handler: (session: RtcCallSessionInfo) => void): () => void;
}

/**
 * Duck-typed detection of "session no longer exists" errors (HTTP 404). The
 * signaling adapter maps these to ended/rejected states instead of errors so a
 * call that was already cleaned up server-side never surfaces as a failure.
 */
export function isRtcCallSessionNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as Record<string, unknown>;
  if (record.httpStatus === 404 || record.code === "NOT_FOUND") {
    return true;
  }
  if (error instanceof Error) {
    return /not\s+found/iu.test(error.message) || error.name === "NotFoundError";
  }
  return false;
}
