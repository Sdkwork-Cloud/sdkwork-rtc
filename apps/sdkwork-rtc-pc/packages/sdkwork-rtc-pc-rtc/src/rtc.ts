export interface SdkworkAppCapabilityManifest {
  description: string;
  host?: string;
  id: string;
  packageNames: readonly string[];
  theme?: string;
  title: string;
}

export interface CreateSdkworkAppCapabilityManifestOptions
  extends Partial<Pick<SdkworkAppCapabilityManifest, "description" | "host" | "id" | "packageNames" | "theme" | "title">> {}

export function createSdkworkAppCapabilityManifest({
  description = "SDKWork capability package.",
  host,
  id = "sdkwork-capability",
  packageNames = [],
  theme,
  title = "SDKWork Capability",
}: CreateSdkworkAppCapabilityManifestOptions = {}): SdkworkAppCapabilityManifest {
  return {
    description,
    ...(host ? { host } : {}),
    id,
    packageNames: dedupePackages(packageNames),
    ...(theme ? { theme } : {}),
    title,
  };
}

export type SdkworkRtcMediaSessionMode = "audio" | "video" | "live";
export type SdkworkRtcConnectionStatus =
  | "degraded"
  | "offline"
  | "online"
  | "reconnecting";
export type SdkworkRtcSessionStatus =
  | "active"
  | "closing"
  | "ended"
  | "failed"
  | "preparing";
export type SdkworkRtcParticipantRole = "guest" | "host" | "listener";
export type SdkworkRtcSessionDigestStatus =
  | "closing"
  | "ended"
  | "issue"
  | "live"
  | "preparing";
export type SdkworkRtcParticipantDigestStatus =
  | "active-speaker"
  | "local"
  | "muted"
  | "present";
export type SdkworkRtcMediaPermissionState =
  | "denied"
  | "granted"
  | "prompt"
  | "unsupported";
export type SdkworkRtcJoinIssue =
  | "camera-denied"
  | "camera-missing"
  | "degraded-connection"
  | "microphone-denied"
  | "microphone-missing"
  | "offline"
  | "session-closing"
  | "session-ended"
  | "session-failed";

export interface SdkworkRtcParticipant {
  audioMuted?: boolean;
  id: string;
  isLocal?: boolean;
  joinedAt?: Date | number | string | null;
  name: string;
  role: SdkworkRtcParticipantRole;
  videoMuted?: boolean;
}

export interface SdkworkRtcSession {
  activeSpeakerId?: string;
  activeAt?: string;
  endedAt?: string;
  failureReason?: string;
  id: string;
  localParticipantId: string;
  mediaMode: SdkworkRtcMediaSessionMode;
  participants: readonly SdkworkRtcParticipant[];
  roomId: string;
  startedAt?: string;
  status: SdkworkRtcSessionStatus;
}

export interface CreateRtcSessionDigestOptions {
  activeSessionId?: string;
  latencyMs?: number;
  now?: Date | number | string;
  packetLossRate?: number;
}

export interface SdkworkRtcSessionDigest {
  activeSpeakerId?: string;
  activeAt?: string;
  digestStatus: SdkworkRtcSessionDigestStatus;
  durationSeconds?: number;
  endedAt?: string;
  id: string;
  isActive: boolean;
  mediaMode: SdkworkRtcMediaSessionMode;
  participantCount: number;
  qualityLabel?: SdkworkRtcQualityBadge["label"];
  roomId: string;
  startedAt?: string;
  status: SdkworkRtcSessionStatus;
  title: string;
}

export interface SdkworkRtcSessionDigestSummary {
  activeSessions: number;
  activeMediaSessions: number;
  closingSessions: number;
  endedSessions: number;
  issueSessions: number;
  latestStartedAt?: string;
  liveSessions: number;
  preparingSessions: number;
  totalParticipants: number;
  totalSessions: number;
  videoSessions: number;
}

export interface CreateRtcParticipantDigestOptions {
  activeSpeakerId?: string;
}

