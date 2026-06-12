use std::collections::BTreeMap;
use std::sync::{Arc, Mutex};
use std::time::Instant;

use sdkwork_communication_rtc_service::{
    NoopRtcPersistencePort, ProviderHealthSnapshot, RtcContractError, RtcCreateMediaSessionRequest,
    RtcMediaArtifact, RtcMediaArtifactDescriptor, RtcMediaParticipant, RtcMediaSession,
    RtcMediaSessionCompletionInput, RtcMediaSessionCompletionRecord, RtcMediaSessionEndSource,
    RtcMediaSessionStatus, RtcParticipantCredential, RtcParticipantRole, RtcParticipantState,
    RtcPersistenceChangeSet, RtcPersistenceError, RtcPersistencePort, RtcProviderAccount,
    RtcProviderAccountCommand, RtcProviderAccountDisableRequest, RtcProviderAccountStatus,
    RtcProviderApplication, RtcProviderApplicationCommand, RtcProviderApplicationDisableRequest,
    RtcProviderApplicationStatus, RtcProviderCapabilitySnapshot, RtcProviderCredential,
    RtcProviderCredentialCommand, RtcProviderCredentialRevokeRequest, RtcProviderCredentialRole,
    RtcProviderCredentialStatus, RtcProviderEventKind, RtcProviderHealthStatus, RtcProviderProfile,
    RtcProviderProfileCommand, RtcProviderProfileDisableRequest, RtcProviderProfileStatus,
    RtcProviderProfileVerification, RtcProviderProfileVerifyCheck,
    RtcProviderProfileVerifyCheckStatus, RtcProviderProfileVerifyKind,
    RtcProviderProfileVerifyRequest, RtcProviderProfileVerifyResult, RtcProviderQueryJobRecord,
    RtcProviderQueryKind, RtcProviderQueryRequest, RtcProviderQueryResult,
    RtcProviderQuerySnapshotRecord, RtcProviderWebhookEvent, RtcProviderWebhookEventRecord,
    RtcProviderWebhookParseRequest, RtcQualitySample, RtcRecordingArtifactExportRequest,
    RtcRecordingArtifactKind, RtcRecordingArtifactStatus, RtcRoom, RtcRoomStatus,
    utc_now_rfc3339_millis,
};
use sdkwork_router_rtc_app_api::service::{
    RtcActiveProviderProfileListData, RtcAppApiError, RtcAppApiFuture, RtcAppApiService,
    RtcCreateAppMediaSessionRequest, RtcIssueParticipantCredentialRequest, RtcListRequest,
    RtcMediaArtifactListData as RtcAppMediaArtifactListData, RtcMediaSessionListData,
    RtcRoomListData,
};
use sdkwork_router_rtc_backend_api::service::{
    RtcBackendApiError, RtcBackendApiFuture, RtcBackendApiService, RtcBackendListRequest,
    RtcCloseMediaSessionRequest, RtcListData, RtcMediaArtifactListData,
    RtcMediaSessionListData as RtcBackendMediaSessionListData, RtcProviderAccountListData,
    RtcProviderApplicationListData, RtcProviderCredentialListData, RtcProviderProfileListData,
    RtcProviderQueryJobCreateRequest, RtcProviderQuerySnapshotListData, RtcProviderRoute,
    RtcProviderRouteCommand, RtcProviderRouteListData, RtcProviderRouteStatus,
    RtcProviderWebhookEventListData, RtcProviderWebhookReceiveRequest, RtcQualitySampleListData,
    RtcRoomListData as RtcBackendRoomListData,
};

use crate::plugin_registry::{RtcProviderPluginRegistry, RtcProviderPluginRegistryError};

const RTC_PROVIDER_ROUTE_TYPE_REGION: &str = "region";

#[derive(Clone)]
pub struct RtcProductService {
    registry: RtcProviderPluginRegistry,
    persistence: Arc<dyn RtcPersistencePort>,
    state: Arc<Mutex<RtcProductState>>,
}

impl RtcProductService {
    pub fn new(registry: RtcProviderPluginRegistry) -> Self {
        Self {
            registry,
            persistence: Arc::new(NoopRtcPersistencePort),
            state: Arc::new(Mutex::new(RtcProductState::default())),
        }
    }

    pub fn with_persistence(mut self, persistence: Arc<dyn RtcPersistencePort>) -> Self {
        self.persistence = persistence;
        self
    }

    pub fn seed_default_room(
        self,
        tenant_id: impl Into<String>,
        organization_id: impl Into<String>,
        owner_user_id: impl Into<String>,
    ) -> Self {
        let tenant_id = tenant_id.into();
        let organization_id = organization_id.into();
        let owner_user_id = owner_user_id.into();
        let room = RtcRoom {
            id: "room-default".to_string(),
            tenant_id,
            organization_id,
            owner_user_id,
            title: "Default RTC room".to_string(),
            status: RtcRoomStatus::Active,
        };
        self.state
            .lock()
            .expect("rtc product state lock")
            .rooms
            .insert(room.id.clone(), room);
        self
    }

    fn list_rooms_impl(&self, request: RtcListRequest) -> Result<RtcRoomListData, RtcAppApiError> {
        let state = self.state.lock().expect("rtc product state lock");
        Ok(RtcRoomListData {
            items: state
                .rooms
                .values()
                .filter(|room| {
                    room.tenant_id == request.tenant_id
                        && organization_matches(
                            &room.organization_id,
                            request.organization_id.as_deref(),
                        )
                })
                .cloned()
                .collect(),
            next_cursor: None,
        })
    }

