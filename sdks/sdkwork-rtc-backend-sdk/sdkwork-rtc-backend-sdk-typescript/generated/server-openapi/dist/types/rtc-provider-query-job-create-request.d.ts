export interface RtcProviderQueryJobCreateRequest {
    provider: string;
    providerProfileId?: string | null;
    queryKind: 'room_online_users' | 'room_state' | 'media_session_state' | 'recording_artifacts' | 'quality_samples';
    roomId?: string | null;
    mediaSessionId?: string | null;
    providerSessionId?: string | null;
    cursor?: string | null;
}
//# sourceMappingURL=rtc-provider-query-job-create-request.d.ts.map