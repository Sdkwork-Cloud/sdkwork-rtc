import 'package:sdkwork_rtc_backend_sdk/sdkwork_rtc_backend_sdk.dart'
    as generated;

import '../admin_sdk_mapper.dart';
import '../backend_rtc_client.dart';
import '../models/provider_query_jobs.dart';

class ProviderQueryJobService {
  final SdkworkBackendClient _client;

  ProviderQueryJobService(this._client);

  Future<ProviderQueryJob> create(ProviderQueryJobCreateCommand command) async {
    final response = await _client.rtcProviderQueryJobs.create(
      generated.RtcProviderQueryJobCreateRequest.fromJson(command.toJson()),
    );
    return ProviderQueryJob.fromJson(
      backendResponseEntity(response, 'Provider query job create failed'),
    );
  }

  Future<ProviderQueryJob> get(String id) async {
    final response = await _client.rtcProviderQueryJobs.retrieve(id);
    return ProviderQueryJob.fromJson(
      backendResponseEntity(response, 'Provider query job $id was not found'),
    );
  }

  Future<List<ProviderQuerySnapshot>> listSnapshots(
    String providerQueryJobId, {
    int? page,
    int? limit,
    String? cursor,
    String? search,
    String? sort,
  }) async {
    final response = await _client.rtcProviderQueryJobs.snapshotsList(
      providerQueryJobId,
      page,
      limit,
      cursor,
      sort,
      search,
    );
    return backendResponseItems(response)
        .map(ProviderQuerySnapshot.fromJson)
        .toList();
  }
}
