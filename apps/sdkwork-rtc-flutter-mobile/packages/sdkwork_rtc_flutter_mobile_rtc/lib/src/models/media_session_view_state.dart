import 'media_session.dart';

class MediaSessionListViewState {
  final List<RtcMediaSession> sessions;
  final bool loading;
  final bool creating;
  final String? error;
  final String? nextCursor;

  const MediaSessionListViewState({
    this.sessions = const [],
    this.loading = false,
    this.creating = false,
    this.error,
    this.nextCursor,
  });

  MediaSessionListViewState copyWith({
    List<RtcMediaSession>? sessions,
    bool? loading,
    bool? creating,
    String? error,
    String? nextCursor,
    bool clearError = false,
  }) {
    return MediaSessionListViewState(
      sessions: sessions ?? this.sessions,
      loading: loading ?? this.loading,
      creating: creating ?? this.creating,
      error: clearError ? null : (error ?? this.error),
      nextCursor: nextCursor ?? this.nextCursor,
    );
  }
}

class MediaSessionRoomViewState {
  final RtcMediaSession? session;
  final String? providerAppId;
  final bool loading;
  final bool joining;
  final String? error;
  final String? runtimeMessage;

  const MediaSessionRoomViewState({
    this.session,
    this.providerAppId,
    this.loading = false,
    this.joining = false,
    this.error,
    this.runtimeMessage,
  });

  MediaSessionRoomViewState copyWith({
    RtcMediaSession? session,
    String? providerAppId,
    bool? loading,
    bool? joining,
    String? error,
    String? runtimeMessage,
    bool clearError = false,
  }) {
    return MediaSessionRoomViewState(
      session: session ?? this.session,
      providerAppId: providerAppId ?? this.providerAppId,
      loading: loading ?? this.loading,
      joining: joining ?? this.joining,
      error: clearError ? null : (error ?? this.error),
      runtimeMessage: runtimeMessage ?? this.runtimeMessage,
    );
  }
}
