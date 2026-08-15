import { useTranslation } from "react-i18next";
import type { RoomFilterState } from "../types/room";

interface Props {
  filter: RoomFilterState;
  onChange: (filter: RoomFilterState) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

export function RoomFilter({ filter, onChange, onReset, totalCount, filteredCount }: Props) {
  const { t } = useTranslation();
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
            placeholder={t("admin.rtc.rooms.filter.search", "Search rooms by title, ID, or owner...")}
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
            <option value="all">{t("admin.rtc.rooms.filter.allStatus", "All Status")}</option>
            <option value="active">{t("admin.rtc.status.active", "Active")}</option>
            <option value="archived">{t("admin.rtc.status.archived", "Archived")}</option>
            <option value="disabled">{t("admin.rtc.status.disabled", "Disabled")}</option>
          </select>
        </div>

        <div className="filter-field">
          <select
            value={filter.dateRange}
            onChange={(e) =>
              updateFilter({ dateRange: e.target.value as RoomFilterState["dateRange"] })
            }
          >
            <option value="all">{t("admin.rtc.rooms.filter.allTime", "All Time")}</option>
            <option value="today">{t("admin.rtc.rooms.filter.today", "Today")}</option>
            <option value="week">{t("admin.rtc.rooms.filter.thisWeek", "This Week")}</option>
            <option value="month">{t("admin.rtc.rooms.filter.thisMonth", "This Month")}</option>
          </select>
        </div>

        <div className="filter-field">
          <input
            type="text"
            placeholder={t("admin.rtc.rooms.filter.owner", "Owner User ID")}
            value={filter.ownerUserId}
            onChange={(e) => updateFilter({ ownerUserId: e.target.value })}
          />
        </div>

        {hasActiveFilters && (
          <button className="filter-reset" onClick={onReset}>
            {t("admin.rtc.rooms.filter.clear", "Clear Filters")}
          </button>
        )}
      </div>

      <div className="filter-summary">
        <span>
          {t("admin.rtc.rooms.filter.summary", "Showing {{filtered}} of {{total}} rooms", {
            filtered: filteredCount,
            total: totalCount,
          })}
        </span>
        {hasActiveFilters && (
          <span className="filter-active-badge">{t("admin.rtc.rooms.filter.filtered", "Filtered")}</span>
        )}
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

export function roomDateRangeCreatedAfter(
  dateRange: RoomFilterState["dateRange"],
): string | undefined {
  if (dateRange === "all") {
    return undefined;
  }
  const now = new Date();
  let cutoff: Date;
  switch (dateRange) {
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
      return undefined;
  }
  return cutoff.toISOString();
}

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
