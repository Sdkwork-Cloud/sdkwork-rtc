use std::sync::Arc;

use sdkwork_rtc_core::{ProviderPluginDescriptor, RtcProviderPluginFactory, RtcProviderPort};

use crate::config::TencentRtcProviderConfig;
use crate::open_api::TencentRtcOpenApiExecutor;
use crate::provider::TencentRtcProvider;

#[derive(Clone, Default)]
pub struct TencentRtcProviderPluginFactory {
    config: TencentRtcProviderConfig,
    open_api_executor: Option<Arc<dyn TencentRtcOpenApiExecutor>>,
}

impl TencentRtcProviderPluginFactory {
    pub fn new(config: TencentRtcProviderConfig) -> Self {
        Self {
            config,
            open_api_executor: None,
        }
    }

    pub fn with_open_api_executor(mut self, executor: Arc<dyn TencentRtcOpenApiExecutor>) -> Self {
        self.open_api_executor = Some(executor);
        self
    }
}

impl RtcProviderPluginFactory for TencentRtcProviderPluginFactory {
    fn descriptor(&self) -> ProviderPluginDescriptor {
        TencentRtcProvider::new(self.config.clone()).descriptor()
    }

    fn create_provider(&self) -> Arc<dyn RtcProviderPort> {
        let provider = TencentRtcProvider::new(self.config.clone());
        match self.open_api_executor.as_ref() {
            Some(executor) => Arc::new(provider.with_open_api_executor(executor.clone())),
            None => Arc::new(provider),
        }
    }
}

pub fn create_tencent_rtc_provider_plugin_factory(
    config: TencentRtcProviderConfig,
) -> TencentRtcProviderPluginFactory {
    TencentRtcProviderPluginFactory::new(config)
}
