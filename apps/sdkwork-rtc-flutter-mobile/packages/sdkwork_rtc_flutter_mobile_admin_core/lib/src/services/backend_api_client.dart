import 'dart:convert';

import 'package:http/http.dart' as http;

class BackendApiClient {
  BackendApiClient({
    required this.baseUrl,
    this.accessToken,
    this.authToken,
    this.tenantId,
    this.organizationId,
    this.userId,
    this.permissionScope = 'rtc.*',
  });

  final String baseUrl;
  String? accessToken;
  String? authToken;
  String? tenantId;
  String? organizationId;
  String? userId;
  String permissionScope;

  Uri _uri(String path, [Map<String, String>? query]) {
    final normalizedBase = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$normalizedBase$normalizedPath').replace(queryParameters: query);
  }

  Map<String, String> _headers({bool jsonBody = false}) {
    final headers = <String, String>{
      if (jsonBody) 'Content-Type': 'application/json',
      if (accessToken != null && accessToken!.isNotEmpty)
        'Access-Token': accessToken!,
      if (authToken != null && authToken!.isNotEmpty)
        'Authorization': 'Bearer $authToken',
      if (tenantId != null && tenantId!.isNotEmpty)
        'x-sdkwork-tenant-id': tenantId!,
      if (organizationId != null && organizationId!.isNotEmpty)
        'x-sdkwork-organization-id': organizationId!,
      if (userId != null && userId!.isNotEmpty) ...{
        'x-sdkwork-user-id': userId!,
        'x-sdkwork-actor-id': userId!,
      },
      if (permissionScope.isNotEmpty)
        'x-sdkwork-permission-scope': permissionScope,
    };
    return headers;
  }

  Future<Map<String, dynamic>> getJson(
    String path, {
    Map<String, String>? query,
  }) async {
    final response = await http.get(_uri(path, query), headers: _headers());
    return _decodeEnvelope(response);
  }

  Future<Map<String, dynamic>> postJson(
    String path,
    Map<String, dynamic> body,
  ) async {
    final response = await http.post(
      _uri(path),
      headers: _headers(jsonBody: true),
      body: jsonEncode(body),
    );
    return _decodeEnvelope(response);
  }

  Future<Map<String, dynamic>> patchJson(
    String path,
    Map<String, dynamic> body,
  ) async {
    final response = await http.patch(
      _uri(path),
      headers: _headers(jsonBody: true),
      body: jsonEncode(body),
    );
    return _decodeEnvelope(response);
  }

  Map<String, dynamic> _decodeEnvelope(http.Response response) {
    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw StateError('Invalid RTC API response body');
    }
    if (response.statusCode >= 400) {
      final message = decoded['message']?.toString() ?? 'HTTP ${response.statusCode}';
      throw StateError(message);
    }
    final data = decoded['data'];
    if (data is Map<String, dynamic>) {
      return data;
    }
    if (data is List<dynamic>) {
      return {'items': data};
    }
    throw StateError('Invalid RTC API response: missing data field');
  }
}
