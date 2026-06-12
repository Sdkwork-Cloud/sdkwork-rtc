use std::sync::Arc;

use sdkwork_communication_rtc_service::{
    ProviderPluginDescriptor, RtcProviderPluginFactory, RtcProviderPort,
    RtcRecordingArtifactImportPort,
};

use crate::config::AliyunRtcProviderConfig;
use crate::open_api::AliyunRtcOpenApiExecutor;
use crate::provider::AliyunRtcProvider;

#[derive(Clone, Default)]
pub struct AliyunRtcProviderPluginFactory {
    config: AliyunRtcProviderConfig,
    open_api_executor: Option<Arc<dyn AliyunRtcOpenApiExecutor>>,
    recording_importer: Option<Arc<dyn RtcRecordingArtifactImportPort>>,
}

impl AliyunRtcProviderPluginFactory {
    pub fn new(config: AliyunRtcProviderConfig) -> Self {
        Self {
            config,
            open_api_executor: None,
            recording_importer: None,
        }
    }

    pub fn with_open_api_executor(mut self, executor: Arc<dyn AliyunRtcOpenApiExecutor>) -> Self {
        self.open_api_executor = Some(executor);
        self
    }

    pub fn with_recording_importer(
        mut self,
        importer: Arc<dyn RtcRecordingArtifactImportPort>,
    ) -> Self {
        self.recording_importer = Some(importer);
        self
    }
}

impl RtcProviderPluginFactory for AliyunRtcProviderPluginFactory {
    fn descriptor(&self) -> ProviderPluginDescriptor {
        AliyunRtcProvider::new(self.config.clone()).descriptor()
    }

    fn create_provider(&self) -> Arc<dyn RtcProviderPort> {
        let mut provider = AliyunRtcProvider::new(self.config.clone());
        if let Some(executor) = self.open_api_executor.as_ref() {
            provider = provider.with_open_api_executor(executor.clone());
        }
        if let Some(importer) = self.recording_importer.as_ref() {
            provider = provider.with_recording_importer(importer.clone());
        }
        Arc::new(provider)
    }
}

pub fn create_aliyun_rtc_provider_plugin_factory(
    config: AliyunRtcProviderConfig,
) -> AliyunRtcProviderPluginFactory {
    AliyunRtcProviderPluginFactory::new(config)
}
