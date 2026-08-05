# Settings search current-head evidence

Status: retained Web/Lynx-for-Web filtered interaction plus exact-owned Native
default anatomy

## Delivered parity

- Lynx Settings now renders a real native search input instead of
  `Search unavailable in this runtime`.
- Ranking and copy reuse the shared `settingsSearchIndex`.
- The result list replaces navigation while the query is non-empty, caps at
  12 rows, and restores navigation after selection or Escape.
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
  `1da123d855ac7b4d3ddcd025986e41c15a6a5a5258fc9b2f4cff00f1b6030c36`.
- Native screenshot: 2560×1576, bundle
  `3a1979fc8a9200a2656141a73e90a558d511bda7d04733da35ace7d0d0421362`.
- Native default-state required roles: light root, search shell, native input,
  and navigation row; exact-client console is empty. Native filtered interaction
  is not claimed because driving the real macOS text client would take focus.
- Focused search/input suites: 4/4.
- No user setting or project data changed. Owned KV was restored byte-exact.
