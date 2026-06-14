import type { ProviderAccount, ProviderAccountCommand } from "../types/providerAccount";

interface ListResponse {
  items: ProviderAccount[];
  nextCursor?: string;
}

export class ProviderAccountService {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken?: () => string | undefined,
  ) {}

  async list(params?: { provider?: string; status?: string }): Promise<ListResponse> {
    const query = new URLSearchParams();
    if (params?.provider) query.set("provider", params.provider);
    if (params?.status) query.set("status", params.status);
    return this.request("GET", `/provider_accounts?${query}`);
  }

  async get(id: string): Promise<ProviderAccount> {
    return this.request("GET", `/provider_accounts/${id}`);
  }

  async create(command: ProviderAccountCommand): Promise<ProviderAccount> {
    return this.request("POST", "/provider_accounts", command);
  }

  async update(id: string, command: ProviderAccountCommand): Promise<ProviderAccount> {
    return this.request("PATCH", `/provider_accounts/${id}`, command);
  }

  async disable(id: string, reason?: string): Promise<ProviderAccount> {
    return this.request("POST", `/provider_accounts/${id}/disable`, { reason });
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
