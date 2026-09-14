# Design-system fidelity audit — 2026-09-12

Electron is the visual authority. This audit covers the shared token layer,
Native typography, semantic icon paint, primitive identity, and the highest-risk
component-level color literals before returning to full-page composition.

## Anti-pattern verdict

Synara does not read as generic AI UI. Its compact native-tool density, restrained
neutral palette, fine borders, and progressive disclosure are coherent. The main
risk is not decorative excess; it is renderer drift caused by duplicated literal
values and unresolved Native custom properties.

## Executive summary

- Critical: 0
- High: 1
- Medium: 2
- Low: 2
- Existing strengths: 50 paired real-component stories, 100 renderer mappings,
  3,232 meaningful cases, zero missing primitive counterparts, and broad
  semantic-icon consumer coverage.

## Findings

### High — unresolved Native typography token

- Location: `apps/lynx/src/app/App.css`, `.TranscriptTurnChangesStats`.
- Evidence: the recursive typography gate rejects `var(--font-system-ui)`; the
  Native root projects `--font-ui-family`, not `--font-system-ui`.
- Impact: end-of-turn change statistics can fall back to an engine-dependent
  face, producing different number widths and baseline rhythm from Electron.
- Fix: normalize to `var(--font-ui-family)` and retain the recursive gate.

### Medium — Browser home palette duplicated as literals

- Location: Electron `BrowserLocalServersHome` / Native
  `browser-dock-pane.css`.
- Evidence: both renderers independently encode the same dark canvas, white
  alpha hierarchy, card border, thumbnail, traffic-light, and online colors.
- Impact: today the visuals match, but either renderer can drift without token
  or test failures. Light product theme does not change this intentionally dark
  browser-home canvas, so replacing it with ordinary `foreground/background`
  would be incorrect.
- Fix: preserve the authority appearance while defining shared semantic
  `--browser-home-*` tokens consumed by both renderers.

### Medium — inverse icon paint bypasses semantic role

- Location: Native and Electron Plugin Library skill glyphs.
- Evidence: both use direct translucent white (`rgba(...,.8)` / `text-white/80`)
  over a generated colored tile. Native already has an `inverse` semantic icon
  role resolved from `--color-text-button-primary`.
- Impact: custom themes can change inverse ink without updating this glyph.
- Fix: use the inverse icon token/role while preserving the colored skill tile.

### Low — intentionally direct status and preview colors need classification

- Locations: browser-thumbnail traffic lights, Terminal search highlight,
  Kanban/PR status icons, exported profile share card.
- Evidence: these encode semantic status, a miniature browser artifact, or an
  exported fixed-brand image rather than neutral application chrome.
- Impact: a blanket no-literals rule would flatten meaningful status or make
  exported assets theme-dependent.
- Fix: retain and document these exceptions; gate neutral chrome separately.

### Low — style/reuse baselines are stale

- Evidence: `audit:style:check` and `audit:reuse:check` report stale manifests.
- Impact: those checks cannot currently serve as green completion gates.
- Constraint: the baseline files contain pre-existing user changes and are not
  rewritten in this task. Source/runtime audits remain authoritative.

## Positive findings

- Product font families are almost entirely routed through four semantic roles.
- Raw Native SVGs resolve theme colors before painting; the scoped semantic icon
  suites pass.
- Component identity and primitive inventory cover all current counterparts.
- Status colors remain distinct instead of being flattened into neutral chrome.

## Priority plan

1. Normalize the unresolved UI-font token.
2. Extract shared Browser-home palette roles without changing its dark-canvas
   direction.
3. Route Plugin Library inverse glyphs through semantic icon paint.
4. Verify the normalized primitives in light/dark Native runtime cells.
5. Continue component geometry/state audits, then re-run whole-page matrices.

## Normalization status

- The unresolved transcript-statistics font now resolves through
  `--font-ui-family`; the recursive typography audit passes.
- Electron and Native Browser home surfaces now consume the same
  `--browser-home-*` semantic palette while preserving the authority's
  intentionally always-dark canvas.
- Electron and Native Plugin Library skill glyphs now consume the inverse icon
  role rather than direct translucent white.
- Native Plugin Search matches the Electron authority at a 32px bordered shell
  with a 30px inner control. On the exact-owned Lynxtron 0.0.22 client
  (`localhost:8901`), its border quad is `624x32`; the page title resolves to
  `28px/36px`; the error/warning console is empty.
- Focused regression result: 17/17 Native assertions and 1/1 Web assertion pass.
- The complete workspace production build passes and stages Lynx bundle SHA-256
  c6d8613d01989910622e28c8f4a3be3bba149313ca71bd4cec5c113b9c104e9c.

## Primitive state follow-up

- Button, Input, Textarea, Select, Combobox, InputGroup, Toggle, Checkbox,
  Switch, Badge, Menu, and Command disabled paint now share
  `--control-disabled-opacity: 0.64`; the prominent action keeps Electron's
  deliberate `0.2` disabled exception.
- Native Button focus now uses the shared action-focus ring role, while Native
  Input focus uses the quieter input-border role that matches Electron.
- Native `prominent` buttons now implement Electron's inverse capsule paint
  instead of silently falling back to the default primary variant.
- Native Tooltip now distinguishes the default 10px surface from the 10.4px
  composer-picker surface and matches their respective insets and shadows.
- Exact-owned 0.0.22 Component Lab checks verified the prominent disabled
  button at 0.2 opacity with inverse black/white paint; light Input focus now
  resolves to `hsla(0,0%,5%,.3)` instead of leaking an unsupported
  `color-mix(...)` expression; the dark picker Tooltip measures `110x27`
  versus Electron `111x26.5`. All retained Native console checks were clean.
- The post-normalization workspace build passes with staged Lynx bundle SHA-256
  `b3d1cc6965f84343b87a7a277004bd618abb034d983f1dd29f6d12ec1f40934a`.

## Row and tab follow-up

- Native Sidebar project/thread/chat focus now uses the same inset ring as
  Electron, preventing a 2px content-box shift when keyboard focus enters a row.
- Active Native thread rows now retain `--sidebar-accent-active` through hover
  and pressed states instead of falling back to the ordinary hover surface.
- Project rows do not have a product-level selected state, so their synthetic
  `active` and `active-hover` Component Lab cells were removed; the matrix now
  contains 3,144 meaningful cells.
- Generic tab close, Browser, Add, and Collapse glyphs now resolve the semantic
  secondary icon color before Native SVG paint; file and provider icons retain
  their meaningful per-type colors.
- Focused row/tab tests pass and the staged Native bundle SHA-256 is
  `93b1fd1fcfe4dd241e8069629ef3970640782bcb67d74ef3283d6e89d23f2a9f`.

## Whole-page follow-up

- Current-head Settings Behavior is compositionally aligned at light
  1280x820: both renderers use the 256px sidebar, the same content origin,
  header/description spacing, 624px cards, row heights, and switch positions.
  The remaining visible difference is platform text rasterization, not an
  actionable CSS offset.
- Plugin Library's Native Plugins view now matches Electron's row semantics:
  shared metadata-aware accent gradients, 44px inverse plugin glyphs, and 28px
  installed checks replace the gray fallback tile and marketplace status text.
  Exact-owned 0.0.22 runtime exposed five 44x44 glyphs and five 28x28 checks;
  the first metadata color resolved to a `#2563eb` gradient and the console
  was clean. Staged bundle SHA-256:
  `3bcfc7dc24d149cf87682e1f3aa45dc0283d7bf8317895c979856f81b0a6408f`.
- Exact-owned Lynxtron 0.0.22 runtime checks on staged bundle
  `72b48d964334c81178559ded6d80f716d6d15d905131487f79782cdc837f8e03`
  confirm prominent disabled paint at 0.2 opacity, resolved light input-focus
  border `hsla(0,0%,5%,.3)`, and dark picker-tooltip geometry `110x27`
  versus Electron `111x26.5`; all retained Native console checks were clean.
