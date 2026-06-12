use std::sync::Arc;

use sdkwork_communication_rtc_service::{
    ProviderPluginDescriptor, RtcProviderPluginFactory, RtcProviderPort,
    RtcRecordingArtifactImportPort,
};

use crate::config::LivekitRtcProviderConfig;
use crate::open_api::LivekitRtcOpenApiExecutor;
use crate::provider::LivekitRtcProvider;

#[derive(Clone, Default)]
pub struct LivekitRtcProviderPluginFactory {
    config: LivekitRtcProviderConfig,
    open_api_executor: Option<Arc<dyn LivekitRtcOpenApiExecutor>>,
    recording_importer: Option<Arc<dyn RtcRecordingArtifactImportPort>>,
}

impl LivekitRtcProviderPluginFactory {
    pub fn new(config: LivekitRtcProviderConfig) -> Self {
        Self {
            config,
            open_api_executor: None,
            recording_importer: None,
        }
    }

    pub fn with_open_api_executor(mut self, executor: Arc<dyn LivekitRtcOpenApiExecutor>) -> Self {
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

impl RtcProviderPluginFactory for LivekitRtcProviderPluginFactory {
    fn descriptor(&self) -> ProviderPluginDescriptor {
        LivekitRtcProvider::new(self.config.clone()).descriptor()
    }

    fn create_provider(&self) -> Arc<dyn RtcProviderPort> {
        let mut provider = LivekitRtcProvider::new(self.config.clone());
        if let Some(executor) = self.open_api_executor.as_ref() {
            provider = provider.with_open_api_executor(executor.clone());
        }
        if let Some(importer) = self.recording_importer.as_ref() {
            provider = provider.with_recording_importer(importer.clone());
        }
        Arc::new(provider)
    }
}

pub fn create_livekit_rtc_provider_plugin_factory(
    config: LivekitRtcProviderConfig,
) -> LivekitRtcProviderPluginFactory {
    LivekitRtcProviderPluginFactory::new(config)
}
