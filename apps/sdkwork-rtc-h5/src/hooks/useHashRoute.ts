import { useEffect, useState } from "react";

function normalizeHashRoute(hash: string): string {
  const route = hash.replace(/^#/, "") || "/rtc/media-sessions";
  return route.startsWith("/") ? route : `/${route}`;
}

export function useHashRoute(defaultRoute = "/rtc/media-sessions"): string {
  const [route, setRoute] = useState(() =>
    normalizeHashRoute(window.location.hash || `#${defaultRoute}`),
  );

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(normalizeHashRoute(window.location.hash || `#${defaultRoute}`));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [defaultRoute]);

  return route;
}
