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
    let event_type = string_field(&payload, &["EventType", "event_type", "eventType"])
        .unwrap_or_else(|| "unknown".into());
    let event_kind = tencent_event_kind(event_type.as_str());
    let external_event_id = string_field(&payload, &["EventId", "event_id", "eventId", "UniqueId"]);
    let room_id = string_field(&payload, &["RoomId", "room_id", "roomId", "RoomIdType"]);
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
            .map(|session_id| provider_session_id("tencent", session_id))
    });
    let participant_id = string_field(&payload, &["UserId", "user_id", "userId"]);
    let recording_id = string_field(
        &payload,
        &["TaskId", "task_id", "taskId", "RecordId", "recordId"],
    );
    let occurred_at = string_field(
        &payload,
        &[
            "EventTime",
            "event_time",
            "Timestamp",
            "CallbackTs",
            "EventTs",
            "EventMsTs",
        ],
    );
    let signature_header = header_value(
        request.headers.as_slice(),
        &["X-TC-Signature", "X-Tencent-Signature", "Sign"],
    );
    let normalized_event_json = json!({
        "provider": "tencent",
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
        provider: "tencent".into(),
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
        RtcContractError::Conflict(format!("invalid tencent webhook payload: {error}"))
    })
}

fn string_field(payload: &JsonValue, names: &[&str]) -> Option<String> {
    string_field_in(payload, names).or_else(|| {
        [
            "EventInfo",
            "EventData",
            "Data",
            "data",
            "eventInfo",
            "eventData",
        ]
        .iter()
        .find_map(|name| {
            payload
                .get(*name)
                .and_then(|value| string_field_in(value, names))
        })
    })
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

fn tencent_event_kind(event_type: &str) -> RtcProviderEventKind {
    match event_type {
        "103" | "RoomUserJoin" | "UserEnter" => RtcProviderEventKind::ParticipantJoined,
        "104" | "RoomUserLeave" | "UserExit" => RtcProviderEventKind::ParticipantLeft,
        "201" | "203" | "205" | "AudioStarted" | "VideoStarted" | "ScreenShareStarted" => {
            RtcProviderEventKind::MediaTrackStarted
        }
        "202" | "204" | "206" | "AudioStopped" | "VideoStopped" | "ScreenShareStopped" => {
            RtcProviderEventKind::MediaTrackStopped
        }
        "301" | "RecordingStart" => RtcProviderEventKind::RecordingStarted,
        "302" | "RecordingComplete" | "RecordingFinished" => {
            RtcProviderEventKind::RecordingCompleted
        }
        "303" | "RecordingFailed" => RtcProviderEventKind::RecordingFailed,
        "101" | "RoomStart" => RtcProviderEventKind::RoomStarted,
        "102" | "RoomEnd" => RtcProviderEventKind::RoomEnded,
        _ => RtcProviderEventKind::Unknown,
    }
}
