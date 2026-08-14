import type { AuthTokenManager } from "@sdkwork/sdk-common";

import type {
  QualitySampleListParams,
  QualitySampleListResponse,
  RtcQualitySample,
} from "../types/qualitySample";
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
    // The generated SDK unwraps the sdkwork-v3 envelope, so the response is
    // already the `data` payload ({ items, pageInfo }).
    const nextCursor = response.pageInfo?.nextCursor;
    return {
      items: response.items,
      nextCursor: nextCursor && nextCursor.length > 0 ? nextCursor : undefined,
    };
  }
}
