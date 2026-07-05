use axum::{
    http::{header, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use sdkwork_communication_rtc_service::{
    map_rtc_api_error_code, resolved_list_page_size, rtc_list_page_to_sdkwork_page_data,
    rtc_list_window_to_sdkwork_page_data, RtcListPage, RtcListWindowParams,
};
use sdkwork_utils_rust::{
    SdkWorkApiResponse, SdkWorkPageData, SdkWorkProblemDetail, SdkWorkResourceData,
    SDKWORK_TRACE_ID_HEADER,
};
use sdkwork_web_core::WebRequestContext;

use crate::service::RtcBackendApiError;

pub fn resolved_trace_id(web_context: &WebRequestContext) -> String {
    web_context.resolved_trace_id()
}

fn with_trace_header(mut response: Response, trace_id: &str) -> Response {
    if let Ok(value) = HeaderValue::from_str(trace_id) {
        response.headers_mut().insert(SDKWORK_TRACE_ID_HEADER, value);
    }
    response
}

pub fn api_success<T: serde::Serialize>(data: T, trace_id: &str) -> Response {
    let body = SdkWorkApiResponse::success(data, trace_id);
    with_trace_header((StatusCode::OK, Json(body)).into_response(), trace_id)
}

pub fn api_created<T: serde::Serialize>(item: T, trace_id: &str) -> Response {
    let body = SdkWorkApiResponse::success(SdkWorkResourceData { item }, trace_id);
    with_trace_header((StatusCode::CREATED, Json(body)).into_response(), trace_id)
}

pub fn api_item<T: serde::Serialize>(item: T, trace_id: &str) -> Response {
    api_success(SdkWorkResourceData { item }, trace_id)
}

pub fn api_list_page<T: serde::Serialize>(
    page: RtcListPage<T>,
    params: &RtcListWindowParams,
    trace_id: &str,
) -> Response {
    api_success(rtc_list_page_to_sdkwork_page_data(page, params), trace_id)
}

pub fn api_list_payload<T: serde::Serialize>(
    items: Vec<T>,
    next_cursor: Option<String>,
    params: &RtcListWindowParams,
    trace_id: &str,
) -> Response {
    api_list_page(
        RtcListPage {
            items,
            next_cursor,
        },
        params,
        trace_id,
    )
}

pub fn api_catalog_list<T: serde::Serialize>(items: Vec<T>, trace_id: &str) -> Response {
    let count = items.len();
    let page_data = SdkWorkPageData {
        items,
        page_info: sdkwork_utils_rust::offset_window_page_info(Some(count), None, false),
    };
    api_success(page_data, trace_id)
}

pub fn list_params_from_backend_query(
    query: &crate::service::RtcBackendListQuery,
) -> RtcListWindowParams {
    RtcListWindowParams::from(query)
}

#[derive(Debug)]
pub struct RtcBackendHandlerError {
    pub error: RtcBackendApiError,
    pub trace_id: String,
}

impl RtcBackendHandlerError {
    pub fn from_api_error(error: RtcBackendApiError, trace_id: String) -> Self {
        Self { error, trace_id }
    }
}

impl IntoResponse for RtcBackendHandlerError {
    fn into_response(self) -> Response {
        let result_code = map_rtc_api_error_code(self.error.code());
        let trace_id = self.trace_id.clone();
        let problem = SdkWorkProblemDetail::platform(
            result_code,
            self.error.message(),
            trace_id.clone(),
        );
        let status =
            StatusCode::from_u16(problem.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
        with_trace_header(
            (
                status,
                [(header::CONTENT_TYPE, "application/problem+json")],
                Json(problem),
            )
                .into_response(),
            &trace_id,
        )
    }
}

pub fn map_handler_error<T>(
    trace_id: &str,
    result: Result<T, RtcBackendApiError>,
) -> Result<T, RtcBackendHandlerError> {
    result.map_err(|error| RtcBackendHandlerError::from_api_error(error, trace_id.to_owned()))
}
