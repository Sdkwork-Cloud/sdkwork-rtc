use sdkwork_communication_rtc_service::{
    RtcContractError, RtcProviderQueryKind, RtcProviderQueryRequest, RtcProviderQueryResult,
    utc_now_rfc3339_millis,
};

use crate::config::AliyunRtcProviderConfig;
use crate::open_api::{AliyunRtcOpenApiExecutor, build_aliyun_request, request_snapshot};

pub(crate) fn query_provider_state(
    config: &AliyunRtcProviderConfig,
    open_api_executor: Option<&dyn AliyunRtcOpenApiExecutor>,
    request: RtcProviderQueryRequest,
) -> Result<RtcProviderQueryResult, RtcContractError> {
    let action = aliyun_query_action(&request);
    let queried_at = utc_now_rfc3339_millis();
    let executor = open_api_executor.ok_or_else(|| {
        RtcContractError::Unavailable(
            "aliyun active query requires a configured OpenAPI executor".to_string(),
        )
    })?;
    let provider_request = build_aliyun_request(config, &request, action);
    let provider_response = executor.execute(&provider_request)?;
    let result_snapshot_json = request_snapshot(&provider_request, Some(&provider_response));

    Ok(RtcProviderQueryResult {
        provider: "aliyun".into(),
        provider_profile_id: request.provider_profile_id,
        query_kind: request.query_kind,
        room_id: request.room_id,
        rtc_session_id: request.rtc_session_id,
        provider_session_id: request.provider_session_id,
        status: "synced".into(),
        raw_provider_action: action.into(),
        result_snapshot_json,
        next_cursor: request.cursor,
        queried_at,
    })
}

fn aliyun_query_action(request: &RtcProviderQueryRequest) -> &'static str {
    match request.query_kind {
        RtcProviderQueryKind::RoomOnlineUsers => "aliyun.channel.online-users.snapshot",
        RtcProviderQueryKind::RoomState | RtcProviderQueryKind::MediaSessionState => {
            "aliyun.channel.state.snapshot"
        }
        RtcProviderQueryKind::RecordingArtifacts => "aliyun.cloud-recording.artifacts.snapshot",
        RtcProviderQueryKind::QualitySamples => "aliyun.quality.samples.snapshot",
    }
}
