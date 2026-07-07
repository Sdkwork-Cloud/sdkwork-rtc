use sdkwork_communication_rtc_service::{
    RtcCdnRelayHandle, RtcCdnRelayMode, RtcCdnRelayStartRequest, RtcCdnRelayStopRequest,
    RtcContractError, RtcLiveAudiencePlayback, RtcLiveAudiencePlaybackRequest,
    format_cdn_relay_provider_session_id, require_signed_provider_configuration,
    utc_now_rfc3339_millis,
};
use serde_json::{Map, Value as JsonValue, json};

use crate::config::TencentRtcProviderConfig;
use crate::open_api::{
    TencentRtcOpenApiExecutor, build_signed_tencent_action_request, request_snapshot,
};

pub(crate) fn start_cdn_relay(
    config: &TencentRtcProviderConfig,
    open_api_executor: Option<&dyn TencentRtcOpenApiExecutor>,
    request: RtcCdnRelayStartRequest,
) -> Result<RtcCdnRelayHandle, RtcContractError> {
    let Some(executor) = open_api_executor else {
        require_signed_provider_configuration(false, "CDN relay start")?;
        return Ok(development_cdn_relay_handle(&request));
    };
    if config.secret_id.is_none() || config.secret_key.is_none() {
        require_signed_provider_configuration(false, "CDN relay start")?;
        return Ok(development_cdn_relay_handle(&request));
    }

    let signed_at = utc_now_rfc3339_millis();
    let body = start_cdn_relay_body(config, &request)?;
    let provider_request = build_signed_tencent_action_request(
        config,
        "StartPublishCdnStream",
        body.as_str(),
        signed_at.as_str(),
    )?;
    let provider_response = executor.execute(&provider_request)?;
    let provider_body = parse_provider_response(&provider_response)?;
    let relay_id = provider_body
        .pointer("/Response/TaskId")
        .and_then(JsonValue::as_str)
        .map(str::to_string)
        .unwrap_or_else(|| format!("tencent-cdn:{}", request.rtc_session_id));
    let push_url = provider_body
        .pointer("/Response/PublishCdnUrl")
        .and_then(JsonValue::as_str)
        .map(str::to_string);
    let pull_url = provider_body
        .pointer("/Response/PlayUrl")
        .and_then(JsonValue::as_str)
        .map(str::to_string)
        .or_else(|| push_url.clone());
    let provider_snapshot_json = Some(request_snapshot(
        &provider_request,
        Some(&provider_response),
        Some(json!({
            "relayId": relay_id,
            "mode": request.mode,
            "pushUrl": push_url,
            "pullUrl": pull_url,
        })),
    ));

    Ok(RtcCdnRelayHandle {
        relay_id,
        push_url,
        pull_url,
        provider_snapshot_json,
    })
}

pub(crate) fn stop_cdn_relay(
    config: &TencentRtcProviderConfig,
    open_api_executor: Option<&dyn TencentRtcOpenApiExecutor>,
    request: RtcCdnRelayStopRequest,
) -> Result<bool, RtcContractError> {
    let Some(executor) = open_api_executor else {
        require_signed_provider_configuration(false, "CDN relay stop")?;
        return Ok(true);
    };
    if config.secret_id.is_none() || config.secret_key.is_none() {
        require_signed_provider_configuration(false, "CDN relay stop")?;
        return Ok(true);
    }

    let signed_at = utc_now_rfc3339_millis();
    let body = stop_cdn_relay_body(config, &request)?;
    let provider_request = build_signed_tencent_action_request(
        config,
        "StopPublishCdnStream",
        body.as_str(),
        signed_at.as_str(),
    )?;
    let provider_response = executor.execute(&provider_request)?;
    parse_provider_response(&provider_response)?;
    Ok(true)
}

pub(crate) fn resolve_live_audience_playback(
    config: &TencentRtcProviderConfig,
    request: RtcLiveAudiencePlaybackRequest,
) -> Result<RtcLiveAudiencePlayback, RtcContractError> {
    let session_id = format_cdn_relay_provider_session_id("tencent", request.rtc_session_id.as_str());
    let playback_url = format!(
        "{}/live/{}",
        config.access_endpoint.trim_end_matches("/session"),
        session_id
    );
    Ok(RtcLiveAudiencePlayback {
        playback_url,
        expires_at: None,
    })
}

