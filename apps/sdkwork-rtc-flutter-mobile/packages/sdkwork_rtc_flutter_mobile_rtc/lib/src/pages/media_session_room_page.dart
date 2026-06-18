import 'package:flutter/material.dart';

import '../models/media_session_view_state.dart';
import '../services/rtc_app_services.dart';
import '../services/rtc_media_runtime.dart';
import '../widgets/media_session_join_panel.dart';

class MediaSessionRoomPage extends StatefulWidget {
  final RtcAppServices services;
  final String sessionId;
  final String participantId;
  final String displayName;
  final ValueChanged<String> onParticipantIdChange;

  const MediaSessionRoomPage({
    super.key,
    required this.services,
    required this.sessionId,
    required this.participantId,
    required this.displayName,
    required this.onParticipantIdChange,
  });

  @override
  State<MediaSessionRoomPage> createState() => _MediaSessionRoomPageState();
}

class _MediaSessionRoomPageState extends State<MediaSessionRoomPage> {
  MediaSessionRoomViewState _state = const MediaSessionRoomViewState();
  RtcMediaRuntimePort? _runtime;

  @override
  void initState() {
    super.initState();
    _loadSession();
  }

  Future<void> _loadSession() async {
    setState(() => _state = _state.copyWith(loading: true, clearError: true));
    try {
      final loadedSession = await widget.services.mediaSessions.get(widget.sessionId);
      final profiles = await widget.services.providerProfiles.listActive();
      final providerAppId =
          widget.services.providerProfiles.resolveDefaultProviderAppId(profiles);
      final runtime = await createRtcMediaRuntime();
      setState(
        () => _state = _state.copyWith(
          session: loadedSession,
          providerAppId: providerAppId,
          loading: false,
          runtimeMessage: runtime.getStatus().message,
        ),
      );
      _runtime = runtime;
    } catch (error) {
      setState(
        () => _state = _state.copyWith(
          loading: false,
          error: error.toString(),
        ),
      );
    }
  }

  Future<void> _handleJoin() async {
    final session = _state.session;
    final runtime = _runtime;
    if (session == null || runtime == null) return;

    setState(() => _state = _state.copyWith(joining: true, clearError: true));
    try {
      final token = await widget.services.participantCredentials.issue(
        session.id,
        widget.participantId.trim(),
        reason: 'join',
      );
      final appId = _state.providerAppId;
      if (appId == null || appId.isEmpty) {
        throw StateError('No active provider profile with providerAppId is available.');
      }
      final status = await runtime.join(
        RtcMediaRuntimeJoinInput(
          appId: appId,
          sessionId: session.id,
          roomId: session.roomId,
          participantId: widget.participantId.trim(),
          token: token,
          displayName: widget.displayName,
        ),
      );
      setState(() => _state = _state.copyWith(joining: false, runtimeMessage: status.message));
    } catch (error) {
      setState(
        () => _state = _state.copyWith(
          joining: false,
          error: error.toString(),
        ),
      );
    }
  }

  Future<void> _handleLeave() async {
    final runtime = _runtime;
    if (runtime == null) return;
    await runtime.leave();
    setState(() => _state = _state.copyWith(runtimeMessage: runtime.getStatus().message));
  }

  @override
  Widget build(BuildContext context) {
    if (_state.loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_state.error != null) {
      return Center(child: Text(_state.error!, style: const TextStyle(color: Colors.red)));
    }

    final session = _state.session;
    if (session == null) {
      return const Center(child: Text('Media session not found.'));
    }

    return MediaSessionJoinPanel(
      session: session,
      participantId: widget.participantId,
      providerAppId: _state.providerAppId,
      joining: _state.joining,
      runtimeMessage: _state.runtimeMessage,
      onParticipantIdChange: widget.onParticipantIdChange,
      onJoin: () => _handleJoin(),
      onLeave: () => _handleLeave(),
    );
  }
}
