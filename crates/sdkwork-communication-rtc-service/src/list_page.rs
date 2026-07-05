use sdkwork_utils_rust::{
    cursor_list_page_data, CursorListPageParams, SdkWorkPageData, SdkWorkResultCode,
};

use crate::list_window::{RtcListWindow, RtcListWindowParams};

/// Cursor-paginated list payload shared by persistence ports and route services.
#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct RtcListPage<T> {
    pub items: Vec<T>,
    pub next_cursor: Option<String>,
}

impl<T> RtcListPage<T> {
    pub fn empty() -> Self {
        Self {
            items: Vec::new(),
            next_cursor: None,
        }
    }

    pub fn into_sdkwork_page_data(self, params: &RtcListWindowParams) -> SdkWorkPageData<T> {
        rtc_list_page_to_sdkwork_page_data(self, params)
    }
}

impl<T> From<RtcListWindow<T>> for RtcListPage<T> {
    fn from(window: RtcListWindow<T>) -> Self {
        Self {
            items: window.items,
            next_cursor: window.next_cursor,
        }
    }
}

/// Convert legacy `{ items, nextCursor }` payloads to standard `SdkWorkPageData`.
pub fn rtc_list_page_to_sdkwork_page_data<T>(
    page: RtcListPage<T>,
    params: &RtcListWindowParams,
) -> SdkWorkPageData<T> {
    let page_size = resolved_list_page_size(params);
    let has_more = page.next_cursor.is_some();
    cursor_list_page_data(page.items, page_size, page.next_cursor, has_more)
}

pub fn rtc_list_window_to_sdkwork_page_data<T>(
    window: RtcListWindow<T>,
    params: &RtcListWindowParams,
) -> SdkWorkPageData<T> {
    rtc_list_page_to_sdkwork_page_data(window.into(), params)
}

pub fn resolved_list_page_size(params: &RtcListWindowParams) -> usize {
    let page_size = params
        .page_size
        .or(params.limit)
        .map(|value| i32::try_from(value).unwrap_or(i32::MAX))
        .unwrap_or(sdkwork_utils_rust::DEFAULT_LIST_PAGE_SIZE);
    CursorListPageParams::resolve(
        Some(page_size),
        None,
        params.cursor.as_deref(),
    )
    .map(|resolved| resolved.page_size)
    .unwrap_or(sdkwork_utils_rust::DEFAULT_LIST_PAGE_SIZE as usize)
}

pub fn map_rtc_api_error_code(code: &str) -> SdkWorkResultCode {
    match code {
        "bad_request" => SdkWorkResultCode::InvalidParameter,
        "forbidden" => SdkWorkResultCode::PermissionRequired,
        "not_found" => SdkWorkResultCode::NotFound,
        "conflict" => SdkWorkResultCode::Conflict,
        "unavailable" => SdkWorkResultCode::ServiceUnavailable,
        _ => SdkWorkResultCode::InternalError,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sdkwork_utils_rust::PageMode;

    #[test]
    fn list_page_builds_cursor_page_info() {
        let page = RtcListPage {
            items: vec!["a".to_owned()],
            next_cursor: Some("1".to_owned()),
        };
        let params = RtcListWindowParams {
            page_size: Some(1),
            ..RtcListWindowParams::default()
        };
        let data = page.into_sdkwork_page_data(&params);
        assert_eq!(PageMode::Cursor, data.page_info.mode);
        assert_eq!(Some(true), data.page_info.has_more);
        assert_eq!(Some("1".to_owned()), data.page_info.next_cursor);
    }
}