    fn retrieve_room_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        room_id: String,
    ) -> Result<RtcRoom, RtcAppApiError> {
        let state = self.state.lock().expect("rtc product state lock");
        state
            .rooms
            .get(room_id.as_str())
            .filter(|room| {
                room.tenant_id == tenant_id
                    && organization_matches(&room.organization_id, organization_id.as_deref())
            })
            .cloned()
            .ok_or_else(|| RtcAppApiError::NotFound(format!("RTC room not found: {room_id}")))
    }

    fn list_active_provider_profiles_impl(
        &self,
        request: RtcListRequest,
    ) -> Result<RtcActiveProviderProfileListData, RtcAppApiError> {
        self.ensure_runtime_profiles(&request.tenant_id, request.organization_id.as_deref());
        let state = self.state.lock().expect("rtc product state lock");
        Ok(RtcActiveProviderProfileListData {
            items: state
                .provider_profiles
                .values()
                .filter(|profile| {
                    profile.tenant_id == request.tenant_id
                        && organization_matches(
                            &profile.organization_id,
                            request.organization_id.as_deref(),
                        )
                        && profile.status == RtcProviderProfileStatus::Active
                        && profile.deleted_at.is_none()
                })
                .map(RtcProviderProfile::active_projection)
                .collect(),
            next_cursor: None,
        })
    }

    fn list_media_sessions_impl(
        &self,
        request: RtcListRequest,
    ) -> Result<RtcMediaSessionListData, RtcAppApiError> {
        let state = self.state.lock().expect("rtc product state lock");
        Ok(RtcMediaSessionListData {
            items: state
                .sessions
                .values()
                .filter(|session| {
                    session.tenant_id == request.tenant_id
                        && organization_matches(
                            &session.organization_id,
                            request.organization_id.as_deref(),
                        )
                })
                .cloned()
                .collect(),
            next_cursor: None,
        })
    }

    async fn create_media_session_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        user_id: String,
        request: RtcCreateAppMediaSessionRequest,
    ) -> Result<RtcMediaSession, RtcAppApiError> {
        let organization_id = organization_id.unwrap_or_else(|| "0".to_string());
        self.ensure_runtime_profiles(&tenant_id, Some(organization_id.as_str()));
        let (provider_key, provider_profile_id) = self
            .select_provider(
                &tenant_id,
                &organization_id,
                request.provider.as_deref(),
                request.provider_profile_id.as_deref(),
                request.region.as_deref(),
            )
            .map_err(app_error_from_product)?;
        let provider = self
            .registry
            .provider(provider_key.as_str())
            .map_err(app_error_from_registry)?;
        let session_id = {
            let mut state = self.state.lock().expect("rtc product state lock");
            if !state.rooms.contains_key(request.room_id.as_str()) {
                return Err(RtcAppApiError::NotFound(format!(
                    "RTC room not found: {}",
                    request.room_id
                )));
            }
            state.next_session_id()
        };
        let now = utc_now_rfc3339_millis();
        let handle = provider
            .create_session(RtcCreateMediaSessionRequest {
                tenant_id: tenant_id.clone(),
                rtc_session_id: session_id.clone(),
                media_mode: request.media_mode.clone(),
                room_id: Some(request.room_id.clone()),
                region: request.region,
            })
            .map_err(app_error_from_contract)?;
        let session = RtcMediaSession {
            id: session_id,
            room_id: request.room_id,
            tenant_id,
            organization_id,
            owner_user_id: user_id,
            media_mode: request.media_mode,
            status: RtcMediaSessionStatus::Active,
            provider_profile_id: Some(provider_profile_id),
            provider_session_id: Some(handle.provider_session_id),
            started_at: Some(now.clone()),
            connected_at: Some(now),
            ended_at: None,
            duration_ms: None,
            end_reason: None,
            end_source: None,
            participant_count: 0,
            max_concurrent_participants: 0,
            quality_summary: None,
            recording_summary: None,
            completion_recorded_at: None,
            last_provider_webhook_event_id: None,
            last_provider_query_job_id: None,
            participants: Vec::new(),
        };
        let (room, provider_profile) = {
            let mut state = self.state.lock().expect("rtc product state lock");
            state.sessions.insert(session.id.clone(), session.clone());
            (
                state.rooms.get(session.room_id.as_str()).cloned(),
                session
                    .provider_profile_id
                    .as_deref()
                    .and_then(|profile_id| state.provider_profiles.get(profile_id))
                    .cloned(),
            )
        };
        self.persist_changes(RtcPersistenceChangeSet {
            rooms: room.into_iter().collect(),
            media_sessions: vec![session.clone()],
            provider_profiles: provider_profile.into_iter().collect(),
            ..RtcPersistenceChangeSet::default()
        })
        .await
        .map_err(app_error_from_product)?;
        Ok(session)
    }

    fn retrieve_media_session_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_session_id: String,
    ) -> Result<RtcMediaSession, RtcAppApiError> {
        self.get_session(&tenant_id, organization_id.as_deref(), &media_session_id)
            .map_err(app_error_from_product)
    }

    fn retrieve_completion_record_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_session_id: String,
    ) -> Result<RtcMediaSessionCompletionRecord, RtcAppApiError> {
        let state = self.state.lock().expect("rtc product state lock");
        state
            .completion_records
            .get(media_session_id.as_str())
            .filter(|record| {
                record.tenant_id == tenant_id
                    && organization_matches(&record.organization_id, organization_id.as_deref())
            })
            .cloned()
            .ok_or_else(|| {
                RtcAppApiError::NotFound(format!(
                    "RTC media session completion record not found: {media_session_id}"
                ))
            })
    }

    async fn issue_participant_credential_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        user_id: String,
        request: RtcIssueParticipantCredentialRequest,
    ) -> Result<RtcParticipantCredential, RtcAppApiError> {
        let session = self
            .get_session(
                &tenant_id,
                organization_id.as_deref(),
                &request.media_session_id,
            )
            .map_err(app_error_from_product)?;
        let provider_key = self
            .provider_for_session(&session)
            .map_err(app_error_from_product)?;
        let provider = self
            .registry
            .provider(provider_key.as_str())
            .map_err(app_error_from_registry)?;
        let credential = provider
            .issue_participant_credential(&tenant_id, &session.id, &request.participant_id)
            .map_err(app_error_from_contract)?;
        let now = utc_now_rfc3339_millis();
        let (participant, stored_session_snapshot) = {
            let mut state = self.state.lock().expect("rtc product state lock");
            let participant = RtcMediaParticipant {
                id: request.participant_id.clone(),
                session_id: session.id.clone(),
                user_id,
                display_name: "RTC participant".to_string(),
                role: RtcParticipantRole::Host,
                state: RtcParticipantState::Joined,
                audio_muted: false,
                video_muted: false,
                screen_share_active: false,
                provider_participant_id: Some(format!("{provider_key}:{}", request.participant_id)),
                joined_at: Some(now.clone()),
                left_at: None,
                duration_ms: None,
                leave_reason: None,
                last_seen_at: Some(now),
            };
            state
                .participants
                .insert(participant.id.clone(), participant.clone());
            let mut stored_session_snapshot = None;
            if let Some(stored_session) = state.sessions.get_mut(session.id.as_str()) {
                stored_session.participant_count = stored_session.participant_count.max(1);
                stored_session.max_concurrent_participants = stored_session
                    .max_concurrent_participants
                    .max(stored_session.participant_count);
                stored_session_snapshot = Some(stored_session.clone());
            }
            (participant, stored_session_snapshot)
        };
        self.persist_changes(RtcPersistenceChangeSet {
            media_sessions: stored_session_snapshot.into_iter().collect(),
            media_participants: vec![participant],
            ..RtcPersistenceChangeSet::default()
        })
        .await
        .map_err(app_error_from_product)?;
        Ok(credential)
    }

    fn list_recording_artifacts_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_session_id: String,
    ) -> Result<RtcAppMediaArtifactListData, RtcAppApiError> {
        let state = self.state.lock().expect("rtc product state lock");
        Ok(RtcAppMediaArtifactListData {
            items: state
                .artifacts
                .values()
                .filter(|artifact| {
                    artifact.tenant_id == tenant_id
                        && artifact.rtc_session_id == media_session_id
                        && state
                            .sessions
                            .get(media_session_id.as_str())
                            .is_some_and(|session| {
                                organization_matches(
                                    &session.organization_id,
                                    organization_id.as_deref(),
                                )
                            })
                })
                .cloned()
                .collect(),
            next_cursor: None,
        })
    }

    fn list_backend_provider_profiles_impl(
        &self,
        request: RtcBackendListRequest,
    ) -> Result<RtcProviderProfileListData, RtcBackendApiError> {
        self.ensure_runtime_profiles(&request.tenant_id, request.organization_id.as_deref());
        let state = self.state.lock().expect("rtc product state lock");
        Ok(RtcProviderProfileListData {
            items: state
                .provider_profiles
                .values()
                .filter(|profile| {
                    profile.tenant_id == request.tenant_id
                        && organization_matches(
                            &profile.organization_id,
                            request.organization_id.as_deref(),
                        )
                        && request
                            .provider
                            .as_deref()
                            .map_or(true, |provider| profile.provider == provider)
                })
                .cloned()
                .collect(),
            next_cursor: None,
        })
    }

    fn list_provider_accounts_impl(
        &self,
        request: RtcBackendListRequest,
    ) -> Result<RtcProviderAccountListData, RtcBackendApiError> {
        let state = self.state.lock().expect("rtc product state lock");
        Ok(RtcProviderAccountListData {
            items: state
                .provider_accounts
                .values()
                .filter(|account| {
                    account.tenant_id == request.tenant_id
                        && organization_matches(
                            &account.organization_id,
                            request.organization_id.as_deref(),
                        )
                        && account.deleted_at.is_none()
                        && request
                            .provider
                            .as_deref()
                            .map_or(true, |provider| account.provider == provider)
                        && request.status.as_deref().map_or(true, |status| {
                            provider_account_status_key(&account.status) == status
                        })
                })
                .cloned()
                .collect(),
            next_cursor: None,
        })
    }

    async fn upsert_provider_account_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_account_id: Option<String>,
        request: RtcProviderAccountCommand,
    ) -> Result<RtcProviderAccount, RtcBackendApiError> {
        let provider = normalized_required_string("provider", request.provider.as_str())?;
        self.registry
            .provider(provider.as_str())
            .map_err(backend_error_from_registry)?;
        let code = normalized_required_string("provider account code", request.code.as_str())?;
        let name = normalized_required_string("provider account name", request.name.as_str())?;
        let environment = normalized_required_string(
            "provider account environment",
            request.environment.as_str(),
        )?;
        let organization_id = organization_id.unwrap_or_else(|| "0".to_string());
        let now = utc_now_rfc3339_millis();
        let is_update = provider_account_id.is_some();
        let id = provider_account_id.unwrap_or_else(|| {
            provider_account_id_for(
                tenant_id.as_str(),
                organization_id.as_str(),
                provider.as_str(),
                code.as_str(),
            )
        });
        let account = {
            let mut state = self.state.lock().expect("rtc product state lock");
            let existing_account = state
                .provider_accounts
                .get(id.as_str())
                .filter(|account| {
                    account.tenant_id == tenant_id
                        && account.organization_id == organization_id
                        && account.deleted_at.is_none()
                })
                .cloned();
            if is_update && existing_account.is_none() {
                return Err(RtcBackendApiError::NotFound(format!(
                    "RTC provider account not found: {id}"
                )));
            }
            if let Some(existing_account) = existing_account.as_ref()
                && existing_account.provider != provider
            {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "RTC provider account provider cannot be changed: {}",
                    existing_account.id
                )));
            }
            if let Some(existing_account) = existing_account.as_ref()
                && existing_account.code != code
            {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "RTC provider account code cannot be changed: {}",
                    existing_account.id
                )));
            }
            if let Some(conflicting_account) = state.provider_accounts.values().find(|account| {
                account.id != id
                    && account.tenant_id == tenant_id
                    && account.organization_id == organization_id
                    && account.provider == provider
                    && account.code == code
                    && account.deleted_at.is_none()
            }) {
                return Err(RtcBackendApiError::Conflict(format!(
                    "RTC provider account code already exists in this scope: {}",
                    conflicting_account.id
                )));
            }
            let created_by = existing_account
                .as_ref()
                .and_then(|account| account.created_by.clone())
                .or_else(|| Some(actor_id.clone()));
            let created_at = existing_account
                .as_ref()
                .and_then(|account| account.created_at.clone())
                .or_else(|| Some(now.clone()));
            let version = next_version(
                existing_account
                    .as_ref()
                    .map(|account| account.version.as_str()),
            );
            let account = RtcProviderAccount {
                id: id.clone(),
                tenant_id,
                organization_id,
                provider,
                code,
                name,
                status: request.status.unwrap_or(RtcProviderAccountStatus::Active),
                environment,
                external_tenant_id: normalized_optional_string(
                    request.external_tenant_id.as_deref(),
                ),
                cloud_account_id: normalized_optional_string(request.cloud_account_id.as_deref()),
                project_id: normalized_optional_string(request.project_id.as_deref()),
                resource_group_id: normalized_optional_string(request.resource_group_id.as_deref()),
                last_verified_at: None,
                last_verification_error: None,
                created_by,
                updated_by: Some(actor_id),
                created_at,
                updated_at: Some(now),
                version,
                deleted_at: None,
                deleted_by: None,
            };
            state.provider_accounts.insert(id, account.clone());
            account
        };
        self.persist_changes(RtcPersistenceChangeSet {
            provider_accounts: vec![account.clone()],
            ..RtcPersistenceChangeSet::default()
        })
        .await
        .map_err(backend_error_from_product)?;
        Ok(account)
    }

    fn retrieve_provider_account_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_account_id: String,
    ) -> Result<RtcProviderAccount, RtcBackendApiError> {
        let state = self.state.lock().expect("rtc product state lock");
        state
            .provider_accounts
            .get(provider_account_id.as_str())
            .filter(|account| {
                account.tenant_id == tenant_id
                    && organization_matches(&account.organization_id, organization_id.as_deref())
                    && account.deleted_at.is_none()
            })
            .cloned()
            .ok_or_else(|| {
                RtcBackendApiError::NotFound(format!(
                    "RTC provider account not found: {provider_account_id}"
                ))
            })
    }

    async fn disable_provider_account_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_account_id: String,
        request: RtcProviderAccountDisableRequest,
    ) -> Result<RtcProviderAccount, RtcBackendApiError> {
        let now = utc_now_rfc3339_millis();
        let mut account = self.retrieve_provider_account_impl(
            tenant_id,
            organization_id,
            provider_account_id.clone(),
        )?;
        account.status = RtcProviderAccountStatus::Disabled;
        account.updated_by = Some(actor_id);
        account.updated_at = Some(now);
        account.last_verification_error = request.reason;
        account.version = next_version(Some(account.version.as_str()));
        self.state
            .lock()
            .expect("rtc product state lock")
            .provider_accounts
            .insert(provider_account_id, account.clone());
        self.persist_changes(RtcPersistenceChangeSet {
            provider_accounts: vec![account.clone()],
            ..RtcPersistenceChangeSet::default()
        })
        .await
        .map_err(backend_error_from_product)?;
        Ok(account)
    }

    fn list_provider_applications_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_account_id: String,
    ) -> Result<RtcProviderApplicationListData, RtcBackendApiError> {
        let state = self.state.lock().expect("rtc product state lock");
        let account = scoped_provider_account(
            &state,
            tenant_id.as_str(),
            organization_id.as_deref(),
            provider_account_id.as_str(),
        )
        .map_err(backend_error_from_product)?;
        Ok(RtcProviderApplicationListData {
            items: state
                .provider_applications
                .values()
                .filter(|application| {
                    application.provider_account_id == account.id
                        && application.deleted_at.is_none()
                })
                .cloned()
                .collect(),
            next_cursor: None,
        })
    }

    async fn upsert_provider_application_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_account_id: Option<String>,
        provider_application_id: Option<String>,
        request: RtcProviderApplicationCommand,
    ) -> Result<RtcProviderApplication, RtcBackendApiError> {
        let code = normalized_required_string("provider application code", request.code.as_str())?;
        let name = normalized_required_string("provider application name", request.name.as_str())?;
        let environment = normalized_required_string(
            "provider application environment",
            request.environment.as_str(),
        )?;
        let provider_application_value = normalized_required_string(
            "provider application id",
            request.provider_application_id.as_str(),
        )?;
        let provider_application_id_kind = normalized_required_string(
            "provider application id kind",
            request.provider_application_id_kind.as_str(),
        )?;
        let now = utc_now_rfc3339_millis();
        let (application, account) = {
            let mut state = self.state.lock().expect("rtc product state lock");
            let organization_id = organization_id.unwrap_or_else(|| "0".to_string());
            let (account_id, is_update) =
                if let Some(application_id) = provider_application_id.as_deref() {
                    let existing = state
                        .provider_applications
                        .get(application_id)
                        .filter(|application| {
                            application.tenant_id == tenant_id
                                && application.organization_id == organization_id
                                && application.deleted_at.is_none()
                        })
                        .cloned()
                        .ok_or_else(|| {
                            RtcBackendApiError::NotFound(format!(
                                "RTC provider application not found: {application_id}"
                            ))
                        })?;
                    (existing.provider_account_id, true)
                } else {
                    (
                        provider_account_id.clone().ok_or_else(|| {
                            RtcBackendApiError::BadRequest(
                                "RTC provider account id is required to create an application"
                                    .to_string(),
                            )
                        })?,
                        false,
                    )
                };
            let account = scoped_provider_account(
                &state,
                tenant_id.as_str(),
                Some(organization_id.as_str()),
                account_id.as_str(),
            )
            .map_err(backend_error_from_product)?
            .clone();
            ensure_active_provider_account(&account).map_err(backend_error_from_product)?;
            validate_provider_application_id_kind(
                account.provider.as_str(),
                provider_application_id_kind.as_str(),
            )?;
            let id = provider_application_id
                .unwrap_or_else(|| provider_application_id_for(account.id.as_str(), code.as_str()));
            if is_update
                && provider_account_id
                    .as_deref()
                    .is_some_and(|requested_account_id| requested_account_id != account.id)
            {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "RTC provider application {id} belongs to account {}, not {}",
                    account.id,
                    provider_account_id.unwrap_or_default()
                )));
            }
            let existing_application = state.provider_applications.get(id.as_str()).cloned();
            if let Some(existing_application) = existing_application.as_ref()
                && existing_application.code != code
            {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "RTC provider application code cannot be changed: {}",
                    existing_application.id
                )));
            }
            if let Some(existing_application) = existing_application.as_ref()
                && existing_application.provider_application_id != provider_application_value
            {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "RTC provider application id cannot be changed: {}",
                    existing_application.id
                )));
            }
            if let Some(existing_application) = existing_application.as_ref()
                && existing_application.provider_application_id_kind != provider_application_id_kind
            {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "RTC provider application id kind cannot be changed: {}",
                    existing_application.id
                )));
            }
            if let Some(conflicting_application) =
                state.provider_applications.values().find(|application| {
                    application.id != id
                        && application.provider_account_id == account.id
                        && application.code == code
                        && application.deleted_at.is_none()
                })
            {
                return Err(RtcBackendApiError::Conflict(format!(
                    "RTC provider application code already exists in this account: {}",
                    conflicting_application.id
                )));
            }
            let created_by = existing_application
                .as_ref()
                .and_then(|application| application.created_by.clone())
                .or_else(|| Some(actor_id.clone()));
            let created_at = existing_application
                .as_ref()
                .and_then(|application| application.created_at.clone())
                .or_else(|| Some(now.clone()));
            let version = next_version(
                existing_application
                    .as_ref()
                    .map(|application| application.version.as_str()),
            );
            let mut application = RtcProviderApplication {
                id: id.clone(),
                tenant_id,
                organization_id,
                provider_account_id: account.id.clone(),
                provider: account.provider.clone(),
                code,
                name,
                status: request
                    .status
                    .unwrap_or(RtcProviderApplicationStatus::Active),
                environment,
                region: normalized_optional_string(request.region.as_deref()),
                provider_application_id: provider_application_value,
                provider_application_id_kind,
                access_endpoint: normalized_optional_string(request.access_endpoint.as_deref()),
                api_endpoint: normalized_optional_string(request.api_endpoint.as_deref()),
                api_host: normalized_optional_string(request.api_host.as_deref()),
                api_version: normalized_optional_string(request.api_version.as_deref()),
                webhook_callback_url: normalized_optional_string(
                    request.webhook_callback_url.as_deref(),
                ),
                config_snapshot: request.config_snapshot,
                last_verified_at: None,
                last_verification_error: None,
                created_by,
                updated_by: Some(actor_id),
                created_at,
                updated_at: Some(now.clone()),
                version,
                deleted_at: None,
                deleted_by: None,
            };
            update_application_credential_health(
                &mut application,
                state.provider_credentials.values(),
                &now,
            );
            state.provider_applications.insert(id, application.clone());
            (application, account)
        };
        self.persist_changes(RtcPersistenceChangeSet {
            provider_accounts: vec![account],
            provider_applications: vec![application.clone()],
            ..RtcPersistenceChangeSet::default()
        })
        .await
        .map_err(backend_error_from_product)?;
        Ok(application)
    }

    fn retrieve_provider_application_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_application_id: String,
    ) -> Result<RtcProviderApplication, RtcBackendApiError> {
        let state = self.state.lock().expect("rtc product state lock");
        state
            .provider_applications
            .get(provider_application_id.as_str())
            .filter(|application| {
                application.tenant_id == tenant_id
                    && organization_matches(
                        &application.organization_id,
                        organization_id.as_deref(),
                    )
                    && application.deleted_at.is_none()
            })
            .cloned()
            .ok_or_else(|| {
                RtcBackendApiError::NotFound(format!(
                    "RTC provider application not found: {provider_application_id}"
                ))
            })
    }

    async fn disable_provider_application_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_application_id: String,
        request: RtcProviderApplicationDisableRequest,
    ) -> Result<RtcProviderApplication, RtcBackendApiError> {
        let now = utc_now_rfc3339_millis();
        let mut application = self.retrieve_provider_application_impl(
            tenant_id,
            organization_id,
            provider_application_id.clone(),
        )?;
        application.status = RtcProviderApplicationStatus::Disabled;
        application.updated_by = Some(actor_id);
        application.updated_at = Some(now);
        application.last_verification_error = request.reason;
        application.version = next_version(Some(application.version.as_str()));
        self.state
            .lock()
            .expect("rtc product state lock")
            .provider_applications
            .insert(provider_application_id, application.clone());
        self.persist_changes(RtcPersistenceChangeSet {
            provider_applications: vec![application.clone()],
            ..RtcPersistenceChangeSet::default()
        })
        .await
        .map_err(backend_error_from_product)?;
        Ok(application)
    }

    fn list_provider_credentials_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_application_id: String,
    ) -> Result<RtcProviderCredentialListData, RtcBackendApiError> {
        let state = self.state.lock().expect("rtc product state lock");
        let application = scoped_provider_application(
            &state,
            tenant_id.as_str(),
            organization_id.as_deref(),
            provider_application_id.as_str(),
        )
        .map_err(backend_error_from_product)?;
        Ok(RtcProviderCredentialListData {
            items: state
                .provider_credentials
                .values()
                .filter(|credential| credential.provider_application_id == application.id)
                .cloned()
                .collect(),
            next_cursor: None,
        })
    }

    async fn upsert_provider_credential_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_application_id: Option<String>,
        provider_credential_id: Option<String>,
        request: RtcProviderCredentialCommand,
    ) -> Result<RtcProviderCredential, RtcBackendApiError> {
        let credential_label = normalized_required_string(
            "provider credential label",
            request.credential_label.as_str(),
        )?;
        let credential_ref =
            normalized_required_string("provider credential ref", request.credential_ref.as_str())?;
        ensure_secret_reference("credential ref", credential_ref.as_str())?;
        if matches!(
            request.status.as_ref(),
            Some(RtcProviderCredentialStatus::Revoked)
        ) {
            return Err(RtcBackendApiError::BadRequest(
                "revoke provider credential workflow must be used for revoked credentials"
                    .to_string(),
            ));
        }
        let now = utc_now_rfc3339_millis();
        let (credential, application) = {
            let mut state = self.state.lock().expect("rtc product state lock");
            let organization_id = organization_id.unwrap_or_else(|| "0".to_string());
            let (application_id, is_update) =
                if let Some(credential_id) = provider_credential_id.as_deref() {
                    let existing = state
                        .provider_credentials
                        .get(credential_id)
                        .filter(|credential| {
                            credential.tenant_id == tenant_id
                                && credential.organization_id == organization_id
                        })
                        .cloned()
                        .ok_or_else(|| {
                            RtcBackendApiError::NotFound(format!(
                                "RTC provider credential not found: {credential_id}"
                            ))
                        })?;
                    (existing.provider_application_id, true)
                } else {
                    (
                        provider_application_id.clone().ok_or_else(|| {
                            RtcBackendApiError::BadRequest(
                                "RTC provider application id is required to create a credential"
                                    .to_string(),
                            )
                        })?,
                        false,
                    )
                };
            let application = scoped_provider_application(
                &state,
                tenant_id.as_str(),
                Some(organization_id.as_str()),
                application_id.as_str(),
            )
            .map_err(backend_error_from_product)?
            .clone();
            ensure_active_provider_application(&application).map_err(backend_error_from_product)?;
            let account = scoped_provider_account(
                &state,
                tenant_id.as_str(),
                Some(organization_id.as_str()),
                application.provider_account_id.as_str(),
            )
            .map_err(backend_error_from_product)?;
            ensure_active_provider_account(account).map_err(backend_error_from_product)?;
            if is_update
                && provider_application_id
                    .as_deref()
                    .is_some_and(|requested_application_id| {
                        requested_application_id != application.id
                    })
            {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "RTC provider credential belongs to application {}, not {}",
                    application.id,
                    provider_application_id.unwrap_or_default()
                )));
            }
            let id = provider_credential_id.unwrap_or_else(|| {
                provider_credential_id_for(
                    application.id.as_str(),
                    &request.credential_role,
                    credential_label.as_str(),
                )
            });
            if let Some(conflicting_credential) =
                state.provider_credentials.values().find(|credential| {
                    credential.id != id
                        && credential.provider_application_id == application.id
                        && credential.credential_role == request.credential_role
                        && credential.credential_label == credential_label
                })
            {
                return Err(RtcBackendApiError::Conflict(format!(
                    "RTC provider credential role label already exists in this application: {}",
                    conflicting_credential.id
                )));
            }
            let credential_fingerprint =
                normalized_optional_string(request.credential_fingerprint.as_deref());
            let secret_version = normalized_optional_string(request.secret_version.as_deref());
            let existing_credential = state.provider_credentials.get(id.as_str()).cloned();
            if let Some(existing_credential) = existing_credential.as_ref()
                && (existing_credential.credential_role != request.credential_role
                    || existing_credential.credential_label != credential_label)
            {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "RTC provider credential role and label cannot be changed: {}",
                    existing_credential.id
                )));
            }
            if let Some(existing_credential) = existing_credential.as_ref()
                && (existing_credential.status == RtcProviderCredentialStatus::Revoked
                    || existing_credential.revoked_at.is_some())
            {
                return Err(RtcBackendApiError::Conflict(format!(
                    "RTC provider credential is revoked and cannot be changed: {}",
                    existing_credential.id
                )));
            }
            let created_by = existing_credential
                .as_ref()
                .and_then(|credential| credential.created_by.clone())
                .or_else(|| Some(actor_id.clone()));
            let created_at = existing_credential
                .as_ref()
                .and_then(|credential| credential.created_at.clone())
                .or_else(|| Some(now.clone()));
            let version = next_version(
                existing_credential
                    .as_ref()
                    .map(|credential| credential.version.as_str()),
            );
            let rotated_at = if let Some(existing_credential) = existing_credential.as_ref() {
                if existing_credential.credential_ref != credential_ref
                    || existing_credential.credential_fingerprint != credential_fingerprint
                    || existing_credential.secret_version != secret_version
                {
                    Some(now.clone())
                } else {
                    existing_credential.rotated_at.clone()
                }
            } else {
                None
            };
            let credential = RtcProviderCredential {
                id: id.clone(),
                tenant_id,
                organization_id,
                provider_account_id: application.provider_account_id.clone(),
                provider_application_id: application.id.clone(),
                provider: application.provider.clone(),
                credential_role: request.credential_role,
                credential_label,
                credential_ref,
                credential_fingerprint,
                secret_version,
                status: request
                    .status
                    .unwrap_or(RtcProviderCredentialStatus::Active),
                valid_from: request.valid_from,
                expires_at: request.expires_at,
                rotation_due_at: request.rotation_due_at,
                rotated_at,
                revoked_at: None,
                last_verified_at: None,
                last_used_at: None,
                created_by,
                updated_by: Some(actor_id),
                created_at,
                updated_at: Some(now.clone()),
                version,
            };
            state.provider_credentials.insert(id, credential.clone());
            let mut refreshed_application = state
                .provider_applications
                .get(application.id.as_str())
                .cloned()
                .ok_or_else(|| {
                    RtcBackendApiError::NotFound(format!(
                        "RTC provider application not found: {}",
                        application.id
                    ))
                })?;
            update_application_credential_health(
                &mut refreshed_application,
                state.provider_credentials.values(),
                &now,
            );
            refreshed_application.version =
                next_version(Some(refreshed_application.version.as_str()));
            state.provider_applications.insert(
                refreshed_application.id.clone(),
                refreshed_application.clone(),
            );
            (credential, refreshed_application)
        };
        self.persist_changes(RtcPersistenceChangeSet {
            provider_applications: vec![application],
            provider_credentials: vec![credential.clone()],
            ..RtcPersistenceChangeSet::default()
        })
        .await
        .map_err(backend_error_from_product)?;
        Ok(credential)
    }

    fn retrieve_provider_credential_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_credential_id: String,
    ) -> Result<RtcProviderCredential, RtcBackendApiError> {
        let state = self.state.lock().expect("rtc product state lock");
        state
            .provider_credentials
            .get(provider_credential_id.as_str())
            .filter(|credential| {
                credential.tenant_id == tenant_id
                    && organization_matches(&credential.organization_id, organization_id.as_deref())
            })
            .cloned()
            .ok_or_else(|| {
                RtcBackendApiError::NotFound(format!(
                    "RTC provider credential not found: {provider_credential_id}"
                ))
            })
    }

    async fn revoke_provider_credential_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_credential_id: String,
        _request: RtcProviderCredentialRevokeRequest,
    ) -> Result<RtcProviderCredential, RtcBackendApiError> {
        let now = utc_now_rfc3339_millis();
        let (credential, application) = {
            let mut state = self.state.lock().expect("rtc product state lock");
            let mut credential = state
                .provider_credentials
                .get(provider_credential_id.as_str())
                .filter(|credential| {
                    credential.tenant_id == tenant_id
                        && organization_matches(
                            &credential.organization_id,
                            organization_id.as_deref(),
                        )
                })
                .cloned()
                .ok_or_else(|| {
                    RtcBackendApiError::NotFound(format!(
                        "RTC provider credential not found: {provider_credential_id}"
                    ))
                })?;
            credential.status = RtcProviderCredentialStatus::Revoked;
            credential.revoked_at = Some(now.clone());
            credential.updated_by = Some(actor_id);
            credential.updated_at = Some(now.clone());
            credential.version = next_version(Some(credential.version.as_str()));
            state
                .provider_credentials
                .insert(provider_credential_id, credential.clone());
            let mut application = state
                .provider_applications
                .get(credential.provider_application_id.as_str())
                .cloned()
                .ok_or_else(|| {
                    RtcBackendApiError::NotFound(format!(
                        "RTC provider application not found: {}",
                        credential.provider_application_id
                    ))
                })?;
            update_application_credential_health(
                &mut application,
                state.provider_credentials.values(),
                &now,
            );
            application.version = next_version(Some(application.version.as_str()));
            state
                .provider_applications
                .insert(application.id.clone(), application.clone());
            (credential, application)
        };
        self.persist_changes(RtcPersistenceChangeSet {
            provider_applications: vec![application],
            provider_credentials: vec![credential.clone()],
            ..RtcPersistenceChangeSet::default()
        })
        .await
        .map_err(backend_error_from_product)?;
        Ok(credential)
    }

    async fn upsert_provider_profile_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_profile_id: Option<String>,
        request: RtcProviderProfileCommand,
    ) -> Result<RtcProviderProfile, RtcBackendApiError> {
        self.registry
            .provider(request.provider.as_str())
            .map_err(backend_error_from_registry)?;
        if let Some(credential_ref) = request.credential_ref.as_deref() {
            ensure_secret_reference("credential ref", credential_ref)?;
        }
        if let Some(webhook_secret_ref) = request.webhook_secret_ref.as_deref() {
            ensure_secret_reference("webhook secret ref", webhook_secret_ref)?;
        }
        let now = utc_now_rfc3339_millis();
        let organization_id = organization_id.unwrap_or_else(|| "0".to_string());
        let is_update = provider_profile_id.is_some();
        let id = provider_profile_id.unwrap_or_else(|| {
            profile_id(
                tenant_id.as_str(),
                organization_id.as_str(),
                request.provider.as_str(),
                request.code.as_str(),
            )
        });
        let profile = {
            let mut state = self.state.lock().expect("rtc product state lock");
            if is_update
                && !state
                    .provider_profiles
                    .get(id.as_str())
                    .is_some_and(|profile| {
                        profile.tenant_id == tenant_id
                            && profile.organization_id == organization_id
                            && profile.deleted_at.is_none()
                    })
            {
                return Err(RtcBackendApiError::NotFound(format!(
                    "RTC provider profile not found: {id}"
                )));
            }
            if let Some(conflicting_profile) = state.provider_profiles.values().find(|profile| {
                profile.id != id
                    && profile.tenant_id == tenant_id
                    && profile.organization_id == organization_id
                    && profile.provider == request.provider
                    && profile.code == request.code
                    && profile.deleted_at.is_none()
            }) {
                return Err(RtcBackendApiError::Conflict(format!(
                    "RTC provider profile code already exists in this scope: {}",
                    conflicting_profile.id
                )));
            }
            let existing_profile = state.provider_profiles.get(id.as_str()).cloned();
            if let Some(existing_profile) = existing_profile.as_ref()
                && existing_profile.provider != request.provider
            {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "RTC provider profile provider cannot be changed: {}",
                    existing_profile.id
                )));
            }
            if let Some(existing_profile) = existing_profile.as_ref()
                && existing_profile.code != request.code
            {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "RTC provider profile code cannot be changed: {}",
                    existing_profile.id
                )));
            }
            let created_by = existing_profile
                .as_ref()
                .and_then(|profile| profile.created_by.clone())
                .or_else(|| Some(actor_id.clone()));
            let created_at = existing_profile
                .as_ref()
                .and_then(|profile| profile.created_at.clone())
                .or_else(|| Some(now.clone()));
            let version = next_version(
                existing_profile
                    .as_ref()
                    .map(|profile| profile.version.as_str()),
            );
            let profile = RtcProviderProfile {
                id: id.clone(),
                tenant_id,
                organization_id,
                provider: request.provider,
                code: request.code,
                name: request.name,
                status: request.status.unwrap_or(RtcProviderProfileStatus::Active),
                is_default: request.is_default,
                priority: request.priority,
                environment: request.environment,
                region: request.region,
                provider_app_id: request.provider_app_id,
                endpoint: request.endpoint,
                credential_ref: request.credential_ref,
                credential_fingerprint: existing_profile
                    .as_ref()
                    .and_then(|profile| profile.credential_fingerprint.clone()),
                webhook_secret_ref: request.webhook_secret_ref,
                webhook_secret_fingerprint: existing_profile
                    .as_ref()
                    .and_then(|profile| profile.webhook_secret_fingerprint.clone()),
                capabilities: request.capabilities,
                config_snapshot: request.config_snapshot,
                health_status: existing_profile
                    .as_ref()
                    .map(|profile| profile.health_status.clone())
                    .unwrap_or(RtcProviderHealthStatus::Unknown),
                last_verified_at: existing_profile
                    .as_ref()
                    .and_then(|profile| profile.last_verified_at.clone()),
                last_verification_latency_ms: existing_profile
                    .as_ref()
                    .and_then(|profile| profile.last_verification_latency_ms),
                last_verification_error: existing_profile
                    .as_ref()
                    .and_then(|profile| profile.last_verification_error.clone()),
                created_by,
                updated_by: Some(actor_id),
                created_at,
                updated_at: Some(now),
                version,
                deleted_at: None,
                deleted_by: None,
            };
            if profile.is_default && profile.status == RtcProviderProfileStatus::Active {
                clear_scoped_default_provider_profiles(
                    &mut state,
                    profile.tenant_id.as_str(),
                    profile.organization_id.as_str(),
                    profile.id.as_str(),
                );
            }
            state.provider_profiles.insert(id, profile.clone());
            profile
        };
        self.persist_changes(RtcPersistenceChangeSet {
            provider_profiles: vec![profile.clone()],
            ..RtcPersistenceChangeSet::default()
        })
        .await
        .map_err(backend_error_from_product)?;
        Ok(profile)
    }

    fn retrieve_provider_profile_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_profile_id: String,
    ) -> Result<RtcProviderProfile, RtcBackendApiError> {
        self.ensure_runtime_profiles(&tenant_id, organization_id.as_deref());
        let state = self.state.lock().expect("rtc product state lock");
        state
            .provider_profiles
            .get(provider_profile_id.as_str())
            .filter(|profile| {
                profile.tenant_id == tenant_id
                    && organization_matches(&profile.organization_id, organization_id.as_deref())
            })
            .cloned()
            .ok_or_else(|| {
                RtcBackendApiError::NotFound(format!(
                    "RTC provider profile not found: {provider_profile_id}"
                ))
            })
    }

    async fn disable_provider_profile_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_profile_id: String,
        request: RtcProviderProfileDisableRequest,
    ) -> Result<RtcProviderProfile, RtcBackendApiError> {
        let now = utc_now_rfc3339_millis();
        let mut profile = self.retrieve_provider_profile_impl(
            tenant_id,
            organization_id,
            provider_profile_id.clone(),
        )?;
        profile.status = RtcProviderProfileStatus::Disabled;
        profile.is_default = false;
        profile.updated_by = Some(actor_id);
        profile.updated_at = Some(now);
        profile.version = next_version(Some(profile.version.as_str()));
        profile.last_verification_error = request.reason;
        self.state
            .lock()
            .expect("rtc product state lock")
            .provider_profiles
            .insert(provider_profile_id, profile.clone());
        self.persist_changes(RtcPersistenceChangeSet {
            provider_profiles: vec![profile.clone()],
            ..RtcPersistenceChangeSet::default()
        })
        .await
        .map_err(backend_error_from_product)?;
        Ok(profile)
    }

    async fn verify_provider_profile_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_profile_id: String,
        request: RtcProviderProfileVerifyRequest,
    ) -> Result<RtcProviderProfileVerifyResult, RtcBackendApiError> {
        let profile = self.retrieve_provider_profile_impl(
            tenant_id,
            organization_id,
            provider_profile_id.clone(),
        )?;
        let provider = self
            .registry
            .provider(profile.provider.as_str())
            .map_err(backend_error_from_registry)?;
        let verification_started_at = Instant::now();
        let health = provider.provider_health_snapshot();
        let verified_at = health.checked_at.clone();
        let mut checks =
            build_provider_profile_verify_checks(&profile, &health, &request.query_kind);
        let latency_ms = elapsed_millis_u32(verification_started_at);
        if let Some(timeout_ms) = request.timeout_ms
            && latency_ms > timeout_ms
        {
            checks.push(provider_profile_verify_check(
                "verification_timeout",
                RtcProviderProfileVerifyCheckStatus::Failed,
                Some(format!(
                    "provider verification latency {latency_ms}ms exceeded timeoutMs {timeout_ms}ms"
                )),
            ));
        }
        let status = provider_profile_status_from_checks(&checks);
        let verification_error = provider_profile_verification_error(&checks, &status);
        let result = RtcProviderProfileVerifyResult {
            provider_profile_id: provider_profile_id.clone(),
            provider: profile.provider.clone(),
            status: status.clone(),
            verified_at: verified_at.clone(),
            latency_ms: Some(latency_ms),
            checks,
        };
        let persisted_profile = {
            let mut state = self.state.lock().expect("rtc product state lock");
            let stored = state
                .provider_profiles
                .get_mut(provider_profile_id.as_str())
                .ok_or_else(|| {
                    RtcBackendApiError::NotFound(format!(
                        "RTC provider profile not found: {provider_profile_id}"
                    ))
                })?;
            let verification = RtcProviderProfileVerification {
                provider_profile_id,
                provider: profile.provider,
                status,
                verified_at,
                latency_ms: Some(latency_ms),
                error: verification_error,
            };
            stored.health_status = verification.status;
            stored.last_verified_at = Some(verification.verified_at);
            stored.last_verification_latency_ms = verification.latency_ms;
            stored.last_verification_error = verification.error;
            stored.clone()
        };
        self.persist_changes(RtcPersistenceChangeSet {
            provider_profiles: vec![persisted_profile],
            ..RtcPersistenceChangeSet::default()
        })
        .await
        .map_err(backend_error_from_product)?;
        Ok(result)
    }

    async fn receive_provider_webhook_impl(
        &self,
        provider_key: String,
        request: RtcProviderWebhookReceiveRequest,
    ) -> Result<RtcProviderWebhookEventRecord, RtcBackendApiError> {
        let provider = self
            .registry
            .provider(provider_key.as_str())
            .map_err(backend_error_from_registry)?;
        let received_at = request.received_at.unwrap_or_else(utc_now_rfc3339_millis);
        let raw_payload = serde_json::to_string(&request.payload)
            .map_err(|error| RtcBackendApiError::BadRequest(error.to_string()))?;
        let parsed = provider
            .parse_provider_webhook(RtcProviderWebhookParseRequest {
                provider: provider_key.clone(),
                provider_profile_id: request.provider_profile_id,
                received_at,
                headers: headers_from_json(&request.headers),
                raw_payload,
            })
            .map_err(backend_error_from_contract)?;
        if parsed.provider != provider_key {
            return Err(RtcBackendApiError::BadRequest(format!(
                "RTC provider webhook parsed as provider {}, not {}",
                parsed.provider, provider_key
            )));
        }
        let record = self.record_webhook_event(parsed)?;
        self.process_provider_webhook_record(&record)
            .await
            .map_err(backend_error_from_product)?;
        Ok(record)
    }

    async fn create_provider_query_job_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        request: RtcProviderQueryJobCreateRequest,
    ) -> Result<RtcProviderQueryJobRecord, RtcBackendApiError> {
        let organization_id = organization_id.unwrap_or_else(|| "0".to_string());
        self.ensure_runtime_profiles(&tenant_id, Some(organization_id.as_str()));
        let query_request =
            self.resolve_provider_query_request(&tenant_id, &organization_id, request)?;
        let provider = self
            .registry
            .provider(query_request.provider.as_str())
            .map_err(backend_error_from_registry)?;
        let mut result = provider
            .query_provider_state(query_request.clone())
            .map_err(backend_error_from_contract)?;
        normalize_provider_query_result(&mut result, &query_request)?;
        self.validate_provider_query_result(&tenant_id, &organization_id, &result)
            .map_err(backend_error_from_product)?;
        let job = self.record_provider_query_result(&tenant_id, Some(&organization_id), &result)?;
        if matches!(result.query_kind, RtcProviderQueryKind::RecordingArtifacts) {
            self.export_recording_artifacts_from_provider(
                &tenant_id,
                Some(&organization_id),
                &actor_id,
                &result,
                None,
                Some(job.id.clone()),
            )
            .await
            .map_err(backend_error_from_product)?;
        }
        let changes = {
            let state = self.state.lock().expect("rtc product state lock");
            let query_snapshots = state
                .query_snapshots
                .values()
                .filter(|snapshot| snapshot.provider_query_job_id == job.id)
                .cloned()
                .collect();
            let media_sessions = job
                .media_session_id
                .as_deref()
                .and_then(|session_id| state.sessions.get(session_id).cloned())
                .into_iter()
                .collect();
            let media_artifacts = job
                .media_session_id
                .as_deref()
                .map(|session_id| {
                    state
                        .artifacts
                        .values()
                        .filter(|artifact| {
                            artifact.rtc_session_id == session_id
                                && artifact.source_provider_query_job_id.as_deref()
                                    == Some(job.id.as_str())
                        })
                        .cloned()
                        .collect()
                })
                .unwrap_or_else(Vec::new);
            RtcPersistenceChangeSet {
                media_sessions,
                media_artifacts,
                provider_query_jobs: vec![job.clone()],
                provider_query_snapshots: query_snapshots,
                ..RtcPersistenceChangeSet::default()
            }
        };
        self.persist_changes(changes)
            .await
            .map_err(backend_error_from_product)?;
        Ok(job)
    }

    async fn close_media_session_impl(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        media_session_id: String,
        request: RtcCloseMediaSessionRequest,
    ) -> Result<RtcMediaSession, RtcBackendApiError> {
        let mut session = self
            .get_session(&tenant_id, organization_id.as_deref(), &media_session_id)
            .map_err(backend_error_from_product)?;
        let provider_key = self
            .provider_for_session(&session)
            .map_err(backend_error_from_product)?;
        let provider = self
            .registry
            .provider(provider_key.as_str())
            .map_err(backend_error_from_registry)?;
        provider
            .close_session(&tenant_id, &media_session_id)
            .map_err(backend_error_from_contract)?;
        let now = utc_now_rfc3339_millis();
        session.status = RtcMediaSessionStatus::Ended;
        session.ended_at = Some(now.clone());
        session.completion_recorded_at = Some(now.clone());
        session.end_reason = request.reason;
        session.end_source = Some(RtcMediaSessionEndSource::ManualClose);
        self.state
            .lock()
            .expect("rtc product state lock")
            .sessions
            .insert(media_session_id.clone(), session.clone());
        let query_result = RtcProviderQueryResult {
            provider: provider_key,
            provider_profile_id: session.provider_profile_id.clone(),
            query_kind: RtcProviderQueryKind::RecordingArtifacts,
            room_id: Some(session.room_id.clone()),
            rtc_session_id: Some(session.id.clone()),
            provider_session_id: session.provider_session_id.clone(),
            status: "closed".to_string(),
            raw_provider_action: "CloseMediaSessionExportArtifacts".to_string(),
            result_snapshot_json: "{}".to_string(),
            next_cursor: None,
            queried_at: now.clone(),
        };
        let query_job = self.record_provider_query_result(
            &tenant_id,
            organization_id.as_deref(),
            &query_result,
        )?;
        self.export_recording_artifacts_from_provider(
            &tenant_id,
            organization_id.as_deref(),
            &actor_id,
            &query_result,
            None,
            Some(query_job.id.clone()),
        )
        .await
        .map_err(backend_error_from_product)?;
        let completion = self
            .build_completion_record(&media_session_id, now)
            .map_err(backend_error_from_product)?;
        let (stored_session, changes) = {
            let mut state = self.state.lock().expect("rtc product state lock");
            state
                .completion_records
                .insert(media_session_id.clone(), completion.clone());
            let stored_session = state
                .sessions
                .get(media_session_id.as_str())
                .cloned()
                .unwrap_or_else(|| session.clone());
            let query_snapshots = state
                .query_snapshots
                .values()
                .filter(|snapshot| snapshot.provider_query_job_id == query_job.id)
                .cloned()
                .collect();
            (
                stored_session.clone(),
                RtcPersistenceChangeSet {
                    media_sessions: vec![stored_session],
                    media_participants: state
                        .participants
                        .values()
                        .filter(|participant| participant.session_id == media_session_id)
                        .cloned()
                        .collect(),
                    media_artifacts: state
                        .artifacts
                        .values()
                        .filter(|artifact| artifact.rtc_session_id == media_session_id)
                        .cloned()
                        .collect(),
                    completion_records: vec![completion],
                    provider_query_jobs: vec![query_job],
                    provider_query_snapshots: query_snapshots,
                    ..RtcPersistenceChangeSet::default()
                },
            )
        };
        self.persist_changes(changes)
            .await
            .map_err(backend_error_from_product)?;
        Ok(stored_session)
    }

    async fn persist_changes(
        &self,
        changes: RtcPersistenceChangeSet,
    ) -> Result<(), RtcProductError> {
        if changes.is_empty() {
            return Ok(());
        }
        self.persistence.persist_changes(changes).await?;
        Ok(())
    }

    fn ensure_runtime_profiles(&self, tenant_id: &str, organization_id: Option<&str>) {
        let organization_id = organization_id.unwrap_or("0");
        let mut state = self.state.lock().expect("rtc product state lock");
        for descriptor in self.registry.descriptors() {
            let id = profile_id(
                tenant_id,
                organization_id,
                &descriptor.provider_kind,
                "default",
            );
            if state.provider_profiles.contains_key(id.as_str()) {
                continue;
            }
            let profile = profile_from_descriptor(tenant_id, organization_id, descriptor);
            if profile.is_default && profile.status == RtcProviderProfileStatus::Active {
                clear_scoped_default_provider_profiles(
                    &mut state,
                    profile.tenant_id.as_str(),
                    profile.organization_id.as_str(),
                    profile.id.as_str(),
                );
            }
            state.provider_profiles.insert(id, profile);
        }
    }

    fn select_provider(
        &self,
        tenant_id: &str,
        organization_id: &str,
        provider: Option<&str>,
        provider_profile_id: Option<&str>,
        region: Option<&str>,
    ) -> Result<(String, String), RtcProductError> {
        let state = self.state.lock().expect("rtc product state lock");
        if let Some(provider_profile_id) = provider_profile_id {
            let profile = state
                .provider_profiles
                .get(provider_profile_id)
                .ok_or_else(|| {
                    RtcProductError::NotFound(format!(
                        "RTC provider profile not found: {provider_profile_id}"
                    ))
                })?;
            ensure_selectable_provider_profile(profile, tenant_id, organization_id, provider)?;
            return Ok((profile.provider.clone(), profile.id.clone()));
        }

        if let Some(region) = normalized_optional_filter(region)
            && let Some(selected_profile) = select_scoped_provider_profile_by_region_route(
                &state,
                tenant_id,
                organization_id,
                provider,
                region,
            )?
        {
            return Ok((
                selected_profile.provider.clone(),
                selected_profile.id.clone(),
            ));
        }

        let selected_profile = select_scoped_provider_profile(
            &state,
            tenant_id,
            organization_id,
            provider,
            self.registry.default_provider_key(),
        )?;
        let provider_key = selected_profile.provider.clone();
        self.registry
            .provider(provider_key.as_str())
            .map_err(RtcProductError::from)?;
        Ok((provider_key, selected_profile.id.clone()))
    }

    fn provider_for_session(&self, session: &RtcMediaSession) -> Result<String, RtcProductError> {
        if let Some(provider_profile_id) = &session.provider_profile_id {
            let state = self.state.lock().expect("rtc product state lock");
            if let Some(profile) = state.provider_profiles.get(provider_profile_id.as_str()) {
                return Ok(profile.provider.clone());
            }
        }
        session
            .provider_session_id
            .as_deref()
            .and_then(|value| {
                value
                    .split_once(':')
                    .map(|(provider, _)| provider.to_string())
            })
            .ok_or_else(|| {
                RtcProductError::Unavailable("RTC session has no provider binding".to_string())
            })
    }

    fn get_session(
        &self,
        tenant_id: &str,
        organization_id: Option<&str>,
        media_session_id: &str,
    ) -> Result<RtcMediaSession, RtcProductError> {
        let state = self.state.lock().expect("rtc product state lock");
        state
            .sessions
            .get(media_session_id)
            .filter(|session| {
                session.tenant_id == tenant_id
                    && organization_matches(&session.organization_id, organization_id)
            })
            .cloned()
            .ok_or_else(|| {
                RtcProductError::NotFound(format!(
                    "RTC media session not found: {media_session_id}"
                ))
            })
    }

    fn resolve_provider_query_request(
        &self,
        tenant_id: &str,
        organization_id: &str,
        request: RtcProviderQueryJobCreateRequest,
    ) -> Result<RtcProviderQueryRequest, RtcBackendApiError> {
        let state = self.state.lock().expect("rtc product state lock");
        let mut provider_profile_id = request.provider_profile_id;
        let mut room_id = request.room_id;
        let mut rtc_session_id = request.media_session_id;
        let mut provider_session_id = request.provider_session_id;

        if let Some(provider_profile_id) = provider_profile_id.as_deref() {
            let profile =
                scoped_provider_profile(&state, tenant_id, organization_id, provider_profile_id)
                    .map_err(backend_error_from_product)?;
            ensure_selectable_provider_profile(
                profile,
                tenant_id,
                organization_id,
                Some(request.provider.as_str()),
            )
            .map_err(backend_error_from_product)?;
        }

        if let Some(media_session_id) = rtc_session_id.as_deref() {
            let session = state
                .sessions
                .get(media_session_id)
                .filter(|session| {
                    session.tenant_id == tenant_id && session.organization_id == organization_id
                })
                .ok_or_else(|| {
                    RtcBackendApiError::NotFound(format!(
                        "RTC media session not found: {media_session_id}"
                    ))
                })?;
            let profile = ensure_session_provider_binding(
                &state,
                session,
                request.provider.as_str(),
                provider_profile_id.as_deref(),
            )
            .map_err(backend_error_from_product)?;
            ensure_selectable_provider_profile(
                profile,
                tenant_id,
                organization_id,
                Some(request.provider.as_str()),
            )
            .map_err(backend_error_from_product)?;

            if let Some(request_room_id) = room_id.as_deref()
                && request_room_id != session.room_id
            {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "RTC provider query room {request_room_id} does not match media session room {}",
                    session.room_id
                )));
            }
            if let Some(request_provider_session_id) = provider_session_id.as_deref()
                && !provider_session_id_matches_session(
                    session,
                    request_provider_session_id,
                    request.provider.as_str(),
                )
            {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "RTC provider query session {} does not match media session {}",
                    request_provider_session_id, session.id
                )));
            }

            provider_profile_id = session.provider_profile_id.clone();
            room_id = Some(session.room_id.clone());
            if provider_session_id.is_none() {
                provider_session_id = session.provider_session_id.clone();
            }
        } else if let Some(request_provider_session_id) = provider_session_id.as_deref()
            && let Some(session) = resolve_session_by_provider_session_id(
                &state,
                request_provider_session_id,
                request.provider.as_str(),
            )
        {
            let profile = ensure_session_provider_binding(
                &state,
                session,
                request.provider.as_str(),
                provider_profile_id.as_deref(),
            )
            .map_err(backend_error_from_product)?;
            ensure_selectable_provider_profile(
                profile,
                tenant_id,
                organization_id,
                Some(request.provider.as_str()),
            )
            .map_err(backend_error_from_product)?;

            if session.tenant_id != tenant_id || session.organization_id != organization_id {
                return Err(RtcBackendApiError::NotFound(format!(
                    "RTC media session not found for provider session: {request_provider_session_id}"
                )));
            }
            if let Some(request_room_id) = room_id.as_deref()
                && request_room_id != session.room_id
            {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "RTC provider query room {request_room_id} does not match media session room {}",
                    session.room_id
                )));
            }

            provider_profile_id = session.provider_profile_id.clone();
            room_id = Some(session.room_id.clone());
            rtc_session_id = Some(session.id.clone());
            if provider_session_id.is_none() {
                provider_session_id = session.provider_session_id.clone();
            }
        } else {
            if let Some(room_id) = room_id.as_deref() {
                state
                    .rooms
                    .get(room_id)
                    .filter(|room| {
                        room.tenant_id == tenant_id && room.organization_id == organization_id
                    })
                    .ok_or_else(|| {
                        RtcBackendApiError::NotFound(format!("RTC room not found: {room_id}"))
                    })?;
            }

            if matches!(request.query_kind, RtcProviderQueryKind::RecordingArtifacts) {
                return Err(RtcBackendApiError::BadRequest(
                    "RTC recording artifact queries require a local media session binding"
                        .to_string(),
                ));
            }

            if provider_profile_id.is_none() {
                let selected_profile = select_scoped_provider_profile(
                    &state,
                    tenant_id,
                    organization_id,
                    Some(request.provider.as_str()),
                    self.registry.default_provider_key(),
                )
                .map_err(backend_error_from_product)?;
                provider_profile_id = Some(selected_profile.id.clone());
            }
        }

        Ok(RtcProviderQueryRequest {
            provider: request.provider,
            provider_profile_id,
            query_kind: request.query_kind,
            room_id,
            rtc_session_id,
            provider_session_id,
            cursor: request.cursor,
        })
    }

    fn validate_provider_query_result(
        &self,
        tenant_id: &str,
        organization_id: &str,
        result: &RtcProviderQueryResult,
    ) -> Result<(), RtcProductError> {
        let state = self.state.lock().expect("rtc product state lock");
        validate_provider_query_result_binding(&state, tenant_id, organization_id, result)
    }

    fn record_webhook_event(
        &self,
        mut event: RtcProviderWebhookEvent,
    ) -> Result<RtcProviderWebhookEventRecord, RtcBackendApiError> {
        let raw_payload = serde_json::from_str(event.raw_payload.as_str())
            .map_err(|error| RtcBackendApiError::BadRequest(error.to_string()))?;
        let normalized_event = serde_json::from_str(event.normalized_event_json.as_str())
            .map_err(|error| RtcBackendApiError::BadRequest(error.to_string()))?;
        let mut state = self.state.lock().expect("rtc product state lock");
        let media_session_id = resolve_webhook_media_session_id(&state, &event);
        let provider_profile_id =
            validate_provider_webhook_event_binding(&state, &event, media_session_id.as_deref())
                .map_err(backend_error_from_product)?;
        if event.provider_profile_id.is_none() {
            event.provider_profile_id = provider_profile_id;
        }
        let scope = resolve_webhook_event_scope(&state, &event, media_session_id.as_deref())
            .map_err(backend_error_from_product)?;
        let id = state.next_webhook_event_id();
        let record = RtcProviderWebhookEventRecord {
            id: id.clone(),
            tenant_id: scope.tenant_id,
            organization_id: scope.organization_id,
            provider: event.provider,
            provider_profile_id: event.provider_profile_id,
            external_event_id: event.external_event_id,
            event_type: event.event_type,
            event_kind: event.event_kind,
            room_id: event.room_id,
            media_session_id: media_session_id.clone(),
            participant_id: event.participant_id,
            recording_id: event.recording_id,
            payload_hash: event.payload_hash,
            raw_payload,
            normalized_event,
            signature_header: event.signature_header,
            received_at: event.received_at,
            processed_at: None,
            status: "received".to_string(),
        };
        state.webhook_events.insert(id, record.clone());
        Ok(record)
    }

    async fn process_provider_webhook_record(
        &self,
        record: &RtcProviderWebhookEventRecord,
    ) -> Result<(), RtcProductError> {
        if !matches!(record.event_kind, RtcProviderEventKind::RoomEnded) {
            self.persist_changes(RtcPersistenceChangeSet {
                webhook_events: vec![record.clone()],
                ..RtcPersistenceChangeSet::default()
            })
            .await?;
            return Ok(());
        }

        let media_session_id = record.media_session_id.as_deref().ok_or_else(|| {
            RtcProductError::BadRequest(
                "RTC room ended webhook requires media session id".to_string(),
            )
        })?;
        let (owner_user_id, room_id, provider_session_id) = {
            let mut state = self.state.lock().expect("rtc product state lock");
            let session = state.sessions.get_mut(media_session_id).ok_or_else(|| {
                RtcProductError::NotFound(format!(
                    "RTC media session not found: {media_session_id}"
                ))
            })?;
            if session.tenant_id != record.tenant_id
                || session.organization_id != record.organization_id
            {
                return Err(RtcProductError::Forbidden(
                    "RTC room ended webhook scope does not match media session".to_string(),
                ));
            }

            session.status = RtcMediaSessionStatus::Ended;
            session.ended_at = Some(record.received_at.clone());
            session.completion_recorded_at = Some(record.received_at.clone());
            session.end_source = Some(RtcMediaSessionEndSource::ProviderWebhook);
            if session.end_reason.is_none() {
                session.end_reason = Some(record.event_type.clone());
            }
            session.last_provider_webhook_event_id = Some(record.id.clone());

            (
                session.owner_user_id.clone(),
                session.room_id.clone(),
                session.provider_session_id.clone(),
            )
        };

        self.export_recording_artifacts_from_provider(
            &record.tenant_id,
            Some(record.organization_id.as_str()),
            owner_user_id.as_str(),
            &RtcProviderQueryResult {
                provider: record.provider.clone(),
                provider_profile_id: record.provider_profile_id.clone(),
                query_kind: RtcProviderQueryKind::RecordingArtifacts,
                room_id: record.room_id.clone().or(Some(room_id)),
                rtc_session_id: Some(media_session_id.to_string()),
                provider_session_id,
                status: "webhook_room_ended".to_string(),
                raw_provider_action: "ProviderWebhookRoomEndedExportArtifacts".to_string(),
                result_snapshot_json: serde_json::json!({
                    "sourceWebhookEventId": record.id,
                    "recordingId": record.recording_id,
                })
                .to_string(),
                next_cursor: None,
                queried_at: record.received_at.clone(),
            },
            Some(record.id.clone()),
            None,
        )
        .await?;

        let completion =
            self.build_completion_record(media_session_id, record.received_at.clone())?;
        let changes = {
            let mut state = self.state.lock().expect("rtc product state lock");
            state
                .completion_records
                .insert(media_session_id.to_string(), completion.clone());
            let processed_record =
                if let Some(stored_record) = state.webhook_events.get_mut(record.id.as_str()) {
                    stored_record.status = "processed".to_string();
                    stored_record.processed_at = Some(record.received_at.clone());
                    stored_record.clone()
                } else {
                    record.clone()
                };
            let stored_session = state.sessions.get(media_session_id).cloned();
            RtcPersistenceChangeSet {
                media_sessions: stored_session.into_iter().collect(),
                media_participants: state
                    .participants
                    .values()
                    .filter(|participant| participant.session_id == media_session_id)
                    .cloned()
                    .collect(),
                media_artifacts: state
                    .artifacts
                    .values()
                    .filter(|artifact| artifact.rtc_session_id == media_session_id)
                    .cloned()
                    .collect(),
                completion_records: vec![completion],
                webhook_events: vec![processed_record],
                ..RtcPersistenceChangeSet::default()
            }
        };
        self.persist_changes(changes).await?;
        Ok(())
    }

    fn record_provider_query_result(
        &self,
        tenant_id: &str,
        organization_id: Option<&str>,
        result: &RtcProviderQueryResult,
    ) -> Result<RtcProviderQueryJobRecord, RtcBackendApiError> {
        let mut state = self.state.lock().expect("rtc product state lock");
        let target_kind = provider_query_target_kind(&result.query_kind).to_string();
        let target_id = provider_query_target_id(result);
        let id = format!(
            "provider-query-{}-{}-{}",
            result.provider,
            query_kind_to_str(&result.query_kind),
            target_id
        );
        let snapshot_id = state.next_provider_query_snapshot_id();
        let result_snapshot: serde_json::Value = serde_json::from_str(&result.result_snapshot_json)
            .map_err(|error| RtcBackendApiError::BadRequest(error.to_string()))?;
        let job = RtcProviderQueryJobRecord {
            id: id.clone(),
            tenant_id: tenant_id.to_string(),
            organization_id: organization_id.unwrap_or("0").to_string(),
            provider: result.provider.clone(),
            provider_profile_id: result.provider_profile_id.clone(),
            query_kind: result.query_kind.clone(),
            target_kind: target_kind.clone(),
            target_id: target_id.clone(),
            room_id: result.room_id.clone(),
            media_session_id: result.rtc_session_id.clone(),
            provider_session_id: result.provider_session_id.clone(),
            provider_request_id: Some(result.raw_provider_action.clone()),
            status: "completed".to_string(),
            requested_at: result.queried_at.clone(),
            completed_at: Some(result.queried_at.clone()),
            result_snapshot: serde_json::json!({
                "status": result.status,
                "providerAction": result.raw_provider_action,
                "providerSnapshot": result_snapshot,
            }),
        };
        let snapshot = RtcProviderQuerySnapshotRecord {
            id: snapshot_id.clone(),
            tenant_id: tenant_id.to_string(),
            organization_id: organization_id.unwrap_or("0").to_string(),
            provider_query_job_id: id.clone(),
            provider: result.provider.clone(),
            query_kind: result.query_kind.clone(),
            target_kind,
            target_id,
            provider_session_id: result.provider_session_id.clone(),
            snapshot_kind: "provider_query_result".to_string(),
            snapshot_payload: job.result_snapshot.clone(),
            captured_at: result.queried_at.clone(),
        };
        if let Some(media_session_id) = &result.rtc_session_id
            && let Some(session) = state.sessions.get_mut(media_session_id.as_str())
        {
            session.last_provider_query_job_id = Some(id.clone());
        }
        state.query_jobs.insert(id, job.clone());
        state.query_snapshots.insert(snapshot_id, snapshot);
        Ok(job)
    }

    async fn export_recording_artifacts_from_provider(
        &self,
        tenant_id: &str,
        organization_id: Option<&str>,
        owner_user_id: &str,
        result: &RtcProviderQueryResult,
        provider_webhook_event_id: Option<String>,
        provider_query_job_id: Option<String>,
    ) -> Result<(), RtcProductError> {
        let rtc_session_id = result.rtc_session_id.as_deref().ok_or_else(|| {
            RtcProductError::BadRequest(
                "recording artifact query requires media session id".to_string(),
            )
        })?;
        let organization_id = organization_id.unwrap_or("0");
        self.validate_provider_query_result(tenant_id, organization_id, result)?;
        let provider = self.registry.provider(result.provider.as_str())?;
        let artifacts = provider
            .export_recording_artifacts_for_query(RtcRecordingArtifactExportRequest {
                tenant_id: tenant_id.to_string(),
                organization_id: Some(organization_id.to_string()),
                owner_user_id: Some(owner_user_id.to_string()),
                rtc_session_id: rtc_session_id.to_string(),
                provider_profile_id: result.provider_profile_id.clone(),
                provider_session_id: result.provider_session_id.clone(),
                recording_id: extract_recording_id(result.result_snapshot_json.as_str()),
                provider_snapshot_json: Some(result.result_snapshot_json.clone()),
            })
            .await?;
        let mut state = self.state.lock().expect("rtc product state lock");
        for recording in artifacts {
            let drive_uri = recording.drive.drive_uri.clone();
            if let Some(existing) = state.artifacts.values_mut().find(|artifact| {
                artifact.rtc_session_id == rtc_session_id && artifact.drive.drive_uri == drive_uri
            }) {
                if existing.source_provider_webhook_event_id.is_none() {
                    existing.source_provider_webhook_event_id = provider_webhook_event_id.clone();
                }
                if existing.source_provider_query_job_id.is_none() {
                    existing.source_provider_query_job_id = provider_query_job_id.clone();
                }
                if existing.provider_profile_id.is_none() {
                    existing.provider_profile_id = result.provider_profile_id.clone();
                }
                if existing.provider_artifact_id.is_none() {
                    existing.provider_artifact_id = result.provider_session_id.clone();
                }
                continue;
            }
            let id = state.next_media_artifact_id();
            let mut artifact = recording.into_media_artifact(RtcMediaArtifactDescriptor {
                id: id.clone(),
                owner_user_id: owner_user_id.to_string(),
                artifact_kind: RtcRecordingArtifactKind::Recording,
                artifact_status: RtcRecordingArtifactStatus::Ready,
                media_role: "rtc_recording".to_string(),
                started_at: result.queried_at.clone(),
                ended_at: result.queried_at.clone(),
            });
            artifact.provider_profile_id = result.provider_profile_id.clone();
            artifact.provider_artifact_id = result.provider_session_id.clone();
            artifact.source_provider_webhook_event_id = provider_webhook_event_id.clone();
            artifact.source_provider_query_job_id = provider_query_job_id.clone();
            artifact.rtc_session_id = rtc_session_id.to_string();
            artifact.tenant_id = tenant_id.to_string();
            if let Some(session) = state.sessions.get(rtc_session_id)
                && session.organization_id != organization_id
            {
                return Err(RtcProductError::Forbidden(
                    "RTC artifact organization mismatch".to_string(),
                ));
            }
            state.artifacts.insert(id, artifact);
        }
        Ok(())
    }

    fn build_completion_record(
        &self,
        media_session_id: &str,
        recorded_at: String,
    ) -> Result<RtcMediaSessionCompletionRecord, RtcProductError> {
        let state = self.state.lock().expect("rtc product state lock");
        let mut session = state
            .sessions
            .get(media_session_id)
            .cloned()
            .ok_or_else(|| {
                RtcProductError::NotFound(format!(
                    "RTC media session not found: {media_session_id}"
                ))
            })?;
        session.participants = state
            .participants
            .values()
            .filter(|participant| participant.session_id == media_session_id)
            .cloned()
            .collect();
        let artifacts = state
            .artifacts
            .values()
            .filter(|artifact| artifact.rtc_session_id == media_session_id)
            .cloned()
            .collect();
        let quality_samples = state
            .quality_samples
            .values()
            .filter(|sample| sample.session_id == media_session_id)
            .cloned()
            .collect();
        Ok(RtcMediaSessionCompletionRecord::from_input(
            RtcMediaSessionCompletionInput {
                session,
                tracks: Vec::new(),
                artifacts,
                quality_samples,
                source_webhook_event_id: None,
                source_provider_query_job_id: None,
                recorded_at,
            },
        ))
    }
}

