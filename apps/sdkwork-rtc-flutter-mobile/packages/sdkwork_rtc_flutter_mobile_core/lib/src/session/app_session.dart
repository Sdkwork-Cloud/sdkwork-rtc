class RtcAppSession {
  const RtcAppSession({
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

  Map<String, dynamic> toJson() => {
        'accessToken': accessToken,
        'authToken': authToken,
        'tenantId': tenantId,
        'organizationId': organizationId,
        'userId': userId,
      };

  factory RtcAppSession.fromJson(Map<String, dynamic> json) {
    final accessToken = json['accessToken']?.toString().trim() ?? '';
    final authToken = json['authToken']?.toString().trim() ?? accessToken;
    return RtcAppSession(
      accessToken: accessToken,
      authToken: authToken,
      tenantId: json['tenantId']?.toString().trim().isNotEmpty == true
          ? json['tenantId'].toString().trim()
          : defaultAppSession.tenantId,
      organizationId: json['organizationId']?.toString().trim().isNotEmpty == true
          ? json['organizationId'].toString().trim()
          : defaultAppSession.organizationId,
      userId: json['userId']?.toString().trim().isNotEmpty == true
          ? json['userId'].toString().trim()
          : defaultAppSession.userId,
    );
  }
}

const defaultAppPermissionScope =
    'rtc.media_session.read rtc.media_session.write';

const defaultAppSession = RtcAppSession(
  accessToken: '',
  authToken: '',
  tenantId: 'default',
  organizationId: 'default',
  userId: 'user',
);

const rtcFlutterMobileSessionStorageKey = 'sdkwork-rtc-flutter-mobile:session:v1';
const legacyRtcFlutterMobileSessionStorageKeys = <String>[
  'sdkwork.rtc.app.session',
];