- The project-scoped New Thread comparison now enters Electron through the
  rendered project action, verifies the resulting project-owned draft, and only
  then launches Native. This replaces the invalid direct `/new-thread/:id` Web
  mapping and prevents a Not Found page or synthetic draft from becoming visual
  authority.
- Native now renders the canonical Synara mark from the same shared SVG paths as
  Electron. The former hover-only Lynxtron logo swap and its two packaged PNGs
  were removed; exact-owned runtime reported the shared `0 0 470 504` viewBox.
- Project Landing now reuses the real Thread header actions and empty-thread
  context tray. The visible header order matches Electron: static `New thread`,
  disabled Handoff, real project Add action, Environment, then disabled Diff.
  Off-canvas Add/Collapse dock controls were measured outside the 1280px viewport
  (`x=1726/1758`) and correctly excluded from the visible Native header.
- Landing env mode, branch, temporary state, and notes are page-owned inputs to
  the real first `thread.create`; Environment edits use draft-safe callbacks and
  transfer to the created Thread lifecycle. Native Local → Worktree and Temporary
  interactions were exercised physically; DevTool reported `aria-label=Worktree`
  and `aria-pressed=true`.
- Landing Environment now reuses the production panel with the same non-repo
  `Initialize Git`, Local Servers, Usage, Editor, Project instructions, and
  Notepad sequence as Electron. At 1280×820, Electron measured a 312px panel
  footprint with a 288px surface; Native measured a 288px overlay surface and
  reduced the 1024px main pane to 712px, preserving the same 312px docked inset.
  The Native Environment toggle is 28×28, Diff remains disabled, and the
  error/warning console is empty. The staged bundle SHA-256 is
  `0ac1b0670a532978c249cb866aef1e792a340fd753f9e6d5a70b0efd7f064cd2`.
- Follow-up validation used the Electron project's rendered New thread action
  rather than a synthesized draft route. The final Native header reuses the
  production Handoff/Add action controls, exposes a functional Environment
  toggle, and keeps Diff disabled before a git-backed thread exists. Native
  Environment now uses the same repo gate as Electron: non-repositories show
  `Initialize Git` instead of invalid Changes/Branch rows. Landing-owned env,
  branch, notes, and temporary state are transferred into the real thread
  creation/lifecycle path. The open panel retained the 312px docked footprint
  (288px surface plus 12px gutters) and the exact visible section order. The
  off-canvas Add/Collapse controls were measured at x=1726/1758 outside the
  1280px viewport and were not treated as visible residuals. Focused Native
  suites pass 34/34, the production build passes, and the final staged bundle
  SHA-256 is
  `c90fa4e26e9e9585522db3f1ed395a573c0037c7d43a6eb934641ebfc1f50f0c`.
- Current-head project Kanban at light 1280×820 has no actionable composition
  residual: both renderers use a 984×46 route header, three equal columns,
  315px inner card tracks (Electron 314.67px fractional layout), 50px empty
  states, and the same single Done card hierarchy. Native error/warning console
  output is empty; the 1–2px outer-column difference is grid rounding.
- Pull Requests at light 1280×820 now matches the Electron authority's empty
  result composition. The shared Native empty primitive was normalized from an
  obsolete 180px minimum with 64px vertical padding to the authority's 148px
  footprint with 48px padding; its title and description now land at y=192 and
  y=224 in both renderers. The shared warning primitive now uses the 12px/18px
  fine-text role and the route stack restores the authority's 16px separation,
  placing the 968×36 callout at y=308 in both renderers. Focused Native tests
  pass 12/12, the exact-owned client is workspace Lynxtron 0.0.22, the
  error/warning console is empty, and the staged bundle SHA-256 is
  `4cab00eba475c02879a0c7b84e63fd198c16eacc7ad6f428027cd01cb202804b`.
- Automations now uses the Electron authority's composer-style creation dialog
  instead of the former labeled 560×680 form. The Native surface shares the
  starter templates and `gpt-5-codex` default with Web, keeps controlled title
  and prompt values after template selection, and matches the authority's
  768×465 default / 768×503 three-warning geometry, 56px header, 240px prompt,
  32px warning rows, and 52px footer.
- Automation toolbar and route actions now use semantic icon roles: secondary
  for neutral controls and inverse for the primary New automation glyph. The
  inverse glyph resolves to white on the light-theme black action and `#111111`
  on the dark-theme white action. Static warning rows are exposed as text only;
  the local-checkout acknowledgment alone retains button, focus, keyboard, and
  tap behavior.
- Exact-owned Lynxtron 0.0.22 verification at light and dark 1280×820 confirmed
  template title/prompt propagation, `GPT-5 Codex`, disabled-to-enabled Create
  behavior after acknowledgment, and a clean error/warning console. Focused
  Native tests pass 31/31, the shared Web automation suite passes 33/33, and the
  production bundle SHA-256 is
  `097bb0e3800261fc65719662b713bddbc2a21b6797c956444427c55546df653f`.
- The continuation audit closed the remaining automation create/edit/detail
  divergence. Create and Edit now share Native composer primitives and the same
  eight-choice schedule contract as Electron; footer menus open upward and stay
  within the 1280×820 window. The detail page now exposes the authority's
  Pause/Delete icon actions, primary Run now action, lifecycle status dot, and
  compact inline controls, including the production model picker.
- The Settings/ordinary shell transition now uses route-specific reconciliation
  keys. Repeated exact-owned route transitions resolved to one Settings sidebar
  and zero ordinary sidebars on Settings, then the exact inverse on product
  routes, with one shell in both cases. This closes the reported intermittent
  Settings-in-the-left-sidebar failure.
- Final focused results are 39/39 Native and 33/33 Web; React Doctor 0.9.11
  reported zero changed-line diagnostics across the affected Native/Web source.
  The final exact-owned
  workspace Lynxtron 0.0.22 client was PID `38396` on PID-derived
  `localhost:8901`, session 1. Native measured the shared Edit shell at
  766×463 content inside its 768×465 bordered surface. The exact-client
  error/warning console was empty, and the staged bundle SHA-256 was
  `0154aff177b6147cb769d7e9ccab5b54b007e3fb027e3fa3b68e7f68df3773c0`.
- The canonical server rejected a legacy local-checkout definition without
  explicit consent, so the impossible blocked state was not fabricated for a
  screenshot. Approval-needed actions remain covered by the focused contract,
  and no approval or Run now action was invoked during certification.
- Components Lab now retains the automation composer and populated detail page
  as first-class paired regression surfaces. Create/Edit variants mount the
  production dialog on each renderer from one shared typed fixture; the detail
  story mounts the production Native page and an Electron composition extracted
  from the real route. Coverage is 48 stories, 96 renderer mappings, and 3,192
  meaningful cells. Both exact-owned Native composer
  variants rendered from bundle
  `bb34539b125df9ce6a4103c357e3f4953765a8413bcf4c3a4c51b4792720e7a9`
  with an empty error/warning console.
- Native Create/Edit now pass through one production `AutomationDialog` variant
  wrapper. The current identity audit passes all 98 renderer mappings without a
  composer-specific override; primitive inventory remains zero missing and zero
  omitted counterparts.
- The detail story uses an 880×520 page canvas instead of the generic component
  target. Active and paused variants retain the full split pane, 11 detail
  labels, action-header state, status dot, and Previous runs surface. Its final
  staged bundle SHA-256 is
  `97f654208241aa65591d552f872d0b98e3cd407ab3c8f53a0be37398b75b99be`.
- The populated list is now the third paired Automations surface. Electron and
  Native routes share their production list compositions with current, mixed,
  and loading Lab cases; the shared fixture yields one active and one paused row
  with the authority's title/detail/meta hierarchy. Coverage is now 49 stories,
  98 renderer mappings, and 3,216 meaningful cells. Exact-owned Native used PID
  `99940` on PID-derived `localhost:8901`, had an empty error/warning console,
  and staged bundle SHA-256
  `beeaa2abfdda57ae141b3a6e98786ba175064cc551d59609f9de420584d6cf3d`.
