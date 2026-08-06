# Settings fidelity continuation audit

Status: incomplete — current-head sidebar correction and full Settings matrix
refresh complete; heavy verification still pending

Updated: 2026-08-06

Objective: continue closing UI fidelity issues found after the previous P10
audit, with real product behavior and current-head Web → Lynx-for-Web → Native
evidence.

This audit does not treat the old 44-state P10 manifest, a green build, or the
number of implemented pages as proof that the continuation objective is
complete.

## Prompt-to-artifact checklist

| Requirement | Concrete evidence | Status |
| --- | --- | --- |
| Preserve the previously certified shell, Composer, routes, controls, and motion | Current-head Landing/Header, Pull Requests, empty Thread, and project Kanban are refreshed below; focused suites and production builds preserve the remaining previously certified controls and motion | PASS |
| Landing shared chat-header typography matches Web on current head | `SharedChatHeaderIdentityTitle` now owns the Web 12px/18px/400 identity; current-head Web/Lynx-for-Web are exact and exact-owned Native computes the same line box in `shots/2026-08-06/landing-header-current/` | PASS |
| Pull Requests route controls match Web on current head | Title weight, 28px route inset, 8px pills, exact filter/refresh icon identities, 16px painted slots, accessibility state, empty surface, and honest search-capability delta are covered in `shots/2026-08-06/pull-requests-current/` | PASS |
| Empty durable Thread matches Web's centered project landing | Disposable canonical project/thread creation proves the shared centered heading/composer anatomy, real project context tray, thread snapshot status, and Native Temporary interaction in `shots/2026-08-06/thread-empty-current/` | PASS |
| Project Kanban matches Web on current head | Disposable canonical project/task creation proves exact route/column geometry, title/count typography, card material/rhythm, branch glyph identity, and exact-owned Native route evidence in `shots/2026-08-06/kanban-project-current/` | PASS |
| Fix provider-health banner residual | `efa9b773`, `33e3ca15`; `shots/2026-08-05/provider-health-banner-current/` | PASS |
| Fix Kanban overview residual | `b463ff26`; `shots/2026-08-05/kanban-overview-current/` | PASS |
| Converge Settings Appearance | `cfdd6db4`; current-head Lynx frame corrected in `52d55bf7` | PASS |
| Add real Profile dashboard | `5f827e77`; canonical stats RPCs and shared selectors | PASS |
| Add real Archived workflow | `31d6a956` plus current-head populated follow-up; canonical shell projection, `thread.unarchive`, confirmed `thread.delete`, and shared pending/error ownership | PASS |
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
| Reuse audit includes current graph | regenerated baseline; strict check passes; Settings gate 53.91% | PASS |
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
| Settings row active/focus/press paint follows Web contract | active semantic fill, inset focus ring, no whole-row pressed dim; focused CSS tests plus exact-owned Native `Skills` row base/pressed/focus evidence in `shots/2026-08-06/settings-row-native-interaction/` | PASS — Native pressed and focus verified; Desktop DevTool hover event not claimed |
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
| Integrations project picker matches Web desktop columns | rendered Access-all disclosure exposes the two canonical Home/Studio projects in the real two-column flex-wrap grid; checked styling and close lifecycle follow the shared contract | PASS — current-head visual/interaction proof in `shots/2026-08-05/integrations-current-head/` |
| Shared Input radius matches Web controls | Lynx `LxInputControl` uses rounded-lg / 10px across Settings inputs | PASS |
| Shared Button radius matches Web controls | Lynx `LxButton` uses rounded-lg / 10px; explicit capsule/special variants remain owners | PASS |
| Usage cards match Web SettingsCard anatomy | 10px radius, 16px card padding, 14px internal gap; current unavailable cards are exact 624×95.5 at y=150/257.5/365; loading state keeps 14×16 padding | PASS — current-head visual proof |
| Usage cards preserve provider visual identity | 28px rounded provider shell with existing mapped SVG icon, border, muted/60 surface, and 14px/20px/600 title | PASS — current-head visual proof |
| Usage headers match Web horizontal rhythm | root follows the shared 6px section gap; section/card headers use 8px gap; nested provider identity retains its distinct 10px icon/title gap | PASS — current-head visual proof |
| Usage card content and header overflow match Web | content stack uses 14px rhythm; provider identity grows with min-width 0, title ellipsizes, and status pill does not shrink | PASS |
| Usage status pills match Web semantics | ok shows plan pill only when named; needs-auth/error use 12% semantic surfaces and theme-aware text; unsupported remains muted | PASS |
| Usage cards render real quota meters | canonical local Codex archives now survive a live-endpoint failure and visibly drive the real 96%-used / 4%-remaining danger track | PASS — current-head three-client proof in `shots/2026-08-06/usage-local-fallback-current/` |
| Usage meter rows match Web metadata and pace anatomy | shared display logic treats the real 10,080-minute duration as authoritative (`Weekly`), with exact label, 8px track, remaining metadata, and common pace-ready anatomy | PASS — current-head meter proof plus shared 6/6 tests |
| Usage stale-data warnings preserve Web semantics | live endpoint errors retain real local usage under `status: ok` with an explicit last-good warning; warning icon/copy remain before meters and lines | PASS — real Codex and Claude fallback proof |
| Usage line list matches Web row structure | real Codex and Claude 24h/7d/30d token/session rows use exact 12/16 headers, 11/16.5 subtitles, 6px list gap, and 12px divider after meters | PASS — current-head three-client visual proof |
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
| Profile stats, heatmap, plugin rows, and model rows match Web identity | identity/stats/heatmap remain exact; isolated canonical turn metadata now proves populated plugin/agent rows with exact central 12px glyphs in 20px shells, while a separate 2:1 turn mix proves the populated two-column model grid | PASS — current-head populated proofs in `shots/2026-08-06/profile-plugins-populated-current/` and `shots/2026-08-06/profile-models-populated-current/` |
| Worktrees rows and empty state match Web density and typography | empty state remains exact 624×70; canonical `git.createWorktree` now proves the populated row, exact 540.109375px copy/path width, 11/18 conversation label, shared 4px list rhythm, and 24px Delete action across Browser and exact-owned Native | PASS — current-head populated proof in `shots/2026-08-06/worktrees-populated-current/` |
| Archived empty and list states match Web hierarchy | empty state remains exact 624×182; real canonical create→archive proof now covers the populated title/description plus Restore/Delete action row with exact 24px, 10/15 xs controls and 8px action gap | PASS — current-head Browser and exact-owned Native populated proof in `shots/2026-08-06/archived-populated-current/` |
| Skills rows match Web density and provider identity | real 114-row catalog uses separate main/control and supplemental metadata owners; source/path is exact 11px/16.5px, switches share Web anchors, previous-row bottom dividers match `divide-y`, and overlapping 16px provider-copy badges use mapped 12px SVGs or neutral fallbacks | PASS — current-head populated visual proof |
| Integrations rows and actions match Web content-driven geometry | form rows retain exact Web bounds; a disposable canonical MCP connection now proves the populated row, top-aligned 24px actions, 10px copy/action gap, 436.5px copy width, and full local timestamp content across Browser and exact-owned Native | PASS — current-head connected-row proof in `shots/2026-08-06/integrations-connected-current/` |
| Integrations disclosures reuse shared motion | rendered Access all opens two real projects; Review opens three permissions; both use shared 220ms presence/content motion and restore cleanly | PASS — current-head interaction proof |
| Models includes complete Git-writing and custom-model workflows | Git writing row is terminal with exact 20px title line and no trailing divider; custom models use shared validation, canonical server settings, eight-provider editor, Add/Enter/remove/reset, immediate picker refresh, and exact Web geometry | PASS — current-head visual and real add-picker-remove proof |
| Providers includes complete update and provider-tools workflows | `SettingsProviderToolsPanel.lynx.tsx`; real three-provider update list, nine CLI disclosures, docs, all Web override fields, canonical update/edit/reset RPCs, exact 44px tool rows, real edit-reset cleanup, and exact-owned Native closed/tools/open/focus evidence in `shots/2026-08-06/providers-native-current/` | PASS — current-head fast-loop, real mutation, and Native interaction proof; Native text entry/IME not claimed |
| Providers current workflow covers dark / 1440 across all clients | `shots/2026-08-06/providers-dark-1440/`; Web/Lynx-for-Web exact 1440x900, Native exact 2880x1736, same real three-update snapshot, dark root, nine tool rows, empty page-error and Native console gates | PASS — current-head three-client matrix |
| Providers current-head evidence is machine-verified | `providers-evidence.mjs` + `providers-evidence-manifest.json` validate 19 retained states across light fast-loop, Native workflows, dark/1440 matrix, OpenCode-specific editors, checks-off and hidden-provider filtering, and navigation interaction paint; verifier locks PNG hashes/dimensions, builds, snapshot, PID-owned session URL, consoles, geometry, Native input/switch DOM, and pressed/focus styles | PASS — verifier 19/19; regression tests 3/3 |
| OpenCode-specific provider overrides are rendered on all clients | Web/Lynx-for-Web/Native evidence in `shots/2026-08-06/providers-opencode-current/` covers binary path, server URL, password, and WebSocket switch without mutating values; Native locks text/text/password types, `readonly=false`, exact switch accessibility state, and empty console | PASS — provider-specific branch, no mutation |
| Provider checks-off behavior matches Web and crosses the real server boundary | Lynx rendered switch mutation + Web readback in `shots/2026-08-06/providers-checks-off/`; two off summaries, hidden behind-latest list/actions, unknown-advisory actions retained, rendered reset restores preference, original settings/SQLite bytes restored | PASS — real mutation and cross-client proof |
| Hidden providers filter update rows without changing server availability | rendered Claude visibility switch in `shots/2026-08-06/providers-hidden-filter/` changes both summaries 3→2 and removes only Claude; rendered reset restores Claude, 3 updates, and local `hiddenProviders: []`; server settings/SQLite unchanged | PASS — local projection and update-filter integration |
| Web and Lynx provider-tool schemas cannot drift independently | `@synara/shared/providerTools` owns all nine providers, docs, field kinds/keys/placeholders, password configured keys, and structured descriptions; Web renders code segments and Lynx projects the same segments to native text | PASS — one config owner, shared 2/2 tests, Web 5/5, Lynx 15/15 |
| Early Web provider refresh survives config hydration ordering | `writeProviderStatusesToConfigCache` loads the complete config when refresh wins the race, then merges provider statuses; existing-cache path avoids refetch | PASS — focused race regression 2/2; fresh current-head Web renders three updates |
| Shared Button icon-label spacing matches Web | default/sm/xs gaps are 8/6/4px; mixed Appearance labels retain `LxButton__text` styling | PASS |
| Settings large card radius resolves at runtime | the Lynx root defines shared `--radius-lg: 10px`; AppSnap, Skills, and Worktrees representative surfaces compute to 10px, while Advanced/Integrations consumers are statically covered | PASS — current-head runtime and consumer audit |
| Settings sidebar search matches Web intent | shared ranking/index, real Lynx input/results/selection/row targeting, canonical section icons, Web-owned horizontal gutter, Web/Lynx filtered evidence, Native default anatomy | PASS — Native filtered text entry not claimed |
| Populated destructive/mutation paths are visually certified without fabricated data | reversible canonical product paths now cover Archived create/archive/delete-confirm, Worktrees create/remove, Integrations create/revoke anatomy, Profile model/plugin events, and local Usage archives in the current-head evidence directories | PASS |
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
  `db62eba7…`. Populated restore rows were absent from that batch; the later
  canonical create/archive proof under
  `shots/2026-08-06/archived-populated-current/` supersedes the former
  source-only boundary.
