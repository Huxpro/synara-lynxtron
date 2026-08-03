# P9-U5 Composer fidelity convergence plan

Status: in progress — Phases 0–1 completed

## Goal prompt

```text
继续以 comparison 页面作为常态迭代和验收工具，完成 Synara Web Composer 到
Lynx/Lynxtron Composer 的细节状态收敛。

当前 Composer 的功能链路大体可用，但 comparison 证据不严格，且 Project picker、
Extras primitives、skill/mention command menu、selected rich tokens 仍存在明显的
Web/Lynx 产品差距。

本 goal 必须按以下顺序推进：

1. 先重建 Composer comparison 状态矩阵。每个 cell 必须是同一 snapshot、route、
   theme、viewport、draft、project、Plan/Fast 状态；禁止复用不同组合态截图，禁止用
   Browser pass 冒充 Native pass。
2. 收敛 Project picker。Web 与 Lynx 必须共享搜索、分组、selected/reset、New project、
   loading/error/empty anatomy；Native 只保留 input/list/filesystem host adapter。
3. 收敛 Extras menu primitives。对齐 icon、Plan switch、Fast submenu、selected state、
   popup geometry；Add image 与 Add files 可作为明确的平台能力差异，但不能导致其余
   anatomy 分叉。
4. 收敛 skill/mention command menu visual adapter。去掉 `$`、`@`、`/` 文本占位，
   映射真实 icons，对齐 row typography、description、scope/meta、group labels、
   highlight、loading/empty 和 resolved theme。
5. 单独设计 selected skill/mention token convergence。Native UI 只能显示一次语义 token，
   不得同时显示 chip 和 provider canonical raw text；发送 payload 仍必须保留 canonical
   provider text及 structured skills/mentions references。
6. 每完成一个 coherent slice，更新 comparison、保存 paired Web/Lynx evidence，
   运行 focused tests与相应 production builds，独立 commit并立即 push。

完成标准：

- 严格 Composer 状态矩阵全部有有效 Web/Lynx paired evidence。
- Native-required状态有 exact-owned Lynxtron evidence、PID-derived DevTool identity和
  clean console；Native keyboard shortcut不属于本 goal。
- Project picker和Extras不再有独立的普通 anatomy owner。
- skill/mention menu不再使用文本 glyph占位。
- selected skill/mention在编辑器中只显示一次，clear/undo/redo/send/restart后structured
  context正确。
- comparison中不存在 stale metadata、错误状态配对或“Native batch pending”但已有证据
  未回填的情况。
- 零未登记重大视觉/行为差异。

不要进入 terminal、browser、PDF、voice等 hard islands；不要把 Native keyboard
shortcut认证重新纳入本 goal。
```

## Problem statement

The existing Composer work closed functional delivery and outer geometry, but
did not finish detailed UI/UX convergence.

There are three separate classes of issues:

1. **Evidence quality**
   - Composer comparison cells were assembled from multiple ad-hoc runs.
   - Some Web/Lynx/Native images represent different Plan/Fast combinations.
   - Existing Native frames were not backfilled into their original cells.
   - Generic labels such as `Tokens cleared` represent only one token type.

2. **Ordinary UI divergence**
   - The Lynx project picker is a hand-written two-item menu instead of the Web
     searchable, grouped project/folder picker.
   - Extras share composition state, but native icons, switch anatomy, submenu
     behavior, and visual treatment remain simplified.
   - Skill/mention command rows use text glyph placeholders and separate CSS.

3. **Editor platform boundary**
   - Web uses Lexical inline atomic tokens.
   - Lynx renders a separate chip row and keeps canonical provider text in the
     textarea.
   - Users see the same semantic reference twice.

The first two classes are not blocked by Native keyboard delivery. The third
requires an explicit display-text versus canonical-send-text architecture.

## Scope

### In scope

- Empty landing Composer and project-scoped empty draft Composer.
- Composer extras menu.
- Plan and Fast states.
- Project picker.
- Skill command menu and selected/cleared skill state.
- Thread mention command menu and selected/cleared mention state.
- Composer comparison schema, evidence, notes, and assertions.
- Native pointer, popup, host dialog, persistence, and textarea semantics where
  required by a state.

### Out of scope

- Native Command K keyboard shortcuts.
- General Tab/Arrow/Enter/Escape host-input repair.
- Terminal, browser, PDF, voice recording, or other hard islands.
- Transcript, Markdown, Settings, Kanban, or Pull Request redesign.
- Unrelated cleanup or speculative design-system replacement.

