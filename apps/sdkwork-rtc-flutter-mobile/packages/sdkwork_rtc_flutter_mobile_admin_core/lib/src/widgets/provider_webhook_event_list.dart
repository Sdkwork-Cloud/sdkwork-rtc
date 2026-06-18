import 'package:flutter/material.dart';
import '../models/provider_webhook_event.dart';

class ProviderWebhookEventList extends StatelessWidget {
  final List<ProviderWebhookEvent> events;

  const ProviderWebhookEventList({
    super.key,
    required this.events,
  });

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) {
      return const Center(child: Text('No webhook events found.'));
    }
    return ListView.builder(
      itemCount: events.length,
      itemBuilder: (context, index) {
        final event = events[index];
        return Card(
          child: ListTile(
            title: Text('${event.provider} - ${event.eventType}'),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Kind: ${event.eventKind}'),
                Text('Status: ${event.status}'),
                if (event.roomId != null) Text('Room: ${event.roomId}'),
                Text('Received: ${event.receivedAt}'),
              ],
            ),
          ),
        );
      },
    );
  }
}
