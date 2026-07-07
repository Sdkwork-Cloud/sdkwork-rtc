import { useCallback, useEffect, useState } from "react";

import { formatSdkWorkError } from "@sdkwork/rtc-pc-admin-core/sdk";

import type { RtcAdminServices } from "../bootstrap/adminServices";

export interface PaginatedListState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

export function useAsyncResource<T>(
  loader: () => Promise<T>,
  initialValue: T,
  deps: unknown[] = [],
): {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (err) {
      setError(formatSdkWorkError(err, "Failed to load data"));
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

function useSdkWorkPaginatedList<T>(
  fetchPage: (cursor?: string) => Promise<{ items: T[]; nextCursor?: string | null }>,
  deps: unknown[] = [],
): PaginatedListState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPage(undefined);
      setData(result.items);
      const cursor = result.nextCursor?.trim();
      setNextCursor(cursor || undefined);
      setHasMore(Boolean(cursor));
    } catch (err) {
      setError(formatSdkWorkError(err, "Failed to load data"));
    } finally {
      setLoading(false);
    }
  }, deps);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPage(nextCursor);
      setData((current) => [...current, ...result.items]);
      const cursor = result.nextCursor?.trim();
      setNextCursor(cursor || undefined);
      setHasMore(Boolean(cursor));
    } catch (err) {
      setError(formatSdkWorkError(err, "Failed to load more"));
    } finally {
      setLoading(false);
    }
  }, [fetchPage, loading, nextCursor, ...deps]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, hasMore, refresh, loadMore };
}

export function useAdminData(
  services: RtcAdminServices,
  options?: {
    roomQuery?: string;
    roomSort?: string;
    roomStatus?: "active" | "archived" | "disabled";
    roomOwnerUserId?: string;
    roomCreatedAfter?: string;
  },
) {
  const debouncedRoomQuery = useDebouncedValue(options?.roomQuery ?? "", 300);

  const dashboard = useAsyncResource(
    async () => {
      const [profiles, schemas] = await Promise.all([
        services.profiles.list({ pageSize: 200 }),
        services.schemas.listSchemas(),
      ]);
      return { profiles: profiles.items, schemas };
    },
    { profiles: [], schemas: [] },
    [services],
  );

  const accounts = useSdkWorkPaginatedList(
    (cursor) => services.accounts.list({ cursor }),
    [services],
  );

  const profiles = useSdkWorkPaginatedList(
    (cursor) => services.profiles.list({ cursor }),
    [services],
  );

  const routes = useSdkWorkPaginatedList((cursor) => services.routes.list({ cursor }), [services]);

  const rooms = useSdkWorkPaginatedList(
    (cursor) =>
      services.rooms.list({
        cursor,
        search: debouncedRoomQuery || undefined,
        sort: options?.roomSort,
        status: options?.roomStatus,
        ownerUserId: options?.roomOwnerUserId,
        createdAfter: options?.roomCreatedAfter,
      }),
    [
      services,
      debouncedRoomQuery,
      options?.roomSort,
      options?.roomStatus,
      options?.roomOwnerUserId,
      options?.roomCreatedAfter,
    ],
  );

  const plugins = useSdkWorkPaginatedList(
    (cursor) => services.plugins.list({ cursor }),
    [services],
  );

  const webhookEvents = useSdkWorkPaginatedList(
    (cursor) => services.webhooks.listEvents({ cursor }),
    [services],
  );

  const schemas = useAsyncResource(
    async () => services.schemas.listSchemas(),
    [],
    [services],
  );

  return {
    dashboard,
    accounts,
    profiles,
    routes,
    rooms,
    plugins,
    webhookEvents,
    schemas,
  };
}
