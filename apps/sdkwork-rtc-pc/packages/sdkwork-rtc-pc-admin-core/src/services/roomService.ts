import type { Room, RoomListParams, RoomListResponse, RoomBatchAction } from "../types/room";

export class RoomService {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken?: () => string | undefined,
  ) {}

  async list(params?: RoomListParams): Promise<RoomListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set("q", params.search);
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.ownerUserId) query.set("ownerUserId", params.ownerUserId);
    if (params?.cursor) query.set("cursor", params.cursor);
    if (params?.limit) query.set("limit", String(params.limit));
    return this.request("GET", `/rooms?${query}`);
  }

  async get(id: string): Promise<Room> {
    return this.request("GET", `/rooms/${id}`);
  }

  async disable(id: string, reason?: string): Promise<Room> {
    return this.request("POST", `/rooms/${id}/disable`, { reason });
  }

  async archive(id: string, reason?: string): Promise<Room> {
    return this.request("POST", `/rooms/${id}/archive`, { reason });
  }

  async batchAction(action: RoomBatchAction): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const roomId of action.roomIds) {
      try {
        switch (action.type) {
          case "archive":
            await this.archive(roomId, action.reason);
            break;
          case "disable":
            await this.disable(roomId, action.reason);
            break;
          default:
            failed.push(roomId);
            continue;
        }
        success.push(roomId);
      } catch {
        failed.push(roomId);
      }
    }

    return { success, failed };
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
