import type { ProviderCredential, ProviderCredentialCommand } from "../types/providerCredential";

interface ListResponse {
  items: ProviderCredential[];
  nextCursor?: string;
}

export class ProviderCredentialService {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken?: () => string | undefined,
  ) {}

  async list(applicationId: string): Promise<ListResponse> {
    return this.request("GET", `/provider_applications/${applicationId}/credentials`);
  }

  async get(id: string): Promise<ProviderCredential> {
    return this.request("GET", `/provider_credentials/${id}`);
  }

  async create(applicationId: string, command: ProviderCredentialCommand): Promise<ProviderCredential> {
    return this.request("POST", `/provider_applications/${applicationId}/credentials`, command);
  }

  async update(id: string, command: ProviderCredentialCommand): Promise<ProviderCredential> {
    return this.request("PATCH", `/provider_credentials/${id}`, command);
  }

  async revoke(id: string, reason?: string): Promise<ProviderCredential> {
    return this.request("POST", `/provider_credentials/${id}/revoke`, { reason });
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
