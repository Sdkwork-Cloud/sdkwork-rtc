use std::sync::Arc;

use axum::Router;
use sdkwork_iam_web_adapter::{IamDatabaseWebRequestContextResolver, build_web_framework_layer};
use sdkwork_rtc_app_context::app_context_from_web_request;
use sdkwork_web_axum::with_web_request_context;
use sdkwork_web_core::{DomainContextInjector, HttpRouteManifest, WebRequestContext};

include!(concat!(env!("OUT_DIR"), "/rtc_app_http_routes.rs"));

#[derive(Clone, Default)]
struct RtcAppContextInjector;

impl DomainContextInjector for RtcAppContextInjector {
    fn inject(&self, request: &mut axum::extract::Request, context: &WebRequestContext) {
        if let Some(app_context) = app_context_from_web_request(context) {
            request.extensions_mut().insert(app_context);
        }
    }
}

fn wrap_router_with_resolver(
    resolver: IamDatabaseWebRequestContextResolver,
    router: Router,
) -> Router {
    let layer = build_web_framework_layer(
        resolver,
        HttpRouteManifest::new(RTC_APP_HTTP_ROUTES),
        Vec::new(),
    )
    .with_domain_injector(Arc::new(RtcAppContextInjector));
    with_web_request_context(router, layer)
}

pub fn wrap_router_with_web_framework(
    resolver: IamDatabaseWebRequestContextResolver,
    router: Router,
) -> Router {
    wrap_router_with_resolver(resolver, router)
}

pub async fn wrap_router_with_web_framework_from_env(router: Router) -> Router {
    let resolver = sdkwork_iam_web_adapter::iam_database_resolver_from_env().await;
    wrap_router_with_resolver(resolver, router)
}
