import 'dart:convert';
import '../models/provider_schema.dart';

class ProviderSchemaService {
  final String baseUrl;

  ProviderSchemaService({required this.baseUrl});

  Future<List<ProviderConfigSchema>> listSchemas() async {
    // TODO: Implement HTTP call to backend API
    return [];
  }

  Future<ProviderConfigSchema?> getSchema(String provider) async {
    // TODO: Implement HTTP call to backend API
    return null;
  }
}
