use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderRoute {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub provider_profile_id: String,
    pub route_type: String,
    pub region: Option<String>,
    pub priority: i32,
    pub status: RtcProviderRouteStatus,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcProviderRouteStatus {
    Active,
    Disabled,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcProviderRouteCommand {
    pub provider_profile_id: String,
    pub route_type: String,
    pub region: Option<String>,
    pub priority: i32,
    pub status: Option<RtcProviderRouteStatus>,
}