- The list extraction also removed the inherited nested interactive semantics:
  row navigation and hover Delete are sibling buttons rather than a button-like
  ancestor containing a second focusable control. React Doctor reports zero
  changed-line errors or warnings after the correction.
- Native Terminal Search now matches Electron's icon contract: Previous/Next
  use 14px semantic secondary chevrons and Close uses the 14px semantic X icon
  instead of font glyphs whose baseline and shape depended on the UI face. The
  paired story retained `Aa` as the intentional text affordance, exposed exactly
  three icon nodes plus one text label, and had an empty exact-client console.
  Its staged bundle SHA-256 is
  `48b48ee375287a6d4b1c4837f384b44e6ebf8b4b88165f04204ec1081ead23b7`.
- Native Chat history and Diff file-jump close controls now use the same 14px
  semantic secondary XIcon as Electron instead of a font glyph. Exact-owned
  Chat history verified the icon in the real overlay while retaining the active
  row's check as semantic content; scoped Editor/Diff tests pass 23/23 and the
  final staged bundle SHA-256 is
  `b741b39a52a67bda5dfad056dde0b3175bdc5b10ba650ecc688ed3b1650d4e5b`.
- Native Workspace retains explicit reorder buttons as the registered fallback
  for Electron's drag interaction, but now uses shared 14px semantic chevrons
  instead of font arrows. Exact-owned PID `48871` exposed one normal and one
  180-degree icon with both accessible Move labels and an empty console. The
  final staged bundle SHA-256 is
  `abee843819e3983fc4c513f05b9e6be4bda29d54dc9f392c62fb8eb5bb96b2ac`.
- The non-persisted composer image warning now consumes the theme-aware warning
  SVG color (`#d97706` light / `#f5b44a` dark) rather than pinning the light
  amber in both themes. Its full attachment interaction suite passes 4/4, the
  Native production build passes, and React Doctor reports zero changed-line
  diagnostics.
- The PDF toolbar no longer depends on UI-font glyphs for Previous, Next, Zoom
  out, Zoom in, or Open. Native now uses generated chevron-left, chevron-right,
  minus, plus, and external-link icons with the semantic secondary icon role,
  matching Electron's icon system at 16px (14px for Open). Focused PDF/icon
  suites pass 11/11. Exact-owned Lynxtron 0.0.22 PID `76827`, resolved through
  PID-derived DevTool `localhost:8901`, session 1, exposed all five SVG
  identities with an empty error/warning console. The final staged bundle
  SHA-256 is
  `3bacd0fbfa26ac5ba4ae22413f3f11ac678b5a7f782d74056e7208d7fcc8a396`.
- The file-preview header no longer assumes generated Native SVGs inherit CSS
  color after render. Breadcrumb, Markdown mode, overflow, and editor-picker
  icons now receive their authority roles explicitly; Preview also uses
  Electron's Eye icon instead of Code/brackets. Exact-owned Lynxtron 0.0.22 PID
  `12549` on PID-derived `localhost:8901`, session 1, confirmed the expected
  chevron/file/eye/dots/chevron-down identities and resolved paints with an
  empty error/warning console. Focused source/icon tests pass 6/6 and the final
  staged bundle SHA-256 is
  `ba4e8b597487d7eb539ec7fa1efa63984328c874476f6071de8ad4bc1be3d153`.
- Recent View Switcher now shares Electron's Central icon identities and
  effective semantic paint for chat, terminal, workspace, Settings, and Plugins.
  Native also restores the authority's pinned/split trailing metadata and four
  separate Kbd hints instead of a compressed shortcut string. The new paired
  story increases coverage to 50 stories, 100 renderer mappings, and 3,232
  cells. Exact-owned Lynxtron 0.0.22 PID `75188`, PID-derived DevTool
  `localhost:8901`, session 1, exposed 6 entry icons, 2 trailing icons, 4 keycaps,
  one selected row, and an empty error/warning console. The final staged bundle
  SHA-256 is
  `5f2115b8721e4f616047900495e6417e4d1ae83e72ba5ab67abf8986a00a07d4`.
- The Landing context tray now passes explicit semantic secondary paint to its
  generated project, environment, branch, and menu icons. The Temporary icon's
  active state now uses the accent role instead of the nonexistent
  `svgColors.accentForeground`, while its inactive state remains secondary.
  Focused landing suites pass 8/8. Exact-owned Lynxtron 0.0.22 PID `92511`,
  PID-derived DevTool `localhost:8901`, session 1, confirmed secondary Local and
  Temporary SVG paint with an empty console. The final staged bundle SHA-256 is
  `136e99ced87c7a05bfe9eed40511e528e7a5b361fd4de0193f52a60fc6f9aece`.
- Browser chrome now uses Electron's ArrowRight and Central chain-link identities
  rather than ChevronRight and Copy. Native explicitly resolves foreground
  toolbar paint, secondary action-menu/suggestion/inactive-tab paint, primary
  active-tab paint, and the always-dark Local home's fixed white-alpha icon
  hierarchy. Focused Browser/icon suites pass 8/8. Exact-owned Lynxtron 0.0.22
  PID `14159`, window `104403`, opened Browser via real `Cmd+Shift+B`; PID-derived
  DevTool `localhost:8901`, session 1, confirmed the toolbar identities, four
  secondary menu icons, fixed Local-home paint, and an empty console. The final
  staged bundle SHA-256 is
  `f7c107c36117bbb3540f13e90d9e49c7600eb9b0c3d54d1aefbb9d7d12bafad9`.
- Composer's compact model trigger now passes semantic secondary paint directly
  to its status Settings icon instead of relying on CSS inheritance after SVG
  generation. The adjacent chevron remains foreground with 0.6 opacity, matching
  Electron's distinct treatment. Focused suites pass 3/3. Exact-owned Lynxtron
  0.0.22 PID `36471`, window `104448`, PID-derived DevTool `localhost:8901`,
  session 1, confirmed the two effective paints and an empty console. The final
  staged bundle SHA-256 is
  `1e9086442cfaf1b726d8eb635e8ccd2c66783b9487dada5cc56b2f70b3ce9a63`.
- Editor Rail Add Menu now paints both New chat and New terminal with Electron's
  primary icon role. The Central terminal SVG no longer diverges to secondary
  beside a primary generated chat glyph, and the adapter CSS reflects its actual
  paint contract. Focused suites pass 2/2. Exact-owned Lynxtron 0.0.22 PID
  `57242`, window `104514`, PID-derived DevTool `localhost:8901`, session 1,
  confirmed both strokes at `#0d0d0d` with an empty console. The final staged
  bundle SHA-256 is
  `42a4504ffcf0404f31ac44ab901941e3c237033d90f38e0bdeec82ae2c1fae60`.

## Composer reference attachment follow-up

- Composer reference attachments now pass semantic SVG paint at render time: the
  summary and document glyphs use secondary ink, ghost removal uses tertiary,
  solid removal uses inverse surface ink, and non-persisted image warnings use the
  warning role. File cards also share Electron's attachment-aware icon selection
  and the extracted `fileAttachmentTypeLabel`, eliminating full MIME strings from
  Native subtitles.
- The new paired production-composition story covers summary, documents, and
  image-warning variants and raises the catalog to 51 stories, 102 mappings, and
  3,256 cells. Exact-owned Lynxtron 0.0.22 PID `15978`, window `104614`,
  PID-derived `localhost:8901`, session 1, exposed secondary
  `rgba(13, 13, 13, 0.598)`, tertiary `rgba(13, 13, 13, 0.398)`, inverse
  `#ffffff`, and warning `#d97706` strokes with an empty console. Electron CDP
  confirmed matching `PDF` / `MD` copy and semantic icon roles. Its outer-window
  capture had a harness-only blank-compositing failure, so only the live iframe
  DOM/computed styles were used as Electron evidence. No screenshot was retained.
  The staged bundle SHA-256 is
  `89b0dafb02ee710128020f917b943ce8b48f1a325a84bb0e59e0be171a7040b3`.

## Kanban metadata icon follow-up

