pub const POSTGRES_SCHEMA: &str = include_str!("schema/postgres_rtc.sql");
pub const SQLITE_SCHEMA: &str = include_str!("schema/sqlite_rtc.sql");

pub mod completion_record;
pub mod media_session;
pub mod persistence;
pub mod provider_event;
pub mod provider_profile;
pub mod provider_route;
pub use completion_record::{
    RtcPostgresCompletionRecordRepository, RtcSqliteCompletionRecordRepository, RtcStorageError,
    RtcStorageResult,
};
pub use media_session::{RtcPostgresMediaSessionRepository, RtcSqliteMediaSessionRepository};
pub use persistence::{RtcPostgresPersistencePort, RtcSqlitePersistencePort};
pub use provider_event::{RtcPostgresProviderEventRepository, RtcSqliteProviderEventRepository};
pub use provider_profile::{
    RtcPostgresProviderProfileRepository, RtcSqliteProviderProfileRepository,
};
pub use provider_route::{RtcPostgresProviderRouteRepository, RtcSqliteProviderRouteRepository};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RtcTableContract {
    pub table_name: &'static str,
    pub required_columns: &'static [&'static str],
    pub indexes: &'static [&'static str],
}

pub const RTC_TABLES: &[RtcTableContract] = &[
    RtcTableContract {
        table_name: "rtc_room",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "owner_user_id",
            "title",
            "status",
            "created_at",
            "updated_at",
            "version",
            "deleted_at",
        ],
        indexes: &[
            "uk_rtc_room_uuid",
            "idx_rtc_room_tenant_owner_status_updated",
        ],
    },
    RtcTableContract {
        table_name: "rtc_room_participant",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "room_id",
            "user_id",
            "role",
            "state",
            "created_at",
            "updated_at",
            "version",
        ],
        indexes: &[
            "uk_rtc_room_participant_uuid",
            "uk_rtc_room_participant_room_user",
            "idx_rtc_room_participant_room_state",
        ],
    },
    RtcTableContract {
        table_name: "rtc_media_session",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "room_id",
            "owner_user_id",
            "media_mode",
            "status",
            "provider_profile_id",
            "provider_session_id",
            "started_at",
            "connected_at",
            "ended_at",
            "duration_ms",
            "end_reason",
            "end_source",
            "participant_count",
            "max_concurrent_participants",
            "quality_summary_snapshot",
            "recording_summary_snapshot",
            "completion_recorded_at",
            "last_provider_webhook_event_id",
            "last_provider_query_job_id",
            "created_at",
            "updated_at",
            "version",
        ],
        indexes: &[
            "uk_rtc_media_session_uuid",
            "idx_rtc_media_session_tenant_room_status_updated",
            "idx_rtc_media_session_provider_status",
            "idx_rtc_media_session_completion_recorded",
        ],
    },
    RtcTableContract {
        table_name: "rtc_media_session_completion_record",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "session_id",
            "room_id",
            "owner_user_id",
            "provider_profile_id",
            "provider_session_id",
            "media_mode",
            "session_status",
            "started_at",
            "connected_at",
            "ended_at",
            "duration_ms",
            "end_reason",
            "end_source",
            "participant_count",
            "max_concurrent_participants",
            "artifact_count",
            "recording_artifact_count",
            "failed_artifact_count",
            "quality_summary_snapshot",
            "recording_summary_snapshot",
            "participant_summary_snapshot",
            "track_summary_snapshot",
            "artifact_summary_snapshot",
            "provider_webhook_event_id",
            "provider_query_job_id",
            "completion_snapshot",
            "completion_snapshot_hash",
            "recorded_at",
            "created_at",
            "updated_at",
            "version",
        ],
        indexes: &[
            "uk_rtc_media_session_completion_record_uuid",
            "uk_rtc_media_session_completion_record_session",
            "idx_rtc_media_session_completion_record_tenant_recorded",
            "idx_rtc_media_session_completion_record_provider_recorded",
        ],
    },
    RtcTableContract {
        table_name: "rtc_media_artifact",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "session_id",
            "owner_user_id",
            "artifact_kind",
            "artifact_status",
            "media_role",
            "provider_profile_id",
            "provider_artifact_id",
            "drive_space_id",
            "drive_space_type",
            "drive_node_id",
            "drive_uri",
            "media_resource_snapshot",
            "resource_hash",
            "started_at",
            "ended_at",
            "duration_ms",
            "failure_reason",
            "source_provider_webhook_event_id",
            "source_provider_query_job_id",
            "created_at",
            "updated_at",
            "version",
        ],
        indexes: &[
            "uk_rtc_media_artifact_uuid",
            "uk_rtc_media_artifact_drive_uri",
            "ck_rtc_media_artifact_drive_space_type",
            "idx_rtc_media_artifact_session_created",
            "idx_rtc_media_artifact_owner_created",
        ],
    },
    RtcTableContract {
        table_name: "rtc_media_participant",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "session_id",
            "user_id",
            "display_name_snapshot",
            "role",
            "state",
            "audio_muted",
            "video_muted",
            "screen_share_active",
            "provider_participant_id",
            "joined_at",
            "left_at",
            "duration_ms",
            "leave_reason",
            "last_seen_at",
            "created_at",
            "updated_at",
            "version",
        ],
        indexes: &[
            "uk_rtc_media_participant_uuid",
            "uk_rtc_media_participant_session_user",
            "idx_rtc_media_participant_session_state",
        ],
    },
    RtcTableContract {
        table_name: "rtc_media_track",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "session_id",
            "participant_id",
            "track_kind",
            "track_source",
            "provider_track_id",
            "status",
            "started_at",
            "ended_at",
            "duration_ms",
            "muted_duration_ms",
            "end_reason",
            "created_at",
            "updated_at",
            "version",
        ],
        indexes: &[
            "uk_rtc_media_track_uuid",
            "idx_rtc_media_track_session_participant_kind",
        ],
    },
    RtcTableContract {
        table_name: "rtc_quality_sample",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "session_id",
            "participant_id",
            "latency_ms",
            "packet_loss_rate",
            "jitter_ms",
            "bitrate_kbps",
            "sampled_at",
            "created_at",
        ],
        indexes: &[
            "uk_rtc_quality_sample_uuid",
            "idx_rtc_quality_sample_session_sampled",
        ],
    },
    RtcTableContract {
        table_name: "rtc_provider_profile",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "provider",
            "code",
            "name",
            "status",
            "is_default",
            "priority",
            "environment",
            "region",
            "provider_app_id",
            "endpoint",
            "credential_ref",
            "credential_fingerprint",
            "webhook_secret_ref",
            "webhook_secret_fingerprint",
            "capability_snapshot",
            "config_snapshot",
            "health_status",
            "last_verified_at",
            "last_verification_latency_ms",
            "last_verification_error",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "version",
            "deleted_at",
            "deleted_by",
        ],
        indexes: &[
            "uk_rtc_provider_profile_uuid",
            "uk_rtc_provider_profile_tenant_org_provider_code",
            "idx_rtc_provider_profile_tenant_status",
            "idx_rtc_provider_profile_tenant_provider_status_priority",
            "idx_rtc_provider_profile_tenant_default",
        ],
    },
    RtcTableContract {
        table_name: "rtc_provider_route",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "provider_profile_id",
            "route_type",
            "region",
            "priority",
            "status",
            "created_at",
            "updated_at",
            "version",
        ],
        indexes: &[
            "uk_rtc_provider_route_uuid",
            "uk_rtc_provider_route_tenant_org_route_region_profile",
            "idx_rtc_provider_route_profile_type_status_priority",
            "idx_rtc_provider_route_scope_status_priority",
        ],
    },
    RtcTableContract {
        table_name: "rtc_session_token_grant",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "session_id",
            "participant_id",
            "provider_profile_id",
            "token_hash",
            "scope",
            "expire_at",
            "revoked_at",
            "created_at",
            "status",
        ],
        indexes: &[
            "uk_rtc_session_token_grant_uuid",
            "idx_rtc_session_token_grant_session_participant_status",
            "idx_rtc_session_token_grant_expire_status",
        ],
    },
    RtcTableContract {
        table_name: "rtc_provider_webhook_event",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "provider",
            "provider_profile_id",
            "provider_profile_dedupe_key",
            "external_event_id",
            "external_event_dedupe_key",
            "event_type",
            "event_kind",
            "room_id",
            "session_id",
            "participant_id",
            "recording_id",
            "payload_hash",
            "raw_payload",
            "normalized_event",
            "signature_header",
            "received_at",
            "processed_at",
            "status",
            "created_at",
            "updated_at",
            "version",
        ],
        indexes: &[
            "uk_rtc_provider_webhook_event_uuid",
            "uk_rtc_provider_webhook_event_dedupe",
            "idx_rtc_provider_webhook_event_status_received",
            "idx_rtc_provider_webhook_event_room_received",
        ],
    },
    RtcTableContract {
        table_name: "rtc_provider_query_job",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "provider",
            "provider_profile_id",
            "query_kind",
            "target_kind",
            "target_id",
            "room_id",
            "session_id",
            "provider_session_id",
            "provider_request_id",
            "status",
            "requested_at",
            "completed_at",
            "result_snapshot",
            "created_at",
            "updated_at",
            "version",
        ],
        indexes: &[
            "uk_rtc_provider_query_job_uuid",
            "idx_rtc_provider_query_job_provider_status",
            "idx_rtc_provider_query_job_target_status",
            "idx_rtc_provider_query_job_provider_session_status",
        ],
    },
    RtcTableContract {
        table_name: "rtc_provider_query_snapshot",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "provider_query_job_id",
            "provider",
            "query_kind",
            "target_kind",
            "target_id",
            "provider_session_id",
            "snapshot_kind",
            "snapshot_payload",
            "captured_at",
            "created_at",
        ],
        indexes: &[
            "uk_rtc_provider_query_snapshot_uuid",
            "idx_rtc_provider_query_snapshot_job_captured",
            "idx_rtc_provider_query_snapshot_target_captured",
            "idx_rtc_provider_query_snapshot_provider_session_captured",
        ],
    },
];

