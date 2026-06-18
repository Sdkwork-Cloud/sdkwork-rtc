import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { Room, RoomListParams, RoomListResponse } from "../types/room";
import { createBackendRtcClient, type RtcBackendClientOptions } from "./backendClient";

export class RoomService {
  private readonly client;

  constructor(
    baseUrl: string,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = createBackendRtcClient(baseUrl, tokenManagerOrOptions);
  }

  async list(params?: RoomListParams): Promise<RoomListResponse> {
    const response = await this.client.rtcRooms.rtc.rooms.list({
      page: params?.page,
      pageSize: params?.limit,
      cursor: params?.cursor,
      q: params?.search,
      sort: params?.sort,
    });
    return {
      items: (response.data?.items ?? []) as Room[],
      nextCursor: (response.data?.nextCursor as string | undefined) ?? undefined,
    };
  }

  async get(id: string): Promise<Room> {
    const response = await this.client.rtcRooms.rtc.rooms.retrieve(id);
    if (!response.data) {
      throw new Error(`RTC room not found: ${id}`);
    }
    return response.data as Room;
  }
}
