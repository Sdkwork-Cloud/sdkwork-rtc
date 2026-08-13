import { ADMIN_SECTIONS } from "./AdminHeader";

/**
 * Route metadata for the RTC admin surfaces (grouped by section). Consumed
 * by hosts for documentation/navigation; route rendering lives in the app.
 */
export function AdminRoutes() {
  return {
    sections: ADMIN_SECTIONS,
    routes: ADMIN_SECTIONS.flatMap((section) =>
      section.routes.map((path) => ({ path: `#${path}`, section: section.key, label: path })),
    ),
  };
}
