// FILE: sidebarSortDefaults.ts
// Purpose: Side-effect-free source of the sidebar sort-order values and defaults.
// Layer: shared settings vocabulary
//
// These live outside `appSettings.ts` so non-Web targets can consume the same
// literals without pulling in that module's load-time side effects (local
// storage hydration, server-settings react-query wiring, native API access).
// `appSettings.ts` re-exports them, so every existing Web import is unchanged.

export const SIDEBAR_PROJECT_SORT_ORDERS = ["updated_at", "created_at", "manual"] as const;
export type SidebarProjectSortOrderValue = (typeof SIDEBAR_PROJECT_SORT_ORDERS)[number];
export const DEFAULT_SIDEBAR_PROJECT_SORT_ORDER: SidebarProjectSortOrderValue = "manual";

export const SIDEBAR_THREAD_SORT_ORDERS = ["updated_at", "created_at"] as const;
export type SidebarThreadSortOrderValue = (typeof SIDEBAR_THREAD_SORT_ORDERS)[number];
export const DEFAULT_SIDEBAR_THREAD_SORT_ORDER: SidebarThreadSortOrderValue = "updated_at";
