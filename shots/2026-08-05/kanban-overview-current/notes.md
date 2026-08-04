# Kanban overview current-head evidence

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

## Identity

- Source base: `33e3ca15`
- Lynx-for-Web bundle SHA-256:
  `34b07c50970d3d8747a0ad16eed64cce2846fd69fd81955103c87fc83cb7005e`
- Native bundle SHA-256:
  `096535f4029b70bf0a9fa704f19e0b8e91cd11f2552f31dadcebdf62a95f80c1`
- SQLite online-backup snapshot SHA-256:
  `84d05db5d654601715926c496331c770b38a2626bfcfaea94e405a997ad8d601`
- Route: Kanban overview
- State: empty board
- Theme: light
- Density: comfortable
- Browser viewport: `1280x820`, DPR 1
- Native outer window: `1280x820`
- Native LynxView frame: `2560x1576`, DPR 2

Web original and Lynx-for-Web used the same isolated server, snapshot, and
trusted Vite origin. The Lynx artifact was built with
`SYNARA_WS_URL=ws://127.0.0.1:60462` and staged at the exact
`/lynx/index.html` path. Separate-origin and default-port diagnostic frames
were discarded.

## Fixed residuals

Before this slice:

- the Lynx header content rail started 4px to the right of Web;
- the title used weight 600 instead of 500;
- the task count used an 18px line box instead of 16px;
- New task used a full-width plus glyph, was about 6px narrower, and used
  opacity 0.45 instead of Web's 0.64 disabled opacity;
- the empty-state copy was 360px wide instead of 384px;
- the empty title used an implicit 17px line box and weight 600 instead of
  `14px/20px/500`.

After the shared adapter corrections:

- Web and Lynx-for-Web title: `x=276, y=13, height=20`;
- Web and Lynx-for-Web task count: `y=15, height=16`;
- Web New task: `93.36x28`; Lynx-for-Web: `92.22x28`; Native: `93x28`;
- Lynx uses the generated 14px Tabler plus icon rather than a text glyph;
- Web and Lynx-for-Web empty root: `x=256, y=58, width=1024, height=762`;
- Web and Lynx-for-Web empty copy: `x=576, y=407, width=384, height=64`;
- Web and Lynx-for-Web empty body: `x=576, y=431, width=384, height=40`.

Native retains the same header X/Y and control anatomy. Its overview content is
16px higher because the `1280x820` macOS window has a `1280x788` content
viewport; this is the existing titlebar normalization rather than a Kanban
residual.

The exact-owned Native capture resolved PID `43207` to
`localhost:8903/session 1`, retained ten required roles, loaded the staged
production bundle, and reported zero warning/error console messages.
