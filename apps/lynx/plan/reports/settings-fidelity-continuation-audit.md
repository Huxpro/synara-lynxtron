# Settings fidelity continuation audit

Status: incomplete — current-head sidebar correction and full Settings matrix
refresh complete; heavy verification still pending

Updated: 2026-08-05

Objective: continue closing UI fidelity issues found after the previous P10
audit, with real product behavior and current-head Web → Lynx-for-Web → Native
evidence.

This audit does not treat the old 44-state P10 manifest, a green build, or the
number of implemented pages as proof that the continuation objective is
complete.

## Prompt-to-artifact checklist

| Requirement | Concrete evidence | Status |
| --- | --- | --- |
| Preserve the previously certified shell, Composer, routes, controls, and motion | Existing P10 atlas, focused suites, current production builds | PASS |
| Fix provider-health banner residual | `efa9b773`, `33e3ca15`; `shots/2026-08-05/provider-health-banner-current/` | PASS |
| Fix Kanban overview residual | `b463ff26`; `shots/2026-08-05/kanban-overview-current/` | PASS |
| Converge Settings Appearance | `cfdd6db4`; current-head Lynx frame corrected in `52d55bf7` | PASS |
| Add real Profile dashboard | `5f827e77`; canonical stats RPCs and shared selectors | PASS |
| Add real Archived workflow | `31d6a956`; canonical shell projection and `thread.unarchive` | PASS |
| Add real Worktrees workflow | `29c229e9`; canonical list/remove RPCs and linked-thread deletion ordering | PASS |
| Add real Skills workflow | `1dee54c0`; 114 real catalog switches and serialized setting updates | PASS |
| Add real Advanced workflow | `52d55bf7`; keybindings open, conditional repair, build-sourced version | PASS |
| Correct invalid Lynx-for-Web evidence | `52d55bf7`; staged bundle, stable `/lynx/index.html` URL, target `X-VIEW` classes | PASS |
| Add real Integrations workflow | `fecffd47`; list/create/revoke/refresh, project scope, permissions, setup prompt | PASS |
| Add honest AppSnap capability state | `bcd523ba`; disabled semantics and explicit missing host bridge | PASS |
| All 15 canonical Settings sections are reachable in Lynx | `SettingsPage.tsx` `availableSections` exactly matches `SETTINGS_SECTION_IDS` | PASS |
| Every canonical section has an explicit renderer and unknown ids fail closed | `settingsNavigation.test.ts`; explicit Providers branch and terminal `null` fallback | PASS |
| Current focused regression suite | 14 files, 50/50 tests; AppSnap final focused suite 2/2 | PASS |
| Current Web/Lynx-for-Web/Desktop production builds | Final AppSnap slice builds pass; expected CSS and optional `ws` native-module warnings only | PASS |
| Reuse audit includes current graph | regenerated baseline; strict check passes; Settings gate 53.75% | PASS |
| Style audit current | strict check passes; 98.07% weighted coverage | PASS |
| Exact-owned Native identity and cleanup for every new page | per-page `native/capture.json`, empty Native consoles, byte-exact KV restoration | PASS |
| Current-head evidence is not Web fallback masquerading as Lynx | six affected Settings cells recaptured from staged bundle with stable Lynx host URL | PASS |
| New Settings pages cover light/dark × 1280/1440 | light/1280 plus dark/1440 retained for eight continuation pages | PASS |
| Continuation matrix is machine-verified against the sidebar-gutter implementation head | `settings-continuation-manifest.json`; strengthened verifier validates 16 states / 48 cells, same-snapshot client triples, target/sidebar geometry, logical Native dimensions, bundle identity, and runtime consoles | PASS — historical after the focused typography slice |
| Settings navigation group-label typography matches Web | `SettingsNavigationTypography.lynx.test.ts`; current-head Web/Lynx geometry in `shots/2026-08-06/settings-navigation-typography/` | PASS |
| Settings Back row typography matches the shared Web sidebar row | `SettingsSidebarChromeCompositionElements.lynx.test.tsx`; Lynx label inherits the same 12px/400/18px identity | PASS |
| Settings search control uses Web's single 28px soft-input chrome | `size="sm"` + `variant="soft"`; paired resolved styles and real keyboard result in `shots/2026-08-06/settings-search-chrome/` | PASS |
| Settings search icon tone matches Web without double-dimming unavailable state | direct-child available selector uses 0.7 opacity; unavailable row keeps only its existing container opacity | PASS |
| Settings navigation and search-result tone hierarchy matches Web | current-head resolved opacities 1 / 0.95 / 0.89 in `shots/2026-08-06/settings-row-tone/` | PASS |
| Settings row active/focus/press paint follows Web contract | active semantic fill, inset focus ring, no whole-row pressed dim; focused CSS tests and Native build | PASS — Native focus interaction not claimed |
| Settings search no-match state reuses Web section-label hierarchy | real no-match query resolves to 26px, 12px/400/18px, 0.58 tone | PASS |
| Settings search internal icon/text metrics match Web `SearchInput` | 10px icon inset, 32px text inset, 10px end inset; focused source contract and builds | PASS |
| Settings multi-result list rhythm matches Web | broad query proves 56px groups separated by shared 2px gap, 58px pitch | PASS |
| Settings sidebar static tone hierarchy matches Web | group labels muted/58; Back row foreground/95 with full interactive tone | PASS |
| Settings search results use the owned remaining sidebar viewport | 704px flex viewport at 1280x820; all 12 capped results fit without the stale 610px cap | PASS |
| Settings matched-title typography matches Web nested rows | current-head `Archived threads` resolves to 13px/20px inside the unchanged 28px row | PASS |
| Shared content section labels use one Web identity | General, Appearance, Provider Picker, and Usage use 12px/400/18px, 4×8 padding, muted/58; Profile dashboard heading intentionally distinct | PASS |
| Standard Settings cards use one Web radius | General, Appearance, Provider Picker, and generic cards resolve to rounded-lg / 10px; custom quota cards excluded | PASS |
| Provider Picker typography matches its Web owners | standard header uses SettingsRow token; provider items use text-sm 14px/20px | PASS |
| Provider Picker supporting copy preserves Web hierarchy | description 12px/18px; status 11px/17px with existing offsets | PASS |
| Provider Picker item anatomy matches Web | 10×12 padding, 10px radius, 14px/20px label, 42px minimum row | PASS |
| Provider Picker card internal rhythm matches Web | 10×12 header, 16px status-to-list inset, 10px bottom inset, 8px item gap | PASS |
| Provider Picker reset uses real icon identity | generated `Undo2Icon` replaces text glyph while preserving native action/accessibility contract | PASS |
| Provider Picker move controls use real icons | Native keeps explicit up/down adaptation with generated chevrons; disabled/action contracts unchanged | PASS |
| Settings switch geometry matches Web desktop primitive | General, Provider Picker, and disabled AppSnap use 32×20 track with 16px thumb | PASS |
| Settings switch paint matches Web desktop primitive | 14% border, theme-safe 20% off track, accent on state, white thumb across all owners | PASS |
| Provider switch has visible Native interaction feedback | hover/focus/pressed classes now render halo/ring/press feedback; Web thumb-scale motion remains platform-specific | PASS |
| Settings select chevron tone matches Web primitive | General select chevron uses shared 0.8 icon tone | PASS |
| All Settings reset affordances share real icon identity | General, Appearance, Git Writing, and Provider Picker reuse `SettingsResetIcon` / generated `Undo2Icon` | PASS |
| Integrations checkbox uses real icon identity | generated `CheckIcon` replaces the font check glyph without changing selection semantics | PASS |
| Integrations project selection rows match Web anatomy | 8×12 padding, 12px/400 title, border/70 and checked foreground/30 + muted/70 paints | PASS |
| Integrations project picker matches Web desktop columns | Native uses two-column flex-wrap at Lynxtron desktop widths; canonical snapshot has no safe populated visual state | PASS — focused contract, visual N/A |
| Shared Input radius matches Web controls | Lynx `LxInputControl` uses rounded-lg / 10px across Settings inputs | PASS |
| Shared Button radius matches Web controls | Lynx `LxButton` uses rounded-lg / 10px; explicit capsule/special variants remain owners | PASS |
| Usage cards match Web SettingsCard anatomy | 10px radius, 16px card padding, 14px internal gap; current unavailable cards are exact 624×95.5 at y=150/257.5/365; loading state keeps 14×16 padding | PASS — current-head visual proof |
| Usage cards preserve provider visual identity | 28px rounded provider shell with existing mapped SVG icon, border, muted/60 surface, and 14px/20px/600 title | PASS — current-head visual proof |
| Usage headers match Web horizontal rhythm | root follows the shared 6px section gap; section/card headers use 8px gap; nested provider identity retains its distinct 10px icon/title gap | PASS — current-head visual proof |
| Usage card content and header overflow match Web | content stack uses 14px rhythm; provider identity grows with min-width 0, title ellipsizes, and status pill does not shrink | PASS |
| Usage status pills match Web semantics | ok shows plan pill only when named; needs-auth/error use 12% semantic surfaces and theme-aware text; unsupported remains muted | PASS |
| Usage cards render real quota meters | canonical `usedPercent` drives 8px healthy/warning/danger remaining tracks rather than text-only quota summaries | PASS — source/shared-logic tests; current real snapshot had no meter branch |
| Usage meter rows match Web metadata and pace anatomy | shared server-limit derivation drives label + 6px pace dot, 8px track + marker, remaining/reset metadata, and optional reserve/ETA rows from real reset timing | PASS — source/shared-logic tests; not screenshot-certified in current unavailable state |
| Usage stale-data warnings preserve Web semantics | otherwise-OK snapshots with `detail` retain last-good usage and show a 14px warning icon plus 12px/18px warning copy before meters | PASS — source/focused tests; branch absent from current real snapshot |
| Usage line list matches Web row structure | horizontal label/value rows, 2px item rhythm, 6px list gap, and 12px divider after meters | PASS — source/focused tests; branch absent from current real snapshot |
| Usage Refresh action matches Web identity | generated 14px refresh icon spins while fetching; current trigger is exact 72×24 with 10px/15px label | PASS — current-head visual proof |
| Usage Refresh matches Web request semantics | dedicated mutation sends `{ forceRefresh: true }`, merges partial batches with prior provider cards, and shares pending/disabled/spin state without bypassing provider cooldown safety | PASS |
| Usage footer matches Web explanation and rhythm | full local-credentials, OAuth refresh, and CLI re-authentication copy with 11px/18px typography and 8px horizontal inset; current x/y/width are exact | PASS — current-head visual proof |
| Appearance theme controls match Web icon and switch identity | Theme preference uses generated Sun/Moon/Laptop icons; boolean switch uses normalized geometry/paint | PASS |
| Appearance card separators match Web divide-y ownership | physical-shared terminal-row contract removes trailing dividers across fixed, conditional, and single-row cards | PASS |
| Appearance numeric controls match Web geometry and editing | 28px soft input is 80px wide, right-aligned, separated from `px` by 8px, and ignores transient empty edits | PASS |
| Appearance terminal font matches Web autocomplete behavior | shared suggestions filter in a 224px soft input, anchored scrollable Menu items select values, nested clear action resets, and no-match copy is explicit while free-form values remain valid | PASS — controlled Input publication covered by existing runtime boundary, pure filter/source/Menu tests here |
| Appearance Theme Pack cards reuse Settings contracts | nested cards use 10px radius, 32×20/16px semantic switches, and shared generated reset icons instead of a stale 12px/18px/text-glyph fork | PASS |
| Appearance code-theme selector preserves palette identity | trigger and menu options render real 20px `Aa` previews from surface/ink/accent data, 13px truncating labels, a 14px chevron, and accessible trigger text | PASS |
| Appearance Theme Pack contrast matches Web's adjustable control | 176px real rail/fill with 14px thumb supports tap, mouse/touch drag, Arrow/Home/End, 0–100 accessibility values, and a 28px numeric readout | PASS |
| Appearance Theme Pack controls self-size like Web | row controls no longer force 280px; UI/code font inputs are 224×32 soft controls with correct UI/mono families and accessible labels; current-head cards converge to 475px versus Web 475.5px instead of accumulating 17px drift | PASS — Native import remains honestly labeled clipboard adaptation |
| Appearance Theme Pack header actions match Web hierarchy | nested Reset is a 20px / 11px compact action; Import clipboard and Copy are 24px / 12px muted actions with explicit owners | PASS |
| Appearance Theme Pack color controls match Web trigger anatomy | 176×32 color-filled direct-edit controls use 20px indicators, readable luminance-derived text/rings, uppercase code hex text, validation, and shared reset icons | PASS — no fake native color picker |
| Appearance Time format select matches Web standard control | trigger and popup are 160px with a 14px chevron, 8px gap, 12px left-aligned truncating label, and accessible naming | PASS |
| Appearance segmented controls match Web semantics and hierarchy | radiogroup/radio checked state is explicit; inactive labels/icons use muted tone; text-only options use Web's 9px horizontal padding while icon-bearing theme options retain their exact geometry; Theme Pack row labels use theme-safe foreground/90 | PASS |
| General deep links and provider selects preserve Web identity | `environment-panel` target is emitted; provider trigger/options use real mapped 14px SVGs or neutral initial fallbacks, 8px gaps, and truncating labels | PASS |
| General standard selects match Web primitive tone and naming | existing 176×32 trigger keeps its geometry; 12px chevron uses 0.5 tone and the interactive Menu trigger publishes the control label | PASS |
| Behavior and Notifications reuse shared reset identity | both shared panels consume one SettingsPage reset renderer with generated 14px Undo icon, icon-xs ghost chrome, and preserved labels | PASS |
| Shared Behavior/Notifications section and row anatomy matches Web | 12px/400/18px muted/58 labels, 6px section gap, transparent 10px cards, density-driven rows, 2px copy rhythm, 20px title lines, correct first-row dividers, and supplemental status outside the common control-centering layout | PASS — current-head visual proof |
| Notifications reflects actual Lynx runtime capability | no toast/OS notification consumer exists; both stored preferences remain visible/resettable but controls are disabled, non-focusable, aria-disabled, and carry explicit per-row unavailable status without shifting their Web-common switch anchors | PASS — honest capability delta and current-head visual proof |
| AppSnap unavailable capability rows preserve Web anatomy | unavailable status follows the common main layout, disabled switch shares the Web baseline, all four rows are content-driven with 20px title lines and previous-row bottom dividers | PASS — honest capability delta and current-head visual proof |
| Advanced rows and recovery details match shared Settings/disclosure behavior | keybindings/recovery main layouts, 11/16.5 metadata, and 24px actions match Web; controlled `What this does` uses a 16px trigger/chevron, exact 42px inset details, and shared 220ms motion/presence | PASS — current-head visual and interaction proof |
| Profile stats, heatmap, and model rows match Web identity | identity uses the Web 6px name/handle subgroup and 20/28 + 24/32 typography; stat values/labels use 14px/20px in an exact 18px-radius card; heatmap uses Web weekday pads, 40 week columns, 15.0625px cells, 5px radius, and exact month anchors; model rows retain 14px mapped provider SVGs or neutral fallbacks with 8px gaps | PASS — current-head visual proof for real identity/stats/heatmap/empty state; populated model branch source-tested |
| Worktrees rows and empty state match Web density and typography | real empty state is exact 624×70 with 24×16 padding, 10px radius, and 14px/20px copy; populated rows have no artificial 96px minimum, mono paths truncate, and linked conversation titles use regular description typography | PASS — current-head empty-state visual proof; populated rows source-tested |
| Archived empty and list states match Web hierarchy | real empty state is exact 624×182 with 40×20 padding, dashed border, explicit 10px radius, generated 20px Archive icon, and 14px/20px copy; populated rows no longer force a 60px minimum | PASS — current-head visual proof for empty state; populated row source-tested |
| Skills rows match Web density and provider identity | real 114-row catalog uses separate main/control and supplemental metadata owners; source/path is exact 11px/16.5px, switches share Web anchors, previous-row bottom dividers match `divide-y`, and overlapping 16px provider-copy badges use mapped 12px SVGs or neutral fallbacks | PASS — current-head populated visual proof |
| Integrations rows and actions match Web content-driven geometry | real form rows use exact 20px title lines, 12/18/500 titles, previous-row bottom dividers, and Web bounds; connection/setup/empty rows remain content-driven and action groups self-size | PASS — current-head real form proof |
| Integrations disclosures reuse shared motion | rendered Access all opens two real projects; Review opens three permissions; both use shared 220ms presence/content motion and restore cleanly | PASS — current-head interaction proof |
| Models includes complete Git-writing and custom-model workflows | Git writing row is terminal with exact 20px title line and no trailing divider; custom models use shared validation, canonical server settings, eight-provider editor, Add/Enter/remove/reset, immediate picker refresh, and exact Web geometry | PASS — current-head visual and real add-picker-remove proof |
| Providers includes complete update and provider-tools workflows | `SettingsProviderToolsPanel.lynx.tsx`; real three-provider update list, nine CLI disclosures, docs, all Web override fields, canonical update/edit/reset RPCs, exact 44px tool rows, and real edit-reset cleanup in `shots/2026-08-05/providers-current-head/` | PASS — current-head fast-loop visual and real mutation proof |
| Shared Button icon-label spacing matches Web | default/sm/xs gaps are 8/6/4px; mixed Appearance labels retain `LxButton__text` styling | PASS |
| Settings large card radius resolves at runtime | the Lynx root defines shared `--radius-lg: 10px`; AppSnap, Skills, and Worktrees representative surfaces compute to 10px, while Advanced/Integrations consumers are statically covered | PASS — current-head runtime and consumer audit |
| Settings sidebar search matches Web intent | shared ranking/index, real Lynx input/results/selection/row targeting, canonical section icons, Web-owned horizontal gutter, Web/Lynx filtered evidence, Native default anatomy | PASS — Native filtered text entry not claimed |
| Populated destructive/mutation paths are visually certified without fabricated data | canonical snapshot has no managed worktree/integration/archived rows; logic/RPC tests cover the product paths and direct SQLite fixtures are forbidden | NOT APPLICABLE — no safe canonical populated state |
| Full final heavy pass | AGENTS requires `bun fmt`, `bun lint`, `bun typecheck`; current conversation does not explicitly authorize running them | **BLOCKED BY INSTRUCTION** |
| Worktree clean and local HEAD equals origin | finalization command verifies local HEAD equals origin; only excluded isolated `.p10-view*` runtime directories remain | PASS |

