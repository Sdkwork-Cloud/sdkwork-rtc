import 'package:sdkwork_rtc_flutter_mobile_core/sdkwork_rtc_flutter_mobile_core.dart';

import '../models/active_provider_profile.dart';

class ProviderProfileService {
  final SdkworkAppClient _client;

  ProviderProfileService(this._client);

  Future<List<RtcActiveProviderProfile>> listActive() async {
    final response = await _client.rtcProviderProfiles.activeList();
    final data = response?.data;
    final rawItems = data is Map<String, dynamic> ? data['items'] : null;
    if (rawItems is! List<dynamic>) return [];
    return rawItems
        .whereType<Map<String, dynamic>>()
        .map(RtcActiveProviderProfile.fromJson)
        .toList();
  }

  String? resolveDefaultProviderAppId(List<RtcActiveProviderProfile> profiles) {
    for (final profile in profiles) {
      if (profile.isDefault && (profile.providerAppId?.isNotEmpty ?? false)) {
        return profile.providerAppId;
      }
    }
    for (final profile in profiles) {
      if (profile.providerAppId?.isNotEmpty ?? false) {
        return profile.providerAppId;
      }
    }
    return null;
  }
}
