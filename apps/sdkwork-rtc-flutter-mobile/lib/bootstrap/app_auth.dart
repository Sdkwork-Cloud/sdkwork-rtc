import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:sdkwork_rtc_flutter_mobile_core/sdkwork_rtc_flutter_mobile_core.dart';

export 'package:sdkwork_rtc_flutter_mobile_core/sdkwork_rtc_flutter_mobile_core.dart'
    show
        RtcAppSession,
        defaultAppSession,
        defaultAppPermissionScope,
        legacyRtcFlutterMobileSessionStorageKeys,
        rtcFlutterMobileSessionStorageKey;

SharedPreferences? _preferences;
RtcAppSession? _activeAppSession;

Future<void> initAppAuthStorage() async {
  _preferences ??= await SharedPreferences.getInstance();
  final raw = _preferences!.getString(rtcFlutterMobileSessionStorageKey);
  if (raw != null && raw.isNotEmpty) {
    _activeAppSession = _parseStoredSession(raw);
    return;
  }

  for (final legacyKey in legacyRtcFlutterMobileSessionStorageKeys) {
    final legacyRaw = _preferences!.getString(legacyKey);
    if (legacyRaw == null || legacyRaw.isEmpty) {
      continue;
    }
    final migrated = _parseStoredSession(legacyRaw);
    await _preferences!.remove(legacyKey);
    if (migrated != null) {
      _activeAppSession = migrated;
      await _preferences!.setString(
        rtcFlutterMobileSessionStorageKey,
        jsonEncode(migrated.toJson()),
      );
      return;
    }
  }
}

RtcAppSession? _parseStoredSession(String raw) {
  try {
    final decoded = jsonDecode(raw);
    if (decoded is Map<String, dynamic>) {
      final session = RtcAppSession.fromJson(decoded);
      if (session.accessToken.isNotEmpty) {
        return session;
      }
    }
  } catch (_) {
    return null;
  }
  return null;
}

RtcAppSession? loadAppSession() => _activeAppSession;

Future<void> saveAppSession(RtcAppSession session) async {
  _activeAppSession = session;
  final prefs = _preferences ?? await SharedPreferences.getInstance();
  await prefs.setString(rtcFlutterMobileSessionStorageKey, jsonEncode(session.toJson()));
  for (final legacyKey in legacyRtcFlutterMobileSessionStorageKeys) {
    await prefs.remove(legacyKey);
  }
}

Future<void> clearAppSession() async {
  _activeAppSession = null;
  final prefs = _preferences ?? await SharedPreferences.getInstance();
  await prefs.remove(rtcFlutterMobileSessionStorageKey);
  for (final legacyKey in legacyRtcFlutterMobileSessionStorageKeys) {
    await prefs.remove(legacyKey);
  }
}

Future<RtcAppSession?> consumeAppbaseCallbackSession(Uri? uri) async {
  final session = parseAppbaseCallbackSession(uri);
  if (session == null) {
    return null;
  }
  await saveAppSession(session);
  return session;
}

RtcAppSession? bootstrapAppAuth() => loadAppSession();
