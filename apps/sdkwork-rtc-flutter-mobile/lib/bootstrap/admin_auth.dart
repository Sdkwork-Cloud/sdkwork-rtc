class RtcAdminSession {
  const RtcAdminSession({
    required this.accessToken,
    required this.authToken,
    required this.tenantId,
    required this.organizationId,
    required this.userId,
  });

  final String accessToken;
  final String authToken;
  final String tenantId;
  final String organizationId;
  final String userId;
}

const defaultAdminPermissionScope = 'rtc.*';

const defaultAdminSession = RtcAdminSession(
  accessToken: 'dev-access-token',
  authToken: 'dev-auth-token',
  tenantId: 'default',
  organizationId: 'default',
  userId: 'admin',
);

RtcAdminSession? _activeAdminSession;

RtcAdminSession? loadAdminSession() => _activeAdminSession;

void saveAdminSession(RtcAdminSession session) {
  _activeAdminSession = session;
}

void clearAdminSession() {
  _activeAdminSession = null;
}

RtcAdminSession? bootstrapAdminAuth() => loadAdminSession();
