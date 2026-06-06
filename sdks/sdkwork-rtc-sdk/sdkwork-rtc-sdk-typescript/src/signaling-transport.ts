import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_SIGNALING_TRANSPORT_TERM = 'websocket-only';

export const RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH = 'connectOptions.webSocketAuth';

export const RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM = 'signaling-adapter-pass-through';

export const RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS = freezeRtcRuntimeValue(['automatic', 'headerBearer', 'queryBearer', 'none'] as const);

export type RtcSignalingTransportAuthMode =
  (typeof RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS)[number];

export const RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE: RtcSignalingTransportAuthMode = 'automatic';

export const RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM = 'top-level-device-id';

export const RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM = 'must-match-top-level-device-id';

export const RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM = 'shared-rtc-live-connection';

export const RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM = 'not-supported';

export const RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM = 'fail-fast';

export const RTC_SIGNALING_TRANSPORT_STANDARD = freezeRtcRuntimeValue({
  transportTerm: RTC_SIGNALING_TRANSPORT_TERM,
  authConfigPath: RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH,
  authPassThroughTerm: RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM,
  authModeTerms: RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS,
  recommendedAuthMode: RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE,
  deviceIdAuthorityTerm: RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM,
  connectOptionsDeviceIdRuleTerm:
    RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM,
  liveConnectionTerm: RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM,
  pollingFallbackTerm: RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM,
  authFailureTerm: RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM,
} as const);

export interface RtcSignalingTransportAuthOptionsLike {
  readonly mode?: RtcSignalingTransportAuthMode;
}

export interface RtcSignalingTransportConnectOptionsLike {
  readonly deviceId?: string | number;
  readonly webSocketAuth?: RtcSignalingTransportAuthOptionsLike;
}

export interface DescribeRtcSignalingTransportOptions {
  readonly deviceId: string | number;
  readonly connectOptions?: RtcSignalingTransportConnectOptionsLike;
  readonly liveConnection?: unknown;
}

export interface RtcSignalingTransportDescriptor {
  readonly deviceId: string;
  readonly connectOptionsDeviceId?: string;
  readonly authMode: RtcSignalingTransportAuthMode;
  readonly usesSharedLiveConnection: boolean;
  readonly transportTerm: typeof RTC_SIGNALING_TRANSPORT_TERM;
  readonly authConfigPath: typeof RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH;
  readonly authPassThroughTerm: typeof RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM;
  readonly recommendedAuthMode: RtcSignalingTransportAuthMode;
  readonly deviceIdAuthorityTerm: typeof RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM;
  readonly connectOptionsDeviceIdRuleTerm:
    typeof RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM;
  readonly liveConnectionTerm: typeof RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM;
  readonly pollingFallbackTerm: typeof RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM;
  readonly authFailureTerm: typeof RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM;
}

function normalizeRtcSignalingTransportDeviceId(deviceId: string | number): string {
  const normalized = String(deviceId).trim();
  if (!normalized) {
    throw new TypeError('RTC signaling deviceId must not be empty.');
  }
  return normalized;
}

function isRtcSignalingTransportAuthMode(
  value: string,
): value is RtcSignalingTransportAuthMode {
  return (RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS as readonly string[]).includes(value);
}

function resolveRtcSignalingTransportAuthMode(
  connectOptions?: RtcSignalingTransportConnectOptionsLike,
): RtcSignalingTransportAuthMode {
  const mode = connectOptions?.webSocketAuth?.mode;
  if (mode === undefined) {
    return RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE;
  }

  if (!isRtcSignalingTransportAuthMode(mode)) {
    throw new TypeError(`Unsupported RTC signaling auth mode: ${mode}`);
  }

  return mode;
}

export function describeRtcSignalingTransport(
  options: DescribeRtcSignalingTransportOptions,
): RtcSignalingTransportDescriptor {
  const deviceId = normalizeRtcSignalingTransportDeviceId(options.deviceId);
  const connectOptionsDeviceId = options.connectOptions?.deviceId === undefined
    ? undefined
    : normalizeRtcSignalingTransportDeviceId(options.connectOptions.deviceId);

  if (connectOptionsDeviceId !== undefined && connectOptionsDeviceId !== deviceId) {
    throw new TypeError(
      'RTC signaling deviceId must match connectOptions.deviceId when both are provided.',
    );
  }

  return freezeRtcRuntimeValue({
    deviceId,
    connectOptionsDeviceId,
    authMode: resolveRtcSignalingTransportAuthMode(options.connectOptions),
    usesSharedLiveConnection: options.liveConnection !== undefined,
    transportTerm: RTC_SIGNALING_TRANSPORT_TERM,
    authConfigPath: RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH,
    authPassThroughTerm: RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM,
    recommendedAuthMode: RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE,
    deviceIdAuthorityTerm: RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM,
    connectOptionsDeviceIdRuleTerm:
      RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM,
    liveConnectionTerm: RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM,
    pollingFallbackTerm: RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM,
    authFailureTerm: RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM,
  });
}
