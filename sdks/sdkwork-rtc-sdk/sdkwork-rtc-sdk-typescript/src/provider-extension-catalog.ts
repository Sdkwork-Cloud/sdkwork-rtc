import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcProviderExtensionDescriptor } from './types.js';

export const RTC_PROVIDER_EXTENSION_KEYS = freezeRtcRuntimeValue(['volcengine.native-client', 'aliyun.native-client', 'tencent.native-client', 'agora.native-client', 'zego.native-client', 'livekit.native-client', 'twilio.native-client', 'jitsi.native-client', 'janus.native-client', 'mediasoup.native-client'] as const);
export type RtcKnownProviderExtensionKey = (typeof RTC_PROVIDER_EXTENSION_KEYS)[number];

export const VOLCENGINE_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> = freezeRtcRuntimeValue({
  extensionKey: 'volcengine.native-client',
  providerKey: 'volcengine',
  displayName: 'Volcengine Native Client',
  surface: 'runtime-bridge',
  access: 'unwrap-only',
  status: 'reference-baseline',
});

export const ALIYUN_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> = freezeRtcRuntimeValue({
  extensionKey: 'aliyun.native-client',
  providerKey: 'aliyun',
  displayName: 'Aliyun Native Client',
  surface: 'runtime-bridge',
  access: 'unwrap-only',
  status: 'reference-baseline',
});

export const TENCENT_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> = freezeRtcRuntimeValue({
  extensionKey: 'tencent.native-client',
  providerKey: 'tencent',
  displayName: 'Tencent Native Client',
  surface: 'runtime-bridge',
  access: 'unwrap-only',
  status: 'reference-baseline',
});

export const AGORA_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> = freezeRtcRuntimeValue({
  extensionKey: 'agora.native-client',
  providerKey: 'agora',
  displayName: 'Agora Native Client',
  surface: 'runtime-bridge',
  access: 'unwrap-only',
  status: 'reserved',
});

export const ZEGO_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> = freezeRtcRuntimeValue({
  extensionKey: 'zego.native-client',
  providerKey: 'zego',
  displayName: 'ZEGO Native Client',
  surface: 'runtime-bridge',
  access: 'unwrap-only',
  status: 'reserved',
});

export const LIVEKIT_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> = freezeRtcRuntimeValue({
  extensionKey: 'livekit.native-client',
  providerKey: 'livekit',
  displayName: 'LiveKit Native Client',
  surface: 'runtime-bridge',
  access: 'unwrap-only',
  status: 'reserved',
});

export const TWILIO_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> = freezeRtcRuntimeValue({
  extensionKey: 'twilio.native-client',
  providerKey: 'twilio',
  displayName: 'Twilio Native Client',
  surface: 'runtime-bridge',
  access: 'unwrap-only',
  status: 'reserved',
});

export const JITSI_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> = freezeRtcRuntimeValue({
  extensionKey: 'jitsi.native-client',
  providerKey: 'jitsi',
  displayName: 'Jitsi Native Client',
  surface: 'runtime-bridge',
  access: 'unwrap-only',
  status: 'reserved',
});

export const JANUS_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> = freezeRtcRuntimeValue({
  extensionKey: 'janus.native-client',
  providerKey: 'janus',
  displayName: 'Janus Native Client',
  surface: 'runtime-bridge',
  access: 'unwrap-only',
  status: 'reserved',
});

export const MEDIASOUP_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> = freezeRtcRuntimeValue({
  extensionKey: 'mediasoup.native-client',
  providerKey: 'mediasoup',
  displayName: 'mediasoup Native Client',
  surface: 'runtime-bridge',
  access: 'unwrap-only',
  status: 'reserved',
});

export const RTC_PROVIDER_EXTENSION_CATALOG: readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] = freezeRtcRuntimeValue([
  VOLCENGINE_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR,
  ALIYUN_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR,
  TENCENT_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR,
  AGORA_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR,
  ZEGO_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR,
  LIVEKIT_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR,
  TWILIO_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR,
  JITSI_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR,
  JANUS_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR,
  MEDIASOUP_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR
]);

const RTC_PROVIDER_EXTENSION_DESCRIPTOR_BY_KEY = new Map<
  string,
  RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>
>(RTC_PROVIDER_EXTENSION_CATALOG.map((descriptor) => [descriptor.extensionKey, descriptor]));

const EMPTY_RTC_PROVIDER_EXTENSIONS = freezeRtcRuntimeValue([] as const);

const RTC_PROVIDER_EXTENSIONS_BY_PROVIDER_KEY = new Map<
  string,
  readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[]
>([
  ['volcengine', freezeRtcRuntimeValue([
    VOLCENGINE_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR
  ])],
  ['aliyun', freezeRtcRuntimeValue([
    ALIYUN_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR
  ])],
  ['tencent', freezeRtcRuntimeValue([
    TENCENT_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR
  ])],
  ['agora', freezeRtcRuntimeValue([
    AGORA_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR
  ])],
  ['zego', freezeRtcRuntimeValue([
    ZEGO_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR
  ])],
  ['livekit', freezeRtcRuntimeValue([
    LIVEKIT_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR
  ])],
  ['twilio', freezeRtcRuntimeValue([
    TWILIO_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR
  ])],
  ['jitsi', freezeRtcRuntimeValue([
    JITSI_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR
  ])],
  ['janus', freezeRtcRuntimeValue([
    JANUS_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR
  ])],
  ['mediasoup', freezeRtcRuntimeValue([
    MEDIASOUP_NATIVE_CLIENT_RTC_PROVIDER_EXTENSION_DESCRIPTOR
  ])],
]);

export function getRtcProviderExtensionCatalog(): readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] {
  return RTC_PROVIDER_EXTENSION_CATALOG;
}

export function getRtcProviderExtensionDescriptor(
  extensionKey: string,
): RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> | undefined {
  return RTC_PROVIDER_EXTENSION_DESCRIPTOR_BY_KEY.get(extensionKey);
}

export function getRtcProviderExtensionsForProvider(
  providerKey: string,
): readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] {
  return RTC_PROVIDER_EXTENSIONS_BY_PROVIDER_KEY.get(providerKey) ?? EMPTY_RTC_PROVIDER_EXTENSIONS;
}

export function getRtcProviderExtensions(
  extensionKeys: readonly string[],
): readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] {
  const descriptors: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] = [];

  for (const extensionKey of extensionKeys) {
    const descriptor = RTC_PROVIDER_EXTENSION_DESCRIPTOR_BY_KEY.get(extensionKey);
    if (descriptor) {
      descriptors.push(descriptor);
    }
  }

  return freezeRtcRuntimeValue(descriptors);
}

export function hasRtcProviderExtension(
  extensionKeys: readonly string[],
  extensionKey: string,
): boolean {
  for (const providerExtensionKey of extensionKeys) {
    if (
      providerExtensionKey === extensionKey &&
      RTC_PROVIDER_EXTENSION_DESCRIPTOR_BY_KEY.has(extensionKey)
    ) {
      return true;
    }
  }

  return false;
}
