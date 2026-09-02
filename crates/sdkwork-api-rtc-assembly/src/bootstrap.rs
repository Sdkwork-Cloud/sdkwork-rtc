//! Gateway bootstrap for sdkwork-rtc.
//! Multi-surface assembly merges business routers only; listeners add infra via `service_router`.
//!
//! The assembly exports the indivisible `ApiAssemblyContribution` contract
//! (API_ASSEMBLY_SPEC.md section 4); the platform cloud gateway composes the
//! contribution with its process-shared PostgreSQL pool.

use std::sync::Arc;

use axum::Router;
use sdkwork_communication_rtc_repository_sqlx::{
    connect_rtc_persistence_bootstrap_from_env, persistence_from_database_pool,
};
use sdkwork_communication_rtc_service::rtc_persistence_required;
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_rtc_plugin_bootstrap::build_builtin_provider_registry;
use sdkwork_rtc_service_host::RtcProductService;
use sdkwork_web_bootstrap::{ApiAssemblyContribution, DatabasePoolReadinessCheck, ReadinessCheck, WebModule};
use sdkwork_web_core::HttpRouteManifest;

/// Indivisible host-neutral API assembly contribution (web-bootstrap contract).
pub type ApiAssembly = ApiAssemblyContribution;

async fn connect_service_from_env() -> anyhow::Result<(RtcProductService, Option<DatabasePool>)> {
    let registry = build_builtin_provider_registry()?;
    let mut service = RtcProductService::new(registry);
    let mut database_pool = None;
    if let Some(bootstrap) = connect_rtc_persistence_bootstrap_from_env()
        .await
        .map_err(|error| anyhow::anyhow!("connect RTC persistence: {error}"))?
    {
        database_pool = bootstrap.pool;
        service = service.with_persistence(bootstrap.persistence);
    } else if rtc_persistence_required() {
        return Err(anyhow::anyhow!(
            "RTC database persistence is required when SDKWORK_RTC_ENVIRONMENT is not development, dev, local, or test"
        ));
    }
    Ok((service, database_pool))
}

/// Builds the RTC product service for the `sdkwork-rtc-reconcile` CLI without
/// startup hydration; reconciliation hydrates its own runtime state.
pub async fn assemble_reconcile_service() -> anyhow::Result<Arc<RtcProductService>> {
    let (service, _database_pool) = connect_service_from_env().await?;
    Ok(Arc::new(service))
}

async fn hydrate_service_from_persistence(service: &mut RtcProductService) -> Result<(), String> {
    let tenant_id =
        std::env::var("SDKWORK_RTC_HYDRATE_TENANT_ID").unwrap_or_else(|_| "default".into());
    let organization_id =
        std::env::var("SDKWORK_RTC_HYDRATE_ORGANIZATION_ID").unwrap_or_else(|_| "default".into());
    service
        .hydrate_from_persistence(tenant_id, organization_id)
        .await
        .map_err(|error| format!("hydrate RTC persistence: {error}"))?;
    Ok(())
}

/// Boots the RTC product service on a caller-provided shared pool.
async fn bootstrap_service_with_pool(
    pool: &DatabasePool,
) -> Result<Arc<RtcProductService>, String> {
    let registry = build_builtin_provider_registry().map_err(|error| format!("{error}"))?;
    let mut service = RtcProductService::new(registry);
    let persistence = persistence_from_database_pool(pool.clone())
        .await
        .map_err(|error| format!("connect RTC persistence: {error}"))?;
    service = service.with_persistence(persistence);
    hydrate_service_from_persistence(&mut service).await?;
    Ok(Arc::new(service))
}

fn combined_route_manifest() -> HttpRouteManifest {
    let manifests = [
        sdkwork_routes_rtc_app_api::gateway_route_manifest(),
        sdkwork_routes_rtc_backend_api::gateway_route_manifest(),
    ];
    HttpRouteManifest::from_owned_routes(
        manifests
            .into_iter()
            .flat_map(|manifest| manifest.routes().to_vec())
            .collect(),
    )
}

fn openapi_documents() -> Result<Vec<serde_json::Value>, String> {
    [
        (
            "sdkwork-rtc-app-api",
            include_str!("../../../apis/app-api/communication/sdkwork-rtc-app-api.openapi.json"),
        ),
        (
            "sdkwork-rtc-backend-api",
            include_str!(
                "../../../apis/backend-api/communication/sdkwork-rtc-backend-api.openapi.json"
            ),
        ),
    ]
    .into_iter()
    .map(|(owner, source)| {
        serde_json::from_str(source).map_err(|error| format!("invalid {owner} OpenAPI: {error}"))
    })
    .collect()
}

