import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { ProviderConfigSchema } from "../types/providerSchema";
import { readSdkWorkItem } from "../sdk/index.js";
import { resolveBackendRtcClient, type RtcBackendClientOptions, type RtcBackendClientSource } from "./backendClient";

export class ProviderSchemaService {
  private readonly client;

  constructor(
    baseUrlOrClient: RtcBackendClientSource,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = resolveBackendRtcClient(baseUrlOrClient, tokenManagerOrOptions);
  }

  async listSchemas(): Promise<ProviderConfigSchema[]> {
    const response = await this.client.rtcProviderSchemas.rtc.providerSchemas.list();
    if (!response.data) {
      throw new Error("Invalid response: missing provider schema data");
    }
    return readSdkWorkItem<ProviderConfigSchema[]>(response.data);
  }

  async getSchema(provider: string): Promise<ProviderConfigSchema> {
    const response = await this.client.rtcProviderSchemas.rtc.providerSchemas.retrieve(provider);
    if (!response.data) {
      throw new Error(`RTC provider schema not found: ${provider}`);
    }
    return readSdkWorkItem<ProviderConfigSchema>(response.data);
  }
}
