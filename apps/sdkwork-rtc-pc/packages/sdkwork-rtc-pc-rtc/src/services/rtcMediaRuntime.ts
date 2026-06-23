import type { RtcClient } from "@sdkwork/rtc-sdk";

import {
  importRtcProviderPackageModule,
  normalizeRtcProviderKey,
} from "./rtcProviderPackageImport";

export interface RtcMediaRuntimeJoinInput {
  appId: string;
  sessionId: string;
  roomId: string;
  participantId: string;
  token: string;
  displayName: string;
  providerKey?: string;
}

export interface RtcMediaRuntimeStatus {
  connected: boolean;
  providerKey: string;
  message?: string;
}

export interface RtcMediaRuntimePort {
  join(input: RtcMediaRuntimeJoinInput): Promise<RtcMediaRuntimeStatus>;
  leave(): Promise<void>;
  getStatus(): RtcMediaRuntimeStatus;
}

async function publishDefaultLocalTracks(client: RtcClient, participantId: string): Promise<void> {
  await client.publish({
    trackId: `${participantId}:audio`,
    kind: "audio",
  });
  await client.publish({
    trackId: `${participantId}:video`,
    kind: "video",
  });
}

export async function createRtcMediaRuntime(): Promise<RtcMediaRuntimePort> {
  let connected = false;
  let activeProviderKey = "volcengine";
  let message = "RTC media runtime is ready for credential-backed join.";
  let rtcClient: RtcClient | null = null;

  return {
    async join(input) {
      const providerKey = normalizeRtcProviderKey(input.providerKey);
      activeProviderKey = providerKey;
      try {
        if (rtcClient) {
          await rtcClient.leave().catch(() => undefined);
          rtcClient = null;
        }
        const rtcSdk = await import("@sdkwork/rtc-sdk");
        const packageEntry = rtcSdk.getRtcProviderPackageByProviderKey(providerKey);
        if (!packageEntry) {
          throw new Error(`Unknown RTC provider package: ${providerKey}`);
        }
        const driverManager = await rtcSdk.installRtcProviderPackage(
          new rtcSdk.RtcDriverManager(),
          { providerKey },
          rtcSdk.createRtcProviderPackageLoader(async (_packageIdentity, entry) =>
            importRtcProviderPackageModule(entry),
          ),
        );
        const dataSource = new rtcSdk.RtcDataSource({
          driverManager,
          nativeConfig: {
            appId: input.appId,
            engineConfig: { env: "production" },
            roomConfig: { profile: "communication" },
            userExtraInfo: { displayName: input.displayName },
          },
        });
        const client = await dataSource.createClient();
        rtcClient = client;
        await client.join({
          sessionId: input.sessionId,
          roomId: input.roomId,
          participantId: input.participantId,
          token: input.token,
        });
        await publishDefaultLocalTracks(client, input.participantId);
        connected = true;
        message = `Joined media session through ${providerKey} runtime.`;
        return { connected: true, providerKey, message };
      } catch (error) {
        rtcClient = null;
        connected = false;
        message =
          error instanceof Error
            ? error.message
            : "RTC media runtime is unavailable in this build.";
        return { connected: false, providerKey, message };
      }
    },
    async leave() {
      if (rtcClient) {
        await rtcClient.leave().catch(() => undefined);
        rtcClient = null;
      }
      connected = false;
      message = "Left media session.";
    },
    getStatus() {
      return { connected, providerKey: activeProviderKey, message };
    },
  };
}