- Current-head Profile fast harness: same trusted origin/snapshot, Light,
  `1280×820`, DPR 1. The real state covered identity, five stat tiles, 274
  heatmap cells, insight values, and empty plugin/model sections. Populated
  plugin/model rows were absent from that snapshot; the later isolated
  canonical turn-mix proof under
  `shots/2026-08-06/profile-models-populated-current/` now screenshot-certifies
  model rows, and structured-reference proof under
  `shots/2026-08-06/profile-plugins-populated-current/` now screenshot-certifies
  plugin/agent rows. Initial evidence is under
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
  builds pass. Bundles: Lynx-for-Web `4efc6668…`; Native `af128952…`.
- Current-head exact-owned Native certification used the online configured
  bundle `9184c738…`, startup deep link `synara://settings/providers`, and
  PID-derived sessions only. It captured closed, all-tools-visible, rendered
  Codex-open, and `CODEX_HOME` focus-tap states. Codex open is exactly
  `596x257`, disclosure content `596x213`, input wrapper `572x28`; both native
  INPUT nodes are editable and publish focus/blur/selection/confirm handlers.
  Every retained Native console is empty. No text was entered, so IME, paste,
  selection, and undo/redo remain explicitly outside this certification.
- Providers dark / 1440 follow-up closes the new workflow's remaining matrix
  gap on the same `cd3e1e9e…` three-update snapshot. Web and Lynx-for-Web are
  exact `1440x900`; Native outer `1440x900` maps to `2880x1736`. Web/Lynx cards
  remain within one pixel of each other, and Native retains exact `596x58`
  update and `596x44` tool rows. The Lynx theme remount invalidated one
  attempted route frame; retained evidence re-entered Providers through its
  rendered navigation row after dark stabilized. Evidence is under
  `shots/2026-08-06/providers-dark-1440/`.
- Settings navigation interaction follow-up closes the previous Native focus
  evidence gap on the rendered inactive Skills row. Base is transparent at
  opacity `0.95`; held press produces `ui-pressed`, semantic 3.9% foreground
  fill, and opacity `1` without whole-row dimming; native `setFocus` produces
  `ui-focus` with `inset 0 0 0 1px #0169cc` while preserving geometry and
  opacity. Both exact-owned captures have empty warning/error consoles.
  Desktop DevTool `mouseMoved` did not emit `mouseenter`, so hover remains
  CSS/source-covered rather than falsely Native-certified.
- Providers evidence now has a dedicated strict manifest instead of relying on
  the older 16-state Settings continuation manifest. The verifier covers 19
  retained states and rejects image/hash/dimension, bundle/snapshot/session,
  console, geometry, disclosure, Native input/switch DOM, and pressed/focus
  paint drift. Current verifier run passes 19/19; regression tests pass 3/3.
- OpenCode-specific three-client proof closes the branch that Codex cannot
  cover. Lynx-for-Web opens a `596x429` row with `596x385` content, three
  `572x28` fields, and a `32x20` off switch. Native exposes the same four labels,
  text/text/password INPUT types with `readonly=false`, a `572x76` boolean
  shell, exact `aria-checked=false` / `Off` switch semantics, and zero console
  errors. No value was changed.
- Checks-off behavior is now verified through a real Lynx preference mutation
  and independent Web readback. Both clients show two `Automatic checks off`
  summaries and no behind-latest rows/actions; Lynx retains exactly the three
  safe unknown-advisory Update actions and exposes the real reset. The rendered
  reset restores the preference, and original settings/SQLite bytes are
  preserved.
- Provider visibility now has a rendered integration proof: hiding Claude in
  the local picker changes both update summaries from 3 to 2 and removes only
  Claude from the behind-latest list while preserving OpenCode/Pi. The rendered
  reset restores all three rows and canonical empty `hiddenProviders` storage;
  server settings and SQLite never change.
- Provider tools no longer maintain separate Web and Lynx configuration arrays.
  `@synara/shared/providerTools` now owns provider order, docs, field keys/kinds,
  password redaction keys, placeholders, and structured descriptions. Web keeps
  inline-code presentation while Lynx joins the same segments into native text.
- The current-head recapture exposed a Web refresh/config ordering race:
  `server.refreshProviders` could finish before `serverConfig` existed, and the
  cache updater silently discarded the result. The updater now hydrates the
  complete config first when needed, then merges providers. Focused tests cover
  both early-refresh and existing-cache paths.
- Because the shared-config refactor changed bundle identities and the canonical
  refresh now reports OpenCode `v1.18.12 -> v1.18.14`, all 19 Providers evidence
  states were recaptured. Strict verifier 19/19 and regression tests 3/3 pass
  against Lynx-for-Web `4efc6668…`, online Native `9184c738…`, and default
  Native `af128952…`.
- React Doctor did not produce a result for this refactor: both fresh `bunx`
  and cached CLI paths failed before scanning because their packaged
  `oxc-parser` / `oxlint-plugin-react-doctor` dependencies were unavailable.
  This is recorded as a tooling failure, not a green diagnostic scan.
- Current-head populated Archived proof closes the row branch that the prior
  empty-state screenshot could not cover. A temporary thread was created and
  archived through canonical commands; Web exposed both Restore and confirmed
  Delete while Lynx still exposed Restore only. Lynx now dispatches canonical
  `thread.delete` after the same host confirmation copy and shares one
  pending/error owner across both actions.
- The real populated row also exposed the remaining generic xs-button fork:
  Lynx rendered 25px / 12px controls while Web rendered 24px controls with
  10px/15px labels. The shared `LxButton--xs` owner now carries exact 24px
  height, 7px horizontal padding, 10px/15px copy, and 4px mixed-content gap.
  Archived's copy-to-actions gap converged from 16px to Web's 10px owner.
