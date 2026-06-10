import { describe, expect, it } from "vitest";
import {
  createRtcParticipantDigest,
  createRtcMediaSessionOpenIntent,
  createRtcSessionDigest,
  createRtcMediaWorkspaceManifest,
  evaluateRtcJoinReadiness,
  resolveRtcControlState,
  resolveRtcQualityBadge,
  sortRtcParticipants,
  summarizeRtcParticipantDigests,
  summarizeRtcSessionDigests,
  transitionRtcSession,
  type SdkworkRtcParticipant,
  type SdkworkRtcSession,
} from "../src/index.ts";

const participants: SdkworkRtcParticipant[] = [
  {
    id: "guest-zara",
    isLocal: false,
    joinedAt: "2026-04-02T09:02:00.000Z",
    name: "Zara",
    role: "guest",
  },
  {
    id: "local-me",
    isLocal: true,
    joinedAt: "2026-04-02T09:03:00.000Z",
    name: "Me",
    role: "host",
  },
  {
    id: "host-ada",
    isLocal: false,
    joinedAt: "2026-04-02T09:01:00.000Z",
    name: "Ada",
    role: "host",
  },
];

const session: SdkworkRtcSession = {
  activeSpeakerId: "guest-zara",
  activeAt: "2026-04-02T09:00:20.000Z",
  id: "media-1",
  localParticipantId: "local-me",
  mediaMode: "video",
  participants: [
    {
      id: "local-me",
      isLocal: true,
      joinedAt: "2026-04-02T09:00:00.000Z",
      name: "Me",
      role: "host",
    },
    {
      audioMuted: true,
      id: "guest-zara",
      joinedAt: "2026-04-02T09:00:15.000Z",
      name: "Zara",
      role: "guest",
      videoMuted: true,
    },
  ],
  roomId: "room-1",
  startedAt: "2026-04-02T09:00:00.000Z",
  status: "active",
};

function requireParticipant(
  participant: SdkworkRtcParticipant | undefined,
): SdkworkRtcParticipant {
  if (!participant) {
    throw new Error("Expected RTC participant fixture to exist.");
  }
  return participant;
}

