import type { SdkWorkPageData, SdkWorkResourceData } from "@sdkwork/utils";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

function unwrapSdkWorkPayload<T>(payload: unknown): T {
  if (payload == null) {
    throw new Error("Missing SDK response envelope");
  }
  if (!isRecord(payload)) {
    throw new Error("Invalid SDK response envelope: expected object with code and data");
  }

  if (payload.code === 0 && "data" in payload) {
    return payload.data as T;
  }

  throw new Error("Invalid SDK response envelope: expected { code: 0, data }");
}

export function readSdkWorkListPage<TItem>(
  payload: unknown,
): { items: TItem[]; nextCursor?: string } {
  const data = unwrapSdkWorkPayload<SdkWorkPageData<Record<string, unknown>>>(payload);

  const nextCursor = data.pageInfo?.nextCursor;
  return {
    items: (data.items ?? []) as TItem[],
    nextCursor:
      typeof nextCursor === "string" && nextCursor.length > 0 ? nextCursor : undefined,
  };
}

/** Aggregates cursor-paginated lists for export tooling and profile selection dropdowns. */
export async function collectSdkWorkListPages<TItem>(
  fetchPage: (cursor?: string) => Promise<{ items: TItem[]; nextCursor?: string | null }>,
  maxPages = 50,
): Promise<TItem[]> {
  const items: TItem[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < maxPages; page += 1) {
    const result = await fetchPage(cursor);
    items.push(...result.items);
    const next = result.nextCursor?.trim();
    if (!next) {
      break;
    }
    cursor = next;
  }
  return items;
}

export function readSdkWorkItem<TItem>(payload: unknown): TItem {
  const data = unwrapSdkWorkPayload<
    SdkWorkResourceData<Record<string, unknown>> | Record<string, unknown>
  >(payload);

  if ("item" in data && data.item !== undefined) {
    return data.item as TItem;
  }

  if (!("items" in data) && !("pageInfo" in data) && !("accepted" in data)) {
    return data as TItem;
  }

  throw new Error("Missing SDK response data.item");
}
