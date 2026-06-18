import 'package:flutter/material.dart';
import '../models/provider_schema.dart';

class ProviderSchemaForm extends StatelessWidget {
  final ProviderConfigSchema schema;
  final Map<String, dynamic> values;
  final ValueChanged<Map<String, dynamic>> onChanged;
  final String section;

  const ProviderSchemaForm({
    super.key,
    required this.schema,
    required this.values,
    required this.onChanged,
    required this.section,
  });

  List<ConfigFieldSchema> get _fields {
    switch (section) {
      case 'account':
        return schema.accountFields;
      case 'application':
        return schema.applicationFields;
      case 'profile':
        return schema.profileFields;
      default:
        return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    final visibleFields = _fields.where((f) => !f.hidden).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: visibleFields.map((field) => _buildField(context, field)).toList(),
    );
  }

  Widget _buildField(BuildContext context, ConfigFieldSchema field) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${field.label}${field.required ? ' *' : ''}',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 4),
          if (field.type == 'enum' && field.values != null)
            DropdownButtonFormField<String>(
              key: ValueKey('${field.key}-${values[field.key]}'),
              initialValue: values[field.key] as String? ?? field.defaultValue as String?,
              items: field.values!
                  .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                  .toList(),
              onChanged: (v) => _updateField(field.key, v),
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: field.placeholder,
              ),
            )
          else if (field.type == 'number')
            TextFormField(
              initialValue: (values[field.key] ?? field.defaultValue)?.toString() ?? '',
              keyboardType: TextInputType.number,
              onChanged: (v) => _updateField(field.key, int.tryParse(v) ?? 0),
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: field.placeholder,
              ),
            )
          else
            TextFormField(
              initialValue: (values[field.key] ?? field.defaultValue)?.toString() ?? '',
              obscureText: field.type == 'secret_ref',
              onChanged: (v) => _updateField(field.key, v),
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: field.placeholder,
              ),
            ),
        ],
      ),
    );
  }

  void _updateField(String key, dynamic value) {
    final updated = Map<String, dynamic>.from(values);
    updated[key] = value;
    onChanged(updated);
  }
}
