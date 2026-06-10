/** RTC provider webhook body. Provider gateways may wrap the provider payload in rawPayload, while direct Volcengine/Tencent callbacks may send provider-native JSON at the top level; the RTC provider plugin normalizes either shape and verifies provider-native signatures. */
export interface RtcProviderWebhookReceiveRequest {
    providerProfileId?: string | null;
    externalEventId?: string | null;
    signatureHeader?: string | null;
    headers?: Record<string, string>;
    rawPayload?: Record<string, unknown>;
    /** Optional gateway receive timestamp. The RTC runtime records the authoritative receive time when this field is absent. */
    receivedAt?: string;
}
//# sourceMappingURL=rtc-provider-webhook-receive-request.d.ts.map