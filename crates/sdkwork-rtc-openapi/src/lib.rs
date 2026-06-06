use std::collections::{BTreeMap, BTreeSet};

use sdkwork_rtc_api_registry::{HttpMethod, RouteProtocol};
use serde_json::{Map, Value, json};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RouteEntry {
    pub path: String,
    pub methods: Vec<HttpMethod>,
    pub protocol: RouteProtocol,
    pub websocket_subprotocols: Vec<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WebsocketRouteMetadata {
    pub path: String,
    pub subprotocols: Vec<String>,
}

pub struct OpenApiServiceSpec<'a> {
    pub title: &'a str,
    pub version: &'a str,
    pub description: &'a str,
    pub openapi_path: &'a str,
    pub docs_path: &'a str,
}

pub fn extract_routes_from_function(
    source: &str,
    fn_name: &str,
    websocket_routes: &[WebsocketRouteMetadata],
    excluded_paths: &[&str],
) -> Result<Vec<RouteEntry>, String> {
    let signature = format!("fn {fn_name}");
    let start = source
        .find(&format!("pub {signature}"))
        .or_else(|| source.find(&signature))
        .ok_or_else(|| format!("could not find function `{fn_name}`"))?;
    let relative_open_brace = source[start..]
        .find('{')
        .ok_or_else(|| format!("could not find body start for `{fn_name}`"))?;
    let open_brace = start + relative_open_brace;
    let close_brace = find_matching_delimiter(source, open_brace, '{', '}')
        .ok_or_else(|| format!("could not find body end for `{fn_name}`"))?;
    let body = &source[open_brace + 1..close_brace];

    let websocket_lookup = websocket_routes
        .iter()
        .map(|route| (route.path.as_str(), route))
        .collect::<BTreeMap<_, _>>();
    let mut routes: BTreeMap<String, BTreeSet<HttpMethod>> = BTreeMap::new();
    let mut search_from = 0usize;

    while let Some(relative_route) = body[search_from..].find(".route(") {
        let route_start = search_from + relative_route + ".route".len();
        let route_end = find_matching_delimiter(body, route_start, '(', ')')
            .ok_or_else(|| format!("unbalanced route declaration in `{fn_name}`"))?;
        let route_call = &body[route_start + 1..route_end];
        let (path, handler_expr) = split_route_call(route_call)?;
        if excluded_paths.contains(&path) {
            search_from = route_end + 1;
            continue;
        }

        let methods = extract_methods(handler_expr);
        if methods.is_empty() {
            return Err(format!("could not infer methods for route `{path}`"));
        }

        routes.entry(path.to_owned()).or_default().extend(methods);
        search_from = route_end + 1;
    }

    Ok(routes
        .into_iter()
        .map(|(path, methods)| {
            let websocket_metadata = websocket_lookup.get(path.as_str());
            RouteEntry {
                protocol: if websocket_metadata.is_some() {
                    RouteProtocol::Websocket
                } else {
                    RouteProtocol::Http
                },
                websocket_subprotocols: websocket_metadata
                    .map(|route| route.subprotocols.clone())
                    .unwrap_or_default(),
                path,
                methods: methods.into_iter().collect(),
            }
        })
        .collect())
}

