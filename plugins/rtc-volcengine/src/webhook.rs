use sdkwork_communication_rtc_service::{
    RtcContractError, RtcProviderEventKind, RtcProviderWebhookEvent,
    RtcProviderWebhookParseRequest, RtcProviderWebhookVerifyRequest, format_provider_session_id,
    parse_provider_webhook_payload_json, rtc_provider_payload_hash,
    verify_provider_webhook_signature_hmac, webhook_header_value, webhook_string_field,
};
use serde_json::json;

pub(crate) fn parse_provider_webhook(
    request: RtcProviderWebhookParseRequest,
) -> Result<RtcProviderWebhookEvent, RtcContractError> {
    let payload = parse_provider_webhook_payload_json(request.raw_payload.as_str(), "volcengine")?;
    let event_type = webhook_string_field(&payload, &["EventType", "event_type", "eventType"])
        .unwrap_or_else(|| "unknown".into());
    let event_kind = volcengine_event_kind(event_type.as_str());
    let external_event_id =
        webhook_string_field(&payload, &["EventId", "event_id", "eventId", "UniqueId"]);
    let room_id = webhook_string_field(&payload, &["RoomId", "room_id", "roomId"]);
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
            .map(|session_id| format_provider_session_id("volcengine", session_id))
    });
    let participant_id = webhook_string_field(&payload, &["UserId", "user_id", "userId"]);
    let recording_id = webhook_string_field(
        &payload,
        &["TaskId", "task_id", "taskId", "RecordId", "recordId"],
    );
    let occurred_at = webhook_string_field(
        &payload,
        &[
            "Timestamp",
            "timestamp",
            "EventTime",
            "eventTime",
            "EventTs",
            "EventMsTs",
        ],
    );
    let signature_header = webhook_header_value(
        request.headers.as_slice(),
        &["X-Volc-Signature", "X-VolcEngine-Signature", "X-Volc-Sign"],
    );
    let normalized_event_json = json!({
        "provider": "volcengine",
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
        provider: "volcengine".into(),
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
    verify_provider_webhook_signature_hmac(request)
}

fn volcengine_event_kind(event_type: &str) -> RtcProviderEventKind {
    let normalized = event_type.to_ascii_lowercase();
    if normalized.contains("join") || normalized.contains("enter") {
        RtcProviderEventKind::ParticipantJoined
    } else if normalized.contains("leave") || normalized.contains("exit") {
        RtcProviderEventKind::ParticipantLeft
    } else if normalized.contains("record") && normalized.contains("start") {
        RtcProviderEventKind::RecordingStarted
    } else if normalized.contains("record")
        && (normalized.contains("complete")
            || normalized.contains("finish")
            || normalized.contains("stop"))
    {
        RtcProviderEventKind::RecordingCompleted
    } else if normalized.contains("record") && normalized.contains("fail") {
        RtcProviderEventKind::RecordingFailed
    } else if normalized.contains("room")
        && (normalized.contains("end")
            || normalized.contains("destroy")
            || normalized.contains("close"))
    {
        RtcProviderEventKind::RoomEnded
    } else if normalized.contains("room")
        && (normalized.contains("start")
            || normalized.contains("create")
            || normalized.contains("created")
            || normalized.contains("open"))
    {
        RtcProviderEventKind::RoomStarted
    } else {
        RtcProviderEventKind::Unknown
    }
}
