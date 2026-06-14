import type { ProviderProfile, ProviderProfileCommand } from "../types/providerProfile";

interface ListResponse {
  items: ProviderProfile[];
  nextCursor?: string;
}

export class ProviderProfileService {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken?: () => string | undefined,
  ) {}

  async list(params?: { provider?: string }): Promise<ListResponse> {
    const query = new URLSearchParams();
    if (params?.provider) query.set("provider", params.provider);
    return this.request("GET", `/provider_profiles?${query}`);
  }

  async get(id: string): Promise<ProviderProfile> {
    return this.request("GET", `/provider_profiles/${id}`);
  }

  async create(command: ProviderProfileCommand): Promise<ProviderProfile> {
    return this.request("POST", "/provider_profiles", command);
  }

  async update(id: string, command: ProviderProfileCommand): Promise<ProviderProfile> {
    return this.request("PATCH", `/provider_profiles/${id}`, command);
  }

  async disable(id: string, reason?: string): Promise<ProviderProfile> {
    return this.request("POST", `/provider_profiles/${id}/disable`, { reason });
  }

  async verify(id: string, queryKind: string, timeoutMs?: number): Promise<unknown> {
    return this.request("POST", `/provider_profiles/${id}/verify`, { queryKind, timeoutMs });
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
