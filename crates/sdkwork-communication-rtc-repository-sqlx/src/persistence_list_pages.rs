use std::future::Future;

use sdkwork_communication_rtc_service::{
    RtcActiveProviderProfileListPage, RtcListPage, RtcListWindowError, RtcMediaArtifactListPage,
    RtcMediaSessionListPage, RtcPersistenceError, RtcProviderAccountListPage,
    RtcProviderAccountStatus, RtcProviderApplicationListPage, RtcProviderCredentialListPage,
    RtcProviderProfileListPage, RtcProviderQuerySnapshotListPage, RtcProviderRouteListPage,
    RtcProviderWebhookEventListPage, RtcQualitySampleListPage, RtcRoomListPage, RtcScopedListQuery,
};

use crate::list_page::fetch_bounded_page;
use crate::{
    RtcPostgresMediaSessionRepository, RtcPostgresProviderAccountRepository,
    RtcPostgresProviderEventRepository, RtcPostgresProviderProfileRepository,
    RtcPostgresProviderRouteRepository,
     RtcStorageError,
};

fn page_error(error: RtcListWindowError) -> RtcPersistenceError {
    RtcPersistenceError::BadRequest(error.to_string())
}

fn storage_error(error: RtcStorageError) -> RtcListWindowError {
    RtcListWindowError::bad_request(error.to_string())
}

pub fn provider_account_status_from_key(
    status: Option<&str>,
) -> Result<Option<RtcProviderAccountStatus>, RtcListWindowError> {
    let Some(raw) = status.map(str::trim).filter(|value| !value.is_empty()) else {
        return Ok(None);
    };
    match raw {
        "active" => Ok(Some(RtcProviderAccountStatus::Active)),
        "disabled" => Ok(Some(RtcProviderAccountStatus::Disabled)),
        "archived" => Ok(Some(RtcProviderAccountStatus::Archived)),
        _ => Err(RtcListWindowError::bad_request(format!(
            "invalid provider account status filter: {raw}"
        ))),
    }
}

async fn bounded_page<T, F, Fut>(
    query: RtcScopedListQuery,
    fetch: F,
) -> Result<RtcListPage<T>, RtcPersistenceError>
where
    F: Fn(usize, usize, Option<String>, String, bool) -> Fut,
    Fut: Future<Output = Result<Vec<T>, RtcListWindowError>>,
{
    fetch_bounded_page(&query.params, |offset, limit, q, sort, desc| {
        fetch(
            offset,
            limit,
            q.map(str::to_string),
            sort.to_string(),
            desc,
        )
    })
    .await
    .map_err(page_error)
}



pub async fn postgres_list_media_sessions_page(
    repo: &RtcPostgresMediaSessionRepository,
    query: RtcScopedListQuery,
) -> Result<RtcMediaSessionListPage, RtcPersistenceError> {
    let repo = repo.clone();
    let tenant_id = query.tenant_id.clone();
    let organization_id = query.organization_id.clone();
    bounded_page(query, move |offset, limit, q, sort, desc| {
        let repo = repo.clone();
        let tenant_id = tenant_id.clone();
        let organization_id = organization_id.clone();
        async move {
            repo.list_media_sessions_page(
                tenant_id.as_str(),
                organization_id.as_str(),
                offset,
                limit,
                q.as_deref(),
                sort.as_str(),
                desc,
            )
            .await
            .map_err(storage_error)
        }
    })
    .await
}

pub async fn postgres_list_rooms_page(
    repo: &RtcPostgresMediaSessionRepository,
    query: RtcScopedListQuery,
) -> Result<RtcRoomListPage, RtcPersistenceError> {
    let repo = repo.clone();
    let tenant_id = query.tenant_id.clone();
    let organization_id = query.organization_id.clone();
    let status = query.status.clone();
    let owner_user_id = query.owner_user_id.clone();
    let created_after = query.created_after.clone();
    bounded_page(query, move |offset, limit, q, sort, desc| {
        let repo = repo.clone();
        let tenant_id = tenant_id.clone();
        let organization_id = organization_id.clone();
        let status = status.clone();
        let owner_user_id = owner_user_id.clone();
        let created_after = created_after.clone();
        async move {
            repo.list_rooms_page(
                tenant_id.as_str(),
                organization_id.as_str(),
                offset,
                limit,
                q.as_deref(),
                status.as_deref(),
                owner_user_id.as_deref(),
                created_after.as_deref(),
                sort.as_str(),
                desc,
            )
            .await
            .map_err(storage_error)
        }
    })
    .await
}


pub async fn postgres_list_active_provider_profiles_page(
    repo: &RtcPostgresProviderProfileRepository,
    query: RtcScopedListQuery,
) -> Result<RtcActiveProviderProfileListPage, RtcPersistenceError> {
    let repo = repo.clone();
    let tenant_id = query.tenant_id.clone();
    let organization_id = query.organization_id.clone();
    let provider = query.provider.clone();
    bounded_page(query, move |offset, limit, q, sort, desc| {
        let repo = repo.clone();
        let tenant_id = tenant_id.clone();
        let organization_id = organization_id.clone();
        let provider = provider.clone();
        async move {
            repo.list_active_provider_profiles_page(
                tenant_id.as_str(),
                organization_id.as_str(),
                provider.as_deref(),
                offset,
                limit,
                q.as_deref(),
                sort.as_str(),
                desc,
            )
            .await
            .map_err(storage_error)
        }
    })
    .await
}


