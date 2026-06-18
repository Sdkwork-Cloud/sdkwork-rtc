import 'package:sdkwork_rtc_flutter_mobile_core/sdkwork_rtc_flutter_mobile_core.dart';

import 'media_session_service.dart';
import 'participant_credential_service.dart';
import 'provider_profile_service.dart';

class RtcAppServices {
  final MediaSessionService mediaSessions;
  final ParticipantCredentialService participantCredentials;
  final ProviderProfileService providerProfiles;

  const RtcAppServices({
    required this.mediaSessions,
    required this.participantCredentials,
    required this.providerProfiles,
  });
}

RtcAppServices createRtcAppServices(AppApiClient client) {
  return RtcAppServices(
    mediaSessions: MediaSessionService(client),
    participantCredentials: ParticipantCredentialService(client),
    providerProfiles: ProviderProfileService(client),
  );
}
