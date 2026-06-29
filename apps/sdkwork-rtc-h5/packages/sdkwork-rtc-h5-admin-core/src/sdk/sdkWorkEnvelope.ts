import type { SdkWorkPageData, SdkWorkResourceData } from "@sdkwork/utils";

export function readSdkWorkListPage<TItem>(
  data: SdkWorkPageData<Record<string, unknown>> | undefined,
): { items: TItem[]; nextCursor?: string } {
  if (!data) {
    return { items: [] };
  }

  const nextCursor = data.pageInfo?.nextCursor;
  return {
    items: (data.items ?? []) as TItem[],
    nextCursor:
      typeof nextCursor === "string" && nextCursor.length > 0 ? nextCursor : undefined,
  };
}

export function readSdkWorkItem<TItem>(
  data: SdkWorkResourceData<Record<string, unknown>> | Record<string, unknown> | undefined,
): TItem {
  if (!data) {
    throw new Error("Missing SDK response data");
  }

  if ("item" in data && data.item !== undefined) {
    return data.item as TItem;
  }

  throw new Error("Missing SDK response data.item");
}