impl RtcAppApiService for RtcProductService {
    fn list_rooms(&self, request: RtcListRequest) -> RtcAppApiFuture<RtcRoomListData> {
        let service = self.clone();
        Box::pin(async move { service.list_rooms_impl(request) })
    }

    fn retrieve_room(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        room_id: String,
    ) -> RtcAppApiFuture<RtcRoom> {
        let service = self.clone();
        Box::pin(async move { service.retrieve_room_impl(tenant_id, organization_id, room_id) })
    }

    fn list_active_provider_profiles(
        &self,
        request: RtcListRequest,
    ) -> RtcAppApiFuture<RtcActiveProviderProfileListData> {
        let service = self.clone();
        Box::pin(async move { service.list_active_provider_profiles_impl(request) })
    }

    fn list_media_sessions(
        &self,
        request: RtcListRequest,
    ) -> RtcAppApiFuture<RtcMediaSessionListData> {
        let service = self.clone();
        Box::pin(async move { service.list_media_sessions_impl(request) })
    }

    fn create_media_session(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        user_id: String,
        request: RtcCreateAppMediaSessionRequest,
    ) -> RtcAppApiFuture<RtcMediaSession> {
        let service = self.clone();
        Box::pin(async move {
            service
                .create_media_session_impl(tenant_id, organization_id, user_id, request)
                .await
        })
    }

