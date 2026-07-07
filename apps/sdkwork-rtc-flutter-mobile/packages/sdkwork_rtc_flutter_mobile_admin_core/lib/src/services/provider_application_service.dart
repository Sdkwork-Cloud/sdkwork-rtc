import 'package:sdkwork_rtc_backend_sdk/sdkwork_rtc_backend_sdk.dart'
    as generated;

import '../admin_sdk_mapper.dart';
import '../backend_rtc_client.dart';
import '../models/provider_application.dart';

class ProviderApplicationService {
  final SdkworkBackendClient _client;

  ProviderApplicationService(this._client);

  Future<List<ProviderApplication>> list(String accountId) async {
    final response =
        await _client.rtcProviderApplications.rtcProviderAccountsApplicationsList(
      accountId,
    );
    return backendResponseItems(response)
        .map(ProviderApplication.fromJson)
        .toList();
  }

  Future<ProviderApplication?> get(String id) async {
    final response = await _client.rtcProviderApplications.retrieve(id);
    final data = backendResponseData(response);
    return data == null ? null : ProviderApplication.fromJson(data);
  }

  Future<ProviderApplication?> create(
    String accountId,
    ProviderApplicationCommand command,
  ) async {
    final response =
        await _client.rtcProviderApplications.rtcProviderAccountsApplicationsCreate(
      accountId,
      generated.RtcProviderApplicationCommand.fromJson(command.toJson()),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderApplication.fromJson(data);
  }

  Future<ProviderApplication?> update(
    String id,
    ProviderApplicationCommand command,
  ) async {
    final response = await _client.rtcProviderApplications.update(
      id,
      generated.RtcProviderApplicationCommand.fromJson(command.toJson()),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderApplication.fromJson(data);
  }

  Future<ProviderApplication?> disable(String id, {String? reason}) async {
    final response = await _client.rtcProviderApplications.disable(
      id,
      generated.RtcProviderApplicationDisableRequest(reason: reason),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderApplication.fromJson(data);
  }
}
