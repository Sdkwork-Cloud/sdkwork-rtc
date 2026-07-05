import type { SdkworkAppClient } from "@sdkwork/rtc-app-sdk";

export type RtcAppSdkClient = SdkworkAppClient;

export interface RtcAppSdkPort {
  client: RtcAppSdkClient;
}
