use sdkwork_rtc_core::{
    RtcContractError, RtcProviderQueryRequest, RtcProviderQueryResult, utc_now_rfc3339_millis,
};
use serde_json::json;

use crate::config::TencentRtcProviderConfig;
use crate::open_api::{
    TencentRtcOpenApiExecutor, build_signed_tencent_request, request_snapshot, tencent_action,
};

pub(crate) fn query_provider_state(
    config: &TencentRtcProviderConfig,
    open_api_executor: Option<&dyn TencentRtcOpenApiExecutor>,
    request: RtcProviderQueryRequest,
) -> Result<RtcProviderQueryResult, RtcContractError> {
    let action = tencent_action(request.query_kind.clone());
    let queried_at = utc_now_rfc3339_millis();
    let (status, result_snapshot_json) = if let Some(executor) = open_api_executor {
        let provider_request =
            build_signed_tencent_request(config, &request, action, queried_at.as_str())?;
        let provider_response = executor.execute(&provider_request)?;
        (
            "synced".to_string(),
            request_snapshot(&provider_request, Some(&provider_response)),
        )
    } else {
        (
            "ready".to_string(),
            json!({
                "provider": "tencent",
                "action": action,
                "roomId": request.room_id,
                "rtcSessionId": request.rtc_session_id,
                "providerSessionId": request.provider_session_id,
                "region": config.region,
                "execution": "provider_executor_not_configured",
            })
            .to_string(),
        )
    };

    Ok(RtcProviderQueryResult {
        provider: "tencent".into(),
        provider_profile_id: request.provider_profile_id,
        query_kind: request.query_kind,
        room_id: request.room_id,
        rtc_session_id: request.rtc_session_id,
        provider_session_id: request.provider_session_id,
        status,
        raw_provider_action: action.into(),
        result_snapshot_json,
        next_cursor: request.cursor,
        queried_at,
    })
}
