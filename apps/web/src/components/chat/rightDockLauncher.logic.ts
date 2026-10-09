import type { RightDockPaneKind } from "@synara/shared/rightDock";

export interface RightDockLauncherEntry {
  readonly kind: RightDockPaneKind;
  readonly label: string;
}

// Empty-dock launchers prioritize the everyday workspace tools. Review only
// appears when the selected diff scope contains changes, Git is gated by
// repository discovery, and Explorer needs a concrete workspace. Context-only
// file and pull-request panes continue to open from their owning surfaces.
const RIGHT_DOCK_LAUNCHER_ENTRIES: readonly RightDockLauncherEntry[] = [
  { kind: "diff", label: "Review" },
  { kind: "terminal", label: "Terminal" },
  { kind: "browser", label: "Browser" },
  { kind: "explorer", label: "Files" },
  { kind: "sidechat", label: "Side chats" },
  { kind: "device", label: "iOS Simulator" },
  { kind: "git", label: "Source control" },
];

/** The empty right dock's launcher entries, in order, for what this host can open. */
export function resolveRightDockLauncherEntries(input: {
  hasWorkspace: boolean;
  hasGitRepository: boolean;
  hasReview: boolean;
  /**
   * Simulators need a macOS server with Xcode. Off macOS the entry is hidden
   * outright rather than shown disabled: there is nothing the user could do
   * from this machine to make it work.
   */
  hasDeviceSupport?: boolean;
  /** Renderers that cannot host some pane kinds (e.g. no embedded browser) exclude them. */
  supportedKinds?: ReadonlySet<RightDockPaneKind>;
}): readonly RightDockLauncherEntry[] {
  return RIGHT_DOCK_LAUNCHER_ENTRIES.filter(({ kind }) => {
    if (input.supportedKinds && !input.supportedKinds.has(kind)) return false;
    if (kind === "diff") return input.hasReview;
    if (kind === "git") return input.hasGitRepository;
    if (kind === "explorer") return input.hasWorkspace;
    if (kind === "device") return input.hasDeviceSupport === true;
    return true;
  });
}
