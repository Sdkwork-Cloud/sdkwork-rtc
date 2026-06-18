import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type {
  ProviderApplication,
  ProviderApplicationCommand,
} from "../types/providerApplication";
import { createBackendRtcClient, type RtcBackendClientOptions } from "./backendClient";

interface ListResponse {
  items: ProviderApplication[];
  nextCursor?: string | null;
}

export class ProviderApplicationService {
  private readonly client;

  constructor(
    baseUrl: string,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = createBackendRtcClient(baseUrl, tokenManagerOrOptions);
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
    return {
      items: (response.data?.items ?? []) as ProviderApplication[],
      nextCursor: (response.data?.nextCursor as string | null | undefined) ?? null,
    };
  }

  async get(id: string): Promise<ProviderApplication> {
    const response =
      await this.client.rtcProviderApplications.rtc.providerApplications.retrieve(id);
    if (!response.data) {
      throw new Error(`RTC provider application not found: ${id}`);
    }
    return response.data as ProviderApplication;
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
    return response.data as ProviderApplication;
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
    return response.data as ProviderApplication;
  }

  async disable(id: string, reason?: string): Promise<ProviderApplication> {
    const response =
      await this.client.rtcProviderApplications.rtc.providerApplications.disable(id, {
        reason,
      });
    if (!response.data) {
      throw new Error("Invalid response: missing provider application data");
    }
    return response.data as ProviderApplication;
  }
}
