import type {
  RtcClient,
  RtcDataSource,
  RtcDriverManager,
  RtcProviderPackageCatalogEntry,
  RtcTrackKind,
} from "@sdkwork/rtc-sdk";

/**
 * RTC call media runtime.
 *
 * Wraps `@sdkwork/rtc-sdk` (the RTC authority SDK family) with the same
 * provider installation, credential-backed join, publish, mute, and DOM
 * render-binding flow proven by the desktop call implementation. The media
 * layer is signaling-agnostic: the join token is issued by the host through
 * the signaling port and passed in as plain data.
 */

export interface RtcCallMediaJoinOptions {
  /** Provider application id; falls back to the volcengine env override. */
  appId?: string;
  sessionId: string;
  roomId: string;
  participantId: string;
  token: string;
  displayName?: string;
  providerKey?: string;
  accessEndpoint?: string;
  providerRegion?: string;
  rtcMode?: string;
  metadata?: Record<string, unknown>;
}

export interface RtcCallMediaPublishOptions {
  kinds: readonly Extract<RtcTrackKind, "audio" | "video">[];
  sessionId: string;
}

export interface RtcCallMediaStatus {
  connected: boolean;
  providerKey: string;
  message?: string;
}

export interface RtcCallMediaService {
  bindLocalVideoElement(element: HTMLElement | null): Promise<void>;
  bindRemoteVideoElement(
    remoteUserId: string | null | undefined,
    element: HTMLElement | null,
  ): Promise<void>;
  join(options: RtcCallMediaJoinOptions): Promise<void>;
  leave(): Promise<void>;
  muteAudio(muted: boolean): Promise<void>;
  muteVideo(muted: boolean): Promise<void>;
  publish(options: RtcCallMediaPublishOptions): Promise<void>;
  getStatus(): RtcCallMediaStatus;
}

export interface RtcCallMediaServiceDependencies {
  createDataSource?: (options: RtcCallMediaJoinOptions) => Promise<RtcDataSource> | RtcDataSource;
  loadProviderModule?: (
    packageEntry: RtcProviderPackageCatalogEntry,
  ) => Promise<Record<string, unknown>>;
}

interface VolcengineLocalVideoEngine {
  play?(userId?: string, mediaType?: unknown, streamIndex?: number, playerId?: string): Promise<void>;
  setLocalVideoPlayer(
    streamIndex: number,
    options?: {
      playerId?: string;
      renderDom?: HTMLElement;
      renderMode?: number;
    },
  ): HTMLVideoElement | undefined;
  setRemoteVideoPlayer?(
    streamIndex: number,
    options?: {
      userId?: string;
      playerId?: string;
      renderDom?: HTMLElement;
      renderMode?: number;
    },
  ): HTMLVideoElement | undefined;
  stop?(userId?: string, mediaType?: unknown, streamIndex?: number, playerId?: string): void;
}

interface VolcengineNativeClient {
  engine?: VolcengineLocalVideoEngine;
}

interface RuntimeImportMetaEnv {
  VITE_SDKWORK_RTC_VOLCENGINE_APP_ID?: string;
  VITE_SDKWORK_RTC_VOLCENGINE_AUDIO_DEVICE_ID?: string;
  VITE_SDKWORK_RTC_VOLCENGINE_ENGINE_ENV?: string;
  VITE_SDKWORK_RTC_VOLCENGINE_PROFILE?: string;
  VITE_SDKWORK_RTC_VOLCENGINE_VIDEO_DEVICE_ID?: string;
}

function readRuntimeImportMetaEnv(): RuntimeImportMetaEnv {
  return (import.meta.env ?? {}) as RuntimeImportMetaEnv;
}

