import { createRtcProviderDriver } from './driver.js';
import { RtcSdkException } from './errors.js';
import { VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY } from './provider-catalog.js';
import type {
  RtcJoinOptions,
  RtcMuteState,
  RtcPublishOptions,
  RtcResolvedClientConfig,
  RtcRuntimeController,
  RtcRuntimeControllerContext,
  RtcSessionDescriptor,
  RtcTrackPublication,
} from './types.js';

export interface RtcVolcengineWebSdkModule {
  createEngine(
    appId: string,
    config?: Record<string, unknown>,
  ): RtcVolcengineWebEngineLike;
  destroyEngine(engine: RtcVolcengineWebEngineLike): void;
}

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
  };
}

export interface RtcVolcengineOfficialWebNativeClient {
  readonly resolvedConfig: RtcResolvedClientConfig;
  readonly loadSdk: () => Promise<RtcVolcengineWebSdkModule>;
  sdkModule?: RtcVolcengineWebSdkModule;
  engine?: RtcVolcengineWebEngineLike;
  joinedSession?: RtcSessionDescriptor;
  publishedTracks: Map<string, 'audio' | 'video'>;
}

export interface CreateOfficialVolcengineWebRtcDriverOptions {
  loadSdk?: () => Promise<RtcVolcengineWebSdkModule>;
}

function resolveNativeConfig(
  config: RtcResolvedClientConfig,
): RtcVolcengineWebNativeConfig {
  const nativeConfig = config.nativeConfig ?? {};

  if (
    nativeConfig === null
    || typeof nativeConfig !== 'object'
    || Array.isArray(nativeConfig)
  ) {
    throw new RtcSdkException({
      code: 'invalid_native_config',
      message: 'RTC nativeConfig must be an object for the official Volcengine Web bridge.',
      providerKey: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.providerKey,
      pluginId: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.pluginId,
    });
  }

  return nativeConfig as RtcVolcengineWebNativeConfig;
}

function assertRequiredVolcengineConfig(
  nativeConfig: RtcVolcengineWebNativeConfig,
): asserts nativeConfig is RtcVolcengineWebNativeConfig & { appId: string } {
  if (nativeConfig.appId) {
    return;
  }

  throw new RtcSdkException({
    code: 'invalid_native_config',
    message: 'Official Volcengine Web RTC runtime requires nativeConfig.appId.',
    providerKey: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.providerKey,
    pluginId: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.pluginId,
    details: {
      missingConfigKeys: ['appId'],
    },
  });
}

async function defaultLoadVolcengineWebSdk(): Promise<RtcVolcengineWebSdkModule> {
  try {
    const importModule = Function('specifier', 'return import(specifier);') as (
      specifier: string,
    ) => Promise<unknown>;
    return (await importModule('@volcengine/rtc')) as RtcVolcengineWebSdkModule;
  } catch (error) {
    throw new RtcSdkException({
      code: 'native_sdk_not_available',
      message: 'Official Volcengine Web RTC SDK package "@volcengine/rtc" is not available.',
      providerKey: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.providerKey,
      pluginId: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.pluginId,
      details: {
        packageName: '@volcengine/rtc',
      },
      cause: error,
    });
  }
}

async function ensureEngine(
  context: RtcRuntimeControllerContext<RtcVolcengineOfficialWebNativeClient>,
): Promise<{
  nativeConfig: RtcVolcengineWebNativeConfig & { appId: string };
  sdkModule: RtcVolcengineWebSdkModule;
  engine: RtcVolcengineWebEngineLike;
}> {
  const nativeConfig = resolveNativeConfig(context.nativeClient.resolvedConfig);
  assertRequiredVolcengineConfig(nativeConfig);

  if (!context.nativeClient.sdkModule) {
    context.nativeClient.sdkModule = await context.nativeClient.loadSdk();
  }

  if (!context.nativeClient.engine) {
    context.nativeClient.engine = context.nativeClient.sdkModule.createEngine(
      nativeConfig.appId,
      nativeConfig.engineConfig,
    );
  }

  return {
    nativeConfig,
    sdkModule: context.nativeClient.sdkModule,
    engine: context.nativeClient.engine,
  };
}

function buildRtcSessionDescriptor(
  options: RtcJoinOptions,
): RtcSessionDescriptor {
  return {
    sessionId: options.sessionId,
    roomId: options.roomId,
    participantId: options.participantId,
    providerKey: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.providerKey,
    connectionState: 'joined',
  };
}

function buildUserInfo(
  options: RtcJoinOptions,
  nativeConfig: RtcVolcengineWebNativeConfig,
): {
  userId: string;
  extraInfo?: string;
} {
  const mergedExtraInfo = {
    ...(nativeConfig.userExtraInfo ?? {}),
    ...(options.metadata ?? {}),
  };

  return {
    userId: options.participantId,
    extraInfo:
      Object.keys(mergedExtraInfo).length > 0
        ? JSON.stringify(mergedExtraInfo)
        : undefined,
  };
}

