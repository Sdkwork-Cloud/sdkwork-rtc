Map<String, dynamic>? backendResponseData(dynamic response) {
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

List<Map<String, dynamic>> backendResponseItems(dynamic response) {
  final data = backendResponseData(response);
  final items = data?['items'];
  if (items is List<dynamic>) {
    return items.whereType<Map<String, dynamic>>().toList();
  }
  if (data != null) {
    return [data];
  }
  return [];
}

Map<String, dynamic> backendResponseEntity(dynamic response, String errorMessage) {
  final data = backendResponseData(response);
  if (data == null) {
    throw StateError(errorMessage);
  }
  return data;
}
