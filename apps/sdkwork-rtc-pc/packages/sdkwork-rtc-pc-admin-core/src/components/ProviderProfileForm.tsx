import { useState } from "react";
import type { ProviderProfileCommand } from "../types/providerProfile";
import type { ProviderConfigSchema } from "../types/providerSchema";
import { ProviderSchemaForm, validateSchemaFields } from "./ProviderSchemaForm";

interface Props {
  schema: ProviderConfigSchema;
  initial?: Partial<ProviderProfileCommand>;
  onSubmit: (command: ProviderProfileCommand) => void;
  onCancel: () => void;
}

export function ProviderProfileForm({ schema, initial, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    isDefault: initial?.isDefault ?? false,
    priority: initial?.priority ?? 0,
    environment: initial?.environment ?? "production",
    region: initial?.region ?? "",
    providerAppId: initial?.providerAppId ?? "",
    endpoint: initial?.endpoint ?? "",
    credentialRef: initial?.credentialRef ?? "",
    webhookSecretRef: initial?.webhookSecretRef ?? "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors = validateSchemaFields(schema.profileFields, values);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    onSubmit({
      provider: schema.provider,
      code: values.code as string,
      name: values.name as string,
      isDefault: (values.isDefault as boolean) ?? false,
      priority: (values.priority as number) ?? 0,
      environment: (values.environment as string) ?? "production",
      region: (values.region as string) || undefined,
      providerAppId: (values.providerAppId as string) || undefined,
      endpoint: (values.endpoint as string) || undefined,
      credentialRef: (values.credentialRef as string) || undefined,
      webhookSecretRef: (values.webhookSecretRef as string) || undefined,
      capabilities: {
        audio: true,
        video: true,
        live: true,
        screenShare: true,
        recording: true,
        webhook: true,
        activeQuery: true,
        supportedRegions: [],
        providerFeatures: {},
      },
      configSnapshot: {},
    });
  };

  return (
    <div className="provider-profile-form">
      <h3>{schema.displayName} Profile</h3>
      <ProviderSchemaForm
        schema={schema}
        values={values}
        onChange={setValues}
        section="profile"
        errors={errors}
      />
      <div className="form-actions">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={handleSubmit} className="primary">Save</button>
      </div>
    </div>
  );
}