async function publishMediaKind(
  engine: RtcVolcengineWebEngineLike,
  nativeConfig: RtcVolcengineWebNativeConfig,
  kind: 'audio' | 'video',
): Promise<void> {
  if (kind === 'audio') {
    await engine.startAudioCapture(nativeConfig.capture?.audioDeviceId);
    await engine.publishStream('audio');
    return;
  }

  await engine.startVideoCapture(nativeConfig.capture?.videoDeviceId);
  await engine.publishStream('video');
}

async function unpublishMediaKind(
  engine: RtcVolcengineWebEngineLike,
  kind: 'audio' | 'video',
): Promise<void> {
  await engine.unpublishStream(kind);
}

async function muteMediaKind(
  engine: RtcVolcengineWebEngineLike,
  nativeConfig: RtcVolcengineWebNativeConfig,
  kind: 'audio' | 'video',
  muted: boolean,
): Promise<RtcMuteState> {
  if (kind === 'audio') {
    if (muted) {
      await engine.stopAudioCapture();
      await engine.unpublishStream('audio');
    } else {
      await engine.startAudioCapture(nativeConfig.capture?.audioDeviceId);
      await engine.publishStream('audio');
    }

    return {
      kind: 'audio',
      muted,
    };
  }

  if (muted) {
    await engine.stopVideoCapture();
    await engine.unpublishStream('video');
  } else {
    await engine.startVideoCapture(nativeConfig.capture?.videoDeviceId);
    await engine.publishStream('video');
  }

  return {
    kind: 'video',
    muted,
  };
}

function resolvePublishedMediaKind(
  options: RtcPublishOptions,
): 'audio' | 'video' {
  if (options.kind === 'audio' || options.kind === 'video') {
    return options.kind;
  }

  throw new RtcSdkException({
    code: 'capability_not_supported',
    message: `Official Volcengine Web bridge does not support publishing track kind "${options.kind}" through the standard runtime surface.`,
    providerKey: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.providerKey,
    pluginId: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.pluginId,
    details: {
      kind: options.kind,
    },
  });
}

const OFFICIAL_VOLCENGINE_WEB_RUNTIME_CONTROLLER: RtcRuntimeController<RtcVolcengineOfficialWebNativeClient> = {
  async join(options, context): Promise<RtcSessionDescriptor> {
    const { nativeConfig, engine } = await ensureEngine(context);
    await engine.joinRoom(
      options.token ?? null,
      options.roomId,
      buildUserInfo(options, nativeConfig),
      nativeConfig.roomConfig,
    );

    const sessionDescriptor = buildRtcSessionDescriptor(options);
    context.nativeClient.joinedSession = sessionDescriptor;
    return sessionDescriptor;
  },
  async leave(context): Promise<RtcSessionDescriptor> {
    if (!context.nativeClient.engine) {
      return (
        context.nativeClient.joinedSession ?? {
          sessionId: '',
          roomId: '',
          participantId: '',
          providerKey: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.providerKey,
          connectionState: 'left',
        }
      );
    }

    await context.nativeClient.engine.leaveRoom();
    context.nativeClient.sdkModule?.destroyEngine(context.nativeClient.engine);
    const joinedSession = context.nativeClient.joinedSession;
    context.nativeClient.engine = undefined;
    context.nativeClient.joinedSession = undefined;
    context.nativeClient.publishedTracks.clear();

    return {
      sessionId: joinedSession?.sessionId ?? '',
      roomId: joinedSession?.roomId ?? '',
      participantId: joinedSession?.participantId ?? '',
      providerKey: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.providerKey,
      connectionState: 'left',
    };
  },
  async publish(options, context): Promise<RtcTrackPublication> {
    const mediaKind = resolvePublishedMediaKind(options);
    const { nativeConfig, engine } = await ensureEngine(context);
    await publishMediaKind(engine, nativeConfig, mediaKind);
    context.nativeClient.publishedTracks.set(options.trackId, mediaKind);
    return {
      trackId: options.trackId,
      kind: options.kind,
      muted: false,
    };
  },
  async unpublish(trackId, context): Promise<void> {
    const mediaKind = context.nativeClient.publishedTracks.get(trackId);
    if (!mediaKind) {
      return;
    }

    const { engine } = await ensureEngine(context);
    await unpublishMediaKind(engine, mediaKind);
    context.nativeClient.publishedTracks.delete(trackId);
  },
  async muteAudio(muted, context): Promise<RtcMuteState> {
    const { nativeConfig, engine } = await ensureEngine(context);
    return muteMediaKind(engine, nativeConfig, 'audio', muted);
  },
  async muteVideo(muted, context): Promise<RtcMuteState> {
    const { nativeConfig, engine } = await ensureEngine(context);
    return muteMediaKind(engine, nativeConfig, 'video', muted);
  },
};

export function createOfficialVolcengineWebRtcDriver(
  options: CreateOfficialVolcengineWebRtcDriverOptions = {},
) {
  const loadSdk = options.loadSdk ?? defaultLoadVolcengineWebSdk;

  return createRtcProviderDriver<RtcVolcengineOfficialWebNativeClient>({
    metadata: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY,
    nativeFactory(config) {
      return {
        resolvedConfig: config,
        loadSdk,
        publishedTracks: new Map<string, 'audio' | 'video'>(),
      };
    },
    runtimeController: OFFICIAL_VOLCENGINE_WEB_RUNTIME_CONTROLLER,
  });
}
