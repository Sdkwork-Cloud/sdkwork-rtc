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
    let payload = parse_provider_webhook_payload_json(request.raw_payload.as_str(), "aliyun")?;
    let event_type = webhook_string_field(&payload, &["eventType", "EventType", "event", "type"])
        .unwrap_or_else(|| "unknown".into());
    let event_kind = aliyun_event_kind(event_type.as_str());
    let external_event_id = webhook_string_field(
        &payload,
        &[
            "eventId",
            "EventId",
            "event_id",
            "EventID",
            "messageId",
            "MessageId",
            "traceId",
        ],
    );
    let room_id = webhook_string_field(
        &payload,
        &[
            "channelId",
            "ChannelId",
            "channelName",
            "ChannelName",
            "roomId",
            "room_id",
            "roomName",
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
            .map(|session_id| format_provider_session_id("aliyun", session_id))
    });
    let participant_id =
        webhook_string_field(&payload, &["userId", "UserId", "uid", "Uid", "user"]);
    let recording_id = webhook_string_field(
        &payload,
        &[
            "taskId",
            "TaskId",
            "recordId",
            "RecordId",
            "recordingId",
            "jobId",
        ],
    );
    let occurred_at = webhook_string_field(
        &payload,
        &[
            "timestamp",
            "Timestamp",
            "eventTime",
            "EventTime",
            "eventTs",
            "EventTs",
        ],
    );
    let signature_header = webhook_header_value(
        request.headers.as_slice(),
        &[
            "X-Acs-Signature",
            "X-Aliyun-Signature",
            "X-Acs-Content-Sha256",
            "Authorization",
            "Sign",
        ],
    );
    let normalized_event_json = json!({
        "provider": "aliyun",
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
        provider: "aliyun".into(),
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

fn aliyun_event_kind(event_type: &str) -> RtcProviderEventKind {
    let normalized = event_type.to_ascii_lowercase();
    if normalized.contains("join") || normalized.contains("enter") {
        RtcProviderEventKind::ParticipantJoined
    } else if normalized.contains("leave")
        || normalized.contains("left")
        || normalized.contains("exit")
    {
        RtcProviderEventKind::ParticipantLeft
    } else if normalized.contains("record") && normalized.contains("start") {
        RtcProviderEventKind::RecordingStarted
    } else if normalized.contains("record")
        && (normalized.contains("complete")
            || normalized.contains("finish")
            || normalized.contains("stop")
            || normalized.contains("ended"))
    {
        RtcProviderEventKind::RecordingCompleted
    } else if normalized.contains("record") && normalized.contains("fail") {
        RtcProviderEventKind::RecordingFailed
    } else if normalized.contains("track")
        && (normalized.contains("publish") || normalized.contains("start"))
    {
        RtcProviderEventKind::MediaTrackStarted
    } else if normalized.contains("track")
        && (normalized.contains("unpublish") || normalized.contains("stop"))
    {
        RtcProviderEventKind::MediaTrackStopped
    } else if normalized.contains("quality") {
        RtcProviderEventKind::QualitySample
    } else if normalized.contains("room")
        && (normalized.contains("end")
            || normalized.contains("destroy")
            || normalized.contains("close"))
    {
        RtcProviderEventKind::RoomEnded
    } else if normalized.contains("room")
        && (normalized.contains("start")
            || normalized.contains("create")
            || normalized.contains("open"))
    {
        RtcProviderEventKind::RoomStarted
    } else {
        RtcProviderEventKind::Unknown
    }
}
