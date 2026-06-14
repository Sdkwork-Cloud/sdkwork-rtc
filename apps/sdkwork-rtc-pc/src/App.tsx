import { useState } from "react";
import { AuthGate } from "./AuthGate";
import { bootstrap } from "./bootstrap/runtime";
import {
  ProviderHealthDashboard,
  ProviderPluginList,
  ProviderCapabilityConfig,
  RoomList,
  ProviderConfigWizard,
  RoomFilter,
  DEFAULT_ROOM_FILTER,
  filterRooms,
  type Room,
  type RoomFilterState,
  type ProviderProfile,
  type ProviderConfigSchema,
} from "@sdkwork/rtc-pc-admin-core";

bootstrap();

const DEMO_ROOMS: Room[] = [
  { id: "room-1", tenantId: "t1", organizationId: "o1", ownerUserId: "user-1", title: "Team Standup", status: "active", createdAt: "2026-06-10T09:00:00Z" },
  { id: "room-2", tenantId: "t1", organizationId: "o1", ownerUserId: "user-2", title: "Client Meeting", status: "active", createdAt: "2026-06-11T14:00:00Z" },
  { id: "room-3", tenantId: "t1", organizationId: "o1", ownerUserId: "user-1", title: "Design Review", status: "archived", createdAt: "2026-06-05T10:00:00Z" },
  { id: "room-4", tenantId: "t1", organizationId: "o1", ownerUserId: "user-3", title: "Sprint Planning", status: "active", createdAt: "2026-06-12T11:00:00Z" },
  { id: "room-5", tenantId: "t1", organizationId: "o1", ownerUserId: "user-2", title: "1:1 Meeting", status: "disabled", createdAt: "2026-06-01T15:00:00Z" },
  { id: "room-6", tenantId: "t1", organizationId: "o1", ownerUserId: "user-4", title: "All Hands", status: "active", createdAt: "2026-06-13T09:00:00Z" },
];

const DEMO_PROFILES: ProviderProfile[] = [
  {
    id: "profile-volcengine", tenantId: "t1", organizationId: "o1", provider: "volcengine", code: "default", name: "Volcengine Default",
    status: "active", isDefault: true, priority: 10, environment: "production", region: "cn-beijing",
    capabilities: { audio: true, video: true, live: true, screenShare: true, recording: true, webhook: true, activeQuery: true, supportedRegions: ["cn-beijing"], providerFeatures: {} },
    configSnapshot: {}, healthStatus: "healthy", version: "1", lastVerifiedAt: "2026-06-14T10:00:00Z",
  },
  {
    id: "profile-tencent", tenantId: "t1", organizationId: "o1", provider: "tencent", code: "default", name: "Tencent Default",
    status: "active", isDefault: true, priority: 10, environment: "production", region: "ap-guangzhou",
    capabilities: { audio: true, video: true, live: true, screenShare: true, recording: true, webhook: true, activeQuery: true, supportedRegions: ["ap-guangzhou"], providerFeatures: {} },
    configSnapshot: {}, healthStatus: "degraded", version: "1", lastVerifiedAt: "2026-06-14T09:00:00Z",
  },
  {
    id: "profile-agora", tenantId: "t1", organizationId: "o1", provider: "agora", code: "default", name: "Agora Default",
    status: "active", isDefault: true, priority: 5, environment: "production", region: "global",
    capabilities: { audio: true, video: true, live: true, screenShare: true, recording: true, webhook: true, activeQuery: true, supportedRegions: ["global"], providerFeatures: {} },
    configSnapshot: {}, healthStatus: "healthy", version: "1",
  },
];

