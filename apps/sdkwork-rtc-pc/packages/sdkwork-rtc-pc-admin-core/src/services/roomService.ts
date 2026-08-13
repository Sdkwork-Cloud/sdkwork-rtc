import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { Room, RoomCreateCommand, RoomListParams, RoomListResponse } from "../types/room";
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
      status: params?.status,
      ownerUserId: params?.ownerUserId,
      createdAfter: params?.createdAfter,
    });
    const page = readSdkWorkListPage<Room>(response);
    return {
      items: page.items,
      nextCursor: page.nextCursor,
    };
  }

  async get(id: string): Promise<Room> {
    const response = await this.client.rtcRooms.rtc.rooms.retrieve(id);
    if (!response) {
      throw new Error(`RTC room not found: ${id}`);
    }
    return readSdkWorkItem<Room>(response);
  }

  async create(command: RoomCreateCommand): Promise<Room> {
    const response = await this.client.rtcRooms.rtc.rooms.create({
      title: command.title,
      roomId: command.roomId ?? null,
    });
    return readSdkWorkItem<Room>(response);
  }
}
