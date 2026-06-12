use sdkwork_communication_rtc_service::{
    RtcContractError, RtcProviderQueryRequest, RtcProviderQueryResult, utc_now_rfc3339_millis,
};
use serde_json::{Map, Value as JsonValue, json};

use crate::config::VolcengineRtcProviderConfig;
use crate::open_api::{
    VolcengineRtcOpenApiExecutor, build_signed_volcengine_request, request_snapshot,
    volcengine_action,
};

pub(crate) fn query_provider_state(
    config: &VolcengineRtcProviderConfig,
    open_api_executor: Option<&dyn VolcengineRtcOpenApiExecutor>,
    request: RtcProviderQueryRequest,
) -> Result<RtcProviderQueryResult, RtcContractError> {
    let action = volcengine_action(request.query_kind.clone());
    let queried_at = utc_now_rfc3339_millis();
    let executor = open_api_executor.ok_or_else(|| {
        RtcContractError::Unavailable(
            "volcengine active query requires a configured OpenAPI executor".to_string(),
        )
    })?;
    let provider_request =
        build_signed_volcengine_request(config, &request, action, queried_at.as_str())?;
    let provider_response = executor.execute(&provider_request)?;
    let provider_body = parse_provider_response(&provider_response)?;
    let next_cursor = extract_next_cursor(&provider_body);
    let normalized = normalized_snapshot(&request, action, &provider_body, next_cursor.as_deref());
    let result_snapshot_json = request_snapshot(
        &provider_request,
        Some(&provider_response),
        Some(normalized),
    );

    Ok(RtcProviderQueryResult {
        provider: "volcengine".into(),
        provider_profile_id: request.provider_profile_id,
        query_kind: request.query_kind,
        room_id: request.room_id,
        rtc_session_id: request.rtc_session_id,
        provider_session_id: request.provider_session_id,
        status: "synced".into(),
        raw_provider_action: action.into(),
        result_snapshot_json,
        next_cursor,
        queried_at,
    })
}

fn parse_provider_response(
    response: &crate::open_api::VolcengineRtcOpenApiResponse,
) -> Result<JsonValue, RtcContractError> {
    let parsed = serde_json::from_str::<JsonValue>(response.body.as_str());
    let request_id = parsed.as_ref().ok().and_then(volcengine_request_id);
    if !(200..300).contains(&response.status_code) {
        return Err(RtcContractError::Unavailable(format!(
            "volcengine active query returned HTTP {}{}",
            response.status_code,
            format_request_id(request_id.as_deref())
        )));
    }

    let body = parsed.map_err(|error| {
        RtcContractError::Unavailable(format!(
            "failed to parse volcengine active query response JSON: {error}"
        ))
    })?;
    if let Some(error) = volcengine_error(&body) {
        return Err(RtcContractError::Unavailable(format!(
            "volcengine active query failed with provider error {}{}{}",
            error.code.unwrap_or_else(|| "unknown".into()),
            error
                .message
                .map(|message| format!(": {message}"))
                .unwrap_or_default(),
            format_request_id(request_id.as_deref())
        )));
    }
    Ok(body)
}