- Native Kanban branch and attachment icons now receive the semantic secondary
  role at SVG generation time, matching Electron's muted metadata hierarchy.
  Dedicated fork, pull-request, and status colors remain unchanged.
- Focused tests pass 6/6. Exact-owned Lynxtron 0.0.22 PID `54033`, window
  `104803`, PID-derived `localhost:8901`, session 1, exposed both strokes at
  `rgba(13, 13, 13, 0.598)` with an empty console. No screenshot was retained.
  The staged bundle SHA-256 is
  `8a7f6976fd2dce0989983c62161fdf4cf9d66c4547fcd50789b6b9965adb0034`.

## Kanban action icon follow-up

- Native Kanban overview, column, and project-route action glyphs now pass the
  same default semantic paint that Electron assigns through its Button variants:
  New task, Back, and column-add actions are secondary, while the hover-only
  overview disclosure chevron is tertiary. Content/status symbols keep their
  dedicated colors.
- Focused tests pass 5/5. Exact-owned Lynxtron 0.0.22 PID `86971`, window
  `104862`, PID-derived `localhost:8901`, session 1, verified both live Kanban
  routes with secondary `rgba(13, 13, 13, 0.598)` and tertiary
  `rgba(13, 13, 13, 0.398)` strokes and an empty console. No screenshot was
  retained. The staged bundle SHA-256 is
  `291d5f4406b7b2ddbed80a3f393c8aeaec1c4f3d3ae089051d568fd3e1c79e2e`.

## Thread error dismiss follow-up

- Native Thread Error Banner now embeds the theme destructive color in its
  generated dismiss X instead of leaving a foreground SVG under a destructive
  CSS parent. The existing dismiss opacity preserves Electron's destructive/60
  hierarchy; Provider Health intentionally retains foreground/65.
- The new paired production story raises the catalog to 52 stories, 104 mappings,
  and 3,264 cells. Exact-owned Lynxtron 0.0.22 PID `10025`, window `104907`,
  PID-derived `localhost:8901`, session 1, exposed both error icons at `#e02e2a`
  with an empty console. Electron CDP confirmed `rgb(224, 46, 42)` and 0.6 alpha
  on the authority dismiss icon. No screenshot was retained. The staged bundle
  SHA-256 is
  `a785e229e4fcbbdd102327530ef358a6f08abad677d94a6ca02daa45359a56c7`.

## Disclosure chevron follow-up

- Native Collapsed Work and Pull Request file disclosure chevrons now embed the
  semantic secondary stroke. Collapsed Work also uses `0.55` opacity so its
  effective light paint matches Electron's measured alpha `0.327843`; PR summary
  and comment chevrons intentionally remain foreground, matching their authority.
- The new paired Collapsed Work production story brings the catalog to 53 stories,
  106 mappings, 3,280 cells, and 27 interactive stories. Exact-owned Lynxtron
  0.0.22 PID `60213` / window `105014` verified secondary stroke plus `0.55`
  opacity; final PID `80605` / window `105156` verified the PR file chevron at
  `rgba(13, 13, 13, 0.598)`. Both PID-derived `localhost:8901` sessions had empty
  consoles. No screenshot was retained. The staged bundle SHA-256 is
  `9a40474141fcf84778b17cbd22e96486e9a84a5b75048701b92c2f7a04d03297`.

## Transcript icon follow-up

- Native now consumes the exact resolved status-neutral and status-error theme
  values for transcript SVGs. Error activity is no longer rendered with primary
  ink, ordinary work/search/edit activity uses the neutral status role, and all
  message footer actions explicitly use semantic secondary. The selection toolbar
  remains primary by design.
- The extracted `TranscriptStatusIcon` is mounted by both the production
  transcript and a paired status-row story. Components Lab now reports 54 stories,
  108 mappings, and 3,328 cells. Exact-owned Lynxtron 0.0.22 PID `52414` / window
  `105230` resolved error `#e02e2a` and neutral `#626262`; PID `58603` / window
  `105269` resolved Copy/Edit/Revert to secondary
  `rgba(13, 13, 13, 0.598)`. Electron CDP reported the corresponding action color
  as `rgba(13, 13, 13, 0.596)`. Exact-client consoles were empty and no screenshot
  was retained. The staged bundle SHA-256 is
  `de58e7772f13642994d8770127c389ac916ba55511525f74d4429320876671d9`.

## Sidebar hover icon follow-up

- Native Sidebar row actions now embed semantic secondary paint for generated
  Plus, Archive, and pull-request compare SVGs instead of relying on inherited
  CSS color. The paired project/thread specimens use the same paint contract.
- Hover-card metadata uses the Electron authority's muted-foreground value, with
  the additional `0.75` thread-card opacity preserved. Project pins now retain
  their state hierarchy: unpinned is muted at `0.55`; pinned is primary at full
  opacity. The shared hover-card composition has focused direct-render coverage
  for both states and all metadata glyph families.
- Focused Native suites pass 10/10. Exact-owned Lynxtron 0.0.22 PID `48269` /
  window `105424`, PID-derived `localhost:8901`, session 1, resolved project-row
  Plus and Archive strokes to `rgba(13, 13, 13, 0.598)`; Electron CDP reported
  its secondary token as `rgba(13, 13, 13, 0.596)`. The exact-client console was
  empty. Native mouse-move automation did not expose the hover card, so that
  interaction is recorded as a harness limitation rather than a product pass or
  failure. No screenshot was retained. The staged bundle SHA-256 is
  `dd1438098a373c517361b6f98f66b323b582dff0e682e5f880aad95f6c498eae`.

## Composer extras icon follow-up

- Native Composer extras now passes semantic secondary paint directly into the
  generated Plus, Paperclip, Blocks, and Gauge SVGs. This removes the previous
  mismatch where CSS declared secondary but the encoded SVG retained primary
  foreground.
- The focused Native suite verifies all four encoded strokes and passes 4/4.
  Exact-owned Lynxtron 0.0.22 PID `70010` / window `105456`, PID-derived
  `localhost:8901`, session 1, opened the real menu and measured every glyph at
  `rgba(13, 13, 13, 0.598)`. Electron CDP reported the same `.598` authority for
  icon-secondary and chrome foreground-secondary. The exact-client console was
  empty, no screenshot was retained, and the staged bundle SHA-256 is
  `0f76dec08422ea406c6b5a3a0a139a6c5d3d919a5a4b10a13a4a2f248f2cdf08`.

## Composer navigation chrome follow-up

- Native Mic, model trigger/search/back, and traits-chevron SVGs now embed
  semantic secondary paint. Model-group disclosure chevrons use a dedicated
  resolved `mutedForeground80` value plus their existing `0.5` opacity, matching
  Electron's `text-muted-foreground/80` × `opacity-50` effective hierarchy.
  Primary selection checks and provider identity are intentionally unchanged.
- Focused Native suites pass 6/6. Exact-owned Lynxtron 0.0.22 PID `30074` /
  window `105594` verified secondary `.598` trigger/search paint and encoded
  `.48` group chevrons. PID `34983` / window `105626` verified Mic at `.598`.
  Both PID-derived `localhost:8901` sessions had empty consoles, no screenshot
  was retained, and the final staged bundle SHA-256 is
  `e9410550d12d777ce7c3a43167789d7d887faa0a9ea6af869799d5fb9d211bcd`.

## Composer project-picker icon follow-up

- Native landing project-picker group, option, and footer-action SVGs now embed
  the resolved muted-foreground value. Their existing `0.45` and `0.70` opacity
  matches Electron's deliberately quieter group and
  `text-muted-foreground/70` option/action hierarchy. The selected Check remains
  primary.
- Focused Native tests pass 2/2. Exact-owned Lynxtron 0.0.22 PID `58112` /
  window `105689`, PID-derived `localhost:8901`, session 1, opened the real
  landing Composer picker and measured all visible group/option/action source
  strokes at `rgba(13, 13, 13, 0.6)` with an empty console. The Electron
  comparison snapshot lacked that trigger, so authority was verified from the
  production Web classes rather than a claimed interaction. No screenshot was
  retained; staged bundle SHA-256:
  `464872c249e0e97b72ce7da40892e65ad604842d1eb73a20be9ce07a779fc9ac`.

