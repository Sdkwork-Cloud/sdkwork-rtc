import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { RtcAdminCenterServices } from "../types/adminServices";
import type { Room } from "../types/room";
import type { RtcMediaSession } from "../types/mediaSession";
import type { RtcMediaArtifact } from "../types/mediaArtifact";
import type { ProviderConfigSchema, ProviderPluginDescriptor } from "../types/providerSchema";
import type { ProviderProfile } from "../types/providerProfile";
import type { ProviderQueryJobCreateCommand } from "../types/providerQueryJob";
import { formatSdkWorkError } from "../sdk/index.js";

import { DEFAULT_MEDIA_ARTIFACT_FILTER, MediaArtifactList, buildMediaArtifactListParams, mediaArtifactDateRangeCreatedAfter, type MediaArtifactFilterState } from "./MediaArtifactList";
import { MediaArtifactDetailPanel } from "./MediaArtifactDetailPanel";
import { DEFAULT_MEDIA_SESSION_FILTER, MediaSessionList, buildMediaSessionListParams, mediaSessionDateRangeCreatedAfter, type MediaSessionFilterState } from "./MediaSessionList";
import { MediaSessionDetailPanel } from "./MediaSessionDetailPanel";
import { DEFAULT_QUALITY_SAMPLE_FILTER, QualitySampleList, buildQualitySampleListParams, qualitySampleDateRangeCreatedAfter, type QualitySampleFilterState } from "./QualitySampleList";
import { ProviderApplicationPage } from "./ProviderApplicationPage";
import { ProviderCredentialPage } from "./ProviderCredentialPage";
import { ProviderAccountList } from "./ProviderAccountList";
import { ProviderCapabilityConfig } from "./ProviderCapabilityConfig";
import { ProviderConfigWizard, type ProviderWizardResult } from "./ProviderConfigWizard";
import { ProviderHealthDashboard } from "./ProviderHealthDashboard";
import { ProviderPluginList } from "./ProviderPluginList";
import { ProviderProfileList } from "./ProviderProfileList";
import { ProviderQueryJobPanel } from "./ProviderQueryJobPanel";
import { ProviderRouteList } from "./ProviderRouteList";
import { ProviderWebhookEventList } from "./ProviderWebhookEventList";
import { RoomCreateDialog } from "./RoomCreateDialog";
import { RoomDetailPanel } from "./RoomDetailPanel";
import { DEFAULT_ROOM_FILTER, RoomFilter, roomDateRangeCreatedAfter } from "./RoomFilter";
import { RoomList } from "./RoomList";
import {
  mapPluginCapabilitiesToBackend,
  profileCapabilitiesToBackendKeys,
} from "../utils/capabilityMapper";

/**
 * RTC Admin Center workspace.
 *
 * Owns the complete admin page orchestration: data hooks, filters,
 * pagination, drill-down routes and every management surface (real-time
 * sessions, rooms, recording files, quality monitoring, provider and system
 * tooling). Hosts inject `RtcAdminCenterServices` and render this workspace
 * inside their own layout/auth shell — the PC app and the Cloud Router admin
 * share this single authority.
 */

export interface RtcAdminCenterWorkspaceProps {
  services: RtcAdminCenterServices;
  route: string;
  navigateTo?: (path: string) => void;
}

interface PaginatedListState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debouncedValue;
}

function useSdkWorkPaginatedList<T>(
  fetchPage: (cursor?: string) => Promise<{ items: T[]; nextCursor?: string | null }>,
  deps: unknown[] = [],
): PaginatedListState<T> {
  const { t } = useTranslation();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPage(undefined);
      setData(result.items);
      const cursor = result.nextCursor?.trim();
      setNextCursor(cursor || undefined);
      setHasMore(Boolean(cursor));
    } catch (err) {
      setError(formatSdkWorkError(err, t("admin.rtc.errorFailedLoad", "Failed to load data")));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPage(nextCursor);
      setData((current) => [...current, ...result.items]);
      const cursor = result.nextCursor?.trim();
      setNextCursor(cursor || undefined);
      setHasMore(Boolean(cursor));
    } catch (err) {
      setError(formatSdkWorkError(err, t("admin.rtc.errorFailedLoadMore", "Failed to load more")));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, loading, nextCursor, ...deps]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, hasMore, refresh, loadMore };
}

function AdminError({ message }: { message: string }) {
  return (
    <div className="admin-error" role="alert">
      {message}
    </div>
  );
}

function AdminLoading({ label }: { label?: string }) {
  const { t } = useTranslation();
  return <p>{label ?? t("admin.rtc.loadingAdmin", "Loading RTC admin data...")}</p>;
}

function parseParamRoute(route: string, prefix: string): string | null {
  const match = route.match(new RegExp(`^${prefix}/([^/]+)$`, "u"));
  return match?.[1] ?? null;
}

