import type { ProviderApplication, ProviderApplicationCommand } from "../types/providerApplication";

interface ListResponse {
  items: ProviderApplication[];
  nextCursor?: string;
}

export class ProviderApplicationService {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken?: () => string | undefined,
  ) {}

  async list(accountId: string): Promise<ListResponse> {
    return this.request("GET", `/provider_accounts/${accountId}/applications`);
  }

  async get(id: string): Promise<ProviderApplication> {
    return this.request("GET", `/provider_applications/${id}`);
  }

  async create(accountId: string, command: ProviderApplicationCommand): Promise<ProviderApplication> {
    return this.request("POST", `/provider_accounts/${accountId}/applications`, command);
  }

  async update(id: string, command: ProviderApplicationCommand): Promise<ProviderApplication> {
    return this.request("PATCH", `/provider_applications/${id}`, command);
  }

  async disable(id: string, reason?: string): Promise<ProviderApplication> {
    return this.request("POST", `/provider_applications/${id}/disable`, { reason });
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = this.getToken?.();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
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
