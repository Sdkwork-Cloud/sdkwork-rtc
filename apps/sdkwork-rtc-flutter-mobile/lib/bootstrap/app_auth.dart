import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:sdkwork_rtc_flutter_mobile_core/sdkwork_rtc_flutter_mobile_core.dart';

export 'package:sdkwork_rtc_flutter_mobile_core/sdkwork_rtc_flutter_mobile_core.dart'
    show RtcAppSession, defaultAppSession, defaultAppPermissionScope;

const sessionStorageKey = 'sdkwork.rtc.app.session';

SharedPreferences? _preferences;
RtcAppSession? _activeAppSession;

Future<void> initAppAuthStorage() async {
  _preferences ??= await SharedPreferences.getInstance();
  final raw = _preferences!.getString(sessionStorageKey);
  if (raw == null || raw.isEmpty) {
    return;
  }
  try {
    final decoded = jsonDecode(raw);
    if (decoded is Map<String, dynamic>) {
      final session = RtcAppSession.fromJson(decoded);
      if (session.accessToken.isNotEmpty) {
        _activeAppSession = session;
      }
    }
  } catch (_) {
    await _preferences!.remove(sessionStorageKey);
  }
}

RtcAppSession? loadAppSession() => _activeAppSession;

Future<void> saveAppSession(RtcAppSession session) async {
  _activeAppSession = session;
  final prefs = _preferences ?? await SharedPreferences.getInstance();
  await prefs.setString(sessionStorageKey, jsonEncode(session.toJson()));
}

Future<void> clearAppSession() async {
  _activeAppSession = null;
  final prefs = _preferences ?? await SharedPreferences.getInstance();
  await prefs.remove(sessionStorageKey);
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