const DEMO_SCHEMAS: ProviderConfigSchema[] = [
  {
    provider: "volcengine", displayName: "Volcengine RTC", description: "火山引擎实时音视频",
    accountFields: [{ key: "externalTenantId", label: "Account ID", type: "string", required: false }],
    applicationFields: [
      { key: "providerApplicationId", label: "AppId", type: "string", required: true },
      { key: "region", label: "Region", type: "enum", required: false, values: ["cn-beijing", "cn-shanghai"] },
    ],
    credentialRoles: [
      { role: "rtc_token_signing", label: "RTC Token", description: "用于生成参与者凭证", fields: [{ key: "credentialRef", label: "App Key", type: "secret_ref", required: true }] },
    ],
    profileFields: [
      { key: "providerAppId", label: "AppId", type: "string", required: true },
      { key: "region", label: "Region", type: "enum", required: false, values: ["cn-beijing", "cn-shanghai"], default: "cn-beijing" },
    ],
    optionalCapabilities: ["recording", "artifact"], requiredCapabilities: ["session", "credential"],
  },
  {
    provider: "tencent", displayName: "Tencent TRTC", description: "腾讯云实时音视频",
    accountFields: [{ key: "externalTenantId", label: "Account ID", type: "string", required: false }],
    applicationFields: [
      { key: "providerApplicationId", label: "SDKAppId", type: "number", required: true },
      { key: "region", label: "Region", type: "enum", required: false, values: ["ap-guangzhou", "ap-shanghai"] },
    ],
    credentialRoles: [
      { role: "usersig_signing", label: "UserSig", description: "用于生成参与者凭证", fields: [{ key: "credentialRef", label: "SDK Secret Key", type: "secret_ref", required: true }] },
    ],
    profileFields: [
      { key: "providerAppId", label: "SDKAppId", type: "string", required: true },
      { key: "region", label: "Region", type: "enum", required: false, values: ["ap-guangzhou", "ap-shanghai"], default: "ap-guangzhou" },
    ],
    optionalCapabilities: ["recording", "cdn-relay"], requiredCapabilities: ["session", "credential"],
  },
  {
    provider: "agora", displayName: "Agora RTC", description: "Agora实时音视频",
    accountFields: [],
    applicationFields: [{ key: "providerApplicationId", label: "App ID", type: "string", required: true }],
    credentialRoles: [
      { role: "rtc_token_signing", label: "RTC Token", description: "用于生成参与者凭证", fields: [{ key: "credentialRef", label: "App Certificate", type: "secret_ref", required: true }] },
    ],
    profileFields: [
      { key: "providerAppId", label: "App ID", type: "string", required: true },
      { key: "region", label: "Region", type: "string", required: false, default: "global" },
    ],
    optionalCapabilities: ["recording", "e2ee"], requiredCapabilities: ["session", "credential"],
  },
];

const DEMO_PLUGINS = [
  {
    pluginId: "rtc-volcengine", domain: "rtc", providerKind: "volcengine", displayName: "Volcengine RTC",
    interfaceVersion: "v1", configSchemaRef: "providers/rtc-volcengine.schema.json",
    defaultSelected: true, tenantOverrideAllowed: true,
    requiredCapabilities: ["session", "credential", "provider.webhook", "health", "media.audio", "media.video", "live.broadcast", "live.audience", "provider.event-normalization"],
    optionalCapabilities: ["recording", "artifact", "screen-share", "cloud-mix", "provider.active-query"],
    unsupportedFeatures: [], degradedBehaviors: [],
  },
  {
    pluginId: "rtc-tencent", domain: "rtc", providerKind: "tencent", displayName: "Tencent TRTC",
    interfaceVersion: "v1", configSchemaRef: "providers/rtc-tencent.schema.json",
    defaultSelected: false, tenantOverrideAllowed: true,
    requiredCapabilities: ["session", "credential", "provider.webhook", "health", "media.audio", "media.video", "live.broadcast", "live.audience", "provider.event-normalization"],
    optionalCapabilities: ["recording", "artifact", "screen-share", "cdn-relay", "provider.active-query"],
    unsupportedFeatures: [], degradedBehaviors: [],
  },
  {
    pluginId: "rtc-agora", domain: "rtc", providerKind: "agora", displayName: "Agora RTC",
    interfaceVersion: "v1", configSchemaRef: "providers/rtc-agora.schema.json",
    defaultSelected: false, tenantOverrideAllowed: true,
    requiredCapabilities: ["session", "credential", "provider.webhook", "health", "media.audio", "media.video", "live.broadcast", "live.audience", "provider.event-normalization"],
    optionalCapabilities: ["recording", "artifact", "screen-share", "cloud-mix", "data-channel", "spatial-audio", "e2ee", "provider.active-query"],
    unsupportedFeatures: [], degradedBehaviors: [],
  },
];

