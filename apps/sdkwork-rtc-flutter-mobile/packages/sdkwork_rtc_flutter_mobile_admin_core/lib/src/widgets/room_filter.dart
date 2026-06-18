import 'package:flutter/material.dart';
import '../models/room.dart';

class RoomFilterWidget extends StatelessWidget {
  final RoomFilterState filter;
  final ValueChanged<RoomFilterState> onChanged;
  final VoidCallback onReset;
  final int totalCount;
  final int filteredCount;

  const RoomFilterWidget({
    super.key,
    required this.filter,
    required this.onChanged,
    required this.onReset,
    required this.totalCount,
    required this.filteredCount,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          decoration: const InputDecoration(
            labelText: 'Search rooms',
            hintText: 'Search by title, ID, or owner',
            prefixIcon: Icon(Icons.search),
            border: OutlineInputBorder(),
          ),
          onChanged: (value) => onChanged(filter.copyWith(search: value)),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: DropdownButtonFormField<String>(
                key: ValueKey('status-${filter.status}'),
                initialValue: filter.status,
                decoration: const InputDecoration(
                  labelText: 'Status',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'all', child: Text('All Status')),
                  DropdownMenuItem(value: 'active', child: Text('Active')),
                  DropdownMenuItem(value: 'archived', child: Text('Archived')),
                  DropdownMenuItem(value: 'disabled', child: Text('Disabled')),
                ],
                onChanged: (value) => onChanged(filter.copyWith(status: value ?? 'all')),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: DropdownButtonFormField<String>(
                key: ValueKey('date-${filter.dateRange}'),
                initialValue: filter.dateRange,
                decoration: const InputDecoration(
                  labelText: 'Date Range',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'all', child: Text('All Time')),
                  DropdownMenuItem(value: 'today', child: Text('Today')),
                  DropdownMenuItem(value: 'week', child: Text('This Week')),
                  DropdownMenuItem(value: 'month', child: Text('This Month')),
                ],
                onChanged: (value) => onChanged(filter.copyWith(dateRange: value ?? 'all')),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Showing $filteredCount of $totalCount rooms'),
            if (filter.hasActiveFilters)
              TextButton(
                onPressed: onReset,
                child: const Text('Clear Filters'),
              ),
          ],
        ),
      ],
    );
  }
}
