import 'package:flutter/material.dart';

import '../models/media_session.dart';
import '../models/media_session_view_state.dart';
import '../services/media_session_service.dart';
import '../services/rtc_app_services.dart';
import '../widgets/media_session_create_form.dart';
import '../widgets/media_session_list.dart';

class MediaSessionsPage extends StatefulWidget {
  final RtcAppServices services;
  final String defaultMediaMode;
  final ValueChanged<String> onOpenSession;

  const MediaSessionsPage({
    super.key,
    required this.services,
    this.defaultMediaMode = 'video',
    required this.onOpenSession,
  });

  @override
  State<MediaSessionsPage> createState() => _MediaSessionsPageState();
}

class _MediaSessionsPageState extends State<MediaSessionsPage> {
  MediaSessionListViewState _state = const MediaSessionListViewState();

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() => _state = _state.copyWith(loading: true, clearError: true));
    try {
      final response = await widget.services.mediaSessions.list();
      setState(
        () => _state = _state.copyWith(
          sessions: response.items,
          nextCursor: response.nextCursor,
          loading: false,
        ),
      );
    } catch (error) {
      setState(
        () => _state = _state.copyWith(
          loading: false,
          error: error.toString(),
        ),
      );
    }
  }

  Future<void> _handleCreate(MediaSessionCreateInput input) async {
    setState(() => _state = _state.copyWith(creating: true, clearError: true));
    try {
      final created = await widget.services.mediaSessions.create(
        RtcCreateMediaSessionRequest(
          roomId: input.roomId,
          mediaMode: input.mediaMode,
        ),
      );
      await _refresh();
      widget.onOpenSession(created.id);
    } catch (error) {
      setState(
        () => _state = _state.copyWith(
          creating: false,
          error: error.toString(),
        ),
      );
      return;
    }
    if (mounted) {
      setState(() => _state = _state.copyWith(creating: false));
    }
  }

  Future<void> _loadMore() async {
    if (_state.nextCursor == null || _state.loading) {
      return;
    }
    setState(() => _state = _state.copyWith(loading: true, clearError: true));
    try {
      final response = await widget.services.mediaSessions.list(
        MediaSessionListParams(cursor: _state.nextCursor),
      );
      setState(
        () => _state = _state.copyWith(
          sessions: [..._state.sessions, ...response.items],
          nextCursor: response.nextCursor,
          loading: false,
        ),
      );
    } catch (error) {
      setState(
        () => _state = _state.copyWith(
          loading: false,
          error: error.toString(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Media Sessions', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 4),
        const Text('Create or join RTC media sessions through the app API.'),
        if (_state.error != null) ...[
          const SizedBox(height: 8),
          MaterialBanner(
            content: Text(_state.error!),
            backgroundColor: Colors.red.shade50,
            actions: [
              TextButton(
                onPressed: () => setState(() => _state = _state.copyWith(clearError: true)),
                child: const Text('Dismiss'),
              ),
            ],
          ),
        ],
        const SizedBox(height: 16),
        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 2,
                child: MediaSessionCreateForm(
                  defaultMediaMode: widget.defaultMediaMode,
                  creating: _state.creating,
                  onCreate: _handleCreate,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                flex: 3,
                child: _state.loading
                    ? const Center(child: CircularProgressIndicator())
                    : Column(
                        children: [
                          Expanded(
                            child: MediaSessionList(
                              sessions: _state.sessions,
                              onSelect: (session) => widget.onOpenSession(session.id),
                              onRefresh: _refresh,
                            ),
                          ),
                          if (_state.nextCursor != null)
                            TextButton(
                              onPressed: _state.loading ? null : _loadMore,
                              child: const Text('Load more sessions'),
                            ),
                        ],
                      ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
