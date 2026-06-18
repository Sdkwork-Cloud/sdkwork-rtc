export interface RtcMediaRuntimeJoinInput {
  appId: string;
  sessionId: string;
  roomId: string;
  participantId: string;
  token: string;
  displayName: string;
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

export async function createRtcMediaRuntime(): Promise<RtcMediaRuntimePort> {
  let connected = false;
  let message = "RTC media runtime is ready for credential-backed join.";

  return {
    async join(input) {
      try {
        const rtcSdk = await import("@sdkwork/rtc-sdk");
        const providerModule = await import("@sdkwork/rtc-sdk-provider-volcengine");
        const driverManager = await rtcSdk.installRtcProviderPackage(
          new rtcSdk.RtcDriverManager(),
          { providerKey: "volcengine" },
          rtcSdk.createRtcProviderPackageLoader(async () => providerModule),
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
        const rtcClient = await dataSource.createClient();
        await rtcClient.join({
          sessionId: input.sessionId,
          roomId: input.roomId,
          participantId: input.participantId,
          token: input.token,
        });
        connected = true;
        message = "Joined media session through volcengine runtime.";
        return { connected: true, providerKey: "volcengine", message };
      } catch (error) {
        connected = false;
        message =
          error instanceof Error
            ? error.message
            : "RTC media runtime is unavailable in this build.";
        return { connected: false, providerKey: "volcengine", message };
      }
    },
    async leave() {
      connected = false;
      message = "Left media session.";
    },
    getStatus() {
      return { connected, providerKey: "volcengine", message };
    },
  };
}
