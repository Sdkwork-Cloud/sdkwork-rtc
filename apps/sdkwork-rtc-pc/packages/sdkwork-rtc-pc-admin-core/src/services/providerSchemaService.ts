import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { ProviderConfigSchema } from "../types/providerSchema";
import { createBackendRtcClient, type RtcBackendClientOptions } from "./backendClient";

interface ApiEnvelope<T> {
  data?: T;
  message?: string;
}

export class ProviderSchemaService {
  private readonly client;

  constructor(
    baseUrl: string,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = createBackendRtcClient(baseUrl, tokenManagerOrOptions);
  }

  async listSchemas(): Promise<ProviderConfigSchema[]> {
    const response = await this.client.http.get<ApiEnvelope<ProviderConfigSchema[]>>(
      "/backend/v3/api/rtc/provider_schemas",
    );
    if (!response.data) {
      throw new Error("Invalid response: missing provider schema data");
    }
    return response.data;
  }

  async getSchema(provider: string): Promise<ProviderConfigSchema> {
    const response = await this.client.http.get<ApiEnvelope<ProviderConfigSchema>>(
      `/backend/v3/api/rtc/provider_schemas/${encodeURIComponent(provider)}`,
    );
    if (!response.data) {
      throw new Error(`RTC provider schema not found: ${provider}`);
    }
    return response.data;
  }
}
