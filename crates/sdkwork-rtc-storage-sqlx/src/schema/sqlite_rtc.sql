CREATE TABLE rtc_room (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    owner_user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    status INTEGER NOT NULL,
    metadata TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    deleted_by INTEGER,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_room_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_room_tenant_owner_status_updated
    ON rtc_room (tenant_id, organization_id, owner_user_id, status, updated_at);

CREATE TABLE rtc_room_participant (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    room_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    display_name_snapshot TEXT,
    role INTEGER NOT NULL,
    state INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_room_participant_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_room_participant_room_user UNIQUE (room_id, user_id)
);

CREATE INDEX idx_rtc_room_participant_room_state
    ON rtc_room_participant (tenant_id, organization_id, room_id, state);

CREATE TABLE rtc_call_session (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    room_id TEXT NOT NULL,
    owner_user_id INTEGER NOT NULL,
    call_type INTEGER NOT NULL,
    status INTEGER NOT NULL,
    provider_profile_id TEXT,
    provider_session_id TEXT,
    started_at TEXT,
    connected_at TEXT,
    ended_at TEXT,
    failure_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_call_session_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_call_session_tenant_room_status_updated
    ON rtc_call_session (tenant_id, organization_id, room_id, status, updated_at);

CREATE INDEX idx_rtc_call_session_provider_status
    ON rtc_call_session (provider_profile_id, status, updated_at);

CREATE TABLE rtc_call_participant (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    session_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    display_name_snapshot TEXT NOT NULL,
    role INTEGER NOT NULL,
    state INTEGER NOT NULL,
    audio_muted INTEGER NOT NULL DEFAULT 0,
    video_muted INTEGER NOT NULL DEFAULT 0,
    screen_share_active INTEGER NOT NULL DEFAULT 0,
    provider_participant_id TEXT,
    joined_at TEXT,
    left_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_call_participant_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_call_participant_session_user UNIQUE (session_id, user_id)
);

CREATE INDEX idx_rtc_call_participant_session_state
    ON rtc_call_participant (tenant_id, organization_id, session_id, state);

CREATE TABLE rtc_call_invitation (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    session_id TEXT NOT NULL,
    inviter_user_id INTEGER NOT NULL,
    invitee_user_id INTEGER NOT NULL,
    status INTEGER NOT NULL,
    expire_at TEXT NOT NULL,
    accepted_at TEXT,
    declined_at TEXT,
    idempotency_key TEXT,
    request_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_call_invitation_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_call_invitation_tenant_idempotency UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX idx_rtc_call_invitation_invitee_status_created
    ON rtc_call_invitation (tenant_id, organization_id, invitee_user_id, status, created_at);

CREATE TABLE rtc_signaling_event (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    session_id TEXT NOT NULL,
    sender_user_id INTEGER,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    sequence_no INTEGER NOT NULL,
    idempotency_key TEXT,
    payload_hash TEXT,
    created_at TEXT NOT NULL,
    status INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_signaling_event_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_signaling_event_session_sequence UNIQUE (session_id, sequence_no),
    CONSTRAINT uk_rtc_signaling_event_tenant_idempotency UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX idx_rtc_signaling_event_session_created
    ON rtc_signaling_event (tenant_id, organization_id, session_id, created_at);

CREATE TABLE rtc_media_track (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    session_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    track_kind INTEGER NOT NULL,
    track_source INTEGER NOT NULL,
    provider_track_id TEXT,
    status INTEGER NOT NULL,
    started_at TEXT,
    ended_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_media_track_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_media_track_session_participant_kind
    ON rtc_media_track (tenant_id, organization_id, session_id, participant_id, track_kind);

CREATE TABLE rtc_quality_sample (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    session_id TEXT NOT NULL,
    participant_id TEXT,
    latency_ms INTEGER,
    packet_loss_rate REAL,
    jitter_ms INTEGER,
    bitrate_kbps INTEGER,
    sampled_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_quality_sample_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_quality_sample_session_sampled
    ON rtc_quality_sample (tenant_id, organization_id, session_id, sampled_at);

CREATE TABLE rtc_provider_profile (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    provider TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    status INTEGER NOT NULL,
    config_snapshot TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_provider_profile_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_provider_profile_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX idx_rtc_provider_profile_tenant_status
    ON rtc_provider_profile (tenant_id, organization_id, status);

CREATE TABLE rtc_provider_route (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    provider_profile_id TEXT NOT NULL,
    route_type TEXT NOT NULL,
    region TEXT,
    priority INTEGER NOT NULL DEFAULT 100,
    status INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_provider_route_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_provider_route_profile_type_status_priority
    ON rtc_provider_route (tenant_id, organization_id, provider_profile_id, route_type, status, priority);

CREATE TABLE rtc_session_token_grant (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    session_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    provider_profile_id TEXT,
    token_hash TEXT NOT NULL,
    scope TEXT NOT NULL,
    expire_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT NOT NULL,
    status INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_session_token_grant_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_session_token_grant_session_participant_status
    ON rtc_session_token_grant (tenant_id, organization_id, session_id, participant_id, status);

CREATE INDEX idx_rtc_session_token_grant_expire_status
    ON rtc_session_token_grant (expire_at, status);