## Dock toolbar icon follow-up

- Native Terminal toolbar New/Move/Split/Close and Diff header Add/Collapse
  glyphs now embed semantic secondary paint for their default state, matching
  Electron chrome buttons. Menu content and selected identity glyphs retain their
  existing roles. Dynamic hover stroke recoloring is not claimed because encoded
  Lynx SVG content does not reliably follow parent CSS color changes.
- Focused Native Terminal/Diff suites pass 13/13. Exact-owned Lynxtron 0.0.22
  PID `89190` / window `105747`, PID-derived `localhost:8901`, session 1, opened
  the real Terminal dock and measured New, Split-right, Split-down, and Close at
  `rgba(13, 13, 13, 0.598)` with an empty exact-client console. The snapshot did
  not provide a reachable Diff data state, so that half is source-contract
  evidence only. No screenshot was retained; staged bundle SHA-256:
  `343c67cffa2686908fc69cfe69b954f30f6a039f44311d44dcc74f075ee229cd`.

## Sidebar Space-switcher icon follow-up

- Native Space tabs now embed their state-specific authority paint: inactive
  tabs use muted/70, active uses primary, and New space uses muted/55. Status
  activity dots remain independent semantic colors. This avoids flattening three
  deliberately distinct hierarchy levels into one inherited SVG color.
- Focused Native/theme suites pass 7/7 and the Lynx/Desktop production build
  passes on Lynxtron 0.0.22. The isolated snapshot has no stored Spaces, so the
  strip correctly remains absent and no artificial data was created for visual
  evidence. No screenshot was retained; staged bundle SHA-256:
  `0d8f200241dc733100ad02d34eaa4c92a15240a688e91c5587437afb0697c429`.

## Repository metadata icon follow-up

- Native Git dock Refresh now embeds semantic secondary paint, and the Pull
  Request summary Branches glyph embeds muted-foreground paint alongside its
  muted label. Dedicated PR status, merge, check-ring, and diff-stat colors are
  intentionally untouched.
- Focused Native suites pass 3/3 and the Lynx/Desktop production build passes on
  Lynxtron 0.0.22. Exact-owned PID `13709` / window `105799`, PID-derived
  `localhost:8901`, session 1, opened the real Git dock and measured Refresh at
  `rgba(13, 13, 13, 0.598)` with an empty console. PR Branch remains
  direct-render evidence because the snapshot has no PR summary state. No
  screenshot was retained; staged bundle SHA-256:
  `b2681b6717f7957b59bc979a0a1dac28c13c00ff4f67a07c4bfb00f71ad4b1da`.

## Plugin Library warning icon follow-up

- Native provider-discovery warning rows now write the resolved warning token
  into the generated Circle Alert SVG. The extracted row component keeps this
  status role directly testable without the provider query/runtime graph.
- The focused suite passes 4/4 with a rendered `#d97706` stroke, and the full
  Lynx/Desktop build passes on Lynxtron 0.0.22. Exact-owned `/plugins` PID
  `30621` / window `105852`, PID-derived `localhost:8901`, session 1, had no
  warnings in the current real snapshot and an empty console, so no live-warning
  claim is made. No screenshot was retained; staged bundle SHA-256:
  `827b907881a7d58359c3226956099e281185c00b04c52ff0c04997c5228400f3`.

## Notification dismiss icon follow-up

- Native Voice and task-completion toast dismiss X glyphs now share a concrete
  resolved foreground/65 component, matching Electron's notification close
  hierarchy. Existing Provider Update, Provider Health, and Sidechat-specific
  treatments remain unchanged to avoid double opacity or flattening header chrome.
- Isolated direct-render/theme tests pass 4/4 and the production build passes on
  Lynxtron 0.0.22. The large Task host suite still fails before test execution in
  an existing generated lynx-ui vendor module; this is recorded as harness noise,
  not a product failure. No synthetic toast was retained and no screenshot was
  added. Staged bundle SHA-256:
  `2b2c0102051df08899ac35a5ebaa78e4dfcb41ae65d643195a7dded940a870be`.

## Shared Menu submenu Chevron follow-up

- Native shared Menu submenu chevrons now encode foreground/80 directly in the
  generated SVG, matching Electron's foreground Chevron with `opacity: 0.8`.
  Selection checks remain primary, preserving the menu's selected-state hierarchy.
- Removed the Composer provider-list's duplicate `0.8` opacity, which otherwise
  compounded the encoded `.8` into an effective `.64`. Focused Native suites pass
  23/23, the Web submenu browser fixture passes 2/2, and the production build
  passes on Lynxtron 0.0.22.
- Exact-owned PID `8589` / window `105997`, PID-derived `localhost:8901`, session
  1, opened the real Composer model submenu and measured encoded Chevron stroke
  `rgba(13, 13, 13, 0.8)` with computed opacity `1`; Electron CDP measured its
  counterpart at foreground plus `opacity: 0.8`. The exact-client console was
  empty, no screenshot was retained, and the staged bundle SHA-256 is
  `181499d0b39033af038ccf3960bb868375952c0db4e710140f439a8f57ca9759`.

## Shared Dialog close icon follow-up

- Standard Native dialogs now encode the secondary-foreground stroke directly
  into their generated close X and retain a child `0.8` opacity, matching the
  Electron ghost icon-button contract. The previous muted CSS declaration did
  not affect SVG content and left the Native glyph at full foreground.
- The focused Native Dialog suite passes 10/10; the Electron Components Lab
  browser authority suite passes 4/4 and explicitly verifies secondary foreground
  plus `0.8` child opacity. The full production build passes on Lynxtron 0.0.22.
- Exact-owned PID `43531` / window `106088`, PID-derived `localhost:8901`, session
  1, rendered the closable-dialog story with encoded X stroke
  `rgba(13, 13, 13, 0.598)`, computed opacity `0.8`, and 18px geometry. The
  exact-client console was empty, no screenshot was retained, and the staged
  bundle SHA-256 is
  `c398c847492cbff9ac1e7a4854503be09ccda96cd7fc866aad934d6b16edaaf3`.

## Terminal jump icon follow-up

- Native terminal Scroll-to-bottom now encodes muted foreground in the generated
  Arrow Down SVG and applies `0.8` element opacity, matching Electron's outlined
  IconButton plus shared icon-child opacity. The terminal action shell, border,
  hover background, and focus behavior remain unchanged.
- The targeted terminal contract test passes and the full production build passes
  on Lynxtron 0.0.22. The same file's unrelated router-wiring assertion remains
  stale against the current pane configuration and is not attributed to this slice.
- Exact-owned PID `62611` / window `106196`, PID-derived `localhost:8901`, session
  1, loaded the real workspace Terminal with an empty exact-client console. The
  fresh PTY had no scrollable history and Native input focus could not be acquired
  through the available accessibility surface, so no artificial output or live
  jump-control claim was made. No screenshot was retained; staged bundle SHA-256:
  `2a74f3c0a352ba414807bdc06726e12108b0b1d3f4f8ccf7ebbc34e58aa728d5`.

## Workspace header action icon follow-up

- Native Workspace header action glyphs now encode foreground/80 directly,
  matching Electron's outline Button icon contract instead of rendering the
  generated SVGs at full foreground. This covers Terminal, Settings, and the
  currently Native-only Delete action.
- Delete remains intentionally available in the Native header because the Native
  Workspace sidebar does not yet provide Electron's hover deletion affordance;
  removing it in a paint-only slice would regress functionality. The focused
  Workspace suite passes 6/6 and the full production build passes on Lynxtron
  0.0.22.
- The isolated snapshot had no persisted Workspace and Electron redirected the
  requested `/workspace` route to a new thread during preflight. That harness
  state was rejected rather than retained as false visual evidence. No screenshot
  was retained; staged bundle SHA-256:
  `9267a0238d8ac7a158b5e4e4d9d10e877ab8e3d7269618d8e3fff7a9aef5066c`.

