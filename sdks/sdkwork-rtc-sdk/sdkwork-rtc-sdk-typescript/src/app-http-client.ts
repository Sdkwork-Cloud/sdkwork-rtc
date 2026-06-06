import { RtcSdkException } from './errors.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type {
  RtcSignalingEventLike,
  RtcSignalingParticipantCredentialLike,
  RtcSignalingSessionLike,
  RtcSignalingTransportLike,
} from './signaling-adapter.js';

export interface RtcAppHttpClientConfig {
  baseUrl: string;
  accessToken?: string;
  authToken?: string;
  headers?: Record<string, string>;
  headerProvider?: () => Record<string, string> | undefined;
  fetch?: typeof fetch;
}

export interface RtcAppHttpClient extends RtcSignalingTransportLike {
  retrieveSession(
    rtcSessionId: string | number,
  ): Promise<RtcSignalingSessionLike>;
}

const RTC_APP_API_PREFIX = '/app/v3/api';

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/u, '');
}

function normalizeBaseUrl(value: string): string {
  const trimmed = trimTrailingSlashes(value.trim());
  if (!trimmed) {
    throw new RtcSdkException({
      code: 'signaling_not_available',
      message: 'RTC app HTTP client requires a non-empty baseUrl.',
    });
  }

  try {
    const parsedUrl = new URL(trimmed);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return trimmed;
    }

    const normalizedPathname = parsedUrl.pathname.replace(/\/+$/u, '');
    if (normalizedPathname === RTC_APP_API_PREFIX) {
      return parsedUrl.origin;
    }
    if (normalizedPathname.endsWith(RTC_APP_API_PREFIX)) {
      return `${parsedUrl.origin}${normalizedPathname.slice(0, -RTC_APP_API_PREFIX.length)}`;
    }
    return `${parsedUrl.origin}${normalizedPathname}`;
  } catch {
    return trimmed;
  }
}

function encodePathSegment(value: string | number): string {
  return encodeURIComponent(String(value));
}

function authHeaders(config: RtcAppHttpClientConfig): Record<string, string> {
  const token = config.accessToken ?? config.authToken;
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function buildHeaders(config: RtcAppHttpClientConfig): Record<string, string> {
  return {
    ...authHeaders(config),
    ...(config.headers ?? {}),
    ...(config.headerProvider?.() ?? {}),
  };
}

function parseStructuredPayload(payload: unknown): unknown {
  if (typeof payload !== 'string') {
    return payload;
  }

  const trimmed = payload.trim();
  if (!trimmed) {
    return payload;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return payload;
  }
}

function unwrapRtcApiResult(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RtcSdkException({
      code: 'signaling_not_available',
      message: 'RTC app API returned a non-object response.',
      details: {
        value,
      },
    });
  }

  const record = value as Record<string, unknown>;
  if ('data' in record && record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    return record.data as Record<string, unknown>;
  }
  return record;
}

function normalizeSession(value: unknown): RtcSignalingSessionLike {
  const data = unwrapRtcApiResult(value);
  const sessionLike = (data.session && typeof data.session === 'object' && !Array.isArray(data.session))
    ? data.session as Record<string, unknown>
    : data;
  const rtcSessionId = sessionLike.rtcSessionId;
  const state = sessionLike.state;
  if ((typeof rtcSessionId !== 'string' && typeof rtcSessionId !== 'number') || typeof state !== 'string') {
    throw new RtcSdkException({
      code: 'signaling_not_available',
      message: 'RTC app API session response is missing rtcSessionId or state.',
      details: {
        data,
      },
    });
  }

  return freezeRtcRuntimeValue({
    rtcSessionId,
    conversationId: typeof sessionLike.conversationId === 'string' ? sessionLike.conversationId : undefined,
    rtcMode: typeof sessionLike.rtcMode === 'string' ? sessionLike.rtcMode : undefined,
    initiatorId: typeof sessionLike.initiatorId === 'string' ? sessionLike.initiatorId : undefined,
    providerPluginId: typeof sessionLike.providerPluginId === 'string' ? sessionLike.providerPluginId : undefined,
    providerSessionId: typeof sessionLike.providerSessionId === 'string' ? sessionLike.providerSessionId : undefined,
    accessEndpoint: typeof sessionLike.accessEndpoint === 'string' ? sessionLike.accessEndpoint : undefined,
    providerRegion: typeof sessionLike.providerRegion === 'string' ? sessionLike.providerRegion : undefined,
    state: state as RtcSignalingSessionLike['state'],
    signalingStreamId: typeof sessionLike.signalingStreamId === 'string' ? sessionLike.signalingStreamId : undefined,
    startedAt: typeof sessionLike.startedAt === 'string' ? sessionLike.startedAt : undefined,
    endedAt: typeof sessionLike.endedAt === 'string' ? sessionLike.endedAt : undefined,
  });
}

