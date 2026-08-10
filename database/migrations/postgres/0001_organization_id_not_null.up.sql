-- sdkwork:migration
-- id: 0001_organization_id_not_null
-- engine: postgres
-- module: sdkwork-rtc
-- purpose: Enforce organization_id NOT NULL DEFAULT on all tables in the
--   consolidated baseline. NULL rows (pre-standard data anomalies) are
--   backfilled with the platform sentinel before NOT NULL is set, and
--   NOT NULL columns without an explicit default receive the sentinel
--   default, keeping existing deployments consistent with fresh baseline
--   installs.
-- reversible: false
-- rollback: forward-fix (sentinel backfill is the canonical fix; NULL
--   organization rows are data anomalies)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

BEGIN;

UPDATE rtc_room SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_room ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_room ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_room_participant SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_room_participant ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_room_participant ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_media_session SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_media_session ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_media_session ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_media_session_completion_record SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_media_session_completion_record ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_media_session_completion_record ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_media_artifact SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_media_artifact ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_media_artifact ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_media_participant SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_media_participant ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_media_participant ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_media_track SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_media_track ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_media_track ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_quality_sample SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_quality_sample ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_quality_sample ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_provider_account SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_provider_account ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_provider_account ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_provider_application SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_provider_application ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_provider_application ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_provider_credential SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_provider_credential ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_provider_credential ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_provider_profile SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_provider_profile ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_provider_profile ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_provider_route SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_provider_route ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_provider_route ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_session_token_grant SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_session_token_grant ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_session_token_grant ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_provider_webhook_event SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_provider_webhook_event ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_provider_webhook_event ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_provider_query_job SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_provider_query_job ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_provider_query_job ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_provider_query_snapshot SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_provider_query_snapshot ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_provider_query_snapshot ALTER COLUMN organization_id SET NOT NULL;

UPDATE rtc_media_session_idempotency SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE rtc_media_session_idempotency ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE rtc_media_session_idempotency ALTER COLUMN organization_id SET NOT NULL;

COMMIT;
