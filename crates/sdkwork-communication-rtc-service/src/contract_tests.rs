#[test]
fn platform_default_registry_includes_professional_rtc_provider_plugins() {
    let registry = StaticProviderRegistry::platform_default();
    let rtc_plugins = registry.plugins_for_domain(ProviderDomain::Rtc);
    let plugin_ids = rtc_plugins
        .iter()
        .map(|plugin| plugin.plugin_id.as_str())
        .collect::<Vec<_>>();

    assert!(plugin_ids.contains(&"rtc-volcengine"));
    assert!(plugin_ids.contains(&"rtc-aliyun"));
    assert!(plugin_ids.contains(&"rtc-tencent"));
    assert!(plugin_ids.contains(&"rtc-agora"));
    assert!(plugin_ids.contains(&"rtc-livekit"));

    for plugin in rtc_plugins {
        for capability in [
            "session",
            "credential",
            "provider.webhook",
            "health",
            "media.audio",
            "media.video",
            "live.broadcast",
            "live.audience",
            "provider.event-normalization",
        ] {
            assert!(
                plugin
                    .required_capabilities
                    .iter()
                    .any(|registered| registered == capability),
                "{} should require {capability}",
                plugin.plugin_id
            );
        }
        for capability in [
            "recording",
            "artifact",
            "screen-share",
            "provider.active-query",
        ] {
            assert!(
                plugin
                    .optional_capabilities
                    .iter()
                    .any(|registered| registered == capability),
                "{} should optionally support {capability}",
                plugin.plugin_id
            );
        }
    }
}

#[test]
fn drive_backed_recording_artifact_uses_drive_media_source() {
    let artifact = RtcRecordingArtifact::drive_backed_recording(
        "100001",
        "rtc-session-1",
        "space-rtc-user-1",
        "node-recording-1",
        Some("1".to_string()),
    );

    assert_eq!(artifact.resource.source, RtcMediaSource::Drive);
    assert_eq!(artifact.drive.space_type, RtcDriveSpaceType::Rtc);
    assert!(artifact.drive.is_rtc_space());
    assert_eq!(
        artifact.resource.uri.as_deref(),
        Some("drive://spaces/space-rtc-user-1/nodes/node-recording-1")
    );
    assert_eq!(artifact.resource.url, None);
    assert_eq!(artifact.resource.public_url, None);

    let artifact_json =
        serde_json::to_value(&artifact).expect("RTC recording artifact should serialize");
    assert_eq!(artifact_json["drive"]["spaceType"], "rtc");
    assert_eq!(
        artifact_json["resource"]["metadata"]["drive"]["spaceType"],
        "rtc"
    );
    assert_eq!(
        artifact_json["resource"]["metadata"]["drive"]["spaceId"],
        "space-rtc-user-1"
    );
    assert_eq!(
        artifact_json["resource"]["metadata"]["drive"]["nodeId"],
        "node-recording-1"
    );
    for forbidden in ["bucket", "objectKey", "storageProvider", "signedUrl"] {
        assert!(
            artifact_json.get(forbidden).is_none(),
            "Drive-backed RTC artifact must not expose object storage field {forbidden}"
        );
    }
}

#[test]
fn rtc_media_artifact_list_models_multiple_drive_backed_records_for_one_session() {
    let recording = RtcRecordingArtifact::drive_backed_recording(
        "100001",
        "rtc-session-1",
        "space-rtc-user-1",
        "node-recording-1",
        Some("1".to_string()),
    );
    let transcript = RtcRecordingArtifact::drive_backed_recording(
        "100001",
        "rtc-session-1",
        "space-rtc-user-1",
        "node-transcript-1",
        Some("1".to_string()),
    )
    .into_media_artifact(RtcMediaArtifactDescriptor {
        id: "record-transcript-1".into(),
        owner_user_id: "1".into(),
        artifact_kind: RtcRecordingArtifactKind::Transcript,
        artifact_status: RtcRecordingArtifactStatus::Ready,
        media_role: "rtc_transcript".into(),
        started_at: "2026-06-06T00:00:00.000Z".into(),
        ended_at: "2026-06-06T00:10:00.000Z".into(),
    });
    let recording = recording.into_media_artifact(RtcMediaArtifactDescriptor {
        id: "record-recording-1".into(),
        owner_user_id: "1".into(),
        artifact_kind: RtcRecordingArtifactKind::Recording,
        artifact_status: RtcRecordingArtifactStatus::Ready,
        media_role: "rtc_recording".into(),
        started_at: "2026-06-06T00:00:00.000Z".into(),
        ended_at: "2026-06-06T00:10:00.000Z".into(),
    });
    let records =
        RtcMediaArtifactList::new("100001", "rtc-session-1", vec![recording, transcript]);

    assert_eq!(records.items.len(), 2);
    assert!(
        records
            .items
            .iter()
            .all(|record| record.tenant_id == "100001"
                && record.rtc_session_id == "rtc-session-1"
                && record.drive.is_canonical()
                && record.resource.source == RtcMediaSource::Drive)
    );
    assert_eq!(
        records
            .items
            .iter()
            .map(|record| record.artifact_kind.clone())
            .collect::<Vec<_>>(),
        vec![
            RtcRecordingArtifactKind::Recording,
            RtcRecordingArtifactKind::Transcript
        ]
    );
}

