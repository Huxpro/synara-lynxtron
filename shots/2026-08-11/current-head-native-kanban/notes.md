# Current-head Native Kanban empty light 1280

- Scope: exact-owned Native Kanban overview light/1280 empty-state cell plus
  current Web authority.
- Native startup used the real `synara://kanban` deep link.
- Exact identity:
  - root PID `98912`, app PID `98946`
  - PID-derived `localhost:8902`, session `1`
  - staged workspace bundle URL
  - unrelated `@t3tools/lynxtron` on 8901 untouched.
- Native runtime:
  - logical root `1280x820`; screenshot `2560x1640`
  - overview page `1024x820 @ (256,0)`
  - header `1024x46 @ (256,0)`
  - title `51x20 @ (276,13)`
  - empty region `1024x762 @ (256,58)`
  - canonical copy: `Nothing on the board yet` and the drafted/running/
    completed explanation
  - `0 tasks` and disabled `New task` action
  - warning/error console empty.
- Web authority exposes the same overview title/count, disabled New task
  action, and empty copy. Its page-error file is empty.
- No product patch was required; this is current-head route certification.
- Boundary: this closes the overview empty light/1280 cell only. Project board,
  populated cards, dark, and 1440 remain pending.

## Populated interaction refresh (2026-08-15)

- Reused the canonical `.synara-fidelity-editor-changes` snapshot with two
  real project containers and three active threads; no Kanban fixture or SQLite
  write was added.
- Lynx-for-Web at `1280x820`, DPR 1, dark rendered:
  - `Editor Changes` project column with two cards;
  - `Editor Secondary` project column with one card.
- Trusted pointer input opened the `Editor Changes` project board:
  - route title changed from `Kanban` to `Editor Changes`;
  - two real cards remained visible in the project board.
- Trusted pointer input opened the rendered `New task` action:
  - dialog: `560x228` at `(360,296)`;
  - project: `Editor Changes`;
  - real prompt, draft switch, and Create task controls.
- Trusted pointer input used the Dialog primitive's default close control:
  - dialog closed;
  - board and both cards remained;
  - active thread count stayed `3 -> 3`;
  - no orchestration command was dispatched;
  - page errors were empty and relay pending requests stayed at zero.
- `lynx-kanban-populated-overview-to-board`: new P2 interaction coverage,
  contribution `0.25 -> 0.00`.
- `lynx-kanban-new-task-open-cancel`: new P2 interaction coverage,
  contribution `0.25 -> 0.00`.
- Native populated cards/project board, dark, and 1440 remain missing
  certification coverage; the earlier Native empty cell is not used as a
  proxy.
- Evidence: `shots/2026-08-15/kanban-populated-interactions/`.

## Compact project-board header correction (2026-08-16)

- A fresh `390x844`, DPR 1, dark Lynx-for-Web project-board cell found a real
  P2 layout loss: the rendered `New task` action ended at `x=392.671875`,
  overflowing the `390px` viewport by `2.671875px`.
- Root cause: the desktop sidebar-closed `212px` route-header gutter still
  applied to compact and medium Kanban and pull-request headers.
- Compact and medium route headers now restore the intended `20px` leading
  gutter. In the fresh production bundle
  `d1982d26f7765cb39f5ae3ddbee0862074a1b4a50f4ec557da9debbab0adf209`,
  the same action measures `92.21875x28 @ (277.78125,9)` and ends at
  `x=370`.
- Trusted pointer input at the measured action center opened the rendered
  dialog. The compact dialog remained `351x246 @ (19.5,299)` and ended at
  `x=370.5`; page errors were empty.
- The first two post-build attempts were rejected as harness failures: one
  used a mismatched server `devUrl`, and one queried the host document instead
  of the `<lynx-view>` shadow tree. Neither sample was counted as product
  evidence.
- Every browser attempt ran through `bun run browser:run -- ...`. Success,
  selector failure, timeout, and interrupt paths all finished with
  `agent-browser session list = []`, zero agent-browser-owned Chromium
  processes, and released owned `58090`/`8080` listeners.
- `lynx-kanban-compact-project-header-overflow`: P2 component contribution
  `1.00 -> 0.00`.
- This is Lynx-for-Web interaction evidence, not Native certification.