## Section ownership

| Section | Lynx owner |
| --- | --- |
| General | shared `SettingsGeneralComposition` |
| Profile | `SettingsProfilePanel` |
| Appearance | shared `SettingsAppearanceComposition` |
| Notifications | shared `SettingsNotificationsPanel` |
| Behavior | shared `SettingsBehaviorPanel` |
| AppSnap | `SettingsAppSnapPanel` unavailable capability surface |
| Keyboard Shortcuts | shared `KeyboardShortcutsSettingsComposition` |
| Worktrees | `SettingsWorktreesPanel` |
| Archived | `SettingsArchivedPanel` |
| Models | shared `SettingsGitWritingModelComposition` |
| Providers | `SettingsProviderToolsPanel` plus shared provider picker |
| Skills | `SettingsSkillsPanel` |
| Usage | `SettingsUsagePanel` |
| Integrations | `SettingsIntegrationsPanel` |
| Advanced | `SettingsAdvancedPanel` |

No canonical navigation item falls through to the Providers fallback.

The current Usage source-to-source matrix has no remaining concrete branch,
spacing, typography, status, meter, notice, refresh, footer, or overflow
differences. This is a source/build disposition; it does not retroactively make
the historical full screenshot matrix cover the newer focused Usage commits.

## Evidence integrity correction