#[cfg(test)]
mod tests {
    use super::*;
    use sdkwork_rtc_core::{
        RtcMediaSession, RtcMediaSessionCompletionInput, RtcMediaSessionCompletionRecord,
        RtcMediaSessionEndSource, RtcMediaSessionMode, RtcMediaSessionStatus,
        RtcPersistenceChangeSet, RtcPersistencePort, RtcProviderEventKind,
        RtcProviderQueryJobRecord, RtcProviderQueryKind, RtcProviderQuerySnapshotRecord,
        RtcProviderWebhookEventRecord,
    };
    use sqlx::sqlite::SqlitePoolOptions;

    #[test]
    fn schema_declares_rtc_tables_columns_and_indexes() {
        for table in RTC_TABLES {
            assert!(
                POSTGRES_SCHEMA.contains(&format!("CREATE TABLE {}", table.table_name)),
                "postgres schema should create {}",
                table.table_name
            );
            assert!(
                SQLITE_SCHEMA.contains(&format!("CREATE TABLE {}", table.table_name)),
                "sqlite schema should create {}",
                table.table_name
            );
            for column in table.required_columns {
                assert!(
                    POSTGRES_SCHEMA.contains(column),
                    "postgres {} should declare {}",
                    table.table_name,
                    column
                );
                assert!(
                    SQLITE_SCHEMA.contains(column),
                    "sqlite {} should declare {}",
                    table.table_name,
                    column
                );
            }
            for index in table.indexes {
                assert!(
                    POSTGRES_SCHEMA.contains(index),
                    "postgres schema should declare {}",
                    index
                );
                assert!(
                    SQLITE_SCHEMA.contains(index),
                    "sqlite schema should declare {}",
                    index
                );
            }
        }
    }

