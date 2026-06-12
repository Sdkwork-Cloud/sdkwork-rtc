import type { RtcProviderCredential } from './rtc-provider-credential';
export interface RtcProviderCredentialResponse {
    code: string;
    message: string;
    /** Server-owned request correlation id. */
    requestId: string;
    data: RtcProviderCredential;
}
//# sourceMappingURL=rtc-provider-credential-response.d.ts.map