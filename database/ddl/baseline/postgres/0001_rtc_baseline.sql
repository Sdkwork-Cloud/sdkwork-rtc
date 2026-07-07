-- SDKWork rtc consolidated initialization baseline (postgres)
-- Generated from crates/sdkwork-communication-rtc-repository-sqlx/src/schema/postgres_rtc.sql
-- Application is in initialization state: full DDL lives here; migrations/ is reserved for post-GA changes.
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

-- Reserved DDL for future persistent room membership. Active call participation uses rtc_media_participant.
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

CREATE TABLE rtc_media_session (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    room_id VARCHAR(64) NOT NULL,
    owner_user_id BIGINT NOT NULL,
    media_mode INTEGER NOT NULL,
    status INTEGER NOT NULL,
    provider_profile_id VARCHAR(64),
    provider_session_id VARCHAR(256),
    started_at TIMESTAMP,
    connected_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration_ms BIGINT,
    end_reason VARCHAR(500),
    end_source VARCHAR(64),
    failure_reason VARCHAR(500),
    participant_count INTEGER NOT NULL DEFAULT 0,
    max_concurrent_participants INTEGER NOT NULL DEFAULT 0,
    quality_summary_snapshot JSONB,
    recording_summary_snapshot JSONB,
    completion_recorded_at TIMESTAMP,
    last_provider_webhook_event_id VARCHAR(64),
    last_provider_query_job_id VARCHAR(64),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_media_session_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_media_session_tenant_room_status_updated
    ON rtc_media_session (tenant_id, organization_id, room_id, status, updated_at);

CREATE INDEX idx_rtc_media_session_provider_status
    ON rtc_media_session (provider_profile_id, status, updated_at);

CREATE INDEX idx_rtc_media_session_completion_recorded
    ON rtc_media_session (tenant_id, organization_id, completion_recorded_at);

CREATE TABLE rtc_media_session_completion_record (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    session_id VARCHAR(64) NOT NULL,
    room_id VARCHAR(64) NOT NULL,
    owner_user_id BIGINT NOT NULL,
    provider_profile_id VARCHAR(64),
    provider_session_id VARCHAR(256),
    media_mode INTEGER NOT NULL,
    session_status INTEGER NOT NULL,
    started_at TIMESTAMP,
    connected_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration_ms BIGINT,
    end_reason VARCHAR(500),
    end_source VARCHAR(64),
    participant_count INTEGER NOT NULL DEFAULT 0,
    max_concurrent_participants INTEGER NOT NULL DEFAULT 0,
    artifact_count INTEGER NOT NULL DEFAULT 0,
    recording_artifact_count INTEGER NOT NULL DEFAULT 0,
    failed_artifact_count INTEGER NOT NULL DEFAULT 0,
    quality_summary_snapshot JSONB NOT NULL,
    recording_summary_snapshot JSONB NOT NULL,
    participant_summary_snapshot JSONB NOT NULL,
    track_summary_snapshot JSONB NOT NULL,
    artifact_summary_snapshot JSONB NOT NULL,
    provider_webhook_event_id VARCHAR(64),
    provider_query_job_id VARCHAR(64),
    completion_snapshot JSONB NOT NULL,
    completion_snapshot_hash VARCHAR(128) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_media_session_completion_record_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_media_session_completion_record_session UNIQUE (session_id)
);

CREATE INDEX idx_rtc_media_session_completion_record_tenant_recorded
    ON rtc_media_session_completion_record (tenant_id, organization_id, recorded_at);

CREATE INDEX idx_rtc_media_session_completion_record_provider_recorded
    ON rtc_media_session_completion_record (provider_profile_id, recorded_at);

CREATE TABLE rtc_media_artifact (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    session_id VARCHAR(64) NOT NULL,
    owner_user_id BIGINT NOT NULL,
    artifact_kind INTEGER NOT NULL,
    artifact_status INTEGER NOT NULL,
    media_role VARCHAR(64) NOT NULL,
    provider_profile_id VARCHAR(64),
    provider_artifact_id VARCHAR(256),
    drive_space_id VARCHAR(64) NOT NULL,
    drive_space_type VARCHAR(32) NOT NULL DEFAULT 'rtc',
    drive_node_id VARCHAR(64) NOT NULL,
    drive_uri VARCHAR(512) NOT NULL,
    media_resource_snapshot JSONB NOT NULL,
    resource_hash VARCHAR(128) NOT NULL,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration_ms BIGINT,
    failure_reason VARCHAR(500),
    source_provider_webhook_event_id VARCHAR(64),
    source_provider_query_job_id VARCHAR(64),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_media_artifact_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_media_artifact_drive_uri UNIQUE (drive_uri),
    CONSTRAINT ck_rtc_media_artifact_drive_uri CHECK (drive_uri LIKE 'drive://spaces/%/nodes/%'),
    CONSTRAINT ck_rtc_media_artifact_drive_space_type CHECK (drive_space_type = 'rtc')
);

CREATE INDEX idx_rtc_media_artifact_session_created
    ON rtc_media_artifact (tenant_id, organization_id, session_id, created_at);

CREATE INDEX idx_rtc_media_artifact_owner_created
    ON rtc_media_artifact (tenant_id, organization_id, owner_user_id, created_at);

CREATE TABLE rtc_media_participant (
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
    duration_ms BIGINT,
    leave_reason VARCHAR(500),
    last_seen_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_media_participant_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_media_participant_session_user UNIQUE (session_id, user_id)
);

CREATE INDEX idx_rtc_media_participant_session_state
    ON rtc_media_participant (tenant_id, organization_id, session_id, state);

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
    duration_ms BIGINT,
    muted_duration_ms BIGINT,
    end_reason VARCHAR(500),
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

CREATE TABLE rtc_provider_account (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    provider VARCHAR(64) NOT NULL,
    code VARCHAR(128) NOT NULL,
    name VARCHAR(200) NOT NULL,
    status INTEGER NOT NULL,
    environment VARCHAR(64) NOT NULL DEFAULT 'production',
    external_tenant_id VARCHAR(256),
    cloud_account_id VARCHAR(256),
    project_id VARCHAR(256),
    resource_group_id VARCHAR(256),
    last_verified_at TIMESTAMP,
    last_verification_error VARCHAR(1000),
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP,
    deleted_by BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_provider_account_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_provider_account_tenant_org_provider_code UNIQUE (
        tenant_id,
        organization_id,
        provider,
        code
    )
);

CREATE INDEX idx_rtc_provider_account_scope_provider_status
    ON rtc_provider_account (tenant_id, organization_id, provider, status);

CREATE TABLE rtc_provider_application (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    provider_account_id VARCHAR(64) NOT NULL,
    provider VARCHAR(64) NOT NULL,
    code VARCHAR(128) NOT NULL,
    name VARCHAR(200) NOT NULL,
    status INTEGER NOT NULL,
    environment VARCHAR(64) NOT NULL DEFAULT 'production',
    region VARCHAR(64),
    provider_application_id VARCHAR(256) NOT NULL,
    provider_application_id_kind VARCHAR(128) NOT NULL,
    access_endpoint VARCHAR(512),
    api_endpoint VARCHAR(512),
    api_host VARCHAR(256),
    api_version VARCHAR(64),
    webhook_callback_url VARCHAR(512),
    config_snapshot JSONB NOT NULL,
    last_verified_at TIMESTAMP,
    last_verification_error VARCHAR(1000),
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP,
    deleted_by BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_provider_application_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_provider_application_account_code UNIQUE (
        provider_account_id,
        code
    )
    -- idx_rtc_provider_application_scope_provider_status
);

CREATE INDEX idx_rtc_provider_application_scope_provider_status
    ON rtc_provider_application (tenant_id, organization_id, provider, status);

CREATE INDEX idx_rtc_provider_application_account_status
    ON rtc_provider_application (provider_account_id, status);

CREATE TABLE rtc_provider_credential (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    provider_account_id VARCHAR(64) NOT NULL,
    provider_application_id VARCHAR(64) NOT NULL,
    provider VARCHAR(64) NOT NULL,
    credential_role INTEGER NOT NULL,
    credential_label VARCHAR(128) NOT NULL,
    credential_ref VARCHAR(512) NOT NULL,
    credential_fingerprint VARCHAR(128),
    secret_version VARCHAR(128),
    status INTEGER NOT NULL,
    valid_from TIMESTAMP,
    expires_at TIMESTAMP,
    rotation_due_at TIMESTAMP,
    rotated_at TIMESTAMP,
    revoked_at TIMESTAMP,
    last_verified_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_provider_credential_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_provider_credential_application_role_label UNIQUE (
        provider_application_id,
        credential_role,
        credential_label
    )
    -- idx_rtc_provider_credential_scope_role_status
);

CREATE INDEX idx_rtc_provider_credential_scope_role_status
    ON rtc_provider_credential (
        tenant_id,
        organization_id,
        provider,
        credential_role,
        status
    );

CREATE INDEX idx_rtc_provider_credential_application_status
    ON rtc_provider_credential (provider_application_id, status);

CREATE TABLE rtc_provider_profile (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    provider VARCHAR(64) NOT NULL,
    code VARCHAR(128) NOT NULL,
    name VARCHAR(200) NOT NULL,
    status INTEGER NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    priority INTEGER NOT NULL DEFAULT 100,
    environment VARCHAR(64) NOT NULL DEFAULT 'production',
    region VARCHAR(64),
    provider_app_id VARCHAR(256),
    endpoint VARCHAR(512),
    credential_ref VARCHAR(512),
    credential_fingerprint VARCHAR(128),
    webhook_secret_ref VARCHAR(512),
    webhook_secret_fingerprint VARCHAR(128),
    capability_snapshot JSONB NOT NULL,
    config_snapshot JSONB NOT NULL,
    health_status INTEGER NOT NULL DEFAULT 0,
    last_verified_at TIMESTAMP,
    last_verification_latency_ms INTEGER,
    last_verification_error VARCHAR(1000),
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP,
    deleted_by BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_provider_profile_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_provider_profile_tenant_org_provider_code UNIQUE (tenant_id, organization_id, provider, code)
);

CREATE INDEX idx_rtc_provider_profile_tenant_status
    ON rtc_provider_profile (tenant_id, organization_id, status);

CREATE INDEX idx_rtc_provider_profile_tenant_provider_status_priority
    ON rtc_provider_profile (tenant_id, organization_id, provider, status, priority);

CREATE INDEX idx_rtc_provider_profile_tenant_default
    ON rtc_provider_profile (tenant_id, organization_id, is_default, status, priority);

CREATE TABLE rtc_provider_route (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    provider_profile_id VARCHAR(64) NOT NULL,
    route_type VARCHAR(64) NOT NULL,
    region VARCHAR(64) NOT NULL DEFAULT '',
    priority INTEGER NOT NULL DEFAULT 100,
    status INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_provider_route_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_provider_route_tenant_org_route_region_profile UNIQUE (
        tenant_id,
        organization_id,
        route_type,
        region,
        provider_profile_id
    )
);

CREATE INDEX idx_rtc_provider_route_profile_type_status_priority
    ON rtc_provider_route (tenant_id, organization_id, provider_profile_id, route_type, status, priority);

CREATE INDEX idx_rtc_provider_route_scope_status_priority
    ON rtc_provider_route (tenant_id, organization_id, route_type, region, status, priority);

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

CREATE TABLE rtc_provider_webhook_event (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    provider VARCHAR(64) NOT NULL,
    provider_profile_id VARCHAR(64),
    provider_profile_dedupe_key VARCHAR(64) NOT NULL,
    external_event_id VARCHAR(256),
    external_event_dedupe_key VARCHAR(256) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    event_kind VARCHAR(64) NOT NULL,
    room_id VARCHAR(64),
    session_id VARCHAR(64),
    participant_id VARCHAR(64),
    recording_id VARCHAR(256),
    payload_hash VARCHAR(128) NOT NULL,
    raw_payload JSONB NOT NULL,
    normalized_event JSONB NOT NULL,
    signature_header VARCHAR(512),
    received_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,
    status INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_provider_webhook_event_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_provider_webhook_event_dedupe UNIQUE (
        tenant_id,
        organization_id,
        provider,
        provider_profile_dedupe_key,
        external_event_dedupe_key,
        payload_hash
    )
);

CREATE INDEX idx_rtc_provider_webhook_event_status_received
    ON rtc_provider_webhook_event (tenant_id, organization_id, status, received_at);

CREATE INDEX idx_rtc_provider_webhook_event_room_received
    ON rtc_provider_webhook_event (tenant_id, organization_id, provider, room_id, received_at);

CREATE TABLE rtc_provider_query_job (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    provider VARCHAR(64) NOT NULL,
    provider_profile_id VARCHAR(64),
    query_kind VARCHAR(64) NOT NULL,
    target_kind VARCHAR(64) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    room_id VARCHAR(64),
    session_id VARCHAR(64),
    provider_session_id VARCHAR(256),
    provider_request_id VARCHAR(256),
    status INTEGER NOT NULL,
    requested_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    result_snapshot JSONB,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_provider_query_job_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_provider_query_job_provider_status
    ON rtc_provider_query_job (tenant_id, organization_id, provider, status, requested_at);

CREATE INDEX idx_rtc_provider_query_job_target_status
    ON rtc_provider_query_job (tenant_id, organization_id, target_kind, target_id, status, requested_at);

CREATE INDEX idx_rtc_provider_query_job_provider_session_status
    ON rtc_provider_query_job (tenant_id, organization_id, provider, provider_session_id, status, requested_at);

CREATE TABLE rtc_provider_query_snapshot (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    provider_query_job_id VARCHAR(64) NOT NULL,
    provider VARCHAR(64) NOT NULL,
    query_kind VARCHAR(64) NOT NULL,
    target_kind VARCHAR(64) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    provider_session_id VARCHAR(256),
    snapshot_kind VARCHAR(64) NOT NULL,
    snapshot_payload JSONB NOT NULL,
    captured_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_provider_query_snapshot_uuid UNIQUE (uuid)
);

CREATE INDEX idx_rtc_provider_query_snapshot_job_captured
    ON rtc_provider_query_snapshot (tenant_id, organization_id, provider_query_job_id, captured_at);

CREATE INDEX idx_rtc_provider_query_snapshot_target_captured
    ON rtc_provider_query_snapshot (tenant_id, organization_id, target_kind, target_id, captured_at);

CREATE INDEX idx_rtc_provider_query_snapshot_provider_session_captured
    ON rtc_provider_query_snapshot (tenant_id, organization_id, provider, provider_session_id, captured_at);

CREATE TABLE rtc_media_session_idempotency (
    id BIGINT NOT NULL,
    uuid VARCHAR(64) NOT NULL,
    tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0,
    idempotency_key VARCHAR(256) NOT NULL,
    media_session_id VARCHAR(64) NOT NULL,
    payload_hash VARCHAR(128) NOT NULL DEFAULT '',
    response_json TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_media_session_idempotency_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_media_session_idempotency_scope UNIQUE (tenant_id, organization_id, idempotency_key)
);

CREATE INDEX idx_rtc_media_session_idempotency_session
    ON rtc_media_session_idempotency (tenant_id, organization_id, media_session_id);
