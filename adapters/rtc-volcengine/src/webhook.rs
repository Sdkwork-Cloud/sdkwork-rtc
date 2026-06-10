use sdkwork_rtc_core::{
    RtcContractError, RtcProviderEventKind, RtcProviderWebhookEvent,
    RtcProviderWebhookParseRequest, rtc_provider_payload_hash,
};
use serde_json::{Value as JsonValue, json};

pub(crate) fn parse_provider_webhook(
    request: RtcProviderWebhookParseRequest,
) -> Result<RtcProviderWebhookEvent, RtcContractError> {
    let payload = parse_payload(request.raw_payload.as_str())?;
    let event_type = string_field(&payload, &["EventType", "event_type", "eventType"])
        .unwrap_or_else(|| "unknown".into());
    let event_kind = volcengine_event_kind(event_type.as_str());
    let external_event_id = string_field(&payload, &["EventId", "event_id", "eventId", "UniqueId"]);
    let room_id = string_field(&payload, &["RoomId", "room_id", "roomId"]);
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
            .map(|session_id| provider_session_id("volcengine", session_id))
    });
    let participant_id = string_field(&payload, &["UserId", "user_id", "userId"]);
    let recording_id = string_field(
        &payload,
        &["TaskId", "task_id", "taskId", "RecordId", "recordId"],
    );
    let occurred_at = string_field(
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
    let signature_header = header_value(
        request.headers.as_slice(),
        &["X-Volc-Signature", "X-VolcEngine-Signature", "X-Volc-Sign"],
    )
    .or_else(|| string_field(&payload, &["Signature", "signature", "Sign", "sign"]));
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

fn parse_payload(raw_payload: &str) -> Result<JsonValue, RtcContractError> {
    serde_json::from_str(raw_payload).map_err(|error| {
        RtcContractError::Conflict(format!("invalid volcengine webhook payload: {error}"))
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
        "EventData",
        "EventInfo",
        "Data",
        "data",
        "eventData",
        "eventInfo",
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

fn provider_session_id(provider: &str, session_id: &str) -> String {
    if session_id.contains(':') {
        session_id.to_string()
    } else {
        format!("{provider}:{session_id}")
    }
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