function readEnvValue(key: keyof RuntimeImportMetaEnv): string | undefined {
  const value = readRuntimeImportMetaEnv()[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function toProviderKey(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.replace(/^rtc-/u, "").trim() || undefined;
}

function buildVolcengineNativeConfig(options: RtcCallMediaJoinOptions): Record<string, unknown> {
  const appId = options.appId ?? readEnvValue("VITE_SDKWORK_RTC_VOLCENGINE_APP_ID");
  const engineEnv = readEnvValue("VITE_SDKWORK_RTC_VOLCENGINE_ENGINE_ENV");
  const profile = readEnvValue("VITE_SDKWORK_RTC_VOLCENGINE_PROFILE");
  const audioDeviceId = readEnvValue("VITE_SDKWORK_RTC_VOLCENGINE_AUDIO_DEVICE_ID");
  const videoDeviceId = readEnvValue("VITE_SDKWORK_RTC_VOLCENGINE_VIDEO_DEVICE_ID");
  return {
    ...(appId ? { appId } : {}),
    ...(engineEnv ? { engineConfig: { env: engineEnv } } : {}),
    roomConfig: {
      profile: profile ?? "communication",
    },
    ...(options.displayName ? { userExtraInfo: { displayName: options.displayName } } : {}),
    capture: {
      ...(audioDeviceId ? { audioDeviceId } : {}),
      ...(videoDeviceId ? { videoDeviceId } : {}),
    },
  };
}

async function loadVolcengineProviderModule(): Promise<Record<string, unknown>> {
  return import("@sdkwork/rtc-sdk-provider-volcengine") as Promise<Record<string, unknown>>;
}

async function createDefaultRtcDataSource(
  options: RtcCallMediaJoinOptions,
  loadProviderModule: (entry: RtcProviderPackageCatalogEntry) => Promise<Record<string, unknown>>,
): Promise<RtcDataSource> {
  const [
    { RtcDataSource: RtcDataSourceClass, RtcDriverManager, createRtcProviderPackageLoader, installRtcProviderPackage },
    providerModule,
  ] = await Promise.all([
    import("@sdkwork/rtc-sdk"),
    loadProviderModule({ providerKey: "volcengine" } as RtcProviderPackageCatalogEntry),
  ]);
  const providerKey = toProviderKey(options.providerKey) ?? "volcengine";
  const driverManager = await installRtcProviderPackage(
    new RtcDriverManager(),
    { providerKey },
    createRtcProviderPackageLoader(async (_identity, entry) => providerModule),
  ) as RtcDriverManager;

  return new RtcDataSourceClass({
    defaultProviderKey: "volcengine",
    driverManager,
    providerKey,
    nativeConfig: buildVolcengineNativeConfig(options),
  });
}

function shouldPublishVideo(rtcMode: string | undefined): boolean {
  const mode = rtcMode?.toLowerCase();
  return mode === "video" || mode === "video_call";
}

export function resolveRtcCallMediaPublishKinds(
  options: RtcCallMediaJoinOptions,
): readonly Extract<RtcTrackKind, "audio" | "video">[] {
  return shouldPublishVideo(options.rtcMode) ? ["audio", "video"] : ["audio"];
}

function createTrackId(sessionId: string, kind: RtcTrackKind): string {
  return `${sessionId}-${kind}`;
}

const LOCAL_VIDEO_PLAYER_ID = "sdkwork-rtc-h5-local-video-preview";
const REMOTE_VIDEO_PLAYER_ID = "sdkwork-rtc-h5-remote-video-preview";
const VOLCENGINE_MAIN_STREAM_INDEX = 0;
const VOLCENGINE_RENDER_MODE_HIDDEN = 0;
const VOLCENGINE_NATIVE_CLIENT_EXTENSION_KEY = "volcengine.native-client";

export class StandardRtcCallMediaService implements RtcCallMediaService {
  private readonly createDataSource: (options: RtcCallMediaJoinOptions) => Promise<RtcDataSource> | RtcDataSource;
  private client?: RtcClient;
  private joinedSessionId?: string;
  private localVideoBound = false;
  private localVideoElement?: HTMLElement;
  private remoteVideoBound = false;
  private remoteVideoElement?: HTMLElement;
  private remoteVideoUserId?: string;
  private publishedTrackIds = new Set<string>();
  private providerKey = "volcengine";
  private message?: string;

  constructor(dependencies: RtcCallMediaServiceDependencies = {}) {
    const loadProviderModule =
      dependencies.loadProviderModule ?? loadVolcengineProviderModule;
    this.createDataSource =
      dependencies.createDataSource
      ?? ((options) => createDefaultRtcDataSource(options, loadProviderModule));
  }

  getStatus(): RtcCallMediaStatus {
    return {
      connected: Boolean(this.client),
      providerKey: this.providerKey,
      message: this.message,
    };
  }

  async bindLocalVideoElement(element: HTMLElement | null): Promise<void> {
    this.localVideoElement = element ?? undefined;
    await this.syncLocalVideoBinding();
  }

  async bindRemoteVideoElement(
    remoteUserId: string | null | undefined,
    element: HTMLElement | null,
  ): Promise<void> {
    this.remoteVideoUserId = remoteUserId?.trim() || undefined;
    this.remoteVideoElement = element ?? undefined;
    await this.syncRemoteVideoBinding();
  }

  async join(options: RtcCallMediaJoinOptions): Promise<void> {
    if (this.joinedSessionId === options.sessionId && this.client) {
      await this.syncLocalVideoBinding();
      return;
    }

    if (this.client) {
      await this.leave();
    }

    const providerKey = toProviderKey(options.providerKey) ?? "volcengine";
    this.providerKey = providerKey;
    const dataSource = await this.createDataSource(options);
    const client = await dataSource.createClient({ providerKey });
    try {
      await client.join({
        sessionId: options.sessionId,
        roomId: options.roomId,
        participantId: options.participantId,
        token: options.token,
        metadata: {
          ...(options.metadata ?? {}),
          ...(options.accessEndpoint ? { accessEndpoint: options.accessEndpoint } : {}),
          ...(options.providerRegion ? { providerRegion: options.providerRegion } : {}),
          ...(options.rtcMode ? { rtcMode: options.rtcMode } : {}),
        },
      });
    } catch (error) {
      await this.unbindLocalVideo(client);
      await client.leave().catch(() => undefined);
      throw error;
    }
    this.client = client;
    this.joinedSessionId = options.sessionId;
    this.message = `Joined media session through ${providerKey} runtime.`;
    await this.syncLocalVideoBinding();
    await this.syncRemoteVideoBinding();
  }

  async publish(options: RtcCallMediaPublishOptions): Promise<void> {
    const client = this.requireClient();
    for (const kind of options.kinds) {
      const trackId = createTrackId(options.sessionId, kind);
      if (this.publishedTrackIds.has(trackId)) {
        continue;
      }
      await client.publish({ trackId, kind });
      this.publishedTrackIds.add(trackId);
    }
  }

  async muteAudio(muted: boolean): Promise<void> {
    await this.client?.muteAudio(muted);
  }

  async muteVideo(muted: boolean): Promise<void> {
    await this.client?.muteVideo(muted);
  }

  async leave(): Promise<void> {
    const client = this.client;
    await this.unbindLocalVideo(client);
    await this.unbindRemoteVideo(client);
    this.client = undefined;
    this.joinedSessionId = undefined;
    this.remoteVideoUserId = undefined;
    this.publishedTrackIds.clear();
    this.message = "Left media session.";
    await client?.leave();
  }

  private getVolcengineLocalVideoEngine(client: RtcClient | undefined): VolcengineLocalVideoEngine | undefined {
    try {
      if (!client?.supportsProviderExtension(VOLCENGINE_NATIVE_CLIENT_EXTENSION_KEY)) {
        return undefined;
      }
      const nativeClient = client.unwrap() as VolcengineNativeClient;
      return nativeClient.engine;
    } catch {
      return undefined;
    }
  }

  private async syncLocalVideoBinding(): Promise<void> {
    const client = this.client;
    const engine = this.getVolcengineLocalVideoEngine(client);
    if (!engine) {
      this.localVideoBound = false;
      return;
    }

    if (!this.localVideoElement) {
      await this.unbindLocalVideo(client);
      return;
    }

    try {
      engine.setLocalVideoPlayer(VOLCENGINE_MAIN_STREAM_INDEX, {
        playerId: LOCAL_VIDEO_PLAYER_ID,
        renderDom: this.localVideoElement,
        renderMode: VOLCENGINE_RENDER_MODE_HIDDEN,
      });
      this.localVideoBound = true;
    } catch {
      this.localVideoBound = false;
      return;
    }

    try {
      await engine.play?.(
        undefined,
        undefined,
        VOLCENGINE_MAIN_STREAM_INDEX,
        LOCAL_VIDEO_PLAYER_ID,
      );
    } catch {
      // Local preview playback is best-effort; call join and publishing must continue.
    }
  }

  private async syncRemoteVideoBinding(): Promise<void> {
    const client = this.client;
    const remoteUserId = this.remoteVideoUserId;
    if (!remoteUserId) {
      await this.unbindRemoteVideo(client);
      return;
    }

    if (!this.remoteVideoElement) {
      await this.unbindRemoteVideo(client);
      return;
    }

    const engine = this.getVolcengineLocalVideoEngine(client);
    if (!engine?.setRemoteVideoPlayer) {
      await this.unbindRemoteVideo(client);
      return;
    }

    try {
      engine.setRemoteVideoPlayer(VOLCENGINE_MAIN_STREAM_INDEX, {
        userId: remoteUserId,
        playerId: REMOTE_VIDEO_PLAYER_ID,
        renderDom: this.remoteVideoElement,
        renderMode: VOLCENGINE_RENDER_MODE_HIDDEN,
      });
      this.remoteVideoBound = true;
    } catch {
      this.remoteVideoBound = false;
      return;
    }

    try {
      await engine.play?.(
        remoteUserId,
        undefined,
        VOLCENGINE_MAIN_STREAM_INDEX,
        REMOTE_VIDEO_PLAYER_ID,
      );
    } catch {
      // Remote playback is best-effort; signaling and local publish must continue.
    }
  }

  private async unbindRemoteVideo(client: RtcClient | undefined): Promise<void> {
    if (!this.remoteVideoBound) {
      return;
    }
    const engine = this.getVolcengineLocalVideoEngine(client);
    const remoteUserId = this.remoteVideoUserId;
    if (!engine) {
      this.remoteVideoBound = false;
      return;
    }
    try {
      engine.stop?.(
        remoteUserId,
        undefined,
        VOLCENGINE_MAIN_STREAM_INDEX,
        REMOTE_VIDEO_PLAYER_ID,
      );
    } catch {
      // Remote preview teardown is best-effort.
    }
    try {
      engine.setRemoteVideoPlayer?.(VOLCENGINE_MAIN_STREAM_INDEX, {
        userId: remoteUserId,
        playerId: REMOTE_VIDEO_PLAYER_ID,
      });
    } catch {
      // Remote preview teardown is best-effort.
    }
    this.remoteVideoBound = false;
  }

  private async unbindLocalVideo(client: RtcClient | undefined): Promise<void> {
    if (!this.localVideoBound) {
      return;
    }
    const engine = this.getVolcengineLocalVideoEngine(client);
    if (!engine) {
      this.localVideoBound = false;
      return;
    }
    try {
      engine.stop?.(undefined, undefined, VOLCENGINE_MAIN_STREAM_INDEX, LOCAL_VIDEO_PLAYER_ID);
    } catch {
      // Local preview teardown is best-effort; call leave must continue.
    }
    try {
      engine.setLocalVideoPlayer(VOLCENGINE_MAIN_STREAM_INDEX, {
        playerId: LOCAL_VIDEO_PLAYER_ID,
      });
    } catch {
      // Local preview teardown is best-effort; call leave must continue.
    }
    this.localVideoBound = false;
  }

  private requireClient(): RtcClient {
    if (!this.client) {
      throw new Error("RTC media runtime is not joined.");
    }
    return this.client;
  }
}

export function createRtcCallMediaService(
  dependencies?: RtcCallMediaServiceDependencies,
): RtcCallMediaService {
  return new StandardRtcCallMediaService(dependencies);
}