## Settings outline action icon follow-up

- Native Provider Update, Usage Refresh, and Custom Models Add actions now encode
  foreground/80 in their generated SVGs, matching Electron's outline Button icon
  hierarchy. Select disclosure, reset, and warning glyphs retain their distinct
  muted or status semantics.
- Provider Tools plus Settings label suites pass 10/10. Custom Models remains
  blocked before execution by the known Rstest generated `lynx-ui-button` vendor
  module parse failure; its source contract and the complete production build
  pass on Lynxtron 0.0.22.
- Exact-owned PID `19464` / window `106356`, PID-derived `localhost:8901`, session
  1, rendered the real Usage Refresh SVG with stroke
  `rgba(13, 13, 13, 0.8)` and an empty exact-client console. The current provider
  snapshot exposed no update action, so no fake state or external update was
  triggered. No screenshot was retained; staged bundle SHA-256:
  `592468ee2bff25f58107b81fdd8068a8b3956f4ae14c3c6704c47815bf2b209f`.

## Settings Select chevron follow-up

- Native Appearance, Theme Pack code-theme, and Custom Models provider Selects
  now use the same foreground-source plus `0.5` element-opacity Chevron contract
  as Electron and the already-aligned General/Git Writing controls. Other
  chevron families retain their own muted, reorder, or disclosure semantics.
- Appearance and Theme Pack focused suites pass 12/12. The Custom Models suite is
  still blocked before execution by the known Rstest generated `lynx-ui-button`
  parse issue; its source/style assertion and the full production build pass on
  Lynxtron 0.0.22.
- Exact-owned PID `35544` / window `106406`, PID-derived `localhost:8901`, session
  1, rendered the real Models page with Git Writing and Custom Models chevrons
  both encoded at `#0d0d0d` and computed at `opacity: 0.5`. The exact-client
  console was empty, no screenshot was retained, and staged bundle SHA-256 is
  `62754b32144140259a176e5a7f536ceabdbae54dc273383c54bb5b11533c8658`.

## Settings reset icon follow-up

- All Native Settings reset actions now resolve their shared Undo glyph to
  muted-foreground/80 (`.48` in the light theme), matching Electron's muted
  reset button plus shared SVG `0.8` opacity. This remains a single reusable
  `SettingsResetIcon` rather than per-panel overrides.
- The shared Settings test directly renders and checks the encoded `.48` stroke;
  all 6/6 assertions pass and the full production build passes on Lynxtron
  0.0.22. Dynamic hover stroke changes remain outside the claim because Native
  generated SVG content does not follow parent CSS color changes.
- Exact-owned PID `53122` / window `106464`, PID-derived `localhost:8901`, session
  1, rendered the real Appearance Theme reset glyph at
  `rgba(13, 13, 13, 0.48)` with an empty exact-client console. No screenshot was
  retained; staged bundle SHA-256:
  `1daa312c0fc158f88b65ac29cfe2085fd5e74c272c7b9ca1daadfe55b87be049`.

## Pull Request route Refresh icon follow-up

- Native Pull Requests header Refresh now resolves to the semantic secondary
  icon role at SVG render time, matching Electron's ghost IconButton default
  state rather than retaining full foreground. PR filter and status colors are
  unchanged.
- The focused route-controls suite passes 5/5 and the complete production build
  passes on Lynxtron 0.0.22. Exact-owned PID `72173` / window `106528`,
  PID-derived `localhost:8901`, session 1, rendered the real empty PR route and
  exposed the 16px Refresh SVG at `rgba(13, 13, 13, 0.598)` with an empty
  exact-client console. No screenshot was retained; staged bundle SHA-256:
  `99c2358b300158551546b79c222e448788380c132d235b42b8a2b0d7175c1834`.

## Profile action icon follow-up

- Native Profile action glyphs now preserve the two Electron Button hierarchies:
  Share/Edit and Upload use foreground source with `0.8` icon opacity, while
  Remove uses muted source with `0.8` opacity and a matching muted label. The
  profile's avatar, provider, status, and exported-card colors are unchanged.
- The focused Profile suite passes 5/5 and the complete production build passes
  on Lynxtron 0.0.22. Exact-owned PID `115` / window `106603`, PID-derived
  `localhost:8901`, session 1, exposed Share/Edit at encoded `#0d0d0d` plus
  computed `0.8` opacity and the real Edit-dialog Upload glyph at the same
  hierarchy. No saved avatar was present, so Remove remains source/test evidence.
  The exact-client console was empty, no screenshot was retained, and staged
  bundle SHA-256 is
  `7ab8a34b486c55e2c90c5b231e322a6be1c0dbec4bec74542cbfdc0790c6050a`.

## Project Action editor icon-role follow-up

- Native now matches the Electron Project Action icon picker's two-level
  hierarchy: the outline trigger uses foreground/80 at 18px, while all six raw
  picker options use full foreground at 16px. Generated SVG paint is resolved
  explicitly per role rather than inherited from a parent CSS color.
- The focused Project Action editor contract passes 1/1, and its stale textarea
  source assertion now follows the existing `nativeInput` contract. The complete
  Lynx/Desktop production build passes on Lynxtron 0.0.22.
- Exact-owned PID `37494` / window `106652`, PID-derived `localhost:8901`,
  session 1, physically opened the real Add Action dialog and picker. Native
  measured one trigger at encoded `rgba(13, 13, 13, 0.8)` with an 18px style and
  six options at encoded `#0d0d0d` with 16px geometry. Electron's live reference
  exposed the matching trigger and option hierarchy. The exact Native console
  was empty, no screenshot was retained, and staged bundle SHA-256 is
  `e65818085a6c68021d986e4b7b29e1b6dd28aa568d65d8cc8a77322cbe00a801`.

## Project Action picker geometry follow-up

- Native now preserves Electron's full Project Action picker rhythm: a 36px
  outline trigger, 4px anchor offset, 16px popup padding, and six 72×56px
  choices in a three-column grid with 8px gaps. The previous 28px trigger and
  248px popup forced the same six choices into a denser two-column layout.
- The focused Project Action editor contract passes 1/1 and directly locks the
  trigger size plus popup/option geometry. The complete Lynx/Desktop production
  build passes on Lynxtron 0.0.22.
- Exact-owned PID `71635` / window `106720`, PID-derived `localhost:8901`,
  session 1, physically opened the real Add Action dialog and picker. DevTool
  measured a 36×36 trigger and 232px grid content, with first-row option x
  positions 465/545/625 and a 64px row stride. The exact Native console was
  empty. Electron's live reference visibly exposed the same 36px / three-column
  composition and its authority source defines the same size, columns, padding,
  and gap. No screenshot was retained; staged bundle SHA-256 is
  `729857c0c213084f0745ac8bf2d77a9d5ad64a43814c926668aaa90b05e122f6`.

## Project Action auto-run row follow-up

- Native now matches Electron's auto-run row hierarchy: 12px horizontal padding,
  a 14px/20px label, and a 32×20px switch track with a 16×16px thumb. The previous
  row used 10px horizontal padding, 12px/18px type, and a 28×16px switch, making
  the control visibly denser than the authority.
- The focused Project Action editor contract passes 1/1 and locks both row type
  and control geometry. The complete Lynx/Desktop production build passes on
  Lynxtron 0.0.22.
- Exact-owned PID `99420` / window `106823`, PID-derived `localhost:8901`,
  session 1, rendered the open Add Action story and measured the label at 258×20
  with 14px/20px type, the track at 32×20, the thumb at 16×16, and 12px row
  padding. The exact Native console was empty. No screenshot was retained; staged
  bundle SHA-256 is
  `f2a1c03629c9bc1a8c4834032025164ca50c9dff7cfcafb1984c04af0970e521`.

## Project Action form typography follow-up

- Native Project Action labels, helper copy, and validation feedback now use the
  same three Electron type tiers: 12px/16px medium labels, 12px/16px muted hint,
  and 14px/20px destructive error. This removes the prior mixed 12px/18px and
  11px/16px Native treatment without changing field or footer geometry that
  already matches the authority.
