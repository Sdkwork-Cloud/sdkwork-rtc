export interface RtcProviderPluginDescriptor {
  pluginId: string;
  domain: 'rtc';
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