    fn retrieve_media_session(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_session_id: String,
    ) -> RtcAppApiFuture<RtcMediaSession> {
        let service = self.clone();
        Box::pin(async move {
            service.retrieve_media_session_impl(tenant_id, organization_id, media_session_id)
        })
    }

    fn retrieve_media_session_completion_record(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_session_id: String,
    ) -> RtcAppApiFuture<RtcMediaSessionCompletionRecord> {
        let service = self.clone();
        Box::pin(async move {
            service.retrieve_completion_record_impl(tenant_id, organization_id, media_session_id)
        })
    }

    fn issue_participant_credential(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        user_id: String,
        request: RtcIssueParticipantCredentialRequest,
    ) -> RtcAppApiFuture<RtcParticipantCredential> {
        let service = self.clone();
        Box::pin(async move {
            service
                .issue_participant_credential_impl(tenant_id, organization_id, user_id, request)
                .await
        })
    }

    fn list_recording_artifacts(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_session_id: String,
        _cursor: Option<String>,
        _limit: Option<u32>,
    ) -> RtcAppApiFuture<RtcAppMediaArtifactListData> {
        let service = self.clone();
        Box::pin(async move {
            service.list_recording_artifacts_impl(tenant_id, organization_id, media_session_id)
        })
    }
}

