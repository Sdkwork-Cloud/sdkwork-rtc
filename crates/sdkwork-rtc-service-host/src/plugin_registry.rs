use std::collections::BTreeMap;
use std::fmt;
use std::sync::Arc;

use sdkwork_communication_rtc_service::{
    ProviderPluginDescriptor, RtcProviderPluginFactory, RtcProviderPort,
};

use crate::resilient_provider::wrap_provider_with_timeout;

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum RtcProviderPluginRegistryError {
    DuplicateProvider {
        provider: String,
    },
    ProviderDescriptorMismatch {
        factory_plugin_id: String,
        provider_plugin_id: String,
    },
    MissingProvider {
        provider: String,
    },
    MissingDefaultProvider,
}

impl fmt::Display for RtcProviderPluginRegistryError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::DuplicateProvider { provider } => {
                write!(
                    formatter,
                    "RTC provider plugin is already registered: {provider}"
                )
            }
            Self::ProviderDescriptorMismatch {
                factory_plugin_id,
                provider_plugin_id,
            } => {
                write!(
                    formatter,
                    "RTC provider plugin factory descriptor {factory_plugin_id} does not match created provider descriptor {provider_plugin_id}"
                )
            }
            Self::MissingProvider { provider } => {
                write!(
                    formatter,
                    "RTC provider plugin is not registered: {provider}"
                )
            }
            Self::MissingDefaultProvider => {
                write!(
                    formatter,
                    "RTC provider plugin registry has no default provider"
                )
            }
        }
    }
}

impl std::error::Error for RtcProviderPluginRegistryError {}

#[derive(Clone, Default)]
pub struct RtcProviderPluginRegistry {
    providers: BTreeMap<String, Arc<dyn RtcProviderPort>>,
    descriptors: BTreeMap<String, ProviderPluginDescriptor>,
    default_provider: Option<String>,
}

impl RtcProviderPluginRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_provider(
        mut self,
        provider: Arc<dyn RtcProviderPort>,
    ) -> Result<Self, RtcProviderPluginRegistryError> {
        self.register_provider(provider)?;
        Ok(self)
    }

    pub fn with_provider_factory(
        mut self,
        factory: Arc<dyn RtcProviderPluginFactory>,
    ) -> Result<Self, RtcProviderPluginRegistryError> {
        self.register_provider_factory(factory)?;
        Ok(self)
    }

    pub fn register_provider_factory(
        &mut self,
        factory: Arc<dyn RtcProviderPluginFactory>,
    ) -> Result<(), RtcProviderPluginRegistryError> {
        let factory_descriptor = factory.descriptor();
        let provider = factory.create_provider();
        let provider_descriptor = provider.descriptor();
        if factory_descriptor != provider_descriptor {
            return Err(RtcProviderPluginRegistryError::ProviderDescriptorMismatch {
                factory_plugin_id: factory_descriptor.plugin_id,
                provider_plugin_id: provider_descriptor.plugin_id,
            });
        }
        self.register_provider(provider)
    }

    pub fn register_provider(
        &mut self,
        provider: Arc<dyn RtcProviderPort>,
    ) -> Result<(), RtcProviderPluginRegistryError> {
        let descriptor = provider.descriptor();
        let provider_key = descriptor.provider_kind.clone();
        if self.providers.contains_key(provider_key.as_str()) {
            return Err(RtcProviderPluginRegistryError::DuplicateProvider {
                provider: provider_key,
            });
        }

        if descriptor.default_selected || self.default_provider.is_none() {
            self.default_provider = Some(provider_key.clone());
        }

        self.descriptors.insert(provider_key.clone(), descriptor);
        self.providers
            .insert(provider_key, wrap_provider_with_timeout(provider));
        Ok(())
    }

    pub fn provider(
        &self,
        provider: &str,
    ) -> Result<Arc<dyn RtcProviderPort>, RtcProviderPluginRegistryError> {
        self.providers.get(provider).cloned().ok_or_else(|| {
            RtcProviderPluginRegistryError::MissingProvider {
                provider: provider.to_string(),
            }
        })
    }

    pub fn default_provider(
        &self,
    ) -> Result<Arc<dyn RtcProviderPort>, RtcProviderPluginRegistryError> {
        let provider = self
            .default_provider
            .as_deref()
            .ok_or(RtcProviderPluginRegistryError::MissingDefaultProvider)?;
        self.provider(provider)
    }

    pub fn default_provider_key(&self) -> Option<&str> {
        self.default_provider.as_deref()
    }

    pub fn descriptor(&self, provider: &str) -> Option<&ProviderPluginDescriptor> {
        self.descriptors.get(provider)
    }

    pub fn descriptors(&self) -> Vec<ProviderPluginDescriptor> {
        self.descriptors.values().cloned().collect()
    }
}
