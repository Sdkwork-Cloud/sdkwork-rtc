//! Gateway assembly for sdkwork-rtc.

mod bootstrap;
mod generated;

pub use bootstrap::{
    assemble_application_router, assemble_application_router_with_service, ApplicationAssembly,
};

pub fn assembly_route_count() -> usize {
    generated::ROUTE_CRATE_COUNT
}
