import { useState } from "react";
import type { ProviderCredentialCommand } from "../types/providerCredential";
import type { CredentialRoleSchema, ConfigFieldSchema } from "../types/providerSchema";

interface Props {
  roles: CredentialRoleSchema[];
  onSubmit: (command: ProviderCredentialCommand) => void;
  onCancel: () => void;
}

export function ProviderCredentialForm({ roles, onSubmit, onCancel }: Props) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeRole = roles.find((r) => r.role === selectedRole);

  const handleSubmit = () => {
    if (!activeRole) return;
    const newErrors: Record<string, string> = {};
    for (const field of activeRole.fields) {
      if (field.required && !values[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    onSubmit({
      credentialRole: activeRole.role,
      credentialLabel: activeRole.label,
      credentialRef: values.credentialRef ?? "",
      credentialFingerprint: values.credentialFingerprint || undefined,
    });
  };

  if (!selectedRole) {
    return (
      <div className="provider-credential-form">
        <h3>Add Credential</h3>
        <p>Select a credential role to configure:</p>
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
              <strong>{role.label}</strong>
              <span>{role.description}</span>
            </button>
          </div>
        ))}
        <div className="form-actions">
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="provider-credential-form">
      <h3>Configure {activeRole!.label}</h3>
      <p>{activeRole!.description}</p>
      {activeRole!.fields.map((field: ConfigFieldSchema) => (
        <div key={field.key} className="form-field">
          <label htmlFor={`cred-${field.key}`}>
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          <input
            id={`cred-${field.key}`}
            type={field.type === "secret_ref" ? "password" : "text"}
            value={values[field.key] ?? ""}
            onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
            placeholder={field.placeholder}
            className={errors[field.key] ? "field-error" : ""}
          />
          {errors[field.key] && (
            <span className="field-error-message">{errors[field.key]}</span>
          )}
        </div>
      ))}
      <div className="form-actions">
        <button onClick={() => setSelectedRole(null)}>Back</button>
        <button onClick={onCancel}>Cancel</button>
        <button onClick={handleSubmit} className="primary">Save Credential</button>
      </div>
    </div>
  );
}
