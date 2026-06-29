import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { Room, RoomListParams, RoomListResponse } from "../types/room";
import { readSdkWorkItem, readSdkWorkListPage } from "../sdk/index.js";
import { resolveBackendRtcClient, type RtcBackendClientOptions, type RtcBackendClientSource } from "./backendClient";

export class RoomService {
  private readonly client;

  constructor(
    baseUrlOrClient: RtcBackendClientSource,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = resolveBackendRtcClient(baseUrlOrClient, tokenManagerOrOptions);
  }

  async list(params?: RoomListParams): Promise<RoomListResponse> {
    const response = await this.client.rtcRooms.rtc.rooms.list({
      page: params?.page,
      pageSize: params?.limit,
      cursor: params?.cursor,
      q: params?.search,
      sort: params?.sort,
    });
    const page = readSdkWorkListPage<Room>(response.data);
    return {
      items: page.items,
      nextCursor: page.nextCursor,
    };
  }

  async get(id: string): Promise<Room> {
    const response = await this.client.rtcRooms.rtc.rooms.retrieve(id);
    if (!response.data) {
      throw new Error(`RTC room not found: ${id}`);
    }
    return readSdkWorkItem<Room>(response.data);
  }
}
