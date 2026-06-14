import 'package:flutter/material.dart';

class RoomBatchActionsWidget extends StatelessWidget {
  final int selectedCount;
  final int activeCount;
  final int archivedCount;
  final int disabledCount;
  final VoidCallback onArchive;
  final VoidCallback onDisable;
  final VoidCallback onExport;
  final VoidCallback onClearSelection;

  const RoomBatchActionsWidget({
    super.key,
    required this.selectedCount,
    required this.activeCount,
    required this.archivedCount,
    required this.disabledCount,
    required this.onArchive,
    required this.onDisable,
    required this.onExport,
    required this.onClearSelection,
  });

  @override
  Widget build(BuildContext context) {
    if (selectedCount == 0) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16.0),
      color: Colors.blue.shade50,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                '$selectedCount room(s) selected',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              TextButton(
                onPressed: onClearSelection,
                child: const Text('Clear Selection'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8.0,
            children: [
              if (activeCount > 0)
                ElevatedButton.icon(
                  onPressed: onArchive,
                  icon: const Icon(Icons.archive),
                  label: Text('Archive ($activeCount)'),
                ),
              if (activeCount > 0)
                ElevatedButton.icon(
                  onPressed: onDisable,
                  icon: const Icon(Icons.block),
                  label: Text('Disable ($activeCount)'),
                ),
              ElevatedButton.icon(
                onPressed: onExport,
                icon: const Icon(Icons.download),
                label: const Text('Export Selected'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8.0,
            children: [
              if (activeCount > 0)
                Chip(
                  label: Text('$activeCount active'),
                  backgroundColor: Colors.green.shade100,
                ),
              if (archivedCount > 0)
                Chip(
                  label: Text('$archivedCount archived'),
                  backgroundColor: Colors.grey.shade200,
                ),
              if (disabledCount > 0)
                Chip(
                  label: Text('$disabledCount disabled'),
                  backgroundColor: Colors.red.shade100,
                ),
            ],
          ),
        ],
      ),
    );
  }
}
