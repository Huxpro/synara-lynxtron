# Theme Pack Import Native follow-up

Status: Native dialog/dismiss fidelity pass; text entry remains uncertified

Bundle:

- path: `apps/lynx/dist/desktop/main.lynx.bundle`
- SHA-256: `f7555349ee4a18c23e614013736de9144887c7d268abb8783138a3f75448dd2c`

Runtime:

- production dependency: Lynxtron `0.0.9`
- diagnostic runtime: paired `0.0.9-dev`
- startup route: `synara://settings/appearance`
- outer window: `1280x820`
- exact client: PID-derived local DevTool client, session 1

## Finding

The bundle/parser blocker is gone and the real Appearance Theme Pack Import
dialog renders in Native. The first `0.0.9` run exposed a concrete interaction
defect:

- the Close control was visibly positioned at `827,298,28x28`;
- `DOM.getNodeForLocation(841,312)` resolved to
  `SharedThemePackImportTitle`, not the Close subtree;
- exact-client touch therefore left the dialog open;
- the rendered Cancel action closed the same dialog successfully.

The absolute Close control was painted above the header but had no explicit
stacking order. Adding `z-index: 1` makes the same center resolve to the Close
icon subtree. A real exact-client press/release then removes the dialog.

## Retained cells

| Cell  | Dialog border      | Textarea border    | Cancel border      | Import border      | Close                                      | Console |
| ----- | ------------------ | ------------------ | ------------------ | ------------------ | ------------------------------------------ | ------- |
| light | `416,289..864,532` | `434,372..846,466` | `721,491..781,519` | `789,491..848,519` | `827,298,28x28`; center hits Close subtree | empty   |
| dark  | same               | same               | same               | same               | same repaired hit target                   | empty   |

The PNGs are `2560x1640` because Lynxtron `0.0.9` DevTool captures the full
outer `1280x820` window rather than the titlebar-subtracted LynxView used by the
older harness.

## Input boundary

The Native textarea is present, focusable, and has the expected `412x94`
border box. This run does not claim ordinary typing, selection, paste,
composition, or undo/redo: the background-owned window is not the frontmost
macOS text client, and invoking `setValue` would bypass the product's
`bindinput` path. Browser invalid/valid workflows and focused tests remain the
behavior evidence until a focus-safe frontmost text-client run is available.
