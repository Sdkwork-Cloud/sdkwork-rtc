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
    const response = await this.client.rtcProviderPlugins.rtc.providerPlugins.list();
    // The generated SDK unwraps the sdkwork-v3 envelope, so the response is
    // already the `data` payload ({ items, pageInfo }).
    const nextCursor = response.pageInfo?.nextCursor;
    return {
      items: response.items,
      nextCursor: nextCursor && nextCursor.length > 0 ? nextCursor : null,
    };
  }

  async get(provider: string): Promise<ProviderPluginDescriptor> {
    const response = await this.client.rtcProviderPlugins.rtc.providerPlugins.retrieve(provider);
    return response;
  }
}
