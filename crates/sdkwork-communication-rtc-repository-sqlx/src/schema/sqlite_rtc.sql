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

-- Reserved DDL for future persistent room membership. Active call participation uses rtc_media_participant.
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

CREATE TABLE rtc_media_session (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    room_id TEXT NOT NULL,
    owner_user_id INTEGER NOT NULL,
    media_mode INTEGER NOT NULL,
    status INTEGER NOT NULL,
    provider_profile_id TEXT,
    provider_session_id TEXT,
    started_at TEXT,
    connected_at TEXT,
    ended_at TEXT,
    duration_ms INTEGER,
    end_reason TEXT,
    end_source TEXT,
    failure_reason TEXT,
    participant_count INTEGER NOT NULL DEFAULT 0,
    max_concurrent_participants INTEGER NOT NULL DEFAULT 0,
    quality_summary_snapshot TEXT,
    recording_summary_snapshot TEXT,
    completion_recorded_at TEXT,
    last_provider_webhook_event_id TEXT,
    last_provider_query_job_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
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
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    session_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    owner_user_id INTEGER NOT NULL,
    provider_profile_id TEXT,
    provider_session_id TEXT,
    media_mode INTEGER NOT NULL,
    session_status INTEGER NOT NULL,
    started_at TEXT,
    connected_at TEXT,
    ended_at TEXT,
    duration_ms INTEGER,
    end_reason TEXT,
    end_source TEXT,
    participant_count INTEGER NOT NULL DEFAULT 0,
    max_concurrent_participants INTEGER NOT NULL DEFAULT 0,
    artifact_count INTEGER NOT NULL DEFAULT 0,
    recording_artifact_count INTEGER NOT NULL DEFAULT 0,
    failed_artifact_count INTEGER NOT NULL DEFAULT 0,
    quality_summary_snapshot TEXT NOT NULL,
    recording_summary_snapshot TEXT NOT NULL,
    participant_summary_snapshot TEXT NOT NULL,
    track_summary_snapshot TEXT NOT NULL,
    artifact_summary_snapshot TEXT NOT NULL,
    provider_webhook_event_id TEXT,
    provider_query_job_id TEXT,
    completion_snapshot TEXT NOT NULL,
    completion_snapshot_hash TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_media_session_completion_record_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_media_session_completion_record_session UNIQUE (session_id)
);

CREATE INDEX idx_rtc_media_session_completion_record_tenant_recorded
    ON rtc_media_session_completion_record (tenant_id, organization_id, recorded_at);

CREATE INDEX idx_rtc_media_session_completion_record_provider_recorded
    ON rtc_media_session_completion_record (provider_profile_id, recorded_at);

CREATE TABLE rtc_media_artifact (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    session_id TEXT NOT NULL,
    owner_user_id INTEGER NOT NULL,
    artifact_kind INTEGER NOT NULL,
    artifact_status INTEGER NOT NULL,
    media_role TEXT NOT NULL,
    provider_profile_id TEXT,
    provider_artifact_id TEXT,
    drive_space_id TEXT NOT NULL,
    drive_space_type TEXT NOT NULL DEFAULT 'rtc',
    drive_node_id TEXT NOT NULL,
    drive_uri TEXT NOT NULL,
    media_resource_snapshot TEXT NOT NULL,
    resource_hash TEXT NOT NULL,
    started_at TEXT,
    ended_at TEXT,
    duration_ms INTEGER,
    failure_reason TEXT,
    source_provider_webhook_event_id TEXT,
    source_provider_query_job_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
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
    duration_ms INTEGER,
    leave_reason TEXT,
    last_seen_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_media_participant_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_media_participant_session_user UNIQUE (session_id, user_id)
);

CREATE INDEX idx_rtc_media_participant_session_state
    ON rtc_media_participant (tenant_id, organization_id, session_id, state);

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
    duration_ms INTEGER,
    muted_duration_ms INTEGER,
    end_reason TEXT,
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

