import { readSdkWorkItem, readSdkWorkListPage } from "@sdkwork/rtc-pc-core/sdk";
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

function createRtcCommandIdempotencyKey(scope: string): string {
  const randomPart =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `rtc-${scope}-${randomPart}`;
}

export interface MediaSessionCreateOptions {
  idempotencyKey?: string;
}

export interface ParticipantCredentialIssueOptions {
  idempotencyKey?: string;
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
    return readSdkWorkListPage<RtcMediaSession>(response.data);
  }

  async get(mediaSessionId: string): Promise<RtcMediaSession> {
    const response = await this.client.rtcMediaSessions.rtc.mediaSessions.retrieve(mediaSessionId);
    return readSdkWorkItem<RtcMediaSession>(response.data);
  }

  async create(
    body: RtcCreateMediaSessionRequest,
    options?: MediaSessionCreateOptions,
  ): Promise<RtcMediaSession> {
    const response = await this.client.rtcMediaSessions.rtc.mediaSessions.create(body, {
      idempotencyKey:
        options?.idempotencyKey ?? createRtcCommandIdempotencyKey("media-session-create"),
    });
    return readSdkWorkItem<RtcMediaSession>(response.data);
  }
}

export class ProviderProfileService {
  constructor(private readonly client: RtcAppSdkClient) {}

  async listActive(): Promise<RtcActiveProviderProfile[]> {
    const response =
      await this.client.rtcProviderProfiles.rtc.providerProfiles.active.list();
    return readSdkWorkListPage<RtcActiveProviderProfile>(response.data).items;
  }

  resolveDefaultProviderAppId(profiles: readonly RtcActiveProviderProfile[]): string | undefined {
    const preferred =
      profiles.find((profile) => profile.isDefault && profile.providerAppId) ??
      profiles.find((profile) => profile.providerAppId);
    return preferred?.providerAppId ?? undefined;
  }

  resolveDefaultProviderKey(profiles: readonly RtcActiveProviderProfile[]): string | undefined {
    const preferred =
      profiles.find((profile) => profile.isDefault && profile.provider) ??
      profiles.find((profile) => profile.provider);
    return preferred?.provider ?? undefined;
  }
}

export class ParticipantCredentialService {
  constructor(private readonly client: RtcAppSdkClient) {}

  async issue(
    mediaSessionId: string,
    participantId: string,
    reason = "join",
    options?: ParticipantCredentialIssueOptions,
  ): Promise<string> {
    const response =
      await this.client.rtcParticipantCredentials.rtc.mediaSessions.participantCredentials.issue(
        mediaSessionId,
        participantId,
        { reason },
        {
          idempotencyKey:
            options?.idempotencyKey ??
            createRtcCommandIdempotencyKey("participant-credential-issue"),
        },
      );
    const credential = readSdkWorkItem<{ credential: string }>(response.data);
    if (!credential.credential) {
      throw new Error("RTC participant credential was not issued");
    }
    return credential.credential;
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