fn normalized_snapshot(
    request: &RtcProviderQueryRequest,
    action: &str,
    body: &JsonValue,
    next_cursor: Option<&str>,
) -> JsonValue {
    let mut normalized = Map::new();
    normalized.insert("provider".into(), json!("volcengine"));
    normalized.insert("action".into(), json!(action));
    normalized.insert("status".into(), json!("synced"));
    insert_optional_string(&mut normalized, "requestId", volcengine_request_id(body));
    insert_optional_string(
        &mut normalized,
        "providerProfileId",
        request.provider_profile_id.clone(),
    );
    insert_optional_string(&mut normalized, "roomId", request.room_id.clone());
    insert_optional_string(
        &mut normalized,
        "rtcSessionId",
        request.rtc_session_id.clone(),
    );
    insert_optional_string(
        &mut normalized,
        "providerSessionId",
        request.provider_session_id.clone(),
    );
    insert_optional_string(
        &mut normalized,
        "nextCursor",
        next_cursor.map(str::to_string),
    );

    let result = body.get("Result").unwrap_or(body);
    match request.query_kind {
        sdkwork_communication_rtc_service::RtcProviderQueryKind::RoomOnlineUsers => {
            let participant_ids = string_array_from_paths(
                result,
                &[
                    &["VisibleUserList"][..],
                    &["UserList"][..],
                    &["OnlineUserList"][..],
                    &["OnlineUsers"][..],
                    &["Users"][..],
                ],
            );
            if !participant_ids.is_empty() {
                normalized.insert("participantIds".into(), json!(participant_ids));
            }
            let participant_count = first_u64_from_paths(
                result,
                &[
                    &["TotalUser"][..],
                    &["TotalUsers"][..],
                    &["UserCount"][..],
                    &["OnlineUserCount"][..],
                ],
            )
            .or_else(|| {
                normalized
                    .get("participantIds")
                    .and_then(JsonValue::as_array)
                    .map(|items| items.len() as u64)
            });
            insert_optional_u64(&mut normalized, "participantCount", participant_count);
        }
        sdkwork_communication_rtc_service::RtcProviderQueryKind::RoomState => {
            insert_optional_bool(
                &mut normalized,
                "roomExists",
                first_bool_from_paths(
                    result,
                    &[
                        &["RoomExists"][..],
                        &["Exists"][..],
                        &["RoomInfo", "RoomExists"][..],
                    ],
                ),
            );
            insert_optional_string(
                &mut normalized,
                "providerRoomStatus",
                first_string_from_paths(
                    result,
                    &[
                        &["Status"][..],
                        &["State"][..],
                        &["RoomInfo", "Status"][..],
                        &["RoomInfo", "State"][..],
                    ],
                ),
            );
        }
        sdkwork_communication_rtc_service::RtcProviderQueryKind::MediaSessionState => {
            insert_optional_string(
                &mut normalized,
                "providerSessionStatus",
                first_string_from_paths(
                    result,
                    &[
                        &["Status"][..],
                        &["State"][..],
                        &["SessionStatus"][..],
                        &["RoomInfo", "Status"][..],
                    ],
                ),
            );
        }
        sdkwork_communication_rtc_service::RtcProviderQueryKind::RecordingArtifacts => {
            insert_optional_string(
                &mut normalized,
                "recordingId",
                first_string_from_paths(
                    result,
                    &[
                        &["TaskId"][..],
                        &["RecordTaskId"][..],
                        &["RecordingId"][..],
                        &["RecordTask", "TaskId"][..],
                        &["RecordTask", "RecordTaskId"][..],
                        &["RecordTask", "RecordingId"][..],
                    ],
                ),
            );
            insert_optional_string(
                &mut normalized,
                "recordingStatus",
                first_string_from_paths(
                    result,
                    &[
                        &["Status"][..],
                        &["TaskStatus"][..],
                        &["RecordTask", "Status"][..],
                        &["RecordTask", "TaskStatus"][..],
                    ],
                ),
            );
            insert_optional_u64(
                &mut normalized,
                "artifactCount",
                first_array_len_from_paths(
                    result,
                    &[
                        &["RecordFiles"][..],
                        &["RecordFileList"][..],
                        &["StorageFileList"][..],
                        &["Artifacts"][..],
                        &["RecordTask", "RecordFiles"][..],
                    ],
                ),
            );
        }
        sdkwork_communication_rtc_service::RtcProviderQueryKind::QualitySamples => {
            insert_optional_u64(
                &mut normalized,
                "sampleCount",
                first_array_len_from_paths(
                    result,
                    &[
                        &["MetricList"][..],
                        &["QualityMetricList"][..],
                        &["Samples"][..],
                    ],
                ),
            );
        }
    }

    JsonValue::Object(normalized)
}

struct ProviderErrorSummary {
    code: Option<String>,
    message: Option<String>,
}

fn volcengine_error(body: &JsonValue) -> Option<ProviderErrorSummary> {
    let error = get_path(body, &["ResponseMetadata", "Error"]).or_else(|| body.get("Error"))?;
    Some(ProviderErrorSummary {
        code: first_string_from_paths(
            error,
            &[&["Code"][..], &["CodeN"][..], &["code"][..], &[][..]],
        ),
        message: first_string_from_paths(error, &[&["Message"][..], &["message"][..]]),
    })
}

