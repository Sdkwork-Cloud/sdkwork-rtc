import type { RtcRoom } from "@sdkwork/rtc-backend-sdk";

/**
 * RTC room admin view model — the generated SDK `RtcRoom` (contract
 * authority) extended with optional display fields the admin UI renders
 * when present.
 */
export type Room = RtcRoom & {
  createdAt?: string;
  updatedAt?: string;
};

export interface RoomListParams {
  search?: string;
  status?: "active" | "archived" | "disabled";
  ownerUserId?: string;
  createdAfter?: string;
  cursor?: string;
  limit?: number;
  page?: number;
  sort?: string;
}

export interface RoomListResponse {
  items: Room[];
  nextCursor?: string;
}

export interface RoomCreateCommand {
  title: string;
  roomId?: string | null;
}

export interface RoomBatchAction {
  type: "archive" | "disable" | "delete" | "export";
  roomIds: string[];
  reason?: string;
}

export interface RoomFilterState {
  search: string;
  status: "all" | "active" | "archived" | "disabled";
  ownerUserId: string;
  dateRange: "all" | "today" | "week" | "month";
}

export type RoomSortField = "title" | "status" | "createdAt";

export function parseRoomSortParam(
  sort?: string,
): { field: RoomSortField; direction: "asc" | "desc" } {
  const trimmed = sort?.trim();
  if (!trimmed) {
    return { field: "createdAt", direction: "desc" };
  }
  if (trimmed.startsWith("-")) {
    const field = trimmed.slice(1);
    if (field === "title" || field === "status" || field === "createdAt") {
      return { field, direction: "desc" };
    }
  }
  if (trimmed === "title" || trimmed === "status" || trimmed === "createdAt") {
    return { field: trimmed, direction: "asc" };
  }
  return { field: "createdAt", direction: "desc" };
}

export function buildRoomSortParam(field: RoomSortField, direction: "asc" | "desc"): string {
  return direction === "desc" ? `-${field}` : field;
}
