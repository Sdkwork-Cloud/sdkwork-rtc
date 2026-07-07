import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { ProviderWebhookEvent } from "../types/providerWebhookEvent";
import { readSdkWorkItem, readSdkWorkListPage } from "../sdk/index.js";
import { resolveBackendRtcClient, type RtcBackendClientOptions, type RtcBackendClientSource } from "./backendClient";

interface ListResponse {
  items: ProviderWebhookEvent[];
  nextCursor?: string | null;
}

export class ProviderWebhookService {
  private readonly client;

  constructor(
    baseUrlOrClient: RtcBackendClientSource,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = resolveBackendRtcClient(baseUrlOrClient, tokenManagerOrOptions);
  }

  async listEvents(params?: {
    page?: number;
    limit?: number;
    cursor?: string;
    search?: string;
    sort?: string;
  }): Promise<ListResponse> {
    const response = await this.client.rtcProviderWebhooks.rtc.providerWebhooks.events.list({
      page: params?.page,
      pageSize: params?.limit,
      cursor: params?.cursor,
      q: params?.search,
      sort: params?.sort,
    });
    const page = readSdkWorkListPage<ProviderWebhookEvent>(response);
    return {
      items: page.items,
      nextCursor: page.nextCursor ?? null,
    };
  }
}
