import 'package:flutter/material.dart';

import '../models/media_session.dart';
import '../services/media_session_mapper.dart';

class MediaSessionList extends StatelessWidget {
  final List<RtcMediaSession> sessions;
  final ValueChanged<RtcMediaSession> onSelect;
  final VoidCallback onRefresh;

  const MediaSessionList({
    super.key,
    required this.sessions,
    required this.onSelect,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (sessions.isEmpty) {
      return Column(
        children: [
          const Text('No media sessions yet.'),
          const SizedBox(height: 8),
          OutlinedButton(onPressed: onRefresh, child: const Text('Refresh')),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('${sessions.length} session(s)'),
            TextButton(onPressed: onRefresh, child: const Text('Refresh')),
          ],
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ListView.separated(
            itemCount: sessions.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final session = sessions[index];
              final participantCount =
                  session.participantCount ?? session.participants.length;
              return Card(
                child: ListTile(
                  title: Text(session.roomId),
                  subtitle: Text(
                    '${formatMediaSessionStatus(session.status)} · '
                    '${session.mediaMode} · $participantCount participants',
                  ),
                  onTap: () => onSelect(session),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