- The focused Project Action editor contract passes 1/1 and locks all three
  roles. The complete Lynx/Desktop production build passes on Lynxtron 0.0.22.
- Exact-owned PID `11265` / window `106855`, PID-derived `localhost:8901`,
  session 1, rendered the error story and measured Name, Keybinding, and Command
  labels at 12px/16px, the hint at 12px/16px, and the validation error at
  14px/20px. Resolved colors matched foreground, muted foreground, and destructive.
  The exact Native console was empty. No screenshot was retained; staged bundle
  SHA-256 is
  `2322c400f5a2c24c1abacac4b7b88e59e3ed63b4be58597a70738d84f132aaf5`.

## Project Action dialog width follow-up

- Native now expresses Electron's 512px Project Action dialog as a supported
  fixed width plus viewport max-width. The earlier CSS `min()` declaration was
  ignored by the Native engine, causing a silent fallback to the shared 420px
  dialog width and compressing every field and footer row.
- The focused Project Action editor contract passes 1/1 and guards the supported
  width/max-width pair. The complete Lynx/Desktop production build passes on
  Lynxtron 0.0.22.
- Exact-owned PID `24998` / window `106887`, PID-derived `localhost:8901`,
  session 1, rendered the open story and measured a 510px content box plus two
  one-pixel borders: the intended 512px outer width. The exact Native console was
  empty. No screenshot was retained; staged bundle SHA-256 is
  `314229f9735563cafb51044988dc3cb26b0a8d53d384fc545241c63fd8128f38`.

## Shared Dialog description typography follow-up

- Native `DialogDescription` now uses Electron's shared 14px/20px muted text
  tier. The previous 12px declaration undersized every standard dialog that did
  not add a local override; the correction remains in the shared primitive rather
  than being repeated in Project Action or individual feature dialogs.
- The direct Dialog suite passes 11/11 and Project Action passes 1/1. A broad
  filename-matched Rstest invocation additionally found the existing generated
  `lynx-ui` vendor parse failure and stale AppSnap icon formatting assertion;
  neither is caused by this CSS change. The full production build passes on
  Lynxtron 0.0.22.
- Exact-owned PID `36818` / window `106917`, PID-derived `localhost:8901`,
  session 1, rendered `ui/dialog` title-description/open and measured the shared
  description at 14px/20px with muted foreground. The exact Native console was
  empty. No screenshot was retained; staged bundle SHA-256 is
  `4db0f79a3ee064b28320269731f0a3805838f7c7349283fb060366c7eeed30e2`.

## Shared Dialog header rhythm follow-up

- Native Dialog headers now use the same explicit 6px title-description gap as
  Electron's shared primitive. Removing the description's old 4px margin returns
  spacing ownership to the header and keeps title-only dialogs free of compensating
  child rules.
- The focused shared Dialog suite passes 11/11 and the complete Lynx/Desktop
  production build passes on Lynxtron 0.0.22.
- Exact-owned PID `49765` / window `106949`, PID-derived `localhost:8901`,
  session 1, rendered `ui/dialog` title-description/open. DevTool measured the
  title bottom at y=403 and description top at y=409, an exact 6px gap, with an
  empty Native console. No screenshot was retained; staged bundle SHA-256 is
  `327771d5a3284cf91ba78cd187b95070c3d6e0a0ded7582451387b5e15e485d1`.

## Shared Input size-inset follow-up

- Native Input now mirrors Electron's size axis instead of giving every field the
  same 10px horizontal inset: default is 12px, small remains 10px, and large is
  14px. Shared heights and 12px/16px default type were already aligned. Textarea
  keeps its separate component and dialog-specific inset rules.
- The focused Input suite passes 3/3 and the complete Lynx/Desktop production
  build passes on Lynxtron 0.0.22.
- Exact-owned PID `72043` / window `106977`, PID-derived `localhost:8901`,
  session 1, rendered `ui/input` and used the visible default/small/large controls.
  DevTool measured 32px/12px, 28px/10px, and 36px/14px respectively for
  min-height/horizontal inset. The exact Native console was empty. No screenshot
  was retained; staged bundle SHA-256 is
  `a9931468fb38a2bcd18a22b53f774746fee5db1ddcde04230e7eebbe11117a5d`.

## Shared Textarea size-axis follow-up

- Native Textarea now has an explicit multiline role and matches Electron's three
  sizes: default 70px with 11px/5px insets, small 66px with 9px/3px, and large
  74px with 11px/7px. The Components Lab's fixed 70px min-height was removed so
  it exposes rather than hides the shared size contract.
- Project Action keeps its intentional 96px command field and 10px horizontal
  inset. Focused Input and Project Action suites pass 5/5, and the complete
  Lynx/Desktop production build passes on Lynxtron 0.0.22.
- Exact-owned PID `87588` / window `107018`, PID-derived `localhost:8901`,
  session 1, switched the real `ui/textarea` story through default, small, and
  large. DevTool measured 70px/11px, 66px/9px, and 74px/11px for
  min-height/horizontal inset; the exact Native console was empty. No screenshot
  was retained; staged bundle SHA-256 is
  `6d2dd190272e8a70649d5d9fcefe4f8963479e938d0aa546a584e2b3ea51eb2f`.

## Shared Checkbox border follow-up

- Native Checkbox now uses Electron's quiet `--color-border-light` outline in
  the unchecked state. Selected and mixed states preserve their primary border
  and fill hierarchy. The declaration uses explicit width/style/color so the
  Native rule retains the variable-backed color.
- The focused Checkbox suite passes 3/3 and the complete Lynx/Desktop production
  build passes on Lynxtron 0.0.22.
- Exact-owned PID `37624` / window `107195`, PID-derived `localhost:8901`,
  session 1, rendered unchecked and checked states. The unchecked matched rule
  parsed the light-border token and aggregate computed border resolved to
  `hsla(0,0%,5%,.06)`; checked remained primary `#0d0d0d`. DevTool's per-side
  color serializer reports current color for the translucent token, so evidence
  uses the parsed rule and aggregate computed property. The exact Native console
  was empty and no screenshot was retained; staged bundle SHA-256 is
  `673e0c8b8e0e41838afa1a8656b2e166f3359dc3f8e668f9885e1ab27c53b25b`.

## Shared Alert typography follow-up

- Native Alert now preserves Electron's type hierarchy across sizes: default
  title/description are 14px/20px and compact alerts are 12px/16px. Existing
  padding, radius, semantic colors, and action geometry are unchanged.
- The focused Alert suite passes 2/2 and the complete Lynx/Desktop production
  build passes on Lynxtron 0.0.22.
- Exact-owned PID `85904`, PID-derived `localhost:8901`, session 1, rendered the
  default `ui/alert` story and measured both title and description at 14px/20px
  with foreground/muted-foreground colors. The catalog lacks a compact Alert
  case, so its 12px/16px tier is source/test evidence only. The exact Native
  console was empty and no screenshot was retained; staged bundle SHA-256 is
  `42531e6a36be6952f264fe6ea773c197e93455a9c152f1aaa464b680ad670756`.

## Shared Badge status-tone follow-up

- Native Badge now keeps Electron's distinct error/info/success/warning
  hierarchy. Theme-aware 8% light and 16% dark background tints are generated as
  concrete rgba values from the active Theme Pack; text keeps its semantic status
  color.
- A CSS `color-mix()` attempt was rejected by runtime evidence: Lynx DevTool
  parsed the rule but Native painted a transparent background. Computing the rgba
  in `useTheme()` preserves custom themes and gives the Native renderer executable
  paint.
- The focused Badge suite passes 2/2 and the complete Lynx/Desktop production
  build passes on Lynxtron 0.0.22. Exact-owned PID `36980` / window `107383`,
  PID-derived `localhost:8901`, session 1, rendered success with inline
  `#00a24014`, computed `rgba(0,162,64,0.0784314)`, and success text `#00a240`.
  Other status variants remain direct-render/source evidence because the catalog
  exposes success only. The exact Native console was empty and no screenshot was
  retained; staged bundle SHA-256 is
  `5b22014f0d9d4254e99c72329c7aca68d7bd2e32cdbf9b4aa1a6e0458dd54cd5`.

