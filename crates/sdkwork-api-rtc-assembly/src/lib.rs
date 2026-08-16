//! API assembly for sdkwork-rtc.
//! Application bootstrap lives in `bootstrap.rs`; route inventory is in `assembly-manifest.json`.
//! SDKWORK-ASSEMBLY-LIB-CUSTOM: exports beyond the canonical materializer template.

mod bootstrap;
mod generated;

pub use bootstrap::{
    ApiAssembly, assemble_api_router, assemble_api_router_with_pool,
    assemble_api_router_with_service, assemble_backend_api_contribution_with_pool,
    assemble_reconcile_service,
};

pub fn assembly_route_count() -> usize {
    generated::ROUTE_CRATE_COUNT
}
