# Settings Appearance current-head evidence

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

## Identity

- Source base: `b463ff26`
- Lynx-for-Web bundle SHA-256:
  `70e91c746395fafaab8ad83fb5d6767bd72e9f1eaddefa6c292290ec82b4beb0`
- Native bundle SHA-256:
  `9c9046af0771ba420078a015f0d27b7dee4b019add7ab9a63c568245f5f69373`
- SQLite online-backup snapshot SHA-256:
  `922cef99cdabf1aa4f56ec9480eb9ce1d8ce31d2b30f75ca620da82d61712543`
- Route: Settings Appearance
- Theme: light
- Density: comfortable
- Browser viewport: `1280x820`, DPR 1
- Native outer window: `1280x820`
- Native LynxView frame: `2560x1576`, DPR 2

Web and Lynx-for-Web reached Appearance through the real Settings navigation.
Native used the new section-preserving deep link
`synara://settings/appearance`; the exact-owned window stayed inactive.

## Fixed residuals

Before this slice:

- the section used a 24px internal gap instead of Web's 6px gap;
- section label padding and type produced a 24px box instead of 26px;
- rows had a forced 72px minimum height and 16px horizontal insets;
- row titles used a hard-coded 13px size instead of the shared 12px semantic
  role;
- each Theme Pack forced its title, import, copy, and code-theme selector into
  a 48px single-line header, while Web uses an 84px two-row header;
- Theme Pack labels used 12px rather than Web's 14px row type.

After convergence:

- Web, Lynx-for-Web, and Native section label:
  `x=456, y=118, width=624, height=26`;
- first card starts at `x=456, y=150, width=624`;
- first row is `x=457, y=151, width=622, height=61`;
- Theme Pack header is `622x84` in both Lynx engines and Web;
- Theme Pack context differs by at most 0.5px in height;
- Theme Pack rows are `622x53`;
- the code-theme selector is 28px tall and occupies the second header row.

Lynx-for-Web Theme Packs start 1px below Web and each pack is 4.5px taller.
Those deltas are below the project 8px geometry threshold. The remaining full
document height difference is downstream control/text wrapping below the first
viewport, not an unregistered first-screen P0/P1 residual.

The exact-owned Native capture resolved PID `509` to
`localhost:8903/session 1`, retained twelve required roles, loaded the staged
production bundle, and reported zero warning/error console messages.

## State cleanup

The Native light-theme capture temporarily changed only the owned
`.p10-view-native` KV file. The app was stopped before restoration, and the
original bytes were restored with SHA-256
`f53a83aac62fff4c8e7b6dac18d34ce8ffe27970a807a428fa0d9b0ba1a42474`.

## Lynx-for-Web correction

An earlier browser capture had hit Vite's SPA fallback instead of the generated Lynx-for-Web host because the staged `/lynx` assets were missing. That evidence was invalidated. The retained frame uses the staged current-head bundle, keeps the host URL under `/lynx/index.html`, and verifies the target `X-VIEW` class after memory-history navigation.
