import type {
  CreateRtcProviderDriverOptions,
  RtcProviderCatalogEntry,
  RtcProviderDriver,
  RtcProviderModule,
  RtcResolvedClientConfig,
  RtcSessionDescriptor,
} from '@sdkwork/rtc-sdk';

export interface RtcVolcengineWebSdkModule {
  createEngine(appId: string, config?: Record<string, unknown>): RtcVolcengineWebEngineLike;
  destroyEngine(engine: RtcVolcengineWebEngineLike): void;
}

export interface RtcVolcengineWebSdkModuleNamespace {
  default?: RtcVolcengineWebSdkModule;
}

export type RtcVolcengineWebSdkModuleLoadResult =
  | RtcVolcengineWebSdkModule
  | RtcVolcengineWebSdkModuleNamespace;

export interface RtcVolcengineWebEngineLike {
  joinRoom(
    token: string | null,
    roomId: string,
    userInfo: {
      userId: string;
      extraInfo?: string;
    },
    roomConfig?: Record<string, unknown>,
  ): Promise<void>;
  leaveRoom(waitAck?: boolean): Promise<void>;
  publishStream(mediaType: 'audio' | 'video'): Promise<void>;
  unpublishStream(mediaType: 'audio' | 'video'): Promise<void>;
  startScreenCapture(config?: Record<string, unknown>): Promise<unknown>;
  stopScreenCapture(): Promise<void>;
  publishScreen(): Promise<void>;
  unpublishScreen(): Promise<void>;
  startVideoCapture(deviceId?: string): Promise<unknown>;
  stopVideoCapture(): Promise<void>;
  startAudioCapture(deviceId?: string): Promise<unknown>;
  stopAudioCapture(): Promise<void>;
}

export interface RtcVolcengineWebNativeConfig {
  appId?: string;
  engineConfig?: Record<string, unknown>;
  roomConfig?: Record<string, unknown>;
  userExtraInfo?: Record<string, unknown>;
  capture?: {
    audioDeviceId?: string;
    videoDeviceId?: string;
    screen?: Record<string, unknown>;
  };
}

export interface RtcVolcengineOfficialWebNativeClient {
  readonly resolvedConfig: RtcResolvedClientConfig;
  readonly loadSdk: () => Promise<RtcVolcengineWebSdkModuleLoadResult>;
  sdkModule?: RtcVolcengineWebSdkModule;
  engine?: RtcVolcengineWebEngineLike;
  joinedSession?: RtcSessionDescriptor;
  publishedTracks: Map<string, 'audio' | 'video' | 'screen-share'>;
  mutedMediaKinds: Set<'audio' | 'video'>;
}

export interface CreateOfficialVolcengineWebRtcDriverOptions {
  loadSdk?: () => Promise<RtcVolcengineWebSdkModuleLoadResult>;
}

export const VOLCENGINE_RTC_PROVIDER_METADATA: RtcProviderCatalogEntry;

export function createOfficialVolcengineWebRtcDriver(
  options?: CreateOfficialVolcengineWebRtcDriverOptions,
): RtcProviderDriver<RtcVolcengineOfficialWebNativeClient>;

export type CreateVolcengineRtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
> &
  CreateOfficialVolcengineWebRtcDriverOptions;

export function createVolcengineRtcDriver<TNativeClient = unknown>(
  options?: CreateVolcengineRtcDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient | RtcVolcengineOfficialWebNativeClient>;

export const VOLCENGINE_RTC_PROVIDER_MODULE: RtcProviderModule;
