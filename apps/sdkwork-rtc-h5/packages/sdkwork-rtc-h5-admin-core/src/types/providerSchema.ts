export interface ConfigFieldSchema {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "enum" | "secret_ref";
  required?: boolean;
  default?: unknown;
  placeholder?: string;
  values?: string[];
  min?: number;
  max?: number;
  hidden?: boolean;
}

export interface CredentialRoleSchema {
  role: string;
  label: string;
  description: string;
  fields: ConfigFieldSchema[];
}

export interface ProviderConfigSchema {
  provider: string;
  displayName: string;
  description: string;
  accountFields: ConfigFieldSchema[];
  applicationFields: ConfigFieldSchema[];
  credentialRoles: CredentialRoleSchema[];
  profileFields: ConfigFieldSchema[];
  optionalCapabilities: string[];
  requiredCapabilities: string[];
}

export interface ProviderPluginDescriptor {
  pluginId: string;
  domain: string;
  providerKind: string;
  displayName: string;
  interfaceVersion: string;
  configSchemaRef: string;
  defaultSelected: boolean;
  tenantOverrideAllowed: boolean;
  requiredCapabilities: string[];
  optionalCapabilities: string[];
  unsupportedFeatures: string[];
  degradedBehaviors: string[];
}
