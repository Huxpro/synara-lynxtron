# Current-head populated Skills fidelity proof

## Harness and real data

- Date: 2026-08-05
- Viewport: `1280x820`, DPR 1, light theme
- Same trusted origin and isolated server snapshot
- Snapshot SHA-256:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`
- Real catalog: 114 grouped skills, all enabled
- Final Lynx-for-Web bundle SHA-256:
  `1d98f676aeea3a0844ab7aa85fde4dd5f13f8a41886b8811ce2e5d0aea6fbd4d`
- Final Native/Desktop bundle SHA-256:
  `788dbf0e10ee303ac061337f35f36a5d165bf61ebe35f3288d29f6341d3efc91`

This is a real populated large-list state. No catalog, provider copy, path, or
enabled preference was fabricated.

## Residuals and repair

Lynx placed provider/source/path metadata inside the main copy column. Web's
shared `SettingsRow` keeps metadata as supplemental status after the main
title/description/control layout. On long rows, Lynx therefore centered the
switch against the entire metadata block instead of the common copy.

The Skills row now has explicit owners:

- `SettingsSkillsMain`: title/description plus switch/count, horizontally
  aligned;
- `SettingsSkillsMetadata`: provider stack, source, and paths after the main
  layout;
- metadata typography: exact Web `11px/16.5px`;
- portable title line: 20px;
- icon-bearing skill title line: 21px;
- dividers belong to the previous row's bottom, matching Web `divide-y`.

## Exact populated rows

| Row | Web | Lynx-for-Web |
| --- | ---: | ---: |
| `adapt` | `457/333.5/622/123.5` | exact |
| `agent-browser` | `457/457/622/213.5` | exact |
| `agent-device` | `457/670.5/622/159.5` | exact |
| `android-device-automation` | `457/830/622/123.5` | exact |

For `agent-browser`:

- main layout: `469/467/598/131`;
- switch: `1035/522.5/32/20`;
- metadata: `469/598/598/61.5`;
- source and both paths: `11/16.5/400`;
- row separator: 1px bottom border.

Provider stacks remain real 16px overlapping badges with 12px provider SVGs or
neutral fallbacks. Source/path copy remains truncating and the full 114-row
catalog stays rendered.

## Evidence and gates

- `skills-web-1280x820-light.png`: current Web authority.
- `skills-lynx-web-1280x820-light.png`: before metadata ownership repair.
- `skills-lynx-web-1280x820-light-final.png`: final current bundle.
- All PNGs are exactly `1280x820`; browser page errors were empty.
- Focused Skills suite: 1 file, 3/3 passed.
- Lynx-for-Web and Native/Desktop production builds passed.
- `bun fmt`, `bun lint`, and `bun typecheck` remain unauthorized.