#[test]
fn summarizes_rtc_workspace_without_transport_state() {
    let rooms = vec![RtcRoom {
        id: "room-1".to_string(),
        tenant_id: "100001".to_string(),
        organization_id: "org-1".to_string(),
        owner_user_id: "1".to_string(),
        title: "Daily sync".to_string(),
        status: RtcRoomStatus::Active,
    }];
    let sessions = vec![
        RtcMediaSession {
            id: "session-1".to_string(),
            room_id: "room-1".to_string(),
            tenant_id: "100001".to_string(),
            organization_id: "org-1".to_string(),
            owner_user_id: "1".to_string(),
            media_mode: RtcMediaSessionMode::Video,
            status: RtcMediaSessionStatus::Active,
            provider_profile_id: Some("provider-volcengine".to_string()),
            provider_session_id: Some("volcengine:session-1".to_string()),
            started_at: Some("2026-06-06T00:00:00Z".to_string()),
            connected_at: Some("2026-06-06T00:00:01Z".to_string()),
            ended_at: None,
            duration_ms: None,
            end_reason: None,
            end_source: None,
            participant_count: 2,
            max_concurrent_participants: 2,
            quality_summary: None,
            recording_summary: None,
            completion_recorded_at: None,
            last_provider_webhook_event_id: None,
            last_provider_query_job_id: None,
            participants: vec![
                RtcMediaParticipant {
                    id: "participant-1".to_string(),
                    session_id: "session-1".to_string(),
                    user_id: "1".to_string(),
                    display_name: "Host".to_string(),
                    role: RtcParticipantRole::Host,
                    state: RtcParticipantState::Joined,
                    audio_muted: false,
                    video_muted: false,
                    screen_share_active: false,
                    provider_participant_id: None,
                    joined_at: Some("2026-06-06T00:00:01Z".to_string()),
                    left_at: None,
                    duration_ms: None,
                    leave_reason: None,
                    last_seen_at: Some("2026-06-06T00:00:01Z".to_string()),
                },
                RtcMediaParticipant {
                    id: "participant-2".to_string(),
                    session_id: "session-1".to_string(),
                    user_id: "user-2".to_string(),
                    display_name: "Guest".to_string(),
                    role: RtcParticipantRole::Guest,
                    state: RtcParticipantState::Joined,
                    audio_muted: true,
                    video_muted: false,
                    screen_share_active: false,
                    provider_participant_id: None,
                    joined_at: Some("2026-06-06T00:00:02Z".to_string()),
                    left_at: None,
                    duration_ms: None,
                    leave_reason: None,
                    last_seen_at: Some("2026-06-06T00:00:02Z".to_string()),
                },
            ],
        },
        RtcMediaSession {
            id: "session-2".to_string(),
            room_id: "room-1".to_string(),
            tenant_id: "100001".to_string(),
            organization_id: "org-1".to_string(),
            owner_user_id: "1".to_string(),
            media_mode: RtcMediaSessionMode::Audio,
            status: RtcMediaSessionStatus::Ended,
            provider_profile_id: None,
            provider_session_id: None,
            started_at: Some("2026-06-06T01:00:00Z".to_string()),
            connected_at: Some("2026-06-06T01:00:00Z".to_string()),
            ended_at: Some("2026-06-06T01:05:00Z".to_string()),
            duration_ms: Some(300_000),
            end_reason: Some("manual_close".to_string()),
            end_source: Some(RtcMediaSessionEndSource::ManualClose),
            participant_count: 0,
            max_concurrent_participants: 0,
            quality_summary: None,
            recording_summary: None,
            completion_recorded_at: Some("2026-06-06T01:05:01Z".to_string()),
            last_provider_webhook_event_id: None,
            last_provider_query_job_id: None,
            participants: Vec::new(),
        },
    ];

    assert_eq!(
        summarize_rtc_workspace(&rooms, &sessions),
        RtcWorkspaceDigest {
            active_sessions: 1,
            connected_sessions: 2,
            ended_sessions: 1,
            total_participants: 2,
            total_rooms: 1,
            total_sessions: 2,
            live_sessions: 0,
            video_sessions: 1,
        }
    );
}

#[test]
fn utc_time_helpers_format_unix_seconds() {
    assert_eq!(format_unix_seconds_rfc3339(0), "1970-01-01T00:00:00.000Z");
    assert_eq!(utc_now_rfc3339_millis().len(), 24);
}
