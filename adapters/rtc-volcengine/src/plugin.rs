use std::sync::Arc;

use sdkwork_rtc_core::{ProviderPluginDescriptor, RtcProviderPluginFactory, RtcProviderPort};

use crate::config::VolcengineRtcProviderConfig;
use crate::open_api::VolcengineRtcOpenApiExecutor;
use crate::provider::VolcengineRtcProvider;

#[derive(Clone, Default)]
pub struct VolcengineRtcProviderPluginFactory {
    config: VolcengineRtcProviderConfig,
    open_api_executor: Option<Arc<dyn VolcengineRtcOpenApiExecutor>>,
}

impl VolcengineRtcProviderPluginFactory {
    pub fn new(config: VolcengineRtcProviderConfig) -> Self {
        Self {
            config,
            open_api_executor: None,
        }
    }

    pub fn with_open_api_executor(
        mut self,
        executor: Arc<dyn VolcengineRtcOpenApiExecutor>,
    ) -> Self {
        self.open_api_executor = Some(executor);
        self
    }
}

impl RtcProviderPluginFactory for VolcengineRtcProviderPluginFactory {
    fn descriptor(&self) -> ProviderPluginDescriptor {
        VolcengineRtcProvider::new(self.config.clone()).descriptor()
    }

    fn create_provider(&self) -> Arc<dyn RtcProviderPort> {
        let provider = VolcengineRtcProvider::new(self.config.clone());
        match self.open_api_executor.as_ref() {
            Some(executor) => Arc::new(provider.with_open_api_executor(executor.clone())),
            None => Arc::new(provider),
        }
    }
}

pub fn create_volcengine_rtc_provider_plugin_factory(
    config: VolcengineRtcProviderConfig,
) -> VolcengineRtcProviderPluginFactory {
    VolcengineRtcProviderPluginFactory::new(config)
}