    #[test]
    fn schema_does_not_keep_im_call_signaling_tables() {
        for schema in [POSTGRES_SCHEMA, SQLITE_SCHEMA] {
            for forbidden in [
                "rtc_signaling_event",
                "uk_rtc_signaling_event",
                "idx_rtc_signaling_event",
            ] {
                assert!(
                    !schema.contains(forbidden),
                    "sdkwork-rtc storage schema must not keep IM call signaling artifact {forbidden}"
                );
            }
        }

        assert!(
            RTC_TABLES
                .iter()
                .all(|table| table.table_name != "rtc_signaling_event"),
            "sdkwork-rtc table registry must not declare IM call signaling tables"
        );
    }

    #[test]
    fn schema_uses_json_snapshots_and_hashes_for_sensitive_provider_state() {
        assert!(POSTGRES_SCHEMA.contains("config_snapshot JSONB"));
        assert!(SQLITE_SCHEMA.contains("config_snapshot TEXT"));
        assert!(POSTGRES_SCHEMA.contains("token_hash VARCHAR"));
        assert!(SQLITE_SCHEMA.contains("token_hash TEXT"));
        assert!(!POSTGRES_SCHEMA.contains("access_token"));
        assert!(!SQLITE_SCHEMA.contains("access_token"));
        assert!(!POSTGRES_SCHEMA.contains("secret_key"));
        assert!(!SQLITE_SCHEMA.contains("secret_key"));
    }

