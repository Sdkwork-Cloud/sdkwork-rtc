import { useState } from "react";

interface ProviderCapability {
  key: string;
  label: string;
  description: string;
  category: "core" | "media" | "advanced";
}

const AVAILABLE_CAPABILITIES: ProviderCapability[] = [
  { key: "audio", label: "Audio", description: "音频通话能力", category: "core" },
  { key: "video", label: "Video", description: "视频通话能力", category: "core" },
  { key: "live", label: "Live Streaming", description: "直播推流能力", category: "core" },
  { key: "screen-share", label: "Screen Share", description: "屏幕共享能力", category: "media" },
  { key: "recording", label: "Recording", description: "录制能力", category: "media" },
  { key: "webhook", label: "Webhook", description: "Webhook回调能力", category: "advanced" },
  { key: "active-query", label: "Active Query", description: "主动查询能力", category: "advanced" },
];

interface Props {
  providerName: string;
  currentCapabilities: Record<string, boolean>;
  supportedCapabilities: string[];
  requiredCapabilities: string[];
  onSave: (enabled: string[], disabled: string[]) => void;
  onCancel: () => void;
}

export function ProviderCapabilityConfig({
  providerName,
  currentCapabilities,
  supportedCapabilities,
  requiredCapabilities,
  onSave,
  onCancel,
}: Props) {
  const [capabilities, setCapabilities] = useState<Record<string, boolean>>({
    ...currentCapabilities,
  });

  const handleToggle = (key: string) => {
    if (requiredCapabilities.includes(key)) return; // Can't disable required capabilities
    setCapabilities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    const enabled: string[] = [];
    const disabled: string[] = [];
    for (const cap of AVAILABLE_CAPABILITIES) {
      if (!supportedCapabilities.includes(cap.key)) continue;
      if (capabilities[cap.key]) {
        enabled.push(cap.key);
      } else {
        disabled.push(cap.key);
      }
    }
    onSave(enabled, disabled);
  };

  const grouped = AVAILABLE_CAPABILITIES.filter((cap) =>
    supportedCapabilities.includes(cap.key)
  ).reduce(
    (acc, cap) => {
      const bucket = acc[cap.category] ?? [];
      bucket.push(cap);
      acc[cap.category] = bucket;
      return acc;
    },
    {} as Record<string, ProviderCapability[]>
  );

  const categoryLabels: Record<string, string> = {
    core: "Core Capabilities",
    media: "Media Capabilities",
    advanced: "Advanced Capabilities",
  };

  return (
    <div className="provider-capability-config">
      <div className="capability-header">
        <h3>Configure {providerName} Capabilities</h3>
        <p>Select which capabilities to enable for this provider profile.</p>
      </div>

      <div className="capability-groups">
        {Object.entries(grouped).map(([category, caps]) => (
          <div key={category} className="capability-group">
            <h4>{categoryLabels[category] ?? category}</h4>
            <div className="capability-list">
              {caps.map((cap) => {
                const isRequired = requiredCapabilities.includes(cap.key);
                const isEnabled = capabilities[cap.key] ?? false;
                return (
                  <div
                    key={cap.key}
                    className={`capability-item ${isRequired ? "required" : ""} ${isEnabled ? "enabled" : "disabled"}`}
                  >
                    <div className="capability-toggle">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleToggle(cap.key)}
                        disabled={isRequired}
                      />
                    </div>
                    <div className="capability-info">
                      <span className="capability-label">
                        {cap.label}
                        {isRequired && <span className="required-badge">Required</span>}
                      </span>
                      <span className="capability-description">{cap.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="capability-summary">
        <h4>Summary</h4>
        <div className="summary-stats">
          <span className="stat enabled">
            {Object.entries(capabilities)
              .filter(([key, val]) => val && supportedCapabilities.includes(key))
              .length}{" "}
            Enabled
          </span>
          <span className="stat disabled">
            {Object.entries(capabilities)
              .filter(([key, val]) => !val && supportedCapabilities.includes(key))
              .length}{" "}
            Disabled
          </span>
          <span className="stat required">
            {requiredCapabilities.length} Required
          </span>
        </div>
      </div>

      <div className="form-actions">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={handleSave} className="primary">
          Save Capabilities
        </button>
      </div>
    </div>
  );
}
