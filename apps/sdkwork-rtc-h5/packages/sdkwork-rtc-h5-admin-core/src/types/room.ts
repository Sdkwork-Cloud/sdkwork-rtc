export interface Room {
  id: string;
  tenantId: string;
  organizationId: string;
  ownerUserId: string;
  title: string;
  status: "active" | "archived" | "disabled";
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomListParams {
  search?: string;
  status?: "active" | "archived" | "disabled";
  ownerUserId?: string;
  cursor?: string;
  limit?: number;
  page?: number;
  sort?: string;
}

export interface RoomListResponse {
  items: Room[];
  nextCursor?: string;
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
