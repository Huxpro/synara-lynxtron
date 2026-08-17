# Appearance Settings responsive fidelity

## Cell identity

- Snapshot clone: `.synara-appearance-fidelity/dev/state.sqlite`
- Initial snapshot SHA-256: `bb654c252614892494085562e51861064f09952a842a43a4851716f87aafb85d`
- Server: `localhost:56347`
- Browser origin: `http://localhost:8080`
- Theme: light/system default
- Stored app settings: byte-equivalent browser state in Web and Lynx-for-Web
- Wide cell: `1280 × 820`, DPR 1
- Compact cell: `390 × 844`, DPR 1

## New scope

- Screen: Settings → Appearance
- States:
  - wide default sidebar
  - compact default sidebar
  - compact explicit sidebar toggle
  - wide resize after compact
- Renderers:
  - Web authority
  - Lynx-for-Web
- Native: unverified

## Wide result

- Core geometry matched exactly:
  - page heading: `x=456`, `y=32`, `h=28`
  - Theme section: `x=456`, `y=118`, `w=624`
  - first row: `x=457`, `y=151`, `w=622`, `h=61`
  - first-row padding: `10px 12px`
- Pixel metrics:
  - mean absolute RGB loss: `2.7839`
  - changed-pixel ratio: `0.0771`
- Remaining field differences are intentional capability deltas:
  - Lynx hides WebKit-only font smoothing.
  - Lynx hides timestamp format until a timestamp surface exists.
  - Lynx hides code-theme selection while its host highlighter supports fixed GitHub light/dark only.

## Compact product loss

- Severity: P1 responsive interaction loss.
- Web authority default:
  - Settings sidebar hidden.
  - Appearance content occupies the full `390px` viewport.
- Previous Lynx behavior:
  - `SettingsSidebar` defaulted open at `378px`.
  - the overlay covered almost the entire `390px` content viewport.
  - core setting rows underneath were otherwise close to Web geometry.
- Before pixel metrics:
  - mean absolute RGB loss: `14.1177`
  - changed-pixel ratio: `0.1518`

## Fix

- Add a pure responsive sidebar policy.
- Default closed before viewport hydration and below the shared `md=768px` breakpoint.
- Default open at desktop widths.
- Preserve explicit user overrides at every width.
- Apply the policy at the shared Router owner instead of hiding the sidebar with compact CSS.

## After evidence

- Compact:
  - `SidebarDisclosure` closed by default.
  - no mounted `SettingsSidebar`.
  - Settings content remains `390 × 844`.
  - heading: `x=24`, `y=32`, matching Web authority.
- Wide resize:
  - sidebar automatically returned open at `1280px`.
  - mounted width: `256px`.
- Compact explicit interaction:
  - real rendered toggle opened the sidebar.
  - mounted overlay width: `378px`.
- After pixel metrics:
  - mean absolute RGB loss: `11.1765`
  - changed-pixel ratio: `0.1662`
- The changed-pixel ratio is not used as the completion gate because intentional capability rows alter downstream vertical content. The decisive loss was the sidebar visibility/occlusion behavior and geometry.

## Harness ledger

- `harness-loss`: `/settings/appearance` is not a Web route; canonical Web URL is `/settings?section=appearance`.
- `harness-loss`: stopping the grouped Web dev process also stopped its server, leaving Lynx relay recovery offline.
- `harness-timing-loss`: the existing Lynx page remained in bounded recovery backoff after the server restarted; a reload connected in one attempt. No product loss was assigned.
- `harness-noise`: direct Web Vite startup did not inherit the isolated WebSocket endpoint and logged repeated Web RPC startup warnings. Visual/static Settings evidence remained usable, but those warnings are not product-console evidence.
- `product-pass`: final Lynx-for-Web relay had one connection attempt, active socket, and no transport/RPC errors.
- `native-unverified`: no exact-owned Native cell was captured.

## Evidence

- `web-light-1280x820.png`
- `lynx-light-1280x820.png`
- `web-light-390x844.png`
- `lynx-light-390x844-after.png`
- `web-geometry.json`
- `lynx-geometry.json`
- `web-compact-geometry.json`
- `lynx-compact-geometry.json`
- `lynx-compact-after-geometry.json`
- `web-console.txt`
- `lynx-console.txt`
- `web-compact-console.txt`
- `lynx-compact-after-console.txt`

Screenshot-budget rotation (2026-08-18): the superseded
`lynx-light-390x844.png` before frame was removed after
`lynx-light-390x844-after.png` became the retained final compact evidence. The
removed bytes remain available in Git history.
