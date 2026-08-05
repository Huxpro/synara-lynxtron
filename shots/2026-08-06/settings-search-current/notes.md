# Settings search current-head evidence

Status: retained Web/Lynx-for-Web filtered interaction plus exact-owned Native
default anatomy

## Delivered parity

- Lynx Settings now renders a real native search input instead of
  `Search unavailable in this runtime`.
- Ranking and copy reuse the shared `settingsSearchIndex`.
- The result list replaces navigation while the query is non-empty, caps at
  12 rows, and restores navigation after selection or Escape.
- Each result mirrors Web's two-level hierarchy: a 28px owning-section row
  followed by a 28px indented setting row. Web and Lynx both measure 56px total
  for `Archived / Archived threads`.
- Selecting `Archived: Archived threads` navigates memory history to the real
  Archived panel and clears the input. A second runtime check selected
  `Appearance: Time format`, found the shared `setting-time-format` anchor, and
  scrolled its 622×61 row into the viewport at y=686.
- Five Web-only conditional controls are omitted because they have no native
  renderer: AppSnap permissions, saved model slugs, provider updates,
  installed CLIs, and release history.

## Input reliability

The first runtime used a controlled native Input. Real rapid keyboard entry of
`archived thread` retained only `ad` because each keystroke waited for a
background-value acknowledgement. The search input now stays uncontrolled and
uses its ref only when the parent clears it. A clean real keyboard run retained
the full query and produced exactly one result:
`Archived: Archived threads`.

`agent-browser fill` does not emit the Lynx custom-element input event, so it
was rejected as interaction evidence. The retained Lynx run used real keyboard
events.

## Evidence

- Web screenshot: 1280×820.
- Lynx-for-Web screenshot: 1280×820, staged bundle
  `81b022f92ad7dfe3a6c827fc2706148f40b3f049cda83aa5a2653010b08c775a`.
- Native screenshot: 2560×1576, bundle
  `ddd0793074bdd62248a2c8bff4201e3c4696a35257366d026e35352f50bdd666`.
- Native default-state required roles: light root, search shell, native input,
  and navigation row; exact-client console is empty. Native filtered interaction
  is not claimed because driving the real macOS text client would take focus.
- Focused search/input suites: 4/4.
- No user setting or project data changed. Owned KV was restored byte-exact.
