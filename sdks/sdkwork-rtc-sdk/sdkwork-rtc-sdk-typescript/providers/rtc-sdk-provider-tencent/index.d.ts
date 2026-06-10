import type {
  CreateRtcProviderDriverOptions,
  RtcProviderCatalogEntry,
  RtcProviderDriver,
  RtcProviderModule,
  RtcResolvedClientConfig,
  RtcSessionDescriptor,
} from '@sdkwork/rtc-sdk';

export interface RtcTencentWebSdkModule {
  create(): RtcTencentWebTrtcLike;
}

export interface RtcTencentWebSdkModuleNamespace {
  default?: RtcTencentWebSdkModule;
}

export type RtcTencentWebSdkModuleLoadResult =
  | RtcTencentWebSdkModule
  | RtcTencentWebSdkModuleNamespace;

export interface RtcTencentWebTrtcLike {
  enterRoom(options: RtcTencentWebEnterRoomOptions): Promise<void>;
  exitRoom(): Promise<void>;
  destroy?(): Promise<void> | void;
  startLocalAudio(options?: RtcTencentWebAudioOptions): Promise<void>;
  stopLocalAudio(): Promise<void>;
  startLocalVideo(options?: RtcTencentWebVideoOptions): Promise<void>;
  stopLocalVideo(): Promise<void>;
  startScreenShare(options?: RtcTencentWebScreenShareOptions): Promise<void>;
  stopScreenShare(): Promise<void>;
}

export interface RtcTencentWebEnterRoomOptions {
  sdkAppId: number;
  roomId: number | string;
  userId: string;
  userSig: string;
  scene?: string;
  role?: string;
  privateMapKey?: string;
}

export interface RtcTencentWebAudioOptions {
  microphoneId?: string;
  profile?: string;
  [key: string]: unknown;
}

export interface RtcTencentWebVideoOptions {
  cameraId?: string;
  view?: unknown;
  profile?: string;
  [key: string]: unknown;
}

export interface RtcTencentWebScreenShareOptions {
  option?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RtcTencentWebNativeConfig {
  sdkAppId?: number | string;
  userSig?: string;
  scene?: string;
  role?: string;
  privateMapKey?: string;
  audio?: RtcTencentWebAudioOptions;
  video?: RtcTencentWebVideoOptions;
  screen?: RtcTencentWebScreenShareOptions;
}

export interface RtcTencentOfficialWebNativeClient {
  readonly resolvedConfig: RtcResolvedClientConfig;
  readonly loadSdk: () => Promise<RtcTencentWebSdkModuleLoadResult>;
  sdkModule?: RtcTencentWebSdkModule;
  trtc?: RtcTencentWebTrtcLike;
  joinedSession?: RtcSessionDescriptor;
  publishedTracks: Map<string, 'audio' | 'video' | 'screen-share'>;
  mutedMediaKinds: Set<'audio' | 'video'>;
}

export interface CreateOfficialTencentWebRtcDriverOptions {
  loadSdk?: () => Promise<RtcTencentWebSdkModuleLoadResult>;
}

export const TENCENT_RTC_PROVIDER_METADATA: RtcProviderCatalogEntry;

export function createOfficialTencentWebRtcDriver(
  options?: CreateOfficialTencentWebRtcDriverOptions,
): RtcProviderDriver<RtcTencentOfficialWebNativeClient>;

export type CreateTencentRtcDriverOptions<TNativeClient = unknown> = Omit<
  CreateRtcProviderDriverOptions<TNativeClient>,
  'metadata'
> &
  CreateOfficialTencentWebRtcDriverOptions;

export function createTencentRtcDriver<TNativeClient = unknown>(
  options?: CreateTencentRtcDriverOptions<TNativeClient>,
): RtcProviderDriver<TNativeClient | RtcTencentOfficialWebNativeClient>;

export const TENCENT_RTC_PROVIDER_MODULE: RtcProviderModule;
