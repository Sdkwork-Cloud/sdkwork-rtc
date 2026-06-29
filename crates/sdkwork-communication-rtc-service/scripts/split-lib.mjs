import fs from "node:fs";
import path from "node:path";

const srcDir = path.resolve(import.meta.dirname, "../src");
const lines = fs.readFileSync(path.join(srcDir, "lib.rs.bak"), "utf8").split(/\r?\n/u);

function slice(start, end) {
  return lines.slice(start - 1, end).join("\n");
}

function write(rel, body) {
  const filePath = path.join(srcDir, rel);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${body.trimEnd()}\n`);
}

write(
  "constants.rs",
  slice(40, 100),
);

write(
  "error.rs",
  slice(102, 107),
);

write(
  "domain/room.rs",
  `${slice(109, 115)}

${slice(1127, 1136)}`,
);

write(
  "domain/session.rs",
  `${slice(117, 151)}

${slice(646, 695)}

${slice(1138, 1184)}`,
);

write(
  "domain/media.rs",
  `${slice(153, 241)}

${slice(297, 322)}`,
);

write(
  "domain/drive.rs",
  `use crate::constants::RTC_DRIVE_SPACE_TYPE;

${slice(243, 295)}`,
);

write(
  "domain/recording.rs",
  `use std::collections::BTreeMap;
use std::future::Future;
use std::pin::Pin;

use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::constants::RTC_DRIVE_SPACE_TYPE;
use crate::domain::drive::{RtcDriveReference, RtcDriveSpaceType};
use crate::domain::media::{RtcMediaKind, RtcMediaResource, RtcMediaSource};
use crate::error::RtcContractError;

${slice(697, 950)}`,
);

write(
  "domain/provider_events.rs",
  `use crate::error::RtcContractError;

${slice(952, 1042)}`,
);

write(
  "domain/workspace.rs",
  `use crate::domain::room::{RtcRoom, RtcRoomStatus};
use crate::domain::session::{RtcMediaSession, RtcMediaSessionMode, RtcMediaSessionStatus};

${slice(1186, 1236)}`,
);

write(
  "provider/descriptor.rs",
  slice(324, 443),
);

write(
  "provider/registry.rs",
  `use std::collections::BTreeMap;

use crate::constants::{
    PROVIDER_REGISTRY_INTERFACE_VERSION, RTC_PROVIDER_AGORA_OPTIONAL_CAPABILITIES,
    RTC_PROVIDER_ALIYUN_OPTIONAL_CAPABILITIES, RTC_PROVIDER_LIVEKIT_OPTIONAL_CAPABILITIES,
    RTC_PROVIDER_REQUIRED_CAPABILITIES, RTC_PROVIDER_TENCENT_OPTIONAL_CAPABILITIES,
    RTC_PROVIDER_VOLCENGINE_OPTIONAL_CAPABILITIES,
};
use crate::provider::descriptor::{
    EffectiveProviderBinding, ProviderDomain, ProviderPluginDescriptor, ProviderRegistrySnapshot,
};

${slice(445, 644)}`,
);

write(
  "provider/port.rs",
  `use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use crate::domain::provider_events::{
    RtcProviderQueryRequest, RtcProviderQueryResult, RtcProviderWebhookEvent,
    RtcProviderWebhookParseRequest,
};
use crate::domain::recording::{
    RtcRecordingArtifact, RtcRecordingArtifactExportRequest, RtcRecordingArtifactsFuture,
};
use crate::domain::session::{
    RtcCreateMediaSessionRequest, RtcParticipantCredential, RtcParticipantCredentialContext,
    RtcSessionHandle,
};
use crate::error::RtcContractError;
use crate::provider::descriptor::{ProviderHealthSnapshot, ProviderPluginDescriptor};
use crate::webhook_signature::{
    RtcProviderWebhookVerifyRequest, verify_provider_webhook_signature_hmac,
};

${slice(1044, 1125)}`,
);

write(
  "provider/schema.rs",
  `use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

${slice(1281, 1339)}`,
);

write(
  "time.rs",
  slice(1238, 1279),
);

write(
  "domain/mod.rs",
  `mod drive;
mod media;
mod provider_events;
mod recording;
mod room;
mod session;
mod workspace;

pub use drive::*;
pub use media::*;
pub use provider_events::*;
pub use recording::*;
pub use room::*;
pub use session::*;
pub use workspace::*;
`,
);

write(
  "provider/mod.rs",
  `mod descriptor;
mod port;
mod registry;
mod schema;

pub use descriptor::*;
pub use port::*;
pub use registry::*;
pub use schema::*;
`,
);

write(
  "lib.rs",
  `pub mod completion;
pub mod constants;
pub mod domain;
pub mod error;
pub mod idempotency;
pub mod list_window;
pub mod persistence;
pub mod provider;
pub mod provider_account;
pub mod provider_event;
pub mod provider_profile;
pub mod provider_route;
pub mod runtime_environment;
pub mod session_tracker;
pub mod time;
pub mod webhook_signature;

pub use completion::*;
pub use constants::*;
pub use domain::*;
pub use error::*;
pub use idempotency::*;
pub use list_window::{
    DEFAULT_LIST_PAGE_SIZE, MAX_LIST_PAGE_SIZE, RtcListWindow, RtcListWindowError,
    RtcListWindowParams, apply_list_window, matches_query_tokens,
};
pub use persistence::*;
pub use provider::*;
pub use provider_account::*;
pub use provider_event::*;
pub use provider_profile::*;
pub use provider_route::*;
pub use runtime_environment::{
    rtc_allows_in_memory_only_runtime, rtc_persistence_required,
    rtc_requires_provider_webhook_timestamp, rtc_runtime_environment,
};
pub use session_tracker::RtcActiveSessionTracker;
pub use time::*;
pub use webhook_signature::{
    RtcProviderWebhookVerifyRequest, required_signature_header, sign_hmac_sha256_payload_hex,
    strip_bearer_prefix, validate_provider_webhook_freshness, verify_hmac_sha256_payload,
    verify_livekit_webhook_signature, verify_provider_webhook_signature_hmac,
};

#[cfg(test)]
mod contract_tests {
    include!("contract_tests.rs");
}
`,
);

write(
  "contract_tests.rs",
  slice(1341, 1620).replace(/^mod tests \{\s*\n    use super::\*;\s*\n/mu, "").replace(/\n\}\s*$/u, ""),
);

console.log("split-lib.mjs wrote modular src layout");
