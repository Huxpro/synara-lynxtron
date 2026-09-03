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
- Result section icons reuse the same canonical registry as Settings navigation.
  The retained `Archived` result resolves to the generated Tabler `ArchiveIcon`
  in a measured 16×16 slot, replacing the generic bordered square.
- The Settings sidebar owner now reuses Web's 6px horizontal gutter instead of
  the original Lynx scaffold's 14px padding. The filtered result converged from
  x=14/width=227 to x=6/width=243; Web is x=6/width=244, with the remaining 1px
  owned by Lynx's sidebar separator. The 32px vertical offset is Web's desktop
  titlebar and is intentionally not compensated in product CSS.
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
  `4bd9953643ca62fac485181ec0ad83b87ee2a154c6f62834e077a40f5e790afd`.
- Native default-anatomy screenshot: 2560×1576, prior search slice bundle
  `ddd0793074bdd62248a2c8bff4201e3c4696a35257366d026e35352f50bdd666`.
- Current icon-identity Native/Desktop production build:
  `9acfbbe3f1814a93e86bdf372ea1e61db0ad4329ad96ac9b7f67d3a752a14826`.
- Native default-state required roles: light root, search shell, native input,
  and navigation row; exact-client console is empty. Native filtered interaction
  is not claimed because driving the real macOS text client would take focus.
- Because the retained Lynx-for-Web frame is filtered while the Native frame is
  explicitly default anatomy, their whole-frame `raw` pair is a capture-state
  mismatch and is excluded from visual MAE. Both artifacts remain valid for
  their separately stated interaction/anatomy claims.
- Focused search/icon/layout suites: 7/7.
- No user setting or project data changed. Owned KV was restored byte-exact.
