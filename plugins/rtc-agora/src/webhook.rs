use sdkwork_communication_rtc_service::{
    RtcContractError, RtcProviderEventKind, RtcProviderWebhookEvent,
    RtcProviderWebhookParseRequest, rtc_provider_payload_hash,
};
use serde_json::{Value as JsonValue, json};

pub(crate) fn parse_provider_webhook(
    request: RtcProviderWebhookParseRequest,
) -> Result<RtcProviderWebhookEvent, RtcContractError> {
    let payload = parse_payload(request.raw_payload.as_str())?;
    let event_type = string_field(&payload, &["eventType", "EventType", "event", "type"])
        .unwrap_or_else(|| "unknown".into());
    let event_kind = agora_event_kind(event_type.as_str());
    let external_event_id = string_field(
        &payload,
        &[
            "eventId",
            "EventId",
            "noticeId",
            "NoticeId",
            "callbackId",
            "requestId",
        ],
    );
    let room_id = string_field(
        &payload,
        &[
            "channelName",
            "ChannelName",
            "channelId",
            "ChannelId",
            "roomId",
            "room_id",
            "roomName",
            "name",
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
            .map(|session_id| format_provider_session_id("agora", session_id))
    });
    let participant_id = string_field(&payload, &["uid", "Uid", "userId", "UserId", "user"]);
    let recording_id = string_field(
        &payload,
        &[
            "sid",
            "Sid",
            "resourceId",
            "resource_id",
            "taskId",
            "recordingId",
        ],
    );
    let occurred_at = string_field(
        &payload,
        &[
            "timestamp",
            "Timestamp",
            "eventTime",
            "EventTime",
            "createdAt",
            "ms",
        ],
    );
    let signature_header = header_value(
        request.headers.as_slice(),
        &[
            "Agora-Signature-V2",
            "Agora-Signature",
            "X-Agora-Signature",
            "Authorization",
        ],
    );
    let normalized_event_json = json!({
        "provider": "agora",
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
        provider: "agora".into(),
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

fn parse_payload(raw_payload: &str) -> Result<JsonValue, RtcContractError> {
    serde_json::from_str(raw_payload).map_err(|error| {
        RtcContractError::Conflict(format!("invalid agora webhook payload: {error}"))
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
        "payload",
        "Payload",
        "data",
        "Data",
        "eventData",
        "EventData",
        "eventInfo",
        "EventInfo",
        "room",
        "participant",
        "recording",
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

fn agora_event_kind(event_type: &str) -> RtcProviderEventKind {
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
    } else if normalized.contains("channel")
        && (normalized.contains("destroy")
            || normalized.contains("close")
            || normalized.contains("end"))
    {
        RtcProviderEventKind::RoomEnded
    } else if normalized.contains("channel")
        && (normalized.contains("create") || normalized.contains("start"))
    {
        RtcProviderEventKind::RoomStarted
    } else {
        RtcProviderEventKind::Unknown
    }
}