The initial continuation captures used `http://localhost:8921/lynx/index.html`
while `apps/web/public/lynx` was absent. Vite returned the Web SPA fallback,
which made Web appear to be Lynx-for-Web. The completion audit rejected that
evidence.

The retained replacement cells:

- stage `apps/lynx/dist/web` under the isolated Web origin;
- verify the served bundle hash;
- retain the host URL under `/lynx/index.html`;
- navigate through Lynx memory history;
- require a target `X-VIEW` class;
- use exact `1280×820` PNG dimensions.

## Verification results

- Current-head AppSnap proof preserves the unavailable host boundary while
  aligning all four Capture rows. Enable's disabled switch converged from
  `y=337` to Web `y=325`; status remains visible as 11/16.5 supplemental
  metadata. Evidence is under `shots/2026-08-05/appsnap-current-head/`.
- AppSnap focused rerun: 1 file, 2/2 tests; Lynx-for-Web and Native/Desktop
  builds pass. Bundles: Lynx-for-Web `526cf88a…`; Native `0528a538…`.
- Current-head Integrations proof covers exact four-row form geometry, two
  canonical project choices, three advanced permissions, and both disclosure
  exit lifecycles. Access-all state was restored and the snapshot hash stayed
  unchanged. Evidence is under
  `shots/2026-08-05/integrations-current-head/`.