pub async fn postgres_list_media_artifacts_page(
    repo: &RtcPostgresMediaSessionRepository,
    query: RtcScopedListQuery,
) -> Result<RtcMediaArtifactListPage, RtcPersistenceError> {
    let session_id = query
        .media_session_id
        .clone()
        .ok_or_else(|| page_error(RtcListWindowError::bad_request("media_session_id is required")))?;
    let repo = repo.clone();
    let tenant_id = query.tenant_id.clone();
    let organization_id = query.organization_id.clone();
    bounded_page(query, move |offset, limit, q, sort, desc| {
        let repo = repo.clone();
        let tenant_id = tenant_id.clone();
        let organization_id = organization_id.clone();
        let session_id = session_id.clone();
        async move {
            repo.list_media_artifacts_page(
                tenant_id.as_str(),
                organization_id.as_str(),
                session_id.as_str(),
                offset,
                limit,
                q.as_deref(),
                sort.as_str(),
                desc,
            )
            .await
            .map_err(storage_error)
        }
    })
    .await
}


pub async fn postgres_list_media_artifacts_scope_page(
    repo: &RtcPostgresMediaSessionRepository,
    query: RtcScopedListQuery,
) -> Result<RtcMediaArtifactListPage, RtcPersistenceError> {
    let repo = repo.clone();
    let tenant_id = query.tenant_id.clone();
    let organization_id = query.organization_id.clone();
    let session_id = query.media_session_id.clone();
    bounded_page(query, move |offset, limit, q, sort, desc| {
        let repo = repo.clone();
        let tenant_id = tenant_id.clone();
        let organization_id = organization_id.clone();
        let session_id = session_id.clone();
        async move {
            repo.list_media_artifacts_scope_page(
                tenant_id.as_str(),
                organization_id.as_str(),
                session_id.as_deref(),
                offset,
                limit,
                q.as_deref(),
                sort.as_str(),
                desc,
            )
            .await
            .map_err(storage_error)
        }
    })
    .await
}


pub async fn postgres_list_provider_profiles_page(
    repo: &RtcPostgresProviderProfileRepository,
    query: RtcScopedListQuery,
) -> Result<RtcProviderProfileListPage, RtcPersistenceError> {
    let repo = repo.clone();
    let tenant_id = query.tenant_id.clone();
    let organization_id = query.organization_id.clone();
    let provider = query.provider.clone();
    bounded_page(query, move |offset, limit, q, sort, desc| {
        let repo = repo.clone();
        let tenant_id = tenant_id.clone();
        let organization_id = organization_id.clone();
        let provider = provider.clone();
        async move {
            repo.list_provider_profiles_page(
                tenant_id.as_str(),
                organization_id.as_str(),
                provider.as_deref(),
                offset,
                limit,
                q.as_deref(),
                sort.as_str(),
                desc,
            )
            .await
            .map_err(storage_error)
        }
    })
    .await
}


pub async fn postgres_list_provider_accounts_page(
    repo: &RtcPostgresProviderAccountRepository,
    query: RtcScopedListQuery,
) -> Result<RtcProviderAccountListPage, RtcPersistenceError> {
    let repo = repo.clone();
    let tenant_id = query.tenant_id.clone();
    let organization_id = query.organization_id.clone();
    let provider = query.provider.clone();
    let status = provider_account_status_from_key(query.status.as_deref()).map_err(page_error)?;
    bounded_page(query, move |offset, limit, q, sort, desc| {
        let repo = repo.clone();
        let tenant_id = tenant_id.clone();
        let organization_id = organization_id.clone();
        let provider = provider.clone();
        let status = status.clone();
        async move {
            repo.list_provider_accounts_page(
                tenant_id.as_str(),
                organization_id.as_str(),
                provider.as_deref(),
                status,
                offset,
                limit,
                q.as_deref(),
                sort.as_str(),
                desc,
            )
            .await
            .map_err(storage_error)
        }
    })
    .await
}


pub async fn postgres_list_provider_applications_page(
    repo: &RtcPostgresProviderAccountRepository,
    query: RtcScopedListQuery,
) -> Result<RtcProviderApplicationListPage, RtcPersistenceError> {
    let account_id = query.provider_account_id.clone().ok_or_else(|| {
        page_error(RtcListWindowError::bad_request(
            "provider_account_id is required",
        ))
    })?;
    let repo = repo.clone();
    let tenant_id = query.tenant_id.clone();
    let organization_id = query.organization_id.clone();
    bounded_page(query, move |offset, limit, q, sort, desc| {
        let repo = repo.clone();
        let tenant_id = tenant_id.clone();
        let organization_id = organization_id.clone();
        let account_id = account_id.clone();
        async move {
            repo.list_provider_applications_page(
                tenant_id.as_str(),
                organization_id.as_str(),
                account_id.as_str(),
                offset,
                limit,
                q.as_deref(),
                sort.as_str(),
                desc,
            )
            .await
            .map_err(storage_error)
        }
    })
    .await
}


