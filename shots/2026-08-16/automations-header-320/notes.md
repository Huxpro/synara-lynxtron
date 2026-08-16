# Automations list header at 320px

## Newly discovered scope

The existing Automations compact evidence covered detail panes and create
dialogs. This loop added the list header at `320x568`, including exact hit
testing and real Refresh interaction.

## P1 product loss

Before the fix:

- fixed desktop titlebar controls occupied `x=90..174`;
- Refresh occupied `x=156.02..188.02`;
- Refresh center hit a disabled desktop navigation control instead of Refresh;
- New automation occupied `x=192.02..308`.

The list was visible, but the compact Refresh action was partially covered and
its center pointer path was dead.

`lynx-automations-320-refresh-titlebar-overlap`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

New automation now owns a Plus icon, explicit text node, and accessible label.
Compact mode hides only its visual text and keeps the button at `32px`; medium
and wide retain the full label. This moves both right-aligned actions beyond
the measured titlebar controls without changing polling or route logic.

## After evidence

At the same `320x568` empty-list state:

- Refresh moved to `x=240..272`, `32x28`;
- New automation moved to `x=276..308`, `32x28`;
- both centers hit their own SVG subtrees;
- New automation retained its accessibility label while disabled because the
  empty snapshot had no projects;
- real Refresh pointer interaction increased observed `automation.list` calls
  from `2 -> 3`;
- `No automations yet` remained stable;
- relay and page-error gates were clean.

## Native regression boundary

Exact-owned Native used:

- PID `20379`;
- PID-derived `localhost:8902/session 1`;
- exact staged production bundle;
- `900x650`, medium viewport.

Native retained:

- one `644x46` header;
- Refresh `32x28`;
- full New automation text action `137x28`;
- real Refresh touch;
- empty warning/error console.

The first Native report script used node `123` although the actual Refresh node
was `124`, so box lookup and touch parameters were invalid. That failed before
interaction and was classified as a harness script error. The corrected node
completed the touch.

## Verification and cleanup

- Focused Automations suite: `7/7`.
- Expanded Automations/settings/shell suites: `32/32`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- Output/staged Native bundle SHA-256:
  `0e9a00958e4813e1c999a81f7f9fa1ca111b25788c59472b551046a065e14665`.
- Browser entry/exit cleanup passed.
- Exit returned `sessions: []` and zero agent-browser-owned processes.
- No screenshot was retained; local count remained `100`.
- Owned server/Web/Native processes and temporary state/stage were removed.