## Shared TimePicker initial-position follow-up

- Native TimePicker now presents its current hour and minute at the vertical
  center on first render, matching Electron. The shared column computes a
  one-shot pixel `initial-scroll-offset` from the selected index, option height,
  gap, content padding, and 176px viewport. This keeps scroll ownership on the
  container and avoids the failing child `scrollIntoView` path.
- The focused TimePicker suite passes 3/3, including 0/200/830 offset checks for
  values 0/9/30 and a source guard against `scrollIntoView`. The complete
  Lynx/Desktop production build passes on Lynxtron 0.0.22.
- Exact-owned PID `84722` / window `107467`, PID-derived `localhost:8901`, session
  1, rendered `ui/time-picker` with `09:30`. Each scroll column measured y=366–542
  and each selected row y=440–468, placing both selected centers exactly at the
  454px column center. The exact Native error/warning console was empty. No
  screenshot was retained; staged bundle SHA-256 is
  `acc31bc6212ba20d147d4daa8fc90e90ebb98959cfc0240bdb7380293e02d54f`.

## Shared Skeleton loading-material follow-up

- Native Skeleton now has Electron's animated highlight hierarchy instead of a
  static muted rectangle with an extra 0.45 opacity. Both renderers use a 2s
  linear sweep starting at -1s, 64% white highlight in light, 4% white in dark,
  and the shared muted base; Native disables the overlay under reduced motion.
- Official Lynx CSS metadata marks `background-position` non-animatable on every
  platform, while gradients and transform keyframes are supported on Clay macOS.
  The Native primitive therefore translates a clipped gradient child rather than
  duplicating Electron's background-position implementation.
- The focused loading suite passes 2/2 and the complete production build reports
  6/6 tasks successful on Lynxtron 0.0.22. Exact-owned light PID `18413` and dark
  PID `49111`, both PID-derived `localhost:8901`, session 1, showed the real
  transform sweep: light x=509→629→754 and dark x=877→416 across a loop boundary.
  Dark computed style resolved `#ffffff0a` with a running animation; both exact
  Native consoles were empty. No screenshot was retained; staged bundle SHA-256
  is `f6322581960fd00497d2e1d1dbbfaf0227138ba5f9561ae6d7cd6c1ba9fd256d`.

## Shared Spinner motion follow-up

- Native Spinner retains the catalogued platform substitution—CSS ring instead
  of Electron's Loader2 path—but now restores the essential loading rotation. It
  matches Electron's 1s linear infinite cadence and disables animation for
  reduced motion. Existing 12px/16px size variants and semantic status labeling
  are unchanged.
- The focused loading suite passes 2/2 and the complete production build reports
  6/6 tasks successful on Lynxtron 0.0.22. Exact-owned PID `62777` / window
  `107597`, PID-derived `localhost:8901`, session 1, rendered the default story at
  a 16px outer diameter. DevTool resolved a running 1000ms linear infinite
  `LxSpinnerSpin` keyframe with foreground ring paint and a transparent right
  segment. The exact Native console was empty. No screenshot was retained; staged
  bundle SHA-256 is
  `48dcf5623cb50a6de82f5ffac52589dc301803d8cdf657cfe486d39ed967b597`.

## Shared Collapsible motion follow-up

- Native `CollapsiblePanel` now uses the same centralized disclosure helpers as
  other Native sections and Electron's shared Collapsible primitive. Open/close
  therefore follows the 220ms ease-out transform/opacity contract instead of an
  immediate mount/unmount, and the existing presence hook owns the 40ms cleanup
  buffer plus reduced-motion behavior.
- Focused Collapsible and motion suites pass 5/5; the complete production build
  reports 6/6 tasks successful on Lynxtron 0.0.22. Exact-owned PID `88604` /
  window `107625`, PID-derived `localhost:8901`, session 1, exposed the open
  panel as `LynxDisclosureMotion--open`; a real trigger click removed it after
  the shared cleanup window. The exact Native console was empty. No screenshot
  was retained; staged bundle SHA-256 is
  `299de57e70abb652f0ed2ccb959bb9f8bc0e43d7eba3c932fe0dfdf6e59171fa`.

## Shared Alert semantic-surface follow-up

- Native Alert now mirrors Electron's error/info/success/warning surface system:
  every semantic role owns a 4% background tint and 32% border tint. The former
  Native rules used generic secondary fill for all four roles and provided no
  semantic border for info, success, or warning.
- Theme-aware concrete rgba values are derived beside Badge status surfaces, so
  custom themes remain supported without relying on Native `color-mix()` paint.
  Alert and Badge focused suites pass 5/5; the complete production build reports
  6/6 tasks successful on Lynxtron 0.0.22.
- Exact-owned PID `6142` / window `107662`, PID-derived `localhost:8901`, session
  1, rendered success with computed `rgba(0,162,64,0.0392157)` background and
  `rgba(0,162,64,0.317647)` border while retaining 14px/20px medium title type.
  The exact Native console was empty. No screenshot was retained; staged bundle
  SHA-256 is `3b6ec3854aa7c2865d1a74f5c985ee226c993fd1dddbfb7142d9f76c8fdba5fd`.

## Shared Menu and Command auxiliary-copy follow-up

- Native Menu group labels now match Electron's section-heading tier: 12px/16px
  regular text, 8×6px insets, and 45% secondary opacity. Native Menu shortcuts
  use the separate 10px medium tier with 1px tracking, 72% muted opacity, and
  trailing auto alignment. The former combined Native rule rendered both roles
  as full-strength 10px muted text.
- Focused Menu and Command suites pass 32/32; the complete production build
  reports 6/6 tasks successful on Lynxtron 0.0.22. Existing component-specific
  group-label overrides continue to win through later, more-specific selectors.
- Exact-owned PID `22902` / window `107694`, PID-derived `localhost:8901`, session
  1, measured the Actions label at 12px/16px, weight 400, 8×6px inset, opacity
  0.45, and ⌘N at 10px, weight 500, 1px tracking, opacity 0.72. The exact Native
  console was empty. No screenshot was retained; staged bundle SHA-256 is
  `b1cdce27247d4de6141ef9487f46ef4fef81df4e04bb587ecc73ae08af01b7bf`.

## Shared Command shortcut scale follow-up

- Command shortcut text now preserves Electron's `text-xs` 12px scale and 0.1em
  tracking separately from Menu's custom 10px role. It retains the 72% muted
  opacity, medium weight, and trailing auto alignment restored in DS-059.
- Focused Menu and Command suites pass 32/32 and the affected Lynx/Desktop build
  passes on Lynxtron 0.0.22. Exact-owned PID `33644` / window `107722`,
  PID-derived `localhost:8901`, session 1, measured 12px, weight 500, 1.2px
  tracking, and opacity 0.72 with an empty Native console. No screenshot was
  retained; staged bundle SHA-256 is
  `25e1173c404bb309f4cc5c82209c5d417360187bf83e8d476af7a99aef4aa1be`.

## Shared Tooltip motion follow-up

- Native Tooltip now enters and exits through the same centralized 220ms
  transform/opacity disclosure contract as other toggle surfaces. The previous
  primitive declared bespoke `ui-entering/ui-leaving` selectors but never emitted
  either class, so runtime behavior was an immediate mount/unmount.
- Focused Tooltip, disclosure-motion, and geometry suites pass 9/9 and the
  affected Lynx/Desktop production build passes on Lynxtron 0.0.22. Exact-owned
  PID `46129` / window `107750`, PID-derived `localhost:8901`, session 1, opened
  the popup through its real trigger with `LynxDisclosureMotion--open` and removed
  it after the shared cleanup window on the second click. The exact Native console
  was empty. No screenshot was retained; staged bundle SHA-256 is
  `28dda140331a399efde1e68e8c0a8d43027fa90210e9a63a7a83cb0ab965d201`.
