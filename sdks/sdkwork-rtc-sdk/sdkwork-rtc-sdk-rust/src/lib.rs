pub mod capability_catalog;
pub mod data_source;
pub mod driver_manager;
pub mod language_workspace_catalog;
pub mod provider_activation_catalog;
pub mod provider_catalog;
pub mod provider_package_catalog;
pub mod provider_package_loader;
pub mod provider_extension_catalog;
pub mod provider_selection;
pub mod provider_support;

pub struct RtcStandardContract;

pub trait RtcProviderDriver<TNativeClient> {
    fn provider_key(&self) -> &str;
}

pub trait RtcDriverManager<TNativeClient> {
    fn resolve_driver(&self, provider_key: &str);
}

pub trait RtcDataSource<TNativeClient> {
    fn create_client(&self);
}

pub trait RtcClient<TNativeClient> {
    fn join(&self);
    fn leave(&self);
    fn publish(&self, track_id: &str);
    fn unpublish(&self, track_id: &str);
    fn mute_audio(&self, muted: bool);
    fn mute_video(&self, muted: bool);
    fn unwrap(&self) -> Option<&TNativeClient>;
}

pub trait RtcRuntimeController<TNativeClient> {
    fn join(&self);
    fn leave(&self);
    fn publish(&self, track_id: &str);
    fn unpublish(&self, track_id: &str);
    fn mute_audio(&self, muted: bool);
    fn mute_video(&self, muted: bool);
}