- Final Browser content anchors are exact for title, description, Restore,
  Delete, and the 8px action gap at `1280x820` DPR1. Exact-owned Native PID
  `71742`, PID-derived `localhost:8903/session 1`, bundle `f2982a11…`, and
  `2560x1576` capture retain the same row/action anatomy with an empty console.
  Native touch activation reached the real `dialogsConfirm` bridge with the
  complete permanent-delete warning; the hidden system dialog was not
  auto-confirmed because doing so would take over user focus.
- The canonical delete cleanup removed the temporary thread from shell/sidebar
  projections. SQLite, settings, Native KV, and window state returned to their
  original hashes. Evidence is under
  `shots/2026-08-06/archived-populated-current/`.
- Current-head populated Worktrees proof replaces the previous source-only row
  claim with a real reversible product path. An excluded disposable Git repo
  plus canonical `git.createWorktree` produced one managed worktree that
  `server.listWorktrees` returned to both clients; canonical
  `git.removeWorktree` later restored an empty inventory and removed it from
  disk.
- The populated row exposed three real owners: a fixed 160px action wrapper
  compressed path/copy content to 418px instead of Web's 540.109375px, the
  conversation label used a 16px rather than 18px line box, and the empty
  conversation branch skipped Web's 4px list rhythm. Actions now self-size,
  only the optional hint owns 160px, the row gap is 10px, and both empty and
  populated branches share one conversation-list wrapper.
- Final Web/Lynx-for-Web title, path, conversation label, empty copy, and
  24px Delete anchors are exact at `1280x820` DPR1. Exact-owned Native bundle
  `7b17b780…`, root PID `35940`, PID-derived `localhost:8903/session 1`, and
  `2560x1576` capture retain the same internal row geometry with an empty
  console. Evidence is under
  `shots/2026-08-06/worktrees-populated-current/`.
- Current-head populated Profile model usage was produced in a byte-cloned,
  disposable server home through one canonical thread creation and three
  canonical turn starts. The stats RPC returned a real 2:1 split:
  `gpt-5.6-sol` 66.7% and `gpt-5.5` 33.3%. The mutated server and Native
  clones were deleted after capture; the normal baseline hashes never changed.
- The retained natural `1440x900` cell keeps both model rows visible at
  `scrollTop=0`. Web/Lynx-for-Web model items are exact `336x30` columns with
  a 48px gap, 14px provider icons, 20px lines, 6px line/track rhythm, and
  `336x4` tracks. Exact-owned Native bundle `2b0aac94…`, root PID `5771`,
  PID-derived `localhost:8904/session 1`, and `2880x1736` frame retain the same
  geometry with an empty console. No product patch was required; evidence is
  under `shots/2026-08-06/profile-models-populated-current/`.
- Current-head Connected agents proof used a disposable server clone and
  canonical `server.createExternalMcpIntegration` to create one local,
  unpaired 30-day connection. No external agent process or network pairing was
  started; both clones were deleted after capture.
- The populated row exposed a real connection-specific fork: inherited form-row
  centering moved actions down 41px, a 20px gap reduced copy width by 10px, and
  date-only formatting changed content/wrapping. Connected rows now own
  top-alignment and a 10px gap while form rows retain their existing owner;
  local timestamps preserve full Web date/time identity.
- Final Browser copy/title/status/Resume/Revoke anchors are exact at
  `1440x900` DPR1. Exact-owned Native bundle `79f06c20…`, root PID `76008`,
  PID-derived `localhost:8904/session 1`, and `2880x1736` capture retain the
  622x136 row, top-aligned title/actions, and empty console. Evidence is under
  `shots/2026-08-06/integrations-connected-current/`.
- Current-head populated Profile plugin/agent proof used a disposable clone and
  canonical structured turn references. The stats RPC returned `$check-code`
  at 2 runs and `@reviewer-agent` at 1 run. The normal lifetime-stat baseline
  remained untouched.
- The real state exposed an icon-identity gap hidden by the empty snapshot:
  Lynx used `S` / `A` text while Web used exact central `building-blocks` and
  `agent` glyphs. Lynx now reuses those exact raw SVG assets in the existing
  20px muted shell with a 12px painted slot.
- Final Browser rows are exact `336x20` with 30px pitch, x=902 name origin,
  x=1208 count edge, and 14/20 typography. Exact-owned Native bundle
  `ff4f27e3…`, root PID `44793`, PID-derived `localhost:8903/session 1`, and
  `2880x1736` frame retain the same shell/glyph/name/count geometry with an
  empty console. Evidence is under
  `shots/2026-08-06/profile-plugins-populated-current/`.
- Current-head Usage probing found real local data that the product was
  suppressing whenever live provider fetches failed. Codex had a 96%-used
  limit plus 24h/7d/30d token history; Claude had three real token-history
  lines. The server now returns those archives as explicitly warned last-good
  data while preserving Cursor's real live failure.
- The populated comparison also closed the remaining display gaps: a
  10,080-minute archived window now normalizes to `Weekly`, warning copy is
  12/19.5, labels/values are 12/16, and metadata/subtitles are 11/16.5.
  Web/Lynx-for-Web warning, track, 4% fill, remaining metadata, and all three
  token rows align exactly.
- Exact-owned Native bundle `be3d2c08…`, root PID `70562`, PID-derived
  `localhost:8904/session 1`, and `2880x1736` capture retain the complete
  warning/meter/lines anatomy with an empty console. Evidence is under
  `shots/2026-08-06/usage-local-fallback-current/`.
- Current-head global-shell recheck no longer treats the 2026-08-04 P10 matrix
  as proof after the shared continuation changes. The first refreshed Landing
  pair exposed a real shared-header line-box residual: Web `New Chat` was
  `12/18/400` at `298/14/55.0625/18`, while Lynx inherited `normal` and rendered
  `298/15.5/55.0625/15`. `SharedChatHeaderIdentityTitle`, consumed by both
  Landing and Thread, now owns the explicit 18px line-height.
- Final current-head Web/Lynx-for-Web title geometry and typography are exact.
  The exact-owned Native bundle `0738aa52…`, root PID `28092`, descendant
  `28096`, PID-derived `localhost:8903/session 1`, and `2560x1576` capture
  resolve the title to `296/14/56/18` and `12/18/400`, with an empty Native
  warning/error console. Browser page errors are empty; the only Lynx-for-Web
  console warning is the named upstream initialization deprecation.
- The Web retained state was reached through the rendered `Open new chat home`
  keyboard path. Web represents that state with a client-only draft UUID while
  preserving semantic `new-chat`; SQLite/settings hashes remained unchanged.
  No hidden route state or fixture was injected. Evidence is under
  `shots/2026-08-06/landing-header-current/`.
- Current-head Pull Requests exposed several differences that the historical
  atlas had retained without blocking: title 600 versus Web 500, 24px versus
  28px route inset, 6px versus 8px pills, a 96px text project selector instead
  of Web's 24px exact `filter-2` icon trigger, and a font refresh glyph instead
  of the 16px SVG. Transparent primitive borders also consumed two pixels from
  both intended icon slots.
- The route/adapter owners now match the Web anatomy. Final Web/Lynx-for-Web
  anchors are exact for the title, active pill, 28px refresh trigger and 16px
  glyph, 24px project trigger and 16px glyph, empty title, and empty
  description. The Lynx search row remains an explicit unavailable-capability
  surface rather than a fake editable input.
- Exact-owned Native bundle `e0492c80…`, root PID `6801`, renderer `6804`,
  PID-derived `localhost:8904/session 1`, and `2560x1576` capture prove real
  touch navigation, `14/20/500` title typography, exact SVG nodes, complete
  filter accessibility naming/pressed state, and an empty warning/error
  console. Evidence is under `shots/2026-08-06/pull-requests-current/`.
- A disposable canonical project/thread state exposed an empty-Thread branch
  that the Landing proof could not cover. Web centered the heading, composer,
  and 58px project-context tray as one group; Lynx kept the old
  `ChatEmptyStateHero` and pinned its composer to the bottom at y=701.
- Empty Thread now reuses `CenteredEmptyLandingStack` and the shared Landing
  heading/composer owners. A project-copy width variant prevents the real
  project heading from wrapping. A real context tray consumes the thread
  project/envMode/branch snapshot and publishes an actual Temporary button
  with route-owned canonical delete-on-leave behavior; Local/branch remain honestly
  disabled where the runtime has no selector UI.
- Final Web/Lynx-for-Web anchors converge to quarter-pixel engine rounding:
  title exact, heading y 407.25/407, composer y 461.75/462, tray y 536.75/537,
  and Temporary y 560.75/561. Exact-owned Native bundle `ceeda1ce…`, root PID
  `7673`, renderer `7676`, PID-derived `localhost:8903/session 1`, and
  `2560x1576` capture prove the title/heading, full empty group, clean console,
  and real Temporary `false → true → false` touch interaction.
