CREATE TABLE rtc_room (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    owner_user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    status INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP,
    deleted_by BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_room_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_room_tenant_owner_status_updated
    ON rtc_room (tenant_id, organization_id, owner_user_id, status, updated_at);

CREATE TABLE rtc_room_participant (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    room_id VARCHAR(64) NOT NULL,
    user_id BIGINT NOT NULL,
    display_name_snapshot VARCHAR(200),
    role INTEGER NOT NULL,
    state INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_room_participant_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_room_participant_room_user UNIQUE (room_id, user_id)
);

CREATE INDEX idx_rtc_room_participant_room_state
    ON rtc_room_participant (tenant_id, organization_id, room_id, state);

CREATE TABLE rtc_call_session (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    room_id VARCHAR(64) NOT NULL,
    owner_user_id BIGINT NOT NULL,
    call_type INTEGER NOT NULL,
    status INTEGER NOT NULL,
    provider_profile_id VARCHAR(64),
    provider_session_id VARCHAR(256),
    started_at TIMESTAMP,
    connected_at TIMESTAMP,
    ended_at TIMESTAMP,
    failure_reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_call_session_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_call_session_tenant_room_status_updated
    ON rtc_call_session (tenant_id, organization_id, room_id, status, updated_at);

CREATE INDEX idx_rtc_call_session_provider_status
    ON rtc_call_session (provider_profile_id, status, updated_at);

CREATE TABLE rtc_call_participant (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    session_id VARCHAR(64) NOT NULL,
    user_id BIGINT NOT NULL,
    display_name_snapshot VARCHAR(200) NOT NULL,
    role INTEGER NOT NULL,
    state INTEGER NOT NULL,
    audio_muted BOOLEAN NOT NULL DEFAULT FALSE,
    video_muted BOOLEAN NOT NULL DEFAULT FALSE,
    screen_share_active BOOLEAN NOT NULL DEFAULT FALSE,
    provider_participant_id VARCHAR(256),
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_call_participant_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_call_participant_session_user UNIQUE (session_id, user_id)
);

CREATE INDEX idx_rtc_call_participant_session_state
    ON rtc_call_participant (tenant_id, organization_id, session_id, state);

CREATE TABLE rtc_call_invitation (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    session_id VARCHAR(64) NOT NULL,
    inviter_user_id BIGINT NOT NULL,
    invitee_user_id BIGINT NOT NULL,
    status INTEGER NOT NULL,
    expire_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    declined_at TIMESTAMP,
    idempotency_key VARCHAR(128),
    request_id UUID,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_call_invitation_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_call_invitation_tenant_idempotency UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX idx_rtc_call_invitation_invitee_status_created
    ON rtc_call_invitation (tenant_id, organization_id, invitee_user_id, status, created_at);

CREATE TABLE rtc_signaling_event (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    session_id VARCHAR(64) NOT NULL,
    sender_user_id BIGINT,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    sequence_no BIGINT NOT NULL,
    idempotency_key VARCHAR(128),
    payload_hash VARCHAR(128),
    created_at TIMESTAMP NOT NULL,
    status INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_signaling_event_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_signaling_event_session_sequence UNIQUE (session_id, sequence_no),
    CONSTRAINT uk_rtc_signaling_event_tenant_idempotency UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX idx_rtc_signaling_event_session_created
    ON rtc_signaling_event (tenant_id, organization_id, session_id, created_at);

CREATE TABLE rtc_media_track (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    session_id VARCHAR(64) NOT NULL,
    participant_id VARCHAR(64) NOT NULL,
    track_kind INTEGER NOT NULL,
    track_source INTEGER NOT NULL,
    provider_track_id VARCHAR(256),
    status INTEGER NOT NULL,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_media_track_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_media_track_session_participant_kind
    ON rtc_media_track (tenant_id, organization_id, session_id, participant_id, track_kind);

CREATE TABLE rtc_quality_sample (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    session_id VARCHAR(64) NOT NULL,
    participant_id VARCHAR(64),
    latency_ms INTEGER,
    packet_loss_rate NUMERIC(8, 6),
    jitter_ms INTEGER,
    bitrate_kbps INTEGER,
    sampled_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_quality_sample_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_quality_sample_session_sampled
    ON rtc_quality_sample (tenant_id, organization_id, session_id, sampled_at);

CREATE TABLE rtc_provider_profile (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    provider VARCHAR(64) NOT NULL,
    code VARCHAR(128) NOT NULL,
    name VARCHAR(200) NOT NULL,
    status INTEGER NOT NULL,
    config_snapshot JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_provider_profile_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_provider_profile_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX idx_rtc_provider_profile_tenant_status
    ON rtc_provider_profile (tenant_id, organization_id, status);

CREATE TABLE rtc_provider_route (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    provider_profile_id VARCHAR(64) NOT NULL,
    route_type VARCHAR(64) NOT NULL,
    region VARCHAR(64),
    priority INTEGER NOT NULL DEFAULT 100,
    status INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_provider_route_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_provider_route_profile_type_status_priority
    ON rtc_provider_route (tenant_id, organization_id, provider_profile_id, route_type, status, priority);

CREATE TABLE rtc_session_token_grant (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    session_id VARCHAR(64) NOT NULL,
    participant_id VARCHAR(64) NOT NULL,
    provider_profile_id VARCHAR(64),
    token_hash VARCHAR(256) NOT NULL,
    scope VARCHAR(256) NOT NULL,
    expire_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    status INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_session_token_grant_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_session_token_grant_session_participant_status
    ON rtc_session_token_grant (tenant_id, organization_id, session_id, participant_id, status);

CREATE INDEX idx_rtc_session_token_grant_expire_status
    ON rtc_session_token_grant (expire_at, status);
