export interface RtcProviderApplicationCommand {
    code: string;
    name: string;
    status?: 'active' | 'disabled' | 'archived';
    environment: 'production' | 'staging' | 'development' | 'test' | 'sandbox';
    region?: string | null;
    providerApplicationId: string;
    providerApplicationIdKind: 'volcengine_app_id' | 'tencent_sdk_app_id' | 'provider_application_id';
    accessEndpoint?: string;
    apiEndpoint?: string;
    apiHost?: string | null;
    apiVersion?: string | null;
    webhookCallbackUrl?: string;
    configSnapshot: Record<string, unknown>;
}
//# sourceMappingURL=rtc-provider-application-command.d.ts.map