fn contribution_from(
    router: Router,
    readiness_check: Arc<dyn ReadinessCheck>,
) -> Result<ApiAssembly, String> {
    ApiAssemblyContribution::from_openapi_documents(
        "sdkwork-rtc",
        "SDKWork RTC API",
        router,
        combined_route_manifest(),
        openapi_documents()?,
        vec![
            Arc::new(sdkwork_routes_rtc_app_api::RtcAppContextInjector),
            Arc::new(sdkwork_routes_rtc_backend_api::RtcBackendContextInjector),
        ],
        readiness_check,
    )
}

pub async fn assemble_api_router_with_service(service: Arc<RtcProductService>) -> ApiAssembly {
    let app_router = sdkwork_routes_rtc_app_api::gateway_mount(service.clone());
    let backend_router = sdkwork_routes_rtc_backend_api::gateway_mount(service);

    contribution_from(
        Router::new().merge(app_router).merge(backend_router),
        Arc::new(sdkwork_web_bootstrap::AlwaysReady),
    )
    .expect("rtc contribution contract is valid")
}

pub async fn assemble_api_router() -> anyhow::Result<ApiAssembly> {
    let (mut service, database_pool) = connect_service_from_env().await?;
    hydrate_service_from_persistence(&mut service)
        .await
        .map_err(anyhow::Error::msg)?;
    let mut assembly = assemble_api_router_with_service(Arc::new(service)).await;
    // Readiness comes from the contribution: DB-gated when a pool was
    // connected, always-ready otherwise (matches the standalone host contract).
    assembly.readiness_check = match database_pool {
        Some(pool) => Arc::new(DatabasePoolReadinessCheck::new(pool)),
        None => Arc::new(sdkwork_web_bootstrap::AlwaysReady),
    };
    Ok(assembly)
}

/// Assemble the RTC contribution against a caller-provided database pool so the
/// platform cloud gateway can share its process-wide PostgreSQL pool.
pub async fn assemble_api_router_with_pool(pool: DatabasePool) -> Result<ApiAssembly, String> {
    let service = bootstrap_service_with_pool(&pool).await?;

    let router = Router::new()
        .merge(sdkwork_routes_rtc_app_api::gateway_mount(service.clone()))
        .merge(sdkwork_routes_rtc_backend_api::gateway_mount(service));
    contribution_from(router, Arc::new(DatabasePoolReadinessCheck::new(pool)))
}

/// Compose the RTC backend contribution on a shared pool owned by the
/// consuming host (same-origin dependency composition). Mirrors
/// `assemble_api_router_with_pool`; consumers select this entrypoint instead
/// of importing `sdkwork-routes-*` directly (API_ASSEMBLY_SPEC §3/§6.1). The
/// returned contribution is indivisible: it carries the backend router, route
/// manifest, OpenAPI authority, the `RtcBackendContextInjector` the backend
/// handlers require, and a readiness check.
pub async fn assemble_backend_api_contribution_with_pool(
    pool: DatabasePool,
) -> Result<ApiAssembly, String> {
    let service = bootstrap_service_with_pool(&pool).await?;
    let router = sdkwork_routes_rtc_backend_api::gateway_mount(service);
    let backend_openapi: serde_json::Value = serde_json::from_str(include_str!(
        "../../../apis/backend-api/communication/sdkwork-rtc-backend-api.openapi.json"
    ))
    .map_err(|error| format!("invalid sdkwork-rtc-backend-api OpenAPI: {error}"))?;
    ApiAssemblyContribution::from_openapi_documents(
        "sdkwork-rtc",
        "SDKWork RTC Backend API",
        router,
        sdkwork_routes_rtc_backend_api::gateway_route_manifest(),
        vec![backend_openapi],
        vec![Arc::new(
            sdkwork_routes_rtc_backend_api::RtcBackendContextInjector,
        )],
        Arc::new(DatabasePoolReadinessCheck::new(pool)),
    )
}

/// Canonical Web Module definition for this application
/// (API_ASSEMBLY_SPEC §4.1.1): the complete HTTP surface — every route,
/// manifest, and OpenAPI document of this owner — as one installable module.
pub async fn web_module() -> Result<WebModule, String> {
    Ok(WebModule::from_contribution(assemble_api_router().await.map_err(|error| error.to_string())?))
}

/// Same as [`web_module`] but composed on a process-shared database pool
/// (platform gateways, API_ASSEMBLY_SPEC §4.1.1).
pub async fn web_module_with_pool(pool: DatabasePool) -> Result<WebModule, String> {
    Ok(WebModule::from_contribution(assemble_api_router_with_pool(pool).await?))
}
