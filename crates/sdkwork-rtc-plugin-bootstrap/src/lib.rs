use std::sync::Arc;

use sdkwork_communication_rtc_service::{
    RtcProviderPluginFactory, platform_default_provider_kinds,
};
use sdkwork_rtc_adapter_agora::{AgoraRtcProviderConfig, create_agora_rtc_provider_plugin_factory};
use sdkwork_rtc_adapter_aliyun::{
    AliyunRtcProviderConfig, create_aliyun_rtc_provider_plugin_factory,
};
use sdkwork_rtc_adapter_livekit::{
    LivekitRtcProviderConfig, create_livekit_rtc_provider_plugin_factory,
};
use sdkwork_rtc_adapter_tencent::{
    TencentRtcProviderConfig, create_tencent_rtc_provider_plugin_factory,
};
use sdkwork_rtc_adapter_volcengine::{
    VolcengineRtcProviderConfig, create_volcengine_rtc_provider_plugin_factory,
};
use sdkwork_rtc_service_host::{RtcProviderPluginRegistry, RtcProviderPluginRegistryError};

pub fn build_builtin_provider_registry()
-> Result<RtcProviderPluginRegistry, RtcProviderPluginRegistryError> {
    let mut registry = RtcProviderPluginRegistry::new();
    for provider_kind in platform_default_provider_kinds() {
        registry.register_provider_factory(provider_factory_for_kind(provider_kind.as_str())?)?;
    }
    Ok(registry)
}

fn provider_factory_for_kind(
    provider_kind: &str,
) -> Result<Arc<dyn RtcProviderPluginFactory>, RtcProviderPluginRegistryError> {
    let factory: Arc<dyn RtcProviderPluginFactory> = match provider_kind {
        "volcengine" => Arc::new(create_volcengine_rtc_provider_plugin_factory(
            VolcengineRtcProviderConfig::default(),
        )),
        "tencent" => Arc::new(create_tencent_rtc_provider_plugin_factory(
            TencentRtcProviderConfig::default(),
        )),
        "agora" => Arc::new(create_agora_rtc_provider_plugin_factory(
            AgoraRtcProviderConfig::default(),
        )),
        "aliyun" => Arc::new(create_aliyun_rtc_provider_plugin_factory(
            AliyunRtcProviderConfig::default(),
        )),
        "livekit" => Arc::new(create_livekit_rtc_provider_plugin_factory(
            LivekitRtcProviderConfig::default(),
        )),
        _ => {
            return Err(RtcProviderPluginRegistryError::MissingProvider {
                provider: provider_kind.to_string(),
            });
        }
    };
    Ok(factory)
}
