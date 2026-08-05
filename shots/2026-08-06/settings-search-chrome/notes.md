# Settings search chrome evidence

Status: retained current-head Web authority and Lynx-for-Web resolved styles

## Root cause

The Lynx Settings search composed two controls:

- a hand-written 28px bordered search shell; and
- the default 32px shared `Input` control inside it.

That produced a 32px input wrapper overflowing a 28px shell, an 8px radius,
12px text, and an opaque white surface. Web uses one 28px soft Input control
with a 10px radius and 11px text.

The fix makes the shared `Input` primitive the sole chrome owner with
`size="sm"` and `variant="soft"`. The outer view now only positions the search
icon.

## Resolved styles

Web light:

- control: x=10, y=94, 236x28;
- radius: 10px;
- font: 11px;
- soft fill: foreground 2%;
- border: foreground 7%.

Lynx-for-Web light:

- control: x=10, y=58, 235x28;
- radius: 10px;
- font: 11px;
- fill: `rgba(13, 13, 13, 0.02)`;
- border: `rgba(13, 13, 13, 0.07)`.

Lynx-for-Web dark keeps the same geometry and resolves the surface to
`rgba(252, 252, 252, 0.02)` with a 7% foreground border.

The available search icon now applies Web's `text-muted-foreground/70` tone.
The unavailable capability row retains its existing container-level opacity,
so this correction does not double-dim that state.

Internal metrics now follow the Web `SearchInput` source contract: the icon is
10px from the control edge, text begins at 32px, and the trailing inset is
10px. This replaces the Lynx-only 9px / 28px / 8px values without changing the
validated 28px outer geometry.

A real keyboard query for `archived thread` still produced exactly one result
with accessible label `Archived: Archived threads`.

The no-match state now reuses the Web section-label identity instead of the old
11px scaffold style. A real `zzzz-no-setting` query resolved to a 243x26 row at
x=6/y=98 with 12px/400/18px typography, 4px 8px padding, and 0.58 opacity.

Multiple result groups now reuse Web's shared nested-list 2px gap. A real broad
`e` query returned 12 results; the first three 56px groups started at y=98,
y=156, and y=214, proving a 58px pitch.

## Identity

- Lynx-for-Web bundle:
  `79d8f97fba1b10dd8517a087b6133c5de3d00dabc430124ed188e6b134703226`
- Native/Desktop bundle:
  `7b5c664043646bc7e5f51ac7f9919c8b304cdc5804d05655a3f02d2a6578ab5c`
- Icon-tone follow-up bundles: Lynx-for-Web `12672fce…`; Native
  `09081f2c…`.
- Empty-state follow-up bundles: Lynx-for-Web `cf8a9390…`; Native
  `7cf52771…`.
- Internal-metric follow-up bundles: Lynx-for-Web `aa3f2d78…`; Native
  `676c5594…`.
- Multi-result gap bundles: Lynx-for-Web `52d51dda…`; Native `cf15659a…`.
- Focused search/chrome suites: 6/6.
- Web and Native/Desktop production builds passed with only the existing CSS
  and optional `ws` native-module warnings.
