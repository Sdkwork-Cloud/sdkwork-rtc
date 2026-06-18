import { useCallback, useEffect, useState } from "react";

import type { RtcAdminServices } from "../bootstrap/adminServices";

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAsyncResource<T>(
  loader: () => Promise<T>,
  initialValue: T,
  deps: unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useAdminData(services: RtcAdminServices) {
  const dashboard = useAsyncResource(
    async () => {
      const [profiles, schemas] = await Promise.all([
        services.profiles.list(),
        services.schemas.listSchemas(),
      ]);
      return { profiles: profiles.items, schemas };
    },
    { profiles: [], schemas: [] },
    [services],
  );

  const accounts = useAsyncResource(
    async () => (await services.accounts.list()).items,
    [],
    [services],
  );

  const profiles = useAsyncResource(
    async () => (await services.profiles.list()).items,
    [],
    [services],
  );

  const routes = useAsyncResource(
    async () => (await services.routes.list()).items,
    [],
    [services],
  );

  const rooms = useAsyncResource(
    async () => (await services.rooms.list()).items,
    [],
    [services],
  );

  const plugins = useAsyncResource(
    async () => (await services.plugins.list()).items,
    [],
    [services],
  );

  const webhookEvents = useAsyncResource(
    async () => (await services.webhooks.listEvents()).items,
    [],
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
