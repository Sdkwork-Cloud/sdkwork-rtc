import 'package:flutter/material.dart';
import '../models/provider_query_jobs.dart';

class ProviderQueryJobPanel extends StatelessWidget {
  final ProviderQueryJob? job;
  final List<ProviderQuerySnapshot> snapshots;

  const ProviderQueryJobPanel({
    super.key,
    required this.job,
    required this.snapshots,
  });

  @override
  Widget build(BuildContext context) {
    if (job == null) {
      return const Center(child: Text('Create or load a query job to view details.'));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Job ${job!.id}', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text('Provider: ${job!.provider}'),
                Text('Query Kind: ${job!.queryKind}'),
                Text('Status: ${job!.status}'),
                Text('Target: ${job!.targetKind} / ${job!.targetId}'),
                if (job!.roomId != null) Text('Room: ${job!.roomId}'),
                Text('Requested: ${job!.requestedAt}'),
                if (job!.completedAt != null) Text('Completed: ${job!.completedAt}'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text('Snapshots (${snapshots.length})', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        Expanded(
          child: snapshots.isEmpty
              ? const Center(child: Text('No snapshots yet.'))
              : ListView.builder(
                  itemCount: snapshots.length,
                  itemBuilder: (context, index) {
                    final snapshot = snapshots[index];
                    return Card(
                      child: ListTile(
                        title: Text(snapshot.snapshotKind),
                        subtitle: Text(
                          'Captured: ${snapshot.capturedAt}\nPayload keys: ${snapshot.snapshotPayload.keys.join(', ')}',
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
