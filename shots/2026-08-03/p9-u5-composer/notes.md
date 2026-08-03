# P9-U5 Composer fidelity evidence

Status: Phases 0–1 complete; later Composer slices pending

## Contract

`manifest.json` is the only Composer evidence source consumed by the
repository comparison gallery. `manifest.js` is generated for offline
`file://` viewing:

```bash
bun run --cwd apps/lynx evidence:composer:write
```

Strict completion remains red until every required client cell is retained:

```bash
bun run --cwd apps/lynx evidence:composer
```

The verifier checks:

- unique state ids;
- explicit route/theme/viewport/project/Plan/Fast/draft/caret/token state;
- required versus optional clients;
- retained/diagnostic/pending/not-applicable status;
- a reason for every non-retained state;
- real PNG bytes and dimensions;
- build and snapshot hashes for retained evidence;
- assertion and console files;
- state echo equality, preventing combined Plan/Fast evidence from being
  reused for a single-mode state.

## Phase 0 baseline

- 23 strict Composer states.
- 55 required client cells are intentionally incomplete.
- Legacy Browser captures are diagnostic, not passing evidence, because they
  did not record exact production build hashes and full state assertions.
- The prior DevTool files used JPEG bytes with `.png` names. Exact Native
  project and combined Plan/Fast frames were normalized into real PNG files
  under `native/normalized/`; the original bytes remain unchanged.
- The old hand-written Composer cases were removed from
  `p8-q2/comparison.html`. The gallery now loads Composer states only from the
  generated manifest.

This red baseline is intentional. Later P9-U5 slices replace diagnostic and
pending entries with like-for-like retained Web, Lynx-for-Web, and exact-owned
Native evidence.

## Phase 1 Project Picker

- Web and Lynx-for-Web consumed the same isolated snapshot:
  `98753f94c2df90724d0a892353c03bf2fba50bb880de6d9db012f1266f606070`.
- Evidence builds:
  - Web:
    `647bb96161b34e9b01afcf44a639c5043e5f1cdc43691694136c5ee8c115046b`
  - Lynx-for-Web:
    `7aa750966e51fe225c11fdb40cbff0181fc2698009b81efbf761ade8127c99ea`
- Both named Browser sessions used `1280×820`, DPR 1, light theme, empty draft,
  default interaction mode, and Fast off.
- Seven states have retained paired evidence:
  - empty;
  - open;
  - filtered search (`spike`);
  - no match (`spike-missing`);
  - selected;
  - selected menu open;
  - reset.
- The open state measured the same `288×258` popup, `26px` option row,
  Space/Void/local-folder group order, and footer actions on both clients.
- Web uses a canonical local draft UUID route while Lynx-for-Web uses
  `/lynx/`; assertions record both actual routes and the shared semantic route
  `new-chat` rather than pretending the literal URLs are identical.
- Lynx closed-shadow controls were exercised through real CDP pointer events.
  Query reset used the rendered close/reopen path. No React state or SQLite
  fixture was mutated directly.
- Fresh Web and Lynx-for-Web console buffers contained no page errors. The
  per-state Lynx console files name the known upstream deprecated
  initialization warning.
- Loading and error/retry anatomy are covered by focused deterministic shared
  model tests but remain pending in the screenshot manifest. Native selected
  menu open remains pending for the final exact-owned batch.
- Strict status after Phase 1: 41 incomplete required cells, down from 55.

## Phase 2 Extras

- Shared snapshot and Browser cell contract remained unchanged.
- Evidence builds:
  - Web:
    `647bb96161b34e9b01afcf44a639c5043e5f1cdc43691694136c5ee8c115046b`
  - Lynx-for-Web:
    `ac70d431e030250fce84bbd14a3c6c025fc19f75050b52933326e79221da7646`
- Four independent paired states are retained:
  - Plan off / Fast default;
  - Plan on / Fast default;
  - Plan off / Fast on;
  - Plan on / Fast on.
- The measured main surfaces are `141.42×106` on Web and `142×108` on
  Lynx-for-Web, with `26px` rows on both.
- The measured Fast submenus are `128×62` on Web and `128×64` on
  Lynx-for-Web, with `26px` rows on both.
- Lynx uses native SVG icons, a switch track/thumb, and an independently
  positioned submenu. The submenu is absent until the rendered Fast trigger is
  activated.
- Capability copy remains intentionally different: Web `Add image`, Lynx and
  Native `Add files`.
- State was restored through rendered controls to Plan off / Fast default.
  Fresh console buffers were empty and the snapshot hash remained unchanged.
- Native default, Plan-only, Fast-only, and host attachment dialog evidence
  remain pending for the final exact-owned batch.
- Strict status after Phase 2: 33 incomplete required cells.

## Phase 3 Command Menus

- Evidence builds:
  - Web:
    `647bb96161b34e9b01afcf44a639c5043e5f1cdc43691694136c5ee8c115046b`
  - Lynx-for-Web:
    `68962ea84de383b0d758dc8d83b8dd270145e6a56f1e0d6bef66f5d21f61337c`
- Four paired states are retained:
  - full skill trigger;
  - filtered skill query `review-agent`;
  - full mention trigger;
  - filtered mention query `Progress`.
- Both full skill menus contained 114 rows. Every Lynx row rendered a generated
  SVG icon; no legacy trigger-character glyph node remained.
- The filtered skill result order matched exactly:
  `review-agent`, `review-bugbot`, `review-security`, `review`.
- The common mention candidates matched in order. Web additionally exposes
  Local and Subagents platform capabilities; Lynx does not invent unavailable
  actions.
- `@Progress` resolved to the same single `In Progress seed task` row.
- Command surfaces measured `724×288` on Web and `726×288` on Lynx-for-Web,
  with `28px` rows on both.
- Lynx-for-Web selection injection does not reliably publish Meta+A to the
  ReactLynx input thread. For the final mention filter only,
  `setSelectionRange` established the exact selection; Backspace and typing
  still exercised rendered keyboard events. Product state was cleared after
  capture.
- Web console was clean. Lynx-for-Web had only the named upstream deprecated
  initialization warning.
- Selected and cleared token evidence remains pending for Phase 4.
- Strict status after Phase 3: 25 incomplete required cells.

## Phase 4 Tokens

- Evidence builds:
  - Web:
    `647bb96161b34e9b01afcf44a639c5043e5f1cdc43691694136c5ee8c115046b`
  - Lynx-for-Web:
    `5c1719a2c70171ae07dc6507d86005b37065e833202c884e0b9b89002433572e`
- Four paired states are retained:
  - selected skill;
  - cleared skill;
  - selected mention;
  - cleared mention.
- A selected Lynx token appears once in the interleaved visual overlay. The
  native textarea contains one invisible `U+2063` anchor plus ordinary
  spacing; canonical provider syntax is not visible.
- The host-backed draft record persists canonical text and structured refs:
  - `/review-agent ` plus one skill reference;
  - `@"In Progress seed task" ` plus one `thread://` mention reference.
- Full Lynx-for-Web reload restored chip and anchor together. Backspace removed
  the anchor, chip, canonical token, structured ref, and persisted projection
  together.
- Pure tests cover multiple and duplicate tokens, ordinary text edits,
  Backspace, selection deletion, selection mapping, IME-adjacent edits,
  persistence parsing, history, and canonical dispatch shape.
- Native input, IME, selection, undo/redo, failed-send retention, successful
  send clearing, RPC/DB projection, and cold restart remain for the exact-owned
  batch.
- Strict status after Phase 4: 17 incomplete required cells.
