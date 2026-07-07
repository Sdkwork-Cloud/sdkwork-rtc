Map<String, dynamic>? _responseEnvelopeMap(dynamic response) {
  if (response == null) {
    return null;
  }
  if (response is Map<String, dynamic>) {
    return response;
  }
  if (response is Map) {
    return Map<String, dynamic>.from(response);
  }

  final code = (response as dynamic).code;
  final data = (response as dynamic).data;
  if (code != null) {
    return {
      'code': code,
      'data': data,
    };
  }
  return null;
}

Map<String, dynamic>? backendResponseData(dynamic response) {
  final envelope = _responseEnvelopeMap(response);
  if (envelope == null) {
    throw StateError('Invalid SDK response envelope: expected object with code and data');
  }

  if (envelope.containsKey('code') && envelope.containsKey('data')) {
    if (envelope['code'] != 0) {
      throw StateError('Invalid SDK response envelope: expected code 0');
    }
    final data = envelope['data'];
    if (data is Map<String, dynamic>) {
      return data;
    }
    if (data is Map) {
      return Map<String, dynamic>.from(data);
    }
    throw StateError('Invalid SDK response envelope: missing data object');
  }

  throw StateError('Invalid SDK response envelope: expected { code: 0, data }');
}

List<Map<String, dynamic>> backendResponseItems(dynamic response) {
  final data = backendResponseData(response);
  if (data == null) {
    return [];
  }
  final items = data['items'];
  if (items is List<dynamic>) {
    return items.whereType<Map<String, dynamic>>().toList();
  }
  return [];
}

String? backendResponseNextCursor(dynamic response) {
  final data = backendResponseData(response);
  final pageInfo = data?['pageInfo'];
  if (pageInfo is Map<String, dynamic>) {
    final nextCursor = pageInfo['nextCursor'];
    if (nextCursor is String && nextCursor.isNotEmpty) {
      return nextCursor;
    }
  }
  return null;
}

Map<String, dynamic> backendResponseEntity(dynamic response, String errorMessage) {
  final data = backendResponseData(response);
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

  if (!data.containsKey('items') &&
      !data.containsKey('pageInfo') &&
      !data.containsKey('accepted')) {
    return data;
  }

  throw StateError(errorMessage);
}
