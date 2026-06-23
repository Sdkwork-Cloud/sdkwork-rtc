import 'package:sdkwork_rtc_backend_sdk_generated_dart/sdkwork_rtc_backend_sdk_generated_dart.dart'
    as generated;

import '../admin_sdk_mapper.dart';
import '../backend_rtc_client.dart';
import '../models/provider_account.dart';

class ProviderAccountService {
  final SdkworkBackendClient _client;

  ProviderAccountService(this._client);

  Future<List<ProviderAccount>> list({
    String? provider,
    String? status,
    int? page,
    int? pageSize,
    String? cursor,
    String? search,
    String? sort,
  }) async {
    final response = await _client.rtcProviderAccounts.list(
      page,
      pageSize,
      cursor,
      sort,
      search,
    );
    return backendResponseItems(response)
        .map(ProviderAccount.fromJson)
        .toList();
  }

  Future<ProviderAccount?> get(String id) async {
    final response = await _client.rtcProviderAccounts.retrieve(id);
    final data = backendResponseData(response);
    return data == null ? null : ProviderAccount.fromJson(data);
  }

  Future<ProviderAccount?> create(ProviderAccountCommand command) async {
    final response = await _client.rtcProviderAccounts.create(
      generated.RtcProviderAccountCommand.fromJson(command.toJson()),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderAccount.fromJson(data);
  }

  Future<ProviderAccount?> update(String id, ProviderAccountCommand command) async {
    final response = await _client.rtcProviderAccounts.update(
      id,
      generated.RtcProviderAccountCommand.fromJson(command.toJson()),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderAccount.fromJson(data);
  }

  Future<ProviderAccount?> disable(String id, {String? reason}) async {
    final response = await _client.rtcProviderAccounts.disable(
      id,
      generated.RtcProviderAccountDisableRequest(reason: reason),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderAccount.fromJson(data);
  }
}