describe("sdkwork-rtc-pc-react", () => {
  it("transitions media session state across preparing, join, active, and active speaker updates", () => {
    const preparingSession = transitionRtcSession(session, {
      startedAt: "2026-04-02T09:00:00.000Z",
      type: "preparing",
    });
    const joinedSession = transitionRtcSession(preparingSession, {
      participant: {
        id: "guest-zara",
        isLocal: false,
        joinedAt: "2026-04-02T09:00:15.000Z",
        name: "Zara",
        role: "guest",
      },
      type: "participant-joined",
    });
    const activeSession = transitionRtcSession(joinedSession, {
      activeAt: "2026-04-02T09:00:20.000Z",
      type: "active",
    });
    const activeSpeakerSession = transitionRtcSession(activeSession, {
      participantId: "guest-zara",
      type: "active-speaker",
    });

    expect(activeSpeakerSession).toMatchObject({
      activeSpeakerId: "guest-zara",
      activeAt: "2026-04-02T09:00:20.000Z",
      participants: [expect.objectContaining({ id: "local-me" }), expect.objectContaining({ id: "guest-zara" })],
      startedAt: "2026-04-02T09:00:00.000Z",
      status: "active",
    });
  });

  it("sorts participants with local user first, then hosts, then join order", () => {
    expect(sortRtcParticipants(participants).map((participant) => participant.id)).toEqual([
      "local-me",
      "host-ada",
      "guest-zara",
    ]);
  });

  it("resolves control availability from session state and media mode", () => {
    expect(
      resolveRtcControlState({
        ...session,
        status: "active",
      }),
    ).toEqual({
      canLeave: true,
      canMuteMicrophone: true,
      canShareScreen: true,
      canToggleCamera: true,
      reason: undefined,
    });

    expect(
      resolveRtcControlState({
        ...session,
        mediaMode: "audio",
        status: "ended",
      }),
    ).toEqual({
      canLeave: false,
      canMuteMicrophone: false,
      canShareScreen: false,
      canToggleCamera: false,
      reason: "inactive-session",
    });
  });

  it("maps quality telemetry into desktop-friendly quality badges", () => {
    expect(
      resolveRtcQualityBadge({
        latencyMs: 72,
        packetLossRate: 0.01,
      }),
    ).toEqual({
      label: "Excellent",
      tone: "success",
    });

    expect(
      resolveRtcQualityBadge({
        isReconnecting: true,
        latencyMs: 420,
        packetLossRate: 0.11,
      }),
    ).toEqual({
      label: "Reconnecting",
      tone: "warning",
    });
  });

  it("creates session digests and summarizes queue-friendly RTC media collections", () => {
    const activeDigest = createRtcSessionDigest(session, {
      activeSessionId: "media-1",
      latencyMs: 72,
      now: "2026-04-02T09:05:20.000Z",
      packetLossRate: 0.01,
    });

    expect(activeDigest).toEqual({
      activeSpeakerId: "guest-zara",
      activeAt: "2026-04-02T09:00:20.000Z",
      digestStatus: "live",
      durationSeconds: 300,
      id: "media-1",
      isActive: true,
      mediaMode: "video",
      participantCount: 2,
      qualityLabel: "Excellent",
      roomId: "room-1",
      startedAt: "2026-04-02T09:00:00.000Z",
      status: "active",
      title: "Zara",
    });

    const preparingDigest = createRtcSessionDigest(
      {
        ...session,
        activeAt: undefined,
        id: "media-2",
        roomId: "room-2",
        startedAt: "2026-04-02T09:07:00.000Z",
        status: "preparing",
      },
      {
        latencyMs: 180,
        now: "2026-04-02T09:08:00.000Z",
        packetLossRate: 0.03,
      },
    );

    const failedDigest = createRtcSessionDigest(
      {
        ...session,
        activeSpeakerId: undefined,
        mediaMode: "audio",
        endedAt: "2026-04-02T09:09:00.000Z",
        failureReason: "ice-timeout",
        id: "media-3",
        roomId: "room-3",
        status: "failed",
      },
      {
        now: "2026-04-02T09:10:00.000Z",
      },
    );

    expect(
      summarizeRtcSessionDigests([activeDigest, preparingDigest, failedDigest]),
    ).toEqual({
      activeSessions: 1,
      activeMediaSessions: 1,
      closingSessions: 0,
      endedSessions: 0,
      issueSessions: 1,
      latestStartedAt: "2026-04-02T09:07:00.000Z",
      preparingSessions: 1,
      totalParticipants: 6,
      totalSessions: 3,
      liveSessions: 0,
      videoSessions: 2,
    });
  });

  it("treats live sessions as first-class RTC sessions with camera and summary support", () => {
    const liveSession: SdkworkRtcSession = {
      ...session,
      mediaMode: "live",
      id: "live-1",
      status: "active",
    };
    const liveDigest = createRtcSessionDigest(liveSession, {
      activeSessionId: "live-1",
      now: "2026-04-02T09:10:20.000Z",
    });

    expect(resolveRtcControlState(liveSession)).toMatchObject({
      canShareScreen: true,
      canToggleCamera: true,
    });
    expect(
      evaluateRtcJoinReadiness(liveSession, {
        cameraRequired: true,
        devices: {
          camera: true,
          microphone: true,
        },
        permissions: {
          camera: "granted",
          microphone: "granted",
        },
      }),
    ).toMatchObject({
      ready: true,
      capabilities: {
        canUseCamera: true,
      },
    });
    expect(summarizeRtcSessionDigests([liveDigest])).toMatchObject({
      liveSessions: 1,
      videoSessions: 0,
    });
  });

  it("creates participant digests and summarizes roster state for floating media surfaces", () => {
    const localParticipant = requireParticipant(session.participants[0]);
    const remoteParticipant = requireParticipant(session.participants[1]);

    const roster = [
      localParticipant,
      remoteParticipant,
      {
        id: "host-ada",
        joinedAt: "2026-04-02T09:00:12.000Z",
        name: "Ada",
        role: "host",
      },
    ] satisfies SdkworkRtcParticipant[];

    expect(
      createRtcParticipantDigest(remoteParticipant, {
        activeSpeakerId: "host-ada",
      }),
    ).toEqual({
      audioMuted: true,
      id: "guest-zara",
      isActiveSpeaker: false,
      joinedAt: "2026-04-02T09:00:15.000Z",
      name: "Zara",
      role: "guest",
      status: "muted",
      videoMuted: true,
    });

    expect(
      summarizeRtcParticipantDigests(
        roster.map((participant) =>
          createRtcParticipantDigest(participant, {
            activeSpeakerId: "host-ada",
          }),
        ),
      ),
    ).toEqual({
      activeSpeakers: 1,
      hostParticipants: 2,
      localParticipants: 1,
      mutedParticipants: 1,
      totalParticipants: 3,
      videoEnabledParticipants: 2,
    });
  });

  it("evaluates join readiness from device inventory, permission state, and connection health", () => {
    expect(
      evaluateRtcJoinReadiness(
        {
          ...session,
          activeAt: undefined,
          status: "preparing",
        },
        {
          connectionStatus: "online",
          devices: {
            camera: true,
            microphone: true,
          },
          latencyMs: 88,
          packetLossRate: 0.02,
          permissions: {
            camera: "granted",
            microphone: "granted",
          },
        },
      ),
    ).toEqual({
      capabilities: {
        canJoinSession: true,
        canUseCamera: true,
        canUseMicrophone: true,
      },
      controlState: {
        canLeave: true,
        canMuteMicrophone: true,
        canShareScreen: false,
        canToggleCamera: true,
        reason: undefined,
      },
      degraded: false,
      issues: [],
      qualityBadge: {
        label: "Excellent",
        tone: "success",
      },
      ready: true,
    });

    expect(
      evaluateRtcJoinReadiness(session, {
        cameraRequired: false,
        connectionStatus: "degraded",
        devices: {
          camera: false,
          microphone: true,
        },
        latencyMs: 320,
        packetLossRate: 0.08,
        permissions: {
          camera: "denied",
          microphone: "granted",
        },
      }),
    ).toEqual({
      capabilities: {
        canJoinSession: true,
        canUseCamera: false,
        canUseMicrophone: true,
      },
      controlState: {
        canLeave: true,
        canMuteMicrophone: true,
        canShareScreen: true,
        canToggleCamera: true,
        reason: undefined,
      },
      degraded: true,
      issues: ["degraded-connection", "camera-denied", "camera-missing"],
      qualityBadge: {
        label: "Poor",
        tone: "warning",
      },
      ready: true,
    });

    expect(
      evaluateRtcJoinReadiness(
        {
          ...session,
          endedAt: "2026-04-02T09:03:00.000Z",
          status: "ended",
        },
        {
          connectionStatus: "offline",
          devices: {
            microphone: false,
          },
          permissions: {
            microphone: "denied",
          },
        },
      ),
    ).toEqual({
      capabilities: {
        canJoinSession: false,
        canUseCamera: false,
        canUseMicrophone: false,
      },
      controlState: {
        canLeave: false,
        canMuteMicrophone: false,
        canShareScreen: false,
        canToggleCamera: false,
        reason: "inactive-session",
      },
      degraded: false,
      issues: ["session-ended", "offline", "microphone-denied", "microphone-missing"],
      qualityBadge: {
        label: "Offline",
        tone: "danger",
      },
      ready: false,
    });
  });

  it("creates an RTC media workspace manifest and media session open intent for desktop shells", () => {
    const manifest = createRtcMediaWorkspaceManifest({
      launchMode: "floating-window",
      packageNames: ["@sdkwork/rtc-pc-react", "@sdkwork/notification-pc-react"],
      title: "RTC Media",
    });

    expect(manifest).toMatchObject({
      capability: "rtc",
      launchMode: "floating-window",
      routePath: "/rtc/media-sessions",
      sessionRoutePattern: "/rtc/media-sessions/:sessionId",
      title: "RTC Media",
    });
    expect(manifest.packageNames).toEqual([
      "@sdkwork/rtc-pc-react",
      "@sdkwork/notification-pc-react",
    ]);

    expect(
      createRtcMediaSessionOpenIntent({
        sessionId: "media-1",
      }),
    ).toEqual({
      focusWindow: true,
      route: "/rtc/media-sessions/media-1",
      sessionId: "media-1",
      source: "media-session-list",
      type: "rtc-media-session-open-intent",
    });
  });
});
