import { useState, useMemo, useCallback } from "react";
import type { Room, RoomBatchAction } from "../types/room";
import { buildRoomSortParam, parseRoomSortParam, type RoomSortField } from "../types/room";
import { RoomBatchActions } from "./RoomBatchActions";

interface Props {
  rooms: Room[];
  onSelect: (room: Room) => void;
  onBatchAction: (action: RoomBatchAction) => void;
  onRefresh: () => void;
  loading?: boolean;
  sort?: string;
  onSortChange?: (sort: string) => void;
  fetchAllRooms?: () => Promise<Room[]>;
}

export function RoomList({
  rooms,
  onSelect,
  onBatchAction,
  onRefresh,
  loading,
  sort,
  onSortChange,
  fetchAllRooms,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const { field: sortField, direction: sortDirection } = parseRoomSortParam(sort);

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
    if (selectedIds.size === rooms.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rooms.map((r) => r.id)));
    }
  }, [rooms, selectedIds.size]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSort = useCallback(
    (field: RoomSortField) => {
      if (!onSortChange) {
        return;
      }
      const nextDirection =
        sortField === field ? (sortDirection === "asc" ? "desc" : "asc") : "asc";
      onSortChange(buildRoomSortParam(field, nextDirection));
    },
    [onSortChange, sortDirection, sortField],
  );

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

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    try {
      const roomsToExport = fetchAllRooms ? await fetchAllRooms() : rooms;
      exportToCsv(roomsToExport);
    } finally {
      setExporting(false);
    }
  }, [exportToCsv, fetchAllRooms, rooms]);

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
          <button onClick={onRefresh} disabled={loading || exporting}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button onClick={() => void handleExportAll()} disabled={exporting || loading}>
            {exporting ? "Exporting..." : "Export All"}
          </button>
        </div>
      </div>

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
                  checked={selectedIds.size === rooms.length && rooms.length > 0}
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
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No rooms found. Create your first room to get started.
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
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
          {rooms.length} room(s) displayed | {selectedIds.size} selected
        </span>
      </div>
    </div>
  );
}
