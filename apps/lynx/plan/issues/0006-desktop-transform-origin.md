# Draft issue 0006 — target: lynx-family/lynx

**Suggested title:** [Desktop][CSS] `transform-origin: center` is ignored and `enableNewTransformOrigin` has no effect

**Labels:** bug, css, platform/desktop

---

## Environment

- `@lynx-js/type-config` 4.1.1
- ReactLynx (`@lynx-js/react-rsbuild-plugin` 0.18.1)
- Lynxtron 0.0.12-dev, DevTool-reported Lynx SDK 4.2
- macOS arm64
- Rspeedy production builds

## Reproduction

Render a 14x14 view with asymmetric colored edges so its orientation and
anchor are visible:

```css
.glyph {
  width: 14px;
  height: 14px;
  background-color: #2563eb;
  border-left: 4px solid #dc2626;
  border-top: 3px solid #16a34a;
}

.keyword {
  transform-origin: center;
}

.percentage {
  transform-origin: 50% 50%;
}

.rotated {
  transform: rotate(90deg);
}
```

Toggle `.rotated` from a real tap.

We built and launched three isolated production bundles:

1. `enableNewTransformOrigin` omitted;
2. explicit `false`;
3. explicit `true`.

Each round verified that the staged Desktop bundle was byte-identical to the
fresh Rspeedy output before launch.

## Actual result

Both origin syntaxes behave identically in all three config states.

| Origin    | Config omitted              | `false` | `true` |
| --------- | --------------------------- | ------- | ------ |
| `center`  | center moves `(-14px, 0px)` | same    | same   |
| `50% 50%` | center moves `(-14px, 0px)` | same    | same   |

The DevTool computed style reports an origin value (`[50,11,50,11]`), and the
transform reports `rotate(90deg)`, but the rendered quad still rotates through
the top-left path. Enabling or disabling `enableNewTransformOrigin` causes no
observable Desktop behavior difference.

The precise quad for the keyword case is representative:

```text
before:  [58,621, 72,621, 72,635, 58,635]  center=(65,628)
after:   [58,621, 58,635, 44,635, 44,621]  center=(51,628)
delta:   (-14,0)
```

## Expected result

Both `center` and `50% 50%` should preserve the element center while rotating:

```text
center delta: (0,0)
```

If Desktop does not support `enableNewTransformOrigin`, the config validator or
documentation should say so explicitly. The current type documentation lists
only Android, iOS, and HarmonyOS, but Desktop silently accepts the config and
still exposes a computed origin.

## Impact

A 14px disclosure chevron jumps horizontally when rotated. We cannot use the
standard single-icon rotation pattern and must render separate expanded and
collapsed SVG assets instead. The same anchor error affects any compact
rotation or scale transform where visual stability matters.

## Evidence

The source repository retains:

- `shots/2026-08-18/flag-experiments/enableNewTransformOrigin/default-off-on.png`;
- `shots/2026-08-18/flag-experiments/results.json` with per-round production
  bundle SHA-256 values, exact pre/post transform quads and centers, and empty
  warning/error console captures.

The experiment-only probe is removed after capture; the dual-SVG workaround
remains in the product.
