import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type {
  MediaArtifactListParams,
  MediaArtifactListResponse,
  RtcMediaArtifact,
} from "../types/mediaArtifact";
import { readSdkWorkItem, readSdkWorkListPage } from "../sdk/index.js";
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
    const page = readSdkWorkListPage<RtcMediaArtifact>(response);
    return {
      items: page.items,
      nextCursor: page.nextCursor,
    };
  }

  async get(id: string): Promise<RtcMediaArtifact> {
    const response = await this.client.rtcMediaArtifacts.rtc.mediaArtifacts.retrieve(id);
    if (!response) {
      throw new Error(`RTC media artifact not found: ${id}`);
    }
    return readSdkWorkItem<RtcMediaArtifact>(response);
  }
}
