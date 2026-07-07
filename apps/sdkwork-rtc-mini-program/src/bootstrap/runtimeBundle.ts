import { installWeixinFetch } from "@sdkwork/rtc-mp-host";
import { createMiniProgramRtcMediaRuntime } from "@sdkwork/rtc-mp-rtc";

import { bootstrap } from "./iamRuntime";
import { createAppServices } from "./appServices";
import { buildAppbaseLoginUrl } from "@sdkwork/rtc-mp-core";
import { resolveEnvironment, saveRuntimeEnvironment } from "./environment";

let mediaRuntimePromise: ReturnType<typeof createMiniProgramRtcMediaRuntime> | null = null;

async function getMediaRuntime() {
  if (!mediaRuntimePromise) {
    mediaRuntimePromise = createMiniProgramRtcMediaRuntime();
  }
  return mediaRuntimePromise;
}

function getServices() {
  return createAppServices();
}

function mapSessionSummary(session: {
  id: string;
  roomId: string;
  status?: string;
  mediaMode?: string;
}) {
  return {
    id: session.id,
    title: session.roomId || session.id,
    status: session.status ?? "unknown",
    mediaMode: session.mediaMode ?? "video",
  };
}

export function bootstrapRtcMiniProgram(query: Record<string, string | undefined> = {}) {
  installWeixinFetch();
  bootstrap(query);
}

export async function listMediaSessions(params?: { cursor?: string }) {
  const result = await getServices().mediaSessions.list({ cursor: params?.cursor });
  return {
    items: result.items.map(mapSessionSummary),
    nextCursor: result.nextCursor,
  };
}

export async function createMediaSession(input: {
  roomId: string;
  mediaMode: "audio" | "video" | "live";
}) {
  const created = await getServices().mediaSessions.create({
    roomId: input.roomId.trim(),
    mediaMode: input.mediaMode,
  });
  return mapSessionSummary(created);
}

export async function getMediaSession(sessionId: string) {
  const session = await getServices().mediaSessions.get(sessionId);
  const profiles = await getServices().providerProfiles.listActive();
  const providerAppId = getServices().providerProfiles.resolveDefaultProviderAppId(profiles);
  return {
    ...mapSessionSummary(session),
    roomId: session.roomId,
    participantCount: session.participantCount ?? session.participants?.length ?? 0,
    providerAppId: providerAppId ?? null,
  };
}

export async function issueJoinCredential(sessionId: string, participantId: string) {
  const credential = await getServices().participantCredentials.issue(
    sessionId,
    participantId.trim(),
    "join",
  );
  const session = await getServices().mediaSessions.get(sessionId);
  const profiles = await getServices().providerProfiles.listActive();
  const providerAppId = getServices().providerProfiles.resolveDefaultProviderAppId(profiles);
  if (!providerAppId) {
    throw new Error("No active provider profile with providerAppId is available.");
  }
  return {
    credential,
    providerAppId,
    roomId: session.roomId,
    mediaMode: session.mediaMode,
  };
}

export async function joinMediaSession(sessionId: string, participantId: string) {
  const issued = await issueJoinCredential(sessionId, participantId);
  const runtime = await getMediaRuntime();
  const viewState = await runtime.join({
    appId: issued.providerAppId,
    sessionId,
    roomId: issued.roomId,
    participantId: participantId.trim(),
    token: issued.credential,
  });
  return {
    ...viewState,
    credential: issued.credential,
    providerAppId: issued.providerAppId,
    roomId: issued.roomId,
  };
}

export async function leaveMediaSession() {
  const runtime = await getMediaRuntime();
  await runtime.leave();
}

export function getMediaSessionRoomViewState() {
  if (!mediaRuntimePromise) {
    return Promise.resolve({
      connected: false,
      pushUrl: "",
      remoteStreams: [],
      message: "RTC media runtime has not been initialized.",
    });
  }
  return mediaRuntimePromise.then((runtime) => runtime.getViewState());
}

export async function subscribeMediaSessionRoomViewState(
  listener: (state: {
    connected: boolean;
    pushUrl: string;
    remoteStreams: Array<{ id: string; uid: string; url: string; screen: boolean }>;
    message: string;
  }) => void,
) {
  const runtime = await getMediaRuntime();
  return runtime.subscribeViewState(listener);
}

export async function reportMediaPusherStateChange(code: number, message: string) {
  const runtime = await getMediaRuntime();
  runtime.reportPusherStateChange(code, message);
}

export async function reportMediaPusherNetStatusChange(info: unknown) {
  const runtime = await getMediaRuntime();
  runtime.reportPusherNetStatusChange(info);
}

export function configureRtcRuntime(config: {
  apiBaseUrl?: string;
  appbaseLoginUrl?: string;
  defaultMediaMode?: "audio" | "video" | "live";
}) {
  return saveRuntimeEnvironment(config);
}

export function getRtcRuntimeEnvironment() {
  return resolveEnvironment();
}

export { buildAppbaseLoginUrl };
