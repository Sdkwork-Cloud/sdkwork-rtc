import type {
  RtcActiveProviderProfile,
  RtcCreateMediaSessionRequest,
  RtcMediaSession,
} from "../types/appApi";
import type { RtcAppSdkClient } from "@sdkwork/rtc-mp-core";
import { uuid } from "@sdkwork/utils/id";

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
  return `rtc-${scope}-${uuid()}`;
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
    // The generated SDK unwraps the sdkwork-v3 envelope, so the response is
    // already the `data` payload ({ items, pageInfo }).
    const nextCursor = response.pageInfo?.nextCursor;
    return {
      items: response.items,
      nextCursor: nextCursor && nextCursor.length > 0 ? nextCursor : undefined,
    };
  }

  async get(mediaSessionId: string): Promise<RtcMediaSession> {
    const response = await this.client.rtcMediaSessions.rtc.mediaSessions.retrieve(mediaSessionId);
    return response;
  }

  async create(
    body: RtcCreateMediaSessionRequest,
    options?: MediaSessionCreateOptions,
  ): Promise<RtcMediaSession> {
    const response = await this.client.rtcMediaSessions.rtc.mediaSessions.create(body, {
      idempotencyKey:
        options?.idempotencyKey ?? createRtcCommandIdempotencyKey("media-session-create"),
    });
    return response;
  }
}

export class ProviderProfileService {
  constructor(private readonly client: RtcAppSdkClient) {}

  async listActive(): Promise<RtcActiveProviderProfile[]> {
    // Non-interactive bootstrap lookup: aggregates cursor pages to resolve
    // the default provider app id/key (explicit export tooling semantics).
    const items: RtcActiveProviderProfile[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 50; page += 1) {
      const response =
        await this.client.rtcProviderProfiles.rtc.providerProfiles.active.list({
          pageSize: 200,
          cursor,
        });
      items.push(...response.items);
      const next = response.pageInfo?.nextCursor?.trim();
      if (!next) {
        break;
      }
      cursor = next;
    }
    return items;
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
    const credential = response;
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
