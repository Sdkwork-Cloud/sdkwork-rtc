import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type {
  ProviderQueryJob,
  ProviderQueryJobCreateCommand,
  ProviderQuerySnapshot,
} from "../types/providerQueryJob";
import { resolveBackendRtcClient, type RtcBackendClientOptions, type RtcBackendClientSource } from "./backendClient";

interface SnapshotListResponse {
  items: ProviderQuerySnapshot[];
  nextCursor?: string | null;
}

export class ProviderQueryJobService {
  private readonly client;

  constructor(
    baseUrlOrClient: RtcBackendClientSource,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = resolveBackendRtcClient(baseUrlOrClient, tokenManagerOrOptions);
  }

  async create(command: ProviderQueryJobCreateCommand): Promise<ProviderQueryJob> {
    const response = await this.client.rtcProviderQueryJobs.rtc.providerQueryJobs.create(command);
    if (!response) {
      throw new Error("Invalid response: missing provider query job data");
    }
    return response;
  }

  async get(id: string): Promise<ProviderQueryJob> {
    const response = await this.client.rtcProviderQueryJobs.rtc.providerQueryJobs.retrieve(id);
    if (!response) {
      throw new Error(`RTC provider query job not found: ${id}`);
    }
    return response;
  }

  async listSnapshots(
    providerQueryJobId: string,
    params?: {
      page?: number;
      limit?: number;
      cursor?: string;
      search?: string;
      sort?: string;
    },
  ): Promise<SnapshotListResponse> {
    const response =
      await this.client.rtcProviderQueryJobs.rtc.providerQueryJobs.snapshots.list(
        providerQueryJobId,
        {
          page: params?.page,
          pageSize: params?.limit,
          cursor: params?.cursor,
          q: params?.search,
          sort: params?.sort,
        },
      );
    // The generated SDK unwraps the sdkwork-v3 envelope, so the response is
    // already the `data` payload ({ items, pageInfo }).
    const nextCursor = response.pageInfo?.nextCursor;
    return {
      items: response.items,
      nextCursor: nextCursor && nextCursor.length > 0 ? nextCursor : null,
    };
  }
}