export function RtcAdminCenterWorkspace({
  services,
  route,
  navigateTo = (path) => {
    window.location.hash = path;
  },
}: RtcAdminCenterWorkspaceProps) {
  const { t } = useTranslation();
  const [roomFilter, setRoomFilter] = useState(DEFAULT_ROOM_FILTER);
  const [roomSort, setRoomSort] = useState("-createdAt");
  const [sessionFilter, setSessionFilter] = useState<MediaSessionFilterState>(DEFAULT_MEDIA_SESSION_FILTER);
  const [artifactFilter, setArtifactFilter] = useState<MediaArtifactFilterState>(DEFAULT_MEDIA_ARTIFACT_FILTER);
  const [qualityFilter, setQualityFilter] = useState<QualitySampleFilterState>(DEFAULT_QUALITY_SAMPLE_FILTER);
  const [selectedSession, setSelectedSession] = useState<RtcMediaSession | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<RtcMediaArtifact | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomCreateOpen, setRoomCreateOpen] = useState(false);
  const [completionRecord, setCompletionRecord] = useState<Awaited<ReturnType<typeof services.mediaSessions.getCompletionRecord>> | null>(null);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  const [wizardSchema, setWizardSchema] = useState<ProviderConfigSchema | null>(null);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardSaving, setWizardSaving] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<ProviderPluginDescriptor | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProviderProfile | null>(null);
  const [capabilityError, setCapabilityError] = useState<string | null>(null);
  const [capabilitySaving, setCapabilitySaving] = useState(false);

  const [queryJobForm, setQueryJobForm] = useState<ProviderQueryJobCreateCommand>({
    provider: "",
    queryKind: "room_state",
    roomId: "",
    mediaSessionId: "",
  });
  const [queryJobError, setQueryJobError] = useState<string | null>(null);
  const [queryJobFormError, setQueryJobFormError] = useState<string | null>(null);
  const [queryJobLoading, setQueryJobLoading] = useState(false);
  const [queryJobRefreshing, setQueryJobRefreshing] = useState(false);
  const [activeQueryJobId, setActiveQueryJobId] = useState<string | null>(null);
  const [queryJobDetail, setQueryJobDetail] = useState<Awaited<ReturnType<typeof services.queryJobs.get>> | null>(null);
  const [querySnapshots, setQuerySnapshots] = useState<Awaited<ReturnType<typeof services.queryJobs.listSnapshots>>["items"]>([]);

  const debouncedRoomQuery = useDebouncedValue(roomFilter.search, 300);
  const debouncedSessionQuery = useDebouncedValue(sessionFilter.search, 300);
  const debouncedArtifactQuery = useDebouncedValue(artifactFilter.search, 300);
  const debouncedQualityQuery = useDebouncedValue(qualityFilter.search, 300);

  const roomsList = useSdkWorkPaginatedList(
    (cursor) =>
      services.rooms.list({
        cursor,
        search: debouncedRoomQuery || undefined,
        sort: roomSort,
        status: roomFilter.status === "all" ? undefined : roomFilter.status,
        ownerUserId: roomFilter.ownerUserId || undefined,
        createdAfter: roomDateRangeCreatedAfter(roomFilter.dateRange),
      }),
    [services, debouncedRoomQuery, roomSort, roomFilter.status, roomFilter.ownerUserId, roomFilter.dateRange],
  );

  const sessionsList = useSdkWorkPaginatedList(
    (cursor) =>
      services.mediaSessions.list({
        cursor,
        search: debouncedSessionQuery || undefined,
        sort: "-startedAt",
        status: sessionFilter.status === "all" ? undefined : sessionFilter.status,
        createdAfter: mediaSessionDateRangeCreatedAfter(sessionFilter.dateRange),
      }),
    [services, debouncedSessionQuery, sessionFilter.status, sessionFilter.dateRange],
  );

  const artifactsList = useSdkWorkPaginatedList(
    (cursor) =>
      services.mediaArtifacts.list({
        cursor,
        search: debouncedArtifactQuery || undefined,
        status: artifactFilter.status === "all" ? undefined : artifactFilter.status,
        createdAfter: mediaArtifactDateRangeCreatedAfter(artifactFilter.dateRange),
      }),
    [services, debouncedArtifactQuery, artifactFilter.status, artifactFilter.dateRange],
  );

  const qualityList = useSdkWorkPaginatedList(
    (cursor) =>
      services.qualitySamples.list({
        cursor,
        search: debouncedQualityQuery || undefined,
        createdAfter: qualitySampleDateRangeCreatedAfter(qualityFilter.dateRange),
      }),
    [services, debouncedQualityQuery, qualityFilter.dateRange],
  );

  const accountsList = useSdkWorkPaginatedList(
    (cursor) => services.accounts.list({ cursor, limit: 200 }),
    [services],
  );
  const profilesList = useSdkWorkPaginatedList(
    (cursor) => services.profiles.list({ cursor }),
    [services],
  );
  const routesList = useSdkWorkPaginatedList((cursor) => services.routes.list({ cursor }), [services]);
  const pluginsList = useSdkWorkPaginatedList((cursor) => services.plugins.list({ cursor }), [services]);
  const webhookList = useSdkWorkPaginatedList(
    (cursor) => services.webhooks.listEvents({ cursor }),
    [services],
  );

  const [dashboardData, setDashboardData] = useState<{ profiles: ProviderProfile[]; schemas: ProviderConfigSchema[] }>({ profiles: [], schemas: [] });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const refreshDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const [profiles, schemas] = await Promise.all([
        services.profiles.list({ limit: 200 }),
        services.schemas.listSchemas(),
      ]);
      setDashboardData({ profiles: profiles.items, schemas });
    } catch (err) {
      setDashboardError(formatSdkWorkError(err, t("admin.rtc.errorFailedDashboard", "Failed to load dashboard")));
    } finally {
      setDashboardLoading(false);
    }
  }, [services]);
  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  const [schemas, setSchemas] = useState<ProviderConfigSchema[]>([]);
  const [schemasLoading, setSchemasLoading] = useState(true);
  const [schemasError, setSchemasError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setSchemasLoading(true);
    setSchemasError(null);
    void services.schemas
      .listSchemas()
      .then((items) => {
        if (active) setSchemas(items);
      })
      .catch((err) => {
        if (active) setSchemasError(formatSdkWorkError(err, t("admin.rtc.errorFailedSchemas", "Failed to load schemas")));
      })
      .finally(() => {
        if (active) setSchemasLoading(false);
      });
    return () => {
      active = false;
    };
  }, [services]);

  const handleWizardComplete = async (result: ProviderWizardResult) => {
    setWizardSaving(true);
    setWizardError(null);
    try {
      // Persist the wizard result through the injected services port
      // (account -> application -> credentials -> profile chain).
      const account = await services.accounts.create(result.account);
      const application = await services.applications.create(account.id, result.application);
      const credentials = await Promise.all(
        result.credentials.map((command) => services.credentials.create(application.id, command)),
      );
      const primaryCredential = credentials[0];
      await services.profiles.create({
        ...result.profile,
        providerAppId: application.providerApplicationId,
        credentialRef: primaryCredential?.credentialRef ?? result.profile.credentialRef,
      });
      setWizardSchema(null);
      await Promise.all([accountsList.refresh(), profilesList.refresh(), refreshDashboard()]);
      navigateTo("#/admin/provider-profiles");
    } catch (error) {
      setWizardError(
        error instanceof Error
          ? error.message
          : t("admin.rtc.errorFailedPersistWizard", "Failed to persist provider wizard"),
      );
    } finally {
      setWizardSaving(false);
    }
  };

  const handleCapabilitySave = async (enabled: string[], disabled: string[]) => {
    if (!selectedProfile) {
      return;
    }
    setCapabilitySaving(true);
    setCapabilityError(null);
    try {
      await services.profiles.configureCapabilities(selectedProfile.id, enabled, disabled);
      setSelectedPlugin(null);
      setSelectedProfile(null);
      await profilesList.refresh();
    } catch (error) {
      setCapabilityError(
        error instanceof Error
          ? error.message
          : t("admin.rtc.errorFailedCapabilities", "Failed to configure capabilities"),
      );
    } finally {
      setCapabilitySaving(false);
    }
  };

  /** Query kinds that target a media session (room-only targets use a room id). */
  const QUERY_KIND_TARGETS: Record<ProviderQueryJobCreateCommand["queryKind"], "room" | "session"> = {
    room_online_users: "room",
    room_state: "room",
    media_session_state: "session",
    recording_artifacts: "session",
    quality_samples: "session",
  };

  const handleCreateQueryJob = async () => {
    const providerOptions = schemas.map((schema) => schema.provider);
    const provider = queryJobForm.provider || providerOptions[0] || "";
    if (!provider) {
      setQueryJobFormError(
        t("admin.rtc.queryJobs.validation.providerRequired", "Select a provider to query."),
      );
      return;
    }
    const target = QUERY_KIND_TARGETS[queryJobForm.queryKind];
    const targetId =
      target === "session" ? (queryJobForm.mediaSessionId ?? "").trim() : (queryJobForm.roomId ?? "").trim();
    if (!targetId) {
      setQueryJobFormError(
        target === "session"
          ? t(
              "admin.rtc.queryJobs.validation.sessionRequired",
              "This query kind requires a media session ID.",
            )
          : t("admin.rtc.queryJobs.validation.roomRequired", "This query kind requires a room ID."),
      );
      return;
    }
    setQueryJobFormError(null);
    setQueryJobLoading(true);
    setQueryJobError(null);
    try {
      const job = await services.queryJobs.create({
        ...queryJobForm,
        provider,
        roomId: target === "room" ? targetId : null,
        mediaSessionId: target === "session" ? targetId : null,
      });
      setActiveQueryJobId(job.id);
      setQueryJobDetail(job);
      const snapshots = await services.queryJobs.listSnapshots(job.id);
      setQuerySnapshots(snapshots.items);
    } catch (error) {
      setQueryJobError(
        error instanceof Error
          ? error.message
          : t("admin.rtc.errorFailedQueryJobCreate", "Failed to create query job"),
      );
    } finally {
      setQueryJobLoading(false);
    }
  };

  const handleLoadQueryJob = async () => {
    const jobId = activeQueryJobId?.trim();
    if (!jobId) {
      setQueryJobFormError(
        t("admin.rtc.queryJobs.validation.jobIdRequired", "Enter a query job ID to load."),
      );
      return;
    }
    setQueryJobFormError(null);
    setQueryJobLoading(true);
    setQueryJobError(null);
    try {
      const job = await services.queryJobs.get(jobId);
      setQueryJobDetail(job);
      // Sync the form with the loaded job so refresh/retry targets the same scope.
      setQueryJobForm((current) => ({
        ...current,
        provider: job.provider,
        queryKind: job.queryKind,
        roomId: job.roomId ?? "",
        mediaSessionId: job.mediaSessionId ?? "",
      }));
      const snapshots = await services.queryJobs.listSnapshots(jobId);
      setQuerySnapshots(snapshots.items);
    } catch (error) {
      setQueryJobError(
        error instanceof Error
          ? error.message
          : t("admin.rtc.errorFailedQueryJobLoad", "Failed to load query job"),
      );
    } finally {
      setQueryJobLoading(false);
    }
  };

  const handleRefreshQueryJob = async () => {
    const jobId = activeQueryJobId ?? queryJobDetail?.id;
    if (!jobId) {
      return;
    }
    setQueryJobRefreshing(true);
    setQueryJobError(null);
    try {
      const job = await services.queryJobs.get(jobId);
      setQueryJobDetail(job);
      const snapshots = await services.queryJobs.listSnapshots(jobId);
      setQuerySnapshots(snapshots.items);
    } catch (error) {
      setQueryJobError(
        error instanceof Error
          ? error.message
          : t("admin.rtc.errorFailedQueryJobLoad", "Failed to load query job"),
      );
    } finally {
      setQueryJobRefreshing(false);
    }
  };

  const filteredRooms = roomsList.data;

  const renderRoute = () => {
    const sessionId = parseParamRoute(route, "/admin/media-sessions");
    const artifactId = parseParamRoute(route, "/admin/media-artifacts");
    const roomId = parseParamRoute(route, "/admin/rooms");

    if (sessionId) {
      const session = selectedSession ?? sessionsList.data.find((item) => item.id === sessionId) ?? null;
      if (!session) {
        return (
          <div className="admin-card">
            <h2>{t("admin.rtc.sessionDetail.title", "Session Details")}</h2>
            <p className="admin-muted">
              {t("admin.rtc.sessionDetail.loading", "Loading session {{id}}...", { id: sessionId })}
            </p>
            <button type="button" onClick={() => navigateTo("#/admin/media-sessions")}>
              {t("admin.rtc.back", "Back")}
            </button>
          </div>
        );
      }
      return (
        <MediaSessionDetailPanel
          session={session}
          completionRecord={completionRecord}
          completionLoading={completionLoading}
          completionError={completionError}
          onLoadCompletion={() => {
            setCompletionLoading(true);
            setCompletionError(null);
            void services.mediaSessions
              .getCompletionRecord(session.id)
              .then(setCompletionRecord)
              .catch((error) =>
                setCompletionError(
                  error instanceof Error
                    ? error.message
                    : t("admin.rtc.errorCompletionUnavailable", "Completion record unavailable"),
                ),
              )
              .finally(() => setCompletionLoading(false));
          }}
          onClose={async (target) => {
            await services.mediaSessions.close(target.id);
            setSelectedSession({ ...target, status: "ended" });
            await sessionsList.refresh();
          }}
          onBack={() => {
            setSelectedSession(null);
            navigateTo("#/admin/media-sessions");
          }}
        />
      );
    }

    if (artifactId) {
      const artifact = selectedArtifact ?? artifactsList.data.find((item) => item.id === artifactId) ?? null;
      if (!artifact) {
        return (
          <div className="admin-card">
            <h2>{t("admin.rtc.artifactDetail.title", "Artifact Details")}</h2>
            <p className="admin-muted">
              {t("admin.rtc.artifactDetail.loading", "Loading artifact {{id}}...", { id: artifactId })}
            </p>
            <button type="button" onClick={() => navigateTo("#/admin/media-artifacts")}>
              {t("admin.rtc.back", "Back")}
            </button>
          </div>
        );
      }
      return (
        <MediaArtifactDetailPanel
          artifact={artifact}
          onBack={() => {
            setSelectedArtifact(null);
            navigateTo("#/admin/media-artifacts");
          }}
        />
      );
    }

    if (roomId) {
      const room = selectedRoom ?? roomsList.data.find((item) => item.id === roomId) ?? null;
      if (!room) {
        return (
          <div className="admin-card">
            <h2>{t("admin.rtc.roomDetail.title", "Room Details")}</h2>
            <p className="admin-muted">
              {t("admin.rtc.roomDetail.loading", "Loading room {{id}}...", { id: roomId })}
            </p>
            <button type="button" onClick={() => navigateTo("#/admin/rooms")}>
              {t("admin.rtc.back", "Back")}
            </button>
          </div>
        );
      }
      const roomSessions = sessionsList.data.filter((session) => session.roomId === roomId);
      return (
        <RoomDetailPanel
          room={room}
          sessions={roomSessions}
          sessionsLoading={sessionsList.loading}
          onSelectSession={(session) => {
            setSelectedSession(session);
            navigateTo(`#/admin/media-sessions/${encodeURIComponent(session.id)}`);
          }}
          onBack={() => {
            setSelectedRoom(null);
            navigateTo("#/admin/rooms");
          }}
        />
      );
    }

    switch (route) {
      case "/admin/dashboard":
        if (dashboardLoading) return <AdminLoading />;
        return (
          <>
            {dashboardError && <AdminError message={dashboardError} />}
            <ProviderHealthDashboard
              profiles={dashboardData.profiles}
              schemas={dashboardData.schemas}
              onVerify={async (profile) => {
                await services.profiles.verify(profile.id, "health");
                await refreshDashboard();
              }}
              onRefresh={() => void refreshDashboard()}
            />
          </>
        );

      case "/admin/provider-accounts": {
        const { loading, error, data, refresh, hasMore, loadMore } = accountsList;
        if (loading && data.length === 0) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <h2>{t("admin.rtc.accounts.title", "Provider Accounts")}</h2>
            <ProviderAccountList
              accounts={data}
              onSelect={() => undefined}
              onDisable={async (account) => {
                await services.accounts.list({});
                await refresh();
              }}
            />
            {hasMore && (
              <button type="button" onClick={() => void loadMore()} disabled={loading}>
                {loading
                  ? t("admin.rtc.loadingShort", "Loading...")
                  : t("admin.rtc.accounts.loadMore", "Load more accounts")}
              </button>
            )}
          </>
        );
      }

      case "/admin/provider-profiles": {
        const { loading, error, data, refresh, hasMore, loadMore } = profilesList;
        if (loading && data.length === 0) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <h2>{t("admin.rtc.profiles.title", "Provider Profiles")}</h2>
            <ProviderProfileList
              profiles={data}
              onSelect={(profile) => {
                setSelectedProfile(profile);
                navigateTo("#/admin/providers");
              }}
              onDisable={async (profile) => {
                await services.profiles.disable(profile.id);
                await refresh();
              }}
              onVerify={async (profile) => {
                await services.profiles.verify(profile.id, "health");
                await refresh();
              }}
            />
            {hasMore && (
              <button type="button" onClick={() => void loadMore()} disabled={loading}>
                {loading
                  ? t("admin.rtc.loadingShort", "Loading...")
                  : t("admin.rtc.profiles.loadMore", "Load more profiles")}
              </button>
            )}
          </>
        );
      }

      case "/admin/provider-routes": {
        const { loading, error, data, hasMore, loadMore } = routesList;
        if (loading && data.length === 0) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <h2>{t("admin.rtc.routes.title", "Provider Routes")}</h2>
            <ProviderRouteList routes={data} />
            {hasMore && (
              <button type="button" onClick={() => void loadMore()} disabled={loading}>
                {loading
                  ? t("admin.rtc.loadingShort", "Loading...")
                  : t("admin.rtc.routes.loadMore", "Load more routes")}
              </button>
            )}
          </>
        );
      }

      case "/admin/providers": {
        const { loading, error, data, hasMore, loadMore } = pluginsList;
        if (loading && data.length === 0 && !selectedPlugin) return <AdminLoading />;
        const profileForCapability =
          selectedProfile ??
          profilesList.data.find((profile) => profile.provider === selectedPlugin?.providerKind) ??
          null;
        const supportedCapabilities = selectedPlugin
          ? mapPluginCapabilitiesToBackend([
              ...selectedPlugin.requiredCapabilities,
              ...selectedPlugin.optionalCapabilities,
            ])
          : [];
        const requiredCapabilities = selectedPlugin
          ? mapPluginCapabilitiesToBackend(selectedPlugin.requiredCapabilities)
          : [];
        return (
          <>
            {error && <AdminError message={error} />}
            {capabilityError && <AdminError message={capabilityError} />}
            {!selectedPlugin ? (
              <>
                <h2>{t("admin.rtc.plugins.title", "Provider Plugins")}</h2>
                <ProviderPluginList
                  plugins={data}
                  onSelect={(plugin) => {
                    setSelectedPlugin(plugin);
                    setSelectedProfile(null);
                  }}
                />
                {hasMore && (
                  <button type="button" onClick={() => void loadMore()} disabled={loading}>
                    {loading
                      ? t("admin.rtc.loadingShort", "Loading...")
                      : t("admin.rtc.plugins.loadMore", "Load more plugins")}
                  </button>
                )}
              </>
            ) : profileForCapability ? (
              <>
                <h2>{t("admin.rtc.capabilities.title", "Configure Capabilities")}</h2>
                {capabilitySaving && (
                  <AdminLoading label={t("admin.rtc.capabilities.saving", "Saving capabilities...")} />
                )}
                <ProviderCapabilityConfig
                  providerName={selectedPlugin.displayName}
                  currentCapabilities={profileCapabilitiesToBackendKeys(profileForCapability.capabilities)}
                  supportedCapabilities={supportedCapabilities}
                  requiredCapabilities={requiredCapabilities}
                  onSave={(enabled, disabled) => void handleCapabilitySave(enabled, disabled)}
                  onCancel={() => {
                    setSelectedPlugin(null);
                    setSelectedProfile(null);
                  }}
                />
              </>
            ) : (
              <div>
                <h2>{selectedPlugin.displayName}</h2>
                <p>
                  {t("admin.rtc.plugins.noProfile", "No active provider profile found for {{provider}}.", {
                    provider: selectedPlugin.providerKind,
                  })}
                </p>
                <p>{t("admin.rtc.plugins.noProfileHint", "Create one via the Setup Wizard first.")}</p>
                <button onClick={() => setSelectedPlugin(null)}>{t("admin.rtc.back", "Back")}</button>
              </div>
            )}
          </>
        );
      }

      case "/admin/wizard": {
        if (schemasLoading) return <AdminLoading />;
        return (
          <>
            {schemasError && <AdminError message={schemasError} />}
            {wizardError && <AdminError message={wizardError} />}
            {!wizardSchema ? (
              <div style={{ textAlign: "center", padding: "48px" }}>
                <h2>{t("admin.rtc.wizard.title", "Provider Setup Wizard")}</h2>
                <p style={{ color: "#6c757d", marginBottom: "24px" }}>
                  {t("admin.rtc.wizard.hint", "Configure a new RTC provider step by step")}
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  {schemas.map((schema) => (
                    <button
                      key={schema.provider}
                      onClick={() => setWizardSchema(schema)}
                      style={{
                        padding: "16px 24px",
                        border: "1px solid #dee2e6",
                        borderRadius: "8px",
                        background: "white",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                    >
                      <strong>{schema.displayName}</strong>
                      <br />
                      <span style={{ fontSize: "13px", color: "#6c757d" }}>{schema.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {wizardSaving && (
                  <AdminLoading
                    label={t("admin.rtc.wizard.saving", "Persisting provider configuration...")}
                  />
                )}
                <ProviderConfigWizard
                  schema={wizardSchema}
                  onComplete={(result) => void handleWizardComplete(result)}
                  onCancel={() => setWizardSchema(null)}
                />
              </>
            )}
          </>
        );
      }

      case "/admin/rooms": {
        const { loading, error, data, refresh, hasMore, loadMore } = roomsList;
        if (loading && data.length === 0) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <h2>{t("admin.rtc.rooms.title", "Rooms")}</h2>
            <RoomFilter
              filter={roomFilter}
              onChange={setRoomFilter}
              onReset={() => setRoomFilter(DEFAULT_ROOM_FILTER)}
              totalCount={data.length}
              filteredCount={filteredRooms.length}
            />
            <RoomList
              rooms={filteredRooms}
              sort={roomSort}
              onSortChange={setRoomSort}
              onSelect={(room) => {
                setSelectedRoom(room);
                navigateTo(`#/admin/rooms/${encodeURIComponent(room.id)}`);
              }}
              onBatchAction={() => undefined}
              onRefresh={() => void refresh()}
              loading={loading}
              fetchAllRooms={() =>
                collectAllPages((cursor) =>
                  services.rooms.list({
                    cursor,
                    search: roomFilter.search || undefined,
                    status: roomFilter.status === "all" ? undefined : roomFilter.status,
                    ownerUserId: roomFilter.ownerUserId || undefined,
                    createdAfter: roomDateRangeCreatedAfter(roomFilter.dateRange),
                    sort: roomSort,
                  }),
                )
              }
            />
            {hasMore && (
              <button type="button" onClick={() => void loadMore()} disabled={loading}>
                {loading
                  ? t("admin.rtc.loadingShort", "Loading...")
                  : t("admin.rtc.rooms.loadMore", "Load more rooms")}
              </button>
            )}
            <div className="form-actions">
              <button type="button" onClick={() => setRoomCreateOpen(true)}>
                {t("admin.rtc.rooms.create", "Create Room")}
              </button>
            </div>
            <RoomCreateDialog
              open={roomCreateOpen}
              onClose={() => setRoomCreateOpen(false)}
              onCreate={async (command) => {
                await services.rooms.create(command);
                await refresh();
              }}
            />
          </>
        );
      }

      case "/admin/media-sessions": {
        const { loading, error, data, refresh, hasMore, loadMore } = sessionsList;
        if (loading && data.length === 0) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <MediaSessionList
              sessions={data}
              loading={loading}
              filter={sessionFilter}
              onChangeFilter={setSessionFilter}
              onResetFilter={() => setSessionFilter(DEFAULT_MEDIA_SESSION_FILTER)}
              onSelect={(session) => {
                setSelectedSession(session);
                navigateTo(`#/admin/media-sessions/${encodeURIComponent(session.id)}`);
              }}
              onRefresh={() => void refresh()}
              onExportAll={() =>
                collectAllPages((cursor) =>
                  services.mediaSessions.list({ cursor, ...buildMediaSessionListParams(sessionFilter) }),
                )
              }
            />
            {hasMore && (
              <button type="button" onClick={() => void loadMore()} disabled={loading}>
                {loading
                  ? t("admin.rtc.loadingShort", "Loading...")
                  : t("admin.rtc.sessions.loadMore", "Load more sessions")}
              </button>
            )}
          </>
        );
      }

      case "/admin/media-artifacts": {
        const { loading, error, data, refresh, hasMore, loadMore } = artifactsList;
        if (loading && data.length === 0) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <MediaArtifactList
              artifacts={data}
              loading={loading}
              filter={artifactFilter}
              onChangeFilter={setArtifactFilter}
              onResetFilter={() => setArtifactFilter(DEFAULT_MEDIA_ARTIFACT_FILTER)}
              onSelect={(artifact) => {
                setSelectedArtifact(artifact);
                navigateTo(`#/admin/media-artifacts/${encodeURIComponent(artifact.id)}`);
              }}
              onRefresh={() => void refresh()}
              onExportAll={() =>
                collectAllPages((cursor) =>
                  services.mediaArtifacts.list({ cursor, ...buildMediaArtifactListParams(artifactFilter) }),
                )
              }
            />
            {hasMore && (
              <button type="button" onClick={() => void loadMore()} disabled={loading}>
                {loading
                  ? t("admin.rtc.loadingShort", "Loading...")
                  : t("admin.rtc.artifacts.loadMore", "Load more artifacts")}
              </button>
            )}
          </>
        );
      }

      case "/admin/quality-samples": {
        const { loading, error, data, refresh, hasMore, loadMore } = qualityList;
        if (loading && data.length === 0) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <QualitySampleList
              samples={data}
              loading={loading}
              filter={qualityFilter}
              onChangeFilter={setQualityFilter}
              onResetFilter={() => setQualityFilter(DEFAULT_QUALITY_SAMPLE_FILTER)}
              onRefresh={() => void refresh()}
              onExportAll={() =>
                collectAllPages((cursor) =>
                  services.qualitySamples.list({ cursor, ...buildQualitySampleListParams(qualityFilter) }),
                )
              }
            />
            {hasMore && (
              <button type="button" onClick={() => void loadMore()} disabled={loading}>
                {loading
                  ? t("admin.rtc.loadingShort", "Loading...")
                  : t("admin.rtc.quality.loadMore", "Load more samples")}
              </button>
            )}
          </>
        );
      }

      case "/admin/provider-applications": {
        const { loading, error, data } = accountsList;
        if (loading && data.length === 0) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <ProviderApplicationPage accounts={data} services={services.applications} />
          </>
        );
      }

      case "/admin/provider-credentials": {
        const { loading: accountsLoading, error: accountsError, data: accounts } = accountsList;
        if (accountsLoading && accounts.length === 0) return <AdminLoading />;
        return (
          <>
            {accountsError && <AdminError message={accountsError} />}
            <ProviderCredentialPage
              accounts={accounts}
              applicationService={services.applications}
              services={services.credentials}
            />
          </>
        );
      }

      case "/admin/webhook-events": {
        const { loading, error, data, hasMore, loadMore } = webhookList;
        if (loading && data.length === 0) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <h2>{t("admin.rtc.webhooks.title", "Webhook Events")}</h2>
            <ProviderWebhookEventList events={data} />
            {hasMore && (
              <button type="button" onClick={() => void loadMore()} disabled={loading}>
                {loading
                  ? t("admin.rtc.loadingShort", "Loading...")
                  : t("admin.rtc.webhooks.loadMore", "Load more events")}
              </button>
            )}
          </>
        );
      }

      case "/admin/query-jobs": {
        const providerOptions = schemas.map((schema) => schema.provider);
        const effectiveProvider = queryJobForm.provider || providerOptions[0] || "";
        const queryKindOptions = Object.keys(QUERY_KIND_TARGETS) as ProviderQueryJobCreateCommand["queryKind"][];
        const target = QUERY_KIND_TARGETS[queryJobForm.queryKind];
        return (
          <>
            {queryJobError && <AdminError message={queryJobError} />}
            <h2>{t("admin.rtc.queryJobs.title", "Query Jobs")}</h2>
            <div className="query-job-form">
              <div className="form-field">
                <label htmlFor="query-job-provider">
                  {t("admin.rtc.queryJobs.provider", "Provider")}
                </label>
                <select
                  id="query-job-provider"
                  value={effectiveProvider}
                  onChange={(event) =>
                    setQueryJobForm({ ...queryJobForm, provider: event.target.value })
                  }
                  disabled={schemasLoading || providerOptions.length === 0}
                >
                  {providerOptions.length === 0 && (
                    <option value="">{t("admin.rtc.queryJobs.noProviders", "No providers available")}</option>
                  )}
                  {providerOptions.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="query-job-kind">
                  {t("admin.rtc.queryJobs.queryKind", "Query Kind")}
                </label>
                <select
                  id="query-job-kind"
                  value={queryJobForm.queryKind}
                  onChange={(event) =>
                    setQueryJobForm({
                      ...queryJobForm,
                      queryKind: event.target.value as ProviderQueryJobCreateCommand["queryKind"],
                    })
                  }
                >
                  {queryKindOptions.map((kind) => (
                    <option key={kind} value={kind}>
                      {t(`admin.rtc.queryJobs.kind.${kind}`, kind)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="query-job-room-id">
                  {t("admin.rtc.queryJobs.roomId", "Room ID")}
                </label>
                <input
                  id="query-job-room-id"
                  value={queryJobForm.roomId ?? ""}
                  placeholder={t(
                    "admin.rtc.queryJobs.roomIdPlaceholder",
                    "Required for room-targeted queries",
                  )}
                  onChange={(event) => setQueryJobForm({ ...queryJobForm, roomId: event.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="query-job-session-id">
                  {t("admin.rtc.queryJobs.mediaSessionId", "Media Session ID")}
                </label>
                <input
                  id="query-job-session-id"
                  value={queryJobForm.mediaSessionId ?? ""}
                  placeholder={t(
                    "admin.rtc.queryJobs.sessionIdPlaceholder",
                    "Required for session/quality/recording queries",
                  )}
                  onChange={(event) =>
                    setQueryJobForm({ ...queryJobForm, mediaSessionId: event.target.value })
                  }
                />
              </div>
              <p className="query-job-hint">
                {target === "session"
                  ? t(
                      "admin.rtc.queryJobs.targetHint.session",
                      "This query kind targets a media session — provide its ID.",
                    )
                  : t(
                      "admin.rtc.queryJobs.targetHint.room",
                      "This query kind targets a room — provide its ID.",
                    )}
              </p>
              {queryJobFormError && <div className="admin-error">{queryJobFormError}</div>}
              <div className="form-field">
                <label htmlFor="query-job-id">
                  {t("admin.rtc.queryJobs.jobId", "Job ID")}
                </label>
                <input
                  id="query-job-id"
                  value={activeQueryJobId ?? ""}
                  placeholder={t("admin.rtc.queryJobs.jobIdPlaceholder", "Paste a job ID to load it")}
                  onChange={(event) => setActiveQueryJobId(event.target.value || null)}
                />
              </div>
              <div className="form-actions">
                <button onClick={() => void handleCreateQueryJob()} disabled={queryJobLoading}>
                  {t("admin.rtc.queryJobs.create", "Create Job")}
                </button>
                <button
                  onClick={() => void handleLoadQueryJob()}
                  disabled={queryJobLoading || !activeQueryJobId?.trim()}
                >
                  {t("admin.rtc.queryJobs.load", "Load Job")}
                </button>
              </div>
            </div>
            {queryJobLoading && (
              <AdminLoading label={t("admin.rtc.queryJobs.working", "Working on query job...")} />
            )}
            <ProviderQueryJobPanel
              job={queryJobDetail}
              snapshots={querySnapshots}
              onRefresh={() => void handleRefreshQueryJob()}
              refreshing={queryJobRefreshing}
            />
          </>
        );
      }

      default:
        return (
          <div>
            <h2>{t("admin.rtc.notFound.title", "Page Not Found")}</h2>
            <p>{t("admin.rtc.notFound.unknownRoute", "Unknown admin route: {{route}}", { route })}</p>
            <a href="#/admin/dashboard">{t("admin.rtc.notFound.goDashboard", "Go to Dashboard")}</a>
          </div>
        );
    }
  };

  return <div className="rtc-admin-page">{renderRoute()}</div>;
}

/** Collects every page of a cursor-paginated list (used by CSV exports). */
async function collectAllPages<T>(
  fetchPage: (cursor?: string) => Promise<{ items: T[]; nextCursor?: string | null }>,
): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;
  for (let guard = 0; guard < 100; guard += 1) {
    const page = await fetchPage(cursor);
    all.push(...page.items);
    const next = page.nextCursor?.trim();
    if (!next) {
      break;
    }
    cursor = next;
  }
  return all;
}
