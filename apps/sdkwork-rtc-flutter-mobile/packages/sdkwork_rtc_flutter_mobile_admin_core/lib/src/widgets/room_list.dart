import 'package:flutter/material.dart';
import '../models/room.dart';

class RoomListWidget extends StatelessWidget {
  final List<Room> rooms;
  final ValueChanged<Room> onSelect;
  final Set<String> selectedIds;
  final ValueChanged<String> onToggleSelect;
  final VoidCallback onSelectAll;
  final bool allSelected;

  const RoomListWidget({
    super.key,
    required this.rooms,
    required this.onSelect,
    required this.selectedIds,
    required this.onToggleSelect,
    required this.onSelectAll,
    required this.allSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Row(
            children: [
              Checkbox(
                value: allSelected,
                onChanged: (_) => onSelectAll(),
              ),
              const Text('Select All'),
              const Spacer(),
              Text('${rooms.length} room(s)'),
            ],
          ),
        ),
        Expanded(
          child: rooms.isEmpty
              ? const Center(child: Text('No rooms match the current filters.'))
              : ListView.builder(
                  itemCount: rooms.length,
                  itemBuilder: (context, index) {
                    final room = rooms[index];
                    final isSelected = selectedIds.contains(room.id);
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                      color: isSelected ? Colors.blue.shade50 : null,
                      child: ListTile(
                        leading: Checkbox(
                          value: isSelected,
                          onChanged: (_) => onToggleSelect(room.id),
                        ),
                        title: Text(room.title),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('ID: ${room.id}'),
                            Text('Owner: ${room.ownerUserId}'),
                          ],
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _buildStatusBadge(room.status),
                            IconButton(
                              icon: const Icon(Icons.arrow_forward),
                              onPressed: () => onSelect(room),
                            ),
                          ],
                        ),
                        onTap: () => onSelect(room),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    switch (status) {
      case 'active':
        color = Colors.green;
        break;
      case 'archived':
        color = Colors.grey;
        break;
      case 'disabled':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12.0),
        border: Border.all(color: color),
      ),
      child: Text(
        status,
        style: TextStyle(color: color, fontSize: 12.0),
      ),
    );
  }
}
