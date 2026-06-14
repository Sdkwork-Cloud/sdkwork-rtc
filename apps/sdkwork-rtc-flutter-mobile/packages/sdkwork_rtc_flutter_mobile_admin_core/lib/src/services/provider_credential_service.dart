import '../models/provider_credential.dart';

class ProviderCredentialService {
  final String baseUrl;

  ProviderCredentialService({required this.baseUrl});

  Future<List<ProviderCredential>> list(String applicationId) async {
    // TODO: Implement HTTP call to backend API
    return [];
  }

  Future<ProviderCredential?> get(String id) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }

  Future<ProviderCredential?> create(String applicationId, ProviderCredentialCommand command) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }

  Future<ProviderCredential?> update(String id, ProviderCredentialCommand command) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }

  Future<ProviderCredential?> revoke(String id, {String? reason}) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }
}
