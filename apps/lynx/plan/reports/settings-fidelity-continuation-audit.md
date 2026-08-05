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
| Reuse audit includes current graph | regenerated baseline; strict check passes; Settings gate 53.11% | PASS |
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
| Providers | shared provider update/picker compositions |
| Skills | `SettingsSkillsPanel` |
| Usage | `SettingsUsagePanel` |
| Integrations | `SettingsIntegrationsPanel` |
| Advanced | `SettingsAdvancedPanel` |

No canonical navigation item falls through to the Providers fallback.

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
