# Settings Models Saved Row Dark

## Classification

- New scope: Settings Models × saved custom model row × dark × `1280x820`.
- P2 visual product loss:
  `lynx-custom-model-saved-row-height`, `1.00 -> 0.00`.
- No harness or platform delta was used to reduce the score.

## Discovery

Earlier current-head Models evidence covered the empty editor, add/remove
workflow, light theme, responsive stacking, and provider-control radius. This
loop added the later-current-head saved-row dark state across Web,
Lynx-for-Web, and exact Native.

A temporary Codex model slug was added and removed through Web authority's
rendered controls. No settings file or database was written directly.

Before the fix:

- Web saved row:
  `596x36 @ (470,415)`;
- Lynx-for-Web saved row:
  `596x40 @ (470,419)`.

The Lynx row accumulated 4px per saved model. Its remove action correctly kept
a 24px hit target, but the row also applied 8px vertical padding. The resulting
40px minimum exceeded Web's 36px row.

## Fix

Reduce only the saved-row vertical padding from `8px` to `6px`. The 24px
remove action remains unchanged, so the row resolves to Web's 36px height
without reducing the control hit target or changing global Settings
primitives.

## Web And Lynx-for-Web

The canonical rendered workflow was:

1. Web added `fidelity-dark-model-temp`;
2. fresh Lynx-for-Web rendered the saved row, reset action, and remove action;
3. Web removed the temporary slug;
4. the same workflow was repeated after the fix to verify geometry.

After the fix:

- Lynx-for-Web saved row:
  `596x36 @ (470,419)`;
- reset action:
  `32x24`;
- remove action:
  `32x24`;
- relay:
  one connection attempt,
  `feature-open -> connect-success -> socket-owned`,
  socket state `1`, zero pending requests, no transport/RPC error;
- browser page errors: empty.

The 4px absolute y difference from Web belongs to the enclosing current Lynx
section rhythm; the saved-row height itself is exact and no longer accumulates
with each saved model.

## Exact Native

The exact-owned production instance is:

- PID `60751`;
- PID-derived DevTool client `localhost:8902`, session `1`;
- production session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- bundle SHA-256:
  `bed3432d17492c8a8ba77267718c1475dde1a8df15466069d2715ca59191ce25`;
- one established socket to `127.0.0.1:58090`.

Web authority added `fidelity-native-model-temp` through the real UI before
the Native launch. DevTool then proved:

- complete Codex/model/remove row anatomy;
- row border box `596x36`;
- content box `572x24`;
- 24px remove control retained;
- fresh warning/error console output empty.

Web authority removed the temporary slug after Native inspection. Final
settings contained no temporary custom models.

## Verification

- focused Custom Models tests: `1 file / 2 tests`;
- Lynx-for-Web production build passed;
- complete Lynx/Desktop production build passed;
- both temporary model slugs were removed through rendered Web controls;
- no screenshots added; repository screenshot count remained `100`;
- every browser loop passed the ownership cleanup gate.
