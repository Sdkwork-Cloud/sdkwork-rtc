use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcRoomStatus {
    Active,
    Archived,
    Disabled,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RtcRoom {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub owner_user_id: String,
    pub title: String,
    pub status: RtcRoomStatus,
}
