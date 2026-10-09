// How the comparison harness moves between the app's main surfaces in each
// renderer. Both follow upstream's shell: an icon rail whose buttons carry only
// an aria-label, Settings without a "Back to app" row (the rail stays), and pull
// requests under "Code review". Electron reaches the Kanban board through Tasks
// and its view switch; Native's Tasks button opens the board directly (the Tasks
// list is not ported). One table, so cells and workflows cannot drift apart.
import { waitFor } from "./comparison-workflow.mjs";

export const pick = (driver, targets) => targets[driver.kind] ?? targets.both;

export const NAVIGATION_TARGETS = Object.freeze({
  settings: { both: { label: "Settings" } },
  // Proof that the Settings sidebar is the one on screen.
  settingsShown: {
    electron: { selector: "button", text: "Keybindings" },
    native: { label: "Keybindings" },
  },
  appSidebar: { both: { label: "Home" } },
  newThread: {
    electron: { selector: "a, button", text: "New thread" },
    native: { label: "New thread" },
  },
  automations: { both: { label: "Automations" } },
  pullRequests: { both: { label: "Code review" } },
  // Electron's Kanban is a view of Tasks; Native's Tasks button opens the board.
  kanban: { both: { label: "Tasks" } },
  kanbanView: { electron: { selector: "button", text: "Kanban" } },
});

export function settingsShown(driver) {
  return driver.find(pick(driver, NAVIGATION_TARGETS.settingsShown));
}

/**
 * Brings back the app sidebar (threads, New thread). The rail swaps the sidebar per
 * destination (Settings sections, nothing on Tasks/Kanban); its Home button returns to
 * the last thread with the app sidebar and is a no-op there.
 */
export async function showAppSidebar(driver) {
  await driver.tap(pick(driver, NAVIGATION_TARGETS.appSidebar));
  // Fully on screen: the sidebar slides in from the left on the way back from
  // Tasks/Kanban, and a row that is still partly off-window cannot be tapped.
  await waitFor(
    async () => {
      const row = await driver.find(pick(driver, NAVIGATION_TARGETS.newThread));
      return row !== null && row.x - row.width / 2 >= 0;
    },
    { label: "the app sidebar" },
  );
}

export function openSettings(driver) {
  return driver.tap(pick(driver, NAVIGATION_TARGETS.settings));
}

/** Opens the Kanban board; the caller waits for what it needs on it. */
export async function openKanbanSurface(driver) {
  await showAppSidebar(driver);
  await driver.tap(pick(driver, NAVIGATION_TARGETS.kanban));
  const view = pick(driver, NAVIGATION_TARGETS.kanbanView);
  if (view) await driver.tap(view);
}

export async function openAutomationsSurface(driver) {
  await showAppSidebar(driver);
  await driver.tap(pick(driver, NAVIGATION_TARGETS.automations));
}

export async function openPullRequestsSurface(driver) {
  await showAppSidebar(driver);
  await driver.tap(pick(driver, NAVIGATION_TARGETS.pullRequests));
}

export const DOCK_TOGGLE = { label: "Toggle right sidebar" };
export const DOCK_ADD_PANEL = { label: "Add panel" };

/**
 * Leaves the right dock open with at least one pane. An empty dock shows a
 * launcher (one "Open <pane>" button per pane kind) instead of tabs; `launcherLabel`
 * picks the pane opened from it. A dock that already has panes is left as it is.
 */
// Electron loads the dock's panes on first use; the first open of a run has taken longer
// than waitFor's 15 s default, later ones are immediate.
export const DOCK_FIRST_OPEN_TIMEOUT_MS = 45_000;

/** Resolves once `target` has kept its place across two looks ~150 ms apart. */
async function settledBox(driver, target) {
  let previous = null;
  return waitFor(
    async () => {
      const box = await driver.find(target);
      const settled =
        box && previous && Math.abs(box.x - previous.x) < 1 && Math.abs(box.y - previous.y) < 1;
      previous = box;
      return settled ? box : null;
    },
    { label: `${JSON.stringify(target)} to stop moving on ${driver.kind}` },
  );
}

export async function openDockWithPane(driver, launcherLabel) {
  const launcher = { label: launcherLabel };
  if (await driver.find(DOCK_ADD_PANEL)) return;
  if (!(await driver.find(launcher))) await driver.tap(DOCK_TOGGLE);
  const shown = await waitFor(
    async () =>
      (await driver.find(DOCK_ADD_PANEL))
        ? "tabs"
        : (await driver.find(launcher))
          ? "launcher"
          : null,
    { label: `the dock on ${driver.kind}`, timeoutMs: DOCK_FIRST_OPEN_TIMEOUT_MS },
  );
  if (shown === "launcher") {
    // The dock slides in: a tap aimed at a launcher button that is still moving lands
    // beside it, and the pane never opens.
    await settledBox(driver, launcher);
    await driver.tap(launcher);
    await waitFor(() => driver.find(DOCK_ADD_PANEL), {
      label: `the dock tabs on ${driver.kind}`,
      timeoutMs: DOCK_FIRST_OPEN_TIMEOUT_MS,
    });
  }
}
