import '../models/media_session.dart';

typedef SdkworkRtcMediaSessionMode = String;
typedef SdkworkRtcSessionStatus = String;

class SdkworkRtcParticipant {
  final String id;
  final String name;
  final String role;
  final bool isLocal;
  final bool audioMuted;
  final bool videoMuted;
  final String? joinedAt;

  const SdkworkRtcParticipant({
    required this.id,
    required this.name,
    required this.role,
    this.isLocal = false,
    this.audioMuted = false,
    this.videoMuted = false,
    this.joinedAt,
  });
}

class SdkworkRtcSession {
  final String id;
  final String roomId;
  final String localParticipantId;
  final String mediaMode;
  final String status;
  final String? startedAt;
  final String? activeAt;
  final String? endedAt;
  final List<SdkworkRtcParticipant> participants;

  const SdkworkRtcSession({
    required this.id,
    required this.roomId,
    required this.localParticipantId,
    required this.mediaMode,
    required this.status,
    this.startedAt,
    this.activeAt,
    this.endedAt,
    this.participants = const [],
  });
}

class SdkworkRtcJoinReadiness {
  final bool ready;
  final List<String> issues;

  const SdkworkRtcJoinReadiness({
    required this.ready,
    this.issues = const [],
  });
}

class EvaluateRtcJoinReadinessOptions {
  final bool cameraRequired;
  final String? microphonePermission;
  final String? cameraPermission;

  const EvaluateRtcJoinReadinessOptions({
    this.cameraRequired = false,
    this.microphonePermission,
    this.cameraPermission,
  });
}

SdkworkRtcSession mapMediaSessionToRtcSession(
  RtcMediaSession session,
  String localParticipantId,
) {
  return SdkworkRtcSession(
    id: session.id,
    roomId: session.roomId,
    localParticipantId: localParticipantId,
    mediaMode: session.mediaMode,
    status: session.status,
    startedAt: session.startedAt,
    activeAt: session.connectedAt ?? session.startedAt,
    endedAt: session.endedAt,
    participants: session.participants
        .map(
          (participant) => SdkworkRtcParticipant(
            id: participant.id,
            name: participant.displayName.isNotEmpty
                ? participant.displayName
                : participant.id,
            role: participant.role == 'listener' ? 'listener' : participant.role,
            isLocal: participant.id == localParticipantId,
            audioMuted: participant.audioMuted,
            videoMuted: participant.videoMuted,
            joinedAt: participant.joinedAt,
          ),
        )
        .toList(),
  );
}

String formatMediaSessionStatus(String status) {
  switch (status) {
    case 'preparing':
      return 'Preparing';
    case 'active':
      return 'Active';
    case 'closing':
      return 'Closing';
    case 'ended':
      return 'Ended';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

String formatJoinIssue(String issue) {
  switch (issue) {
    case 'session-closing':
      return 'Session is closing';
    case 'session-ended':
      return 'Session has ended';
    case 'session-failed':
      return 'Session failed';
    case 'offline':
      return 'Device is offline';
    case 'microphone-denied':
      return 'Microphone permission denied';
    case 'camera-denied':
      return 'Camera permission denied';
    default:
      return issue;
  }
}

SdkworkRtcJoinReadiness evaluateRtcJoinReadiness(
  SdkworkRtcSession session, {
  EvaluateRtcJoinReadinessOptions options = const EvaluateRtcJoinReadinessOptions(),
}) {
  final usesVideoCapture = session.mediaMode == 'video' || session.mediaMode == 'live';
  final isSessionClosing = session.status == 'closing';
  final isSessionEnded = session.status == 'ended';
  final isSessionFailed = session.status == 'failed';
  final microphoneDenied = options.microphonePermission == 'denied';
  final cameraDenied = options.cameraPermission == 'denied';
  final canUseMicrophone =
      !isSessionClosing && !isSessionEnded && !isSessionFailed && !microphoneDenied;
  final canUseCamera = usesVideoCapture &&
      !isSessionClosing &&
      !isSessionEnded &&
      !isSessionFailed &&
      !cameraDenied;
  final blockedByCamera = usesVideoCapture && options.cameraRequired && !canUseCamera;

  final issues = <String>[
    if (isSessionClosing) 'session-closing',
    if (isSessionEnded) 'session-ended',
    if (isSessionFailed) 'session-failed',
    if (microphoneDenied) 'microphone-denied',
    if (cameraDenied) 'camera-denied',
  ];

  final ready = !isSessionClosing &&
      !isSessionEnded &&
      !isSessionFailed &&
      canUseMicrophone &&
      !blockedByCamera;

  return SdkworkRtcJoinReadiness(ready: ready, issues: issues);
}
