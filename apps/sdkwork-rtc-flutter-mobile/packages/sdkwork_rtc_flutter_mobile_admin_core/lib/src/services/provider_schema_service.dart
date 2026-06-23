import '../admin_sdk_mapper.dart';
import '../backend_rtc_client.dart';
import '../models/provider_schema.dart';

class ProviderSchemaService {
  final SdkworkBackendClient _client;

  ProviderSchemaService(this._client);

  Future<List<ProviderConfigSchema>> listSchemas() async {
    final response = await _client.rtcProviderSchemas.list();
    final data = backendResponseData(response);
    final items = data?['items'] ?? data;
    if (items is List<dynamic>) {
      return items
          .whereType<Map<String, dynamic>>()
          .map(ProviderConfigSchema.fromJson)
          .toList();
    }
    if (data is Map<String, dynamic>) {
      return [ProviderConfigSchema.fromJson(data)];
    }
    return [];
  }

  Future<ProviderConfigSchema?> getSchema(String provider) async {
    final response = await _client.rtcProviderSchemas.retrieve(provider);
    final data = backendResponseData(response);
    if (data == null) {
      return null;
    }
    return ProviderConfigSchema.fromJson(data);
  }
}
