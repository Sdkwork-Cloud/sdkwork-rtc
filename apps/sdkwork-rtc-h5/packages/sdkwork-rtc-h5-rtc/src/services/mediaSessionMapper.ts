import type { RtcMediaSession, RtcMediaParticipant } from "../types/appApi";

import {
  createRtcSessionDigest,
  evaluateRtcJoinReadiness,
  type SdkworkRtcJoinReadiness,
  type SdkworkRtcMediaSessionMode,
  type SdkworkRtcSession,
  type SdkworkRtcSessionDigest,
} from "../rtc";

export { evaluateRtcJoinReadiness, type SdkworkRtcJoinReadiness };

export function mapMediaSessionToRtcSession(
  session: RtcMediaSession,
  localParticipantId: string,
): SdkworkRtcSession {
  return {
    id: session.id,
    roomId: session.roomId,
    localParticipantId,
    mediaMode: session.mediaMode as SdkworkRtcMediaSessionMode,
    status: session.status,
    startedAt: session.startedAt,
    activeAt: session.connectedAt ?? session.startedAt,
    endedAt: session.endedAt,
    participants: (session.participants ?? []).map((participant: RtcMediaParticipant) => ({
      id: participant.id,
      name: participant.displayName ?? participant.id,
      role: participant.role === "listener" ? "listener" : participant.role,
      isLocal: participant.id === localParticipantId,
      audioMuted: participant.audioMuted,
      videoMuted: participant.videoMuted,
      joinedAt: participant.joinedAt,
    })),
  };
}

export function mapMediaSessionToDigest(session: RtcMediaSession): SdkworkRtcSessionDigest {
  return createRtcSessionDigest(mapMediaSessionToRtcSession(session, session.ownerUserId));
}

export function formatMediaSessionStatus(status: RtcMediaSession["status"]): string {
  switch (status) {
    case "preparing":
      return "Preparing";
    case "active":
      return "Active";
    case "closing":
      return "Closing";
    case "ended":
      return "Ended";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}
