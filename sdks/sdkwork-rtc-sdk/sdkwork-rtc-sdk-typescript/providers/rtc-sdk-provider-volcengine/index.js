import {
  VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY,
  RtcSdkException,
  createRtcProviderDriver,
  createRtcProviderModule,
} from '@sdkwork/rtc-sdk';


export const VOLCENGINE_RTC_PROVIDER_METADATA = VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY;

async function defaultLoadVolcengineWebSdk() {
  try {
    return await import('@volcengine/rtc');
  } catch (error) {
    throw new RtcSdkException({
      code: 'native_sdk_not_available',
      message: 'Official Volcengine Web RTC SDK package "@volcengine/rtc" is not available.',
      providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
      pluginId: VOLCENGINE_RTC_PROVIDER_METADATA.pluginId,
      details: {
        packageName: '@volcengine/rtc',
      },
      cause: error,
    });
  }
}

function resolveNativeConfig(config) {
  const nativeConfig = config.nativeConfig ?? {};

  if (
    nativeConfig === null ||
    typeof nativeConfig !== 'object' ||
    Array.isArray(nativeConfig)
  ) {
    throw new RtcSdkException({
      code: 'invalid_native_config',
      message: 'RTC nativeConfig must be an object for the official Volcengine Web bridge.',
      providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
      pluginId: VOLCENGINE_RTC_PROVIDER_METADATA.pluginId,
    });
  }

  return nativeConfig;
}

function assertRequiredVolcengineConfig(nativeConfig) {
  if (nativeConfig.appId) {
    return;
  }

  throw new RtcSdkException({
    code: 'invalid_native_config',
    message: 'Official Volcengine Web RTC runtime requires nativeConfig.appId.',
    providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
    pluginId: VOLCENGINE_RTC_PROVIDER_METADATA.pluginId,
    details: {
      missingConfigKeys: ['appId'],
    },
  });
}

function resolveVolcengineWebSdkModule(sdkModule) {
  const candidate =
    sdkModule &&
    typeof sdkModule === 'object' &&
    typeof sdkModule.createEngine !== 'function'
      ? sdkModule.default
      : sdkModule;

  if (
    !candidate ||
    typeof candidate.createEngine !== 'function' ||
    typeof candidate.destroyEngine !== 'function'
  ) {
    throw new RtcSdkException({
      code: 'native_sdk_not_available',
      message: 'Official Volcengine Web RTC SDK package "@volcengine/rtc" did not expose createEngine and destroyEngine.',
      providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
      pluginId: VOLCENGINE_RTC_PROVIDER_METADATA.pluginId,
      details: {
        packageName: '@volcengine/rtc',
        expectedExports: ['createEngine', 'destroyEngine'],
      },
    });
  }

  return candidate;
}

