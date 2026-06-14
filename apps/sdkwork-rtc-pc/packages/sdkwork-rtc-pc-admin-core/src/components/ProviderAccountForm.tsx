import { useState } from "react";
import type { ProviderAccountCommand } from "../types/providerAccount";
import type { ProviderConfigSchema } from "../types/providerSchema";
import { ProviderSchemaForm, validateSchemaFields } from "./ProviderSchemaForm";

interface Props {
  schema: ProviderConfigSchema;
  initial?: Partial<ProviderAccountCommand>;
  onSubmit: (command: ProviderAccountCommand) => void;
  onCancel: () => void;
}

export function ProviderAccountForm({ schema, initial, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    environment: initial?.environment ?? "production",
    externalTenantId: initial?.externalTenantId ?? "",
    cloudAccountId: initial?.cloudAccountId ?? "",
    projectId: initial?.projectId ?? "",
    resourceGroupId: initial?.resourceGroupId ?? "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors = validateSchemaFields(schema.accountFields, values);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    onSubmit({
      provider: schema.provider,
      code: values.code as string,
      name: values.name as string,
      environment: (values.environment as string) ?? "production",
      externalTenantId: (values.externalTenantId as string) || undefined,
      cloudAccountId: (values.cloudAccountId as string) || undefined,
      projectId: (values.projectId as string) || undefined,
      resourceGroupId: (values.resourceGroupId as string) || undefined,
    });
  };

  return (
    <div className="provider-account-form">
      <h3>{schema.displayName} Account</h3>
      <ProviderSchemaForm
        schema={schema}
        values={values}
        onChange={setValues}
        section="account"
        errors={errors}
      />
      <div className="form-actions">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={handleSubmit} className="primary">Save</button>
      </div>
    </div>
  );
}