impl RtcBackendApiService for RtcProductService {
    fn list_rooms(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcBackendRoomListData> {
        let service = self.clone();
        Box::pin(async move {
            let result = RtcAppApiService::list_rooms(
                &service,
                RtcListRequest {
                    tenant_id: request.tenant_id,
                    organization_id: request.organization_id,
                    cursor: request.cursor,
                    limit: request.limit,
                },
            )
            .await
            .map_err(backend_error_from_app)?;
            Ok(RtcListData {
                items: result.items,
                next_cursor: result.next_cursor,
            })
        })
    }

    fn retrieve_room(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        room_id: String,
    ) -> RtcBackendApiFuture<RtcRoom> {
        let service = self.clone();
        Box::pin(async move {
            service
                .retrieve_room_impl(tenant_id, organization_id, room_id)
                .map_err(backend_error_from_app)
        })
    }

    fn list_provider_accounts(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcProviderAccountListData> {
        let service = self.clone();
        Box::pin(async move { service.list_provider_accounts_impl(request) })
    }

    fn create_provider_account(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        request: RtcProviderAccountCommand,
    ) -> RtcBackendApiFuture<RtcProviderAccount> {
        let service = self.clone();
        Box::pin(async move {
            service
                .upsert_provider_account_impl(tenant_id, organization_id, actor_id, None, request)
                .await
        })
    }

    fn retrieve_provider_account(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_account_id: String,
    ) -> RtcBackendApiFuture<RtcProviderAccount> {
        let service = self.clone();
        Box::pin(async move {
            service.retrieve_provider_account_impl(tenant_id, organization_id, provider_account_id)
        })
    }

    fn update_provider_account(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_account_id: String,
        request: RtcProviderAccountCommand,
    ) -> RtcBackendApiFuture<RtcProviderAccount> {
        let service = self.clone();
        Box::pin(async move {
            service
                .upsert_provider_account_impl(
                    tenant_id,
                    organization_id,
                    actor_id,
                    Some(provider_account_id),
                    request,
                )
                .await
        })
    }

    fn disable_provider_account(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_account_id: String,
        request: RtcProviderAccountDisableRequest,
    ) -> RtcBackendApiFuture<RtcProviderAccount> {
        let service = self.clone();
        Box::pin(async move {
            service
                .disable_provider_account_impl(
                    tenant_id,
                    organization_id,
                    actor_id,
                    provider_account_id,
                    request,
                )
                .await
        })
    }

    fn list_provider_applications(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_account_id: String,
        _cursor: Option<String>,
        _limit: Option<u32>,
    ) -> RtcBackendApiFuture<RtcProviderApplicationListData> {
        let service = self.clone();
        Box::pin(async move {
            service.list_provider_applications_impl(tenant_id, organization_id, provider_account_id)
        })
    }

    fn create_provider_application(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_account_id: String,
        request: RtcProviderApplicationCommand,
    ) -> RtcBackendApiFuture<RtcProviderApplication> {
        let service = self.clone();
        Box::pin(async move {
            service
                .upsert_provider_application_impl(
                    tenant_id,
                    organization_id,
                    actor_id,
                    Some(provider_account_id),
                    None,
                    request,
                )
                .await
        })
    }

    fn retrieve_provider_application(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_application_id: String,
    ) -> RtcBackendApiFuture<RtcProviderApplication> {
        let service = self.clone();
        Box::pin(async move {
            service.retrieve_provider_application_impl(
                tenant_id,
                organization_id,
                provider_application_id,
            )
        })
    }

    fn update_provider_application(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_application_id: String,
        request: RtcProviderApplicationCommand,
    ) -> RtcBackendApiFuture<RtcProviderApplication> {
        let service = self.clone();
        Box::pin(async move {
            service
                .upsert_provider_application_impl(
                    tenant_id,
                    organization_id,
                    actor_id,
                    None,
                    Some(provider_application_id),
                    request,
                )
                .await
        })
    }

    fn disable_provider_application(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_application_id: String,
        request: RtcProviderApplicationDisableRequest,
    ) -> RtcBackendApiFuture<RtcProviderApplication> {
        let service = self.clone();
        Box::pin(async move {
            service
                .disable_provider_application_impl(
                    tenant_id,
                    organization_id,
                    actor_id,
                    provider_application_id,
                    request,
                )
                .await
        })
    }

    fn list_provider_credentials(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_application_id: String,
        _cursor: Option<String>,
        _limit: Option<u32>,
    ) -> RtcBackendApiFuture<RtcProviderCredentialListData> {
        let service = self.clone();
        Box::pin(async move {
            service.list_provider_credentials_impl(
                tenant_id,
                organization_id,
                provider_application_id,
            )
        })
    }

    fn create_provider_credential(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_application_id: String,
        request: RtcProviderCredentialCommand,
    ) -> RtcBackendApiFuture<RtcProviderCredential> {
        let service = self.clone();
        Box::pin(async move {
            service
                .upsert_provider_credential_impl(
                    tenant_id,
                    organization_id,
                    actor_id,
                    Some(provider_application_id),
                    None,
                    request,
                )
                .await
        })
    }

    fn retrieve_provider_credential(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_credential_id: String,
    ) -> RtcBackendApiFuture<RtcProviderCredential> {
        let service = self.clone();
        Box::pin(async move {
            service.retrieve_provider_credential_impl(
                tenant_id,
                organization_id,
                provider_credential_id,
            )
        })
    }

    fn update_provider_credential(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_credential_id: String,
        request: RtcProviderCredentialCommand,
    ) -> RtcBackendApiFuture<RtcProviderCredential> {
        let service = self.clone();
        Box::pin(async move {
            service
                .upsert_provider_credential_impl(
                    tenant_id,
                    organization_id,
                    actor_id,
                    None,
                    Some(provider_credential_id),
                    request,
                )
                .await
        })
    }

    fn revoke_provider_credential(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_credential_id: String,
        request: RtcProviderCredentialRevokeRequest,
    ) -> RtcBackendApiFuture<RtcProviderCredential> {
        let service = self.clone();
        Box::pin(async move {
            service
                .revoke_provider_credential_impl(
                    tenant_id,
                    organization_id,
                    actor_id,
                    provider_credential_id,
                    request,
                )
                .await
        })
    }

    fn list_provider_profiles(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcProviderProfileListData> {
        let service = self.clone();
        Box::pin(async move { service.list_backend_provider_profiles_impl(request) })
    }

    fn create_provider_profile(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        request: RtcProviderProfileCommand,
    ) -> RtcBackendApiFuture<RtcProviderProfile> {
        let service = self.clone();
        Box::pin(async move {
            service
                .upsert_provider_profile_impl(tenant_id, organization_id, actor_id, None, request)
                .await
        })
    }

    fn retrieve_provider_profile(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_profile_id: String,
    ) -> RtcBackendApiFuture<RtcProviderProfile> {
        let service = self.clone();
        Box::pin(async move {
            service.retrieve_provider_profile_impl(tenant_id, organization_id, provider_profile_id)
        })
    }

    fn update_provider_profile(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_profile_id: String,
        request: RtcProviderProfileCommand,
    ) -> RtcBackendApiFuture<RtcProviderProfile> {
        let service = self.clone();
        Box::pin(async move {
            service
                .upsert_provider_profile_impl(
                    tenant_id,
                    organization_id,
                    actor_id,
                    Some(provider_profile_id),
                    request,
                )
                .await
        })
    }

    fn disable_provider_profile(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        provider_profile_id: String,
        request: RtcProviderProfileDisableRequest,
    ) -> RtcBackendApiFuture<RtcProviderProfile> {
        let service = self.clone();
        Box::pin(async move {
            service
                .disable_provider_profile_impl(
                    tenant_id,
                    organization_id,
                    actor_id,
                    provider_profile_id,
                    request,
                )
                .await
        })
    }

    fn verify_provider_profile(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        _actor_id: String,
        provider_profile_id: String,
        request: RtcProviderProfileVerifyRequest,
    ) -> RtcBackendApiFuture<RtcProviderProfileVerifyResult> {
        let service = self.clone();
        Box::pin(async move {
            service
                .verify_provider_profile_impl(
                    tenant_id,
                    organization_id,
                    provider_profile_id,
                    request,
                )
                .await
        })
    }

    fn list_provider_routes(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcProviderRouteListData> {
        let service = self.clone();
        Box::pin(async move {
            let state = service.state.lock().expect("rtc product state lock");
            Ok(RtcProviderRouteListData {
                items: state
                    .provider_routes
                    .values()
                    .filter(|route| {
                        route.tenant_id == request.tenant_id
                            && organization_matches(
                                &route.organization_id,
                                request.organization_id.as_deref(),
                            )
                    })
                    .cloned()
                    .collect(),
                next_cursor: None,
            })
        })
    }

    fn create_provider_route(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        _actor_id: String,
        request: RtcProviderRouteCommand,
    ) -> RtcBackendApiFuture<RtcProviderRoute> {
        let service = self.clone();
        Box::pin(async move {
            let route_type = request.route_type.trim().to_string();
            if route_type.is_empty() {
                return Err(RtcBackendApiError::BadRequest(
                    "RTC provider route type is required".to_string(),
                ));
            }
            if route_type != RTC_PROVIDER_ROUTE_TYPE_REGION {
                return Err(RtcBackendApiError::BadRequest(format!(
                    "Unsupported RTC provider route type: {route_type}"
                )));
            }
            let region = normalized_optional_string(request.region.as_deref());
            if region.is_none() {
                return Err(RtcBackendApiError::BadRequest(
                    "RTC provider region route requires region".to_string(),
                ));
            }
            let status = request.status.unwrap_or(RtcProviderRouteStatus::Active);
            let route = {
                let mut state = service.state.lock().expect("rtc product state lock");
                let organization_id = organization_id.unwrap_or_else(|| "0".to_string());
                let profile = scoped_provider_profile(
                    &state,
                    tenant_id.as_str(),
                    organization_id.as_str(),
                    request.provider_profile_id.as_str(),
                )
                .map_err(backend_error_from_product)?;
                if !provider_profile_is_selectable(profile) {
                    return Err(RtcBackendApiError::Unavailable(format!(
                        "RTC provider profile is not active: {}",
                        profile.id
                    )));
                }
                let id = state.next_provider_route_id();
                let route = RtcProviderRoute {
                    id: id.clone(),
                    tenant_id,
                    organization_id,
                    provider_profile_id: request.provider_profile_id,
                    route_type,
                    region,
                    priority: request.priority,
                    status,
                };
                state.provider_routes.insert(id, route.clone());
                route
            };
            service
                .persist_changes(RtcPersistenceChangeSet {
                    provider_routes: vec![route.clone()],
                    ..RtcPersistenceChangeSet::default()
                })
                .await
                .map_err(backend_error_from_product)?;
            Ok(route)
        })
    }

    fn list_media_sessions(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcBackendMediaSessionListData> {
        let service = self.clone();
        Box::pin(async move {
            service
                .list_media_sessions_impl(RtcListRequest {
                    tenant_id: request.tenant_id,
                    organization_id: request.organization_id,
                    cursor: request.cursor,
                    limit: request.limit,
                })
                .map_err(backend_error_from_app)
                .map(|result| RtcListData {
                    items: result.items,
                    next_cursor: result.next_cursor,
                })
        })
    }

    fn retrieve_media_session(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_session_id: String,
    ) -> RtcBackendApiFuture<RtcMediaSession> {
        let service = self.clone();
        Box::pin(async move {
            service
                .retrieve_media_session_impl(tenant_id, organization_id, media_session_id)
                .map_err(backend_error_from_app)
        })
    }

    fn retrieve_media_session_completion_record(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_session_id: String,
    ) -> RtcBackendApiFuture<RtcMediaSessionCompletionRecord> {
        let service = self.clone();
        Box::pin(async move {
            service
                .retrieve_completion_record_impl(tenant_id, organization_id, media_session_id)
                .map_err(backend_error_from_app)
        })
    }

    fn close_media_session(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        media_session_id: String,
        request: RtcCloseMediaSessionRequest,
    ) -> RtcBackendApiFuture<RtcMediaSession> {
        let service = self.clone();
        Box::pin(async move {
            service
                .close_media_session_impl(
                    tenant_id,
                    organization_id,
                    actor_id,
                    media_session_id,
                    request,
                )
                .await
        })
    }

    fn list_media_artifacts(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcMediaArtifactListData> {
        let service = self.clone();
        Box::pin(async move {
            let state = service.state.lock().expect("rtc product state lock");
            Ok(RtcMediaArtifactListData {
                items: state
                    .artifacts
                    .values()
                    .filter(|artifact| {
                        media_artifact_matches_scope(
                            &state,
                            artifact,
                            &request.tenant_id,
                            request.organization_id.as_deref(),
                        )
                    })
                    .cloned()
                    .collect(),
                next_cursor: None,
            })
        })
    }

    fn retrieve_media_artifact(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        media_artifact_id: String,
    ) -> RtcBackendApiFuture<RtcMediaArtifact> {
        let service = self.clone();
        Box::pin(async move {
            let state = service.state.lock().expect("rtc product state lock");
            state
                .artifacts
                .get(media_artifact_id.as_str())
                .filter(|artifact| {
                    media_artifact_matches_scope(
                        &state,
                        artifact,
                        &tenant_id,
                        organization_id.as_deref(),
                    )
                })
                .cloned()
                .ok_or_else(|| {
                    RtcBackendApiError::NotFound(format!(
                        "RTC media artifact not found: {media_artifact_id}"
                    ))
                })
        })
    }

    fn list_quality_samples(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcQualitySampleListData> {
        let service = self.clone();
        Box::pin(async move {
            let state = service.state.lock().expect("rtc product state lock");
            Ok(RtcQualitySampleListData {
                items: state
                    .quality_samples
                    .values()
                    .filter(|sample| {
                        state
                            .sessions
                            .get(sample.session_id.as_str())
                            .is_some_and(|session| {
                                session.tenant_id == request.tenant_id
                                    && organization_matches(
                                        &session.organization_id,
                                        request.organization_id.as_deref(),
                                    )
                            })
                    })
                    .cloned()
                    .collect(),
                next_cursor: None,
            })
        })
    }

    fn list_provider_webhook_events(
        &self,
        request: RtcBackendListRequest,
    ) -> RtcBackendApiFuture<RtcProviderWebhookEventListData> {
        let service = self.clone();
        Box::pin(async move {
            let state = service.state.lock().expect("rtc product state lock");
            Ok(RtcProviderWebhookEventListData {
                items: state
                    .webhook_events
                    .values()
                    .filter(|event| {
                        event.tenant_id == request.tenant_id
                            && organization_matches(
                                &event.organization_id,
                                request.organization_id.as_deref(),
                            )
                            && request
                                .provider
                                .as_deref()
                                .map_or(true, |provider| event.provider == provider)
                    })
                    .cloned()
                    .collect(),
                next_cursor: None,
            })
        })
    }

    fn receive_provider_webhook_event(
        &self,
        provider: String,
        request: RtcProviderWebhookReceiveRequest,
    ) -> RtcBackendApiFuture<RtcProviderWebhookEventRecord> {
        let service = self.clone();
        Box::pin(async move {
            service
                .receive_provider_webhook_impl(provider, request)
                .await
        })
    }

    fn create_provider_query_job(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        actor_id: String,
        request: RtcProviderQueryJobCreateRequest,
    ) -> RtcBackendApiFuture<RtcProviderQueryJobRecord> {
        let service = self.clone();
        Box::pin(async move {
            service
                .create_provider_query_job_impl(tenant_id, organization_id, actor_id, request)
                .await
        })
    }

    fn retrieve_provider_query_job(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_query_job_id: String,
    ) -> RtcBackendApiFuture<RtcProviderQueryJobRecord> {
        let service = self.clone();
        Box::pin(async move {
            let state = service.state.lock().expect("rtc product state lock");
            state
                .query_jobs
                .get(provider_query_job_id.as_str())
                .filter(|job| {
                    job.tenant_id == tenant_id
                        && organization_matches(&job.organization_id, organization_id.as_deref())
                })
                .cloned()
                .ok_or_else(|| {
                    RtcBackendApiError::NotFound(format!(
                        "RTC provider query job not found: {provider_query_job_id}"
                    ))
                })
        })
    }

    fn list_provider_query_snapshots(
        &self,
        tenant_id: String,
        organization_id: Option<String>,
        provider_query_job_id: String,
        _cursor: Option<String>,
        _limit: Option<u32>,
    ) -> RtcBackendApiFuture<RtcProviderQuerySnapshotListData> {
        let service = self.clone();
        Box::pin(async move {
            let state = service.state.lock().expect("rtc product state lock");
            Ok(RtcProviderQuerySnapshotListData {
                items: state
                    .query_snapshots
                    .values()
                    .filter(|snapshot| {
                        snapshot.tenant_id == tenant_id
                            && snapshot.provider_query_job_id == provider_query_job_id
                            && organization_matches(
                                &snapshot.organization_id,
                                organization_id.as_deref(),
                            )
                    })
                    .cloned()
                    .collect(),
                next_cursor: None,
            })
        })
    }
}

#[derive(Default)]
struct RtcProductState {
    rooms: BTreeMap<String, RtcRoom>,
    sessions: BTreeMap<String, RtcMediaSession>,
    participants: BTreeMap<String, RtcMediaParticipant>,
    artifacts: BTreeMap<String, RtcMediaArtifact>,
    quality_samples: BTreeMap<String, RtcQualitySample>,
    completion_records: BTreeMap<String, RtcMediaSessionCompletionRecord>,
    provider_accounts: BTreeMap<String, RtcProviderAccount>,
    provider_applications: BTreeMap<String, RtcProviderApplication>,
    provider_credentials: BTreeMap<String, RtcProviderCredential>,
    provider_profiles: BTreeMap<String, RtcProviderProfile>,
    provider_routes: BTreeMap<String, RtcProviderRoute>,
    webhook_events: BTreeMap<String, RtcProviderWebhookEventRecord>,
    query_jobs: BTreeMap<String, RtcProviderQueryJobRecord>,
    query_snapshots: BTreeMap<String, RtcProviderQuerySnapshotRecord>,
    next_session_sequence: u64,
    next_artifact_sequence: u64,
    next_webhook_event_sequence: u64,
    next_provider_query_snapshot_sequence: u64,
    next_provider_route_sequence: u64,
}

impl RtcProductState {
    fn next_session_id(&mut self) -> String {
        self.next_session_sequence += 1;
        format!("session-{}", self.next_session_sequence)
    }

    fn next_media_artifact_id(&mut self) -> String {
        self.next_artifact_sequence += 1;
        format!("artifact-{}", self.next_artifact_sequence)
    }

    fn next_webhook_event_id(&mut self) -> String {
        self.next_webhook_event_sequence += 1;
        format!("webhook-event-{}", self.next_webhook_event_sequence)
    }

    fn next_provider_query_snapshot_id(&mut self) -> String {
        self.next_provider_query_snapshot_sequence += 1;
        format!(
            "provider-query-snapshot-{}",
            self.next_provider_query_snapshot_sequence
        )
    }

    fn next_provider_route_id(&mut self) -> String {
        self.next_provider_route_sequence += 1;
        format!("provider-route-{}", self.next_provider_route_sequence)
    }
}

#[derive(Debug)]
enum RtcProductError {
    BadRequest(String),
    Forbidden(String),
    NotFound(String),
    Unavailable(String),
    Conflict(String),
}

impl From<RtcProviderPluginRegistryError> for RtcProductError {
    fn from(error: RtcProviderPluginRegistryError) -> Self {
        match error {
            RtcProviderPluginRegistryError::MissingDefaultProvider => {
                Self::Unavailable(error.to_string())
            }
            RtcProviderPluginRegistryError::MissingProvider { .. } => {
                Self::Unavailable(error.to_string())
            }
            RtcProviderPluginRegistryError::DuplicateProvider { .. } => {
                Self::Conflict(error.to_string())
            }
            RtcProviderPluginRegistryError::ProviderDescriptorMismatch { .. } => {
                Self::Conflict(error.to_string())
            }
        }
    }
}

impl From<RtcContractError> for RtcProductError {
    fn from(error: RtcContractError) -> Self {
        match error {
            RtcContractError::UnsupportedCapability(message) => Self::Unavailable(message),
            RtcContractError::Conflict(message) => Self::Conflict(message),
            RtcContractError::Unavailable(message) => Self::Unavailable(message),
        }
    }
}

impl From<RtcPersistenceError> for RtcProductError {
    fn from(error: RtcPersistenceError) -> Self {
        match error {
            RtcPersistenceError::Conflict(message) => Self::Conflict(message),
            RtcPersistenceError::Unavailable(message) => Self::Unavailable(message),
        }
    }
}

fn app_error_from_product(error: RtcProductError) -> RtcAppApiError {
    match error {
        RtcProductError::BadRequest(message) => RtcAppApiError::BadRequest(message),
        RtcProductError::Forbidden(message) => RtcAppApiError::Forbidden(message),
        RtcProductError::NotFound(message) => RtcAppApiError::NotFound(message),
        RtcProductError::Unavailable(message) => RtcAppApiError::Unavailable(message),
        RtcProductError::Conflict(message) => RtcAppApiError::Conflict(message),
    }
}

fn backend_error_from_product(error: RtcProductError) -> RtcBackendApiError {
    match error {
        RtcProductError::BadRequest(message) => RtcBackendApiError::BadRequest(message),
        RtcProductError::Forbidden(message) => RtcBackendApiError::Forbidden(message),
        RtcProductError::NotFound(message) => RtcBackendApiError::NotFound(message),
        RtcProductError::Unavailable(message) => RtcBackendApiError::Unavailable(message),
        RtcProductError::Conflict(message) => RtcBackendApiError::Conflict(message),
    }
}

fn app_error_from_registry(error: RtcProviderPluginRegistryError) -> RtcAppApiError {
    app_error_from_product(error.into())
}

fn backend_error_from_registry(error: RtcProviderPluginRegistryError) -> RtcBackendApiError {
    backend_error_from_product(error.into())
}

fn app_error_from_contract(error: RtcContractError) -> RtcAppApiError {
    app_error_from_product(error.into())
}

fn backend_error_from_contract(error: RtcContractError) -> RtcBackendApiError {
    backend_error_from_product(error.into())
}

fn backend_error_from_app(error: RtcAppApiError) -> RtcBackendApiError {
    match error {
        RtcAppApiError::BadRequest(message) => RtcBackendApiError::BadRequest(message),
        RtcAppApiError::Forbidden(message) => RtcBackendApiError::Forbidden(message),
        RtcAppApiError::NotFound(message) => RtcBackendApiError::NotFound(message),
        RtcAppApiError::Conflict(message) => RtcBackendApiError::Conflict(message),
        RtcAppApiError::Unavailable(message) => RtcBackendApiError::Unavailable(message),
        RtcAppApiError::Internal(message) => RtcBackendApiError::Internal(message),
    }
}

fn profile_id(tenant_id: &str, organization_id: &str, provider: &str, code: &str) -> String {
    format!("profile-{tenant_id}-{organization_id}-{provider}-{code}")
}

fn provider_account_id_for(
    tenant_id: &str,
    organization_id: &str,
    provider: &str,
    code: &str,
) -> String {
    format!("provider-account-{tenant_id}-{organization_id}-{provider}-{code}")
}

fn provider_application_id_for(provider_account_id: &str, code: &str) -> String {
    format!("provider-application-{provider_account_id}-{code}")
}

fn provider_credential_id_for(
    provider_application_id: &str,
    role: &RtcProviderCredentialRole,
    label: &str,
) -> String {
    format!(
        "provider-credential-{provider_application_id}-{}-{label}",
        provider_credential_role_key(role)
    )
}

fn next_version(existing_version: Option<&str>) -> String {
    existing_version
        .and_then(|version| version.parse::<u64>().ok())
        .map_or(0, |version| version.saturating_add(1))
        .to_string()
}

fn normalized_required_string(field: &str, value: &str) -> Result<String, RtcBackendApiError> {
    let value = value.trim();
    if value.is_empty() {
        return Err(RtcBackendApiError::BadRequest(format!(
            "RTC {field} is required"
        )));
    }
    Ok(value.to_string())
}

fn ensure_secret_reference(field: &str, value: &str) -> Result<(), RtcBackendApiError> {
    let value = value.trim().to_ascii_lowercase();
    if value.starts_with("secret://")
        || value.starts_with("secrets://")
        || value.starts_with("vault://")
        || value.starts_with("kms://")
        || value.starts_with("sm://")
        || value.starts_with("arn:")
    {
        return Ok(());
    }
    Err(RtcBackendApiError::BadRequest(format!(
        "{field} must be a secret reference managed by secure storage"
    )))
}

fn provider_account_status_key(status: &RtcProviderAccountStatus) -> &'static str {
    match status {
        RtcProviderAccountStatus::Active => "active",
        RtcProviderAccountStatus::Disabled => "disabled",
        RtcProviderAccountStatus::Archived => "archived",
    }
}

fn provider_credential_role_key(role: &RtcProviderCredentialRole) -> &'static str {
    match role {
        RtcProviderCredentialRole::RtcTokenSigning => "rtc_token_signing",
        RtcProviderCredentialRole::OpenApiSigning => "open_api_signing",
        RtcProviderCredentialRole::UserSigSigning => "usersig_signing",
        RtcProviderCredentialRole::CloudApiSigning => "cloud_api_signing",
        RtcProviderCredentialRole::WebhookSigning => "webhook_signing",
    }
}

fn validate_provider_application_id_kind(
    provider: &str,
    id_kind: &str,
) -> Result<(), RtcBackendApiError> {
    let required_kind = match provider {
        "volcengine" => Some("volcengine_app_id"),
        "tencent" => Some("tencent_sdk_app_id"),
        _ => None,
    };
    if let Some(required_kind) = required_kind
        && id_kind != required_kind
    {
        return Err(RtcBackendApiError::BadRequest(format!(
            "RTC provider {provider} requires providerApplicationIdKind {required_kind}"
        )));
    }
    Ok(())
}

fn required_credential_roles(provider: &str) -> &'static [RtcProviderCredentialRole] {
    match provider {
        "volcengine" => &[
            RtcProviderCredentialRole::RtcTokenSigning,
            RtcProviderCredentialRole::OpenApiSigning,
        ],
        "tencent" => &[
            RtcProviderCredentialRole::UserSigSigning,
            RtcProviderCredentialRole::CloudApiSigning,
        ],
        _ => &[],
    }
}

fn update_application_credential_health<'a, I>(
    application: &mut RtcProviderApplication,
    credentials: I,
    checked_at: &str,
) where
    I: IntoIterator<Item = &'a RtcProviderCredential>,
{
    let active_roles = credentials
        .into_iter()
        .filter(|credential| {
            credential.provider_application_id == application.id && credential.is_active()
        })
        .map(|credential| credential.credential_role.clone())
        .collect::<Vec<_>>();
    let missing_roles = required_credential_roles(application.provider.as_str())
        .iter()
        .filter(|required_role| !active_roles.iter().any(|role| role == *required_role))
        .map(provider_credential_role_key)
        .collect::<Vec<_>>();

    application.last_verified_at = Some(checked_at.to_string());
    application.last_verification_error = if missing_roles.is_empty() {
        None
    } else {
        Some(format!(
            "missing active provider credential roles: {}",
            missing_roles.join(", ")
        ))
    };
}

fn ensure_active_provider_account(account: &RtcProviderAccount) -> Result<(), RtcProductError> {
    if account.status != RtcProviderAccountStatus::Active || account.deleted_at.is_some() {
        return Err(RtcProductError::Unavailable(format!(
            "RTC provider account is not active: {}",
            account.id
        )));
    }
    Ok(())
}

fn ensure_active_provider_application(
    application: &RtcProviderApplication,
) -> Result<(), RtcProductError> {
    if application.status != RtcProviderApplicationStatus::Active
        || application.deleted_at.is_some()
    {
        return Err(RtcProductError::Unavailable(format!(
            "RTC provider application is not active: {}",
            application.id
        )));
    }
    Ok(())
}

fn scoped_provider_account<'a>(
    state: &'a RtcProductState,
    tenant_id: &str,
    organization_id: Option<&str>,
    provider_account_id: &str,
) -> Result<&'a RtcProviderAccount, RtcProductError> {
    state
        .provider_accounts
        .get(provider_account_id)
        .filter(|account| {
            account.tenant_id == tenant_id
                && organization_matches(&account.organization_id, organization_id)
                && account.deleted_at.is_none()
        })
        .ok_or_else(|| {
            RtcProductError::NotFound(format!(
                "RTC provider account not found: {provider_account_id}"
            ))
        })
}

fn scoped_provider_application<'a>(
    state: &'a RtcProductState,
    tenant_id: &str,
    organization_id: Option<&str>,
    provider_application_id: &str,
) -> Result<&'a RtcProviderApplication, RtcProductError> {
    state
        .provider_applications
        .get(provider_application_id)
        .filter(|application| {
            application.tenant_id == tenant_id
                && organization_matches(&application.organization_id, organization_id)
                && application.deleted_at.is_none()
        })
        .ok_or_else(|| {
            RtcProductError::NotFound(format!(
                "RTC provider application not found: {provider_application_id}"
            ))
        })
}

