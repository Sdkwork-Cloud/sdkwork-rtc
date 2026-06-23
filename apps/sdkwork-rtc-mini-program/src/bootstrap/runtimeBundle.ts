import { installWeixinFetch } from "@sdkwork/rtc-mp-host";

import { bootstrap } from "./iamRuntime";
import { createAppServices } from "./appServices";
import { buildAppbaseLoginUrl } from "@sdkwork/rtc-mp-core";
import { resolveEnvironment, saveRuntimeEnvironment } from "./environment";

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

export async function listMediaSessions() {
  const result = await getServices().mediaSessions.list();
  return result.items.map(mapSessionSummary);
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
