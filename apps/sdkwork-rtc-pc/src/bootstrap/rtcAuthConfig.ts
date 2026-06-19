import type {
  SdkworkAuthAppearanceConfig,
  SdkworkAuthRuntimeConfig,
} from "@sdkwork/auth-pc-react";

const RTC_VERIFICATION_POLICY = {
  emailCodeLoginEnabled: false,
  emailRegistrationVerificationRequired: false,
  phoneCodeLoginEnabled: false,
  phoneRegistrationVerificationRequired: false,
};

export function resolveRtcAuthRuntimeConfig(): SdkworkAuthRuntimeConfig {
  return {
    leftRailMode: "qr-only",
    loginMethods: ["password"],
    oauthLoginEnabled: false,
    oauthProviders: [],
    qrLoginEnabled: true,
    recoveryMethods: [],
    registerMethods: ["email", "phone"],
    verificationPolicy: RTC_VERIFICATION_POLICY,
  };
}

export function resolveRtcAuthAppearance(): SdkworkAuthAppearanceConfig {
  return {
    asidePanelClassName: "sdkwork-rtc-auth-aside-panel",
    bodyClassName: "sdkwork-rtc-auth-body",
    contentContainerClassName: "sdkwork-rtc-auth-content",
    pageClassName: "sdkwork-rtc-auth-page",
    qrFrameClassName: "sdkwork-rtc-auth-qr-frame",
    shellClassName: "sdkwork-rtc-auth-card-shell",
    slotProps: {
      background: {
        className: "sdkwork-rtc-auth-background",
      },
      page: {
        className: "sdkwork-rtc-auth-page",
      },
      shell: {
        className: "sdkwork-rtc-auth-card-shell",
      },
    },
    theme: {
      asideCardBackgroundColor: "var(--sdkwork-rtc-auth-aside-card-bg)",
      asideCardBorderColor: "var(--sdkwork-rtc-auth-aside-card-border)",
      asidePanelBackgroundColor: "var(--sdkwork-rtc-auth-aside-bg)",
      asidePanelBorderColor: "var(--sdkwork-rtc-auth-aside-border)",
      asidePanelColor: "var(--sdkwork-rtc-auth-aside-text)",
      badgeBackgroundColor: "var(--sdkwork-rtc-auth-aside-badge-bg)",
      badgeTextColor: "var(--sdkwork-rtc-auth-aside-badge-text)",
      contentBackgroundColor: "var(--sdkwork-rtc-auth-content-bg)",
      contentBorderColor: "transparent",
      contentTextColor: "var(--sdkwork-rtc-auth-content-text)",
      descriptionColor: "var(--sdkwork-rtc-auth-muted-text)",
      dividerColor: "var(--sdkwork-rtc-auth-divider)",
      fieldBackgroundColor: "var(--sdkwork-rtc-auth-field-bg)",
      fieldBorderColor: "transparent",
      fieldPlaceholderColor: "#9ca3af",
      fieldTextColor: "var(--sdkwork-rtc-auth-content-text)",
      formMutedTextColor: "var(--sdkwork-rtc-auth-muted-text)",
      iconMutedColor: "var(--sdkwork-rtc-auth-muted-text)",
      labelColor: "var(--sdkwork-rtc-auth-content-text)",
      pageBackgroundColor: "var(--sdkwork-rtc-auth-bg)",
      qrFrameBackgroundColor: "var(--sdkwork-rtc-auth-qr-bg)",
      qrFrameBorderColor: "transparent",
      shellBackgroundColor: "var(--sdkwork-rtc-auth-content-bg)",
      shellBorderColor: "transparent",
      tabActiveBackgroundColor: "transparent",
      tabActiveTextColor: "var(--sdkwork-rtc-auth-content-text)",
      tabBackgroundColor: "transparent",
      tabInactiveTextColor: "var(--sdkwork-rtc-auth-muted-text)",
      titleColor: "var(--sdkwork-rtc-auth-content-text)",
    },
  };
}

export function resolveRtcAuthLocale(): string | null {
  if (typeof navigator === "undefined") {
    return null;
  }
  const language = navigator.language.trim();
  return language || null;
}