- The normal logical snapshot remained at two events, two projects, zero
  threads, and projector sequence 2. The external `sqlite3` audit checkpointed
  unchanged WAL pages into the main database file, changing its byte hash
  without changing logical data. No old byte backup survived, so the audit no
  longer claims byte-exact SQLite restoration for this run. Evidence and the
  caveat are under `shots/2026-08-06/thread-empty-current/`.
- Current-head project Kanban used a second disposable canonical project/task
  clone. The real board exposed column title/count line-box differences,
  oversized header padding, 8px versus Web 10px card radius, 600 versus 500
  card title weight, stale action/meta line boxes, margin-based card rhythm,
  and a missing 12px branch glyph.
- The shared Kanban column/card adapters now own Web's 32px header,
  13/19.5/500 title, 12/16 count, 10px card radius, 13/17.875/500 card title,
  6px root rhythm, 2px meta inset, 11/16.5 metadata, and generated branch icon.
  Final Browser columns/header/title/count are exact; the card differs only by
  0.125px engine rounding.
- Exact-owned Native bundle `69252f59…`, root PID `17557`, renderer `17562`,
  PID-derived `localhost:8903/session 1`, and `2560x1576` capture prove real
  Kanban→project touch navigation, 13/19.5/500 column typography, card title,
  branch SVG, metadata, and an empty warning/error console. Evidence is under
  `shots/2026-08-06/kanban-project-current/`.
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
- The current-head Command K recheck separated old atlas noise from real
  residuals. Input text was already 12px and row labels were already 14/20;
  the inherited 16px/normal container values were not text owners. The real
  differences were the panel's 12px top corners versus Web 14px and command
  rows' 8px radius versus Web 10px.
- The shared Lynx Command primitive now owns 14px panel corners and 10px item
  radius. `CommandItem` strips the shared Web-only `rounded-lg` utility while
  preserving all other call-site classes, preventing generated utility CSS
  from overriding the primitive. Final Lynx-for-Web computed styles are
  exactly 14px and 10px; both final browser frames are 1280x820 with empty
  error logs.
- Exact-owned Native bundle `3c73de57…`, root PID `78314`, PID-derived
  `localhost:8903/session 1`, and a real Search-control touch retained seven
  roles, the current row class without `rounded-lg`, a 2560x1576 frame, and an
  empty warning/error console. Native DevTool still returns 0px radius for
  compound `VIEW` nodes, so Native numeric radius is not claimed. Evidence is
  under `shots/2026-08-06/command-k-current/`.
- Focused Command/composition suites: 2 files, 10/10 tests; configured
  Lynx-for-Web and Native/Desktop production builds pass.
- The current-head Composer Extras recheck found two old-atlas residuals that
  the earlier functional/state matrix did not block: the rendered Lynx trigger
  was 32x28/radius 10 versus Web 28x28/radius 8, and the shared Lynx menu row
  radius was 6px versus Web 8px.
- The shared `LxMenuItem` primitive now owns the canonical 8px radius for
  ordinary items, checkbox/radio items, and submenu triggers. Extras uses a
  named 28x28 host plus a separate 28x28 button chrome owner; this separation
  prevents host padding from moving the button or its centered 16px icon.
- Final Lynx-for-Web computes a 28x28/radius-8 trigger and radius-8 Add files,
  Plan, and Fast rows. Both final browser frames are 1280x820 with empty error
  logs. The previously registered 142x108 versus 141.421875x106 popup
  engine/separator rhythm remains explicit rather than hidden with a local
  height override.
- Exact-owned Native bundle `5e05f8af…`, root PID `45645`, PID-derived
  `localhost:8903/session 1`, and a real Extras-trigger touch retain both host
  and button at 28x28, a centered 16x16 icon, eight roles, a 2560x1576 frame,
  and an empty warning/error console. Native compound `VIEW` radius is not
  claimed because this DevTool returns 0px. Evidence is under
  `shots/2026-08-06/extras-current/`.
- Focused Menu/Extras suites: 2 files, 11/11 tests; configured Lynx-for-Web
  and Native/Desktop production builds pass.
- The Command K follow-up closed the remaining outer-shell radius that the
  prior panel/item slice had not changed: Web outer dialog 18px versus Lynx
  16px. The Command contract now locks outer/panel/item radii at 18/14/10.
- Configured Lynx-for-Web computes exactly 18px, 14px top corners, and 10px
  after a real Search click. Exact-owned Native bundle `1579d964…`, root PID
  `65639`, PID-derived `localhost:8903/session 1`, and a real Search touch
  retained four roles, a 2560x1576 frame, and an empty warning/error console.
  Evidence is under `shots/2026-08-06/command-k-outer-current/`.
- Focused Command suite: 1 file, 9/9 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- The final Command shell audit found the footer still hardcoded to 15px while
  Web derives `calc(var(--radius-2xl) - 1px)` = 17px from the current 10px
  base radius. `.LxCommandFooter` now owns 17px bottom corners and the focused
  contract locks both sides.
- Current Web and Lynx-for-Web footer anatomy is exact at 574x41, 12px/20px
  padding, and `0 0 17px 17px`, with 1280x820 frames and empty errors.
  Exact-owned Native bundle `d1544c34…`, root PID `89672`, PID-derived
  `localhost:8903/session 1`, and a real Search touch retained popup/footer,
  a 2560x1576 frame, and an empty warning/error console. Evidence is under
  `shots/2026-08-06/command-k-footer-current/`.
- Focused Command suite: 1 file, 9/9 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- The Command material audit found two paint layers omitted from prior
  geometry-only closure: Web outer `shadow-lg/5` and inner `shadow-xs/5`
  versus no Lynx shadow. The Lynx outer now owns matching 5% dual soft-lift
  layers and the inner panel owns the matching 5% 0/1/2 hairline lift.
- Current Web and Lynx-for-Web computed shadows match semantically; Web's
  extra entries are transparent utility rings. Exact-owned Native bundle
  `5238d1cc…`, root PID `17696`, PID-derived `localhost:8904/session 1`, and
  real Search touch retained popup/panel, a 2560x1576 frame, and an empty
  console. A failed guessed-8903 attempt was deleted. Evidence is under
  `shots/2026-08-06/command-k-shadow-current/`.
- Focused Command suite: 1 file, 9/9 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- The Extras material follow-up aligned the main and Fast submenu chrome with
  the canonical composer picker recipe: 10.4px radius, Light 7% `0 4 18 -6`
  shadow, and Dark 30% `0 6 24 -10` shadow. The opaque Native semantic fill is
  retained because Web translucency requires unsupported backdrop filtering.
- Current Web main/sub popups are 141.421875x106 and 128x62; Lynx-for-Web is
  142x108 and 128x64. Both clients compute the same radius/shadow; the existing
  two-pixel engine rhythm remains registered rather than forced away.
- Exact-owned Native bundle `37188e48…`, root PID `39774`, PID-derived
  `localhost:8903/session 1`, and real Extras→Fast touches retained main/sub
  roles, a 2560x1576 frame, and an empty warning/error console. Evidence is
  under `shots/2026-08-06/extras-popup-chrome-current/`.
- Focused Menu/Extras suites: 2 files, 11/11 tests; configured Lynx-for-Web
  and Native/Desktop production builds pass.
- The broader composer picker audit removed split material ownership. Web
  Model, Traits, Runtime, and Extras all consume one canonical 10.4px /
  Light-7% / Dark-30% picker chrome; Lynx Model previously used a private 16%
  heavy shadow while Traits/Runtime inherited generic 10px/no-shadow chrome.
- One Lynx selector now owns canonical chrome for Model, Traits, Runtime,
  Extras, and the Fast submenu. Current Web and Lynx-for-Web Model/Traits
  popups compute the same radius/shadow; content dimensions retain their
  existing catalog/layout differences.
- Exact-owned Native bundle `3d6a37e6…`, root PID `78889`, PID-derived
  `localhost:8904/session 1`, and a real Model-trigger touch retained popup/row,
  a 2560x1576 frame, and an empty warning/error console. Evidence is under
  `shots/2026-08-06/composer-picker-chrome-current/`.
- Focused invocation resolved to 2 existing files / 11 tests; configured
  Lynx-for-Web and Native/Desktop production builds pass.
- Composer picker option anatomy now uses the same role radii as Web:
  provider/trait/model rows 8px, model group header/favourite control 10.4px.
  Skeleton capsules retain 7px and were not treated as interactive rows.
