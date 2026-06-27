export interface RtcAppSession {
  accessToken: string;
  authToken: string;
  tenantId: string;
  organizationId: string;
  userId: string;
}

export const DEFAULT_APP_SESSION: RtcAppSession = {
  accessToken: "dev-access-token",
  authToken: "dev-auth-token",
  tenantId: "100001",
  organizationId: "default",
  userId: "1",
};

export const DEFAULT_APP_PERMISSION_SCOPE = "rtc.media_session.read rtc.media_session.write";