## Design authority

- Web original is the composition and visual authority.
- Correct product behavior outranks an accidental Web bug.
- Lynx-for-Web is the fast iteration surface.
- Exact-owned Lynxtron is required for Native textarea, host dialog, popup,
  persistence, and platform semantics.
- Existing shared Composer compositions remain the preferred ownership model.
- New ordinary anatomy must not be duplicated between Web and Lynx.

## Strict state matrix

Every retained state must record:

- build hash;
- snapshot hash;
- route;
- theme;
- viewport and DPR;
- selected project/workspace;
- interaction mode;
- Fast state;
- exact input value and caret state when relevant;
- expected structured skills/mentions;
- Web/Lynx/Native applicability;
- console result;
- screenshot dimensions.

### Baseline and extras

| State | Web | Lynx Web | Native | Required assertion |
|---|---:|---:|---:|---|
| Empty landing default | yes | yes | batch | no popup; empty draft |
| Extras open, Plan off, Fast default | yes | yes | yes | exact menu items and selected states |
| Plan on, Fast default | yes | yes | yes | Plan checked only |
| Plan off, Fast on | yes | yes | yes | Fast selected only |
| Plan on, Fast on | yes | yes | optional diagnostic | both selected; never substitute for either single-mode cell |
| Attachment action | yes | capability-specific | yes | Web image picker vs Native Add files host action |

### Project picker

| State | Web | Lynx Web | Native | Required assertion |
|---|---:|---:|---:|---|
| Empty trigger | yes | yes | yes | `Work in a project` |
| Open default | yes | yes | yes | same groups, rows, footer actions |
| Search filtered | yes | yes | Native if input semantics changed | same query and result order |
| Project selected | yes | yes | yes | same workspace basename and selected indicator |
| Selected menu open | yes | yes | yes | selected row plus reset |
| Reset | yes | yes | yes | returns to empty trigger |
| Loading | yes | yes | focused test acceptable if deterministic product capture is impractical | same state copy |
| Empty/no match | yes | yes | Browser tier | same state copy |
| Error/retry | yes | yes | host/RPC boundary if applicable | actionable error and recovery |

### Skills

| State | Web | Lynx Web | Native | Required assertion |
|---|---:|---:|---:|---|
| `$` trigger | yes | yes | if native input touched | same provider catalog |
| Filtered query | yes | yes | batch | same result order and metadata |
| Selected skill | yes | yes | yes after token convergence | one visible semantic token |
| Cleared skill | yes | yes | yes after token convergence | no visible token and no structured skill |
| Undo/redo | focused product test | focused product test | Native batch | token and structured context move together |
| Send projection | canonical RPC/read-only DB verification | same | same | canonical provider text plus structured reference |
| Restart persistence | Web reload | Lynx reload | exact-owned restart | draft display and context restore together |

### Mentions

| State | Web | Lynx Web | Native | Required assertion |
|---|---:|---:|---:|---|
| `@` trigger | yes | yes | if native input touched | same thread candidates |
| Filtered query | yes | yes | batch | same title/project/meta |
| Selected mention | yes | yes | yes after token convergence | one visible semantic token |
| Cleared mention | yes | yes | yes after token convergence | no visible token and no structured mention |
| Undo/redo | focused product test | focused product test | Native batch | token and structured context move together |
| Send projection | canonical RPC/read-only DB verification | same | same | quoted canonical token plus `thread://` reference |
| Restart persistence | Web reload | Lynx reload | exact-owned restart | draft display and context restore together |

## Phase 0 — Repair the comparison contract

Status: completed

### Tasks

1. Replace loose Composer cases with a data-driven state manifest.
2. Give every cell an explicit state descriptor:
   - `plan`;
   - `fast`;
   - `project`;
   - `draft`;
   - `tokenKind`;
   - `tokenState`;
   - `client`;
   - `captureTier`.
3. Reject invalid evidence when:
   - Plan/Fast state differs between clients;
   - screenshot dimensions do not match;
   - a referenced image is from an older build;
   - Native evidence is missing for a Native-required state;
   - a combined state is reused for a single-state cell.
4. Backfill existing exact Native frames:
   - extras open;
   - Plan on;
   - Fast on only after a dedicated Fast-only capture;
   - project open;
   - project selected;
   - project reset.
