import type { RtcProviderConfigFieldSchema } from './rtc-provider-config-field-schema';

export interface RtcProviderCredentialRoleSchema {
  role: string;
  label: string;
  description: string;
  fields: RtcProviderConfigFieldSchema[];
}