- Integrations focused rerun: 1 file, 3/3 tests; Lynx-for-Web and
  Native/Desktop builds pass. Bundles: Lynx-for-Web `d206de90…`; Native
  `07d7db5e…`.
- Current-head Advanced proof covers exact Keybindings/Recovery row geometry,
  24px actions, supplemental metadata, and the real disclosure lifecycle.
  Open details match Web at `469/394.5/598/42`; close retains the motion node
  with `aria-hidden` for 220ms before unmount. Evidence is under
  `shots/2026-08-05/advanced-disclosure-current/`.
- Advanced focused rerun: 1 file, 3/3 tests; Lynx-for-Web and Native/Desktop
  builds pass. Bundles: Lynx-for-Web `66c60353…`; Native `9464303d…`.
- Current-head Worktrees real empty state now matches Web at 624×70 with
  24×16 padding, dashed border, 10px radius, and 14/20 copy. Populated rows
  remain source/RPC-tested because the snapshot contains none. Evidence is
  under `shots/2026-08-05/worktrees-current-head/`.
- Worktrees focused rerun: 1 file, 3/3 tests; Lynx-for-Web and Native/Desktop
  builds pass. Bundles: Lynx-for-Web `046420bd…`; Native `0e841ae6…`.
- Current-head Models audit found the entire Custom models workflow missing.
  Lynx now shares Web validation, reads/writes canonical provider custom-model
  arrays, supports eight-provider selection/Add/Enter/remove/reset, and updates
  Git writing options immediately. A real temporary Codex slug was added,
  observed in the writing picker, then removed through rendered controls with
  no residue. Evidence is under
  `shots/2026-08-05/models-current-head-complete/`.