5. Split ambiguous cells:
   - `Tokens cleared` → `Skill cleared` and `Mention cleared`;
   - `Fast mode on` must not reuse `Plan on + Fast on`.

### Gate

- Every Composer comparison row is either a valid like-for-like pair/triple or
  explicitly marked not applicable with a named platform reason.
- No `Native batch pending` text remains when valid Native evidence exists.

### Result

- `shots/2026-08-03/p9-u5-composer/manifest.json` is now the only Composer
  evidence source consumed by the repository comparison gallery.
- `apps/lynx/scripts/composer-evidence.mjs` validates state descriptors,
  required clients, real PNG bytes/dimensions, build/snapshot/assertion/console
  metadata, and exact state echoes.
- Strict mode exits `2` while required cells are incomplete; diagnostic write
  mode generates the offline `manifest.js`.
- The previous hand-written Composer cases were removed from
  `p8-q2/comparison.html`.
- The manifest defines 23 strict states and currently reports 55 incomplete
  required client cells. Legacy captures remain visible only as `diagnostic`.
- Prior DevTool JPEG bytes with `.png` names are not accepted directly.
  Exact Native project and combined Plan/Fast evidence was normalized to real
  PNG before being retained.

## Phase 1 — Project picker convergence

Status: completed

### Root cause

Web owns a full `ProjectPicker` with:

- searchable combobox;
- active project/folder grouping by Space;
- local folder discovery;
- selected indicator;
- add/new project action;
- reset action;
- loading, empty, no-match, and error states.

Lynx owns a separate menu in `LandingComposer.lynx.tsx` with only:

- reset;
- flat project list.

### Implementation direction

1. Extract a physical-shared `ComposerProjectPickerComposition`.
2. Shared source owns:
   - trigger label;
   - search query;
   - grouping and order;
   - selected state;
   - loading/empty/error copy;
   - footer action ordering;
   - selection/reset/add intents.
3. Platform Elements own:
   - Web Base UI Combobox primitives;
   - Lynx input/list/menu primitives;
   - Web file picker dialog port;
   - Native filesystem/host folder picker port;
   - platform icons only.
4. Delete the ordinary picker anatomy from
   `LandingComposer.lynx.tsx`.
5. Reuse existing `groupItemsBySpace`, project label, and filesystem browse
   logic rather than recreating it in the adapter.

### Acceptance

- Search, selected, reset, new project, loading, empty, and error states match.
- No second ordinary project-picker anatomy owner remains.
- Project selection still controls first-send project/model/workspace.
- Web behavior does not regress.

### Result

- Added physical-shared `ComposerProjectPickerComposition`, pure project/folder
  grouping and footer-state models, and Web/Lynx Elements adapters.
- Web workspace-root and project-selection modes now consume the shared
  composition. Lynx landing consumes the same source and no longer owns
  `MenuItem`/`MenuPopup` project-picker anatomy.
- Both clients expose the same search, Space/Void/local-folder groups,
  selected indicator, `New project`, `Don't work in a project`, no-match,
  loading, error, and explicit Retry anatomy.
- Lynx now uses filesystem browse results instead of a flat project-only menu,
  filters hidden directories, preserves the shared group order, creates a
  project from a selected local folder, and surfaces browse failures rather
  than silently replacing them with an empty list.
- Native adapter geometry was calibrated to the Web authority:
  - `288×258` popup;
  - `26px` option rows;
  - `28px` group labels;
  - matching horizontal origin;
  - native SVG icons instead of Space text glyphs.
- Real rendered controls verified open, search, no-match, project selection,
  selected-menu indicator, and reset on Web and Lynx-for-Web. Closed-shadow
  Lynx controls were exercised through real CDP pointer events, not direct
  state mutation.
- Seven stable states now have retained paired Browser evidence under
  `shots/2026-08-03/p9-u5-composer/browser/project-picker/`, covering 14
  required cells. The strict baseline moved from 55 to 41 incomplete required
  cells.
- Loading and error/retry are covered by deterministic shared-model tests but
  remain truthfully pending in the screenshot manifest. The dedicated
  selected-menu Native frame remains pending for the final Native batch.
- Focused gates:
  - shared Web logic/composition: 7/7;
  - ChatView project-picker Browser subset: 3/3;
  - Lynx landing ownership contract: 1/1;
  - Web and Lynx-for-Web production builds green.

