// FILE: scripts/comparison-electron-selectors.mjs
// Purpose: where the comparison harness finds sidebar rows in Electron's DOM.
//   The fork used to add `data-thread-id` / `data-project-id` / `data-active`
//   to upstream's Sidebar.tsx for this. Upstream's own markup already carries
//   what the harness needs, so the selectors below read that instead and
//   Sidebar.tsx stays byte-identical to upstream:
//
//   - a thread row sits inside the element upstream tags with
//     `data-thread-hover-anchor="<scope>:<threadId>"`
//     (`createSidebarThreadHoverAnchorId` in Sidebar.logic.ts);
//   - a pinned row is the `[data-thread-item][role="button"]` in that anchor and
//     paints the selected state with `SIDEBAR_ROW_ACTIVE_CLASS_NAME`
//     (sidebarRowStyles.ts);
//   - a project/chat row is upstream's `SidebarMenuSubButton`
//     (`data-sidebar="menu-sub-button"`; its `data-slot` is overwritten by the
//     tooltip trigger that renders it), which sets `data-active` itself;
//   - a project header sits inside `data-project-hover-anchor="<projectId>"`,
//     together with its toolbar (`data-testid="new-thread-button"`).
//
//   When upstream renames one of these, the launcher's certification stops
//   with "thread identity" not ready instead of passing on a stale selector;
//   `comparison-electron-selectors.test.mjs` pins the names against upstream's
//   source so the rename is reported by a unit test first.

/** Scopes whose rows the fork's `data-thread-id` used to mark (not the Activity view). */
export const ELECTRON_THREAD_ROW_SCOPES = Object.freeze(["pinned", "chat", "project"]);

/** The first token of upstream's `SIDEBAR_ROW_ACTIVE_CLASS_NAME`: the selected paint. */
export const ELECTRON_SELECTED_ROW_CLASS = "bg-[var(--sidebar-selected)]";

const PINNED_ROW = '[data-thread-item][role="button"]';
const NESTED_ROW = '[data-sidebar="menu-sub-button"]';

function rowSelectorInAnchor(scope, anchorSelector) {
  return `${anchorSelector} ${scope === "pinned" ? PINNED_ROW : NESTED_ROW}`;
}

/** CSS selector list matching the clickable sidebar row(s) of one thread. */
export function electronThreadRowSelector(threadId) {
  return ELECTRON_THREAD_ROW_SCOPES.map((scope) =>
    rowSelectorInAnchor(
      scope,
      `[data-thread-hover-anchor=${JSON.stringify(`${scope}:${threadId}`)}]`,
    ),
  ).join(", ");
}

/** CSS selector list matching every clickable sidebar thread row. */
export function electronAnyThreadRowSelector() {
  return ELECTRON_THREAD_ROW_SCOPES.map((scope) =>
    rowSelectorInAnchor(scope, `[data-thread-hover-anchor^=${JSON.stringify(`${scope}:`)}]`),
  ).join(", ");
}

/** In-page predicate source: is this row painted as the active thread? */
export const ELECTRON_ROW_IS_ACTIVE_SOURCE = `(row) => row.getAttribute('data-active') === 'true' || row.classList.contains(${JSON.stringify(
  ELECTRON_SELECTED_ROW_CLASS,
)})`;

/** In-page function source: the thread id a row belongs to, from its hover anchor. */
export const ELECTRON_ROW_THREAD_ID_SOURCE = `(row) => { const anchor = row.closest('[data-thread-hover-anchor]')?.getAttribute('data-thread-hover-anchor') ?? ''; const separator = anchor.indexOf(':'); return separator < 0 ? null : anchor.slice(separator + 1); }`;

/** Expression: the thread id of the row the sidebar paints active, or null. */
export function electronActiveThreadIdExpression() {
  return `(() => { const isActive = ${ELECTRON_ROW_IS_ACTIVE_SOURCE}; const threadIdOf = ${ELECTRON_ROW_THREAD_ID_SOURCE}; const row = Array.from(document.querySelectorAll(${JSON.stringify(
    electronAnyThreadRowSelector(),
  )})).find(isActive); return row ? threadIdOf(row) : null; })()`;
}

/** CSS selector for the "new thread" button in one project's sidebar header. */
export function electronProjectNewThreadButtonSelector(projectId) {
  return `[data-project-hover-anchor=${JSON.stringify(projectId)}] [data-testid="new-thread-button"]`;
}
