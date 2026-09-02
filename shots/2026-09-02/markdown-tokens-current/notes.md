# Current composer mention and skill token recapture

Status: retained Electron and Lynx-for-Web fast-loop evidence. Persisted-token
output remains a separate pending cell.

## Identity

- Thread: `lynx-landing-thread-1787254540864-987357febecef`.
- Backend: `ws://127.0.0.1:54095/`; Lynx relay server instance
  `9240f5bd-66ad-4e46-8f05-9f739b614103`.
- Theme/state: light, same provider-update dialog, provider-runtime error banner,
  sidebar-open state, dock closed, and provider/model selection.
- Viewport: `864x620`, DPR 2; all eight retained PNGs are `1728x1240`.
- Final Lynx-for-Web bundle SHA-256:
  `78ff77791e18d4baad1166e458e3d07328e8025405627ef2fd32c72e5638593b`.
- Every menu was opened by typing in the rendered composer. Every selected
  token was produced through the rendered menu row. Drafts were cleared after
  capture; no message or database record was created.

## Results

- Skill menu (`/pol`): `3.411694731905108%` MAE. Both clients rank `polish`
  first and show the same catalog display names.
- Mention menu (`@`): `2.7971843618470884%` MAE. Both clients show current
  Chats followed by the same Codex Subagents.
- Skill selected: `2.265266345237816%` MAE. Both clients render the `Polish`
  rich token while retaining canonical `/polish` command semantics.
- Mention selected: `2.3123998890177337%` MAE. Both clients render
  `New chat (Chats)` from the same real thread.

## Fidelity fixes found by the recapture

1. Lynx menu rows used raw provider skill names while Electron used
   `skill.interface.displayName`. The provider discovery module now owns the
   shared display-name projection, with canonical-name fallback, and both
   composer renderers consume it.
2. Lynx selected-skill chips used raw lowercase names while Electron used the
   shared title formatter. Native draft projection now consumes the same
   formatter; canonical text and structured `{name,path}` references are
   unchanged.

## Verification

- Web provider-discovery/menu tests: `10/10`.
- Lynx composer menu/draft/token tests: `21/21`.
- ReactLynx best-practices scan for `Composer.lynx.tsx`: zero issues.
- Endpoint-pinned Lynx-for-Web production build: passed.
- Fresh Lynx-for-Web page-error buffer: empty; relay socket open with no
  transport or RPC error.
- Browser cleanup gate: no sessions and no owned browser processes.

The old `persisted-tokens` state is not superseded by this evidence because no
new message was sent during this run.
