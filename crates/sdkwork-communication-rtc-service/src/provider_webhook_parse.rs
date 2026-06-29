use serde_json::Value as JsonValue;

use crate::error::RtcContractError;

pub const WEBHOOK_NESTED_FIELD_CONTAINERS: &[&str] = &[
    "EventData",
    "EventInfo",
    "Data",
    "data",
    "eventData",
    "eventInfo",
    "payload",
    "Payload",
    "room",
    "participant",
    "recording",
    "track",
    "egressInfo",
    "egress",
    "ingressInfo",
];

pub fn parse_provider_webhook_payload_json(
    raw_payload: &str,
    provider_label: &str,
) -> Result<JsonValue, RtcContractError> {
    serde_json::from_str(raw_payload).map_err(|error| {
        RtcContractError::Conflict(format!("invalid {provider_label} webhook payload: {error}"))
    })
}

pub fn webhook_string_field(payload: &JsonValue, names: &[&str]) -> Option<String> {
    webhook_string_field_in(payload, names)
        .or_else(|| webhook_nested_string_field(payload, names, WEBHOOK_NESTED_FIELD_CONTAINERS))
}

pub fn webhook_string_field_in(payload: &JsonValue, names: &[&str]) -> Option<String> {
    names.iter().find_map(|name| {
        payload.get(*name).and_then(|value| match value {
            JsonValue::String(value) => Some(value.clone()),
            JsonValue::Number(value) => Some(value.to_string()),
            JsonValue::Bool(value) => Some(value.to_string()),
            _ => None,
        })
    })
}

pub fn webhook_nested_string_field(
    payload: &JsonValue,
    names: &[&str],
    container_names: &[&str],
) -> Option<String> {
    container_names.iter().find_map(|name| {
        let nested = payload.get(*name)?;
        webhook_string_field_in(nested, names).or_else(|| match nested {
            JsonValue::String(value) => serde_json::from_str::<JsonValue>(value)
                .ok()
                .and_then(|parsed| webhook_string_field_in(&parsed, names)),
            _ => None,
        })
    })
}

pub fn webhook_nested_object_string_field(
    payload: &JsonValue,
    object_name: &str,
    names: &[&str],
) -> Option<String> {
    let nested = payload.get(object_name)?;
    webhook_string_field_in(nested, names).or_else(|| match nested {
        JsonValue::String(value) => serde_json::from_str::<JsonValue>(value)
            .ok()
            .and_then(|parsed| webhook_string_field_in(&parsed, names)),
        _ => None,
    })
}

pub fn webhook_header_value(headers: &[(String, String)], names: &[&str]) -> Option<String> {
    headers.iter().find_map(|(key, value)| {
        names
            .iter()
            .any(|candidate| key.eq_ignore_ascii_case(candidate))
            .then(|| value.clone())
    })
}

pub fn format_provider_session_id(provider: &str, session_id: &str) -> String {
    if session_id.contains(':') {
        session_id.to_string()
    } else {
        format!("{provider}:{session_id}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn webhook_string_field_reads_top_level_and_nested_values() {
        let payload = json!({
            "EventData": {
                "roomId": "room-1"
            }
        });
        assert_eq!(
            webhook_string_field(&payload, &["roomId", "RoomId"]),
            Some("room-1".into())
        );
    }

    #[test]
    fn format_provider_session_id_preserves_existing_namespace() {
        assert_eq!(
            format_provider_session_id("volcengine", "volcengine:session-1"),
            "volcengine:session-1"
        );
        assert_eq!(
            format_provider_session_id("volcengine", "session-1"),
            "volcengine:session-1"
        );
    }
}