- Current-head Models geometry is exact for both Generation and Custom models
  sections. Shared tests 2/2, Web tests 2/2, Lynx tests 15/15; all production
  builds pass. Bundles: Web `ecb93a6e…`, Lynx-for-Web `e8a2aceb…`, Native
  `9768fe07…`.
- Current-head populated Skills harness used the real 114-item catalog. Main
  title/description/control layout is now independent from 11/16.5 provider
  metadata and paths; switch anchors and previous-row bottom dividers match Web
  exactly across short and long rows. Evidence is under
  `shots/2026-08-05/skills-current-head-populated/`.
- Current-head Skills focused rerun: 1 file, 3/3 tests; Lynx-for-Web and
  Native/Desktop production builds pass. Bundles: Lynx-for-Web `1d98f676…`;
  Native `788dbf0e…`.
- Settings token-resolution audit found eleven `--radius-lg` consumers across
  five native panels with no root definition. The shared root now owns
  `--radius-lg: 10px`; runtime proof covers AppSnap, Skills, and Worktrees, and
  focused consumer coverage includes Advanced and Integrations. Evidence is
  under `shots/2026-08-05/settings-radius-token-current/`.
- Token focused rerun: 1 file, 2/2 tests; Lynx-for-Web and Native/Desktop
  production builds pass. Bundles: Lynx-for-Web `0ea9714c…`; Native
  `0be7188f…`.
