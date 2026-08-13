import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type {
  QualitySampleListParams,
  QualitySampleListResponse,
  RtcQualitySample,
} from "../types/qualitySample";
import { readSdkWorkListPage } from "../sdk/index.js";
import {
  resolveBackendRtcClient,
  type RtcBackendClientOptions,
  type RtcBackendClientSource,
} from "./backendClient";

export class QualitySampleService {
  private readonly client;

  constructor(
    baseUrlOrClient: RtcBackendClientSource,
    tokenManagerOrOptions?: AuthTokenManager | RtcBackendClientOptions,
  ) {
    this.client = resolveBackendRtcClient(baseUrlOrClient, tokenManagerOrOptions);
  }

  async list(params?: QualitySampleListParams): Promise<QualitySampleListResponse> {
    const response = await this.client.rtcQualitySamples.rtc.qualitySamples.list({
      page: params?.page,
      pageSize: params?.limit,
      cursor: params?.cursor,
      q: params?.search,
      sort: params?.sort,
      createdAfter: params?.createdAfter,
    });
    const page = readSdkWorkListPage<RtcQualitySample>(response);
    return {
      items: page.items,
      nextCursor: page.nextCursor,
    };
  }
}
