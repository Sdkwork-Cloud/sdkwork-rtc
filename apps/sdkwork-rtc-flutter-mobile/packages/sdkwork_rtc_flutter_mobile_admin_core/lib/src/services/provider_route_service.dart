import 'package:sdkwork_rtc_backend_sdk_generated_dart/sdkwork_rtc_backend_sdk_generated_dart.dart'
    as generated;

import '../admin_sdk_mapper.dart';
import '../backend_rtc_client.dart';
import '../models/provider_route.dart';

class ProviderRouteService {
  final SdkworkBackendClient _client;

  ProviderRouteService(this._client);

  Future<List<ProviderRoute>> list() async {
    final response = await _client.rtcProviderRoutes.list();
    return backendResponseItems(response).map(ProviderRoute.fromJson).toList();
  }

  Future<ProviderRoute?> create(ProviderRouteCommand command) async {
    final response = await _client.rtcProviderRoutes.create(
      generated.RtcProviderRouteCommand.fromJson(command.toJson()),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderRoute.fromJson(data);
  }

  Future<ProviderRoute?> get(String id) async {
    final response = await _client.rtcProviderRoutes.retrieve(id);
    final data = backendResponseData(response);
    return data == null ? null : ProviderRoute.fromJson(data);
  }

  Future<ProviderRoute?> update(String id, ProviderRouteCommand command) async {
    final response = await _client.rtcProviderRoutes.update(
      id,
      generated.RtcProviderRouteCommand.fromJson(command.toJson()),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderRoute.fromJson(data);
  }

  Future<ProviderRoute?> disable(String id, {String? reason}) async {
    final response = await _client.rtcProviderRoutes.disable(
      id,
      generated.RtcProviderRouteDisableRequest(reason: reason),
    );
    final data = backendResponseData(response);
    return data == null ? null : ProviderRoute.fromJson(data);
  }
}
