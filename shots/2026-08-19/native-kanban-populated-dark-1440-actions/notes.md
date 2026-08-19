# Native Kanban Populated Dark 1440 Actions

## Scope

- exact-owned Native project board;
- one canonical thread-backed Draft card;
- dark theme;
- `1440×900` outer window;
- rendered card action chooser;
- explicit Cancel with zero mutation.

This closes the Native populated project-board, dark-theme, and 1440-size
boundary left open by `shots/2026-08-11/current-head-native-kanban/notes.md`.
It adds a card interaction state rather than recapturing the static board.

## Canonical Fixture

The fixture used the existing default server and only public product RPC:

- server instance:
  `836d71a2-ab19-4991-abfc-8728dcc0258f`;
- project:
  `kanban-native-project-1787097580201`;
- thread:
  `kanban-native-thread-1787097580201`;
- project title:
  `Native Kanban 1440`;
- card title:
  `Native action chooser proof`;
- card projection:
  thread-backed Draft with no turn or session.

`project.create` and `thread.create` created the fixture. SQLite was not
modified. After certification, `thread.delete` removed the temporary thread.

## Native Preflight

- exact-owned PID: `81131`;
- PID-derived DevTool: `localhost:8903`, session `1`;
- unrelated user Native PID and server were not used as the certification
  client;
- route:
  `/kanban/kanban-native-project-1787097580201`;
- isolated user data:
  `/tmp/synara-kanban-native-data`;
- root:
  `1440×900`, `SliceRoot--theme-dark`;
- outer persisted bounds:
  `1440×900 @ (120,80)`;
- staged bundle SHA-256:
  `127a00cf64d260c8dc8c8ea3308cbe8ff7bb15fdee2f2bfe0def5421358e3761`;
- staged desktop main SHA-256:
  `3bda3e635d0be05293ba2fe79d9f4182fb4c51ce3b83c9771c2e7d6c3182115e`.

## Interaction

The project board rendered three columns and the canonical card in Draft. The
card's visible `Actions for Native action chooser proof` control was activated
through current DevTool geometry and real touch emulation.

The chooser rendered:

- Start task;
- Rename task;
- Pin;
- Copy Path;
- Copy Thread ID;
- Archive task;
- Delete;
- Cancel.

The visible Cancel control closed the chooser. Canonical readback immediately
afterward proved:

- thread still existed;
- title stayed `Native action chooser proof`;
- `latestTurn` remained `null`;
- `archivedAt` remained `null`.

No orchestration mutation was emitted by open or Cancel.

## Geometry And Console

- retained temporary DevTool PNG:
  `2880×1800`, corresponding to the `1440×900` Native window at DPR `2`;
- action chooser screenshot remained under `/tmp` and was not added to the
  repository;
- exact-client error/warning console: empty;
- repository screenshot count remained exactly `100`.

## Harness Classification

The first action click landed on the provider-update prompt because that
overlay covered the measured card coordinate and navigated to Settings →
Providers. No Kanban action ran. The sample was rejected as state-alignment
harness loss.

The exact-owned app was restarted on the Kanban route, the provider-update
prompt was dismissed through its rendered control, and card geometry was
remeasured before the retained interaction.

Several discarded DevTool helper attempts also passed empty coordinates after
misreading `DOM.getDocumentWithBoxModel`; the CLI rejected each malformed
request before input delivery. Every failed loop was followed by a clean
browser ownership gate.

## Verification

- canonical fixture creation/readback/cleanup passed;
- Native production bundle loaded from the workspace staging path;
- exact PID-derived DevTool client used throughout;
- dark `1440×900` populated project board passed;
- chooser open and Cancel passed;
- canonical no-mutation readback passed;
- browser sessions: `[]`;
- agent-browser-owned processes: zero.