pub fn build_openapi_document<TagFn, SecurityFn, SummaryFn>(
    spec: &OpenApiServiceSpec<'_>,
    routes: &[RouteEntry],
    classify_tag: TagFn,
    classify_security: SecurityFn,
    summarize_operation: SummaryFn,
) -> Value
where
    TagFn: Fn(&str, HttpMethod) -> String,
    SecurityFn: Fn(&str, HttpMethod) -> bool,
    SummaryFn: Fn(&str, HttpMethod) -> String,
{
    let mut paths = Map::new();
    let mut tags = BTreeSet::new();
    let mut has_security = false;

    for route in routes {
        let mut operations = Map::new();
        for method in &route.methods {
            let tag = classify_tag(&route.path, *method);
            let secured = classify_security(&route.path, *method);
            let summary = summarize_operation(&route.path, *method);
            let mut operation = Map::new();

            tags.insert(tag.clone());
            has_security |= secured;

            operation.insert(
                "operationId".to_owned(),
                Value::String(operation_id(&route.path, *method)),
            );
            operation.insert("summary".to_owned(), Value::String(summary));
            operation.insert("tags".to_owned(), json!([tag]));
            operation.insert(
                "responses".to_owned(),
                if route.protocol == RouteProtocol::Websocket {
                    json!({ "101": { "description": "WebSocket upgrade successful" } })
                } else {
                    json!({ "200": { "description": "Successful response" } })
                },
            );

            operation.insert(
                "security".to_owned(),
                if secured {
                    json!([{ "AuthToken": [], "AccessToken": [] }])
                } else {
                    json!([])
                },
            );

            if route.protocol == RouteProtocol::Websocket {
                operation.insert(
                    "x-sdkwork-rtc-protocol".to_owned(),
                    Value::String("websocket".to_owned()),
                );
                if !route.websocket_subprotocols.is_empty() {
                    operation.insert(
                        "x-sdkwork-rtc-websocket-subprotocols".to_owned(),
                        Value::Array(
                            route
                                .websocket_subprotocols
                                .iter()
                                .cloned()
                                .map(Value::String)
                                .collect(),
                        ),
                    );
                }
            }

            operations.insert(method_name(*method).to_owned(), Value::Object(operation));
        }

        paths.insert(route.path.clone(), Value::Object(operations));
    }

    let mut document = Map::new();
    document.insert("openapi".to_owned(), Value::String("3.1.0".to_owned()));
    document.insert(
        "info".to_owned(),
        json!({
            "title": spec.title,
            "version": spec.version,
            "description": spec.description
        }),
    );
    document.insert("servers".to_owned(), json!([{ "url": "/" }]));
    document.insert(
        "tags".to_owned(),
        Value::Array(
            tags.into_iter()
                .map(|tag| {
                    json!({
                        "name": tag,
                        "description": format!("{} operations", humanize_label(&tag))
                    })
                })
                .collect(),
        ),
    );
    document.insert("paths".to_owned(), Value::Object(paths));

    if has_security {
        document.insert(
            "components".to_owned(),
            json!({
                "securitySchemes": {
                    "AuthToken": {
                        "type": "http",
                        "scheme": "bearer",
                        "bearerFormat": "JWT"
                    },
                    "AccessToken": {
                        "type": "apiKey",
                        "in": "header",
                        "name": "Access-Token"
                    }
                }
            }),
        );
    }

    Value::Object(document)
}

