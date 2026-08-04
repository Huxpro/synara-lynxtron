# Provider health banner current-head evidence

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

## Identity

- Source base: `efa9b773714009429857c6dd3098e71ca25a8b93`
- Native bundle SHA-256:
  `f77bf07c101c418cdc5fa2dbbbb5ca942d7e917e915cdfb8672b3d733cde4c68`
- SQLite online-backup snapshot SHA-256:
  `84c3fa5351a20b2edb8d75e20a6a1c9bea391e5032f20386524456f9937507c6`
- Route: New Chat
- Theme: light
- Density: comfortable
- Browser viewport: `1280x820`, DPR 1
- Native outer window: `1280x820`
- Native LynxView frame: `2560x1576`, DPR 2

Web original and Lynx-for-Web used the same isolated server and the same
trusted origin. The Lynx build was staged at
`http://localhost:8921/lynx/index.html`; separate-origin attempts were
discarded because the server correctly rejected their Origin.

## Results

- Web and both Lynx engines place the banner alert at
  `x=400, y=58, width=736, height=68`.
- Lynx-for-Web and Native place the frame at
  `x=256, y=46, width=1024, height=80`.
- Lynx-for-Web and Native title, description, and dismiss boxes are identical:
  - title: `x=439, y=71, width=656, height=20`;
  - description: `x=439, y=91, width=656, height=20`;
  - dismiss: `x=1103, y=79, width=24, height=24`.
- Copy matches Web:
  `Codex provider status` and
  `Codex CLI is installed but failed to run. Error: codex not found in PATH`.
- The dismiss control exposes the accessible name
  `Dismiss provider status` and the Native DOM records the complete pointer,
  focus, keyboard, and `bindtap` interaction contract.
- A real Lynx-for-Web pointer click removed the frame and moved the Composer
  from `y=461` to `y=421`, the expected 40px centered-layout shift.
- The exact-owned Native capture resolved PID `27965` to
  `localhost:8903/session 1`, loaded
  `apps/lynx/dist/desktop/main.lynx.bundle`, retained seven required roles, and
  reported zero warning/error console messages.

## Sampling boundary

Lynx DevTool reports `border-radius: 0px` for both the banner and the existing
Composer in this capture even though both use explicit radius styles and the
Composer radius is already visually certified. Treat this as a computed-style
sampling limitation, not as evidence that only the banner lost its radius.
Geometry, paint, shadow, screenshots, and source anatomy remain retained.

Native hero and Composer Y coordinates are 16px above the Browser normalized
composition because the `1280x820` macOS window has a `1280x788` content
viewport. The banner itself is top-anchored and matches exactly, so no new
banner residual is registered for the titlebar normalization.
