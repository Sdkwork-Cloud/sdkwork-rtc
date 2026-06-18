import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { ProviderWebhookEvent } from "../types/providerWebhookEvent";
import { createBackendRtcClient, type RtcBackendClientOptions } from "./backendClient";

interface ListResponse {
  items: ProviderWebhookEvent[];
  nextCursor?: string | null;
}

export class ProviderWebhookService {
  private readonly client;

  constructor(
    baseUrl: string,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = createBackendRtcClient(baseUrl, tokenManagerOrOptions);
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
    return {
      items: (response.data?.items ?? []) as ProviderWebhookEvent[],
      nextCursor: (response.data?.nextCursor as string | null | undefined) ?? null,
    };
  }
}
