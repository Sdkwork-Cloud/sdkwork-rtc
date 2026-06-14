import '../models/provider_application.dart';

class ProviderApplicationService {
  final String baseUrl;

  ProviderApplicationService({required this.baseUrl});

  Future<List<ProviderApplication>> list(String accountId) async {
    // TODO: Implement HTTP call to backend API
    return [];
  }

  Future<ProviderApplication?> get(String id) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }

  Future<ProviderApplication?> create(String accountId, ProviderApplicationCommand command) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }

  Future<ProviderApplication?> update(String id, ProviderApplicationCommand command) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }

  Future<ProviderApplication?> disable(String id, {String? reason}) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }
}