fn volcengine_request_id(body: &JsonValue) -> Option<String> {
    first_string_from_paths(
        body,
        &[
            &["ResponseMetadata", "RequestId"][..],
            &["ResponseMetadata", "RequestID"][..],
            &["RequestId"][..],
            &["RequestID"][..],
        ],
    )
}

fn extract_next_cursor(body: &JsonValue) -> Option<String> {
    first_string_from_paths(
        body,
        &[
            &["Result", "NextPageToken"][..],
            &["Result", "NextToken"][..],
            &["Result", "NextCursor"][..],
            &["Result", "Next"][..],
            &["NextPageToken"][..],
            &["NextToken"][..],
            &["NextCursor"][..],
            &["Next"][..],
        ],
    )
}

fn get_path<'a>(value: &'a JsonValue, path: &[&str]) -> Option<&'a JsonValue> {
    let mut current = value;
    for segment in path {
        current = current.get(*segment)?;
    }
    Some(current)
}

fn first_string_from_paths(value: &JsonValue, paths: &[&[&str]]) -> Option<String> {
    paths
        .iter()
        .filter_map(|path| get_path(value, path))
        .find_map(json_scalar_string)
}

fn json_scalar_string(value: &JsonValue) -> Option<String> {
    match value {
        JsonValue::String(value) => Some(value.trim().to_string()),
        JsonValue::Number(value) => Some(value.to_string()),
        JsonValue::Bool(value) => Some(value.to_string()),
        _ => None,
    }
    .filter(|value| !value.is_empty())
}

fn first_u64_from_paths(value: &JsonValue, paths: &[&[&str]]) -> Option<u64> {
    paths
        .iter()
        .filter_map(|path| get_path(value, path))
        .find_map(|value| {
            value
                .as_u64()
                .or_else(|| value.as_str().and_then(|value| value.parse::<u64>().ok()))
        })
}

fn first_bool_from_paths(value: &JsonValue, paths: &[&[&str]]) -> Option<bool> {
    paths
        .iter()
        .filter_map(|path| get_path(value, path))
        .find_map(|value| {
            value.as_bool().or_else(|| {
                value
                    .as_str()
                    .and_then(|value| match value.to_ascii_lowercase().as_str() {
                        "true" | "1" | "yes" => Some(true),
                        "false" | "0" | "no" => Some(false),
                        _ => None,
                    })
            })
        })
}

fn first_array_len_from_paths(value: &JsonValue, paths: &[&[&str]]) -> Option<u64> {
    paths
        .iter()
        .filter_map(|path| get_path(value, path))
        .find_map(|value| value.as_array().map(|items| items.len() as u64))
}

fn string_array_from_paths(value: &JsonValue, paths: &[&[&str]]) -> Vec<String> {
    paths
        .iter()
        .filter_map(|path| get_path(value, path))
        .find_map(|value| value.as_array())
        .map(|items| {
            items
                .iter()
                .filter_map(|item| {
                    json_scalar_string(item).or_else(|| {
                        first_string_from_paths(
                            item,
                            &[
                                &["UserId"][..],
                                &["UserID"][..],
                                &["Uid"][..],
                                &["UserName"][..],
                            ],
                        )
                    })
                })
                .collect()
        })
        .unwrap_or_default()
}

fn insert_optional_string(map: &mut Map<String, JsonValue>, key: &str, value: Option<String>) {
    if let Some(value) = value {
        map.insert(key.to_string(), json!(value));
    }
}

fn insert_optional_u64(map: &mut Map<String, JsonValue>, key: &str, value: Option<u64>) {
    if let Some(value) = value {
        map.insert(key.to_string(), json!(value));
    }
}

fn insert_optional_bool(map: &mut Map<String, JsonValue>, key: &str, value: Option<bool>) {
    if let Some(value) = value {
        map.insert(key.to_string(), json!(value));
    }
}

fn format_request_id(request_id: Option<&str>) -> String {
    request_id
        .map(|request_id| format!(" requestId={request_id}"))
        .unwrap_or_default()
}
