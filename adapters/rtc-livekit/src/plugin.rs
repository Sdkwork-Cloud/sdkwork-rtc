use std::sync::Arc;

use sdkwork_rtc_core::{ProviderPluginDescriptor, RtcProviderPluginFactory, RtcProviderPort};

use crate::config::LivekitRtcProviderConfig;
use crate::provider::LivekitRtcProvider;

#[derive(Clone, Debug)]
pub struct LivekitRtcProviderPluginFactory {
    config: LivekitRtcProviderConfig,
}

impl LivekitRtcProviderPluginFactory {
    pub fn new(config: LivekitRtcProviderConfig) -> Self {
        Self { config }
    }
}

impl RtcProviderPluginFactory for LivekitRtcProviderPluginFactory {
    fn descriptor(&self) -> ProviderPluginDescriptor {
        LivekitRtcProvider::new(self.config.clone()).descriptor()
    }

    fn create_provider(&self) -> Arc<dyn RtcProviderPort> {
        Arc::new(LivekitRtcProvider::new(self.config.clone()))
    }
}

pub fn create_livekit_rtc_provider_plugin_factory(
    config: LivekitRtcProviderConfig,
) -> LivekitRtcProviderPluginFactory {
    LivekitRtcProviderPluginFactory::new(config)
}
