use sdkwork_communication_rtc_service::{
    list_window_sort, resolve_list_limit, resolve_list_offset, RtcListPage, RtcListWindowError,
    RtcListWindowParams,
};

pub async fn fetch_bounded_page<T, E, F, Fut>(
    params: &RtcListWindowParams,
    fetch: F,
) -> Result<RtcListPage<T>, RtcListWindowError>
where
    F: FnOnce(usize, usize, Option<&str>, &str, bool) -> Fut,
    Fut: std::future::Future<Output = Result<Vec<T>, E>>,
    E: std::fmt::Display,
{
    let limit = resolve_list_limit(params)?;
    let offset = resolve_list_offset(params, limit)?;
    let (sort_field, sort_descending) = list_window_sort(params);
    let needle = params
        .q
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());
    let mut items = fetch(offset, limit, needle, sort_field.as_str(), sort_descending)
        .await
        .map_err(|error| RtcListWindowError::bad_request(error.to_string()))?;
    let has_more = items.len() > limit;
    if has_more {
        items.truncate(limit);
    }
    let next_cursor = has_more.then(|| (offset + items.len()).to_string());
    Ok(RtcListPage { items, next_cursor })
}
