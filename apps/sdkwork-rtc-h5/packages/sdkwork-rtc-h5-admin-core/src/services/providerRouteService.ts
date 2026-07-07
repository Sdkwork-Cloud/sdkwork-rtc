import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { ProviderRoute, ProviderRouteCommand } from "../types/providerRoute";
import { readSdkWorkItem, readSdkWorkListPage } from "../sdk/index.js";
import { resolveBackendRtcClient, type RtcBackendClientOptions, type RtcBackendClientSource } from "./backendClient";

interface ListResponse {
  items: ProviderRoute[];
  nextCursor?: string | null;
}

export class ProviderRouteService {
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
    const response = await this.client.rtcProviderRoutes.rtc.providerRoutes.list({
      page: params?.page,
      pageSize: params?.limit,
      cursor: params?.cursor,
      q: params?.search,
      sort: params?.sort,
    });
    const page = readSdkWorkListPage<ProviderRoute>(response);
    return {
      items: page.items,
      nextCursor: page.nextCursor ?? null,
    };
  }

  async create(command: ProviderRouteCommand): Promise<ProviderRoute> {
    const response = await this.client.rtcProviderRoutes.rtc.providerRoutes.create(
      command as Parameters<
        typeof this.client.rtcProviderRoutes.rtc.providerRoutes.create
      >[0],
    );
    if (!response) {
      throw new Error("Invalid response: missing provider route data");
    }
    return readSdkWorkItem<ProviderRoute>(response);
  }

  async get(id: string): Promise<ProviderRoute> {
    const response = await this.client.rtcProviderRoutes.rtc.providerRoutes.retrieve(id);
    if (!response) {
      throw new Error(`RTC provider route not found: ${id}`);
    }
    return readSdkWorkItem<ProviderRoute>(response);
  }

  async update(id: string, command: ProviderRouteCommand): Promise<ProviderRoute> {
    const response = await this.client.rtcProviderRoutes.rtc.providerRoutes.update(
      id,
      command as Parameters<
        typeof this.client.rtcProviderRoutes.rtc.providerRoutes.update
      >[1],
    );
    if (!response) {
      throw new Error("Invalid response: missing provider route data");
    }
    return readSdkWorkItem<ProviderRoute>(response);
  }

  async disable(id: string, reason?: string): Promise<ProviderRoute> {
    const response = await this.client.rtcProviderRoutes.rtc.providerRoutes.disable(id, {
      reason,
    });
    if (!response) {
      throw new Error("Invalid response: missing provider route data");
    }
    return readSdkWorkItem<ProviderRoute>(response);
  }
}
