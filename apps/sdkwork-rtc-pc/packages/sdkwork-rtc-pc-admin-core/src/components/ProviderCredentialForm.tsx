import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProviderCredentialCommand } from "../types/providerCredential";
import type { CredentialRoleSchema, ConfigFieldSchema } from "../types/providerSchema";
import {
  schemaFieldLabel,
  schemaFieldPlaceholder,
  schemaRoleDescription,
  schemaRoleLabel,
} from "../utils/schemaI18n";

interface Props {
  provider: string;
  roles: CredentialRoleSchema[];
  onSubmit: (command: ProviderCredentialCommand) => void;
  onCancel: () => void;
}

export function ProviderCredentialForm({ provider, roles, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeRole = roles.find((r) => r.role === selectedRole);

  const handleSubmit = () => {
    if (!activeRole) return;
    const newErrors: Record<string, string> = {};
    for (const field of activeRole.fields) {
      if (field.required && !values[field.key]) {
        newErrors[field.key] = t("admin.rtc.credentials.fieldRequired", "{{label}} is required", {
          label: schemaFieldLabel(provider, field, t),
        });
      }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    onSubmit({
      credentialRole: activeRole.role,
      credentialLabel: schemaRoleLabel(provider, activeRole, t),
      credentialRef: values.credentialRef ?? "",
      credentialFingerprint: values.credentialFingerprint || undefined,
    });
  };

  if (!selectedRole) {
    return (
      <div className="provider-credential-form">
        <h3>{t("admin.rtc.credentials.addTitle", "Add Credential")}</h3>
        <p>{t("admin.rtc.credentials.selectRole", "Select a credential role to configure:")}</p>
        {roles.map((role) => (
          <div key={role.role} className="credential-role-card">
            <button
              className="credential-role-select"
              onClick={() => {
                setSelectedRole(role.role);
                const initial: Record<string, string> = {};
                for (const field of role.fields) {
                  initial[field.key] = "";
                }
                setValues(initial);
              }}
            >
              <strong>{schemaRoleLabel(provider, role, t)}</strong>
              <span>{schemaRoleDescription(provider, role, t)}</span>
            </button>
          </div>
        ))}
        <div className="form-actions">
          <button onClick={onCancel}>{t("admin.rtc.cancel", "Cancel")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="provider-credential-form">
      <h3>
        {t("admin.rtc.credentials.configureTitle", "Configure {{label}}", {
          label: schemaRoleLabel(provider, activeRole!, t),
        })}
      </h3>
      <p>{schemaRoleDescription(provider, activeRole!, t)}</p>
      {activeRole!.fields.map((field: ConfigFieldSchema) => (
        <div key={field.key} className="form-field">
          <label htmlFor={`cred-${field.key}`}>
            {schemaFieldLabel(provider, field, t)}
            {field.required && <span className="required">*</span>}
          </label>
          <input
            id={`cred-${field.key}`}
            type={field.type === "secret_ref" ? "password" : "text"}
            value={values[field.key] ?? ""}
            onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
            placeholder={schemaFieldPlaceholder(provider, field, t)}
            className={errors[field.key] ? "field-error" : ""}
          />
          {errors[field.key] && (
            <span className="field-error-message">{errors[field.key]}</span>
          )}
        </div>
      ))}
      <div className="form-actions">
        <button onClick={() => setSelectedRole(null)}>{t("admin.rtc.back", "Back")}</button>
        <button onClick={onCancel}>{t("admin.rtc.cancel", "Cancel")}</button>
        <button onClick={handleSubmit} className="primary">
          {t("admin.rtc.credentials.saveCredential", "Save Credential")}
        </button>
      </div>
    </div>
  );
}
