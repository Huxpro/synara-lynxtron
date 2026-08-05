# Current-head Profile fidelity proof

## Harness

- Date: 2026-08-05
- Viewport: `1280x820`, DPR 1, light theme
- Server: owned isolated Synara process on `127.0.0.1:60462`
- Snapshot SHA-256:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`
- Web authority: `http://localhost:8921/`
- Lynx-for-Web: `http://localhost:8921/lynx-current/`
- Final Lynx-for-Web bundle SHA-256:
  `5173a650cb1c9da7697023d7d170ced870761356503954a9baf7558cc5e53289`
- Final Native/Desktop bundle SHA-256:
  `417aef48e209cebd26419dffff1f2d3c0dea09f862aa9202d3b933d1d9df3639`

Both clients used the same trusted origin, snapshot, theme, viewport, and
rendered Settings to Profile navigation path. No profile or heatmap fixture was
written.

## Real-state coverage

The real snapshot contains:

- identity and avatar;
- five stat tiles;
- 274 activity cells over a 40-week heatmap;
- empty activity-insight values;
- empty plugin and model sections.

It visually certifies identity, stat typography/card anatomy, heatmap
alignment, month labels, insight/empty-section layout, and scrolling. It does
not visually certify populated plugin/model rows because the real snapshot has
no such activity. Existing focused source tests cover provider identity in
populated model rows, but this evidence does not claim screenshot coverage for
that absent branch.

## Measured residuals and repair

### Weekday slots and heatmap sizing

Lynx previously sliced 274 cells directly into groups of seven. Web first pads
the initial week to the first cell's `weekday`, then pads the final week. The
snapshot starts on weekday 3, so Lynx omitted three leading pads and three tail
pads. Dates and month labels were assigned to the wrong week rows even though
both products displayed 40 columns.

The shared semantics now match Web:

- 40 week columns;
- 274 real cells;
- 6 transparent weekday pads;
- the month label uses each week's first real cell;
- the month x coordinates match Web exactly:
  `408`, `498.344`, `570.625`, `642.906`, `715.203`, `805.594`,
  `877.906`, `968.297`, `1040.609`, `1112.922`.

Lynx also used a fixed 112px grid and 21.5px month row. Web fill mode resolves
the same 720px width to a 123.5px grid, 15.0625px cells, and a 10px month row.
The corrected values preserve the total 136.5px heatmap height and exact 3px
gaps.

### Identity and stat card

Lynx placed name and handle as separate 12px-gap children. Web groups them in a
6px-gap identity-copy column. Lynx also used 20/24 avatar text and 24/29 name
text versus Web 20/28 and 24/32.

The corrected identity now measures:

- identity: `x=408 y=88 w=720 h=134`;
- name/handle group: `x=693.203 y=164 w=149.594 h=58`, gap 6;
- avatar text: `20/28/600`;
- name: `24/32/600`;
- handle row: `y=202 h=20`.

The stat card now matches Web at `x=408 y=250 w=720 h=68` with an 18px radius.
Its values and labels remain exact `14/20/400`.

## Final geometry

| Anchor | Web | Lynx-for-Web |
| --- | ---: | ---: |
| Identity | `408/88/720/134` | exact |
| Stats | `408/250/720/68`, radius 18 | exact |
| Activity section | `408/346/720/168.5` | exact |
| Heatmap grid | `408/378/720/123.5` | exact |
| First slot | `15.0625×15.0625`, radius 5 | exact |
| Month row | `408/504.5/720/10` | exact |
| Insights columns | `408` and `792`, width 336 | exact |
| Model section | `408/802.5/720/52` | exact |

## Evidence

- `profile-web-1280x820-light.png`: current Web authority.
- `profile-lynx-web-1280x820-light.png`: Lynx before identity/heatmap repair.
- `profile-lynx-web-1280x820-light-final.png`: final current bundle.
- All PNGs are exactly `1280x820`.
- Both named browser sessions reported no page errors.
- The final Lynx client remained online.

## Gates

- Focused Profile suite: 1 file, 3/3 passed, including pure weekday-slot and
  month-column behavior.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with only the existing
  `color-scheme`, `overflow-wrap`, and optional `ws` native-module warnings.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