- Current Web provider/trait rows compute 8px; current Lynx-for-Web provider,
  model, and trait rows also compute 8px. The current Claude model list had no
  collapsible group/favourite, so those 10.4px values remain source/test rather
  than runtime claims.
- Exact-owned Native bundle `506762d9…`, root PID `5242`, PID-derived
  `localhost:8903/session 1`, and a real Model-trigger touch retained
  popup/provider roles, a 2560x1576 frame, and an empty console. Evidence is
  under `shots/2026-08-06/composer-picker-rows-current/`.
- Focused Menu/Extras invocation: 2 files, 11/11 tests; configured
  Lynx-for-Web and Native/Desktop production builds pass.
- The composer Fast control now matches Web's 20x20/radius-8 geometry and
  stable `Fast mode` accessibility label instead of the old 22x22/radius-6
  dynamic Enable/Disable identity. Native keeps its 14px glyph adaptation.
- Current Web and Lynx-for-Web controls are both 20x20/radius 8. Exact-owned
  Native bundle `f9a8fb55…`, root PID `35730`, PID-derived
  `localhost:8904/session 1`, and real Traits/Fast touches prove
  false→true→false with restored explicit `aria-pressed=false`, a 2560x1576
  frame, and empty console. Evidence is under
  `shots/2026-08-06/composer-fast-toggle-current/`.
- Focused composer/menu invocation: 3 files, 12/12 tests; configured
  Lynx-for-Web and Native/Desktop production builds pass.
- Command K group labels now explicitly match current Web at 12px/16px/500
  instead of relying on the old 15px Native visual line box. A source-only
  18px hypothesis was rejected by current rendered Web evidence before commit.
- Current Web and Lynx-for-Web Suggested labels both use 12/16/500 and a 22px
  outer box. Exact-owned Native bundle `fd7618f8…`, root PID `90786`,
  PID-derived `localhost:8904/session 1`, and a real Search touch retained
  label/parent roles, a 2560x1576 frame, and empty console. Evidence is under
  `shots/2026-08-06/command-k-label-current/`.
- Focused Command suite: 1 file, 9/9 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Shared Command keyboard pills now match Web's 20x20/radius-4 shell and
  12px/16px/500 typography instead of the old Lynx 11px implicit line box.
- Current Web shared-Kbd and Lynx-for-Web Command-K samples resolve to the
  same geometry/type identity. Exact-owned Native bundle `1e73100b…`, root PID
  `14037`, PID-derived `localhost:8905/session 1`, and a real Search touch
  retained Kbd/text roles, a 2560x1576 frame, and empty console. Evidence is
  under `shots/2026-08-06/command-k-kbd-current/`.
- Focused Command suite: 1 file, 9/9 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Command footer copy now explicitly matches Web's 12px/16px typography
  instead of relying on an implicit Lynx line box.
- Current Web and Lynx-for-Web left/right footer texts have identical widths,
  16px heights, and typography. Exact-owned Native bundle `4dbeaf81…`, root
  PID `34264`, PID-derived `localhost:8904/session 1`, and a real Search touch
  retained the footer, a 2560x1576 frame, and empty console. Evidence is under
  `shots/2026-08-06/command-k-footer-text-current/`.
- Focused Command suite: 1 file, 9/9 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Command search input now explicitly matches Web's 12px/18px typography
  instead of relying on an implicit Lynx textarea line height.
- Current Web and Lynx-for-Web input nodes both compute to 12/18. Exact-owned
  Native bundle `6657bf09…`, root PID `52798`, PID-derived
  `localhost:8904/session 1`, and a real Search touch retained input/textarea
  roles, a 2560x1576 frame, and empty console. Evidence is under
  `shots/2026-08-06/command-k-input-current/`.
- Focused Command suite: 1 file, 9/9 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Composer Traits section labels now match the current Web group-label
  contract at 12px/16px/400, 45%-muted tone, 6px/8px padding, and a 28px row
  instead of the old Lynx 10px/600 label in a 24px custom header. The existing
  20px Fast toggle now mirrors Web's negative block margin so it does not
  inflate the row to 32px.
- Source tracing rejected the initial shared `.LxMenuGroupLabel` hypothesis:
  the canonical composer Model and Traits paths use dedicated Lynx adapters.
  The current Claude model submenu has no rendered group label, so no
  source-only Model or shared-menu typography change was made.
- Current Web and Lynx-for-Web were opened through the rendered Traits control
  and retained 1280x820 screenshots with empty error logs. Exact-owned Native
  bundle `7743069c…`, root PID `12130`, PID-derived
  `localhost:8904/session 1`, and a real touch retained popup/header/label/
  toggle roles. Native measured the header at 240x28, label at 12/16/400 with
  opacity 0.45, toggle at 20x20, raw frame at 2560x1576, and console 0.
  Evidence is under `shots/2026-08-06/composer-trait-label-current/`.
- Focused trait-picker suite: 1 file, 2/2 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Composer Extras labels now explicitly match Web's 12px/18px/400 menu-row
  typography instead of relying on Lynx's 15px visual `normal` line box. The
  fix stays on the dedicated child `text` owner; inherited 16px values on the
  label wrapper remain correctly classified as container noise.
- Current Web and Lynx-for-Web opened Extras through the rendered trigger and
  retained 1280x820 screenshots with empty error logs. The rebuilt Lynx labels
  all resolve to 12/18/400 while the existing 26px main-row geometry remains
  unchanged.
- Exact-owned Native bundle `d90f71a3…`, root PID `42725`, PID-derived
  `localhost:8904/session 1`, and a real Extras touch retained popup/label/row
  roles. Direct child-TEXT probes measured all three labels at 12px/18px with
  18px boxes; DevTool serializes CSS weight 400 as the equivalent `normal`.
  The raw frame is 2560x1576 and the warning/error console is empty. Evidence
  is under `shots/2026-08-06/composer-extras-label-current/`.
- Focused Extras suite: 1 file, 3/3 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Composer Traits option labels now explicitly match Web's 12px/18px/400
  picker-row typography instead of relying on Lynx's 15px visual `normal`
  line box. The existing 34px Native row remains unchanged; it is the retained
  touch-target/layout contract rather than an anonymous typography offset.
- Current Web and Lynx-for-Web opened Traits through the rendered trigger.
  All four labels resolve to 12/18/400; Web rows remain 26px and Lynx rows
  remain 34px. Both retained screenshots are 1280x820 and both browser error
  logs are empty.
- Exact-owned Native bundle `7577d5c8…`, root PID `87825`, PID-derived
  `localhost:8905/session 1`, and a state-idempotent real Traits touch retained
  popup/row/label roles. Native measured the first label at 12px/18px with an
  18px box and serializes CSS weight 400 as equivalent `normal`; the row is
  240x34, raw frame 2560x1576, and warning/error console empty. Evidence is
  under `shots/2026-08-06/composer-trait-option-text-current/`.
- Focused trait-picker suite: 1 file, 2/2 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Composer provider rows now separate popup typography from the compact footer
  trigger that shares the same composition. Provider names use 12px/18px,
  statuses use 11px/18px at 80% muted tone and align to the trailing inset,
  while the footer model label remains 11px with its prior compact line box.
- Disabled provider rows no longer render the composition's unconditional
  chevron; enabled providers retain a right-aligned chevron. Current Web and
  Lynx-for-Web both place status/chevron at the trailing inset, while the Lynx
  32px row remains its existing Native touch-target contract versus Web's
  26px row.
- Exact-owned Native bundle `a6a735b5…`, root PID `28434`, PID-derived
  `localhost:8905/session 1`, and a real Model touch retained popup/disabled
  row/status roles. Native measured the disabled row at 248x32 and status at
  11px/18px, opacity 0.8, with an 18px box; raw frame is 2560x1576 and console
  empty. Native DOM proves disabled and enabled provider composition/chevron
  structure; scoped provider-name and right-edge numeric closure comes from
  current Lynx-for-Web plus source/test, not an ambiguous generic Native role.
  Evidence is under `shots/2026-08-06/composer-provider-row-current/`.
- Focused picker contract: 1 file, 3/3 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Composer Claude model rows now match Web's 12px/18px/400 model-name
  typography instead of the old Lynx 11px `normal` line box with a 13px
  visual height. The existing Web 26px and Lynx 30px row heights remain their
  respective layout/touch-target contracts.
- Current Web and Lynx-for-Web entered the Claude model list through rendered
  Model and Claude controls. All eight model names resolve to 12/18/400; both
  retained screenshots are 1280x820 and browser error logs are empty.
- Exact-owned Native bundle `7514d567…`, root PID `51936`, PID-derived
  `localhost:8905/session 1`, and real Model→Claude touches retained popup,
  model row, and name roles. Native measured the name at 12px/18px with an
  18px box and the row at 248x30; raw frame is 2560x1576 and console empty.
  The current Claude catalog has no rendered cost multiplier, favourite, or
  collapsible group header, so those owners were not changed from source-only
  inference. Evidence is under
  `shots/2026-08-06/composer-model-row-text-current/`.
