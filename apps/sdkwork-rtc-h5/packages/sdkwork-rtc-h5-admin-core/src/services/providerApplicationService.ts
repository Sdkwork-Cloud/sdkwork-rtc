import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type {
  ProviderApplication,
  ProviderApplicationCommand,
} from "../types/providerApplication";
import { readSdkWorkItem, readSdkWorkListPage } from "../sdk/index.js";
import { resolveBackendRtcClient, type RtcBackendClientOptions, type RtcBackendClientSource } from "./backendClient";

interface ListResponse {
  items: ProviderApplication[];
  nextCursor?: string | null;
}

export class ProviderApplicationService {
  private readonly client;

  constructor(
    baseUrlOrClient: RtcBackendClientSource,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = resolveBackendRtcClient(baseUrlOrClient, tokenManagerOrOptions);
  }

  async list(
    providerAccountId: string,
    params?: {
      page?: number;
      limit?: number;
      cursor?: string;
      search?: string;
      sort?: string;
    },
  ): Promise<ListResponse> {
    const response =
      await this.client.rtcProviderApplications.rtc.providerAccounts.applications.list(
        providerAccountId,
        {
          page: params?.page,
          pageSize: params?.limit,
          cursor: params?.cursor,
          q: params?.search,
          sort: params?.sort,
        },
      );
    const page = readSdkWorkListPage<ProviderApplication>(response.data);
    return {
      items: page.items,
      nextCursor: page.nextCursor ?? null,
    };
  }

  async get(id: string): Promise<ProviderApplication> {
    const response =
      await this.client.rtcProviderApplications.rtc.providerApplications.retrieve(id);
    if (!response.data) {
      throw new Error(`RTC provider application not found: ${id}`);
    }
    return readSdkWorkItem<ProviderApplication>(response.data);
  }

  async create(
    providerAccountId: string,
    command: ProviderApplicationCommand,
  ): Promise<ProviderApplication> {
    const response =
      await this.client.rtcProviderApplications.rtc.providerAccounts.applications.create(
        providerAccountId,
        command as Parameters<
          typeof this.client.rtcProviderApplications.rtc.providerAccounts.applications.create
        >[1],
      );
    if (!response.data) {
      throw new Error("Invalid response: missing provider application data");
    }
    return readSdkWorkItem<ProviderApplication>(response.data);
  }

  async update(id: string, command: ProviderApplicationCommand): Promise<ProviderApplication> {
    const response =
      await this.client.rtcProviderApplications.rtc.providerApplications.update(
        id,
        command as Parameters<
          typeof this.client.rtcProviderApplications.rtc.providerApplications.update
        >[1],
      );
    if (!response.data) {
      throw new Error("Invalid response: missing provider application data");
    }
    return readSdkWorkItem<ProviderApplication>(response.data);
  }

  async disable(id: string, reason?: string): Promise<ProviderApplication> {
    const response =
      await this.client.rtcProviderApplications.rtc.providerApplications.disable(id, {
        reason,
      });
    if (!response.data) {
      throw new Error("Invalid response: missing provider application data");
    }
    return readSdkWorkItem<ProviderApplication>(response.data);
  }
}
