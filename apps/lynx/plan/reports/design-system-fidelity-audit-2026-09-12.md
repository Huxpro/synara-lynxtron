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