type Tab = "dashboard" | "rooms" | "providers" | "wizard";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [filter, setFilter] = useState<RoomFilterState>(DEFAULT_ROOM_FILTER);
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  const [showWizard, setShowWizard] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<typeof DEMO_PLUGINS[0] | null>(null);

  const filteredRooms = filterRooms(DEMO_ROOMS, filter);

  return (
    <AuthGate>
      <div className="admin-app">
        <header className="admin-header">
          <h1>SDKWork RTC Admin</h1>
          <nav className="admin-nav">
            <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
            <button className={activeTab === "rooms" ? "active" : ""} onClick={() => setActiveTab("rooms")}>Rooms</button>
            <button className={activeTab === "providers" ? "active" : ""} onClick={() => setActiveTab("providers")}>Providers</button>
            <button className={activeTab === "wizard" ? "active" : ""} onClick={() => setActiveTab("wizard")}>Setup Wizard</button>
          </nav>
        </header>

        <main className="admin-main">
          {activeTab === "dashboard" && (
            <ProviderHealthDashboard
              profiles={DEMO_PROFILES}
              schemas={DEMO_SCHEMAS}
              onVerify={(profile) => alert(`Verifying ${profile.name}...`)}
              onRefresh={() => alert("Refreshing...")}
            />
          )}

          {activeTab === "rooms" && (
            <div>
              <RoomFilter
                filter={filter}
                onChange={setFilter}
                onReset={() => setFilter(DEFAULT_ROOM_FILTER)}
                totalCount={DEMO_ROOMS.length}
                filteredCount={filteredRooms.length}
              />
              <RoomList
                rooms={filteredRooms}
                onSelect={(room) => alert(`Selected: ${room.title}`)}
                onBatchAction={(action) => alert(`Batch: ${action.type} ${action.roomIds.length} rooms`)}
                onRefresh={() => alert("Refreshing...")}
              />
            </div>
          )}

          {activeTab === "providers" && (
            <div>
              {!selectedPlugin ? (
                <ProviderPluginList
                  plugins={DEMO_PLUGINS}
                  onSelect={(plugin) => setSelectedPlugin(plugin as typeof DEMO_PLUGINS[0])}
                />
              ) : (
                <ProviderCapabilityConfig
                  providerName={selectedPlugin.displayName}
                  currentCapabilities={Object.fromEntries(
                    [...selectedPlugin.requiredCapabilities, ...selectedPlugin.optionalCapabilities].map((cap) => [cap, true])
                  )}
                  supportedCapabilities={[...selectedPlugin.requiredCapabilities, ...selectedPlugin.optionalCapabilities]}
                  requiredCapabilities={selectedPlugin.requiredCapabilities}
                  onSave={(enabled, disabled) => {
                    alert(`Capabilities updated!\nEnabled: ${enabled.join(", ")}\nDisabled: ${disabled.join(", ")}`);
                    setSelectedPlugin(null);
                  }}
                  onCancel={() => setSelectedPlugin(null)}
                />
              )}
            </div>
          )}

          {activeTab === "wizard" && (
            <div>
              {!showWizard ? (
                <div style={{ textAlign: "center", padding: "48px" }}>
                  <h2>Provider Setup Wizard</h2>
                  <p style={{ color: "#6c757d", marginBottom: "24px" }}>Configure a new RTC provider step by step</p>
                  <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                    {DEMO_SCHEMAS.map((schema) => (
                      <button
                        key={schema.provider}
                        onClick={() => setShowWizard(true)}
                        style={{ padding: "16px 24px", border: "1px solid #dee2e6", borderRadius: "8px", background: "white", cursor: "pointer", fontSize: "16px" }}
                      >
                        <strong>{schema.displayName}</strong>
                        <br />
                        <span style={{ fontSize: "13px", color: "#6c757d" }}>{schema.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <ProviderConfigWizard
                  schema={DEMO_SCHEMAS[0]}
                  onComplete={(result) => {
                    alert("Configuration complete!\n\n" + JSON.stringify(result, null, 2));
                    setShowWizard(false);
                  }}
                  onCancel={() => setShowWizard(false)}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </AuthGate>
  );
}
