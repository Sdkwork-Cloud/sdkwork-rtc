import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { ProviderPluginDescriptor } from "../types/providerSchema";
import { resolveBackendRtcClient, type RtcBackendClientOptions, type RtcBackendClientSource } from "./backendClient";

interface ListResponse {
  items: ProviderPluginDescriptor[];
  nextCursor?: string | null;
}

export class ProviderPluginService {
  private readonly client;

  constructor(
    baseUrlOrClient: RtcBackendClientSource,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = resolveBackendRtcClient(baseUrlOrClient, tokenManagerOrOptions);
  }

  async list(params?: {
    page?: number;
    limit?: number;
    cursor?: string;
    search?: string;
    sort?: string;
  }): Promise<ListResponse> {
    const response = await this.client.rtcProviderPlugins.rtc.providerPlugins.list({
      page: params?.page,
      pageSize: params?.limit,
      cursor: params?.cursor,
      q: params?.search,
      sort: params?.sort,
    });
    const data = response.data as
      | { items?: ProviderPluginDescriptor[]; nextCursor?: string | null }
      | undefined;
    return {
      items: data?.items ?? [],
      nextCursor: data?.nextCursor ?? null,
    };
  }

  async get(provider: string): Promise<ProviderPluginDescriptor> {
    const response = await this.client.rtcProviderPlugins.rtc.providerPlugins.retrieve(provider);
    const data = response.data as unknown as ProviderPluginDescriptor | undefined;
    if (!data) {
      throw new Error(`RTC provider plugin not found: ${provider}`);
    }
    return data;
  }
}
