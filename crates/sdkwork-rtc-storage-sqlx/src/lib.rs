pub const POSTGRES_SCHEMA: &str = include_str!("schema/postgres_rtc.sql");
pub const SQLITE_SCHEMA: &str = include_str!("schema/sqlite_rtc.sql");

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
        indexes: &["uk_rtc_room_uuid", "idx_rtc_room_tenant_owner_status_updated"],
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
        table_name: "rtc_call_session",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "room_id",
            "owner_user_id",
            "call_type",
            "status",
            "provider_profile_id",
            "started_at",
            "ended_at",
            "created_at",
            "updated_at",
            "version",
        ],
        indexes: &[
            "uk_rtc_call_session_uuid",
            "idx_rtc_call_session_tenant_room_status_updated",
            "idx_rtc_call_session_provider_status",
        ],
    },
    RtcTableContract {
        table_name: "rtc_call_participant",
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
            "joined_at",
            "left_at",
            "created_at",
            "updated_at",
            "version",
        ],
        indexes: &[
            "uk_rtc_call_participant_uuid",
            "uk_rtc_call_participant_session_user",
            "idx_rtc_call_participant_session_state",
        ],
    },
    RtcTableContract {
        table_name: "rtc_call_invitation",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "session_id",
            "inviter_user_id",
            "invitee_user_id",
            "status",
            "expire_at",
            "idempotency_key",
            "created_at",
            "updated_at",
            "version",
        ],
        indexes: &[
            "uk_rtc_call_invitation_uuid",
            "uk_rtc_call_invitation_tenant_idempotency",
            "idx_rtc_call_invitation_invitee_status_created",
        ],
    },
    RtcTableContract {
        table_name: "rtc_signaling_event",
        required_columns: &[
            "id",
            "uuid",
            "tenant_id",
            "organization_id",
            "session_id",
            "sender_user_id",
            "event_type",
            "payload",
            "sequence_no",
            "idempotency_key",
            "created_at",
            "status",
        ],
        indexes: &[
            "uk_rtc_signaling_event_uuid",
            "uk_rtc_signaling_event_session_sequence",
            "uk_rtc_signaling_event_tenant_idempotency",
            "idx_rtc_signaling_event_session_created",
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
            "config_snapshot",
            "created_at",
            "updated_at",
            "version",
        ],
        indexes: &[
            "uk_rtc_provider_profile_uuid",
            "uk_rtc_provider_profile_tenant_code",
            "idx_rtc_provider_profile_tenant_status",
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
            "idx_rtc_provider_route_profile_type_status_priority",
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
];

#[cfg(test)]
mod tests {
    use super::*;

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
}