pub async fn postgres_list_provider_credentials_page(
    repo: &RtcPostgresProviderAccountRepository,
    query: RtcScopedListQuery,
) -> Result<RtcProviderCredentialListPage, RtcPersistenceError> {
    let application_id = query.provider_application_id.clone().ok_or_else(|| {
        page_error(RtcListWindowError::bad_request(
            "provider_application_id is required",
        ))
    })?;
    let repo = repo.clone();
    let tenant_id = query.tenant_id.clone();
    let organization_id = query.organization_id.clone();
    bounded_page(query, move |offset, limit, q, sort, desc| {
        let repo = repo.clone();
        let tenant_id = tenant_id.clone();
        let organization_id = organization_id.clone();
        let application_id = application_id.clone();
        async move {
            repo.list_provider_credentials_page(
                tenant_id.as_str(),
                organization_id.as_str(),
                application_id.as_str(),
                offset,
                limit,
                q.as_deref(),
                sort.as_str(),
                desc,
            )
            .await
            .map_err(storage_error)
        }
    })
    .await
}


pub async fn postgres_list_provider_routes_page(
    repo: &RtcPostgresProviderRouteRepository,
    query: RtcScopedListQuery,
) -> Result<RtcProviderRouteListPage, RtcPersistenceError> {
    let repo = repo.clone();
    let tenant_id = query.tenant_id.clone();
    let organization_id = query.organization_id.clone();
    bounded_page(query, move |offset, limit, q, sort, desc| {
        let repo = repo.clone();
        let tenant_id = tenant_id.clone();
        let organization_id = organization_id.clone();
        async move {
            repo.list_provider_routes_page(
                tenant_id.as_str(),
                organization_id.as_str(),
                offset,
                limit,
                q.as_deref(),
                sort.as_str(),
                desc,
            )
            .await
            .map_err(storage_error)
        }
    })
    .await
}


pub async fn postgres_list_webhook_events_page(
    repo: &RtcPostgresProviderEventRepository,
    query: RtcScopedListQuery,
) -> Result<RtcProviderWebhookEventListPage, RtcPersistenceError> {
    let repo = repo.clone();
    let tenant_id = query.tenant_id.clone();
    let organization_id = query.organization_id.clone();
    bounded_page(query, move |offset, limit, q, sort, desc| {
        let repo = repo.clone();
        let tenant_id = tenant_id.clone();
        let organization_id = organization_id.clone();
        async move {
            repo.list_webhook_events_page(
                tenant_id.as_str(),
                organization_id.as_str(),
                offset,
                limit,
                q.as_deref(),
                sort.as_str(),
                desc,
            )
            .await
            .map_err(storage_error)
        }
    })
    .await
}


pub async fn postgres_list_provider_query_snapshots_page(
    repo: &RtcPostgresProviderEventRepository,
    query: RtcScopedListQuery,
) -> Result<RtcProviderQuerySnapshotListPage, RtcPersistenceError> {
    let repo = repo.clone();
    let tenant_id = query.tenant_id.clone();
    let organization_id = query.organization_id.clone();
    let job_id = query.provider_query_job_id.clone();
    bounded_page(query, move |offset, limit, q, sort, desc| {
        let repo = repo.clone();
        let tenant_id = tenant_id.clone();
        let organization_id = organization_id.clone();
        let job_id = job_id.clone();
        async move {
            repo.list_provider_query_snapshots_page(
                tenant_id.as_str(),
                organization_id.as_str(),
                job_id.as_deref(),
                offset,
                limit,
                q.as_deref(),
                sort.as_str(),
                desc,
            )
            .await
            .map_err(storage_error)
        }
    })
    .await
}


pub async fn postgres_list_quality_samples_scope_page(
    repo: &RtcPostgresMediaSessionRepository,
    query: RtcScopedListQuery,
) -> Result<RtcQualitySampleListPage, RtcPersistenceError> {
    let repo = repo.clone();
    let tenant_id = query.tenant_id.clone();
    let organization_id = query.organization_id.clone();
    let session_id = query.media_session_id.clone();
    bounded_page(query, move |offset, limit, q, sort, desc| {
        let repo = repo.clone();
        let tenant_id = tenant_id.clone();
        let organization_id = organization_id.clone();
        let session_id = session_id.clone();
        async move {
            repo.list_quality_samples_scope_page(
                tenant_id.as_str(),
                organization_id.as_str(),
                session_id.as_deref(),
                offset,
                limit,
                q.as_deref(),
                sort.as_str(),
                desc,
            )
            .await
            .map_err(storage_error)
        }
    })
    .await
}