function normalizeSignal(value: unknown): RtcSignalingEventLike {
  const data = unwrapRtcApiResult(value);
  const signalLike = (data.signal && typeof data.signal === 'object' && !Array.isArray(data.signal))
    ? data.signal as Record<string, unknown>
    : data;
  const rtcSessionId = signalLike.rtcSessionId;
  const signalType = signalLike.signalType;
  if ((typeof rtcSessionId !== 'string' && typeof rtcSessionId !== 'number') || typeof signalType !== 'string') {
    throw new RtcSdkException({
      code: 'signaling_not_available',
      message: 'RTC app API signal response is missing rtcSessionId or signalType.',
      details: {
        data,
      },
    });
  }

  const payload = parseStructuredPayload(signalLike.payload);
  return freezeRtcRuntimeValue({
    rtcSessionId,
    conversationId: typeof signalLike.conversationId === 'string' ? signalLike.conversationId : undefined,
    rtcMode: typeof signalLike.rtcMode === 'string' ? signalLike.rtcMode : undefined,
    signalType,
    schemaRef: typeof signalLike.schemaRef === 'string' ? signalLike.schemaRef : undefined,
    payload,
    rawSignal: {
      payload: signalLike.payload,
    },
    sender: signalLike.sender && typeof signalLike.sender === 'object' && !Array.isArray(signalLike.sender)
      ? signalLike.sender as { id?: string }
      : undefined,
    signalingStreamId: typeof signalLike.signalingStreamId === 'string' ? signalLike.signalingStreamId : undefined,
    occurredAt: typeof signalLike.occurredAt === 'string' ? signalLike.occurredAt : undefined,
  });
}

function normalizeCredential(value: unknown): RtcSignalingParticipantCredentialLike {
  const data = unwrapRtcApiResult(value);
  const credentialLike =
    (data.credential && typeof data.credential === 'object' && !Array.isArray(data.credential))
      ? data.credential as Record<string, unknown>
      : data;
  const rtcSessionId = credentialLike.rtcSessionId;
  const participantId = credentialLike.participantId;
  const credential = credentialLike.credential ?? credentialLike.token;
  if (
    (typeof rtcSessionId !== 'string' && typeof rtcSessionId !== 'number')
    || (typeof participantId !== 'string' && typeof participantId !== 'number')
    || typeof credential !== 'string'
  ) {
    throw new RtcSdkException({
      code: 'signaling_not_available',
      message: 'RTC app API credential response is missing rtcSessionId, participantId, or credential.',
      details: {
        data,
      },
    });
  }

  return freezeRtcRuntimeValue({
    rtcSessionId,
    participantId,
    credential,
    expiresAt: typeof credentialLike.expiresAt === 'string' ? credentialLike.expiresAt : undefined,
  });
}

export function createRtcAppHttpClient(config: RtcAppHttpClientConfig): RtcAppHttpClient {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const fetchImpl = config.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new RtcSdkException({
      code: 'signaling_not_available',
      message: 'RTC app HTTP client requires fetch support.',
    });
  }

  async function request(path: string, init: RequestInit = {}): Promise<unknown> {
    const headers = {
      ...buildHeaders(config),
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers as Record<string, string> | undefined),
    };
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers,
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) as unknown : {};
    if (!response.ok) {
      throw new RtcSdkException({
        code: 'signaling_not_available',
        message: `RTC app API request failed with HTTP ${response.status}.`,
        details: {
          status: response.status,
          path,
          body,
        },
      });
    }
    return body;
  }

  return freezeRtcRuntimeValue({
    async createSession(body) {
      return normalizeSession(await request('/app/v3/api/rtc/sessions', {
        method: 'POST',
        body: JSON.stringify(body),
      }));
    },
    async retrieveSession(rtcSessionId) {
      return normalizeSession(await request(`/app/v3/api/rtc/sessions/${encodePathSegment(rtcSessionId)}`));
    },
    async inviteSession(rtcSessionId, body) {
      return normalizeSession(await request(`/app/v3/api/rtc/sessions/${encodePathSegment(rtcSessionId)}/invite`, {
        method: 'POST',
        body: JSON.stringify(body),
      }));
    },
    async acceptSession(rtcSessionId, body = {}) {
      return normalizeSession(await request(`/app/v3/api/rtc/sessions/${encodePathSegment(rtcSessionId)}/accept`, {
        method: 'POST',
        body: JSON.stringify(body),
      }));
    },
    async rejectSession(rtcSessionId, body = {}) {
      return normalizeSession(await request(`/app/v3/api/rtc/sessions/${encodePathSegment(rtcSessionId)}/reject`, {
        method: 'POST',
        body: JSON.stringify(body),
      }));
    },
    async endSession(rtcSessionId, body = {}) {
      return normalizeSession(await request(`/app/v3/api/rtc/sessions/${encodePathSegment(rtcSessionId)}/end`, {
        method: 'POST',
        body: JSON.stringify(body),
      }));
    },
    async postJsonSignal(rtcSessionId, signalType, options) {
      return normalizeSignal(await request(`/app/v3/api/rtc/sessions/${encodePathSegment(rtcSessionId)}/signals`, {
        method: 'POST',
        body: JSON.stringify({
          signalType,
          schemaRef: options.schemaRef,
          payload: typeof options.payload === 'string'
            ? options.payload
            : JSON.stringify(options.payload),
          signalingStreamId: options.signalingStreamId,
        }),
      }));
    },
    async issueParticipantCredential(rtcSessionId, body) {
      return normalizeCredential(
        await request(`/app/v3/api/rtc/sessions/${encodePathSegment(rtcSessionId)}/credentials`, {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      );
    },
  });
}
