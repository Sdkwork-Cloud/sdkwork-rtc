use std::sync::Arc;

use sdkwork_rtc_core::{ProviderPluginDescriptor, RtcProviderPluginFactory, RtcProviderPort};

use crate::config::AgoraRtcProviderConfig;
use crate::provider::AgoraRtcProvider;

#[derive(Clone, Debug)]
pub struct AgoraRtcProviderPluginFactory {
    config: AgoraRtcProviderConfig,
}

impl AgoraRtcProviderPluginFactory {
    pub fn new(config: AgoraRtcProviderConfig) -> Self {
        Self { config }
    }
}

impl RtcProviderPluginFactory for AgoraRtcProviderPluginFactory {
    fn descriptor(&self) -> ProviderPluginDescriptor {
        AgoraRtcProvider::new(self.config.clone()).descriptor()
    }

    fn create_provider(&self) -> Arc<dyn RtcProviderPort> {
        Arc::new(AgoraRtcProvider::new(self.config.clone()))
    }
}

pub fn create_agora_rtc_provider_plugin_factory(
    config: AgoraRtcProviderConfig,
) -> AgoraRtcProviderPluginFactory {
    AgoraRtcProviderPluginFactory::new(config)
}
