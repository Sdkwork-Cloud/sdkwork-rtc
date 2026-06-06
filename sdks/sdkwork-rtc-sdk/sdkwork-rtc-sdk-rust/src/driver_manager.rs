use crate::provider_activation_catalog::get_rtc_provider_activation_by_provider_key;
use crate::provider_catalog::{get_rtc_provider_by_provider_key, OFFICIAL_RTC_PROVIDERS};
use crate::provider_selection::{
    resolve_rtc_provider_selection, RtcProviderSelection, RtcProviderSelectionRequest,
};
use crate::provider_support::{
    create_rtc_provider_support_state, RtcProviderSupport, RtcProviderSupportStateRequest,
};

pub struct RtcDriverManager;

impl RtcDriverManager {
    #[allow(non_snake_case)]
    pub fn resolveSelection(
        &self,
        request: &RtcProviderSelectionRequest,
        defaultProviderKey: Option<&str>,
    ) -> RtcProviderSelection {
        resolve_rtc_provider_selection(request, defaultProviderKey)
    }

    #[allow(non_snake_case)]
    pub fn describeProviderSupport(&self, providerKey: &str) -> RtcProviderSupport {
        let official = get_rtc_provider_by_provider_key(providerKey).is_some();
        let activation = get_rtc_provider_activation_by_provider_key(providerKey);

        create_rtc_provider_support_state(RtcProviderSupportStateRequest {
            providerKey: providerKey.to_string(),
            builtin: activation.is_some_and(|entry| entry.builtin),
            official,
            registered: activation.is_some_and(|entry| entry.runtimeBridge),
        })
    }

    #[allow(non_snake_case)]
    pub fn listProviderSupport(&self) -> Vec<RtcProviderSupport> {
        OFFICIAL_RTC_PROVIDERS
            .iter()
            .map(|entry| self.describeProviderSupport(entry.providerKey))
            .collect()
    }
}
