import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { ProviderAccount, ProviderAccountCommand } from "../types/providerAccount";
import { resolveBackendRtcClient, type RtcBackendClientOptions, type RtcBackendClientSource } from "./backendClient";

interface ListResponse {
  items: ProviderAccount[];
  nextCursor?: string | null;
}

export class ProviderAccountService {
  private readonly client;

  constructor(
    baseUrlOrClient: RtcBackendClientSource,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = resolveBackendRtcClient(baseUrlOrClient, tokenManagerOrOptions);
  }

  async list(params?: {
    provider?: string;
    status?: string;
    page?: number;
    limit?: number;
    cursor?: string;
    search?: string;
    sort?: string;
  }): Promise<ListResponse> {
    const response = await this.client.rtcProviderAccounts.rtc.providerAccounts.list({
      page: params?.page,
      pageSize: params?.limit,
      cursor: params?.cursor,
      q: params?.search,
      sort: params?.sort,
    });
    return {
      items: (response.data?.items ?? []) as ProviderAccount[],
      nextCursor: (response.data?.nextCursor as string | null | undefined) ?? null,
    };
  }

  async get(id: string): Promise<ProviderAccount> {
    const response = await this.client.rtcProviderAccounts.rtc.providerAccounts.retrieve(id);
    if (!response.data) {
      throw new Error(`RTC provider account not found: ${id}`);
    }
    return response.data as ProviderAccount;
  }

  async create(command: ProviderAccountCommand): Promise<ProviderAccount> {
    const response = await this.client.rtcProviderAccounts.rtc.providerAccounts.create(
      command as Parameters<
        typeof this.client.rtcProviderAccounts.rtc.providerAccounts.create
      >[0],
    );
    if (!response.data) {
      throw new Error("Invalid response: missing provider account data");
    }
    return response.data as ProviderAccount;
  }

  async update(id: string, command: ProviderAccountCommand): Promise<ProviderAccount> {
    const response = await this.client.rtcProviderAccounts.rtc.providerAccounts.update(
      id,
      command as Parameters<
        typeof this.client.rtcProviderAccounts.rtc.providerAccounts.update
      >[1],
    );
    if (!response.data) {
      throw new Error("Invalid response: missing provider account data");
    }
    return response.data as ProviderAccount;
  }

  async disable(id: string, reason?: string): Promise<ProviderAccount> {
    const response = await this.client.rtcProviderAccounts.rtc.providerAccounts.disable(id, {
      reason,
    });
    if (!response.data) {
      throw new Error("Invalid response: missing provider account data");
    }
    return response.data as ProviderAccount;
  }
}
