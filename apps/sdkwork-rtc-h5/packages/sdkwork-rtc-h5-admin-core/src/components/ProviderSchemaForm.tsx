import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { ConfigFieldSchema, ProviderConfigSchema } from "../types/providerSchema";
import {
  schemaEnumOptionLabel,
  schemaFieldLabel,
  schemaFieldPlaceholder,
} from "../utils/schemaI18n";

interface Props {
  schema: ProviderConfigSchema;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  section: "account" | "application" | "profile";
  errors?: Record<string, string>;
}

export function ProviderSchemaForm({ schema, values, onChange, section, errors = {} }: Props) {
  const { t } = useTranslation();
  const fields: ConfigFieldSchema[] =
    section === "account"
      ? schema.accountFields
      : section === "application"
      ? schema.applicationFields
      : schema.profileFields;

  const visibleFields = fields.filter((f) => !f.hidden);

  const handleChange = (key: string, value: unknown) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="provider-schema-form">
      {visibleFields.map((field) => (
        <div key={field.key} className="form-field">
          <label htmlFor={`field-${field.key}`}>
            {schemaFieldLabel(schema.provider, field, t)}
            {field.required && <span className="required">*</span>}
          </label>
          {field.type === "enum" && field.values ? (
            <select
              id={`field-${field.key}`}
              value={(values[field.key] as string) ?? (field.default as string) ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className={errors[field.key] ? "field-error" : ""}
            >
              <option value="">{t("admin.rtc.schema.select", "Select...")}</option>
              {field.values.map((v) => (
                <option key={v} value={v}>
                  {schemaEnumOptionLabel(schema.provider, field, v, t)}
                </option>
              ))}
            </select>
          ) : field.type === "number" ? (
            <input
              id={`field-${field.key}`}
              type="number"
              value={(values[field.key] as number) ?? (field.default as number) ?? ""}
              onChange={(e) => handleChange(field.key, Number(e.target.value))}
              min={field.min ?? undefined}
              max={field.max ?? undefined}
              placeholder={schemaFieldPlaceholder(schema.provider, field, t)}
              className={errors[field.key] ? "field-error" : ""}
            />
          ) : field.type === "boolean" ? (
            <div className="checkbox-field">
              <input
                id={`field-${field.key}`}
                type="checkbox"
                checked={(values[field.key] as boolean) ?? (field.default as boolean) ?? false}
                onChange={(e) => handleChange(field.key, e.target.checked)}
              />
              <label htmlFor={`field-${field.key}`}>{schemaFieldLabel(schema.provider, field, t)}</label>
            </div>
          ) : (
            <input
              id={`field-${field.key}`}
              type={field.type === "secret_ref" ? "password" : "text"}
              value={(values[field.key] as string) ?? (field.default as string) ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={schemaFieldPlaceholder(schema.provider, field, t)}
              className={errors[field.key] ? "field-error" : ""}
            />
          )}
          {errors[field.key] && (
            <span className="field-error-message">{errors[field.key]}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function validateSchemaFields(
  fields: ConfigFieldSchema[],
  values: Record<string, unknown>,
  t: TFunction,
  schema?: ProviderConfigSchema,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (field.hidden) continue;
    const value = values[field.key];
    const label = schema ? schemaFieldLabel(schema.provider, field, t) : field.label;
    if (field.required && (value === undefined || value === null || value === "")) {
      errors[field.key] = t("admin.rtc.schema.fieldRequired", "{{label}} is required", {
        label,
      });
    }
    if (field.type === "number" && value !== undefined && value !== null) {
      const num = Number(value);
      if (field.min != null && num < field.min) {
        errors[field.key] = t("admin.rtc.schema.minValue", "{{label}} must be at least {{min}}", {
          label,
          min: field.min,
        });
      }
      if (field.max != null && num > field.max) {
        errors[field.key] = t("admin.rtc.schema.maxValue", "{{label}} must be at most {{max}}", {
          label,
          max: field.max,
        });
      }
    }
  }
  return errors;
}
