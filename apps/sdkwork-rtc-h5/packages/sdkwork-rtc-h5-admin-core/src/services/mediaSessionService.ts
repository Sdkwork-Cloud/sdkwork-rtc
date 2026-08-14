import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type {
  MediaSessionListParams,
  MediaSessionListResponse,
  RtcMediaSession,
} from "../types/mediaSession";
import type { RtcMediaSessionCompletionRecord } from "../types/completionRecord";
import {
  resolveBackendRtcClient,
  type RtcBackendClientOptions,
  type RtcBackendClientSource,
} from "./backendClient";

export class MediaSessionService {
  private readonly client;

  constructor(
    baseUrlOrClient: RtcBackendClientSource,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = resolveBackendRtcClient(baseUrlOrClient, tokenManagerOrOptions);
  }

  async list(params?: MediaSessionListParams): Promise<MediaSessionListResponse> {
    const response = await this.client.rtcMediaSessions.rtc.mediaSessions.list({
      page: params?.page,
      pageSize: params?.limit,
      cursor: params?.cursor,
      q: params?.search,
      sort: params?.sort,
      status: params?.status,
      ownerUserId: params?.ownerUserId,
      createdAfter: params?.createdAfter,
    });
    // The generated SDK unwraps the sdkwork-v3 envelope, so the response is
    // already the `data` payload ({ items, pageInfo }).
    const nextCursor = response.pageInfo?.nextCursor;
    return {
      items: response.items,
      nextCursor: nextCursor && nextCursor.length > 0 ? nextCursor : undefined,
    };
  }

  async get(id: string): Promise<RtcMediaSession> {
    const response = await this.client.rtcMediaSessions.rtc.mediaSessions.retrieve(id);
    if (!response) {
      throw new Error(`RTC media session not found: ${id}`);
    }
    return response;
  }

  async close(id: string): Promise<RtcMediaSession> {
    const response = await this.client.rtcMediaSessions.rtc.mediaSessions.close(id, {});
    return response;
  }

  async getCompletionRecord(id: string): Promise<RtcMediaSessionCompletionRecord> {
    const response = await this.client.rtcMediaSessions.rtc.mediaSessions.completionRecord.retrieve(
      id,
    );
    if (!response) {
      throw new Error(`RTC media session completion record not found: ${id}`);
    }
    return response;
  }
}
