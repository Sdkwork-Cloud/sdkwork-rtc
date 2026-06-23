import '../admin_sdk_mapper.dart';
import '../backend_rtc_client.dart';
import '../models/provider_plugin.dart';

class ProviderPluginService {
  final SdkworkBackendClient _client;

  ProviderPluginService(this._client);

  Future<List<ProviderPluginDescriptor>> list({
    int? page,
    int? limit,
    String? cursor,
    String? search,
    String? sort,
  }) async {
    final response = await _client.rtcProviderPlugins.list(
      page,
      limit,
      cursor,
      sort,
      search,
    );
    return backendResponseItems(response)
        .map(ProviderPluginDescriptor.fromJson)
        .toList();
  }

  Future<ProviderPluginDescriptor> get(String provider) async {
    final response = await _client.rtcProviderPlugins.retrieve(provider);
    return ProviderPluginDescriptor.fromJson(
      backendResponseEntity(response, 'Provider plugin $provider was not found'),
    );
  }
}
