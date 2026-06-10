use sdkwork_rtc_core::{
    RtcContractError, RtcProviderQueryKind, RtcProviderQueryRequest, RtcProviderQueryResult,
    utc_now_rfc3339_millis,
};
use serde_json::json;

use crate::config::AliyunRtcProviderConfig;

pub(crate) fn query_provider_state(
    config: &AliyunRtcProviderConfig,
    request: RtcProviderQueryRequest,
) -> Result<RtcProviderQueryResult, RtcContractError> {
    let action = aliyun_query_action(&request);
    let queried_at = utc_now_rfc3339_millis();
    let result_snapshot_json = json!({
        "provider": "aliyun",
        "action": action,
        "roomId": request.room_id,
        "rtcSessionId": request.rtc_session_id,
        "providerSessionId": request.provider_session_id,
        "region": config.region,
        "execution": "provider_executor_not_configured",
    })
    .to_string();

    Ok(RtcProviderQueryResult {
        provider: "aliyun".into(),
        provider_profile_id: request.provider_profile_id,
        query_kind: request.query_kind,
        room_id: request.room_id,
        rtc_session_id: request.rtc_session_id,
        provider_session_id: request.provider_session_id,
        status: "ready".into(),
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
        RtcProviderQueryKind::QualitySamples => "aliyun.Quality.samples.snapshot",
    }
}
