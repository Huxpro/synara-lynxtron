# Composer token states at 1280x820

Status: retained matched Electron and Lynx-for-Web replacement evidence for the
archived `composer-details/browser/skills-mentions-1280` states.

## Identity

- Backend: `ws://127.0.0.1:54095/`; Lynx relay server instance
  `9240f5bd-66ad-4e46-8f05-9f739b614103`.
- Thread: `lynx-landing-thread-1787254540864-987357febecef`.
- Theme/viewport: light, `1280x820`, DPR 1.
- Sidebar open, dock closed, same provider/model, same transcript and overlay
  state.
- Electron used a temporary CDP viewport override and was restored to the
  user's `864x620`, DPR 2 thread view after capture.
- Menus were opened by typing into each rendered composer. Selected states used
  real clicks on `polish` and `New chat / Chats`; both drafts were cleared.
- Final Lynx-for-Web bundle SHA-256:
  `d87cbcebfa0d9fd62ad3a661f5959ce65d9f8477c7d3b920abeb08dc3072eec8`.

## Current results

- skill-menu: `2.18312983221744%` MAE, down from `3.072535942730751%`.
- mention-menu: `1.7903112794914713%`, down from `2.364927691096764%`.
- skill-selected: `1.5189862555794675%`, down from `2.3845270653993302%`.
- mention-selected: `1.542851431731229%`, down from `2.465106159333652%`.

All four states now use shared provider skill display names and the same rich
token title formatting. A later whole-frame audit found that these images do
not share one transcript or renderer-local selection state: Web contains a
`1 selection` chip and fewer messages, while Lynx-for-Web omits that chip and
contains later recovery and watchdog messages. The focused interaction evidence
remains useful, but the four whole-frame MAEs cannot isolate menu/token fidelity
and are excluded from current visual scoring pending a truly matched recapture.

## Gates

- Web provider discovery/menu tests: `10/10`.
- Lynx composer menu/draft/token tests: `21/21`.
- ReactLynx scan for `Composer.lynx.tsx`: zero issues.
- Endpoint-pinned Lynx-for-Web production build: passed.
- Lynx page-error buffer: empty; Electron uses the same long-lived source
  process already checked during the token run.
- Browser cleanup gate: no sessions and no owned browser processes.
