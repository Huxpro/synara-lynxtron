export interface HostInputProbeEventRecord {
  readonly eventName: string;
  readonly sourceName: string;
  readonly bindingExists: boolean;
  readonly eventArrived: boolean;
  readonly handlerCallCount: number;
  readonly lastArrivalMs?: number;
  readonly lastDetail?: string;
}

export interface HostInputProbeMatrix {
  readonly runtimeLabel: string;
  readonly startedMs: number;
  readonly events: readonly HostInputProbeEventRecord[];
}

export const HOST_INPUT_PROBE_EVENT_CATALOG: readonly Omit<
  HostInputProbeEventRecord,
  "eventArrived" | "handlerCallCount" | "lastArrivalMs" | "lastDetail"
>[] = [
  { eventName: "focus", sourceName: "view-control", bindingExists: false },
  { eventName: "blur", sourceName: "view-control", bindingExists: false },
  { eventName: "focus", sourceName: "textarea", bindingExists: false },
  { eventName: "blur", sourceName: "textarea", bindingExists: false },
  { eventName: "keydown:Enter", sourceName: "view-control", bindingExists: false },
  { eventName: "keydown:Space", sourceName: "view-control", bindingExists: false },
  { eventName: "keydown:ArrowDown", sourceName: "view-control", bindingExists: false },
  { eventName: "keydown:ArrowUp", sourceName: "view-control", bindingExists: false },
  { eventName: "keydown:Escape", sourceName: "view-control", bindingExists: false },
  { eventName: "keydown:Tab", sourceName: "view-control", bindingExists: false },
  { eventName: "keydown:Enter", sourceName: "textarea", bindingExists: false },
  { eventName: "keydown:ArrowUp", sourceName: "textarea", bindingExists: false },
  { eventName: "keydown:ArrowDown", sourceName: "textarea", bindingExists: false },
  { eventName: "keydown:Escape", sourceName: "textarea", bindingExists: false },
  { eventName: "mouseenter", sourceName: "view-control", bindingExists: false },
  { eventName: "mouseleave", sourceName: "view-control", bindingExists: false },
  { eventName: "mousedown", sourceName: "view-control", bindingExists: false },
  { eventName: "mouseup", sourceName: "view-control", bindingExists: false },
  { eventName: "tap", sourceName: "view-control", bindingExists: false },
  { eventName: "scroll", sourceName: "scroll-view", bindingExists: false },
  { eventName: "input", sourceName: "textarea", bindingExists: false },
  { eventName: "input:composing", sourceName: "textarea", bindingExists: false },
  { eventName: "input:committed", sourceName: "textarea", bindingExists: false },
  { eventName: "global:window-focus", sourceName: "host", bindingExists: false },
  { eventName: "global:window-blur", sourceName: "host", bindingExists: false },
];

export function createHostInputProbeMatrix(
  runtimeLabel: string,
  startedMs = Date.now(),
): HostInputProbeMatrix {
  return {
    runtimeLabel,
    startedMs,
    events: HOST_INPUT_PROBE_EVENT_CATALOG.map((entry) => ({
      ...entry,
      eventArrived: false,
      handlerCallCount: 0,
    })),
  };
}

export function recordHostEventBinding(
  matrix: HostInputProbeMatrix,
  eventName: string,
  sourceName: string,
): HostInputProbeMatrix {
  return {
    ...matrix,
    events: matrix.events.map((entry) =>
      entry.eventName === eventName && entry.sourceName === sourceName
        ? { ...entry, bindingExists: true }
        : entry,
    ),
  };
}

export function recordHostEventArrival(
  matrix: HostInputProbeMatrix,
  eventName: string,
  sourceName: string,
  detail?: string,
  arrivalMs = Date.now(),
): HostInputProbeMatrix {
  return {
    ...matrix,
    events: matrix.events.map((entry) =>
      entry.eventName === eventName && entry.sourceName === sourceName
        ? {
            ...entry,
            eventArrived: true,
            handlerCallCount: entry.handlerCallCount + 1,
            lastArrivalMs: arrivalMs,
            lastDetail: detail,
          }
        : entry,
    ),
  };
}

export function formatHostInputProbeReport(matrix: HostInputProbeMatrix): string {
  const lines: string[] = [
    `Host Input Probe — ${matrix.runtimeLabel}`,
    `Started: ${new Date(matrix.startedMs).toISOString()}`,
    `Events recorded: ${matrix.events.length}`,
    "",
    "event                  source         binding  arrived  calls  last-arrival",
    "--------------------   -------------  -------  -------  -----  ------------",
  ];

  for (const event of matrix.events) {
    const binding = event.bindingExists ? "YES" : " NO";
    const arrived = event.eventArrived ? "YES" : " NO";
    const calls = String(event.handlerCallCount).padStart(5);
    const last =
      event.lastArrivalMs != null
        ? new Date(event.lastArrivalMs).toISOString().slice(11, 23)
        : "           -";
    lines.push(
      `${event.eventName.padEnd(22)}  ${event.sourceName.padEnd(13)}  ${binding}       ${arrived}       ${calls}  ${last}`,
    );
  }

  const bound = matrix.events.filter((event) => event.bindingExists).length;
  const delivered = matrix.events.filter((event) => event.eventArrived).length;
  const total = matrix.events.length;
  lines.push(
    "",
    `Bindings: ${bound}/${total} (${((bound / total) * 100).toFixed(0)}%)`,
    `Delivered: ${delivered}/${total} (${((delivered / total) * 100).toFixed(0)}%)`,
    `Programmatic-trigger-only events (binding=YES, arrived=NO): ${
      matrix.events.filter((event) => event.bindingExists && !event.eventArrived).length
    }`,
  );

  return lines.join("\n");
}

export function hostInputProbeSummary(matrix: HostInputProbeMatrix): {
  readonly total: number;
  readonly bound: number;
  readonly delivered: number;
  readonly bindingOnly: number;
} {
  const events = matrix.events;
  return {
    total: events.length,
    bound: events.filter((event) => event.bindingExists).length,
    delivered: events.filter((event) => event.eventArrived).length,
    bindingOnly: events.filter((event) => event.bindingExists && !event.eventArrived).length,
  };
}