export interface SdkworkRtcParticipantDigest {
  audioMuted?: boolean;
  id: string;
  isActiveSpeaker: boolean;
  isLocal?: boolean;
  joinedAt?: Date | number | string | null;
  name: string;
  role: SdkworkRtcParticipantRole;
  status: SdkworkRtcParticipantDigestStatus;
  videoMuted?: boolean;
}

export interface SdkworkRtcParticipantDigestSummary {
  activeSpeakers: number;
  hostParticipants: number;
  localParticipants: number;
  mutedParticipants: number;
  totalParticipants: number;
  videoEnabledParticipants: number;
}

export interface SdkworkRtcPermissionSnapshot {
  camera?: SdkworkRtcMediaPermissionState;
  microphone?: SdkworkRtcMediaPermissionState;
}

export interface SdkworkRtcDeviceInventory {
  camera?: boolean;
  microphone?: boolean;
}

export interface EvaluateRtcJoinReadinessOptions {
  cameraRequired?: boolean;
  connectionStatus?: SdkworkRtcConnectionStatus;
  devices?: SdkworkRtcDeviceInventory;
  latencyMs?: number;
  packetLossRate?: number;
  permissions?: SdkworkRtcPermissionSnapshot;
}

export interface SdkworkRtcJoinCapabilities {
  canJoinSession: boolean;
  canUseCamera: boolean;
  canUseMicrophone: boolean;
}

export interface SdkworkRtcJoinReadiness {
  capabilities: SdkworkRtcJoinCapabilities;
  controlState: SdkworkRtcControlState;
  degraded: boolean;
  issues: SdkworkRtcJoinIssue[];
  qualityBadge?: SdkworkRtcQualityBadge;
  ready: boolean;
}

export type SdkworkRtcSessionEvent =
  | {
      startedAt: Date | number | string;
      type: "preparing";
    }
  | {
      participant: SdkworkRtcParticipant;
      type: "participant-joined";
    }
  | {
      participantId: string;
      type: "participant-left";
    }
  | {
      activeAt: Date | number | string;
      type: "active";
    }
  | {
      participantId?: string;
      type: "active-speaker";
    }
  | {
      type: "closing";
    }
  | {
      endedAt: Date | number | string;
      type: "ended";
    }
  | {
      endedAt: Date | number | string;
      reason: string;
      type: "failed";
    };

export interface SdkworkRtcControlState {
  canLeave: boolean;
  canMuteMicrophone: boolean;
  canShareScreen: boolean;
  canToggleCamera: boolean;
  reason?: "inactive-session";
}

export interface ResolveRtcQualityBadgeOptions {
  isReconnecting?: boolean;
  latencyMs: number;
  packetLossRate: number;
}

export interface SdkworkRtcQualityBadge {
  label: "Excellent" | "Good" | "Offline" | "Poor" | "Reconnecting";
  tone: "danger" | "success" | "warning";
}

export interface SdkworkRtcWorkspaceManifest extends SdkworkAppCapabilityManifest {
  capability: "rtc";
  launchMode: "floating-window" | "panel";
  routePath: string;
  sessionRoutePattern: string;
}

export interface SdkworkRtcMediaWorkspaceManifest extends SdkworkRtcWorkspaceManifest {}

export interface CreateRtcMediaWorkspaceManifestOptions
  extends Partial<
    Pick<CreateSdkworkAppCapabilityManifestOptions, "description" | "host" | "id" | "packageNames" | "theme" | "title">
  > {
  launchMode?: "floating-window" | "panel";
  routePath?: string;
}

export interface SdkworkRtcMediaSessionOpenIntent {
  focusWindow: boolean;
  route: string;
  sessionId: string;
  source: "media-session-list";
  type: "rtc-media-session-open-intent";
}

export interface CreateRtcMediaSessionOpenIntentOptions {
  basePath?: string;
  focusWindow?: boolean;
  sessionId: string;
}

