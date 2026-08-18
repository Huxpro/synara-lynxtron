# Provider Update Prompt Expanded Parity

## Classification

- New scope: provider update prompt × expanded action toast × Settings Skills ×
  dark × `1280x820` × Web/Lynx-for-Web/Native.
- P2 visual product loss:
  `lynx-provider-update-prompt-expanded-layout`, `1.00 -> 0.00`.
- Native product loss discovered during certification:
  `native-provider-prompt-auto-text-height`, `1.00 -> 0.00`.
- Intentional platform delta:
  `lynx-provider-prompt-backdrop-fallback`, `1.00 -> 1.00`.

No loss weight, sample filter, or scope denominator changed.

## Discovery

The preceding global prompt slice proved content and action availability but
did not compare the expanded toast anatomy against Web authority.

In the new Settings Skills cell:

- Web authority rendered an expanded notification:
  `384x122 @ (448,16)`;
- Lynx rendered a compact horizontal strip:
  `420x72 @ (430,16)`.

The compact Lynx strip omitted the warning icon, compressed title and
description into an `182.4px` copy column, and placed Review, Update all, and
dismiss in the same horizontal row. This was a structural P2 product loss, not
pixel noise.

## Web Authority

Measured Web anatomy:

- host:
  `384x122 @ (448,16)`;
- warning icon:
  `16px` at `x=463`;
- title:
  `304x20 @ (487,29)`, `14px/20px`, normal weight;
- description:
  `304x40 @ (487,51)`, `14px/20px`, `72%` foreground;
- actions:
  `y=101`, `24px` high, `6px` gap;
- Review:
  `93.56x24`;
- Update all:
  `66.03x24`;
- dismiss:
  `24x24 @ (799,25)`;
- radius:
  `18px`.

## Fix

The Lynx prompt now owns the same expanded anatomy:

- warning icon;
- content column;
- copy column;
- separate action row;
- absolute top-right dismiss action.

The notification surface uses the same dimensions, padding, radius,
typography, action sizes, and coordinates as Web. Lynx lacks Web's backdrop
blur on this surface, so the translucent accent fill allowed the underlying
Settings heading to remain legible through the prompt. The Lynx fallback is
therefore an opaque theme-specific accent surface:

- dark:
  `#17212b`;
- light:
  `#eaf3fc`.

This intentional platform delta preserves the same visual tone while ensuring
the prompt remains readable.

## Lynx-for-Web

After the fix, the complete geometry matched Web authority:

- host:
  `384x122 @ (448,16)`;
- icon:
  `16x16 @ (463,29)`;
- title:
  `304x20 @ (487,29)`;
- description:
  `304x40 @ (487,51)`;
- actions:
  `304x24 @ (487,101)`;
- dismiss:
  `24x24 @ (799,25)`.

The final screenshot showed no underlying text bleeding through the surface.

Relay diagnostics recorded:

- one connection attempt;
- socket state `1`;
- `connect-attempt -> feature-open -> connect-success -> socket-owned`;
- renderer-ready route:
  `/settings/skills`;
- zero pending requests;
- no transport or RPC error;
- no browser page error.

## Native Certification

The first Native build exposed a second real product loss:

- both auto-height text nodes resolved to `0px`;
- the copy owner collapsed to `0px`;
- Native flex `gap` resolved to `0px`;
- title, description, and actions overlapped.

The cross-platform fallback now uses explicit authority-derived dimensions:

- content:
  `96px`;
- copy:
  `62px`;
- title:
  `20px`;
- description:
  `40px`;
- actions:
  `24px`;
- action separation:
  second-action `margin-left: 6px`.

Final exact-owned Native:

- PID:
  `91696`;
- PID-derived DevTool client:
  `localhost:8902`, session `1`;
- bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`;
- bundle SHA-256:
  `e4c488aedcafbb43f147b6c1ce70704e3220c517c51989c22159d69cc450844d`;
- route:
  `/settings/skills`;
- server socket:
  `127.0.0.1:54641 -> 127.0.0.1:58090`, established;
- warning/error console:
  empty.

Final Native geometry:

- host border:
  `384x122 @ (448,16)`;
- title:
  `304x20 @ (487,29)`;
- description:
  `304x40 @ (487,51)`;
- actions:
  `304x24 @ (487,101)`;
- dismiss:
  `24x24 @ (799,25)`.

The Native screenshot confirms the overlap is gone and all content/actions are
readable. Whole-page Web/Native visual attribution remains excluded because
the Native instance retained a different sidebar width; prompt-local geometry
is viewport-fixed and independently exact.

## Verification

- focused Lynx prompt tests:
  `1 file / 5 tests`;
- shared Web provider-update tests:
  `1 file / 11 tests`;
- complete workspace production build passed;
- final Lynx-for-Web production build passed;
- final Lynx/Desktop production build and Sharp staging passed;
- final Web/Lynx-for-Web prompt geometry and relay checks passed;
- final exact-owned Native DOM/box/screenshot/console/socket checks passed;
- Update all was never activated, so provider binaries were unchanged;
- no screenshots added; repository screenshot count remained `100`;
- temporary captures are deleted before commit;
- every failed browser or DevTool probe was followed by `browser:gate`.