## Phase 2 — Extras primitive parity

Status: completed

### Root cause

State/order are shared, but the native adapter replaces important visual
semantics:

- plus SVG → text `+`;
- paperclip icon → plain `Add files`;
- Plan switch → trailing check;
- independent Fast submenu → inline fallback;
- shared picker tokens → separate fixed native CSS.

### Tasks

1. Map generated native icons for Plus, attachment, Plan, and Fast.
2. Add a native switch-style checkbox variant matching Web Plan anatomy.
3. Implement a real independently positioned native submenu for Fast.
4. Consume shared picker radius, spacing, row-height, border, and color tokens.
5. Preserve the capability distinction:
   - Web: `Add image`;
   - Native: `Add files`;
   - disabled/unavailable states remain explicit.
6. Capture dedicated Plan-only and Fast-only Native states.

### Acceptance

- Menu geometry and row anatomy are like-for-like.
- Plan and Fast selected states are visually unambiguous.
- No combined-state screenshot substitutes for a single-state cell.

### Result

- Replaced the Lynx `+` and plain-text attachment/Plan/Fast treatments with
  generated native SVG icons.
- Extended the shared Lynx menu primitive with:
  - a switch-style checkbox track/thumb variant;
  - checkbox activation that keeps the parent menu open;
  - an independently positioned submenu surface;
  - native SVG radio indicators.
- Removed the first-slice inline Fast fallback. `Default` and `Fast` now render
  in a separate `128×64` submenu beside the main surface.
- Calibrated the Lynx Extras geometry against measured Web production output:
  - main popup `142×108` versus Web `141.42×106`;
  - `26px` main rows on both clients;
  - Fast popup `128×64` versus Web `128×62`;
  - `26px` Fast rows on both clients.
- Preserved the explicit capability delta:
  - Web `Add image`;
  - Native/Lynx `Add files`.
- Real rendered controls produced dedicated paired Browser evidence for:
  - Plan off / Fast default;
  - Plan on / Fast default;
  - Plan off / Fast on;
  - Plan on / Fast on.
  No combined state was reused for either single-mode state.
- Eight required Browser cells moved to retained evidence. The strict manifest
  moved from 41 to 33 incomplete required cells.
- Native Extras default, Plan-only, and Fast-only remain pending for the final
  exact-owned batch. Attachment host-dialog certification remains separate and
  was not inferred from a visible menu item.
- Focused gates:
  - Lynx menu primitive and Extras adapter: 9/9;
  - Web shared composition: 3/3;
  - Web Extras Browser behavior: 3/3;
  - Web and Lynx-for-Web production builds green.

## Phase 3 — Skill and mention menu visual convergence

### Root cause

`ComposerCommandMenuComposition` shares grouping and selection intent, but the
Lynx Elements adapter replaces real icons with text glyphs and uses a separate
typographic system.

### Tasks

1. Replace `$`, `@`, `/`, and `◉` placeholders with generated native icons.
2. Pass the actual resolved theme; remove hard-coded
   `resolvedTheme="light"`.
3. Match:
   - surface radius/border/fill;
   - menu width and max height;
   - row height and padding;
   - title weight/size;
   - secondary description;
   - trailing scope/project metadata;
   - group labels and separators;
   - active/hover/focus state.
4. Verify long descriptions and trailing metadata do not collide.
5. Preserve shared item ranking and structured selection logic.

### Acceptance

- Skill and mention menus read as the same product at a glance.
- Real provider/project/file/skill icon semantics are preserved.
- No text-glyph placeholders remain in ordinary rows.
- Light and dark resolved themes render correctly.

## Phase 4 — Selected token architecture

### Root cause

Web's Lexical editor stores and displays inline atomic tokens. Lynx's native
textarea must keep plain text, so the current implementation:

1. inserts provider canonical text into the textarea;
2. stores structured references;
3. renders an additional chip row.

This exposes the same semantic token twice.

### Architecture direction

Introduce an explicit native draft projection:

```ts
interface NativeComposerDraftProjection {
  readonly displayText: string;
  readonly displayTokens: readonly ComposerDisplayToken[];
  readonly canonicalText: string;
  readonly mentions: readonly ProviderMentionReference[];
  readonly skills: readonly ProviderSkillReference[];
}
```

Rules:

- The editor surface displays `displayText` and inline/overlay token positions.
- Provider dispatch consumes `canonicalText`.
- Structured references remain first-class.
- Editing operations update display and canonical projections atomically.
- Never infer structured references solely by reparsing visible text after
  selection.

