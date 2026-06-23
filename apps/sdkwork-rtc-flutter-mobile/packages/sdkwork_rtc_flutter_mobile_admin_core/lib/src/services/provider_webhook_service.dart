import '../admin_sdk_mapper.dart';
import '../backend_rtc_client.dart';
import '../models/provider_webhook_event.dart';

class ProviderWebhookService {
  final SdkworkBackendClient _client;

  ProviderWebhookService(this._client);

  Future<List<ProviderWebhookEvent>> listEvents({
    int? page,
    int? limit,
    String? cursor,
    String? search,
    String? sort,
  }) async {
    final response = await _client.rtcProviderWebhooks.eventsList(
      page,
      limit,
      cursor,
      sort,
      search,
    );
    return backendResponseItems(response)
        .map(ProviderWebhookEvent.fromJson)
        .toList();
  }
}
