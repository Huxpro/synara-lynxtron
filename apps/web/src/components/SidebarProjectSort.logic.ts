import type {
  SidebarProjectSortOrderValue,
  SidebarThreadSortOrderValue,
} from "../sidebarSortDefaults";

export const SIDEBAR_PROJECT_SORT_OPTIONS: ReadonlyArray<{
  readonly value: SidebarProjectSortOrderValue;
  readonly label: string;
}> = [
  { value: "updated_at", label: "Recent activity" },
  { value: "created_at", label: "Date added" },
  { value: "manual", label: "Manual" },
];

export const SIDEBAR_THREAD_SORT_OPTIONS: ReadonlyArray<{
  readonly value: SidebarThreadSortOrderValue;
  readonly label: string;
}> = [
  { value: "updated_at", label: "Recent activity" },
  { value: "created_at", label: "Date created" },
];