CREATE TABLE rtc_provider_account (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    provider TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    status INTEGER NOT NULL,
    environment TEXT NOT NULL DEFAULT 'production',
    external_tenant_id TEXT,
    cloud_account_id TEXT,
    project_id TEXT,
    resource_group_id TEXT,
    last_verified_at TEXT,
    last_verification_error TEXT,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    deleted_by INTEGER,
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
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    provider_account_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    status INTEGER NOT NULL,
    environment TEXT NOT NULL DEFAULT 'production',
    region TEXT,
    provider_application_id TEXT NOT NULL,
    provider_application_id_kind TEXT NOT NULL,
    access_endpoint TEXT,
    api_endpoint TEXT,
    api_host TEXT,
    api_version TEXT,
    webhook_callback_url TEXT,
    config_snapshot TEXT NOT NULL,
    last_verified_at TEXT,
    last_verification_error TEXT,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    deleted_by INTEGER,
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
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    provider_account_id TEXT NOT NULL,
    provider_application_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    credential_role INTEGER NOT NULL,
    credential_label TEXT NOT NULL,
    credential_ref TEXT NOT NULL,
    credential_fingerprint TEXT,
    secret_version TEXT,
    status INTEGER NOT NULL,
    valid_from TEXT,
    expires_at TEXT,
    rotation_due_at TEXT,
    rotated_at TEXT,
    revoked_at TEXT,
    last_verified_at TEXT,
    last_used_at TEXT,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
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
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    provider TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    status INTEGER NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 100,
    environment TEXT NOT NULL DEFAULT 'production',
    region TEXT,
    provider_app_id TEXT,
    endpoint TEXT,
    credential_ref TEXT,
    credential_fingerprint TEXT,
    webhook_secret_ref TEXT,
    webhook_secret_fingerprint TEXT,
    capability_snapshot TEXT NOT NULL,
    config_snapshot TEXT NOT NULL,
    health_status INTEGER NOT NULL DEFAULT 0,
    last_verified_at TEXT,
    last_verification_latency_ms INTEGER,
    last_verification_error TEXT,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    deleted_by INTEGER,
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
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    provider_profile_id TEXT NOT NULL,
    route_type TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT '',
    priority INTEGER NOT NULL DEFAULT 100,
    status INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
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

CREATE TABLE rtc_provider_webhook_event (
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    provider TEXT NOT NULL,
    provider_profile_id TEXT,
    provider_profile_dedupe_key TEXT NOT NULL,
    external_event_id TEXT,
    external_event_dedupe_key TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_kind TEXT NOT NULL,
    room_id TEXT,
    session_id TEXT,
    participant_id TEXT,
    recording_id TEXT,
    payload_hash TEXT NOT NULL,
    raw_payload TEXT NOT NULL,
    normalized_event TEXT NOT NULL,
    signature_header TEXT,
    received_at TEXT NOT NULL,
    processed_at TEXT,
    status INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
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
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    provider TEXT NOT NULL,
    provider_profile_id TEXT,
    query_kind TEXT NOT NULL,
    target_kind TEXT NOT NULL,
    target_id TEXT NOT NULL,
    room_id TEXT,
    session_id TEXT,
    provider_session_id TEXT,
    provider_request_id TEXT,
    status INTEGER NOT NULL,
    requested_at TEXT NOT NULL,
    completed_at TEXT,
    result_snapshot TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
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
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    provider_query_job_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    query_kind TEXT NOT NULL,
    target_kind TEXT NOT NULL,
    target_id TEXT NOT NULL,
    provider_session_id TEXT,
    snapshot_kind TEXT NOT NULL,
    snapshot_payload TEXT NOT NULL,
    captured_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
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
    id INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    tenant_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL DEFAULT 0,
    idempotency_key TEXT NOT NULL,
    media_session_id TEXT NOT NULL,
    payload_hash TEXT NOT NULL DEFAULT '',
    response_json TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_rtc_media_session_idempotency_uuid UNIQUE (uuid),
    CONSTRAINT uk_rtc_media_session_idempotency_scope UNIQUE (tenant_id, organization_id, idempotency_key)
);

CREATE INDEX idx_rtc_media_session_idempotency_session
    ON rtc_media_session_idempotency (tenant_id, organization_id, media_session_id);
