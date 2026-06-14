import type { ProviderRoute, ProviderRouteCommand } from "../types/providerRoute";

interface ListResponse {
  items: ProviderRoute[];
  nextCursor?: string;
}

export class ProviderRouteService {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken?: () => string | undefined,
  ) {}

  async list(): Promise<ListResponse> {
    return this.request("GET", "/provider_routes");
  }

  async create(command: ProviderRouteCommand): Promise<ProviderRoute> {
    return this.request("POST", "/provider_routes", command);
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
