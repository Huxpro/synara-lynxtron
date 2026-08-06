import type {
  SidebarProjectSortOrderValue,
  SidebarThreadSortOrderValue,
} from "../sidebarSortDefaults";

export const SIDEBAR_PROJECT_SORT_OPTIONS: ReadonlyArray<{
  readonly value: SidebarProjectSortOrderValue;
  readonly label: string;
}> = [
  { value: "updated_at", label: "Last user message" },
  { value: "created_at", label: "Created at" },
  { value: "manual", label: "Manual" },
];

export const SIDEBAR_THREAD_SORT_OPTIONS: ReadonlyArray<{
  readonly value: SidebarThreadSortOrderValue;
  readonly label: string;
}> = [
  { value: "updated_at", label: "Last user message" },
  { value: "created_at", label: "Created at" },
];