fn provider_profile_matches_scope(
    profile: &RtcProviderProfile,
    tenant_id: &str,
    organization_id: &str,
) -> bool {
    profile.tenant_id == tenant_id && profile.organization_id == organization_id
}

fn provider_profile_is_selectable(profile: &RtcProviderProfile) -> bool {
    profile.status == RtcProviderProfileStatus::Active && profile.deleted_at.is_none()
}

fn ensure_selectable_provider_profile(
    profile: &RtcProviderProfile,
    tenant_id: &str,
    organization_id: &str,
    provider: Option<&str>,
) -> Result<(), RtcProductError> {
    if !provider_profile_matches_scope(profile, tenant_id, organization_id) {
        return Err(RtcProductError::NotFound(format!(
            "RTC provider profile not found: {}",
            profile.id
        )));
    }
    if let Some(provider) = provider
        && profile.provider != provider
    {
        return Err(RtcProductError::BadRequest(format!(
            "RTC provider profile {} belongs to provider {}, not {}",
            profile.id, profile.provider, provider
        )));
    }
    if !provider_profile_is_selectable(profile) {
        return Err(RtcProductError::Unavailable(format!(
            "RTC provider profile is not active: {}",
            profile.id
        )));
    }
    Ok(())
}

fn scoped_provider_profile<'a>(
    state: &'a RtcProductState,
    tenant_id: &str,
    organization_id: &str,
    provider_profile_id: &str,
) -> Result<&'a RtcProviderProfile, RtcProductError> {
    state
        .provider_profiles
        .get(provider_profile_id)
        .filter(|profile| {
            provider_profile_matches_scope(profile, tenant_id, organization_id)
                && profile.deleted_at.is_none()
        })
        .ok_or_else(|| {
            RtcProductError::NotFound(format!(
                "RTC provider profile not found: {provider_profile_id}"
            ))
        })
}

