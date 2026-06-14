import type { ProviderConfigSchema } from "../types/providerSchema";

export class ProviderSchemaService {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken?: () => string | undefined,
  ) {}

  async listSchemas(): Promise<ProviderConfigSchema[]> {
    return this.request("GET", "/provider_schemas");
  }

  async getSchema(provider: string): Promise<ProviderConfigSchema> {
    return this.request("GET", `/provider_schemas/${provider}`);
  }

  private async request<T>(method: string, path: string): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = this.getToken?.();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${this.baseUrl}${path}`, { method, headers });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message = errorBody?.message ?? `HTTP ${response.status}`;
      throw new Error(message);
    }
    const data = await response.json();
    if (data?.data === undefined) throw new Error("Invalid response: missing data field");
    return data.data;
  }
}
