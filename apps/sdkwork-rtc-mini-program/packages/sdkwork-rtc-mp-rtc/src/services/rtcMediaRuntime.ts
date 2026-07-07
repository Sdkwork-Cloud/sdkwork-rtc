export interface MiniProgramRtcMediaJoinInput {
  appId: string;
  sessionId: string;
  roomId: string;
  participantId: string;
  token: string;
}

export interface MiniProgramRemoteStream {
  id: string;
  uid: string;
  url: string;
  screen: boolean;
}

export interface MiniProgramRtcMediaRoomViewState {
  connected: boolean;
  pushUrl: string;
  remoteStreams: MiniProgramRemoteStream[];
  message: string;
}

export type MiniProgramRtcMediaViewStateListener = (
  state: MiniProgramRtcMediaRoomViewState,
) => void;

export interface MiniProgramRtcMediaRuntimePort {
  join(input: MiniProgramRtcMediaJoinInput): Promise<MiniProgramRtcMediaRoomViewState>;
  leave(): Promise<void>;
  getViewState(): MiniProgramRtcMediaRoomViewState;
  subscribeViewState(listener: MiniProgramRtcMediaViewStateListener): () => void;
  reportPusherStateChange(code: number, message: string): void;
  reportPusherNetStatusChange(info: unknown): void;
}

type VolcMiniappClient = {
  init(appId: string): void;
  join(token: string, roomId: string, userId: string): Promise<void>;
  publish(): Promise<string>;
  subscribe(uid: string, options: { screen?: boolean }): Promise<string>;
  leave(): Promise<void>;
  removeAllListeners(): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  reportPusherStateChange(code: number, message: string): void;
  reportPusherNetStatusChange(info: unknown): void;
};

type VolcMiniappSdkModule = {
  Client: new () => VolcMiniappClient;
  EVENTS: {
    STREAM_ADDED: string;
  };
};

const VOLC_MINIAPP_SDK_PATH = "../lib/miniapp-rtc.min.js";
const MISSING_SDK_MESSAGE =
  "VolcEngine mini program RTC SDK is not installed. Copy miniapp-rtc.min.js to src/lib/ and rebuild npm.";

function loadVolcMiniappSdk(): VolcMiniappSdkModule | null {
  try {
    // WeChat mini program runtime resolves this path from src/runtime/rtc-app.js.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(VOLC_MINIAPP_SDK_PATH) as VolcMiniappSdkModule;
  } catch {
    return null;
  }
}

export async function createMiniProgramRtcMediaRuntime(): Promise<MiniProgramRtcMediaRuntimePort> {
  const sdk = loadVolcMiniappSdk();
  let client: VolcMiniappClient | null = null;
  let connected = false;
  let pushUrl = "";
  let remoteStreams: MiniProgramRemoteStream[] = [];
  let message = sdk ? "RTC media runtime is ready." : MISSING_SDK_MESSAGE;
  const listeners = new Set<MiniProgramRtcMediaViewStateListener>();

  const getViewState = (): MiniProgramRtcMediaRoomViewState => ({
    connected,
    pushUrl,
    remoteStreams,
    message,
  });

  const notifyViewState = () => {
    const state = getViewState();
    listeners.forEach((listener) => listener(state));
  };

  const bindStreamEvents = () => {
    if (!client || !sdk) {
      return;
    }
    client.removeAllListeners();
    client.on(sdk.EVENTS.STREAM_ADDED, (event: unknown) => {
      const payload = event as { uid?: string; screen?: boolean };
      const uid = String(payload.uid ?? "").trim();
      if (!uid || !client) {
        return;
      }
      const screen = Boolean(payload.screen);
      void client
        .subscribe(uid, { screen })
        .then((url) => {
          const stream: MiniProgramRemoteStream = {
            id: `${uid}-${screen ? 1 : 0}`,
            uid,
            url,
            screen,
          };
          remoteStreams = [...remoteStreams.filter((item) => item.id !== stream.id), stream];
          message = `Subscribed remote stream ${stream.id}.`;
          notifyViewState();
        })
        .catch((error: unknown) => {
          message =
            error instanceof Error
              ? `Failed to subscribe remote stream ${uid}: ${error.message}`
              : `Failed to subscribe remote stream ${uid}.`;
          notifyViewState();
        });
    });
  };

  return {
    async join(input) {
      if (!sdk) {
        connected = false;
        pushUrl = "";
        remoteStreams = [];
        message = MISSING_SDK_MESSAGE;
        const state = getViewState();
        notifyViewState();
        return state;
      }

      try {
        if (client) {
          await client.leave().catch(() => undefined);
        }
        client = new sdk.Client();
        client.init(input.appId);
        bindStreamEvents();
        await client.join(input.token, input.roomId, input.participantId);
        pushUrl = await client.publish();
        connected = true;
        remoteStreams = [];
        message = `Joined room ${input.roomId} through VolcEngine mini program runtime.`;
        const state = getViewState();
        notifyViewState();
        return state;
      } catch (error) {
        client = null;
        connected = false;
        pushUrl = "";
        remoteStreams = [];
        message = error instanceof Error ? error.message : "Failed to join media session.";
        const state = getViewState();
        notifyViewState();
        return state;
      }
    },
    async leave() {
      if (client) {
        await client.leave().catch(() => undefined);
        client.removeAllListeners();
        client = null;
      }
      connected = false;
      pushUrl = "";
      remoteStreams = [];
      message = "Left media session.";
      notifyViewState();
    },
    getViewState,
    subscribeViewState(listener) {
      listeners.add(listener);
      listener(getViewState());
      return () => {
        listeners.delete(listener);
      };
    },
    reportPusherStateChange(code, detailMessage) {
      client?.reportPusherStateChange(code, detailMessage);
    },
    reportPusherNetStatusChange(info) {
      client?.reportPusherNetStatusChange(info);
    },
  };
}
