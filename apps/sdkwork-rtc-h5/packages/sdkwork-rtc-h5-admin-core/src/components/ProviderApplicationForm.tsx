import { useState } from "react";
import type { ProviderApplicationCommand } from "../types/providerApplication";
import type { ProviderConfigSchema } from "../types/providerSchema";
import { ProviderSchemaForm, validateSchemaFields } from "./ProviderSchemaForm";

interface Props {
  schema: ProviderConfigSchema;
  initial?: Partial<ProviderApplicationCommand>;
  onSubmit: (command: ProviderApplicationCommand) => void;
  onCancel: () => void;
}

export function ProviderApplicationForm({ schema, initial, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    environment: initial?.environment ?? "production",
    region: initial?.region ?? "",
    providerApplicationId: initial?.providerApplicationId ?? "",
    providerApplicationIdKind: initial?.providerApplicationIdKind ?? "app_id",
    accessEndpoint: initial?.accessEndpoint ?? "",
    apiEndpoint: initial?.apiEndpoint ?? "",
    apiHost: initial?.apiHost ?? "",
    apiVersion: initial?.apiVersion ?? "",
    webhookCallbackUrl: initial?.webhookCallbackUrl ?? "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors = validateSchemaFields(schema.applicationFields, values);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    onSubmit({
      code: values.code as string,
      name: values.name as string,
      environment: (values.environment as string) ?? "production",
      region: (values.region as string) || undefined,
      providerApplicationId: values.providerApplicationId as string,
      providerApplicationIdKind: (values.providerApplicationIdKind as string) ?? "app_id",
      accessEndpoint: (values.accessEndpoint as string) || undefined,
      apiEndpoint: (values.apiEndpoint as string) || undefined,
      apiHost: (values.apiHost as string) || undefined,
      apiVersion: (values.apiVersion as string) || undefined,
      webhookCallbackUrl: (values.webhookCallbackUrl as string) || undefined,
      configSnapshot: {},
    });
  };

  return (
    <div className="provider-application-form">
      <h3>{schema.displayName} Application</h3>
      <ProviderSchemaForm
        schema={schema}
        values={values}
        onChange={setValues}
        section="application"
        errors={errors}
      />
      <div className="form-actions">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={handleSubmit} className="primary">Save</button>
      </div>
    </div>
  );
}