async function ensureEngine(context) {
  const nativeConfig = resolveNativeConfig(context.nativeClient.resolvedConfig);
  assertRequiredVolcengineConfig(nativeConfig);

  if (!context.nativeClient.sdkModule) {
    context.nativeClient.sdkModule = resolveVolcengineWebSdkModule(
      await context.nativeClient.loadSdk(),
    );
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

function buildRtcSessionDescriptor(options) {
  return {
    sessionId: options.sessionId,
    roomId: options.roomId,
    participantId: options.participantId,
    providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
    connectionState: 'joined',
  };
}

function buildUserInfo(options, nativeConfig) {
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

async function publishMediaKind(engine, nativeConfig, kind) {
  if (kind === 'audio') {
    await engine.startAudioCapture(nativeConfig.capture?.audioDeviceId);
    await engine.publishStream('audio');
    return;
  }

  if (kind === 'screen-share') {
    await engine.startScreenCapture(nativeConfig.capture?.screen);
    await engine.publishScreen();
    return;
  }

  await engine.startVideoCapture(nativeConfig.capture?.videoDeviceId);
  await engine.publishStream('video');
}

async function unpublishMediaKind(engine, kind) {
  if (kind === 'screen-share') {
    await engine.unpublishScreen();
    await engine.stopScreenCapture();
    return;
  }

  await engine.unpublishStream(kind);
  if (kind === 'audio') {
    await engine.stopAudioCapture();
    return;
  }

  await engine.stopVideoCapture();
}

async function muteMediaKind(engine, nativeConfig, kind, muted) {
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

function isLocalMediaKind(kind) {
  return kind === 'audio' || kind === 'video';
}

function hasPublishedMediaKind(nativeClient, kind) {
  for (const publishedKind of nativeClient.publishedTracks.values()) {
    if (publishedKind === kind) {
      return true;
    }
  }

  return false;
}

function hasOtherPublishedMediaKind(nativeClient, trackId, kind) {
  for (const [publishedTrackId, publishedKind] of nativeClient.publishedTracks.entries()) {
    if (publishedTrackId !== trackId && publishedKind === kind) {
      return true;
    }
  }

  return false;
}

function markMediaKindActive(nativeClient, kind) {
  if (isLocalMediaKind(kind)) {
    nativeClient.mutedMediaKinds.delete(kind);
  }
}

function markMediaKindMuted(nativeClient, kind, muted) {
  if (!isLocalMediaKind(kind)) {
    return;
  }

  if (muted) {
    nativeClient.mutedMediaKinds.add(kind);
    return;
  }

  nativeClient.mutedMediaKinds.delete(kind);
}

function forgetPublishedTrack(nativeClient, trackId, kind) {
  nativeClient.publishedTracks.delete(trackId);
  if (isLocalMediaKind(kind) && !hasPublishedMediaKind(nativeClient, kind)) {
    nativeClient.mutedMediaKinds.delete(kind);
  }
}

function shouldApplyMute(nativeClient, kind, muted) {
  if (!hasPublishedMediaKind(nativeClient, kind)) {
    return false;
  }

  return nativeClient.mutedMediaKinds.has(kind) !== muted;
}

function resolveTrackPublicationMuted(nativeClient, kind) {
  return isLocalMediaKind(kind) && nativeClient.mutedMediaKinds.has(kind);
}

function shouldPublishNativeMedia(nativeClient, kind) {
  return !hasPublishedMediaKind(nativeClient, kind);
}

function shouldUnpublishNativeMedia(nativeClient, trackId, kind) {
  if (kind === 'screen-share') {
    return true;
  }

  return (
    !nativeClient.mutedMediaKinds.has(kind) &&
    !hasOtherPublishedMediaKind(nativeClient, trackId, kind)
  );
}

function assertTrackKindReusable(nativeClient, trackId, kind) {
  const existingKind = nativeClient.publishedTracks.get(trackId);
  if (!existingKind || existingKind === kind) {
    return;
  }

  throw new RtcSdkException({
    code: 'vendor_error',
    message: `RTC track id "${trackId}" is already published as "${existingKind}" and cannot be republished as "${kind}".`,
    providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
    pluginId: VOLCENGINE_RTC_PROVIDER_METADATA.pluginId,
    details: {
      trackId,
      existingKind,
      requestedKind: kind,
    },
  });
}

function getActiveScreenShareTrackId(nativeClient) {
  for (const [publishedTrackId, publishedKind] of nativeClient.publishedTracks.entries()) {
    if (publishedKind === 'screen-share') {
      return publishedTrackId;
    }
  }

  return undefined;
}

function assertScreenShareTrackAvailable(nativeClient, trackId) {
  const activeTrackId = getActiveScreenShareTrackId(nativeClient);
  if (!activeTrackId || activeTrackId === trackId) {
    return;
  }

  throw new RtcSdkException({
    code: 'vendor_error',
    message: `RTC screen share is already active on track "${activeTrackId}" and cannot be started as "${trackId}".`,
    providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
    pluginId: VOLCENGINE_RTC_PROVIDER_METADATA.pluginId,
    details: {
      activeTrackId,
      requestedTrackId: trackId,
      kind: 'screen-share',
    },
  });
}

function assertTrackPublishable(nativeClient, trackId, kind) {
  assertTrackKindReusable(nativeClient, trackId, kind);
  if (kind === 'screen-share') {
    assertScreenShareTrackAvailable(nativeClient, trackId);
  }
}

function assertJoined(nativeClient, operation) {
  const currentState = nativeClient.joinedSession?.connectionState ?? 'left';
  if (currentState === 'joined') {
    return;
  }

  throw new RtcSdkException({
    code: 'vendor_error',
    message: `RTC operation "${operation}" requires a joined room before local media can be controlled.`,
    providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
    pluginId: VOLCENGINE_RTC_PROVIDER_METADATA.pluginId,
    details: {
      operation,
      requiredState: 'joined',
      currentState,
    },
  });
}

async function drainPublishedMedia(engine, nativeClient) {
  for (const [trackId, mediaKind] of Array.from(nativeClient.publishedTracks.entries())) {
    if (!nativeClient.publishedTracks.has(trackId)) {
      continue;
    }

    if (shouldUnpublishNativeMedia(nativeClient, trackId, mediaKind)) {
      await unpublishMediaKind(engine, mediaKind);
    }
    forgetPublishedTrack(nativeClient, trackId, mediaKind);
  }

  nativeClient.publishedTracks.clear();
  nativeClient.mutedMediaKinds.clear();
}

function resolvePublishedMediaKind(options) {
  if (
    options.kind === 'audio' ||
    options.kind === 'video' ||
    options.kind === 'screen-share'
  ) {
    return options.kind;
  }

  throw new RtcSdkException({
    code: 'capability_not_supported',
    message: `Official Volcengine Web bridge does not support publishing track kind "${options.kind}" through the standard runtime surface.`,
    providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
    pluginId: VOLCENGINE_RTC_PROVIDER_METADATA.pluginId,
    details: {
      kind: options.kind,
    },
  });
}

const OFFICIAL_VOLCENGINE_WEB_RUNTIME_CONTROLLER = {
  async join(options, context) {
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
  async leave(context) {
    if (!context.nativeClient.engine) {
      return (
        context.nativeClient.joinedSession ?? {
          sessionId: '',
          roomId: '',
          participantId: '',
          providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
          connectionState: 'left',
        }
      );
    }

    const engine = context.nativeClient.engine;
    await drainPublishedMedia(engine, context.nativeClient);
    await engine.leaveRoom();
    context.nativeClient.sdkModule?.destroyEngine(engine);
    const joinedSession = context.nativeClient.joinedSession;
    context.nativeClient.engine = undefined;
    context.nativeClient.joinedSession = undefined;
    context.nativeClient.publishedTracks.clear();
    context.nativeClient.mutedMediaKinds.clear();

    return {
      sessionId: joinedSession?.sessionId ?? '',
      roomId: joinedSession?.roomId ?? '',
      participantId: joinedSession?.participantId ?? '',
      providerKey: VOLCENGINE_RTC_PROVIDER_METADATA.providerKey,
      connectionState: 'left',
    };
  },
  async publish(options, context) {
    assertJoined(context.nativeClient, 'publish');
    const mediaKind = resolvePublishedMediaKind(options);
    assertTrackPublishable(context.nativeClient, options.trackId, mediaKind);
    const { nativeConfig, engine } = await ensureEngine(context);
    const shouldPublish = shouldPublishNativeMedia(context.nativeClient, mediaKind);
    if (shouldPublish) {
      await publishMediaKind(engine, nativeConfig, mediaKind);
    }
    context.nativeClient.publishedTracks.set(options.trackId, mediaKind);
    if (shouldPublish) {
      markMediaKindActive(context.nativeClient, mediaKind);
    }
    return {
      trackId: options.trackId,
      kind: options.kind,
      muted: resolveTrackPublicationMuted(context.nativeClient, mediaKind),
    };
  },
  async unpublish(trackId, context) {
    const mediaKind = context.nativeClient.publishedTracks.get(trackId);
    if (!mediaKind) {
      return;
    }

    if (shouldUnpublishNativeMedia(context.nativeClient, trackId, mediaKind)) {
      const { engine } = await ensureEngine(context);
      await unpublishMediaKind(engine, mediaKind);
    }
    forgetPublishedTrack(context.nativeClient, trackId, mediaKind);
  },
  async startScreenShare(options, context) {
    assertJoined(context.nativeClient, 'startScreenShare');
    assertTrackPublishable(context.nativeClient, options.trackId, 'screen-share');
    const { nativeConfig, engine } = await ensureEngine(context);
    const shouldPublish = shouldPublishNativeMedia(context.nativeClient, 'screen-share');
    if (shouldPublish) {
      await publishMediaKind(engine, nativeConfig, 'screen-share');
    }
    context.nativeClient.publishedTracks.set(options.trackId, 'screen-share');
    return {
      trackId: options.trackId,
      kind: 'screen-share',
      muted: false,
    };
  },
  async stopScreenShare(trackId, context) {
    const mediaKind = context.nativeClient.publishedTracks.get(trackId);
    if (mediaKind !== 'screen-share') {
      return;
    }

    const { engine } = await ensureEngine(context);
    await unpublishMediaKind(engine, 'screen-share');
    context.nativeClient.publishedTracks.delete(trackId);
  },
  async muteAudio(muted, context) {
    assertJoined(context.nativeClient, 'muteAudio');
    if (!shouldApplyMute(context.nativeClient, 'audio', muted)) {
      return {
        kind: 'audio',
        muted,
      };
    }

    const { nativeConfig, engine } = await ensureEngine(context);
    const muteState = await muteMediaKind(engine, nativeConfig, 'audio', muted);
    markMediaKindMuted(context.nativeClient, 'audio', muted);
    return muteState;
  },
  async muteVideo(muted, context) {
    assertJoined(context.nativeClient, 'muteVideo');
    if (!shouldApplyMute(context.nativeClient, 'video', muted)) {
      return {
        kind: 'video',
        muted,
      };
    }

    const { nativeConfig, engine } = await ensureEngine(context);
    const muteState = await muteMediaKind(engine, nativeConfig, 'video', muted);
    markMediaKindMuted(context.nativeClient, 'video', muted);
    return muteState;
  },
};

export function createOfficialVolcengineWebRtcDriver(options = {}) {
  const loadSdk = options.loadSdk ?? defaultLoadVolcengineWebSdk;

  return createRtcProviderDriver({
    metadata: VOLCENGINE_RTC_PROVIDER_METADATA,
    nativeFactory(config) {
      return {
        resolvedConfig: config,
        loadSdk,
        publishedTracks: new Map(),
        mutedMediaKinds: new Set(),
      };
    },
    runtimeController: OFFICIAL_VOLCENGINE_WEB_RUNTIME_CONTROLLER,
  });
}

export function createVolcengineRtcDriver(options = {}) {
  if (!options.nativeFactory && !options.runtimeController) {
    return createOfficialVolcengineWebRtcDriver({
      loadSdk: options.loadSdk,
    });
  }

  return createRtcProviderDriver({
    metadata: VOLCENGINE_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const VOLCENGINE_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: VOLCENGINE_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: VOLCENGINE_RTC_PROVIDER_METADATA,
  builtin: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createVolcengineRtcDriver,
});