- Focused picker contract: 1 file, 3/3 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Shared Lynx menu-item text now explicitly matches the Web option contract at
  12px/18px/400 instead of the old 12px `normal` line box with a 15px visual
  height. Shared vertical padding changed from 7px to 6px so the existing 32px
  Native row contract remains unchanged after the line-height correction.
- Current Web and a fresh Lynx-for-Web session entered General Settings and
  opened Default thread mode through rendered controls. Web Select options and
  Lynx MenuRadioItem text both resolve to 12/18/400; Lynx rows remain 32px.
  Both retained screenshots are 1280x820 and browser errors empty.
- An older reused Lynx-for-Web session blanked its root after Settings
  navigation; that run was rejected as harness state pollution and produced no
  retained evidence. The same path passed in a fresh named session.
- Exact-owned Native bundle `cebcd55d…`, root PID `96008`, PID-derived
  `localhost:8904/session 1`, and real Sidebar Settings→thread-mode touches
  retained popup/row/text roles. Native measured text at 12px/18px with an
  18px box and row at 206x32; raw frame is 2560x1576 and console empty.
  Evidence is under `shots/2026-08-06/settings-shared-menu-text-current/`.
- Focused Menu suite: 1 file, 9/9 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Composer footer Model and Traits labels now explicitly match Web's
  11px/16.5px/400 trigger typography instead of the old Lynx 11px `normal`
  line box with a 13px visual height. The existing 28px trigger geometry is
  unchanged.
- Current Web and Lynx-for-Web landing controls resolve both labels to
  11/16.5/400; both retained screenshots are 1280x820 and browser errors
  empty.
- Exact-owned Native bundle `ca441805…`, root PID `21351`, PID-derived
  `localhost:8904/session 1`, retained both trigger and label roles. Native
  measured both triggers at 28px high and both labels at 11px/16.5px; native
  box geometry rounds the fractional line box to 17px. Raw frame is
  2560x1576 and console empty. Evidence is under
  `shots/2026-08-06/composer-footer-trigger-text-current/`.
- Focused picker contract: 1 file, 3/3 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Composer Runtime permission trigger now matches Web's full-access identity:
  118.15625x28 transparent-border chrome, 14px leading permission affordance,
  11px/16.5px/400 label, 12px trailing chevron, 6px internal gaps, and the
  light `#e25505` / dark `#fe8549` semantic accent.
- Lynx uses an explicit 14px diamond permission glyph as the named Native
  adaptation rather than pretending to render Web's central shield icon.
  Label, glyph, and chevron share the semantic accent and the trigger keeps its
  existing accessibility label.
- The first Native implementation used the Button `render` seam and produced
  five `cloneElement from compiled snapshot with children is not supported`
  warnings. That evidence was rejected. The final implementation uses a plain
  inner view owned by MenuTrigger, removes Button/render entirely, and the
  replacement Native capture has zero warning/error console messages.
- Current Web and Lynx-for-Web trigger geometry is exact at 118.15625x28;
  label typography and light accent are exact. Exact-owned Native bundle
  `98241786…`, root PID `85026`, PID-derived `localhost:8904/session 1`,
  retained trigger/glyph/label/chevron at 118x28, 14x14, 11px/16.5px, and
  12x12 respectively; raw frame is 2560x1576 and console empty. Evidence is
  under `shots/2026-08-06/composer-runtime-trigger-current/`.
- Focused picker contract: 1 file, 3/3 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Composer disabled Send action now matches Web's 28x28 circular primary
  control with a transparent 1px border, opacity 0.2, and the real 20x20
  central `arrow-up` asset instead of a 17px bold text-arrow adaptation at
  opacity 0.42.
- The raw central icon is theme-colored with the active surface, preserving
  contrast for custom themes. Current Web and Lynx-for-Web controls match on
  size, fill, disabled opacity, and 20x20 icon geometry; both PNGs are
  1280x820 and browser errors empty.
- Exact-owned Native bundle `edc24d25…`, root PID `13040`, PID-derived
  `localhost:8904/session 1`, retained disabled button/icon roles. Native
  measured button 28x28 at opacity 0.2 and icon 20x20 with white arrow strokes;
  raw frame is 2560x1576 and console empty. Compound Native VIEW radius/border
  remains subject to the known DevTool zero-value boundary, so numeric circle
  and transparent-border closure comes from source/test plus current
  Lynx-for-Web. Evidence is under
  `shots/2026-08-06/composer-send-action-current/`.
- Focused picker contract: 1 file, 3/3 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Composer Voice action now matches Web's common 28x28, radius-8,
  transparent-border chrome and real 16x16 central microphone anatomy instead
  of the old 32x28 button with a Web-mask span that visibly shrank to 14x16.
- Voice remains honestly unavailable in Lynx: the control is a disabled,
  non-interactive plain view with explicit unavailable labeling and opacity 0.48,
  rather than copying Web's enabled opacity or inventing recording behavior.
  The microphone raw SVG uses the active theme's muted foreground.
- The first raw-SVG implementation still used Button's `render` seam and
  produced three Native cloneElement warnings. That evidence was rejected.
  The final disabled view removes Button/render entirely and the replacement
  Native capture has an empty warning/error console.
- Current Web and Lynx-for-Web common anatomy matches at 28x28 and 16x16;
  both PNGs are 1280x820 and browser errors empty. Exact-owned Native bundle
  `a74ea9c5…`, root PID `4998`, PID-derived `localhost:8904/session 1`,
  retained disabled/no-handler button and microphone roles at 28x28 and
  16x16; raw frame is 2560x1576 and console empty. Evidence is under
  `shots/2026-08-06/composer-voice-action-current/`.
- React Doctor's changed-scope scan initially flagged the explicit ReactLynx
  `focusable` property under its Web DOM rule. The plain view has no event
  handlers and is non-focusable by default, so the redundant property was
  removed; the repeat changed-scope scan reports zero issues.
- Focused picker contract: 1 file, 3/3 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Composer footer action spacing now matches Web's `gap-2` contract at 8px
  instead of the old Lynx 6px. With the corrected 28px Voice control, both
  clients place Voice at x=1063 and Send at x=1099 for an exact 8px gap.
- Current Web and Lynx-for-Web action groups both resolve `gap: 8px`, Voice and
  Send remain 28x28, and retained PNGs are 1280x820 with empty browser errors.
- Exact-owned Native bundle `324d1c1d…`, root PID `51059`, PID-derived
  `localhost:8902/session 1`, retained actions/Voice/Send roles. Native measured
  Voice x=1063, Send x=1099, both 28x28, for an exact 8px gap; raw frame is
  2560x1576 and console empty. The endpoint was resolved from the owned PID
  rather than a remembered port. Evidence is under
  `shots/2026-08-06/composer-footer-action-gap-current/`.
- Focused picker contract: 1 file, 3/3 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Composer Model and Traits footer triggers now match Web's chrome and internal
  anatomy: radius 10, transparent 1px border, real 12x12 chevrons at opacity
  0.6, Model padding 6px with 6px inner gaps, Traits padding 10px with an 8px
  label/chevron gap, and an 8px gap between the two triggers.
- Current Web and Lynx-for-Web geometry is exact: Model
  `868.09375/95.15625x28`, Traits `971.25/83.75x28`, and inter-trigger gap 8px.
  Enabled provider-row chevrons remain 12px and trailing-aligned while disabled
  provider chevrons remain hidden; no provider picker regression was introduced.
- Exact-owned Native bundle `35c2fc2c…`, retained Model/Traits and both
  chevrons with rounded trigger geometry 96x28 and 84x28, 12x12 chevrons,
  complete menu-trigger accessibility/bindings, a 2560x1576 frame, and empty
  console. Numeric radius/border remains sourced from current Lynx-for-Web plus
  source/test because compound Native VIEW values are zero in this DevTool.
  Evidence is under
  `shots/2026-08-06/composer-picker-trigger-chrome-current/`.
- Focused picker contract: 1 file, 3/3 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Shared sidebar primary-action labels now match Web at 12px/18px/400 and 89%
  foreground tone instead of the old Lynx 12px/18px/500 full-tone text.
- Current New thread, Search, and Settings labels all have exact Web text
  widths after the weight correction; both retained PNGs are 1280x820 and
  browser errors empty. Existing sidebar row y/width differences remain the
  previously registered shell/separator geometry boundary, not a text-owner
  residual.
