/**
 * RTC admin center services contract.
 *
 * The admin center workspace orchestrates every management surface through
 * this narrow port. Hosts (the RTC PC/H5 apps, the Cloud Router admin)
 * implement it with their own SDK client, session and token configuration —
 * the workspace itself stays transport-agnostic.
 */

import type { ProviderAccount, ProviderAccountCommand } from "./providerAccount";
import type { ProviderApplication, ProviderApplicationCommand } from "./providerApplication";
import type { ProviderCredential, ProviderCredentialCommand } from "./providerCredential";
import type { ProviderProfile, ProviderProfileCommand } from "./providerProfile";
import type { ProviderRoute } from "./providerRoute";
import type { ProviderConfigSchema, ProviderPluginDescriptor } from "./providerSchema";
import type { ProviderQueryJob, ProviderQueryJobCreateCommand, ProviderQuerySnapshot } from "./providerQueryJob";
import type { ProviderWebhookEvent } from "./providerWebhookEvent";
import type { Room, RoomCreateCommand, RoomListParams, RoomListResponse } from "./room";
import type { MediaSessionListParams, MediaSessionListResponse, RtcMediaSession } from "./mediaSession";
import type { RtcMediaSessionCompletionRecord } from "./completionRecord";
import type { MediaArtifactListParams, MediaArtifactListResponse, RtcMediaArtifact } from "./mediaArtifact";
import type { QualitySampleListParams, QualitySampleListResponse } from "./qualitySample";

export interface ListPort<TListParams, TResponse> {
  list(params?: TListParams): Promise<TResponse>;
}

export interface RtcAdminCenterServices {
  accounts: ListPort<{ cursor?: string; limit?: number }, { items: ProviderAccount[]; nextCursor?: string | null }> & {
    create(command: ProviderAccountCommand): Promise<ProviderAccount>;
  };
  applications: {
    list(
      providerAccountId: string,
      params?: { cursor?: string; limit?: number },
    ): Promise<{ items: ProviderApplication[]; nextCursor?: string | null }>;
    disable(applicationId: string, reason?: string): Promise<ProviderApplication>;
    create(accountId: string, command: ProviderApplicationCommand): Promise<ProviderApplication>;
  };
  credentials: {
    list(
      providerApplicationId: string,
      params?: { cursor?: string; limit?: number },
    ): Promise<{ items: ProviderCredential[]; nextCursor?: string | null }>;
    revoke(credentialId: string, reason?: string): Promise<ProviderCredential>;
    create(applicationId: string, command: ProviderCredentialCommand): Promise<ProviderCredential>;
  };
  profiles: ListPort<{ cursor?: string; limit?: number }, { items: ProviderProfile[]; nextCursor?: string | null }> & {
    create(command: ProviderProfileCommand): Promise<ProviderProfile>;
    disable(profileId: string, reason?: string): Promise<ProviderProfile>;
    verify(profileId: string, mode: string): Promise<unknown>;
    configureCapabilities(
      profileId: string,
      enabled: string[],
      disabled: string[],
    ): Promise<ProviderProfile>;
  };
  routes: ListPort<{ cursor?: string; limit?: number }, { items: ProviderRoute[]; nextCursor?: string | null }>;
  schemas: {
    listSchemas(): Promise<ProviderConfigSchema[]>;
  };
  plugins: ListPort<{ cursor?: string; limit?: number }, { items: ProviderPluginDescriptor[]; nextCursor?: string | null }>;
  webhooks: {
    listEvents(params?: { cursor?: string; limit?: number }): Promise<{ items: ProviderWebhookEvent[]; nextCursor?: string | null }>;
  };
  queryJobs: {
    create(command: ProviderQueryJobCreateCommand): Promise<ProviderQueryJob>;
    get(id: string): Promise<ProviderQueryJob>;
    listSnapshots(id: string): Promise<{ items: ProviderQuerySnapshot[] }>;
  };
  rooms: ListPort<RoomListParams, RoomListResponse> & {
    get(id: string): Promise<Room>;
    create(command: RoomCreateCommand): Promise<Room>;
  };
  mediaSessions: ListPort<MediaSessionListParams, MediaSessionListResponse> & {
    get(id: string): Promise<RtcMediaSession>;
    close(id: string): Promise<RtcMediaSession>;
    getCompletionRecord(id: string): Promise<RtcMediaSessionCompletionRecord>;
  };
  mediaArtifacts: ListPort<MediaArtifactListParams, MediaArtifactListResponse> & {
    get(id: string): Promise<RtcMediaArtifact>;
  };
  qualitySamples: ListPort<QualitySampleListParams, QualitySampleListResponse>;
}