fn provider_profile_by_id<'a>(
    state: &'a RtcProductState,
    provider_profile_id: &str,
) -> Result<&'a RtcProviderProfile, RtcProductError> {
    state
        .provider_profiles
        .get(provider_profile_id)
        .filter(|profile| profile.deleted_at.is_none())
        .ok_or_else(|| {
            RtcProductError::BadRequest(format!(
                "RTC provider webhook references unknown provider profile: {provider_profile_id}"
            ))
        })
}

fn ensure_session_provider_binding<'a>(
    state: &'a RtcProductState,
    session: &RtcMediaSession,
    provider: &str,
    provider_profile_id: Option<&str>,
) -> Result<&'a RtcProviderProfile, RtcProductError> {
    let session_provider_profile_id = session.provider_profile_id.as_deref().ok_or_else(|| {
        RtcProductError::Unavailable(format!(
            "RTC media session has no provider profile binding: {}",
            session.id
        ))
    })?;
    if let Some(provider_profile_id) = provider_profile_id
        && provider_profile_id != session_provider_profile_id
    {
        return Err(RtcProductError::BadRequest(format!(
            "RTC provider profile {provider_profile_id} does not own media session {}",
            session.id
        )));
    }

    let profile = state
        .provider_profiles
        .get(session_provider_profile_id)
        .filter(|profile| profile.deleted_at.is_none())
        .ok_or_else(|| {
            RtcProductError::Unavailable(format!(
                "RTC media session provider profile is not configured: {session_provider_profile_id}"
            ))
        })?;
    if profile.provider != provider {
        return Err(RtcProductError::BadRequest(format!(
            "RTC media session {} belongs to provider {}, not {}",
            session.id, profile.provider, provider
        )));
    }
    Ok(profile)
}

fn provider_session_id_matches_session(
    session: &RtcMediaSession,
    provider_session_id: &str,
    provider: &str,
) -> bool {
    if session.provider_session_id.as_deref() == Some(provider_session_id) {
        return true;
    }
    if provider_session_id == session.id {
        return true;
    }
    provider_session_id
        .split_once(':')
        .is_some_and(|(provider_key, rtc_session_id)| {
            provider_key == provider && rtc_session_id == session.id
        })
}

fn resolve_session_by_provider_session_id<'a>(
    state: &'a RtcProductState,
    provider_session_id: &str,
    provider: &str,
) -> Option<&'a RtcMediaSession> {
    state
        .sessions
        .values()
        .find(|session| provider_session_id_matches_session(session, provider_session_id, provider))
}

fn validate_provider_query_result_binding(
    state: &RtcProductState,
    tenant_id: &str,
    organization_id: &str,
    result: &RtcProviderQueryResult,
) -> Result<(), RtcProductError> {
    let provider_profile_id = result.provider_profile_id.as_deref().ok_or_else(|| {
        RtcProductError::BadRequest(
            "RTC provider query result requires provider profile id".to_string(),
        )
    })?;
    let profile = scoped_provider_profile(state, tenant_id, organization_id, provider_profile_id)?;
    if profile.provider != result.provider {
        return Err(RtcProductError::BadRequest(format!(
            "RTC provider query profile {} belongs to provider {}, not {}",
            profile.id, profile.provider, result.provider
        )));
    }

    if let Some(media_session_id) = result.rtc_session_id.as_deref() {
        let session = state
            .sessions
            .get(media_session_id)
            .filter(|session| {
                session.tenant_id == tenant_id && session.organization_id == organization_id
            })
            .ok_or_else(|| {
                RtcProductError::NotFound(format!(
                    "RTC media session not found: {media_session_id}"
                ))
            })?;
        ensure_session_provider_binding(
            state,
            session,
            result.provider.as_str(),
            result.provider_profile_id.as_deref(),
        )?;
        if let Some(room_id) = result.room_id.as_deref()
            && room_id != session.room_id
        {
            return Err(RtcProductError::BadRequest(format!(
                "RTC provider query room {room_id} does not match media session room {}",
                session.room_id
            )));
        }
        if let Some(provider_session_id) = result.provider_session_id.as_deref()
            && !provider_session_id_matches_session(
                session,
                provider_session_id,
                result.provider.as_str(),
            )
        {
            return Err(RtcProductError::BadRequest(format!(
                "RTC provider query session {provider_session_id} does not match media session {}",
                session.id
            )));
        }
        return Ok(());
    }

    if let Some(room_id) = result.room_id.as_deref() {
        state
            .rooms
            .get(room_id)
            .filter(|room| room.tenant_id == tenant_id && room.organization_id == organization_id)
            .ok_or_else(|| RtcProductError::NotFound(format!("RTC room not found: {room_id}")))?;
    }
    if let Some(provider_session_id) = result.provider_session_id.as_deref()
        && let Some((provider_key, _)) = provider_session_id.split_once(':')
        && provider_key != result.provider
    {
        return Err(RtcProductError::BadRequest(format!(
            "RTC provider query session {provider_session_id} belongs to provider {provider_key}, not {}",
            result.provider
        )));
    }

    Ok(())
}

fn normalize_provider_query_result(
    result: &mut RtcProviderQueryResult,
    request: &RtcProviderQueryRequest,
) -> Result<(), RtcBackendApiError> {
    if result.provider != request.provider {
        return Err(RtcBackendApiError::BadRequest(format!(
            "RTC provider query returned provider {}, not {}",
            result.provider, request.provider
        )));
    }
    if result.query_kind != request.query_kind {
        return Err(RtcBackendApiError::BadRequest(
            "RTC provider query returned a different query kind".to_string(),
        ));
    }
    if let Some(provider_profile_id) = request.provider_profile_id.as_deref() {
        if let Some(result_provider_profile_id) = result.provider_profile_id.as_deref()
            && result_provider_profile_id != provider_profile_id
        {
            return Err(RtcBackendApiError::BadRequest(format!(
                "RTC provider query returned provider profile {result_provider_profile_id}, not {provider_profile_id}"
            )));
        }
        result.provider_profile_id = Some(provider_profile_id.to_string());
    }
    if let Some(rtc_session_id) = request.rtc_session_id.as_deref() {
        if let Some(result_rtc_session_id) = result.rtc_session_id.as_deref()
            && result_rtc_session_id != rtc_session_id
        {
            return Err(RtcBackendApiError::BadRequest(format!(
                "RTC provider query returned media session {result_rtc_session_id}, not {rtc_session_id}"
            )));
        }
        result.rtc_session_id = Some(rtc_session_id.to_string());
    }
    if let Some(room_id) = request.room_id.as_deref() {
        if let Some(result_room_id) = result.room_id.as_deref()
            && result_room_id != room_id
        {
            return Err(RtcBackendApiError::BadRequest(format!(
                "RTC provider query returned room {result_room_id}, not {room_id}"
            )));
        }
        result.room_id = Some(room_id.to_string());
    }
    if result.provider_session_id.is_none() {
        result.provider_session_id = request.provider_session_id.clone();
    }
    Ok(())
}

fn select_scoped_provider_profile<'a>(
    state: &'a RtcProductState,
    tenant_id: &str,
    organization_id: &str,
    provider: Option<&str>,
    default_provider: Option<&str>,
) -> Result<&'a RtcProviderProfile, RtcProductError> {
    let mut candidates = state
        .provider_profiles
        .values()
        .filter(|profile| provider_profile_matches_scope(profile, tenant_id, organization_id))
        .filter(|profile| provider_profile_is_selectable(profile))
        .filter(|profile| provider.map_or(true, |provider| profile.provider == provider))
        .collect::<Vec<_>>();
    if candidates.is_empty() {
        let provider_detail = provider
            .map(|provider| format!(" for provider {provider}"))
            .unwrap_or_default();
        return Err(RtcProductError::Unavailable(format!(
            "No active RTC provider profile is configured for tenant {tenant_id} organization {organization_id}{provider_detail}"
        )));
    }

    candidates.sort_by(|left, right| {
        right
            .is_default
            .cmp(&left.is_default)
            .then_with(|| {
                let left_matches_default = default_provider == Some(left.provider.as_str());
                let right_matches_default = default_provider == Some(right.provider.as_str());
                right_matches_default.cmp(&left_matches_default)
            })
            .then_with(|| left.priority.cmp(&right.priority))
            .then_with(|| left.provider.cmp(&right.provider))
            .then_with(|| left.code.cmp(&right.code))
            .then_with(|| left.id.cmp(&right.id))
    });
    Ok(candidates[0])
}

fn select_scoped_provider_profile_by_region_route<'a>(
    state: &'a RtcProductState,
    tenant_id: &str,
    organization_id: &str,
    provider: Option<&str>,
    region: &str,
) -> Result<Option<&'a RtcProviderProfile>, RtcProductError> {
    let region = region.trim();
    if region.is_empty() {
        return Ok(None);
    }

    let mut candidates = state
        .provider_routes
        .values()
        .filter(|route| route.tenant_id == tenant_id && route.organization_id == organization_id)
        .filter(|route| route.status == RtcProviderRouteStatus::Active)
        .filter(|route| route.route_type == RTC_PROVIDER_ROUTE_TYPE_REGION)
        .filter(|route| {
            route
                .region
                .as_deref()
                .map(str::trim)
                .is_some_and(|route_region| route_region == region)
        })
        .filter_map(|route| {
            state
                .provider_profiles
                .get(route.provider_profile_id.as_str())
                .map(|profile| (route, profile))
        })
        .filter(|(_, profile)| {
            provider_profile_matches_scope(profile, tenant_id, organization_id)
                && provider_profile_is_selectable(profile)
        })
        .filter(|(_, profile)| provider.map_or(true, |provider| profile.provider == provider))
        .collect::<Vec<_>>();

    candidates.sort_by(|(left_route, left_profile), (right_route, right_profile)| {
        left_route
            .priority
            .cmp(&right_route.priority)
            .then_with(|| left_profile.priority.cmp(&right_profile.priority))
            .then_with(|| left_profile.provider.cmp(&right_profile.provider))
            .then_with(|| left_profile.code.cmp(&right_profile.code))
            .then_with(|| left_profile.id.cmp(&right_profile.id))
    });

    Ok(candidates.first().map(|(_, profile)| *profile))
}

fn normalized_optional_filter(value: Option<&str>) -> Option<&str> {
    value.map(str::trim).filter(|value| !value.is_empty())
}

fn normalized_optional_string(value: Option<&str>) -> Option<String> {
    normalized_optional_filter(value).map(ToOwned::to_owned)
}

fn clear_scoped_default_provider_profiles(
    state: &mut RtcProductState,
    tenant_id: &str,
    organization_id: &str,
    selected_profile_id: &str,
) {
    let now = utc_now_rfc3339_millis();
    for profile in state.provider_profiles.values_mut() {
        if profile.id != selected_profile_id
            && profile.tenant_id == tenant_id
            && profile.organization_id == organization_id
            && profile.is_default
        {
            profile.is_default = false;
            profile.updated_at = Some(now.clone());
        }
    }
}

fn organization_matches(actual: &str, expected: Option<&str>) -> bool {
    expected.map_or(true, |expected| actual == expected)
}

fn media_artifact_matches_scope(
    state: &RtcProductState,
    artifact: &RtcMediaArtifact,
    tenant_id: &str,
    organization_id: Option<&str>,
) -> bool {
    artifact.tenant_id == tenant_id
        && state
            .sessions
            .get(artifact.rtc_session_id.as_str())
            .is_some_and(|session| organization_matches(&session.organization_id, organization_id))
}

fn validate_provider_webhook_event_binding(
    state: &RtcProductState,
    event: &RtcProviderWebhookEvent,
    media_session_id: Option<&str>,
) -> Result<Option<String>, RtcProductError> {
    let explicit_profile = if let Some(provider_profile_id) = event.provider_profile_id.as_deref() {
        let profile = provider_profile_by_id(state, provider_profile_id)?;
        if profile.provider != event.provider {
            return Err(RtcProductError::BadRequest(format!(
                "RTC provider webhook profile {} belongs to provider {}, not {}",
                profile.id, profile.provider, event.provider
            )));
        }
        if !provider_profile_is_selectable(profile) {
            return Err(RtcProductError::Unavailable(format!(
                "RTC provider profile is not active: {}",
                profile.id
            )));
        }
        Some(profile.id.clone())
    } else {
        None
    };

    if let Some(media_session_id) = media_session_id {
        let session = state.sessions.get(media_session_id).ok_or_else(|| {
            RtcProductError::NotFound(format!("RTC media session not found: {media_session_id}"))
        })?;
        let profile = ensure_session_provider_binding(
            state,
            session,
            event.provider.as_str(),
            explicit_profile.as_deref(),
        )?;
        if let Some(room_id) = event.room_id.as_deref()
            && room_id != session.room_id
        {
            return Err(RtcProductError::BadRequest(format!(
                "RTC provider webhook room {room_id} does not match media session room {}",
                session.room_id
            )));
        }
        if let Some(provider_session_id) = event.provider_session_id.as_deref()
            && !provider_session_id_matches_session(
                session,
                provider_session_id,
                event.provider.as_str(),
            )
        {
            return Err(RtcProductError::BadRequest(format!(
                "RTC provider webhook session {provider_session_id} does not match media session {}",
                session.id
            )));
        }
        return Ok(Some(profile.id.clone()));
    }

    if let Some(room_id) = event.room_id.as_deref()
        && let Some(room) = state.rooms.get(room_id)
        && let Some(provider_profile_id) = explicit_profile.as_deref()
    {
        let profile = provider_profile_by_id(state, provider_profile_id)?;
        if profile.tenant_id != room.tenant_id || profile.organization_id != room.organization_id {
            return Err(RtcProductError::BadRequest(
                "RTC provider webhook room scope does not match provider profile".to_string(),
            ));
        }
    }

    Ok(explicit_profile)
}

