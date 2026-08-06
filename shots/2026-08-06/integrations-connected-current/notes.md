# Current-head connected Integrations row proof

## Isolated canonical state

- Date: 2026-08-06.
- Owned server: `127.0.0.1:60464`.
- Trusted shared origin: `http://localhost:8921`.
- Browser cell: `1440x900`, DPR 1, light / comfortable.
- Baseline SQLite main-file SHA-256:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Lynx-for-Web bundle SHA-256:
  `93547f8894e941addeae6479fe9f86d28f6d8d54371db3d87dfacc3d953e5f1a`.
- Native bundle SHA-256:
  `79f06c2036c8d5db3b4bd8175e3e3ecd8fba2ac309202fd1dc5a49194535959a`.

The server ran from a byte-cloned disposable home. Canonical
`server.createExternalMcpIntegration` created one active, unpaired connection:

- name: `Fidelity coding agent`;
- project scope: all projects, including future projects;
- permissions: `projects:read`, `tasks:create`, `tasks:wait`;
- client kind: Codex;
- lifetime: 30 days.

The API only issued local pairing/stdio configuration; no external agent was
launched or contacted. The complete server and Native clones were deleted
after capture. Normal SQLite/settings/KV/window hashes never changed.

## Finding

The previous real form proof ended in an empty Connected agents section. The
first populated comparison exposed three concrete differences:

1. `SettingsIntegrationsConnection` inherited the form row's centered
   alignment, placing actions at y=575 instead of Web's y=534.
2. The inherited 20px copy/action gap compressed the connected copy by 10px.
3. Lynx reduced timestamps to `YYYY-MM-DD`, while Web rendered local date and
   time; this also changed wrapping and row height.

## Repair

- Form rows retain their centered, 20px control layout.
- Connected rows now own `align-items: flex-start` and a 10px gap.
- Connected actions have no inherited top margin and remain 24px high.
- Local timestamps now preserve month/day/year, 12-hour time, seconds, and
  AM/PM, matching Web content.
- Date formatting lives in the pure Integrations logic module and has focused
  coverage for null, invalid, and local timestamp inputs.

## Browser geometry

The final Web and Lynx-for-Web content geometry is exact:

| Anchor | Web | Lynx-for-Web |
| --- | --- | --- |
| Copy | `x=549 y=534 w=436.5` | exact |
| Title | `549/534/436.5/18`, `12/18/500` | exact |
| Status | `549/554/436.5/18` | exact |
| Resume pairing | `995.5/534/92.046875/24` | exact |
| Revoke | `1095.546875/534/51.453125/24` | exact |
| Action gap | `8px` | exact |
| Timestamp content | full local date/time, two lines | exact |

Web reports inner content at `598x122`; Lynx's bordered and padded row is
`622x136`. Both retained PNGs are exactly `1440x900`, and both page-error files
are empty.

## Native

- Exact-owned root PID: `76008`.
- PID-derived DevTool client: `localhost:8904`, session 1.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Native root: `1440x868`; raw PNG: `2880x1736`.
- Connection row: `537/521/622/136`.
- Title: `549/531/438/18`.
- Actions: `997/531/150/24`.
- Warning/error console: empty.

The helper's generic `copy` and `description` roles resolve the first reused
class on the page, which belongs to the connection form. They are not used as
connected-row claims. The retained DOM contains the complete connected-row
subtree; the connection, title, and actions roles directly lock the populated
row's geometry.

The Native row is three pixels above Browser because of engine-level section
flow rounding, but its title and actions are both exactly 10px inside the row
and top-aligned to each other. The repaired owner and 24px actions are preserved.

## Cleanup and gates

- Disposable server and Native user-data clones removed.
- Owned server, Native process, DevTool client, and named browser sessions
  exited.
- Main SQLite/settings/KV/window hashes remained byte-exact.
- Integrations logic/panel plus Archived regression: 3 files, 11/11.
- Web production build: pass, 8,943 modules.
- Configured Lynx-for-Web production build: pass.
- Configured Native/Desktop production build: pass with only existing CSS and
  optional `ws` native-module warnings.
- `git diff --check`: pass.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
