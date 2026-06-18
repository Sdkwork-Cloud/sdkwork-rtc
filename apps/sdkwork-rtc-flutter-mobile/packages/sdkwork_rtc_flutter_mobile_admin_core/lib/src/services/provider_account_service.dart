import '../models/provider_account.dart';
import 'backend_api_client.dart';

class ProviderAccountService {
  final BackendApiClient _client;

  ProviderAccountService(this._client);

  Future<List<ProviderAccount>> list({String? provider, String? status}) async {
    final query = <String, String>{};
    if (provider != null) query['provider'] = provider;
    if (status != null) query['status'] = status;
    final data = await _client.getJson(
      '/rtc/provider_accounts',
      query: query.isEmpty ? null : query,
    );
    final items = data['items'];
    if (items is! List<dynamic>) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(ProviderAccount.fromJson)
        .toList();
  }

  Future<ProviderAccount?> get(String id) async {
    final data = await _client.getJson('/rtc/provider_accounts/$id');
    return ProviderAccount.fromJson(data);
  }

  Future<ProviderAccount?> create(ProviderAccountCommand command) async {
    final data = await _client.postJson('/rtc/provider_accounts', command.toJson());
    return ProviderAccount.fromJson(data);
  }

  Future<ProviderAccount?> update(String id, ProviderAccountCommand command) async {
    final data = await _client.patchJson(
      '/rtc/provider_accounts/$id',
      command.toJson(),
    );
    return ProviderAccount.fromJson(data);
  }

  Future<ProviderAccount?> disable(String id, {String? reason}) async {
    final data = await _client.postJson(
      '/rtc/provider_accounts/$id/disable',
      {if (reason != null) 'reason': reason},
    );
    return ProviderAccount.fromJson(data);
  }
}
