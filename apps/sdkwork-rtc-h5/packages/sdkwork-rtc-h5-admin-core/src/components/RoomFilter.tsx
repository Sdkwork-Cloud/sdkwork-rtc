import type { RoomFilterState } from "../types/room";

interface Props {
  filter: RoomFilterState;
  onChange: (filter: RoomFilterState) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

export function RoomFilter({ filter, onChange, onReset, totalCount, filteredCount }: Props) {
  const updateFilter = (updates: Partial<RoomFilterState>) => {
    onChange({ ...filter, ...updates });
  };

  const hasActiveFilters =
    filter.search !== "" ||
    filter.status !== "all" ||
    filter.ownerUserId !== "" ||
    filter.dateRange !== "all";

  return (
    <div className="room-filter">
      <div className="filter-row">
        <div className="filter-field search-field">
          <input
            type="text"
            placeholder="Search rooms by title, ID, or owner..."
            value={filter.search}
            onChange={(e) => updateFilter({ search: e.target.value })}
          />
        </div>

        <div className="filter-field">
          <select
            value={filter.status}
            onChange={(e) =>
              updateFilter({ status: e.target.value as RoomFilterState["status"] })
            }
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <div className="filter-field">
          <select
            value={filter.dateRange}
            onChange={(e) =>
              updateFilter({ dateRange: e.target.value as RoomFilterState["dateRange"] })
            }
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div className="filter-field">
          <input
            type="text"
            placeholder="Owner User ID"
            value={filter.ownerUserId}
            onChange={(e) => updateFilter({ ownerUserId: e.target.value })}
          />
        </div>

        {hasActiveFilters && (
          <button className="filter-reset" onClick={onReset}>
            Clear Filters
          </button>
        )}
      </div>

      <div className="filter-summary">
        <span>
          Showing {filteredCount} of {totalCount} rooms
        </span>
        {hasActiveFilters && <span className="filter-active-badge">Filtered</span>}
      </div>
    </div>
  );
}

export const DEFAULT_ROOM_FILTER: RoomFilterState = {
  search: "",
  status: "all",
  ownerUserId: "",
  dateRange: "all",
};

export function filterRooms(
  rooms: import("../types/room").Room[],
  filter: RoomFilterState,
): import("../types/room").Room[] {
  let filtered = rooms;

  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filtered = filtered.filter(
      (room) =>
        room.title.toLowerCase().includes(searchLower) ||
        room.id.toLowerCase().includes(searchLower) ||
        room.ownerUserId.toLowerCase().includes(searchLower),
    );
  }

  if (filter.status !== "all") {
    filtered = filtered.filter((room) => room.status === filter.status);
  }

  if (filter.ownerUserId) {
    filtered = filtered.filter((room) => room.ownerUserId === filter.ownerUserId);
  }

  if (filter.dateRange !== "all") {
    const now = new Date();
    let cutoff: Date;
    switch (filter.dateRange) {
      case "today":
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      default:
        cutoff = new Date(0);
    }
    filtered = filtered.filter((room) => {
      if (!room.createdAt) return true;
      return new Date(room.createdAt) >= cutoff;
    });
  }

  return filtered;
}
