import { WHATS_NEW_ENTRIES } from "../whatsNew/entries";
import { sortEntriesByVersionDesc, type WhatsNewEntry } from "../whatsNew/logic";

export const SYNARA_DOCS_URL = "https://trysynara.com/docs";

const HELP_MENU_RELEASE_LIMIT = 3;

/**
 * The latest curated releases the sidebar Help menu lists. A function, not a module
 * constant: Lynx's main-thread engine has no `Array.prototype.toSorted`, so callers there
 * resolve it only while the menu is open.
 */
export function resolveHelpMenuReleaseEntries(
  entries: readonly WhatsNewEntry[] = WHATS_NEW_ENTRIES,
): readonly WhatsNewEntry[] {
  return sortEntriesByVersionDesc(entries).slice(0, HELP_MENU_RELEASE_LIMIT);
}

/** A release row's label: its headline feature, or the version when it has none. */
export function helpMenuReleaseTitle(entry: WhatsNewEntry): string {
  return entry.features[0]?.title ?? `Version ${entry.version}`;
}