function toTimestamp(value: Date | number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function toIsoString(value: Date | number | string): string {
  return new Date(value).toISOString();
}

function toRoundedDurationSeconds(
  startAt: Date | number | string | null | undefined,
  endAt: Date | number | string | null | undefined,
): number | undefined {
  const startedTimestamp = toTimestamp(startAt);
  const endedTimestamp = toTimestamp(endAt);

  if (startedTimestamp <= 0 || endedTimestamp <= 0 || endedTimestamp < startedTimestamp) {
    return undefined;
  }

  return Math.round((endedTimestamp - startedTimestamp) / 1000);
}

function roleWeight(role: SdkworkRtcParticipantRole): number {
  if (role === "host") {
    return 0;
  }

  if (role === "guest") {
    return 1;
  }

  return 2;
}

function dedupeParticipants(
  participants: readonly SdkworkRtcParticipant[],
): SdkworkRtcParticipant[] {
  const byId = new Map<string, SdkworkRtcParticipant>();

  for (const participant of participants) {
    byId.set(participant.id, participant);
  }

  return sortRtcParticipants(Array.from(byId.values()));
}

function dedupePackages(packageNames: readonly string[]): string[] {
  return Array.from(new Set(packageNames.map((packageName) => packageName.trim()).filter(Boolean)));
}

function toUniqueJoinIssues(issues: readonly SdkworkRtcJoinIssue[]): SdkworkRtcJoinIssue[] {
  const seen = new Set<SdkworkRtcJoinIssue>();
  const uniqueIssues: SdkworkRtcJoinIssue[] = [];

  for (const issue of issues) {
    if (seen.has(issue)) {
      continue;
    }

    seen.add(issue);
    uniqueIssues.push(issue);
  }

  return uniqueIssues;
}

function buildRtcSessionTitle(session: SdkworkRtcSession): string {
  const remoteParticipants = sortRtcParticipants(session.participants).filter(
    (participant) => !participant.isLocal && participant.id !== session.localParticipantId,
  );

  if (remoteParticipants.length > 0) {
    return remoteParticipants.map((participant) => participant.name).join(", ");
  }

  return session.roomId || session.id;
}

function resolveRtcSessionDurationSeconds(
  session: SdkworkRtcSession,
  now: Date | number | string | undefined,
): number | undefined {
  const startAt = session.activeAt ?? session.startedAt;

  if (!startAt) {
    return undefined;
  }

  if (session.status === "ended" || session.status === "failed") {
    return toRoundedDurationSeconds(startAt, session.endedAt);
  }

  return toRoundedDurationSeconds(startAt, now);
}

function resolveRtcSessionDigestStatus(
  session: SdkworkRtcSession,
  qualityBadge: SdkworkRtcQualityBadge | undefined,
): SdkworkRtcSessionDigestStatus {
  if (session.status === "failed") {
    return "issue";
  }

  if (session.status === "ended") {
    return "ended";
  }

  if (session.status === "closing") {
    return "closing";
  }

  if (
    session.status === "active" &&
    qualityBadge &&
    qualityBadge.label !== "Excellent" &&
    qualityBadge.label !== "Good"
  ) {
    return "issue";
  }

  if (session.status === "active") {
    return "live";
  }

  return "preparing";
}

function resolveRtcParticipantDigestStatus(
  participant: SdkworkRtcParticipant,
  activeSpeakerId: string | undefined,
): SdkworkRtcParticipantDigestStatus {
  if (participant.id === activeSpeakerId) {
    return "active-speaker";
  }

  if (participant.isLocal) {
    return "local";
  }

  if (participant.audioMuted || participant.videoMuted) {
    return "muted";
  }

  return "present";
}

function resolveRtcJoinQualityBadge(
  options: EvaluateRtcJoinReadinessOptions,
): SdkworkRtcQualityBadge | undefined {
  if (options.connectionStatus === "offline") {
    return {
      label: "Offline",
      tone: "danger",
    };
  }

  if (options.connectionStatus === "reconnecting") {
    return {
      label: "Reconnecting",
      tone: "warning",
    };
  }

  if (options.latencyMs === undefined || options.packetLossRate === undefined) {
    return undefined;
  }

  return resolveRtcQualityBadge({
    latencyMs: options.latencyMs,
    packetLossRate: options.packetLossRate,
  });
}

export function sortRtcParticipants(
  participants: readonly SdkworkRtcParticipant[],
): SdkworkRtcParticipant[] {
  return [...participants].sort((left, right) => {
    if (Boolean(left.isLocal) !== Boolean(right.isLocal)) {
      return Number(Boolean(right.isLocal)) - Number(Boolean(left.isLocal));
    }

    const roleDifference = roleWeight(left.role) - roleWeight(right.role);
    if (roleDifference !== 0) {
      return roleDifference;
    }

    const joinedDifference = toTimestamp(left.joinedAt) - toTimestamp(right.joinedAt);
    if (joinedDifference !== 0) {
      return joinedDifference;
    }

    return left.name.localeCompare(right.name);
  });
}

export function transitionRtcSession(
  session: SdkworkRtcSession,
  event: SdkworkRtcSessionEvent,
): SdkworkRtcSession {
  switch (event.type) {
    case "preparing":
      return {
        ...session,
        startedAt: toIsoString(event.startedAt),
        status: "preparing",
      };
    case "participant-joined":
      return {
        ...session,
        participants: dedupeParticipants([
          ...session.participants,
          event.participant,
        ]),
      };
    case "participant-left":
      return {
        ...session,
        activeSpeakerId:
          session.activeSpeakerId === event.participantId ? undefined : session.activeSpeakerId,
        participants: session.participants.filter((participant) => participant.id !== event.participantId),
      };
    case "active":
      return {
        ...session,
        activeAt: toIsoString(event.activeAt),
        status: "active",
      };
    case "active-speaker":
      return {
        ...session,
        activeSpeakerId: event.participantId,
      };
    case "closing":
      return {
        ...session,
        status: "closing",
      };
    case "ended":
      return {
        ...session,
        activeSpeakerId: undefined,
        endedAt: toIsoString(event.endedAt),
        status: "ended",
      };
    case "failed":
      return {
        ...session,
        activeSpeakerId: undefined,
        endedAt: toIsoString(event.endedAt),
        failureReason: event.reason,
        status: "failed",
      };
    default:
      return session;
  }
}

export function resolveRtcControlState(
  session: SdkworkRtcSession,
): SdkworkRtcControlState {
  const isActive = session.status === "active" || session.status === "preparing";

  if (!isActive) {
    return {
      canLeave: false,
      canMuteMicrophone: false,
      canShareScreen: false,
      canToggleCamera: false,
      reason: "inactive-session",
    };
  }

  return {
    canLeave: true,
    canMuteMicrophone: true,
    canShareScreen: session.status === "active",
    canToggleCamera: session.mediaMode === "video" || session.mediaMode === "live",
    reason: undefined,
  };
}

export function resolveRtcQualityBadge({
  isReconnecting,
  latencyMs,
  packetLossRate,
}: ResolveRtcQualityBadgeOptions): SdkworkRtcQualityBadge {
  if (isReconnecting) {
    return {
      label: "Reconnecting",
      tone: "warning",
    };
  }

  if (!Number.isFinite(latencyMs)) {
    return {
      label: "Offline",
      tone: "danger",
    };
  }

  if (latencyMs <= 120 && packetLossRate <= 0.02) {
    return {
      label: "Excellent",
      tone: "success",
    };
  }

  if (latencyMs <= 250 && packetLossRate <= 0.05) {
    return {
      label: "Good",
      tone: "success",
    };
  }

  return {
    label: "Poor",
    tone: "warning",
  };
}

export function createRtcSessionDigest(
  session: SdkworkRtcSession,
  options: CreateRtcSessionDigestOptions = {},
): SdkworkRtcSessionDigest {
  const qualityBadge =
    options.latencyMs !== undefined && options.packetLossRate !== undefined
      ? resolveRtcQualityBadge({
          latencyMs: options.latencyMs,
          packetLossRate: options.packetLossRate,
        })
      : undefined;
  const durationSeconds = resolveRtcSessionDurationSeconds(session, options.now);

  return {
    ...(session.activeSpeakerId ? { activeSpeakerId: session.activeSpeakerId } : {}),
    ...(session.activeAt ? { activeAt: session.activeAt } : {}),
    digestStatus: resolveRtcSessionDigestStatus(session, qualityBadge),
    ...(durationSeconds !== undefined ? { durationSeconds } : {}),
    ...(session.endedAt ? { endedAt: session.endedAt } : {}),
    id: session.id,
    isActive: session.id === options.activeSessionId,
    mediaMode: session.mediaMode,
    participantCount: session.participants.length,
    ...(qualityBadge ? { qualityLabel: qualityBadge.label } : {}),
    roomId: session.roomId,
    ...(session.startedAt ? { startedAt: session.startedAt } : {}),
    status: session.status,
    title: buildRtcSessionTitle(session),
  };
}

export function summarizeRtcSessionDigests(
  digests: readonly SdkworkRtcSessionDigest[],
): SdkworkRtcSessionDigestSummary {
  let activeSessions = 0;
  let activeMediaSessions = 0;
  let closingSessions = 0;
  let endedSessions = 0;
  let issueSessions = 0;
  let latestStartedAt = 0;
  let liveSessions = 0;
  let preparingSessions = 0;
  let totalParticipants = 0;
  let videoSessions = 0;

  for (const digest of digests) {
    totalParticipants += digest.participantCount;
    if (digest.isActive) {
      activeSessions += 1;
    }

    if (digest.mediaMode === "video") {
      videoSessions += 1;
    }

    if (digest.mediaMode === "live") {
      liveSessions += 1;
    }

    if (digest.status === "active") {
      activeMediaSessions += 1;
    }

    if (digest.status === "closing") {
      closingSessions += 1;
    }

    if (digest.status === "ended") {
      endedSessions += 1;
    }

    if (digest.status === "preparing") {
      preparingSessions += 1;
    }

    if (digest.digestStatus === "issue") {
      issueSessions += 1;
    }

    latestStartedAt = Math.max(latestStartedAt, toTimestamp(digest.startedAt));
  }

  return {
    activeSessions,
    activeMediaSessions,
    closingSessions,
    endedSessions,
    issueSessions,
    ...(latestStartedAt > 0 ? { latestStartedAt: new Date(latestStartedAt).toISOString() } : {}),
    liveSessions,
    preparingSessions,
    totalParticipants,
    totalSessions: digests.length,
    videoSessions,
  };
}

export function createRtcParticipantDigest(
  participant: SdkworkRtcParticipant,
  options: CreateRtcParticipantDigestOptions = {},
): SdkworkRtcParticipantDigest {
  return {
    ...(participant.audioMuted ? { audioMuted: true } : {}),
    id: participant.id,
    isActiveSpeaker: participant.id === options.activeSpeakerId,
    ...(participant.isLocal ? { isLocal: true } : {}),
    ...(participant.joinedAt !== undefined ? { joinedAt: participant.joinedAt } : {}),
    name: participant.name,
    role: participant.role,
    status: resolveRtcParticipantDigestStatus(participant, options.activeSpeakerId),
    ...(participant.videoMuted ? { videoMuted: true } : {}),
  };
}

export function summarizeRtcParticipantDigests(
  digests: readonly SdkworkRtcParticipantDigest[],
): SdkworkRtcParticipantDigestSummary {
  let activeSpeakers = 0;
  let hostParticipants = 0;
  let localParticipants = 0;
  let mutedParticipants = 0;
  let videoEnabledParticipants = 0;

  for (const digest of digests) {
    if (digest.isActiveSpeaker) {
      activeSpeakers += 1;
    }

    if (digest.role === "host") {
      hostParticipants += 1;
    }

    if (digest.isLocal) {
      localParticipants += 1;
    }

    if (digest.status === "muted") {
      mutedParticipants += 1;
    }

    if (!digest.videoMuted) {
      videoEnabledParticipants += 1;
    }
  }

  return {
    activeSpeakers,
    hostParticipants,
    localParticipants,
    mutedParticipants,
    totalParticipants: digests.length,
    videoEnabledParticipants,
  };
}

export function evaluateRtcJoinReadiness(
  session: SdkworkRtcSession,
  options: EvaluateRtcJoinReadinessOptions = {},
): SdkworkRtcJoinReadiness {
  const connectionStatus = options.connectionStatus ?? "online";
  const controlState = resolveRtcControlState(session);
  const isSessionClosing = session.status === "closing";
  const isSessionEnded = session.status === "ended";
  const isSessionFailed = session.status === "failed";
  const microphoneDenied = options.permissions?.microphone === "denied";
  const microphoneMissing = options.devices?.microphone === false;
  const cameraDenied = options.permissions?.camera === "denied";
  const cameraMissing = options.devices?.camera === false;
  const cameraRequired = options.cameraRequired === true;
  const usesVideoCapture = session.mediaMode === "video" || session.mediaMode === "live";
  const canUseMicrophone =
    !isSessionClosing &&
    !isSessionEnded &&
    !isSessionFailed &&
    connectionStatus !== "offline" &&
    !microphoneDenied &&
    !microphoneMissing;
  const canUseCamera =
    usesVideoCapture &&
    !isSessionClosing &&
    !isSessionEnded &&
    !isSessionFailed &&
    connectionStatus !== "offline" &&
    !cameraDenied &&
    !cameraMissing;
  const blockedByCamera = usesVideoCapture && cameraRequired && !canUseCamera;
  const capabilities: SdkworkRtcJoinCapabilities = {
    canJoinSession:
      !isSessionClosing &&
      !isSessionEnded &&
      !isSessionFailed &&
      connectionStatus !== "offline" &&
      canUseMicrophone &&
      !blockedByCamera,
    canUseCamera,
    canUseMicrophone,
  };
  const issues = toUniqueJoinIssues([
    ...(isSessionClosing ? ["session-closing" as const] : []),
    ...(isSessionEnded ? ["session-ended" as const] : []),
    ...(isSessionFailed ? ["session-failed" as const] : []),
    ...(connectionStatus === "offline" ? ["offline" as const] : []),
    ...((connectionStatus === "degraded" || connectionStatus === "reconnecting")
      ? ["degraded-connection" as const]
      : []),
    ...(microphoneDenied ? ["microphone-denied" as const] : []),
    ...(microphoneMissing ? ["microphone-missing" as const] : []),
    ...(cameraDenied ? ["camera-denied" as const] : []),
    ...(cameraMissing ? ["camera-missing" as const] : []),
  ]);
  const degraded =
    issues.includes("degraded-connection") ||
    (usesVideoCapture && !cameraRequired && (cameraDenied || cameraMissing));
  const qualityBadge = resolveRtcJoinQualityBadge(options);

  return {
    capabilities,
    controlState,
    degraded,
    issues,
    ...(qualityBadge ? { qualityBadge } : {}),
    ready: capabilities.canJoinSession,
  };
}

export function createRtcMediaWorkspaceManifest({
  description = "Realtime media workspace for audio, video, live streaming, and media-session routing.",
  host,
  id = "sdkwork-rtc",
  launchMode = "panel",
  packageNames = ["sdkwork-rtc-pc-rtc"],
  routePath = "/rtc/media-sessions",
  theme,
  title = "RTC Media",
}: CreateRtcMediaWorkspaceManifestOptions = {}): SdkworkRtcMediaWorkspaceManifest {
  return {
    ...createSdkworkAppCapabilityManifest({
      description,
      host,
      id,
      packageNames: dedupePackages(packageNames),
      theme,
      title,
    }),
    capability: "rtc",
    launchMode,
    routePath,
    sessionRoutePattern: `${routePath}/:sessionId`,
  };
}

export function createRtcMediaSessionOpenIntent({
  basePath = "/rtc/media-sessions",
  focusWindow = true,
  sessionId,
}: CreateRtcMediaSessionOpenIntentOptions): SdkworkRtcMediaSessionOpenIntent {
  return {
    focusWindow,
    route: `${basePath}/${sessionId}`,
    sessionId,
    source: "media-session-list",
    type: "rtc-media-session-open-intent",
  };
}

export const rtcPackageMeta = {
  architecture: "pc-react",
  domain: "communication",
  package: "sdkwork-rtc-pc-rtc",
  status: "ready",
} as const;

export type RtcPackageMeta = typeof rtcPackageMeta;
