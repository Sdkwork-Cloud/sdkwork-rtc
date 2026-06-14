import '../models/provider_profile.dart';

class ProviderProfileService {
  final String baseUrl;

  ProviderProfileService({required this.baseUrl});

  Future<List<ProviderProfile>> list({String? provider}) async {
    // TODO: Implement HTTP call to backend API
    return [];
  }

  Future<ProviderProfile?> get(String id) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }

  Future<ProviderProfile?> create(ProviderProfileCommand command) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }

  Future<ProviderProfile?> update(String id, ProviderProfileCommand command) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }

  Future<ProviderProfile?> disable(String id, {String? reason}) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }

  Future<Map<String, dynamic>?> verify(String id, String queryKind, {int? timeoutMs}) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }
}
