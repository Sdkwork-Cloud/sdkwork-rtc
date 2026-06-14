import '../models/provider_account.dart';

class ProviderAccountService {
  final String baseUrl;

  ProviderAccountService({required this.baseUrl});

  Future<List<ProviderAccount>> list({String? provider, String? status}) async {
    // TODO: Implement HTTP call to backend API
    return [];
  }

  Future<ProviderAccount?> get(String id) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }

  Future<ProviderAccount?> create(ProviderAccountCommand command) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }

  Future<ProviderAccount?> update(String id, ProviderAccountCommand command) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }

  Future<ProviderAccount?> disable(String id, {String? reason}) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }
}
