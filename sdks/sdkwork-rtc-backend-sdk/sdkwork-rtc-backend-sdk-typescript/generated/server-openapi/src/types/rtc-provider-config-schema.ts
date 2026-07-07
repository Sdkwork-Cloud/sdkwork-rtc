import type { RtcProviderConfigFieldSchema } from './rtc-provider-config-field-schema';
import type { RtcProviderCredentialRoleSchema } from './rtc-provider-credential-role-schema';

export interface RtcProviderConfigSchema {
  provider: string;
  displayName: string;
  description: string;
  accountFields: RtcProviderConfigFieldSchema[];
  applicationFields: RtcProviderConfigFieldSchema[];
  credentialRoles: RtcProviderCredentialRoleSchema[];
  profileFields: RtcProviderConfigFieldSchema[];
  optionalCapabilities: string[];
  requiredCapabilities: string[];
}