- Exact-owned Native bundle `be598d2b…`, root PID captured through
  `localhost:8904/session 1`, retained an interactive Settings row and shared
  label role. Native measured the label at 12px/18px/400, opacity 0.89, with an
  18px box; the row retained complete accessibility/keyboard/touch bindings,
  raw frame 2560x1576, and empty console. Evidence is under
  `shots/2026-08-06/sidebar-primary-action-label-current/`.
- Focused landing fidelity suite: 1 file, 2/2 tests; configured Lynx-for-Web
  and Native/Desktop production builds pass.
- Shared sidebar primary-action leading icons now match Web's 15x15 optical
  size and tone: New thread/Search use 89% inherited tone, while Settings uses
  the footer's 95% tone. All three retain an 8.5px left inset inside 16px
  leading shells.
- Settings now renders the generated 15px Settings SVG instead of a 16x19 text
  `⚙` at muted 60% tone. Current Web and Lynx-for-Web icon geometry/insets are
  exact; both PNGs are 1280x820 and browser errors empty.
- Exact-owned Native bundle `927d8c91…`, PID-derived
  `localhost:8904/session 1`, retained the footer leading shell at 16x16,
  opacity 0.95, and generated Settings icon at 15x15 with theme foreground
  SVG content; raw frame is 2560x1576 and console empty. New thread/Search
  numeric closure is provided by all-three current browser measurements plus
  the shared owner/source contract; Native DOM retains the repeated leading
  structures without an ambiguous same-class numeric claim. Evidence is under
  `shots/2026-08-06/sidebar-primary-action-icon-current/`.
- Focused landing fidelity suite: 1 file, 2/2 tests; configured Lynx-for-Web
  and Native/Desktop production builds pass.
- Sidebar New thread and Search trailing shortcuts now use the same segmented
  keyboard anatomy as Web. New thread was previously omitted in Lynx and
  Search was a joined 10px `⌘K` text node; both now project from the shared
  Lynx shortcut-label source into separate key nodes.
- Current Web and Lynx-for-Web measurements are exact for both actions:
  44x20 group, two 20x20 keys, 4px gap, 8px row-right inset, 12px/16px/500
  typography, 4px radius, and matching light muted tokens. Both retained
  browser frames are 1280x820 and browser error logs are empty.
- Exact-owned Native bundle `3ad25303…`, PID-derived
  `localhost:8902/session 1`, retained both 44x20 groups and all four 20x20
  key nodes. Native resolves the keys to 12px/16px/500 and reports every
  corner radius as 4px; the raw frame is 2560x1576 and warning/error console
  empty. Evidence is under
  `shots/2026-08-06/sidebar-primary-shortcut-current/`.
- Focused shortcut suite: 1 file, 2/2 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass.
- Sidebar shortcut reveal now matches Web's interaction hierarchy: both
  shortcuts are opacity 0 by default and reveal on the shared row hover/focus
  states through the exact 150ms cubic-bezier opacity transition.
- The first Browser verification rejected a proxy-only result: CSS hid the
  shortcut, but real Lynx-for-Web pointer hover did not publish `ui-hover`.
  A Web-host-only bridge now maps Lynx focusability to real Web tab stops and
  real pointer/focus events to the existing Lynx interaction classes while
  preserving tab stops and classes owned by the runtime/product.
- Final real Lynx-for-Web pointer evidence proves 0 -> 1 -> 0 opacity across
  default, New thread hover, and pointer leave. Real Tab traversal also reaches
  New thread, publishes `ui-focus` / `:focus-visible`, and reveals the keys;
  retained frames are 1280x820 and browser errors are empty. Exact-owned Native
  bundle `74464b6d…`,
  PID-derived `localhost:8904/session 1`, resolves the default shortcut to
  opacity 0 with the exact 150ms transition, raw 2560x1576, and empty
  warning/error console. Native hover is explicitly not claimed.
- Focused reveal suites: 2 files, 6/6 tests; configured Lynx-for-Web and
  Native/Desktop production builds pass. Evidence is under
  `shots/2026-08-06/sidebar-primary-shortcut-reveal-current/`.
- Sidebar primary-action keyboard focus now matches Web's one-pixel inset-ring
  ownership. The previous outer Lynx shadow plus browser `outline: auto` became
  visible once the real Web tab-stop path was enabled; the shared focus owner
  now suppresses the default outline and uses the exact inset ring.
- Real Web and Lynx-for-Web focus-visible evidence resolves to one-pixel inset
  shadows with no painted outline; both frames are 1280x820 and error logs are
  empty. Exact-owned Native bundle `b7fb1f36…` contains the encoded inset-ring
  rule, ran with an empty warning/error console, and produced a 2560x1576 raw
  frame. Native focused-row visuals are explicitly not claimed because the
  target exposes no supported retained focus command. Evidence is under
  `shots/2026-08-06/sidebar-primary-focus-ring-current/`.
- Sidebar primary-action pressed feedback now preserves Web's active-token
  semantics without dimming the whole row. The old Lynx state reused the hover
  surface and applied opacity 0.8; the shared owner now uses
  `sidebar-accent-active` / `sidebar-accent-foreground` at opacity 1.
- Real Web and Lynx-for-Web pointer-down/release evidence proves matching
  opacity and state lifecycle; both pressed frames are 1280x820 and browser
  errors are empty. Exact-owned Native bundle `db6de088…` contains the active
  markers and ran with an empty warning/error console. Its non-raised window
  emitted no screencast frame, so Native pressed visuals are explicitly not
  claimed. Evidence is under
  `shots/2026-08-06/sidebar-primary-pressed-current/`.
- Sidebar primary-navigation to Projects rhythm now matches Web's exact 16px
  visual pitch. Lynx previously accumulated 20px through 9px bottom padding
  plus an extra one-pixel divider; the group now uses the Web 6px tail and no
  divider while preserving its existing external margin ownership.
- Current Web and Lynx-for-Web both measure 16px from Automations bottom to
  Projects top; their internal margin-box split differs but the visible pitch
  is exact. Both frames are 1280x820 with empty error logs. Exact-owned Native
  bundle `87db0d92…`, PID-derived `localhost:8904/session 1`, retained a
  2560x1576 raw frame and empty warning/error console. Evidence is under
  `shots/2026-08-06/sidebar-primary-section-rhythm-current/`.
- Sidebar list section labels now use the same shared Web identity as Settings
  section labels: 12px/18px/400 at muted/58. Projects previously rendered in
  Lynx at 10px/implicit/600 with full muted tone.
- Current Web and Lynx-for-Web Projects text boxes are both 46.28125x18 with
  exact typography; both frames are 1280x820 and error logs are empty.
  Exact-owned Native bundle `968dc10d…`, PID-derived
  `localhost:8904/session 1`, directly measures the TEXT at 12px/18px/400,
  opacity 0.58, and an 18px box; raw frame is 2560x1576 and console empty.
  Evidence is under
  `shots/2026-08-06/sidebar-section-header-typography-current/`.
- Sidebar segmented picker active surface no longer collapses to a two-pixel
  sliver in Lynx. Shared geometry now emits flat percent-plus-pixel expressions
  instead of nested/multiplied `calc()` values that the Lynx CSS parser dropped.
- Web Projects/Studio thumbs remain 121px wide; Lynx-for-Web now resolves both
  edges to 121.5px with exact `50%` / `-6px` placement and matching outer-label
  translation. Exact-owned Native bundle `2598ef81…`, PID-derived
  `localhost:8902/session 1`, directly measures a 122px thumb border box rather
  than the previous 2px sliver; raw frame is 2560x1576 and console empty.
  Evidence is under `shots/2026-08-06/sidebar-segmented-thumb-current/`.
- The same audit initially found that Lynx did not project the Web Projects
  Sort/Add toolbar. The Add and Sort workflow closures below now supersede that
  intermediate gap disposition.
- Sidebar segmented material now follows Web's recessed 10px track / raised
  8px thumb hierarchy with theme-safe borders and matching light/dark shadow
  strengths. An intermediate border patch shrank the control; final Lynx
  compensation restores the light Browser geometry to exact 232px track and
  121x28 thumb dimensions.
- Current Web dark and Lynx-for-Web light each retain valid theme-specific
  material evidence rather than being treated as a pixel pair. Exact-owned
  Native bundle `3375ae3d…`, PID-derived `localhost:8902/session 1`, resolves
  the dark track/thumb fills and shadows to the Web dark contract, with a
  2560x1576 raw frame and empty console. Numeric Native border/radius remains
  outside the compound VIEW DevTool boundary. Evidence is under
  `shots/2026-08-06/sidebar-segmented-chrome-current/`.
- Projects header now exposes a real Add project action in Lynx rather than an
  absent toolbar. It uses the exact Web 20x20/14x14/6px `plus-medium` anatomy,
  default-hidden hover/focus reveal, complete accessibility/input bindings,
  and the existing filesystem browser plus canonical project command path.