- Current-head Archived fast harness: real empty state on the same snapshot,
  Light, `1280×820`, DPR 1. Position, dimensions, dashed border, generated
  icon, and 14/20 copy already matched; undefined `--radius-lg` produced a 0px
  radius. Explicit 10px ownership now matches Web. Evidence is under
  `shots/2026-08-05/archived-current-head/`.
- Current-head Archived focused rerun: 1 file, 3/3 tests; Lynx-for-Web and
  Native/Desktop builds pass. Bundles: Lynx-for-Web `9c8bd30e…`; Native
  `db62eba7…`. Populated restore rows were absent and remain source-tested.
- Current-head Profile fast harness: same trusted origin/snapshot, Light,
  `1280×820`, DPR 1. The real state covered identity, five stat tiles, 274
  heatmap cells, insight values, and empty plugin/model sections. Populated
  plugin/model rows were absent and remain explicitly source-tested rather than
  screenshot-certified. Evidence is under
  `shots/2026-08-05/profile-current-head/`.
- Current-head Profile residual repair: heatmap columns now include Web's
  weekday lead/tail pads (40 columns, 274 cells, 6 pads), months use each
  week's first real cell, and grid/cell/month geometry is exact. Identity now
  uses the Web 6px name/handle subgroup with 20/28 and 24/32 typography; stats
  card aligns at `408/250/720/68` with radius 18.
