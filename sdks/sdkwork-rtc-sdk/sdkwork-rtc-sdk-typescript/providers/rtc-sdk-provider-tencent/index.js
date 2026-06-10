import {
  TENCENT_RTC_PROVIDER_CATALOG_ENTRY,
  RtcSdkException,
  createRtcProviderDriver,
  createRtcProviderModule,
} from '@sdkwork/rtc-sdk';


export const TENCENT_RTC_PROVIDER_METADATA = TENCENT_RTC_PROVIDER_CATALOG_ENTRY;

async function defaultLoadTencentWebSdk() {
  try {
    return await import('trtc-sdk-v5');
  } catch (error) {
    throw new RtcSdkException({
      code: 'native_sdk_not_available',
      message: 'Official Tencent TRTC Web SDK package "trtc-sdk-v5" is not available.',
      providerKey: TENCENT_RTC_PROVIDER_METADATA.providerKey,
      pluginId: TENCENT_RTC_PROVIDER_METADATA.pluginId,
      details: {
        packageName: 'trtc-sdk-v5',
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
      message: 'RTC nativeConfig must be an object for the official Tencent Web bridge.',
      providerKey: TENCENT_RTC_PROVIDER_METADATA.providerKey,
      pluginId: TENCENT_RTC_PROVIDER_METADATA.pluginId,
    });
  }

  return nativeConfig;
}

function assertRequiredTencentConfig(nativeConfig) {
  const missingConfigKeys = [];
  if (!nativeConfig.sdkAppId) {
    missingConfigKeys.push('sdkAppId');
  }
  if (!nativeConfig.userSig) {
    missingConfigKeys.push('userSig');
  }

  if (missingConfigKeys.length === 0) {
    return;
  }

  throw new RtcSdkException({
    code: 'invalid_native_config',
    message: 'Official Tencent Web RTC runtime requires nativeConfig.sdkAppId and nativeConfig.userSig.',
    providerKey: TENCENT_RTC_PROVIDER_METADATA.providerKey,
    pluginId: TENCENT_RTC_PROVIDER_METADATA.pluginId,
    details: {
      missingConfigKeys,
    },
  });
}

function resolveTencentWebSdkModule(sdkModule) {
  const candidate =
    sdkModule &&
    typeof sdkModule === 'object' &&
    typeof sdkModule.create !== 'function'
      ? sdkModule.default
      : sdkModule;

  if (!candidate || typeof candidate.create !== 'function') {
    throw new RtcSdkException({
      code: 'native_sdk_not_available',
      message: 'Official Tencent TRTC Web SDK package "trtc-sdk-v5" did not expose create.',
      providerKey: TENCENT_RTC_PROVIDER_METADATA.providerKey,
      pluginId: TENCENT_RTC_PROVIDER_METADATA.pluginId,
      details: {
        packageName: 'trtc-sdk-v5',
        expectedExports: ['create'],
      },
    });
  }

  return candidate;
}

async function ensureTrtc(context) {
  const nativeConfig = resolveNativeConfig(context.nativeClient.resolvedConfig);
  assertRequiredTencentConfig(nativeConfig);

  if (!context.nativeClient.sdkModule) {
    context.nativeClient.sdkModule = resolveTencentWebSdkModule(
      await context.nativeClient.loadSdk(),
    );
  }

  if (!context.nativeClient.trtc) {
    context.nativeClient.trtc = context.nativeClient.sdkModule.create();
  }

  return {
    nativeConfig,
    sdkModule: context.nativeClient.sdkModule,
    trtc: context.nativeClient.trtc,
  };
}

function buildRtcSessionDescriptor(options) {
  return {
    sessionId: options.sessionId,
    roomId: options.roomId,
    participantId: options.participantId,
    providerKey: TENCENT_RTC_PROVIDER_METADATA.providerKey,
    connectionState: 'joined',
  };
}

function resolveTencentRoomId(roomId) {
  const normalizedRoomId = String(roomId).trim();
  if (/^\d+$/.test(normalizedRoomId)) {
    return Number(normalizedRoomId);
  }

  return roomId;
}

function buildEnterRoomOptions(options, nativeConfig) {
  return {
    sdkAppId: Number(nativeConfig.sdkAppId),
    roomId: resolveTencentRoomId(options.roomId),
    userId: options.participantId,
    userSig: nativeConfig.userSig,
    ...(nativeConfig.scene ? { scene: nativeConfig.scene } : {}),
    ...(nativeConfig.role ? { role: nativeConfig.role } : {}),
    ...(nativeConfig.privateMapKey ? { privateMapKey: nativeConfig.privateMapKey } : {}),
  };
}

async function publishMediaKind(trtc, nativeConfig, kind) {
  if (kind === 'audio') {
    await trtc.startLocalAudio(nativeConfig.audio);
    return;
  }

  if (kind === 'screen-share') {
    await trtc.startScreenShare(nativeConfig.screen);
    return;
  }

  await trtc.startLocalVideo(nativeConfig.video);
}

async function unpublishMediaKind(trtc, kind) {
  if (kind === 'audio') {
    await trtc.stopLocalAudio();
    return;
  }

  if (kind === 'screen-share') {
    await trtc.stopScreenShare();
    return;
  }

  await trtc.stopLocalVideo();
}

async function muteMediaKind(trtc, nativeConfig, kind, muted) {
  if (muted) {
    await unpublishMediaKind(trtc, kind);
  } else {
    await publishMediaKind(trtc, nativeConfig, kind);
  }

  return {
    kind,
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
    providerKey: TENCENT_RTC_PROVIDER_METADATA.providerKey,
    pluginId: TENCENT_RTC_PROVIDER_METADATA.pluginId,
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
    providerKey: TENCENT_RTC_PROVIDER_METADATA.providerKey,
    pluginId: TENCENT_RTC_PROVIDER_METADATA.pluginId,
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
    providerKey: TENCENT_RTC_PROVIDER_METADATA.providerKey,
    pluginId: TENCENT_RTC_PROVIDER_METADATA.pluginId,
    details: {
      operation,
      requiredState: 'joined',
      currentState,
    },
  });
}

