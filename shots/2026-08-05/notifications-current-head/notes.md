# Current-head Notifications fidelity proof

## Harness

- Date: 2026-08-05
- Viewport: `1280x820`, DPR 1
- Theme: Light, selected through the rendered Web Appearance control; Lynx
  confirmed `SliceRoot--theme-light`
- Server: owned isolated Synara process on `127.0.0.1:60462`
- Snapshot SHA-256:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`
- Web authority: `http://localhost:8921/`
- Lynx-for-Web: `http://localhost:8921/lynx-current/`
- Web bundle SHA-256:
  `25cf40f5d0ec9132b18be805a9ac2797ac7272f9fed959fbc36a754ac4f678f9`
- Lynx-for-Web bundle SHA-256:
  `dd1fcb8914a44662c80058575b2ff74e097a84d97e86cb567fce6f3afdf57230`
- Native/Desktop bundle SHA-256:
  `48c25db7e482109cc8e1c59af46922d3592b91e294faf4529d4c7c71439a4266`

The Web production build replaced `apps/web/dist`, which removed the temporary
Lynx mount and produced one 404 during harness reload. The mount was recreated
and its `200` response verified before collecting final evidence. That 404 was
a harness staging failure, not product evidence.

## Capability boundary

Web has real browser/in-app notification consumers, so its rows expose active
switches and a desktop notification Test action. Lynx currently has no toast
dispatcher, completion-event consumer, or OS notification bridge. Its stored
preferences therefore remain visible with disabled switches and explicit:

- `In-app activity toasts are unavailable in this runtime.`
- `System notifications are unavailable in this runtime.`

This is an intentional honest capability delta. The proof compares shared row
structure and common anchors without pretending that the controls have the
same runtime capability.

## Measured residual and repair

Before the repair, each Lynx unavailable status lived inside the copy column.
The first copy grew from the Web-common `40px` to `62px`, and
`align-items:center` moved the shared 32×20 switch from Web `y=171` to
Lynx `y=182`. The status was correct, but it incorrectly changed the common
control baseline.

The shared `SettingsRow` composition now renders supplemental status after the
main layout. Lynx rows use explicit column flow, so status expands the row
without participating in title/description/control centering.

Final first-row anchors:

| Anchor | Web | Lynx-for-Web |
| --- | ---: | ---: |
| Section title | `x=456 y=118 w=624 h=26` | exact |
| Card | `x=456 y=150 w=624` | exact |
| First row | `x=457 y=151 w=622` | exact |
| Title | `x=469 y=162 h=18`, `12/18/500` | exact |
| Description | `x=469 y=183 h=18`, `12/18/400` | exact |
| Switch | `x=1035 y=171 w=32 h=20` | exact |
| First divider | none | none |

The Lynx status now begins at `x=469 y=201`, uses `11/16/400`, and remains
outside the common 40px layout. The second row retains its real top divider and
the same title/description typography while its capability status extends the
row independently.

## Evidence

- `notifications-web-1280x820-light.png`: rebuilt current Web authority.
- `notifications-lynx-web-1280x820-light.png`: Lynx before status ownership was
  corrected.
- `notifications-lynx-web-1280x820-light-final.png`: final current bundle.
- All PNGs are exactly `1280x820`.
- Both named browser sessions reported no page errors in the retained final
  state.

## Gates

- Web Notifications focused suite: 1 file, 2/2 passed.
- Lynx shared Settings row focused suite: 1 file, 1/1 passed.
- Web, Lynx-for-Web, and Native/Desktop production builds passed.
- Native warnings remain the existing `color-scheme`, `overflow-wrap`, and
  optional `ws` native-module warnings.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
