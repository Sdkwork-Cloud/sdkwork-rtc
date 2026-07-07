Map<String, dynamic>? appSdkEnvelopeData(dynamic response) {
  if (response == null) {
    return null;
  }
  if (response is Map<String, dynamic>) {
    final data = response['data'];
    if (data is Map<String, dynamic>) {
      return data;
    }
    if (data is Map) {
      return Map<String, dynamic>.from(data);
    }
    return null;
  }

  final data = (response as dynamic).data;
  if (data is Map<String, dynamic>) {
    return data;
  }
  if (data is Map) {
    return Map<String, dynamic>.from(data);
  }
  return null;
}

List<Map<String, dynamic>> appSdkEnvelopeItems(dynamic response) {
  final data = appSdkEnvelopeData(response);
  final items = data?['items'];
  if (items is List<dynamic>) {
    return items.whereType<Map<String, dynamic>>().toList();
  }
  return [];
}

String? appSdkEnvelopeNextCursor(dynamic response) {
  final data = appSdkEnvelopeData(response);
  final pageInfo = data?['pageInfo'];
  if (pageInfo is Map<String, dynamic>) {
    final nextCursor = pageInfo['nextCursor'];
    if (nextCursor is String && nextCursor.isNotEmpty) {
      return nextCursor;
    }
  }
  return null;
}

Map<String, dynamic> appSdkEnvelopeEntity(dynamic response, String errorMessage) {
  final data = appSdkEnvelopeData(response);
  if (data == null) {
    throw StateError(errorMessage);
  }
  final item = data['item'];
  if (item is Map<String, dynamic>) {
    return item;
  }
  if (item is Map) {
    return Map<String, dynamic>.from(item);
  }
  return data;
}

Map<String, dynamic> appSdkEnvelopeEntityFromMap(
  Map<String, dynamic>? envelope,
  String errorMessage,
) {
  if (envelope == null) {
    throw StateError(errorMessage);
  }
  final code = envelope['code'];
  if (code != null && code != 0 && code != '0') {
    throw StateError(errorMessage);
  }
  return appSdkEnvelopeEntity(envelope, errorMessage);
}

class AppSdkEnvelopeListPage {
  const AppSdkEnvelopeListPage({
    required this.items,
    this.nextCursor,
  });

  final List<Map<String, dynamic>> items;
  final String? nextCursor;
}

Map<String, dynamic> _requireSdkWorkEnvelopeData(
  Map<String, dynamic>? envelope,
  String errorMessage,
) {
  if (envelope == null) {
    throw StateError(errorMessage);
  }
  final code = envelope['code'];
  if (code != 0 && code != '0') {
    throw StateError('Invalid SDK response envelope: expected { code: 0, data }');
  }
  final data = envelope['data'];
  if (data is Map<String, dynamic>) {
    return data;
  }
  if (data is Map) {
    return Map<String, dynamic>.from(data);
  }
  throw StateError(errorMessage);
}

AppSdkEnvelopeListPage appSdkEnvelopeListPageFromMap(
  Map<String, dynamic>? envelope,
  String errorMessage,
) {
  final data = _requireSdkWorkEnvelopeData(envelope, errorMessage);
  final rawItems = data['items'];
  final items = rawItems is List<dynamic>
      ? rawItems.whereType<Map<String, dynamic>>().toList()
      : <Map<String, dynamic>>[];
  final pageInfo = data['pageInfo'];
  String? nextCursor;
  if (pageInfo is Map<String, dynamic>) {
    final value = pageInfo['nextCursor'];
    if (value is String && value.isNotEmpty) {
      nextCursor = value;
    }
  } else if (pageInfo is Map) {
    final value = pageInfo['nextCursor'];
    if (value is String && value.isNotEmpty) {
      nextCursor = value;
    }
  }
  return AppSdkEnvelopeListPage(items: items, nextCursor: nextCursor);
}
