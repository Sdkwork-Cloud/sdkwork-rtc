import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { ProviderCredential, ProviderCredentialCommand } from "../types/providerCredential";
import { readSdkWorkItem, readSdkWorkListPage } from "../sdk/index.js";
import { resolveBackendRtcClient, type RtcBackendClientOptions, type RtcBackendClientSource } from "./backendClient";

interface ListResponse {
  items: ProviderCredential[];
  nextCursor?: string | null;
}

export class ProviderCredentialService {
  private readonly client;

  constructor(
    baseUrlOrClient: RtcBackendClientSource,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = resolveBackendRtcClient(baseUrlOrClient, tokenManagerOrOptions);
  }

  async list(
    providerApplicationId: string,
    params?: {
      page?: number;
      limit?: number;
      cursor?: string;
      search?: string;
      sort?: string;
    },
  ): Promise<ListResponse> {
    const response =
      await this.client.rtcProviderCredentials.rtc.providerApplications.credentials.list(
        providerApplicationId,
        {
          page: params?.page,
          pageSize: params?.limit,
          cursor: params?.cursor,
          q: params?.search,
          sort: params?.sort,
        },
      );
    const page = readSdkWorkListPage<ProviderCredential>(response.data);
    return {
      items: page.items,
      nextCursor: page.nextCursor ?? null,
    };
  }

  async get(id: string): Promise<ProviderCredential> {
    const response =
      await this.client.rtcProviderCredentials.rtc.providerCredentials.retrieve(id);
    if (!response.data) {
      throw new Error(`RTC provider credential not found: ${id}`);
    }
    return readSdkWorkItem<ProviderCredential>(response.data);
  }

  async create(
    providerApplicationId: string,
    command: ProviderCredentialCommand,
  ): Promise<ProviderCredential> {
    const response =
      await this.client.rtcProviderCredentials.rtc.providerApplications.credentials.create(
        providerApplicationId,
        command as Parameters<
          typeof this.client.rtcProviderCredentials.rtc.providerApplications.credentials.create
        >[1],
      );
    if (!response.data) {
      throw new Error("Invalid response: missing provider credential data");
    }
    return readSdkWorkItem<ProviderCredential>(response.data);
  }

  async update(id: string, command: ProviderCredentialCommand): Promise<ProviderCredential> {
    const response =
      await this.client.rtcProviderCredentials.rtc.providerCredentials.update(
        id,
        command as Parameters<
          typeof this.client.rtcProviderCredentials.rtc.providerCredentials.update
        >[1],
      );
    if (!response.data) {
      throw new Error("Invalid response: missing provider credential data");
    }
    return readSdkWorkItem<ProviderCredential>(response.data);
  }

  async revoke(id: string, reason?: string): Promise<ProviderCredential> {
    const response = await this.client.rtcProviderCredentials.rtc.providerCredentials.revoke(id, {
      reason,
    });
    if (!response.data) {
      throw new Error("Invalid response: missing provider credential data");
    }
    return readSdkWorkItem<ProviderCredential>(response.data);
  }
}
