import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type {
  ProviderApplication,
  ProviderApplicationCommand,
} from "../types/providerApplication";
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
    // The generated SDK unwraps the sdkwork-v3 envelope, so the response is
    // already the `data` payload ({ items, pageInfo }).
    const nextCursor = response.pageInfo?.nextCursor;
    return {
      items: response.items,
      nextCursor: nextCursor && nextCursor.length > 0 ? nextCursor : null,
    };
  }

  async get(id: string): Promise<ProviderApplication> {
    const response =
      await this.client.rtcProviderApplications.rtc.providerApplications.retrieve(id);
    if (!response) {
      throw new Error(`RTC provider application not found: ${id}`);
    }
    return response;
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
    if (!response) {
      throw new Error("Invalid response: missing provider application data");
    }
    return response;
  }

  async update(id: string, command: ProviderApplicationCommand): Promise<ProviderApplication> {
    const response =
      await this.client.rtcProviderApplications.rtc.providerApplications.update(
        id,
        command as Parameters<
          typeof this.client.rtcProviderApplications.rtc.providerApplications.update
        >[1],
      );
    if (!response) {
      throw new Error("Invalid response: missing provider application data");
    }
    return response;
  }

  async disable(id: string, reason?: string): Promise<ProviderApplication> {
    const response =
      await this.client.rtcProviderApplications.rtc.providerApplications.disable(id, {
        reason,
      });
    if (!response) {
      throw new Error("Invalid response: missing provider application data");
    }
    return response;
  }
}
