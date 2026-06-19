import { useMemo, useState } from "react";
import { AdminLayout } from "@sdkwork/rtc-h5-admin-shell";
import {
  DEFAULT_ROOM_FILTER,
  ProviderAccountList,
  ProviderCapabilityConfig,
  ProviderConfigWizard,
  ProviderHealthDashboard,
  ProviderPluginList,
  ProviderProfileList,
  ProviderQueryJobPanel,
  ProviderRouteList,
  ProviderWebhookEventList,
  RoomFilter,
  RoomList,
  filterRooms,
  mapPluginCapabilitiesToBackend,
  persistProviderWizard,
  profileCapabilitiesToBackendKeys,
  type ProviderConfigSchema,
  type ProviderPluginDescriptor,
  type ProviderProfile,
  type ProviderQueryJobCreateCommand,
  type ProviderWizardResult,
} from "@sdkwork/rtc-h5-admin-core";

import { AuthGate } from "./AuthGate";
import { createAdminServices } from "./bootstrap/adminServices";
import { useAdminData } from "./hooks/useAdminData";

interface AdminAppProps {
  route: string;
}

function AdminError({ message }: { message: string }) {
  return (
    <div className="admin-error" role="alert">
      {message}
    </div>
  );
}

function AdminLoading({ label = "Loading RTC admin data..." }: { label?: string }) {
  return <p>{label}</p>;
}

