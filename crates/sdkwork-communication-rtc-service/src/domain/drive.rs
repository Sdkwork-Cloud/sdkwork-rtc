use serde::{Deserialize, Serialize};

use crate::constants::RTC_DRIVE_SPACE_TYPE;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RtcDriveSpaceType {
    Rtc,
}

impl RtcDriveSpaceType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Rtc => RTC_DRIVE_SPACE_TYPE,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RtcDriveReference {
    pub drive_uri: String,
    pub space_id: String,
    pub space_type: RtcDriveSpaceType,
    pub node_id: String,
    pub node_version: Option<String>,
}

impl RtcDriveReference {
    pub fn canonical_uri(space_id: &str, node_id: &str) -> String {
        format!("drive://spaces/{space_id}/nodes/{node_id}")
    }

    pub fn is_canonical(&self) -> bool {
        self.drive_uri == Self::canonical_uri(self.space_id.as_str(), self.node_id.as_str())
    }

    pub fn is_rtc_space(&self) -> bool {
        self.space_type == RtcDriveSpaceType::Rtc
    }

    pub fn rtc(
        space_id: impl Into<String>,
        node_id: impl Into<String>,
        node_version: Option<String>,
    ) -> Self {
        let space_id = space_id.into();
        let node_id = node_id.into();
        Self {
            drive_uri: Self::canonical_uri(space_id.as_str(), node_id.as_str()),
            space_id,
            space_type: RtcDriveSpaceType::Rtc,
            node_id,
            node_version,
        }
    }
}