fn session_matches_provider_event(
    state: &RtcProductState,
    session: &RtcMediaSession,
    event: &RtcProviderWebhookEvent,
) -> bool {
    ensure_session_provider_binding(
        state,
        session,
        event.provider.as_str(),
        event.provider_profile_id.as_deref(),
    )
    .is_ok()
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct RtcWebhookEventScope {
    tenant_id: String,
    organization_id: String,
}

impl RtcWebhookEventScope {
    fn from_profile(profile: &RtcProviderProfile) -> Self {
        Self {
            tenant_id: profile.tenant_id.clone(),
            organization_id: profile.organization_id.clone(),
        }
    }

    fn from_room(room: &RtcRoom) -> Self {
        Self {
            tenant_id: room.tenant_id.clone(),
            organization_id: room.organization_id.clone(),
        }
    }

    fn from_session(session: &RtcMediaSession) -> Self {
        Self {
            tenant_id: session.tenant_id.clone(),
            organization_id: session.organization_id.clone(),
        }
    }
}

fn resolve_webhook_media_session_id(
    state: &RtcProductState,
    event: &RtcProviderWebhookEvent,
) -> Option<String> {
    if let Some(rtc_session_id) = &event.rtc_session_id {
        if let Some(session) = state.sessions.get(rtc_session_id.as_str())
            && session_matches_provider_event(state, session, event)
        {
            return Some(rtc_session_id.clone());
        }
        if let Some(session) = state.sessions.values().find(|session| {
            session.provider_session_id.as_deref() == Some(rtc_session_id.as_str())
                && session_matches_provider_event(state, session, event)
        }) {
            return Some(session.id.clone());
        }
    }

    if let Some(provider_session_id) = &event.provider_session_id {
        if let Some(session) = state.sessions.values().find(|session| {
            session.provider_session_id.as_deref() == Some(provider_session_id.as_str())
                && session_matches_provider_event(state, session, event)
        }) {
            return Some(session.id.clone());
        }
        if let Some((provider, rtc_session_id)) = provider_session_id.split_once(':')
            && provider == event.provider
            && let Some(session) = state.sessions.get(rtc_session_id)
            && session_matches_provider_event(state, session, event)
        {
            return Some(rtc_session_id.to_string());
        }
    }

    if let Some(room_id) = &event.room_id {
        let active_sessions = state
            .sessions
            .values()
            .filter(|session| {
                session.room_id == *room_id
                    && session.status == RtcMediaSessionStatus::Active
                    && session_matches_provider_event(state, session, event)
            })
            .take(2)
            .collect::<Vec<_>>();
        if active_sessions.len() == 1 {
            return Some(active_sessions[0].id.clone());
        }
    }

    event.rtc_session_id.clone().or_else(|| {
        event
            .provider_session_id
            .as_deref()
            .and_then(|provider_session_id| {
                provider_session_id
                    .split_once(':')
                    .and_then(|(provider, rtc_session_id)| {
                        (provider == event.provider).then(|| rtc_session_id.to_string())
                    })
            })
    })
}

fn resolve_webhook_event_scope(
    state: &RtcProductState,
    event: &RtcProviderWebhookEvent,
    media_session_id: Option<&str>,
) -> Result<RtcWebhookEventScope, RtcProductError> {
    let mut scope = None;

    if let Some(provider_profile_id) = &event.provider_profile_id {
        let profile = state
            .provider_profiles
            .get(provider_profile_id.as_str())
            .ok_or_else(|| {
                RtcProductError::BadRequest(format!(
                    "RTC provider webhook references unknown provider profile: {provider_profile_id}"
                ))
            })?;
        merge_webhook_scope(&mut scope, RtcWebhookEventScope::from_profile(profile))?;
    }

    if let Some(media_session_id) = media_session_id
        && let Some(session) = state.sessions.get(media_session_id)
    {
        merge_webhook_scope(&mut scope, RtcWebhookEventScope::from_session(session))?;
    }

    if let Some(room_id) = &event.room_id
        && let Some(room) = state.rooms.get(room_id.as_str())
    {
        merge_webhook_scope(&mut scope, RtcWebhookEventScope::from_room(room))?;
    }

    scope.ok_or_else(|| {
        RtcProductError::BadRequest(
            "RTC provider webhook cannot be scoped to a tenant and organization".to_string(),
        )
    })
}

fn merge_webhook_scope(
    current: &mut Option<RtcWebhookEventScope>,
    next: RtcWebhookEventScope,
) -> Result<(), RtcProductError> {
    if let Some(current) = current
        && current != &next
    {
        return Err(RtcProductError::BadRequest(
            "RTC provider webhook scope mismatch".to_string(),
        ));
    }
    *current = Some(next);
    Ok(())
}

fn profile_from_descriptor(
    tenant_id: &str,
    organization_id: &str,
    descriptor: sdkwork_communication_rtc_service::ProviderPluginDescriptor,
) -> RtcProviderProfile {
    let now = utc_now_rfc3339_millis();
    RtcProviderProfile {
        id: profile_id(
            tenant_id,
            organization_id,
            &descriptor.provider_kind,
            "default",
        ),
        tenant_id: tenant_id.to_string(),
        organization_id: organization_id.to_string(),
        provider: descriptor.provider_kind.clone(),
        code: "default".to_string(),
        name: descriptor.display_name,
        status: RtcProviderProfileStatus::Active,
        is_default: descriptor.default_selected,
        priority: if descriptor.default_selected { 0 } else { 100 },
        environment: "runtime".to_string(),
        region: None,
        provider_app_id: None,
        endpoint: None,
        credential_ref: None,
        credential_fingerprint: None,
        webhook_secret_ref: None,
        webhook_secret_fingerprint: None,
        capabilities: RtcProviderCapabilitySnapshot {
            audio: descriptor
                .required_capabilities
                .iter()
                .any(|item| item == "media.audio"),
            video: descriptor
                .required_capabilities
                .iter()
                .any(|item| item == "media.video"),
            live: descriptor
                .required_capabilities
                .iter()
                .any(|item| item == "live.broadcast" || item == "live.audience"),
            screen_share: descriptor
                .optional_capabilities
                .iter()
                .any(|item| item == "screen-share"),
            recording: descriptor
                .optional_capabilities
                .iter()
                .any(|item| item == "recording"),
            webhook: descriptor
                .required_capabilities
                .iter()
                .any(|item| item == "provider.webhook"),
            active_query: descriptor
                .optional_capabilities
                .iter()
                .any(|item| item == "provider.active-query"),
            max_participants: None,
            supported_regions: Vec::new(),
            provider_features: serde_json::json!({
                "pluginId": descriptor.plugin_id,
                "interfaceVersion": descriptor.interface_version,
                "requiredCapabilities": descriptor.required_capabilities,
                "optionalCapabilities": descriptor.optional_capabilities,
            }),
        },
        config_snapshot: serde_json::json!({
            "source": "registered_provider_plugin",
            "configSchemaRef": descriptor.config_schema_ref,
        }),
        health_status: RtcProviderHealthStatus::Unknown,
        last_verified_at: None,
        last_verification_latency_ms: None,
        last_verification_error: None,
        created_by: None,
        updated_by: None,
        created_at: Some(now.clone()),
        updated_at: Some(now),
        version: "0".to_string(),
        deleted_at: None,
        deleted_by: None,
    }
}

fn health_status_from_snapshot(snapshot: &ProviderHealthSnapshot) -> RtcProviderHealthStatus {
    match snapshot.status.as_str() {
        "healthy" => RtcProviderHealthStatus::Healthy,
        "degraded" => RtcProviderHealthStatus::Degraded,
        "unhealthy" => RtcProviderHealthStatus::Unhealthy,
        _ => RtcProviderHealthStatus::Unknown,
    }
}

fn build_provider_profile_verify_checks(
    profile: &RtcProviderProfile,
    health: &ProviderHealthSnapshot,
    query_kind: &RtcProviderProfileVerifyKind,
) -> Vec<RtcProviderProfileVerifyCheck> {
    let mut checks = vec![provider_profile_verify_check(
        "provider_health",
        match health_status_from_snapshot(health) {
            RtcProviderHealthStatus::Healthy => RtcProviderProfileVerifyCheckStatus::Passed,
            RtcProviderHealthStatus::Unhealthy => RtcProviderProfileVerifyCheckStatus::Failed,
            RtcProviderHealthStatus::Degraded | RtcProviderHealthStatus::Unknown => {
                RtcProviderProfileVerifyCheckStatus::Warning
            }
        },
        Some(health.status.clone()),
    )];

    if matches!(
        query_kind,
        RtcProviderProfileVerifyKind::Credential | RtcProviderProfileVerifyKind::Full
    ) {
        let credential_ready = non_empty_optional(profile.credential_ref.as_deref())
            && non_empty_optional(profile.provider_app_id.as_deref());
        checks.push(provider_profile_verify_check(
            "credential_reference",
            if credential_ready {
                RtcProviderProfileVerifyCheckStatus::Passed
            } else {
                RtcProviderProfileVerifyCheckStatus::Failed
            },
            Some(if credential_ready {
                "credentialRef and providerAppId are configured".to_string()
            } else {
                "credentialRef and providerAppId are required for RTC provider credentials"
                    .to_string()
            }),
        ));
    }

    if matches!(
        query_kind,
        RtcProviderProfileVerifyKind::Webhook | RtcProviderProfileVerifyKind::Full
    ) {
        let webhook_ready = profile.capabilities.webhook
            && non_empty_optional(profile.webhook_secret_ref.as_deref());
        checks.push(provider_profile_verify_check(
            "webhook_secret",
            if webhook_ready {
                RtcProviderProfileVerifyCheckStatus::Passed
            } else {
                RtcProviderProfileVerifyCheckStatus::Failed
            },
            Some(if webhook_ready {
                "webhookSecretRef is configured and webhook capability is enabled".to_string()
            } else {
                "webhookSecretRef and webhook capability are required for provider callbacks"
                    .to_string()
            }),
        ));
    }

    if matches!(
        query_kind,
        RtcProviderProfileVerifyKind::ActiveQuery | RtcProviderProfileVerifyKind::Full
    ) {
        checks.push(provider_profile_verify_check(
            "active_query_capability",
            if profile.capabilities.active_query {
                RtcProviderProfileVerifyCheckStatus::Passed
            } else {
                RtcProviderProfileVerifyCheckStatus::Failed
            },
            Some(if profile.capabilities.active_query {
                "active provider query capability is enabled".to_string()
            } else {
                "active provider query capability is required for reconciliation".to_string()
            }),
        ));
    }

    if matches!(
        query_kind,
        RtcProviderProfileVerifyKind::Recording | RtcProviderProfileVerifyKind::Full
    ) {
        checks.push(provider_profile_verify_check(
            "recording_capability",
            if profile.capabilities.recording {
                RtcProviderProfileVerifyCheckStatus::Passed
            } else {
                RtcProviderProfileVerifyCheckStatus::Failed
            },
            Some(if profile.capabilities.recording {
                "recording capability is enabled".to_string()
            } else {
                "recording capability is required for RTC recording artifacts".to_string()
            }),
        ));
    }

    checks
}

fn provider_profile_status_from_checks(
    checks: &[RtcProviderProfileVerifyCheck],
) -> RtcProviderHealthStatus {
    if checks
        .iter()
        .any(|check| check.status == RtcProviderProfileVerifyCheckStatus::Failed)
    {
        return RtcProviderHealthStatus::Unhealthy;
    }
    if checks.iter().any(|check| {
        matches!(
            check.status,
            RtcProviderProfileVerifyCheckStatus::Warning
                | RtcProviderProfileVerifyCheckStatus::Skipped
        )
    }) {
        return RtcProviderHealthStatus::Degraded;
    }
    RtcProviderHealthStatus::Healthy
}

fn provider_profile_verification_error(
    checks: &[RtcProviderProfileVerifyCheck],
    status: &RtcProviderHealthStatus,
) -> Option<String> {
    if *status == RtcProviderHealthStatus::Healthy {
        return None;
    }

    let details = checks
        .iter()
        .filter(|check| check.status != RtcProviderProfileVerifyCheckStatus::Passed)
        .map(|check| {
            let label = provider_profile_verify_check_status_label(&check.status);
            match check
                .detail
                .as_deref()
                .filter(|detail| !detail.trim().is_empty())
            {
                Some(detail) => format!("{} {label}: {detail}", check.name),
                None => format!("{} {label}", check.name),
            }
        })
        .collect::<Vec<_>>();

    if details.is_empty() {
        None
    } else {
        Some(truncate_provider_verification_error(details.join("; ")))
    }
}

fn provider_profile_verify_check_status_label(
    status: &RtcProviderProfileVerifyCheckStatus,
) -> &'static str {
    match status {
        RtcProviderProfileVerifyCheckStatus::Passed => "passed",
        RtcProviderProfileVerifyCheckStatus::Warning => "warning",
        RtcProviderProfileVerifyCheckStatus::Failed => "failed",
        RtcProviderProfileVerifyCheckStatus::Skipped => "skipped",
    }
}

fn elapsed_millis_u32(started_at: Instant) -> u32 {
    started_at.elapsed().as_millis().min(u128::from(u32::MAX)) as u32
}

fn truncate_provider_verification_error(value: String) -> String {
    const MAX_PROVIDER_VERIFICATION_ERROR_LEN: usize = 1000;
    if value.len() <= MAX_PROVIDER_VERIFICATION_ERROR_LEN {
        return value;
    }

    let mut boundary = MAX_PROVIDER_VERIFICATION_ERROR_LEN;
    while !value.is_char_boundary(boundary) {
        boundary -= 1;
    }
    let mut truncated = value;
    truncated.truncate(boundary);
    truncated
}

fn provider_profile_verify_check(
    name: impl Into<String>,
    status: RtcProviderProfileVerifyCheckStatus,
    detail: Option<String>,
) -> RtcProviderProfileVerifyCheck {
    RtcProviderProfileVerifyCheck {
        name: name.into(),
        status,
        detail,
    }
}

fn non_empty_optional(value: Option<&str>) -> bool {
    value.map(str::trim).is_some_and(|value| !value.is_empty())
}

fn headers_from_json(headers: &serde_json::Value) -> Vec<(String, String)> {
    headers
        .as_object()
        .map(|object| {
            object
                .iter()
                .map(|(key, value)| {
                    (
                        key.clone(),
                        value
                            .as_str()
                            .map(str::to_string)
                            .unwrap_or_else(|| value.to_string()),
                    )
                })
                .collect()
        })
        .unwrap_or_default()
}

fn extract_recording_id(snapshot_json: &str) -> Option<String> {
    let snapshot = serde_json::from_str::<serde_json::Value>(snapshot_json).ok()?;
    extract_recording_id_from_value(&snapshot)
}

fn extract_recording_id_from_value(value: &serde_json::Value) -> Option<String> {
    if let Some(recording_id) = value
        .get("recordingId")
        .or_else(|| value.get("recordingID"))
        .or_else(|| value.get("RecordingId"))
        .and_then(|value| value.as_str())
        .filter(|value| !value.trim().is_empty())
    {
        return Some(recording_id.to_string());
    }

    for collection_key in ["recordingArtifacts", "recordings", "artifacts"] {
        if let Some(items) = value.get(collection_key).and_then(|value| value.as_array()) {
            for item in items {
                if let Some(recording_id) = extract_recording_id_from_value(item) {
                    return Some(recording_id);
                }
            }
        }
    }

    if let Some(provider_response) = value.get("providerResponse") {
        if let Some(recording_id) = extract_recording_id_from_value(provider_response) {
            return Some(recording_id);
        }
    }

    if let Some(body) = value.get("body").and_then(|value| value.as_str()) {
        if let Ok(body_json) = serde_json::from_str::<serde_json::Value>(body) {
            return extract_recording_id_from_value(&body_json);
        }
    }

    None
}

fn provider_query_target_kind(query_kind: &RtcProviderQueryKind) -> &'static str {
    match query_kind {
        RtcProviderQueryKind::RoomOnlineUsers | RtcProviderQueryKind::RoomState => "room",
        RtcProviderQueryKind::MediaSessionState => "media_session",
        RtcProviderQueryKind::RecordingArtifacts => "recording",
        RtcProviderQueryKind::QualitySamples => "quality",
    }
}

fn provider_query_target_id(result: &RtcProviderQueryResult) -> String {
    match result.query_kind {
        RtcProviderQueryKind::RoomOnlineUsers | RtcProviderQueryKind::RoomState => result
            .room_id
            .clone()
            .or_else(|| result.rtc_session_id.clone())
            .or_else(|| result.provider_session_id.clone()),
        RtcProviderQueryKind::MediaSessionState => result
            .rtc_session_id
            .clone()
            .or_else(|| result.provider_session_id.clone())
            .or_else(|| result.room_id.clone()),
        RtcProviderQueryKind::RecordingArtifacts => result
            .provider_session_id
            .clone()
            .or_else(|| result.rtc_session_id.clone())
            .or_else(|| result.room_id.clone()),
        RtcProviderQueryKind::QualitySamples => result
            .rtc_session_id
            .clone()
            .or_else(|| result.provider_session_id.clone())
            .or_else(|| result.room_id.clone()),
    }
    .unwrap_or_else(|| {
        format!(
            "{}-{}",
            result.provider,
            query_kind_to_str(&result.query_kind)
        )
    })
}

fn query_kind_to_str(value: &RtcProviderQueryKind) -> &'static str {
    match value {
        RtcProviderQueryKind::RoomOnlineUsers => "room_online_users",
        RtcProviderQueryKind::RoomState => "room_state",
        RtcProviderQueryKind::MediaSessionState => "media_session_state",
        RtcProviderQueryKind::RecordingArtifacts => "recording_artifacts",
        RtcProviderQueryKind::QualitySamples => "quality_samples",
    }
}
