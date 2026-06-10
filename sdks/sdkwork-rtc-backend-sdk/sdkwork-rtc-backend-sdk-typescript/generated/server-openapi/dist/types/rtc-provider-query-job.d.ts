export interface RtcProviderQueryJob {
    id: string;
    tenantId?: string;
    organizationId?: string;
    provider: string;
    providerProfileId?: string | null;
    queryKind: 'room_online_users' | 'room_state' | 'media_session_state' | 'recording_artifacts' | 'quality_samples';
    targetKind: 'room' | 'media_session' | 'recording' | 'quality';
    targetId: string;
    roomId?: string | null;
    mediaSessionId?: string | null;
    providerSessionId?: string | null;
    providerRequestId?: string | null;
    status: 'requested' | 'running' | 'completed' | 'failed';
    requestedAt: string;
    completedAt?: string;
    resultSnapshot?: Record<string, unknown>;
}
//# sourceMappingURL=rtc-provider-query-job.d.ts.map