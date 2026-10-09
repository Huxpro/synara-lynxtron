export interface SidebarStatusPresentation {
  readonly label:
    | "Working"
    | "Connecting"
    | "Completed"
    | "Pending Approval"
    | "Awaiting Input"
    | "Plan Ready";
  readonly colorClass: string;
  readonly dotClass: string;
  readonly pulse: boolean;
  readonly dismissible?: boolean | undefined;
  readonly dismissalKey?: string | undefined;
}

export interface SidebarDismissibleStatusInput {
  readonly dismissalKey?: string | null | undefined;
  readonly dismissed?: boolean | undefined;
}

export interface SidebarStatusInput {
  readonly pendingApproval?: SidebarDismissibleStatusInput | null | undefined;
  readonly pendingUserInput?: SidebarDismissibleStatusInput | null | undefined;
  readonly working?: boolean | undefined;
  readonly connecting?: boolean | undefined;
  readonly planReady?: SidebarDismissibleStatusInput | null | undefined;
  readonly completed?: SidebarDismissibleStatusInput | null | undefined;
}

const PRESENTATION: Record<
  SidebarStatusPresentation["label"],
  Omit<SidebarStatusPresentation, "label" | "dismissalKey" | "dismissible">
> = {
  "Pending Approval": {
    colorClass: "text-amber-600 dark:text-amber-300/90",
    dotClass: "bg-amber-500 dark:bg-amber-300/90",
    pulse: false,
  },
  "Awaiting Input": {
    colorClass: "text-indigo-600 dark:text-indigo-300/90",
    dotClass: "bg-indigo-500 dark:bg-indigo-300/90",
    pulse: false,
  },
  Working: {
    colorClass: "text-sky-600 dark:text-sky-300/80",
    dotClass: "bg-sky-500 dark:bg-sky-300/80",
    pulse: true,
  },
  Connecting: {
    colorClass: "text-sky-600 dark:text-sky-300/80",
    dotClass: "bg-sky-500 dark:bg-sky-300/80",
    pulse: true,
  },
  "Plan Ready": {
    colorClass: "text-violet-600 dark:text-violet-300/90",
    dotClass: "bg-violet-500 dark:bg-violet-300/90",
    pulse: false,
  },
  Completed: {
    colorClass: "text-emerald-600 dark:text-emerald-300/90",
    dotClass: "bg-emerald-500 dark:bg-emerald-300/90",
    pulse: false,
  },
};

function dismissible(
  label: SidebarStatusPresentation["label"],
  input: SidebarDismissibleStatusInput | null | undefined,
): SidebarStatusPresentation | null {
  if (!input || input.dismissed) return null;
  return {
    label,
    ...PRESENTATION[label],
    dismissible: true,
    ...(input.dismissalKey ? { dismissalKey: input.dismissalKey } : {}),
  };
}

export function resolveSidebarStatusPresentation(
  input: SidebarStatusInput,
): SidebarStatusPresentation | null {
  if (input.pendingApproval) {
    return dismissible("Pending Approval", input.pendingApproval);
  }
  if (input.pendingUserInput) {
    return dismissible("Awaiting Input", input.pendingUserInput);
  }
  if (input.working) {
    return { label: "Working", ...PRESENTATION.Working, dismissible: false };
  }
  if (input.connecting) {
    return { label: "Connecting", ...PRESENTATION.Connecting, dismissible: false };
  }
  if (input.planReady) {
    return dismissible("Plan Ready", input.planReady);
  }
  return input.completed ? dismissible("Completed", input.completed) : null;
}

const STATUS_PRIORITY: Record<SidebarStatusPresentation["label"], number> = {
  "Pending Approval": 5,
  "Awaiting Input": 4,
  Working: 3,
  Connecting: 3,
  "Plan Ready": 2,
  Completed: 1,
};

export function resolveSidebarProjectStatus(
  statuses: ReadonlyArray<SidebarStatusPresentation | null>,
): SidebarStatusPresentation | null {
  let highest: SidebarStatusPresentation | null = null;
  for (const status of statuses) {
    if (status && (!highest || STATUS_PRIORITY[status.label] > STATUS_PRIORITY[highest.label])) {
      highest = status;
    }
  }
  return highest;
}
