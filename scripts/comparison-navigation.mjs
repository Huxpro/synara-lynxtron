// How the comparison harness moves between the app's main surfaces in each
// renderer. Electron follows upstream's shell: an icon rail whose buttons carry
// only an aria-label, Settings without a "Back to app" row (the rail stays), a
// Kanban board reached through Tasks, and pull requests under "Code review".
// Native keeps the labelled sidebar rows. One table, so cells and workflows
// cannot drift apart.
import { waitFor } from "./comparison-workflow.mjs";

export const pick = (driver, targets) => targets[driver.kind] ?? targets.both;

export const NAVIGATION_TARGETS = Object.freeze({
  settings: { both: { label: "Settings" } },
  // Proof that the Settings sidebar is the one on screen.
  settingsShown: {
    electron: { selector: "button", text: "Keybindings" },
    native: { label: "Back to app" },
  },
  appSidebar: { electron: { label: "Home" }, native: { label: "Back to app" } },
  newThread: {
    electron: { selector: "a, button", text: "New thread" },
    native: { label: "New thread" },
  },
  automations: { both: { label: "Automations" } },
  pullRequests: { electron: { label: "Code review" }, native: { label: "Pull requests" } },
  // Electron's Kanban is a view of Tasks; Native has its own sidebar row.
  kanban: { electron: { label: "Tasks" }, native: { label: "Kanban" } },
  kanbanView: { electron: { selector: "button", text: "Kanban" } },
});

export function settingsShown(driver) {
  return driver.find(pick(driver, NAVIGATION_TARGETS.settingsShown));
}

/**
 * Brings back the app sidebar (threads, New thread). Electron's rail swaps the
 * sidebar per destination (Settings sections, nothing on Tasks/Kanban); its Home
 * button returns to the last thread with the app sidebar and is a no-op there.
 */
export async function showAppSidebar(driver) {
  if (driver.kind === "electron" || (await settingsShown(driver))) {
    await driver.tap(pick(driver, NAVIGATION_TARGETS.appSidebar));
    // Fully on screen: Electron slides the sidebar in from the left on the way back
    // from Tasks/Kanban, and a row that is still partly off-window cannot be tapped.
    await waitFor(
      async () => {
        const row = await driver.find(pick(driver, NAVIGATION_TARGETS.newThread));
        return row !== null && row.x - row.width / 2 >= 0;
      },
      { label: "the app sidebar" },
    );
  }
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
    { label: "the dock" },
  );
  if (shown === "launcher") {
    await driver.tap(launcher);
    await waitFor(() => driver.find(DOCK_ADD_PANEL), { label: "the dock tabs" });
  }
}
