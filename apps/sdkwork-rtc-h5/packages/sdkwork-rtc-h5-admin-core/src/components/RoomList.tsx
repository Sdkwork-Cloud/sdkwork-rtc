import { useState, useMemo, useCallback } from "react";
import type { Room, RoomFilterState, RoomBatchAction } from "../types/room";
import { RoomFilter, DEFAULT_ROOM_FILTER, filterRooms } from "./RoomFilter";
import { RoomBatchActions } from "./RoomBatchActions";

interface Props {
  rooms: Room[];
  onSelect: (room: Room) => void;
  onBatchAction: (action: RoomBatchAction) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function RoomList({ rooms, onSelect, onBatchAction, onRefresh, loading }: Props) {
  const [filter, setFilter] = useState<RoomFilterState>(DEFAULT_ROOM_FILTER);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<"title" | "status" | "createdAt">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredRooms = useMemo(() => filterRooms(rooms, filter), [rooms, filter]);

  const sortedRooms = useMemo(() => {
    const sorted = [...filteredRooms].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "createdAt":
          comparison = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filteredRooms, sortField, sortDirection]);

  const selectedRooms = useMemo(
    () => rooms.filter((r) => selectedIds.has(r.id)),
    [rooms, selectedIds],
  );

  const handleToggleSelect = useCallback((roomId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === sortedRooms.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedRooms.map((r) => r.id)));
    }
  }, [sortedRooms, selectedIds.size]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSort = useCallback(
    (field: "title" | "status" | "createdAt") => {
      if (sortField === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField],
  );

  const handleResetFilter = useCallback(() => {
    setFilter(DEFAULT_ROOM_FILTER);
  }, []);

  const exportToCsv = useCallback((roomsToExport: Room[]) => {
    const escapeCsvField = (field: string): string => {
      if (field.includes(",") || field.includes('"') || field.includes("\n")) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    const headers = ["ID", "Title", "Status", "Owner", "Created At"];
    const rows = roomsToExport.map((r) => [
      r.id,
      r.title,
      r.status,
      r.ownerUserId,
      r.createdAt ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvField).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rooms-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleBatchAction = useCallback(
    (action: RoomBatchAction) => {
      if (action.type === "export") {
        const roomsToExport = rooms.filter((r) => action.roomIds.includes(r.id));
        exportToCsv(roomsToExport);
      } else {
        onBatchAction(action);
      }
    },
    [rooms, onBatchAction, exportToCsv],
  );

  return (
    <div className="room-list-container">
      <div className="room-list-header">
        <h2>Room Management</h2>
        <div className="room-list-actions">
          <button onClick={onRefresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button onClick={() => exportToCsv(sortedRooms)}>Export All</button>
        </div>
      </div>

      <RoomFilter
        filter={filter}
        onChange={setFilter}
        onReset={handleResetFilter}
        totalCount={rooms.length}
        filteredCount={filteredRooms.length}
      />

      <RoomBatchActions
        selectedRooms={selectedRooms}
        onAction={handleBatchAction}
        onClearSelection={handleClearSelection}
      />

      <div className="room-list-table-wrapper">
        <table className="room-list-table">
          <thead>
            <tr>
              <th className="col-checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.size === sortedRooms.length && sortedRooms.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="col-title sortable" onClick={() => handleSort("title")}>
                Title {sortField === "title" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="col-status sortable" onClick={() => handleSort("status")}>
                Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="col-owner">Owner</th>
              <th className="col-created sortable" onClick={() => handleSort("createdAt")}>
                Created {sortField === "createdAt" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRooms.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  {rooms.length === 0
                    ? "No rooms found. Create your first room to get started."
                    : "No rooms match the current filters."}
                </td>
              </tr>
            ) : (
              sortedRooms.map((room) => (
                <tr
                  key={room.id}
                  className={`room-row ${selectedIds.has(room.id) ? "selected" : ""}`}
                >
                  <td className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(room.id)}
                      onChange={() => handleToggleSelect(room.id)}
                    />
                  </td>
                  <td className="col-title">
                    <button className="room-link" onClick={() => onSelect(room)}>
                      {room.title}
                    </button>
                    <span className="room-id">{room.id}</span>
                  </td>
                  <td className="col-status">
                    <span className={`status-badge ${room.status}`}>{room.status}</span>
                  </td>
                  <td className="col-owner">{room.ownerUserId}</td>
                  <td className="col-created">
                    {room.createdAt ? new Date(room.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="col-actions">
                    <button className="action-btn" onClick={() => onSelect(room)}>
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="room-list-footer">
        <span>
          {sortedRooms.length} room(s) displayed | {selectedIds.size} selected
        </span>
      </div>
    </div>
  );
}
