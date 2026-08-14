import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { ProviderProfile, ProviderProfileCommand } from "../types/providerProfile";
import { resolveBackendRtcClient, type RtcBackendClientOptions, type RtcBackendClientSource } from "./backendClient";

interface ListResponse {
  items: ProviderProfile[];
  nextCursor?: string | null;
}

export class ProviderProfileService {
  private readonly client;

  constructor(
    baseUrlOrClient: RtcBackendClientSource,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = resolveBackendRtcClient(baseUrlOrClient, tokenManagerOrOptions);
  }

  async list(params?: {
    provider?: string;
    page?: number;
    limit?: number;
    cursor?: string;
    search?: string;
    sort?: string;
  }): Promise<ListResponse> {
    const response = await this.client.rtcProviderProfiles.rtc.providerProfiles.list({
      page: params?.page,
      pageSize: params?.limit,
      cursor: params?.cursor,
      q: params?.search,
      sort: params?.sort,
    });
    // The generated SDK unwraps the sdkwork-v3 envelope, so the response is
    // already the `data` payload ({ items, pageInfo }).
    const nextCursor = response.pageInfo?.nextCursor;
    return {
      items: response.items,
      nextCursor: nextCursor && nextCursor.length > 0 ? nextCursor : null,
    };
  }

  async get(id: string): Promise<ProviderProfile> {
    const response = await this.client.rtcProviderProfiles.rtc.providerProfiles.retrieve(id);
    if (!response) {
      throw new Error(`RTC provider profile not found: ${id}`);
    }
    return response;
  }

  async create(command: ProviderProfileCommand): Promise<ProviderProfile> {
    const response = await this.client.rtcProviderProfiles.rtc.providerProfiles.create(
      command as Parameters<
        typeof this.client.rtcProviderProfiles.rtc.providerProfiles.create
      >[0],
    );
    if (!response) {
      throw new Error("Invalid response: missing provider profile data");
    }
    return response;
  }

  async update(id: string, command: ProviderProfileCommand): Promise<ProviderProfile> {
    const response = await this.client.rtcProviderProfiles.rtc.providerProfiles.update(
      id,
      command as Parameters<
        typeof this.client.rtcProviderProfiles.rtc.providerProfiles.update
      >[1],
    );
    if (!response) {
      throw new Error("Invalid response: missing provider profile data");
    }
    return response;
  }

  async disable(id: string, reason?: string): Promise<ProviderProfile> {
    const response = await this.client.rtcProviderProfiles.rtc.providerProfiles.disable(id, {
      reason,
    });
    if (!response) {
      throw new Error("Invalid response: missing provider profile data");
    }
    return response;
  }

  async verify(id: string, queryKind: string, timeoutMs?: number): Promise<unknown> {
    const response = await this.client.rtcProviderProfiles.rtc.providerProfiles.verify(id, {
      queryKind: queryKind as Parameters<
        typeof this.client.rtcProviderProfiles.rtc.providerProfiles.verify
      >[1]["queryKind"],
      timeoutMs,
    });
    return response;
  }

  async configureCapabilities(
    id: string,
    enabledCapabilities: string[],
    disabledCapabilities: string[],
  ): Promise<ProviderProfile> {
    const response = await this.client.rtcProviderProfiles.rtc.providerProfiles.capabilities.configure(
      id,
      {
        enabledCapabilities,
        disabledCapabilities,
      },
    );
    return response;
  }
}
