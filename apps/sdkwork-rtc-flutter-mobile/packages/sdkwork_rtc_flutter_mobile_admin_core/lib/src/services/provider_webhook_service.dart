import '../admin_sdk_mapper.dart';
import '../backend_rtc_client.dart';
import '../models/paginated_list_result.dart';
import '../models/provider_webhook_event.dart';

class ProviderWebhookService {
  final SdkworkBackendClient _client;

  ProviderWebhookService(this._client);

  Future<PaginatedListResult<ProviderWebhookEvent>> listEvents({
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
    return PaginatedListResult(
      items: backendResponseItems(response)
          .map(ProviderWebhookEvent.fromJson)
          .toList(),
      nextCursor: backendResponseNextCursor(response),
    );
  }
}
