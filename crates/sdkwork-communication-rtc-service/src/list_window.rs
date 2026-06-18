pub const DEFAULT_LIST_PAGE_SIZE: u32 = 20;
pub const MAX_LIST_PAGE_SIZE: u32 = 200;

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct RtcListWindowParams {
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub cursor: Option<String>,
    pub limit: Option<u32>,
    pub q: Option<String>,
    pub sort: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RtcListWindow<T> {
    pub items: Vec<T>,
    pub next_cursor: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RtcListWindowError {
    message: String,
}

impl RtcListWindowError {
    pub fn bad_request(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

impl std::fmt::Display for RtcListWindowError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}", self.message)
    }
}

impl std::error::Error for RtcListWindowError {}

pub fn matches_query_tokens(values: &[&str], query: &str) -> bool {
    let needle = query.trim().to_ascii_lowercase();
    if needle.is_empty() {
        return true;
    }
    values
        .iter()
        .any(|value| value.to_ascii_lowercase().contains(needle.as_str()))
}

pub fn apply_list_window<T>(
    mut items: Vec<T>,
    params: &RtcListWindowParams,
    searchable: impl Fn(&T) -> Vec<String>,
    sortable: impl Fn(&T, &str) -> String,
) -> Result<RtcListWindow<T>, RtcListWindowError> {
    if let Some(query) = params
        .q
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        items.retain(|item| {
            let values = searchable(item);
            matches_query_tokens(
                &values.iter().map(String::as_str).collect::<Vec<_>>(),
                query,
            )
        });
    }

    let (sort_field, descending) = parse_sort(params.sort.as_deref());
    items.sort_by(|left, right| {
        let ordering =
            sortable(left, sort_field.as_str()).cmp(&sortable(right, sort_field.as_str()));
        if descending {
            ordering.reverse()
        } else {
            ordering
        }
    });

    let limit = resolve_list_limit(params)?;
    let offset = resolve_list_offset(params, limit)?;
    if offset > items.len() {
        return Ok(RtcListWindow {
            items: Vec::new(),
            next_cursor: None,
        });
    }

    let mut window = items
        .into_iter()
        .skip(offset)
        .take(limit + 1)
        .collect::<Vec<_>>();
    let has_more = window.len() > limit;
    if has_more {
        window.truncate(limit);
    }
    let next_cursor = has_more.then(|| (offset + window.len()).to_string());

    Ok(RtcListWindow {
        items: window,
        next_cursor,
    })
}

fn resolve_list_limit(params: &RtcListWindowParams) -> Result<usize, RtcListWindowError> {
    let requested = params
        .limit
        .or(params.page_size)
        .unwrap_or(DEFAULT_LIST_PAGE_SIZE);
    if requested == 0 {
        return Err(RtcListWindowError::bad_request(
            "list page_size must be greater than zero",
        ));
    }
    Ok(requested.min(MAX_LIST_PAGE_SIZE) as usize)
}

fn resolve_list_offset(
    params: &RtcListWindowParams,
    limit: usize,
) -> Result<usize, RtcListWindowError> {
    if let Some(cursor) = params
        .cursor
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        return parse_list_cursor(cursor);
    }

    let page = params.page.unwrap_or(1);
    if page == 0 {
        return Err(RtcListWindowError::bad_request(
            "list page must be greater than zero",
        ));
    }
    Ok(((page - 1) as usize).saturating_mul(limit))
}

fn parse_list_cursor(cursor: &str) -> Result<usize, RtcListWindowError> {
    cursor
        .parse::<usize>()
        .map_err(|_| RtcListWindowError::bad_request(format!("invalid list cursor: {cursor}")))
}

fn parse_sort(sort: Option<&str>) -> (String, bool) {
    let Some(sort) = sort.map(str::trim).filter(|value| !value.is_empty()) else {
        return ("id".to_string(), false);
    };
    if let Some(field) = sort.strip_prefix('-') {
        return (field.to_string(), true);
    }
    (sort.to_string(), false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(Clone, Debug, Eq, PartialEq)]
    struct Item {
        id: String,
        title: String,
    }

    fn sample_items() -> Vec<Item> {
        vec![
            Item {
                id: "room-1".to_string(),
                title: "Alpha".to_string(),
            },
            Item {
                id: "room-2".to_string(),
                title: "Beta".to_string(),
            },
            Item {
                id: "room-3".to_string(),
                title: "Gamma".to_string(),
            },
        ]
    }

    fn window(
        items: Vec<Item>,
        params: RtcListWindowParams,
    ) -> Result<RtcListWindow<Item>, RtcListWindowError> {
        apply_list_window(
            items,
            &params,
            |item| vec![item.id.clone(), item.title.clone()],
            |item, field| match field {
                "title" => item.title.clone(),
                _ => item.id.clone(),
            },
        )
    }

    #[test]
    fn paginates_by_page_and_page_size() {
        let result = window(
            sample_items(),
            RtcListWindowParams {
                page: Some(2),
                page_size: Some(1),
                ..RtcListWindowParams::default()
            },
        )
        .expect("paginate");

        assert_eq!(result.items.len(), 1);
        assert_eq!(result.items[0].id, "room-2");
        assert_eq!(result.next_cursor.as_deref(), Some("2"));
    }

    #[test]
    fn paginates_last_page_without_next_cursor() {
        let result = window(
            sample_items(),
            RtcListWindowParams {
                page: Some(3),
                page_size: Some(1),
                ..RtcListWindowParams::default()
            },
        )
        .expect("paginate");

        assert_eq!(result.items[0].id, "room-3");
        assert_eq!(result.next_cursor, None);
    }

    #[test]
    fn paginates_by_cursor() {
        let result = window(
            sample_items(),
            RtcListWindowParams {
                cursor: Some("1".to_string()),
                limit: Some(1),
                ..RtcListWindowParams::default()
            },
        )
        .expect("paginate");

        assert_eq!(result.items[0].id, "room-2");
        assert_eq!(result.next_cursor.as_deref(), Some("2"));
    }

    #[test]
    fn filters_by_query_and_sorts_descending() {
        let result = window(
            sample_items(),
            RtcListWindowParams {
                q: Some("room".to_string()),
                sort: Some("-title".to_string()),
                ..RtcListWindowParams::default()
            },
        )
        .expect("filter");

        assert_eq!(
            result
                .items
                .iter()
                .map(|item| item.title.as_str())
                .collect::<Vec<_>>(),
            vec!["Gamma", "Beta", "Alpha"]
        );
    }

    #[test]
    fn rejects_invalid_cursor() {
        let error = window(
            sample_items(),
            RtcListWindowParams {
                cursor: Some("bad".to_string()),
                ..RtcListWindowParams::default()
            },
        )
        .expect_err("invalid cursor");

        assert!(error.to_string().contains("invalid list cursor"));
    }
}
