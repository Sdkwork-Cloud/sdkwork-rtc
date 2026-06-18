import type {
  RtcActiveProviderProfile,
  RtcCreateMediaSessionRequest,
  RtcMediaSession,
} from "../types/appApi";
import type { RtcAppSdkClient } from "@sdkwork/rtc-pc-core";

export interface MediaSessionListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  search?: string;
  sort?: string;
}

export interface MediaSessionListResult {
  items: RtcMediaSession[];
  nextCursor?: string;
}

function readListItems<T>(data: Record<string, unknown> | undefined): T[] {
  if (!data) {
    return [];
  }
  const items = data.items;
  return Array.isArray(items) ? (items as T[]) : [];
}

function readNextCursor(data: Record<string, unknown> | undefined): string | undefined {
  const cursor = data?.nextCursor;
  return typeof cursor === "string" && cursor.length > 0 ? cursor : undefined;
}

export class MediaSessionService {
  constructor(private readonly client: RtcAppSdkClient) {}

  async list(params?: MediaSessionListParams): Promise<MediaSessionListResult> {
    const response = await this.client.rtcMediaSessions.rtc.mediaSessions.list({
      page: params?.page,
      pageSize: params?.pageSize,
      cursor: params?.cursor,
      q: params?.search,
      sort: params?.sort,
    });
    return {
      items: readListItems<RtcMediaSession>(response.data),
      nextCursor: readNextCursor(response.data),
    };
  }

  async get(mediaSessionId: string): Promise<RtcMediaSession> {
    const response = await this.client.rtcMediaSessions.rtc.mediaSessions.retrieve(mediaSessionId);
    if (!response.data) {
      throw new Error(`RTC media session not found: ${mediaSessionId}`);
    }
    return response.data;
  }

  async create(body: RtcCreateMediaSessionRequest): Promise<RtcMediaSession> {
    const response = await this.client.rtcMediaSessions.rtc.mediaSessions.create(body);
    if (!response.data) {
      throw new Error("Failed to create RTC media session");
    }
    return response.data;
  }
}

export class ProviderProfileService {
  constructor(private readonly client: RtcAppSdkClient) {}

  async listActive(): Promise<RtcActiveProviderProfile[]> {
    const response =
      await this.client.rtcProviderProfiles.rtc.providerProfiles.active.list();
    return readListItems<RtcActiveProviderProfile>(response.data);
  }

  resolveDefaultProviderAppId(profiles: readonly RtcActiveProviderProfile[]): string | undefined {
    const preferred =
      profiles.find((profile) => profile.isDefault && profile.providerAppId) ??
      profiles.find((profile) => profile.providerAppId);
    return preferred?.providerAppId ?? undefined;
  }
}

export class ParticipantCredentialService {
  constructor(private readonly client: RtcAppSdkClient) {}

  async issue(
    mediaSessionId: string,
    participantId: string,
    reason = "join",
  ): Promise<string> {
    const response =
      await this.client.rtcParticipantCredentials.rtc.mediaSessions.participantCredentials.issue(
        mediaSessionId,
        participantId,
        { reason },
      );
    if (!response.data?.credential) {
      throw new Error("RTC participant credential was not issued");
    }
    return response.data.credential;
  }
}

export interface RtcAppServices {
  mediaSessions: MediaSessionService;
  participantCredentials: ParticipantCredentialService;
  providerProfiles: ProviderProfileService;
}

export function createRtcAppServices(client: RtcAppSdkClient): RtcAppServices {
  return {
    mediaSessions: new MediaSessionService(client),
    participantCredentials: new ParticipantCredentialService(client),
    providerProfiles: new ProviderProfileService(client),
  };
}