### Candidate implementation

1. Keep native `<textarea>` as the platform input island.
2. Render token overlays in the editor flow rather than a separate preview
   row.
3. Maintain stable token spans/ranges in display coordinates.
4. Convert display ranges to canonical provider text only at draft projection
   and send boundaries.
5. Define deterministic behavior for:
   - caret before/after token;
   - Backspace/Delete;
   - selection across token;
   - paste;
   - undo/redo;
   - IME composition near token;
   - clear;
   - reload/restart.

### Required tests

- select skill/mention;
- clear token;
- Backspace on either side;
- selection deletion;
- undo/redo;
- append normal text;
- multiple tokens;
- duplicate selection;
- send payload;
- failed send retains token;
- successful send clears token;
- restart persistence;
- IME adjacent to token.

### Acceptance

- Each selected skill/mention is visible exactly once.
- No provider canonical syntax leaks into the visible editor.
- Canonical dispatch and structured references remain correct.
- Token operations are predictable under failure and restart.

## Phase 5 — Native certification batch

Run only after all Browser paired states pass.

### Preflight

- complete Web/Lynx/Desktop production build;
- staged bundle path and SHA-256;
- shared snapshot and SHA-256;
- isolated Native state and original user-state backup/hash;
- exact-owned PID;
- PID-derived DevTool client/session;
- `1280×820` outer bounds;
- clean baseline console.

### Batch order

1. Default landing.
2. Extras default.
3. Plan-only.
4. Fast-only.
5. Project open.
6. Project selected.
7. Project reset.
8. Skill menu.
9. Skill selected.
10. Skill cleared.
11. Mention menu.
12. Mention selected.
13. Mention cleared.
14. Restart persistence for selected tokens.

### Gate

- Exact state assertions accompany every retained Native frame.
- Error/warning console is empty.
- User state restores byte-for-byte.
- Owned processes and ports are released.
- No Native keyboard-shortcut claim is made.

## Test and build gates

### Focused tests

- Shared Project picker composition and adapters.
- Extras menu and native submenu/switch primitives.
- Command menu Elements and icon/theme mapping.
- Native draft projection and token editing.
- Composer dispatch payload.
- Landing first-send project/Plan/Fast projection.

Use:

```bash
bun run test -- <focused Web tests>
bun run test:browser -- <focused Web browser tests>
bun run test -- <focused Lynx tests>
```

Never use `bun test`.

### Production builds

At coherent slice boundaries:

```bash
bun run --cwd apps/web build
bun run --cwd apps/lynx build:web
bun run --cwd apps/lynx build
```

Do not run `bun fmt`, `bun lint`, or `bun typecheck` unless explicitly asked
in the current conversation.

## Evidence layout

```text
shots/<date>/p9-u5-composer/
  manifest.json
  notes.md
  browser/
    <state>/
      web.png
      lynx.png
      web-assertions.json
      lynx-assertions.json
      web-console.txt
      lynx-console.txt
  native/
    <state>/
      native.png
      assertions.json
      console.txt
  comparison.html
```

The repository-wide comparison page should import this manifest rather than
manually duplicating each Composer case.

## Commit strategy

Use independent commits and push immediately after each:

1. `test(composer): enforce strict comparison states`
2. `refactor(composer): share project picker composition`
3. `refactor(composer): align extras menu primitives`
4. `refactor(composer): align skill and mention menus`
5. `feat(composer): project native inline tokens`
6. `test(composer): certify detailed composer states`

Every commit message must end with:

```text
Co-authored-by: TRAE CLI <noreply@bytedance.com>
```

## Completion audit

Before marking the goal complete:

1. Map every state in the strict matrix to current evidence.
2. Verify each comparison cell uses the exact intended state.
3. Confirm every required Web/Lynx/Native image exists and matches dimensions.
4. Confirm assertions cover Plan, Fast, project, draft, and token state.
5. Confirm Project picker ordinary anatomy has one shared owner.
6. Confirm command rows contain no text-glyph placeholders.
7. Confirm selected tokens display exactly once.
8. Confirm canonical send payload and structured references.
9. Confirm focused tests and production builds.
10. Confirm clean consoles, restored state, released processes/ports.
11. List all intentional platform differences.
12. Treat any uncertain or weakly evidenced row as incomplete.
