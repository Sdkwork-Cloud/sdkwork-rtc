import type { ConfigFieldSchema, ProviderConfigSchema } from "../types/providerSchema";

interface Props {
  schema: ProviderConfigSchema;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  section: "account" | "application" | "profile";
  errors?: Record<string, string>;
}

export function ProviderSchemaForm({ schema, values, onChange, section, errors = {} }: Props) {
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
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          {field.type === "enum" && field.values ? (
            <select
              id={`field-${field.key}`}
              value={(values[field.key] as string) ?? (field.default as string) ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className={errors[field.key] ? "field-error" : ""}
            >
              <option value="">Select...</option>
              {field.values.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          ) : field.type === "number" ? (
            <input
              id={`field-${field.key}`}
              type="number"
              value={(values[field.key] as number) ?? (field.default as number) ?? ""}
              onChange={(e) => handleChange(field.key, Number(e.target.value))}
              min={field.min}
              max={field.max}
              placeholder={field.placeholder}
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
              <label htmlFor={`field-${field.key}`}>{field.label}</label>
            </div>
          ) : (
            <input
              id={`field-${field.key}`}
              type={field.type === "secret_ref" ? "password" : "text"}
              value={(values[field.key] as string) ?? (field.default as string) ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
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
  values: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (field.hidden) continue;
    const value = values[field.key];
    if (field.required && (value === undefined || value === null || value === "")) {
      errors[field.key] = `${field.label} is required`;
    }
    if (field.type === "number" && value !== undefined && value !== null) {
      const num = Number(value);
      if (field.min !== undefined && num < field.min) {
        errors[field.key] = `${field.label} must be at least ${field.min}`;
      }
      if (field.max !== undefined && num > field.max) {
        errors[field.key] = `${field.label} must be at most ${field.max}`;
      }
    }
  }
  return errors;
}