fn development_cdn_relay_handle(request: &RtcCdnRelayStartRequest) -> RtcCdnRelayHandle {
    let relay_id = format!("tencent-cdn-dev:{}", request.rtc_session_id);
    let push_url = (request.mode == RtcCdnRelayMode::Push).then(|| {
        format!(
            "rtmp://cdn.tencent.local/push/{}",
            request.stream_id.as_deref().unwrap_or(request.rtc_session_id.as_str())
        )
    });
    let pull_url = match request.mode {
        RtcCdnRelayMode::Pull | RtcCdnRelayMode::Push => Some(format!(
            "https://cdn.tencent.local/play/{}",
            request.stream_id.as_deref().unwrap_or(request.rtc_session_id.as_str())
        )),
    };
    RtcCdnRelayHandle {
        relay_id,
        push_url,
        pull_url,
        provider_snapshot_json: Some(json!({
            "mode": "development-placeholder",
            "cdnRelayMode": request.mode,
        }).to_string()),
    }
}

fn start_cdn_relay_body(
    config: &TencentRtcProviderConfig,
    request: &RtcCdnRelayStartRequest,
) -> Result<String, RtcContractError> {
    let mut body = Map::new();
    if let Some(sdk_app_id) = config.sdk_app_id.as_deref().filter(|value| !value.is_empty()) {
        body.insert("SdkAppId".into(), parse_sdk_app_id(sdk_app_id)?);
    }
    body.insert(
        "RoomId".into(),
        JsonValue::String(request.rtc_session_id.clone()),
    );
    if let Some(stream_id) = request
        .stream_id
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        body.insert("StreamId".into(), JsonValue::String(stream_id.into()));
    }
    if let Some(region) = request
        .region
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        body.insert("Region".into(), JsonValue::String(region.into()));
    }
    serde_json::to_string(&JsonValue::Object(body)).map_err(|error| {
        RtcContractError::Conflict(format!("failed to encode tencent cdn relay body: {error}"))
    })
}

fn stop_cdn_relay_body(
    config: &TencentRtcProviderConfig,
    request: &RtcCdnRelayStopRequest,
) -> Result<String, RtcContractError> {
    let mut body = Map::new();
    if let Some(sdk_app_id) = config.sdk_app_id.as_deref().filter(|value| !value.is_empty()) {
        body.insert("SdkAppId".into(), parse_sdk_app_id(sdk_app_id)?);
    }
    body.insert("TaskId".into(), JsonValue::String(request.relay_id.clone()));
    serde_json::to_string(&JsonValue::Object(body)).map_err(|error| {
        RtcContractError::Conflict(format!("failed to encode tencent cdn relay stop body: {error}"))
    })
}

fn parse_sdk_app_id(value: &str) -> Result<JsonValue, RtcContractError> {
    let parsed = value.parse::<u64>().map_err(|error| {
        RtcContractError::Conflict(format!("invalid tencent SDKAppId {value}: {error}"))
    })?;
    Ok(JsonValue::Number(parsed.into()))
}

fn parse_provider_response(
    response: &crate::open_api::TencentRtcOpenApiResponse,
) -> Result<JsonValue, RtcContractError> {
    let parsed = serde_json::from_str::<JsonValue>(response.body.as_str());
    if !(200..300).contains(&response.status_code) {
        return Err(RtcContractError::Unavailable(format!(
            "tencent cdn relay returned HTTP {}",
            response.status_code
        )));
    }
    let body = parsed.map_err(|error| {
        RtcContractError::Unavailable(format!(
            "failed to parse tencent cdn relay response JSON: {error}"
        ))
    })?;
    if let Some(error) = body.pointer("/Response/Error/Code").and_then(JsonValue::as_str) {
        let message = body
            .pointer("/Response/Error/Message")
            .and_then(JsonValue::as_str)
            .unwrap_or("unknown");
        return Err(RtcContractError::Unavailable(format!(
            "tencent cdn relay failed with provider error {error}: {message}"
        )));
    }
    Ok(body)
}
