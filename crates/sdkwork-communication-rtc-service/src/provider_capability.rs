use crate::{
    CDN_RELAY_CAPABILITY, LIVE_AUDIENCE_CAPABILITY, LIVE_BROADCAST_CAPABILITY,
    ProviderPluginDescriptor, RtcProviderCapabilitySnapshot,
};

pub fn provider_descriptor_has_capability(
    descriptor: &ProviderPluginDescriptor,
    capability: &str,
) -> bool {
    descriptor
        .required_capabilities
        .iter()
        .any(|item| item == capability)
        || descriptor
            .optional_capabilities
            .iter()
            .any(|item| item == capability)
}

impl RtcProviderCapabilitySnapshot {
    pub fn from_plugin_descriptor(descriptor: &ProviderPluginDescriptor) -> Self {
        let live_broadcast =
            provider_descriptor_has_capability(descriptor, LIVE_BROADCAST_CAPABILITY);
        let live_audience =
            provider_descriptor_has_capability(descriptor, LIVE_AUDIENCE_CAPABILITY);
        Self {
            audio: provider_descriptor_has_capability(descriptor, "media.audio"),
            video: provider_descriptor_has_capability(descriptor, "media.video"),
            live: live_broadcast || live_audience,
            live_broadcast,
            live_audience,
            cdn_relay: provider_descriptor_has_capability(descriptor, CDN_RELAY_CAPABILITY),
            screen_share: provider_descriptor_has_capability(descriptor, "screen-share"),
            recording: provider_descriptor_has_capability(descriptor, "recording"),
            webhook: provider_descriptor_has_capability(descriptor, "provider.webhook"),
            active_query: provider_descriptor_has_capability(descriptor, "provider.active-query"),
            max_participants: None,
            supported_regions: Vec::new(),
            provider_features: serde_json::json!({
                "pluginId": descriptor.plugin_id,
                "interfaceVersion": descriptor.interface_version,
                "requiredCapabilities": descriptor.required_capabilities,
                "optionalCapabilities": descriptor.optional_capabilities,
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{ProviderDomain, ProviderPluginDescriptor};

    #[test]
    fn capability_snapshot_splits_live_and_cdn_dimensions() {
        let descriptor = ProviderPluginDescriptor::new(
            "rtc-tencent",
            ProviderDomain::Rtc,
            "tencent",
            "Tencent RTC",
        )
        .with_required_capabilities([
            "session",
            "credential",
            "provider.webhook",
            "health",
            "media.audio",
            "media.video",
            LIVE_BROADCAST_CAPABILITY,
            LIVE_AUDIENCE_CAPABILITY,
            "provider.event-normalization",
        ])
        .with_optional_capabilities([
            "recording",
            "artifact",
            "screen-share",
            CDN_RELAY_CAPABILITY,
            "provider.active-query",
        ]);
        let snapshot = RtcProviderCapabilitySnapshot::from_plugin_descriptor(&descriptor);
        assert!(snapshot.live);
        assert!(snapshot.live_broadcast);
        assert!(snapshot.live_audience);
        assert!(snapshot.cdn_relay);
    }
}
