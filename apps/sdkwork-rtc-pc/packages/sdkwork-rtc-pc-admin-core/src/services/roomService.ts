import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type { Room, RoomCreateCommand, RoomListParams, RoomListResponse } from "../types/room";
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
    // The generated SDK unwraps the sdkwork-v3 envelope, so the response is
    // already the `data` payload ({ items, pageInfo }).
    const nextCursor = response.pageInfo?.nextCursor;
    return {
      items: response.items,
      nextCursor: nextCursor && nextCursor.length > 0 ? nextCursor : undefined,
    };
  }

  async get(id: string): Promise<Room> {
    const response = await this.client.rtcRooms.rtc.rooms.retrieve(id);
    if (!response) {
      throw new Error(`RTC room not found: ${id}`);
    }
    return response;
  }

  async create(command: RoomCreateCommand): Promise<Room> {
    const response = await this.client.rtcRooms.rtc.rooms.create({
      title: command.title,
      roomId: command.roomId ?? null,
    });
    return response;
  }
}