async function drainPublishedMedia(trtc, nativeClient) {
  for (const [trackId, mediaKind] of Array.from(nativeClient.publishedTracks.entries())) {
    if (!nativeClient.publishedTracks.has(trackId)) {
      continue;
    }

    if (shouldUnpublishNativeMedia(nativeClient, trackId, mediaKind)) {
      await unpublishMediaKind(trtc, mediaKind);
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
    message: `Official Tencent Web bridge does not support publishing track kind "${options.kind}" through the standard runtime surface.`,
    providerKey: TENCENT_RTC_PROVIDER_METADATA.providerKey,
    pluginId: TENCENT_RTC_PROVIDER_METADATA.pluginId,
    details: {
      kind: options.kind,
    },
  });
}

const OFFICIAL_TENCENT_WEB_RUNTIME_CONTROLLER = {
  async join(options, context) {
    const { nativeConfig, trtc } = await ensureTrtc(context);
    await trtc.enterRoom(buildEnterRoomOptions(options, nativeConfig));

    const sessionDescriptor = buildRtcSessionDescriptor(options);
    context.nativeClient.joinedSession = sessionDescriptor;
    return sessionDescriptor;
  },
  async leave(context) {
    if (!context.nativeClient.trtc) {
      return (
        context.nativeClient.joinedSession ?? {
          sessionId: '',
          roomId: '',
          participantId: '',
          providerKey: TENCENT_RTC_PROVIDER_METADATA.providerKey,
          connectionState: 'left',
        }
      );
    }

    const trtc = context.nativeClient.trtc;
    await drainPublishedMedia(trtc, context.nativeClient);
    await trtc.exitRoom();
    await trtc.destroy?.();
    const joinedSession = context.nativeClient.joinedSession;
    context.nativeClient.trtc = undefined;
    context.nativeClient.joinedSession = undefined;
    context.nativeClient.publishedTracks.clear();
    context.nativeClient.mutedMediaKinds.clear();

    return {
      sessionId: joinedSession?.sessionId ?? '',
      roomId: joinedSession?.roomId ?? '',
      participantId: joinedSession?.participantId ?? '',
      providerKey: TENCENT_RTC_PROVIDER_METADATA.providerKey,
      connectionState: 'left',
    };
  },
  async publish(options, context) {
    assertJoined(context.nativeClient, 'publish');
    const mediaKind = resolvePublishedMediaKind(options);
    assertTrackPublishable(context.nativeClient, options.trackId, mediaKind);
    const { nativeConfig, trtc } = await ensureTrtc(context);
    const shouldPublish = shouldPublishNativeMedia(context.nativeClient, mediaKind);
    if (shouldPublish) {
      await publishMediaKind(trtc, nativeConfig, mediaKind);
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
      const { trtc } = await ensureTrtc(context);
      await unpublishMediaKind(trtc, mediaKind);
    }
    forgetPublishedTrack(context.nativeClient, trackId, mediaKind);
  },
  async startScreenShare(options, context) {
    assertJoined(context.nativeClient, 'startScreenShare');
    assertTrackPublishable(context.nativeClient, options.trackId, 'screen-share');
    const { nativeConfig, trtc } = await ensureTrtc(context);
    const shouldPublish = shouldPublishNativeMedia(context.nativeClient, 'screen-share');
    if (shouldPublish) {
      await publishMediaKind(trtc, nativeConfig, 'screen-share');
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

    const { trtc } = await ensureTrtc(context);
    await unpublishMediaKind(trtc, 'screen-share');
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

    const { nativeConfig, trtc } = await ensureTrtc(context);
    const muteState = await muteMediaKind(trtc, nativeConfig, 'audio', muted);
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

    const { nativeConfig, trtc } = await ensureTrtc(context);
    const muteState = await muteMediaKind(trtc, nativeConfig, 'video', muted);
    markMediaKindMuted(context.nativeClient, 'video', muted);
    return muteState;
  },
};

export function createOfficialTencentWebRtcDriver(options = {}) {
  const loadSdk = options.loadSdk ?? defaultLoadTencentWebSdk;

  return createRtcProviderDriver({
    metadata: TENCENT_RTC_PROVIDER_METADATA,
    nativeFactory(config) {
      return {
        resolvedConfig: config,
        loadSdk,
        publishedTracks: new Map(),
        mutedMediaKinds: new Set(),
      };
    },
    runtimeController: OFFICIAL_TENCENT_WEB_RUNTIME_CONTROLLER,
  });
}

export function createTencentRtcDriver(options = {}) {
  if (!options.nativeFactory && !options.runtimeController) {
    return createOfficialTencentWebRtcDriver({
      loadSdk: options.loadSdk,
    });
  }

  return createRtcProviderDriver({
    metadata: TENCENT_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const TENCENT_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: TENCENT_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: TENCENT_RTC_PROVIDER_METADATA,
  builtin: TENCENT_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createTencentRtcDriver,
});
