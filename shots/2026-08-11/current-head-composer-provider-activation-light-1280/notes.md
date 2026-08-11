# Current-head Composer provider activation light 1280

- Scope: focused Lynx-for-Web provider-row activation and models-panel fallback.
- Web and Lynx-for-Web use the same isolated server/state, light theme,
  `1280x820` viewport, and DPR 1.
- Residual fixed: Composer provider rows use Lynx `bindtap`, while the Web
  interaction bridge only handled the top-level model trigger. Browser pointer
  and keyboard activation could publish hover/focus but never enter a
  provider's models panel.
- Fix: provider rows expose a stable `data-provider`; the interaction bridge
  forwards click, bounded pointer-up, and Enter/Space activation through the
  existing URL-first harness state. `composerModelProvider=<kind>` is validated
  with the shared `isProviderKind` helper, initializes Composer's catalog
  provider, and starts the picker in its models panel.
- Runtime proof: a real pointer activation on the rendered OpenCode row changed
  the page URL to
  `?composerModelMenu=open&composerModelProvider=opencode` and mounted the
  models panel.
- Loading fallback fixed: the models panel now renders available static options
  while dynamic discovery is pending; it only shows the skeleton when no model
  options exist.
- Both retained PNGs are exactly `1280x820`; page-error files are empty. Lynx
  relay is OPEN with zero pending requests and no transport/RPC error.
- Verification: focused interaction/initial-open/overlay coverage passes 20/20;
  Lynx-for-Web production build passes.
- Remaining difference: Web receives the live OpenCode directory and renders
  multiple models, while this Lynx state currently retains only its static
  `OpenAI GPT-5` fallback. Consequently model-group disclosure still has no
  real grouped Lynx data in this environment and remains visually
  unrecertified.