    #[test]
    fn rtc_media_artifact_persists_drive_references_not_provider_storage_details() {
        for schema in [POSTGRES_SCHEMA, SQLITE_SCHEMA] {
            let table = table_block(schema, "rtc_media_artifact");

            assert!(table.contains("drive_space_id"));
            assert!(table.contains("drive_space_type"));
            assert!(table.contains("drive_node_id"));
            assert!(table.contains("drive_uri"));
            assert!(table.contains("media_resource_snapshot"));
            assert!(table.contains("resource_hash"));
            assert!(table.contains("ck_rtc_media_artifact_drive_space_type"));
            assert!(table.contains("CHECK (drive_space_type = 'rtc')"));

            for forbidden in ["bucket", "object_key", "signed_url", "presigned"] {
                assert!(
                    !table.contains(forbidden),
                    "rtc_media_artifact must not persist provider storage detail {forbidden}"
                );
            }
        }
    }

    fn table_block<'a>(schema: &'a str, table_name: &str) -> &'a str {
        let start = schema
            .find(&format!("CREATE TABLE {table_name}"))
            .unwrap_or_else(|| panic!("schema should create table {table_name}"));
        let after_start = &schema[start..];
        let end = after_start
            .find("\n\nCREATE ")
            .or_else(|| after_start.find("\r\n\r\nCREATE "))
            .unwrap_or(after_start.len());
        &after_start[..end]
    }

    #[tokio::test]
    async fn sqlite_persistence_port_persists_completion_change_set() {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("in-memory sqlite should start");
        for statement in SQLITE_SCHEMA
            .split(';')
            .map(str::trim)
            .filter(|statement| !statement.is_empty())
        {
            sqlx::query(statement)
                .execute(&pool)
                .await
                .expect("rtc sqlite schema should apply");
        }

        let session = completed_session();
        let completion =
            RtcMediaSessionCompletionRecord::from_input(RtcMediaSessionCompletionInput {
                session: session.clone(),
                tracks: Vec::new(),
                artifacts: Vec::new(),
                quality_samples: Vec::new(),
                source_webhook_event_id: None,
                source_provider_query_job_id: Some("provider-query-acme-recording".to_string()),
                recorded_at: "2026-06-10T00:10:05.000Z".to_string(),
            });
        let persistence = RtcSqlitePersistencePort::new(pool.clone());

        persistence
            .persist_changes(RtcPersistenceChangeSet {
                media_sessions: vec![session],
                webhook_events: vec![provider_webhook_event()],
                provider_query_jobs: vec![provider_query_job()],
                provider_query_snapshots: vec![provider_query_snapshot()],
                completion_records: vec![completion.clone()],
                ..RtcPersistenceChangeSet::default()
            })
            .await
            .expect("SQLite persistence port should persist completion changes");

        let completion_repository = RtcSqliteCompletionRecordRepository::new(pool.clone());
        let stored = completion_repository
            .get_completion_record_by_session_id("session-730")
            .await
            .expect("completion lookup should work")
            .expect("completion should be persisted");
        assert_eq!(stored.media_session_id, "session-730");
        assert_eq!(
            stored.source_provider_query_job_id.as_deref(),
            Some("provider-query-acme-recording")
        );

        let summary = sqlx::query_as::<_, (Option<String>, Option<String>)>(
            r#"
            SELECT completion_recorded_at, last_provider_query_job_id
            FROM rtc_media_session
            WHERE uuid = 'session-730'
            "#,
        )
        .fetch_one(&pool)
        .await
        .expect("session summary should be updated by completion persistence");
        assert_eq!(summary.0.as_deref(), Some("2026-06-10T00:10:05.000Z"));
        assert_eq!(summary.1.as_deref(), Some("provider-query-acme-recording"));

        let event_repository = RtcSqliteProviderEventRepository::new(pool);
        let stored_webhook = event_repository
            .get_webhook_event_by_id("webhook-event-acme-room-ended")
            .await
            .expect("webhook lookup should work")
            .expect("processed webhook event should be persisted");
        assert_eq!(stored_webhook.status, "processed");
        assert_eq!(
            stored_webhook.media_session_id.as_deref(),
            Some("session-730")
        );

        let stored_job = event_repository
            .get_provider_query_job_by_id("provider-query-acme-recording")
            .await
            .expect("query job lookup should work")
            .expect("provider query job should be persisted");
        assert_eq!(
            stored_job.provider_session_id.as_deref(),
            Some("acme:session-730")
        );
        assert_eq!(stored_job.status, "completed");

        let stored_snapshots = event_repository
            .list_provider_query_snapshots("provider-query-acme-recording")
            .await
            .expect("query snapshot lookup should work");
        assert_eq!(stored_snapshots.len(), 1);
        assert_eq!(
            stored_snapshots[0].provider_session_id.as_deref(),
            Some("acme:session-730")
        );
    }

    fn completed_session() -> RtcMediaSession {
        RtcMediaSession {
            id: "session-730".to_string(),
            room_id: "room-default".to_string(),
            tenant_id: "730".to_string(),
            organization_id: "731".to_string(),
            owner_user_id: "732".to_string(),
            media_mode: RtcMediaSessionMode::Video,
            status: RtcMediaSessionStatus::Ended,
            provider_profile_id: Some("profile-730-731-acme-default".to_string()),
            provider_session_id: Some("acme:session-730".to_string()),
            started_at: Some("2026-06-10T00:00:00.000Z".to_string()),
            connected_at: Some("2026-06-10T00:00:01.000Z".to_string()),
            ended_at: Some("2026-06-10T00:10:00.000Z".to_string()),
            duration_ms: Some(600_000),
            end_reason: Some("host_closed".to_string()),
            end_source: Some(RtcMediaSessionEndSource::ManualClose),
            participant_count: 1,
            max_concurrent_participants: 1,
            quality_summary: None,
            recording_summary: None,
            completion_recorded_at: Some("2026-06-10T00:10:05.000Z".to_string()),
            last_provider_webhook_event_id: None,
            last_provider_query_job_id: Some("provider-query-acme-recording".to_string()),
            participants: Vec::new(),
        }
    }

    fn provider_query_job() -> RtcProviderQueryJobRecord {
        RtcProviderQueryJobRecord {
            id: "provider-query-acme-recording".to_string(),
            tenant_id: "730".to_string(),
            organization_id: "731".to_string(),
            provider: "acme".to_string(),
            provider_profile_id: Some("profile-730-731-acme-default".to_string()),
            query_kind: RtcProviderQueryKind::RecordingArtifacts,
            target_kind: "recording".to_string(),
            target_id: "acme:session-730".to_string(),
            room_id: Some("room-default".to_string()),
            media_session_id: Some("session-730".to_string()),
            provider_session_id: Some("acme:session-730".to_string()),
            provider_request_id: Some("CloseMediaSessionExportArtifacts".to_string()),
            status: "completed".to_string(),
            requested_at: "2026-06-10T00:10:05.000Z".to_string(),
            completed_at: Some("2026-06-10T00:10:05.000Z".to_string()),
            result_snapshot: serde_json::json!({
                "status": "closed",
                "providerAction": "CloseMediaSessionExportArtifacts"
            }),
        }
    }

    fn provider_webhook_event() -> RtcProviderWebhookEventRecord {
        RtcProviderWebhookEventRecord {
            id: "webhook-event-acme-room-ended".to_string(),
            tenant_id: "730".to_string(),
            organization_id: "731".to_string(),
            provider: "acme".to_string(),
            provider_profile_id: Some("profile-730-731-acme-default".to_string()),
            external_event_id: Some("evt-acme-room-ended".to_string()),
            event_type: "room_ended".to_string(),
            event_kind: RtcProviderEventKind::RoomEnded,
            room_id: Some("room-default".to_string()),
            media_session_id: Some("session-730".to_string()),
            participant_id: None,
            recording_id: Some("recording-730".to_string()),
            payload_hash: "fnv64:webhook730".to_string(),
            raw_payload: serde_json::json!({
                "eventType": "room_ended",
                "eventId": "evt-acme-room-ended"
            }),
            normalized_event: serde_json::json!({
                "provider": "acme",
                "eventKind": "room_ended"
            }),
            signature_header: Some("sig-730".to_string()),
            received_at: "2026-06-10T00:10:00.000Z".to_string(),
            processed_at: Some("2026-06-10T00:10:05.000Z".to_string()),
            status: "processed".to_string(),
        }
    }

    fn provider_query_snapshot() -> RtcProviderQuerySnapshotRecord {
        RtcProviderQuerySnapshotRecord {
            id: "provider-query-snapshot-acme-recording".to_string(),
            tenant_id: "730".to_string(),
            organization_id: "731".to_string(),
            provider_query_job_id: "provider-query-acme-recording".to_string(),
            provider: "acme".to_string(),
            query_kind: RtcProviderQueryKind::RecordingArtifacts,
            target_kind: "recording".to_string(),
            target_id: "acme:session-730".to_string(),
            provider_session_id: Some("acme:session-730".to_string()),
            snapshot_kind: "provider_query_result".to_string(),
            snapshot_payload: serde_json::json!({
                "status": "closed",
                "providerAction": "CloseMediaSessionExportArtifacts"
            }),
            captured_at: "2026-06-10T00:10:05.000Z".to_string(),
        }
    }
}
