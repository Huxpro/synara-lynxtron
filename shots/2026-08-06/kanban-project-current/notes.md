# Current-head project Kanban fidelity

## Honest state

- Date: 2026-08-06.
- Browser cell: light / comfortable / `1280×820`, DPR 1.
- Owned server: `127.0.0.1:60480`.
- Shared origin: `http://localhost:8925`.
- Final Lynx-for-Web bundle:
  `0b9fd6e5864fe0b020bf0d6d8955ea7e06c3a4e44ca24e238a891ac9d2322e42`.
- Final Native bundle:
  `69252f592da5b6c0ee521634e3448260780a97831660c5cbd06f830ed4ff5e77`.

The normal snapshot had no project-kind Kanban board. A disposable server clone
was populated through canonical product paths:

1. create an excluded local Git repository with one commit;
2. import it through the rendered Web `Add project` dialog;
3. use the already-loaded production `promoteThreadCreate` helper to dispatch a
   canonical `thread.create` for `Kanban fidelity task`.

No SQLite row was inserted directly. The project and task then appeared in both
clients' real Kanban overview. Web clicked the rendered project card;
Lynx-for-Web and Native used real pointer/touch events on the rendered project
header. The entire mutated server and Native clone was deleted after capture.

## Measured residuals

The old atlas had not blocked several current project-board differences:

- column title Web `13/19.5/500`; Lynx `13/normal/600`;
- count line box Web 16px; Lynx 15px;
- column header Web 32px with `0 6 8` padding; Lynx 35.5px with `4 6 12`;
- card radius Web 10px; Lynx 8px;
- card title Web `13/17.875/500`; Lynx `13/17/600`;
- action copy Web 12/16; Lynx 11/16;
- metadata Web 11/16.5; Lynx 11/normal;
- Web root card rhythm uses a 6px gap and meta `padding-top:2px`; Lynx used a
  7px margin;
- Web renders a 12px branch glyph before `main`; Lynx omitted it.

All fixes belong to the shared Kanban column/card adapters. No fixed card height
or route-local offset was added.

## Final Browser geometry

| Anchor | Web | Lynx-for-Web |
| --- | --- | --- |
| Route title | `312/13/46.640625/20`, 14/20/500 | exact |
| First column | `272/58/322.65625/746` | exact |
| Header | `272/58/322.65625/32` | exact |
| Draft title | `278/60.25/31.515625/19.5`, 13/19.5/500 | exact |
| Count | `317.515625/62/5.578125/16` | exact |
| Card | `276/94/314.65625/64.375`, radius 10 | `276/94/314.65625/64.5` |
| Card title | y=105, 13/17.875/500 | exact line box |
| Branch glyph | `12×12` before branch text | exact slot |
| Branch text | x=327, 11/16.5 | exact |

The remaining 0.125px card-height difference is engine rounding. All three
columns have exact x/y/width/height.

Both Browser PNGs are exactly `1280×820`, and page-error files are empty.

## Native

- Launch root PID: `17557`.
- Renderer PID: `17562`.
- PID-derived client: `localhost:8903`.
- Session: 1.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Raw screenshot: `2560×1576`.
- Navigation used real touch events: sidebar Kanban, then project header.
- Route title and column title are visible and the column title computes to
  `13/19.5/500`.
- Card title, 12px branch SVG, and branch metadata are direct DOM nodes at the
  expected anchors.
- Native warning/error console: empty.

Compound VIEW box-model collapse is again treated as a DevTool limitation. The
evidence does not call the collapsed header/card values their outer boxes;
Browser geometry and CSS contracts cover those, while Native directly certifies
route state, typography, branch glyph, DOM accessibility, screenshot, and
console.

## Cleanup and gates

- Focused Kanban typography/header tests: 2 files, 3/3.
- Lynx-for-Web production build: pass.
- Native/Desktop production build: pass with existing unsupported CSS and
  optional `ws` native-module warnings.
- Owned server/static/Native processes, Browser sessions, and disposable clones
  removed.
- Normal state checked through immutable read-only SQLite access: two events,
  two projects, zero threads, and projector sequence 2.
- The SQLite main-file checkpoint caveat remains as documented in the empty
  Thread proof; this run did not claim byte-exact restoration.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
