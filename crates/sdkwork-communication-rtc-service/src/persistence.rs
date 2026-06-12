use std::error::Error;
use std::fmt;
use std::future::Future;
use std::pin::Pin;

use crate::{
    RtcMediaArtifact, RtcMediaParticipant, RtcMediaSession, RtcMediaSessionCompletionRecord,
    RtcMediaTrack, RtcProviderAccount, RtcProviderApplication, RtcProviderCredential,
    RtcProviderProfile, RtcProviderQueryJobRecord, RtcProviderQuerySnapshotRecord,
    RtcProviderRoute, RtcProviderWebhookEventRecord, RtcQualitySample, RtcRoom,
};

pub type RtcPersistenceResult<T> = Result<T, RtcPersistenceError>;

pub type RtcPersistenceFuture<'a, T> =
    Pin<Box<dyn Future<Output = RtcPersistenceResult<T>> + Send + 'a>>;

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct RtcPersistenceChangeSet {
    pub rooms: Vec<RtcRoom>,
    pub media_sessions: Vec<RtcMediaSession>,
    pub media_participants: Vec<RtcMediaParticipant>,
    pub media_tracks: Vec<RtcMediaTrack>,
    pub media_artifacts: Vec<RtcMediaArtifact>,
    pub quality_samples: Vec<RtcQualitySample>,
    pub completion_records: Vec<RtcMediaSessionCompletionRecord>,
    pub provider_accounts: Vec<RtcProviderAccount>,
    pub provider_applications: Vec<RtcProviderApplication>,
    pub provider_credentials: Vec<RtcProviderCredential>,
    pub provider_profiles: Vec<RtcProviderProfile>,
    pub provider_routes: Vec<RtcProviderRoute>,
    pub webhook_events: Vec<RtcProviderWebhookEventRecord>,
    pub provider_query_jobs: Vec<RtcProviderQueryJobRecord>,
    pub provider_query_snapshots: Vec<RtcProviderQuerySnapshotRecord>,
}

impl RtcPersistenceChangeSet {
    pub fn is_empty(&self) -> bool {
        self.rooms.is_empty()
            && self.media_sessions.is_empty()
            && self.media_participants.is_empty()
            && self.media_tracks.is_empty()
            && self.media_artifacts.is_empty()
            && self.quality_samples.is_empty()
            && self.completion_records.is_empty()
            && self.provider_accounts.is_empty()
            && self.provider_applications.is_empty()
            && self.provider_credentials.is_empty()
            && self.provider_profiles.is_empty()
            && self.provider_routes.is_empty()
            && self.webhook_events.is_empty()
            && self.provider_query_jobs.is_empty()
            && self.provider_query_snapshots.is_empty()
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RtcPersistenceError {
    Conflict(String),
    Unavailable(String),
}

impl fmt::Display for RtcPersistenceError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Conflict(message) => write!(formatter, "{message}"),
            Self::Unavailable(message) => write!(formatter, "{message}"),
        }
    }
}

impl Error for RtcPersistenceError {}

pub trait RtcPersistencePort: Send + Sync {
    fn persist_changes<'a>(
        &'a self,
        changes: RtcPersistenceChangeSet,
    ) -> RtcPersistenceFuture<'a, ()>;
}

#[derive(Clone, Debug, Default)]
pub struct NoopRtcPersistencePort;

impl RtcPersistencePort for NoopRtcPersistencePort {
    fn persist_changes<'a>(
        &'a self,
        _changes: RtcPersistenceChangeSet,
    ) -> RtcPersistenceFuture<'a, ()> {
        Box::pin(async { Ok(()) })
    }
}
