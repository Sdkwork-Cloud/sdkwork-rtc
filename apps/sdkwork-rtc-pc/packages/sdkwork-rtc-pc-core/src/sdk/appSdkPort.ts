import type { SdkworkAppClient } from "sdkwork-rtc-app-sdk-generated-typescript";

export type RtcAppSdkClient = SdkworkAppClient;

export interface RtcAppSdkPort {
  client: RtcAppSdkClient;
}
