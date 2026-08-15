import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

interface ProviderCapability {
  key: string;
  category: "core" | "media" | "advanced";
}

const AVAILABLE_CAPABILITIES: ProviderCapability[] = [
  { key: "audio", category: "core" },
  { key: "video", category: "core" },
  { key: "live", category: "core" },
  { key: "screen-share", category: "media" },
  { key: "recording", category: "media" },
  { key: "webhook", category: "advanced" },
  { key: "active-query", category: "advanced" },
];

function capabilityLabel(key: string, t: TFunction): string {
  switch (key) {
    case "audio":
      return t("admin.rtc.capabilities.label.audio", "Audio");
    case "video":
      return t("admin.rtc.capabilities.label.video", "Video");
    case "live":
      return t("admin.rtc.capabilities.label.live", "Live Streaming");
    case "screen-share":
      return t("admin.rtc.capabilities.label.screenShare", "Screen Share");
    case "recording":
      return t("admin.rtc.capabilities.label.recording", "Recording");
    case "webhook":
      return t("admin.rtc.capabilities.label.webhook", "Webhook");
    case "active-query":
      return t("admin.rtc.capabilities.label.activeQuery", "Active Query");
    default:
      return key;
  }
}

function capabilityDescription(key: string, t: TFunction): string {
  switch (key) {
    case "audio":
      return t("admin.rtc.capabilities.desc.audio", "Audio calling capability");
    case "video":
      return t("admin.rtc.capabilities.desc.video", "Video calling capability");
    case "live":
      return t("admin.rtc.capabilities.desc.live", "Live streaming capability");
    case "screen-share":
      return t("admin.rtc.capabilities.desc.screenShare", "Screen sharing capability");
    case "recording":
      return t("admin.rtc.capabilities.desc.recording", "Recording capability");
    case "webhook":
      return t("admin.rtc.capabilities.desc.webhook", "Webhook callback capability");
    case "active-query":
      return t("admin.rtc.capabilities.desc.activeQuery", "Active query capability");
    default:
      return "";
  }
}

function categoryLabel(category: string, t: TFunction): string {
  switch (category) {
    case "core":
      return t("admin.rtc.capabilities.category.core", "Core Capabilities");
    case "media":
      return t("admin.rtc.capabilities.category.media", "Media Capabilities");
    case "advanced":
      return t("admin.rtc.capabilities.category.advanced", "Advanced Capabilities");
    default:
      return category;
  }
}

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
  const { t } = useTranslation();
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

  return (
    <div className="provider-capability-config">
      <div className="capability-header">
        <h3>
          {t("admin.rtc.capabilities.configureTitle", "Configure {{name}} Capabilities", {
            name: providerName,
          })}
        </h3>
        <p>{t("admin.rtc.capabilities.hint", "Select which capabilities to enable for this provider profile.")}</p>
      </div>

      <div className="capability-groups">
        {Object.entries(grouped).map(([category, caps]) => (
          <div key={category} className="capability-group">
            <h4>{categoryLabel(category, t)}</h4>
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
                        {capabilityLabel(cap.key, t)}
                        {isRequired && (
                          <span className="required-badge">
                            {t("admin.rtc.capabilities.required", "Required")}
                          </span>
                        )}
                      </span>
                      <span className="capability-description">
                        {capabilityDescription(cap.key, t)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="capability-summary">
        <h4>{t("admin.rtc.capabilities.summary", "Summary")}</h4>
        <div className="summary-stats">
          <span className="stat enabled">
            {t("admin.rtc.capabilities.enabledCount", "{{count}} Enabled", {
              count: Object.entries(capabilities)
                .filter(([key, val]) => val && supportedCapabilities.includes(key))
                .length,
            })}
          </span>
          <span className="stat disabled">
            {t("admin.rtc.capabilities.disabledCount", "{{count}} Disabled", {
              count: Object.entries(capabilities)
                .filter(([key, val]) => !val && supportedCapabilities.includes(key))
                .length,
            })}
          </span>
          <span className="stat required">
            {t("admin.rtc.capabilities.requiredCount", "{{count}} Required", {
              count: requiredCapabilities.length,
            })}
          </span>
        </div>
      </div>

      <div className="form-actions">
        <button onClick={onCancel}>{t("admin.rtc.cancel", "Cancel")}</button>
        <button onClick={handleSave} className="primary">
          {t("admin.rtc.capabilities.save", "Save Capabilities")}
        </button>
      </div>
    </div>
  );
}
