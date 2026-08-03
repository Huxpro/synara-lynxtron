# Composer details state matrix

## Scope

Fast Browser tier at `1280×820`, DPR 1, light theme, using the shared
isolated server and snapshot:

- Web original: `http://127.0.0.1:63231/`
- Lynx-for-Web: `http://127.0.0.1:63231/lynx/`
- Server: `ws://127.0.0.1:62190`
- State:
  `/private/tmp/synara-lynx-web-harness.SUyxxH/synara-home/dev/state.sqlite`

This slice covers the landing Composer's extras menu, Plan mode, project
picker, provider skills, and thread mentions. It does not certify Native
textarea, IME, focus, or unmodified arrow-key delivery.

## Results

- Extras menu opens through the rendered `+` control on both clients.
  Web exposes `Add image`, `Plan mode`, and `Fast`; Lynx exposes the real host
  attachment action as `Add files`, plus `Plan mode` and `Fast`.
- Web's trigger now reports `aria-expanded="true"` while its popup is open.
- Landing Plan mode is local draft state until first send. Lynx no longer
  sends an interaction-mode command for a thread that does not exist.
- Project picker selection uses the real `spike-workspace` project. Lynx now
  uses the same workspace-basename label and `Don't work in a project` reset
  wording as Web.
- Removing the landing tray's local stacking context fixed a real Lynx bug
  where the project popup rendered behind the Composer and only its top border
  remained visible.
- `$pol` loads the real provider skill catalog. Selecting `polish` preserves
  its structured reference and canonical provider token.
- `@Draft` resolves the real `Draft seed task` thread mention and preserves its
  structured reference.

## Registered platform boundary

Web renders selected skills and mentions as inline rich-editor tokens. Lynx
renders a chip plus the canonical textarea token because the native textarea
is a platform island. This is visible in the retained selected-state frames
and remains a registered residual rather than a hidden parity claim.

## Evidence

- `browser/extras-default-1280/web-menu.png`
- `browser/extras-default-1280/lynx-menu.png`
- `browser/extras-default-1280/lynx-plan-menu.png`
- `browser/project-picker-1280/web-open.png`
- `browser/project-picker-1280/lynx-open.png`
- `browser/project-picker-1280/web-selected.png`
- `browser/project-picker-1280/lynx-selected.png`
- `browser/skills-mentions-1280/web-skill-menu.png`
- `browser/skills-mentions-1280/lynx-skill-menu.png`
- `browser/skills-mentions-1280/web-skill-selected.png`
- `browser/skills-mentions-1280/lynx-skill-selected.png`
- `browser/skills-mentions-1280/web-mention-menu.png`
- `browser/skills-mentions-1280/lynx-mention-menu.png`
- `browser/skills-mentions-1280/web-mention-selected.png`
- `browser/skills-mentions-1280/lynx-mention-selected.png`

All retained Browser PNGs are exactly `1280×820`.