- Real Lynx-for-Web pointer hover and Tab traversal reveal/focus the hidden
  action. Current Web authority confirms the same action geometry and reveal
  hierarchy; Browser logs are empty.
- Exact-owned Native bundle `9186a8a8…`, PID-derived
  `localhost:8904/session 1`, retains the 20x20 action and complete
  mouse/touch/key/focus bindings. Supported Native touch emulation opens the
  production project-path dialog with `default-value="~/"`; the 2560x1576 raw
  open frame and warning/error console are clean.
  No project-create command was submitted during evidence collection. Evidence
  is under `shots/2026-08-06/sidebar-project-add-current/`.
- Projects Sort was retained as a separate shared-controller gap after the Add
  slice, then closed by the canonical storage/menu workflow below.
- Sidebar segmented button/label vertical metrics now match Web exactly:
  27.25px track, 21.25px buttons, 2px label insets, and
  11.5px/17.25px/500 typography. Projects and Studio retain their exact +4px /
  -4px active-edge translations.
- Healthy Web and Lynx-for-Web frames are 1280x820 with clean error logs.
  Exact-owned Native bundle `41109f78…`, PID-derived
  `localhost:8904/session 1`, directly measures the active button at
  113x21.25 and computes the label at 11.5px/17.25px/500 with an empty
  warning/error console. Its non-raised screenshot timed out and is explicitly
  not claimed. Evidence is under
  `shots/2026-08-06/sidebar-segmented-label-current/`.
- Sidebar segmented keyboard focus no longer changes layout or paints a double
  ring. Lynx previously added a one-pixel border on top of the platform
  outline, widening the 113px segment to 114px; platform outline ownership now
  matches Web and preserves the exact 113x21.25 geometry.
- Real Web and Lynx-for-Web focus-visible frames are 1280x820 with empty error
  logs. Exact-owned Native bundle `d4ab19a7…`, PID-derived
  `localhost:8902/session 1`, retains the 113x21.25 zero-border/no-shadow base
  button and an empty console. Native focused visuals are not claimed.
  Evidence is under `shots/2026-08-06/sidebar-segmented-focus-current/`.
- Sidebar segmented pressed feedback no longer paints a separate accent block
  over the selected material. Web keeps pressed segments transparent at
  opacity 1; Lynx now does the same while preserving `ui-pressed` lifecycle and
  real Studio activation.
- Retained Web/Lynx-for-Web frames are 1280x820 with empty error logs.
  Exact-owned Native bundle `cb21675c…`, PID-derived
  `localhost:8902/session 1`, runs with an empty warning/error console.
  Native transient pressed visuals are not claimed. Evidence is under
  `shots/2026-08-06/sidebar-segmented-pressed-current/`.
- Projects Sort is now a real Lynx workflow rather than the remaining inert
  gap. It reads/writes the canonical app-settings projection, feeds the shared
  project/thread sorter, and exposes the same two radio groups/five choices as
  Web.
- Canonical projection tests pass 6/6 and Lynx sorting/action suites pass
  15/15. Exact-owned Native bundle `faec6515…`, PID-derived
  `localhost:8901/session 1`, opened the real menu, selected Date added,
  persisted `created_at`, showed its checked indicator, then restored Manual
  while preserving thread sort and unrelated settings. Native frame is
  2560x1576 and console empty. Evidence is under
  `shots/2026-08-07/sidebar-project-sort-current/`.
- Sidebar primary active rows now use Web's active surface/foreground token
  ownership rather than the ordinary hover accent. Current themes resolve the
  two surfaces to the same numeric background, so no artificial color delta is
  claimed.
- Fresh Lynx-for-Web Search activation and exact-owned Native touch both retain
  the real active class at opacity 1. Native bundle `87d0b64b…`, PID-derived
  `localhost:8901/session 1`, resolves the dark active surface/foreground,
  produces a 2560x1576 frame, and has an empty console. Evidence is under
  `shots/2026-08-07/sidebar-primary-active-current/`.
- Projects Sort/Add icons now follow Web's currentColor hierarchy instead of
  embedding muted stroke permanently. Theme-safe muted/foreground SVG layers
  swap on hover, focus, and pressed states.
- Fresh Lynx-for-Web hover/focus evidence and exact-owned Native pressed
  evidence prove muted opacity 1→0 and foreground opacity 0→1 with clean
  consoles. Native bundle `3de82b29…` was PID-derived at
  `localhost:8901/session 1`. Evidence is under
  `shots/2026-08-07/sidebar-project-action-tone-current/`.
- Projects Sort no longer inherits generic MenuTrigger whole-control dimming.
  Web keeps sidebar icon buttons at opacity 1; scoped Lynx hover/pressed states
  now do the same while preserving surface/icon feedback.
- Fresh Lynx-for-Web and exact-owned Native pressed evidence resolve opacity 1
  with clean logs. Native bundle `7cf49c8d…` was PID-derived at
  `localhost:8901/session 1`. Evidence is under
  `shots/2026-08-07/sidebar-project-action-opacity-current/`.
- Sidebar footer now matches Web's uniform 8px frame, divider-free material,
  zero item margin, 28px Settings row, and 8px viewport bottom inset. The only
  width delta is the registered one-pixel Lynx sidebar separator.
- Lynx-for-Web and exact-owned Native evidence confirm the final frame with
  clean logs. Native bundle `f861bbe0…` was PID-derived at
  `localhost:8901/session 1` and produced a 2560x1576 raw frame. Fresh Web
  frames with provider socket errors were rejected; Web geometry remains
  current-head source/owner authority. Evidence is under
  `shots/2026-08-07/sidebar-footer-frame-current/`.
- Sidebar primary navigation now includes Web's missing 4px top padding. All
  primary rows and the Projects header align to the current Web y positions
  while the certified 16px section pitch remains unchanged.
- Lynx-for-Web provides exact fractional positions; exact-owned Native bundle
  `ce8d898d…`, PID-derived `localhost:8903/session 1`, retains the rounded
  logical positions, 28px rows, a 2560x1576 raw frame, and empty console.
  Evidence is under
  `shots/2026-08-07/sidebar-primary-top-rhythm-current/`.
- Projects Sort group labels now match Web's 12px/18px/500 identity while
  preserving the already-correct 12px/18px/400 option text. The correction is
  scoped to the Sort popup rather than changing every generic menu.
- Exact-owned Native bundle `ca050740…`, PID-derived
  `localhost:8901/session 1`, directly measures the corrected label/option
  hierarchy, produces a 2560x1576 frame, and has an empty console. Evidence is
  under `shots/2026-08-07/sidebar-sort-menu-label-current/`.
- After the Lynxtron shell adopted macOS `hiddenInset`, current Electron CDP
  geometry exposed one new top-chrome residual: both Electron drag frames are
  46px, while the Lynx sidebar titlebar still used its historical 48px height.
- The Lynx sidebar titlebar now matches the shared 46px chat header and
  traffic-light geometry. Exact-owned Native bundle `7bedabf8…`, PID-derived
  `localhost:8903/session 1`, directly measures both top frames at 46px with
  `-x-app-region: drag`, a full 1280x820 logical content/window frame, and an
  empty warning/error console. Evidence is under
  `shots/2026-08-07/lynxtron-titlebar-46-current/`.
- Electron also measures its sidebar mark at 14x14 with a 12px trailing gap.
  Lynx previously kept 14px trailing padding and resolved the shared
  `size-3.5` token to 12.25px because its rem base differs from the Web
  renderer; the Lynx logo adapter also omitted the shared `shrink-0` base.
- The titlebar now uses 12px trailing padding, and the adapter preserves the
  shared non-shrinking/foreground classes while mapping this Web size token to
  a physical 14px. Final exact-owned bundle `fe48cd46…`, PID-derived
  `localhost:8905/session 1`, directly measures a 14x14, flex-shrink-zero logo
  with the same 12px trailing gap and an empty console. A guessed-client
  attempt against 8903 returned no nodes and was rejected.

## Remaining work

1. Run the final heavy pass only after explicit authorization permits
   `bun fmt`, `bun lint`, and `bun typecheck`.
2. Re-run this prompt-to-artifact audit, verify local/remote parity and cleanup,
   then mark the active goal complete only if no MISSING/PARTIAL/PENDING rows
   remain.

## Current disposition

The implementation objective has materially advanced and every canonical
Settings section has a real Lynx owner. Landing/Header, Pull Requests, empty
Thread, and project Kanban now have current-head three-client proof rather than
historical proxy evidence. The active thread goal is **not yet complete**
because the required heavy pass remains blocked by the current instruction
boundary.
