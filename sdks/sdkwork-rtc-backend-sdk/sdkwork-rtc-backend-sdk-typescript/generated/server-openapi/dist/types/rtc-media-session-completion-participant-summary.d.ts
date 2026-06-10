export interface RtcMediaSessionCompletionParticipantSummary {
    participantId: string;
    userId: string;
    displayName: string;
    role: 'host' | 'guest' | 'listener';
    state: 'joining' | 'joined' | 'left' | 'kicked' | 'timeout';
    joinedAt?: string;
    leftAt?: string;
    durationMs?: string | null;
    leaveReason?: string | null;
    providerParticipantId?: string | null;
}
//# sourceMappingURL=rtc-media-session-completion-participant-summary.d.ts.map