use sdkwork_communication_rtc_service::{
    RtcContractError, RtcProviderEventKind, RtcProviderWebhookEvent,
    RtcProviderWebhookParseRequest, RtcProviderWebhookVerifyRequest, rtc_provider_payload_hash,
    verify_provider_webhook_signature_hmac,
};
use serde_json::{Value as JsonValue, json};

pub(crate) fn parse_provider_webhook(
    request: RtcProviderWebhookParseRequest,
) -> Result<RtcProviderWebhookEvent, RtcContractError> {
    let payload = parse_payload(request.raw_payload.as_str())?;
    let event_type = string_field(&payload, &["eventType", "EventType", "event", "type"])
        .unwrap_or_else(|| "unknown".into());
    let event_kind = aliyun_event_kind(event_type.as_str());
    let external_event_id = string_field(
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
    let room_id = string_field(
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
    let rtc_session_id = string_field(
        &payload,
        &[
            "SessionId",
            "session_id",
            "sessionId",
            "RtcSessionId",
            "rtcSessionId",
        ],
    );
    let provider_session_id = string_field(
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
    let participant_id = string_field(&payload, &["userId", "UserId", "uid", "Uid", "user"]);
    let recording_id = string_field(
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
    let occurred_at = string_field(
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
    let signature_header = header_value(
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

fn parse_payload(raw_payload: &str) -> Result<JsonValue, RtcContractError> {
    serde_json::from_str(raw_payload).map_err(|error| {
        RtcContractError::Conflict(format!("invalid aliyun webhook payload: {error}"))
    })
}

fn string_field(payload: &JsonValue, names: &[&str]) -> Option<String> {
    string_field_in(payload, names).or_else(|| nested_string_field(payload, names))
}

fn string_field_in(payload: &JsonValue, names: &[&str]) -> Option<String> {
    names.iter().find_map(|name| {
        payload.get(*name).and_then(|value| match value {
            JsonValue::String(value) => Some(value.clone()),
            JsonValue::Number(value) => Some(value.to_string()),
            JsonValue::Bool(value) => Some(value.to_string()),
            _ => None,
        })
    })
}

fn nested_string_field(payload: &JsonValue, names: &[&str]) -> Option<String> {
    [
        "data",
        "Data",
        "eventData",
        "EventData",
        "eventInfo",
        "EventInfo",
        "payload",
        "Payload",
        "recording",
        "room",
        "participant",
    ]
    .iter()
    .find_map(|name| {
        let nested = payload.get(*name)?;
        string_field_in(nested, names).or_else(|| match nested {
            JsonValue::String(value) => serde_json::from_str::<JsonValue>(value)
                .ok()
                .and_then(|parsed| string_field_in(&parsed, names)),
            _ => None,
        })
    })
}

fn header_value(headers: &[(String, String)], names: &[&str]) -> Option<String> {
    headers.iter().find_map(|(key, value)| {
        names
            .iter()
            .any(|candidate| key.eq_ignore_ascii_case(candidate))
            .then(|| value.clone())
    })
}

fn format_provider_session_id(provider: &str, session_id: &str) -> String {
    if session_id.contains(':') {
        session_id.to_string()
    } else {
        format!("{provider}:{session_id}")
    }
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