- Current-head Profile focused rerun: 1 file, 3/3 tests including pure
  weekday-slot behavior; Lynx-for-Web and Native/Desktop production builds
  pass. Bundles: Lynx-for-Web `5173a650…`; Native `417aef48…`.
- Current-head Notifications fast harness: same trusted origin/snapshot,
  explicit Light theme, `1280×820`, DPR 1. Web retained its real browser
  notification controls; Lynx retained disabled switches and explicit
  unavailable statuses because no notification consumer/bridge exists.
  Evidence and exact geometry are under
  `shots/2026-08-05/notifications-current-head/`.
- Current-head Notifications residual repair: supplemental status moved after
  the shared row layout, so the first switch converged from `y=182` to Web
  `y=171` while status remained visible at `y=201`. Section/card/first-row,
  title, description, switch, and divider ownership now match exactly.
- Current-head Notifications focused rerun: Web 1 file, 2/2 tests; Lynx 1 file,
  1/1 test; Web, Lynx-for-Web, and Native/Desktop production builds pass.
  Bundles: Web `25cf40f5…`; Lynx-for-Web `dd1fcb89…`; Native `48c25db7…`.
- Current-head Usage fast harness: shared trusted `localhost:8921` origin,
  snapshot `cd3e1e9e…`, explicit Light selection through both rendered
  Appearance controls, `1280×820`, DPR 1. The real state contained three
  unavailable-provider cards and visually covered header/Refresh,
  provider/status/detail anatomy, card stacking, and footer. Retained evidence
  and exact geometry are under `shots/2026-08-05/usage-current-head/`.
- Current-head Usage residual repair: root gap converged from 12px to the Web
  section's 6px; error detail from 12/18 to 12/19.5; provider title to
  14/20/600; Refresh to 72×24 with a 10/15 label. Header, icon/title/status,
  three 624×95.5 cards, details, and footer now share exact Web coordinates.
  The snapshot hash stayed unchanged and both browser sessions had no page
  errors.
- Current-head Usage focused rerun: 1 file, 6/6 tests; Lynx-for-Web and
  Native/Desktop production builds pass. Bundles: Lynx-for-Web `d922e7f2…`;
  Native `4c5aef82…`. Meter/pace/stale-notice/usage-line branches were absent
  from this real snapshot and remain explicitly source/logic-tested rather than
  falsely screenshot-certified.
- Current-head Appearance fast harness: shared trusted `localhost:8921` origin,
  same isolated snapshot, light theme, `1280×820`, DPR 1. The independent
  `127.0.0.1:8922` origin was correctly rejected and classified as a harness
  failure rather than product evidence. Retained measurements and four staged
  screenshots are under `shots/2026-08-05/settings-current-head/`.
- Current-head Appearance residual repair: Theme Pack font controls moved from
  28px to the Web authority's 32px; both cards now measure 475px versus 475.5px
  and downstream rows differ by only 1px fractional rounding. Text-only density
  segments now match Web option widths exactly at 72.3/92/72.8px. The real
  224px terminal-font suggestion popup opened with shared suggestions, the
  client stayed online, and browser page errors were empty.
- Current-head focused rerun: Appearance + Theme Pack 2 files, 7/7 tests;
  Lynx-for-Web and Native/Desktop production builds pass. Bundles:
  Lynx-for-Web `df1978d4…`; Native `53c91cdd…`.
- Current-head Providers audit found an entire workflow gap rather than a
  geometry-only residual: Lynx exposed only update-check preference plus the
  picker, while Web also owned real update rows and nine expandable provider
  tools. The new panel reads canonical config/settings, runs
  `server.updateProvider`, edits every Web override through
  `server.updateSettings`, preserves configured-password redaction, and owns
  one complete reset. Evidence is under
  `shots/2026-08-05/providers-current-head/`.
