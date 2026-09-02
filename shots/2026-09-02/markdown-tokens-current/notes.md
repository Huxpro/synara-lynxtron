# Current composer mention and skill token recapture

Status: retained Electron and Lynx-for-Web fast-loop evidence, including a
canonical persisted-token output cell.

## Identity

- Thread: `lynx-landing-thread-1787254540864-987357febecef`.
- Backend: `ws://127.0.0.1:54095/`; Lynx relay server instance
  `9240f5bd-66ad-4e46-8f05-9f739b614103`.
- Theme/state: light, same provider-update dialog, provider-runtime error banner,
  sidebar-open state, dock closed, and provider/model selection.
- Viewport: `864x620`, DPR 2; all eight retained PNGs are `1728x1240`.
- Final Lynx-for-Web bundle SHA-256:
  `48223d65d4e6ba55a286a476bf75cfe80e19a5dbe6a858c24f7a113ca8034862`.
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
- Persisted tokens: `1.9202114861277046%` MAE. A separate isolated server at
  `58270`, server instance `7f56a536-f9ed-4165-b817-079bb6a3908d`, projected
  one canonical user message with both non-empty `mentions_json` and
  `skills_json`. Electron and Lynx-for-Web rendered the same
  `Token mention source` and `Polish` tokens from thread
  `62453f79-69f3-4c13-aa63-db05fe2c9a6e`. The provider subsequently entered
  an error state, but the user message was complete and non-streaming before
  capture; both clients rendered the same error banner and had empty page-error
  buffers. The state database lived only under
  `/tmp/synara-token-recapture-home` and was deleted after capture.

## Fidelity fixes found by the recapture

1. Lynx menu rows used raw provider skill names while Electron used
   `skill.interface.displayName`. The provider discovery module now owns the
   shared display-name projection, with canonical-name fallback, and both
   composer renderers consume it.
2. Lynx selected-skill chips used raw lowercase names while Electron used the
   shared title formatter. Native draft projection now consumes the same
   formatter; canonical text and structured `{name,path}` references are
   unchanged.
3. Lynx persisted skill glyphs used foreground ink while Electron uses the
   shared accent tone. Native now resolves the active theme accent to a real
   SVG stroke (`#0169cc` in the retained light cell), avoiding unsupported CSS
   variables inside SVG content.

## Verification

- Web provider-discovery/menu tests: `10/10`.
- Lynx composer menu/draft/token tests: `21/21`.
- ReactLynx best-practices scan for `Composer.lynx.tsx`: zero issues.
- Endpoint-pinned Lynx-for-Web production build: passed.
- Fresh Lynx-for-Web page-error buffer: empty; relay socket open with no
  transport or RPC error.
- Browser cleanup gate: no sessions and no owned browser processes.

One current residual remains explicit: Electron can resolve a thread mention
to its provider icon from the Web sidebar store, while Native still renders
its generic source-backed path fallback because provider identity is not yet
carried into the Markdown token projection. This residual stays visible in the
new MAE rather than blocking replacement of the stale August 2 snapshot.
