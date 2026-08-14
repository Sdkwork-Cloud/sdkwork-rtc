import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type {
  MediaArtifactListParams,
  MediaArtifactListResponse,
  RtcMediaArtifact,
} from "../types/mediaArtifact";
import {
  resolveBackendRtcClient,
  type RtcBackendClientOptions,
  type RtcBackendClientSource,
} from "./backendClient";

export class MediaArtifactService {
  private readonly client;

  constructor(
    baseUrlOrClient: RtcBackendClientSource,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = resolveBackendRtcClient(baseUrlOrClient, tokenManagerOrOptions);
  }

  async list(params?: MediaArtifactListParams): Promise<MediaArtifactListResponse> {
    const response = await this.client.rtcMediaArtifacts.rtc.mediaArtifacts.list({
      page: params?.page,
      pageSize: params?.limit,
      cursor: params?.cursor,
      q: params?.search,
      sort: params?.sort,
      status: params?.status,
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

  async get(id: string): Promise<RtcMediaArtifact> {
    const response = await this.client.rtcMediaArtifacts.rtc.mediaArtifacts.retrieve(id);
    if (!response) {
      throw new Error(`RTC media artifact not found: ${id}`);
    }
    return response;
  }
}