- Providers current-head geometry converged to Web: Updates card
  `624x338.5` versus `624x337.5`, three rows approximately 59px, Provider
  tools card `624x496` versus `624x496.5`, all nine rows exactly `596x44`,
  and open Codex disclosure/inputs exactly `596x257` and `572x28`.
  Update-action visibility matches Web for three behind-latest and three safe
  unknown-advisory providers.
- A rendered `CODEX_HOME` edit committed through the real server, immediately
  showed `Custom`, and the rendered reset removed it. The temporary path left
  no residue; isolated `settings.json` and `state.sqlite` returned to their
  original SHA-256 values after owned-server shutdown. Focused Providers +
  navigation tests pass 15/15; Lynx-for-Web and Native/Desktop production
  builds pass. Bundles: Lynx-for-Web `52b92766…`; Native `eaf1b834…`.
- Settings focused continuation: 14 files, 50/50 tests.
- AppSnap final focused check: 1 file, 2/2 tests.
- Canonical taxonomy/explicit-owner gate: 1 file, 11/11 tests.
- Reuse audit write + strict check: pass.
- Style audit write + strict check: pass.
- Current production builds: Web, Lynx-for-Web, Native/Desktop pass.
- Native consoles for all continuation cells: empty.
- Current-head evidence verifier: 16/16 Settings states, 48/48 client cells.
  Light and dark batches were captured only after all three clients synchronized
  the theme and the owned server was paused on one stable SQLite snapshot.
- Verifier now rejects per-state cross-client snapshot drift, missing
  browser/sidebar/target geometry, incorrect Native logical dimensions,
  browser page errors, non-empty Native consoles, and bundle identity drift.
- Current certification bundles: Lynx-for-Web `f2bfbb9a…`; Native
  `3112efe2…`. Light snapshot: `803ae581…`; dark snapshot: `8855c7bf…`.
- Verifier regression tests: 3/3; the original strict run rejected eight
  `1280×633` Web frames, which were recaptured at `1280×820`.
- Settings search/icon/layout focused suites: 7/7; real Lynx-for-Web keyboard query retained
  `archived thread`, produced one Archived result, navigated, and cleared.
- The current-head filtered frame resolves Archived through the shared Settings
  icon registry to the generated `ArchiveIcon`; its 16×16 slot is measured at
  x=14/y=104 rather than represented by a generic placeholder.
- The Settings sidebar now uses Web's 6px horizontal owner gutter. Search result
  geometry converged from x=14/width=227 to x=6/width=243 versus Web
  x=6/width=244; the remaining 1px is Lynx's sidebar separator. The 32px y
  difference is the Web desktop titlebar and is not patched into product CSS.
- Settings navigation labels now match Web's 12px/400/18px typography and 26px
  total height. The first App row is y=124 in Lynx and y=160 in Web; subtracting
  Web's 36px desktop chrome yields exact alignment.
- Search target runtime: `Appearance: Time format` resolved the shared
  `setting-time-format` anchor and scrolled its row into the visible content
  viewport.
- Owned Native KV restored to
  `f53a83aac62fff4c8e7b6dac18d34ce8ffe27970a807a428fa0d9b0ba1a42474`.
- React Doctor hook warning on refresh commit was a generic nonzero fallback. The
  executable full scan produced no diagnostics for either changed React component:
  `apps/lynx/src/app/SettingsUsagePanel.tsx` or
  `apps/web/src/components/settings/ProviderUsageSettingsPanel.tsx`.

## Remaining work

1. Run the final heavy pass only after explicit authorization permits
   `bun fmt`, `bun lint`, and `bun typecheck`.
2. Re-run this prompt-to-artifact audit, verify local/remote parity and cleanup,
   then mark the active goal complete only if no MISSING/PARTIAL/PENDING rows
   remain.

## Current disposition

The implementation objective has materially advanced and every canonical
Settings section has a real Lynx owner. The current global sidebar correction
is covered by a fresh full matrix. The active thread goal is **not yet
complete** because the required heavy pass remains blocked by the current
instruction boundary.
