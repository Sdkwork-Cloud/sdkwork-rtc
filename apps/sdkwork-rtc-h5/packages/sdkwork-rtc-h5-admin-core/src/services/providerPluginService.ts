import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { SdkWorkPageData } from "@sdkwork/utils";

import type { ProviderPluginDescriptor } from "../types/providerSchema";
import { readSdkWorkItem } from "../sdk/index.js";
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
    const page = readSdkWorkItem<SdkWorkPageData<ProviderPluginDescriptor>>(response.data);
    return {
      items: page.items ?? [],
      nextCursor: page.pageInfo?.nextCursor ?? null,
    };
  }

  async get(provider: string): Promise<ProviderPluginDescriptor> {
    const response = await this.client.rtcProviderPlugins.rtc.providerPlugins.retrieve(provider);
    return readSdkWorkItem<ProviderPluginDescriptor>(response.data);
  }
}
