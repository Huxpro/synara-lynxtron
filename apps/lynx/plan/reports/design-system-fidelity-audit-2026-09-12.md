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
- Existing strengths: 46 paired real-component stories, 92 renderer mappings,
  3,144 meaningful cases, zero missing primitive counterparts, and broad
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
- Exact-owned Lynxtron 0.0.22 runtime checks on staged bundle
  `72b48d964334c81178559ded6d80f716d6d15d905131487f79782cdc837f8e03`
  confirm prominent disabled paint at 0.2 opacity, resolved light input-focus
  border `hsla(0,0%,5%,.3)`, and dark picker-tooltip geometry `110x27`
  versus Electron `111x26.5`; all retained Native console checks were clean.