pub fn render_docs_html(spec: &OpenApiServiceSpec<'_>) -> String {
    format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <style>
    body {{ margin: 0; font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background: #f7f8fa; color: #17202a; }}
    main {{ max-width: 1080px; margin: 0 auto; padding: 32px 20px 56px; }}
    header {{ border: 1px solid #d7dde5; background: #fff; border-radius: 8px; padding: 24px; }}
    h1 {{ margin: 0 0 10px; font-size: 32px; line-height: 1.15; }}
    p {{ margin: 0; color: #5d6b7a; line-height: 1.6; }}
    a {{ color: #0f5ea8; }}
    input {{ width: 100%; margin-top: 18px; padding: 11px 12px; border: 1px solid #c9d2dc; border-radius: 6px; font-size: 14px; }}
    section {{ margin-top: 18px; border: 1px solid #d7dde5; background: #fff; border-radius: 8px; padding: 18px; }}
    h2 {{ margin: 0 0 12px; font-size: 18px; text-transform: capitalize; }}
    article {{ padding: 12px 0; border-top: 1px solid #edf0f3; }}
    article:first-of-type {{ border-top: 0; }}
    code {{ font-family: "Cascadia Code", Consolas, monospace; }}
    .row {{ display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }}
    .method {{ min-width: 72px; padding: 5px 8px; border-radius: 999px; color: #fff; text-align: center; font-size: 12px; font-weight: 700; }}
    .get {{ background: #13795b; }} .post {{ background: #0b5ed7; }} .put {{ background: #6f42c1; }}
    .patch {{ background: #b58105; }} .delete {{ background: #b02a37; }} .head, .options {{ background: #495057; }}
    .summary {{ margin-top: 8px; color: #5d6b7a; }}
  </style>
</head>
<body>
  <main>
    <header>
      <p><strong>OpenAPI 3.1</strong></p>
      <h1>{title}</h1>
      <p>{description}</p>
      <p><a href="{openapi_path}" target="_blank" rel="noreferrer">Open raw OpenAPI JSON</a></p>
      <input id="search" type="search" placeholder="Search by method, path, tag, or summary">
    </header>
    <div id="content"></div>
  </main>
  <script>
    const openapiPath = {openapi_path_json};
    const contentEl = document.getElementById('content');
    const searchEl = document.getElementById('search');
    const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    function render(routes) {{
      const query = searchEl.value.trim().toLowerCase();
      const filtered = routes.filter((route) => !query || [route.method, route.path, route.tag, route.summary].join(' ').toLowerCase().includes(query));
      const groups = new Map();
      for (const route of filtered) {{
        if (!groups.has(route.tag)) groups.set(route.tag, []);
        groups.get(route.tag).push(route);
      }}
      contentEl.innerHTML = Array.from(groups.entries()).map(([tag, items]) => `
        <section>
          <h2>${{escapeHtml(tag)}}</h2>
          ${{items.map((route) => `
            <article>
              <div class="row"><span class="method ${{route.method.toLowerCase()}}">${{route.method}}</span><code>${{escapeHtml(route.path)}}</code></div>
              <div class="summary">${{escapeHtml(route.summary)}}</div>
            </article>
          `).join('')}}
        </section>
      `).join('');
    }}
    fetch(openapiPath).then((response) => response.json()).then((document) => {{
      const routes = [];
      for (const [path, operations] of Object.entries(document.paths || {{}})) {{
        for (const [method, operation] of Object.entries(operations || {{}})) {{
          routes.push({{ path, method: method.toUpperCase(), summary: operation.summary || '', tag: (operation.tags && operation.tags[0]) || 'rtc' }});
        }}
      }}
      routes.sort((left, right) => left.tag.localeCompare(right.tag) || left.path.localeCompare(right.path) || left.method.localeCompare(right.method));
      render(routes);
      searchEl.addEventListener('input', () => render(routes));
    }}).catch((error) => {{
      contentEl.innerHTML = `<section>${{escapeHtml(error.message)}}</section>`;
    }});
  </script>
</body>
</html>"#,
        title = spec.title,
        description = spec.description,
        openapi_path = spec.openapi_path,
        openapi_path_json = serde_json::to_string(spec.openapi_path).expect("json openapi path"),
    )
}

fn split_route_call(route_call: &str) -> Result<(&str, &str), String> {
    let bytes = route_call.as_bytes();
    let mut index = 0usize;

    while bytes.get(index).is_some_and(u8::is_ascii_whitespace) {
        index += 1;
    }

    if bytes.get(index) != Some(&b'"') {
        return Err("route path must start with a string literal".to_owned());
    }

    index += 1;
    let path_start = index;
    while let Some(byte) = bytes.get(index) {
        match *byte {
            b'\\' => index += 2,
            b'"' => break,
            _ => index += 1,
        }
    }
    let path_end = index;

    if bytes.get(index) != Some(&b'"') {
        return Err("route path string literal is not terminated".to_owned());
    }

    index += 1;
    while bytes.get(index).is_some_and(u8::is_ascii_whitespace) {
        index += 1;
    }

    if bytes.get(index) != Some(&b',') {
        return Err("route declaration missing comma separator".to_owned());
    }

    index += 1;
    Ok((
        &route_call[path_start..path_end],
        route_call[index..].trim(),
    ))
}

fn extract_methods(handler_expr: &str) -> BTreeSet<HttpMethod> {
    let mut methods = BTreeSet::new();

    for (needle, method) in [
        ("delete(", HttpMethod::Delete),
        ("get(", HttpMethod::Get),
        ("head(", HttpMethod::Head),
        ("options(", HttpMethod::Options),
        ("patch(", HttpMethod::Patch),
        ("post(", HttpMethod::Post),
        ("put(", HttpMethod::Put),
    ] {
        if handler_expr.contains(needle) {
            methods.insert(method);
        }
    }

    methods
}

fn find_matching_delimiter(
    source: &str,
    open_index: usize,
    open: char,
    close: char,
) -> Option<usize> {
    let mut depth = 0usize;
    let mut in_string = false;
    let mut escaped = false;

    for (offset, ch) in source[open_index..].char_indices() {
        let index = open_index + offset;

        if in_string {
            if escaped {
                escaped = false;
                continue;
            }

            match ch {
                '\\' => escaped = true,
                '"' => in_string = false,
                _ => {}
            }
            continue;
        }

        match ch {
            '"' => in_string = true,
            ch if ch == open => depth += 1,
            ch if ch == close => {
                depth = depth.saturating_sub(1);
                if depth == 0 {
                    return Some(index);
                }
            }
            _ => {}
        }
    }

    None
}

fn method_name(method: HttpMethod) -> &'static str {
    match method {
        HttpMethod::Delete => "delete",
        HttpMethod::Get => "get",
        HttpMethod::Head => "head",
        HttpMethod::Options => "options",
        HttpMethod::Patch => "patch",
        HttpMethod::Post => "post",
        HttpMethod::Put => "put",
    }
}

fn operation_id(path: &str, method: HttpMethod) -> String {
    let mut resources = operation_resource_segments(path);
    let action = operation_action(
        &mut resources,
        method,
        path_contains_parameter(path),
        path_ends_with_parameter(path),
    );
    if resources.is_empty() {
        resources.push("resource".to_owned());
    }
    format!("{}.{}", resources.join("."), action)
}

fn operation_resource_segments(path: &str) -> Vec<String> {
    let raw_segments = path
        .trim_matches('/')
        .split('/')
        .filter(|segment| !segment.is_empty())
        .collect::<Vec<_>>();
    strip_api_prefix(raw_segments)
        .into_iter()
        .filter(|segment| !is_path_parameter(segment))
        .map(to_lower_camel_segment)
        .filter(|segment| !segment.is_empty())
        .collect::<Vec<_>>()
}

fn strip_api_prefix(segments: Vec<&str>) -> Vec<&str> {
    if segments.len() >= 3
        && matches!(segments[0], "rtc" | "im" | "app" | "backend")
        && segments[1] == "v3"
        && segments[2] == "api"
    {
        segments[3..].to_vec()
    } else {
        segments
    }
}

fn is_path_parameter(segment: &str) -> bool {
    segment.starts_with('{') && segment.ends_with('}')
}

fn path_ends_with_parameter(path: &str) -> bool {
    path.trim_matches('/')
        .split('/')
        .next_back()
        .is_some_and(is_path_parameter)
}

fn path_contains_parameter(path: &str) -> bool {
    path.trim_matches('/').split('/').any(is_path_parameter)
}

fn looks_like_collection_resource(segment: &str) -> bool {
    segment.ends_with('s') || segment.ends_with("List")
}

fn to_lower_camel_segment(value: &str) -> String {
    let mut output = String::new();
    let mut uppercase_next = false;

    for ch in value.chars() {
        if ch.is_ascii_alphanumeric() {
            if output.is_empty() {
                output.push(ch.to_ascii_lowercase());
                uppercase_next = false;
            } else if uppercase_next {
                output.push(ch.to_ascii_uppercase());
                uppercase_next = false;
            } else {
                output.push(ch.to_ascii_lowercase());
            }
        } else {
            uppercase_next = !output.is_empty();
        }
    }

    output
}

fn operation_action(
    resources: &mut Vec<String>,
    method: HttpMethod,
    contains_parameter: bool,
    ends_with_parameter: bool,
) -> String {
    let command_suffixes = [
        "accept", "activate", "apply", "cancel", "close", "connect", "decline", "disconnect",
        "end", "invite", "publish", "refresh", "reject", "resume", "start", "stop", "sync",
        "unpublish",
    ];

    match method {
        HttpMethod::Get => {
            if ends_with_parameter
                || (contains_parameter
                    && resources
                        .last()
                        .is_some_and(|segment| !looks_like_collection_resource(segment)))
            {
                "retrieve".to_owned()
            } else {
                "list".to_owned()
            }
        }
        HttpMethod::Post => {
            if resources
                .last()
                .is_some_and(|segment| command_suffixes.contains(&segment.as_str()))
            {
                resources.pop().unwrap_or_else(|| "create".to_owned())
            } else {
                "create".to_owned()
            }
        }
        HttpMethod::Put | HttpMethod::Patch => "update".to_owned(),
        HttpMethod::Delete => "delete".to_owned(),
        HttpMethod::Options => "options".to_owned(),
        HttpMethod::Head => "head".to_owned(),
    }
}

fn humanize_label(value: &str) -> String {
    value
        .replace(['_', '-'], " ")
        .split_whitespace()
        .map(|segment| {
            let mut chars = segment.chars();
            match chars.next() {
                Some(first) => format!("{}{}", first.to_ascii_uppercase(), chars.as_str()),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}
