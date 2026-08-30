/**
 * Schema-driven form input i18n.
 *
 * Provider config schemas are backend data (`specs/provider-schemas/*.json`)
 * with authored labels that may be provider- or locale-specific. Every
 * rendered input derives its label/placeholder/enum option/role text through
 * these helpers: the key is `admin.rtc.schema.<...>.<provider>.<key>` and the
 * backend-authored string is the fallback, so unknown providers or new field
 * keys degrade gracefully to the backend copy.
 */
import type { TFunction } from "i18next";

import type { ConfigFieldSchema, CredentialRoleSchema } from "../types/providerSchema";

export function schemaFieldLabel(provider: string, field: ConfigFieldSchema, t: TFunction): string {
  return t(`admin.rtc.schema.field.${provider}.${field.key}`, field.label);
}

export function schemaFieldPlaceholder(
  provider: string,
  field: ConfigFieldSchema,
  t: TFunction,
): string {
  return t(
    `admin.rtc.schema.field.${provider}.${field.key}.placeholder`,
    field.placeholder ?? field.label,
  );
}

export function schemaEnumOptionLabel(
  provider: string,
  field: ConfigFieldSchema,
  value: string,
  t: TFunction,
): string {
  return t(`admin.rtc.schema.enum.${provider}.${field.key}.${value}`, value);
}

export function schemaRoleLabel(
  provider: string,
  role: CredentialRoleSchema,
  t: TFunction,
): string {
  return t(`admin.rtc.schema.role.${provider}.${role.role}`, role.label);
}

export function schemaRoleDescription(
  provider: string,
  role: CredentialRoleSchema,
  t: TFunction,
): string {
  return t(`admin.rtc.schema.role.${provider}.${role.role}.description`, role.description);
}

export function schemaProviderDescription(provider: string, description: string, t: TFunction): string {
  return t(`admin.rtc.schema.provider.${provider}.description`, description);
}
