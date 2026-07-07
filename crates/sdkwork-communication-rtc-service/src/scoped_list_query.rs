use crate::list_window::RtcListWindowParams;

/// Tenant-scoped list query pushed to SQL repositories (`PAGINATION_SPEC.md` §2).
#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct RtcScopedListQuery {
    pub tenant_id: String,
    pub organization_id: String,
    pub params: RtcListWindowParams,
    pub provider: Option<String>,
    pub status: Option<String>,
    pub provider_account_id: Option<String>,
    pub provider_application_id: Option<String>,
    pub media_session_id: Option<String>,
    pub provider_query_job_id: Option<String>,
    pub owner_user_id: Option<String>,
    pub created_after: Option<String>,
}

impl RtcScopedListQuery {
    pub fn new(
        tenant_id: impl Into<String>,
        organization_id: impl Into<String>,
        params: RtcListWindowParams,
    ) -> Self {
        Self {
            tenant_id: tenant_id.into(),
            organization_id: organization_id.into(),
            params,
            ..Self::default()
        }
    }

    pub fn with_provider(mut self, provider: impl Into<String>) -> Self {
        self.provider = Some(provider.into());
        self
    }

    pub fn with_status(mut self, status: impl Into<String>) -> Self {
        self.status = Some(status.into());
        self
    }

    pub fn with_provider_account_id(mut self, provider_account_id: impl Into<String>) -> Self {
        self.provider_account_id = Some(provider_account_id.into());
        self
    }

    pub fn with_provider_application_id(mut self, provider_application_id: impl Into<String>) -> Self {
        self.provider_application_id = Some(provider_application_id.into());
        self
    }

    pub fn with_media_session_id(mut self, media_session_id: impl Into<String>) -> Self {
        self.media_session_id = Some(media_session_id.into());
        self
    }

    pub fn with_provider_query_job_id(mut self, provider_query_job_id: impl Into<String>) -> Self {
        self.provider_query_job_id = Some(provider_query_job_id.into());
        self
    }

    pub fn with_owner_user_id(mut self, owner_user_id: impl Into<String>) -> Self {
        self.owner_user_id = Some(owner_user_id.into());
        self
    }

    pub fn with_created_after(mut self, created_after: impl Into<String>) -> Self {
        self.created_after = Some(created_after.into());
        self
    }
}
