import '../models/provider_schema.dart';
import 'backend_api_client.dart';

class ProviderSchemaService {
  final BackendApiClient _client;

  ProviderSchemaService(this._client);

  Future<List<ProviderConfigSchema>> listSchemas() async {
    final data = await _client.getJson('/rtc/provider_schemas');
    final items = data['items'];
    if (items is! List<dynamic>) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(ProviderConfigSchema.fromJson)
        .toList();
  }

  Future<ProviderConfigSchema?> getSchema(String provider) async {
    final data = await _client.getJson(
      '/rtc/provider_schemas/${Uri.encodeComponent(provider)}',
    );
    return ProviderConfigSchema.fromJson(data);
  }
}
