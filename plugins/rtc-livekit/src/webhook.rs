use sdkwork_communication_rtc_service::{
    RtcContractError, RtcProviderEventKind, RtcProviderWebhookEvent,
    RtcProviderWebhookParseRequest, RtcProviderWebhookVerifyRequest, format_provider_session_id,
    parse_provider_webhook_payload_json, rtc_provider_payload_hash,
    verify_livekit_webhook_signature, webhook_header_value, webhook_nested_object_string_field,
    webhook_string_field, webhook_string_field_in,
};
use serde_json::json;

pub(crate) fn parse_provider_webhook(
    request: RtcProviderWebhookParseRequest,
) -> Result<RtcProviderWebhookEvent, RtcContractError> {
    let payload = parse_provider_webhook_payload_json(request.raw_payload.as_str(), "livekit")?;
    let event_type = webhook_string_field(&payload, &["event", "Event", "eventType", "type"])
        .unwrap_or_else(|| "unknown".into());
    let event_kind = livekit_event_kind(event_type.as_str());
    let external_event_id = webhook_string_field(
        &payload,
        &["id", "eventId", "EventId", "sid", "requestId", "webhookId"],
    );
    let room_id = webhook_string_field(
        &payload,
        &[
            "name",
            "roomName",
            "room_name",
            "roomId",
            "room_id",
            "sid",
            "roomSid",
        ],
    );
    let rtc_session_id = webhook_string_field(
        &payload,
        &[
            "SessionId",
            "session_id",
            "sessionId",
            "RtcSessionId",
            "rtcSessionId",
        ],
    );
    let provider_session_id = webhook_string_field(
        &payload,
        &[
            "ProviderSessionId",
            "provider_session_id",
            "providerSessionId",
        ],
    )
    .or_else(|| {
        rtc_session_id
            .as_deref()
            .map(|session_id| format_provider_session_id("livekit", session_id))
    });
    let participant_id = webhook_nested_object_string_field(
        &payload,
        "participant",
        &[
            "identity",
            "participantIdentity",
            "participant_id",
            "userId",
            "uid",
            "sid",
        ],
    )
    .or_else(|| {
        webhook_string_field_in(
            &payload,
            &[
                "identity",
                "participantIdentity",
                "participant_id",
                "userId",
                "uid",
            ],
        )
    });
    let recording_id = webhook_nested_object_string_field(
        &payload,
        "egressInfo",
        &["egressId", "egress_id", "recordingId", "recording_id", "id"],
    )
    .or_else(|| {
        webhook_nested_object_string_field(
            &payload,
            "egress",
            &["egressId", "egress_id", "recordingId", "recording_id", "id"],
        )
    })
    .or_else(|| {
        webhook_string_field_in(
            &payload,
            &["egressId", "egress_id", "recordingId", "recording_id"],
        )
    });
    let occurred_at = webhook_string_field(
        &payload,
        &[
            "createdAt",
            "created_at",
            "startedAt",
            "endedAt",
            "timestamp",
            "eventTime",
        ],
    );
    let signature_header = webhook_header_value(
        request.headers.as_slice(),
        &[
            "Authorization",
            "LiveKit-Signature",
            "X-LiveKit-Signature",
            "X-LK-Signature",
        ],
    );
    let normalized_event_json = json!({
        "provider": "livekit",
        "eventType": event_type.clone(),
        "eventKind": event_kind.clone(),
        "roomId": room_id.clone(),
        "rtcSessionId": rtc_session_id.clone(),
        "providerSessionId": provider_session_id.clone(),
        "participantId": participant_id.clone(),
        "recordingId": recording_id.clone(),
        "providerProfileId": request.provider_profile_id.clone(),
    })
    .to_string();

    Ok(RtcProviderWebhookEvent {
        provider: "livekit".into(),
        provider_profile_id: request.provider_profile_id,
        external_event_id,
        event_type,
        event_kind,
        room_id,
        rtc_session_id,
        provider_session_id,
        participant_id,
        recording_id,
        occurred_at,
        received_at: request.received_at,
        payload_hash: rtc_provider_payload_hash(request.raw_payload.as_str()),
        signature_header,
        raw_payload: request.raw_payload,
        normalized_event_json,
    })
}

pub(crate) fn verify_provider_webhook_signature(
    request: RtcProviderWebhookVerifyRequest,
) -> Result<(), RtcContractError> {
    verify_livekit_webhook_signature(request)
}

fn livekit_event_kind(event_type: &str) -> RtcProviderEventKind {
    let normalized = event_type.to_ascii_lowercase();
    if normalized.contains("participant_join") {
        RtcProviderEventKind::ParticipantJoined
    } else if normalized.contains("participant_leave") {
        RtcProviderEventKind::ParticipantLeft
    } else if normalized.contains("egress_start") || normalized.contains("recording_start") {
        RtcProviderEventKind::RecordingStarted
    } else if normalized.contains("egress_end")
        || normalized.contains("recording_complete")
        || normalized.contains("recording_finish")
    {
        RtcProviderEventKind::RecordingCompleted
    } else if normalized.contains("egress_fail") || normalized.contains("recording_fail") {
        RtcProviderEventKind::RecordingFailed
    } else if normalized.contains("track_publish") {
        RtcProviderEventKind::MediaTrackStarted
    } else if normalized.contains("track_unpublish") {
        RtcProviderEventKind::MediaTrackStopped
    } else if normalized.contains("room_finish") || normalized.contains("room_end") {
        RtcProviderEventKind::RoomEnded
    } else if normalized.contains("room_start") || normalized.contains("room_create") {
        RtcProviderEventKind::RoomStarted
    } else {
        RtcProviderEventKind::Unknown
    }
}
