import type { HttpClient } from '../http/client';
import type { RtcProviderWebhookEventListResponse, RtcProviderWebhookEventResponse, RtcProviderWebhookReceiveRequest } from '../types';
export interface RtcProviderWebhooksRtcProviderWebhooksEventsListParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
    sort?: string;
    q?: string;
}
export declare class RtcProviderWebhooksRtcProviderWebhooksEventsApi {
    private client;
    constructor(client: HttpClient);
    /** Rtc provider Webhooks events receive. */
    receive(provider: string, body: RtcProviderWebhookReceiveRequest): Promise<RtcProviderWebhookEventResponse>;
    /** Rtc provider Webhooks events list. */
    list(params?: RtcProviderWebhooksRtcProviderWebhooksEventsListParams): Promise<RtcProviderWebhookEventListResponse>;
}
export declare class RtcProviderWebhooksRtcProviderWebhooksApi {
    private client;
    readonly events: RtcProviderWebhooksRtcProviderWebhooksEventsApi;
    constructor(client: HttpClient);
}
export declare class RtcProviderWebhooksRtcApi {
    private client;
    readonly providerWebhooks: RtcProviderWebhooksRtcProviderWebhooksApi;
    constructor(client: HttpClient);
}
export declare class RtcProviderWebhooksApi {
    private client;
    readonly rtc: RtcProviderWebhooksRtcApi;
    constructor(client: HttpClient);
}
export declare function createRtcProviderWebhooksApi(client: HttpClient): RtcProviderWebhooksApi;
//# sourceMappingURL=rtc-provider-webhooks.d.ts.map