export function AdminApp({ route }: AdminAppProps) {
  const services = useMemo(() => createAdminServices(), []);
  const adminData = useAdminData(services);

  const [roomFilter, setRoomFilter] = useState(DEFAULT_ROOM_FILTER);
  const [wizardSchema, setWizardSchema] = useState<ProviderConfigSchema | null>(null);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardSaving, setWizardSaving] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<ProviderPluginDescriptor | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProviderProfile | null>(null);
  const [capabilityError, setCapabilityError] = useState<string | null>(null);
  const [capabilitySaving, setCapabilitySaving] = useState(false);

  const [queryJobForm, setQueryJobForm] = useState<ProviderQueryJobCreateCommand>({
    provider: "volcengine",
    queryKind: "room_state",
    roomId: "",
  });
  const [queryJobError, setQueryJobError] = useState<string | null>(null);
  const [queryJobLoading, setQueryJobLoading] = useState(false);
  const [activeQueryJobId, setActiveQueryJobId] = useState<string | null>(null);
  const [queryJobDetail, setQueryJobDetail] = useState<Awaited<
    ReturnType<typeof services.queryJobs.get>
  > | null>(null);
  const [querySnapshots, setQuerySnapshots] = useState<Awaited<
    ReturnType<typeof services.queryJobs.listSnapshots>
  >["items"]>([]);

  const filteredRooms = filterRooms(adminData.rooms.data, roomFilter);

  const handleWizardComplete = async (result: ProviderWizardResult) => {
    setWizardSaving(true);
    setWizardError(null);
    try {
      await persistProviderWizard(services, result);
      setWizardSchema(null);
      await Promise.all([
        adminData.accounts.refresh(),
        adminData.profiles.refresh(),
        adminData.dashboard.refresh(),
      ]);
      window.location.hash = "#/admin/provider-profiles";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to persist provider wizard";
      setWizardError(message);
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
      await adminData.profiles.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to configure capabilities";
      setCapabilityError(message);
    } finally {
      setCapabilitySaving(false);
    }
  };

  const handleCreateQueryJob = async () => {
    setQueryJobLoading(true);
    setQueryJobError(null);
    try {
      const job = await services.queryJobs.create({
        ...queryJobForm,
        roomId: queryJobForm.roomId || null,
        mediaSessionId: queryJobForm.mediaSessionId || null,
        providerSessionId: queryJobForm.providerSessionId || null,
        providerProfileId: queryJobForm.providerProfileId || null,
      });
      setActiveQueryJobId(job.id);
      setQueryJobDetail(job);
      const snapshots = await services.queryJobs.listSnapshots(job.id);
      setQuerySnapshots(snapshots.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create query job";
      setQueryJobError(message);
    } finally {
      setQueryJobLoading(false);
    }
  };

  const handleLoadQueryJob = async () => {
    if (!activeQueryJobId) {
      return;
    }
    setQueryJobLoading(true);
    setQueryJobError(null);
    try {
      const job = await services.queryJobs.get(activeQueryJobId);
      setQueryJobDetail(job);
      const snapshots = await services.queryJobs.listSnapshots(activeQueryJobId);
      setQuerySnapshots(snapshots.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load query job";
      setQueryJobError(message);
    } finally {
      setQueryJobLoading(false);
    }
  };

  const renderRoute = () => {
    switch (route) {
      case "/admin/dashboard": {
        const { loading, error, data, refresh } = adminData.dashboard;
        if (loading) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <ProviderHealthDashboard
              profiles={data.profiles}
              schemas={data.schemas}
              onVerify={async (profile) => {
                await services.profiles.verify(profile.id, "health");
                await refresh();
              }}
              onRefresh={() => void refresh()}
            />
          </>
        );
      }

      case "/admin/provider-accounts": {
        const { loading, error, data, refresh } = adminData.accounts;
        if (loading) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <h2>Provider Accounts</h2>
            <ProviderAccountList
              accounts={data}
              onSelect={() => undefined}
              onDisable={async (account) => {
                await services.accounts.disable(account.id);
                await refresh();
              }}
            />
          </>
        );
      }

      case "/admin/provider-profiles": {
        const { loading, error, data, refresh } = adminData.profiles;
        if (loading) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <h2>Provider Profiles</h2>
            <ProviderProfileList
              profiles={data}
              onSelect={(profile) => {
                setSelectedProfile(profile);
                window.location.hash = "#/admin/providers";
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
          </>
        );
      }

      case "/admin/provider-routes": {
        const { loading, error, data } = adminData.routes;
        if (loading) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <h2>Provider Routes</h2>
            <ProviderRouteList routes={data} />
          </>
        );
      }

      case "/admin/providers": {
        const { loading, error, data } = adminData.plugins;
        if (loading) return <AdminLoading />;
        const profileForCapability =
          selectedProfile ??
          adminData.profiles.data.find((profile) => profile.provider === selectedPlugin?.providerKind) ??
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
                <h2>Provider Plugins</h2>
                <ProviderPluginList
                  plugins={data}
                  onSelect={(plugin) => {
                    setSelectedPlugin(plugin);
                    setSelectedProfile(null);
                  }}
                />
              </>
            ) : profileForCapability ? (
              <>
                <h2>Configure Capabilities</h2>
                {capabilitySaving && <AdminLoading label="Saving capabilities..." />}
                <ProviderCapabilityConfig
                  providerName={selectedPlugin.displayName}
                  currentCapabilities={profileCapabilitiesToBackendKeys(
                    profileForCapability.capabilities,
                  )}
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
                <p>No active provider profile found for {selectedPlugin.providerKind}.</p>
                <p>Create one via the Setup Wizard first.</p>
                <button onClick={() => setSelectedPlugin(null)}>Back</button>
              </div>
            )}
          </>
        );
      }

      case "/admin/wizard": {
        const { loading, error, data } = adminData.schemas;
        if (loading) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            {wizardError && <AdminError message={wizardError} />}
            {!wizardSchema ? (
              <div style={{ textAlign: "center", padding: "48px" }}>
                <h2>Provider Setup Wizard</h2>
                <p style={{ color: "#6c757d", marginBottom: "24px" }}>
                  Configure a new RTC provider step by step
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  {data.map((schema) => (
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
                {wizardSaving && <AdminLoading label="Persisting provider configuration..." />}
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

      case "/admin/media-sessions": {
        const { loading, error, data, refresh } = adminData.rooms;
        if (loading) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <h2>Media Sessions</h2>
            <RoomFilter
              filter={roomFilter}
              onChange={setRoomFilter}
              onReset={() => setRoomFilter(DEFAULT_ROOM_FILTER)}
              totalCount={data.length}
              filteredCount={filteredRooms.length}
            />
            <RoomList
              rooms={filteredRooms}
              onSelect={() => undefined}
              onBatchAction={() => undefined}
              onRefresh={() => void refresh()}
            />
          </>
        );
      }

      case "/admin/webhook-events": {
        const { loading, error, data } = adminData.webhookEvents;
        if (loading) return <AdminLoading />;
        return (
          <>
            {error && <AdminError message={error} />}
            <h2>Webhook Events</h2>
            <ProviderWebhookEventList events={data} />
          </>
        );
      }

      case "/admin/query-jobs":
        return (
          <>
            {queryJobError && <AdminError message={queryJobError} />}
            <h2>Query Jobs</h2>
            <div className="query-job-form">
              <label>
                Provider
                <input
                  value={queryJobForm.provider}
                  onChange={(event) =>
                    setQueryJobForm({ ...queryJobForm, provider: event.target.value })
                  }
                />
              </label>
              <label>
                Query Kind
                <select
                  value={queryJobForm.queryKind}
                  onChange={(event) =>
                    setQueryJobForm({
                      ...queryJobForm,
                      queryKind: event.target.value as ProviderQueryJobCreateCommand["queryKind"],
                    })
                  }
                >
                  <option value="room_online_users">room_online_users</option>
                  <option value="room_state">room_state</option>
                  <option value="media_session_state">media_session_state</option>
                  <option value="recording_artifacts">recording_artifacts</option>
                  <option value="quality_samples">quality_samples</option>
                </select>
              </label>
              <label>
                Room ID
                <input
                  value={queryJobForm.roomId ?? ""}
                  onChange={(event) =>
                    setQueryJobForm({ ...queryJobForm, roomId: event.target.value })
                  }
                />
              </label>
              <label>
                Job ID
                <input
                  value={activeQueryJobId ?? ""}
                  onChange={(event) => setActiveQueryJobId(event.target.value || null)}
                />
              </label>
              <div className="form-actions">
                <button onClick={() => void handleCreateQueryJob()} disabled={queryJobLoading}>
                  Create Job
                </button>
                <button onClick={() => void handleLoadQueryJob()} disabled={queryJobLoading}>
                  Load Job
                </button>
              </div>
            </div>
            {queryJobLoading && <AdminLoading label="Working on query job..." />}
            <ProviderQueryJobPanel job={queryJobDetail} snapshots={querySnapshots} />
          </>
        );

      default:
        return (
          <div>
            <h2>Page Not Found</h2>
            <p>Unknown admin route: {route}</p>
            <a href="#/admin/dashboard">Go to Dashboard</a>
          </div>
        );
    }
  };

  return (
    <AuthGate>
      <AdminLayout>{renderRoute()}</AdminLayout>
    </AuthGate>
  );
}
