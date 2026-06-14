import '../models/provider_route.dart';

class ProviderRouteService {
  final String baseUrl;

  ProviderRouteService({required this.baseUrl});

  Future<List<ProviderRoute>> list() async {
    // TODO: Implement HTTP call to backend API
    return [];
  }

  Future<ProviderRoute?> create(ProviderRouteCommand command) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }
}
