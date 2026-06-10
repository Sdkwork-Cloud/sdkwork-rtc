use std::sync::Arc;

use sdkwork_rtc_core::{ProviderPluginDescriptor, RtcProviderPluginFactory, RtcProviderPort};

use crate::config::AliyunRtcProviderConfig;
use crate::provider::AliyunRtcProvider;

#[derive(Clone, Debug)]
pub struct AliyunRtcProviderPluginFactory {
    config: AliyunRtcProviderConfig,
}

impl AliyunRtcProviderPluginFactory {
    pub fn new(config: AliyunRtcProviderConfig) -> Self {
        Self { config }
    }
}

impl RtcProviderPluginFactory for AliyunRtcProviderPluginFactory {
    fn descriptor(&self) -> ProviderPluginDescriptor {
        AliyunRtcProvider::new(self.config.clone()).descriptor()
    }

    fn create_provider(&self) -> Arc<dyn RtcProviderPort> {
        Arc::new(AliyunRtcProvider::new(self.config.clone()))
    }
}

pub fn create_aliyun_rtc_provider_plugin_factory(
    config: AliyunRtcProviderConfig,
) -> AliyunRtcProviderPluginFactory {
    AliyunRtcProviderPluginFactory::new(config)
}
