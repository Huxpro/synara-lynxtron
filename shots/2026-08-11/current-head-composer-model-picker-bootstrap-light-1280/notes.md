# Current-head Composer model picker bootstrap light 1280

- Scope: focused Lynx-for-Web bootstrap and provider-list evidence for the
  Composer model picker. This does not close model-group disclosure
  re-certification.
- Web and Lynx-for-Web use the same isolated server/state, light theme,
  `1280x820` viewport, and DPR 1.
- Harness failure fixed: the initial `composerModelMenu=open` overlay previously
  had only a 2-second positioning window. Real provider bootstrap exceeded that
  window, leaving the mounted popup permanently `visibility:hidden`. Initial
  overlay positioning now uses one shared 15-second bounded retry helper for
  the Composer model menu and Explorer preview actions.
- Product state failure fixed: Landing already owns refreshed
  `serverConfig.providers`, but Composer waited for a child query observer.
  The initial popup mounted against `providers=[]` and stayed on `Checking`.
  Landing now passes its refreshed provider statuses directly into Composer,
  while thread Composer paths retain the internal fresh-config fallback.
- Runtime result: Lynx popup is visible and shows the same final provider
  availability labels as Web: Codex/Antigravity/Grok/Droid/Kilo unavailable,
  Claude/Cursor sign-in required, and OpenCode/Pi available.
- Both retained PNGs are exactly `1280x820`; page-error files are empty. Lynx
  relay is OPEN with zero pending requests and no transport/RPC error. The sole
  Lynx warning is the named upstream WebAssembly initialization deprecation.
- Verification: focused initial-open/interaction bridge tests pass 15/15;
  Lynx-for-Web production build passes.
- Boundary: Web OpenCode submenu was opened through its rendered menu item.
  The current browser harness can publish hover/focus to the Lynx bindtap row
  but cannot produce the Lynx activation event, so OpenCode model-group
  disclosure remains visually unrecertified rather than being inferred from
  source or programmatic state.
