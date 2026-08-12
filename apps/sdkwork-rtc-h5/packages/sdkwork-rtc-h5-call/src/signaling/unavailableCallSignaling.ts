import type {
  RtcCallParticipantCredential,
  RtcCallSessionInfo,
  RtcCallSignalingPort,
  RtcCallStartOptions,
  RtcCallWatchOptions,
} from "./rtcCallSignalingPort";

export class RtcCallUnavailableError extends Error {
  constructor(message = "Call signaling is not connected; calls cannot be started right now.") {
    super(message);
    this.name = "RtcCallUnavailableError";
  }
}

function rejectUnavailable(): Promise<never> {
  return Promise.reject(new RtcCallUnavailableError());
}

/**
 * Fail-closed default signaling port.
 *
 * Product requirement: the call surface must never simulate a connection or
 * show placeholder media. Without a real signaling implementation the page
 * renders the typed unavailable state; every mutation rejects and
 * `watchIncoming` resolves `null`.
 */
export function createUnavailableRtcCallSignaling(): RtcCallSignalingPort {
  return {
    startOutgoingCall(_options: RtcCallStartOptions): Promise<RtcCallSessionInfo> {
      return rejectUnavailable();
    },
    retrieve(): Promise<RtcCallSessionInfo> {
      return rejectUnavailable();
    },
    invite(): Promise<RtcCallSessionInfo> {
      return rejectUnavailable();
    },
    accept(): Promise<RtcCallSessionInfo> {
      return rejectUnavailable();
    },
    reject(): Promise<RtcCallSessionInfo> {
      return rejectUnavailable();
    },
    end(): Promise<RtcCallSessionInfo> {
      return rejectUnavailable();
    },
    issueParticipantCredential(): Promise<RtcCallParticipantCredential> {
      return rejectUnavailable();
    },
    watchIncoming(_options: RtcCallWatchOptions): Promise<RtcCallSessionInfo | null> {
      return Promise.resolve(null);
    },
    subscribe(): () => void {
      return () => undefined;
    },
  };
}
