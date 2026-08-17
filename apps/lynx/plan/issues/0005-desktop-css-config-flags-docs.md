# Draft issue 0005 — target: lynx-family/lynx

Filed: https://github.com/lynx-family/lynx/issues/8662

**Suggested title:** [Docs][Desktop] Document `enableCSSInlineVariables` and `enableCSSRule` support, defaults, and migration guidance

**Labels:** documentation, css, platform/desktop

---

## Environment

- `@lynx-js/type-config` 4.1.1
- ReactLynx (`@lynx-js/react-rsbuild-plugin` 0.18.1)
- Lynxtron 0.0.12-dev, DevTool-reported Lynx SDK 4.2
- macOS arm64
- Rspeedy production builds

## Finding

Both config flags work on Lynxtron Desktop, but their type documentation lists
only Android, iOS, and HarmonyOS:

- `enableCSSInlineVariables` defaults to `false`;
- `enableCSSRule` defaults to `false`.

The defaults make ordinary Web-style code fail silently on Desktop unless an
application already knows these flags exist.

We ran isolated production builds with each flag explicitly off and on. Every
round verified that the staged Desktop bundle was byte-identical to the fresh
Rspeedy output before launch.

### `enableCSSInlineVariables`

Probe:

```tsx
<view
  style={{
    "--probe-background": dynamicColor,
    "--probe-foreground": "#fff",
  }}
>
  <view className="target" />
</view>
```

```css
:root {
  --probe-background: #16a34a;
}

.target {
  background-color: var(--probe-background);
}
```

Computed descendant backgrounds:

| Config  | Initial requested value             | After a real tap changes the value |
| ------- | ----------------------------------- | ---------------------------------- |
| `false` | green `rgb(22,163,74)` from `:root` | still green                        |
| `true`  | red `rgb(239,68,68)`                | blue `rgb(37,99,235)`              |

So Desktop supports both initial inline-variable resolution and runtime
descendant re-evaluation when the flag is enabled.

A stylesheet class-scoped variable override also changed green to purple in
both config states. That path works independently from the inline flag on the
current runtime.

### `enableCSSRule`

Probe rules:

```css
@media (max-width: 99999px) {
  /* always true */
}
@supports (display: flex) {
  /* true */
}
@media (max-width: 1000px) {
  /* resize boundary */
}
```

Results:

| Config  | Always-true media | Supports | 1100 -> 900 -> 1100 resize |
| ------- | ----------------- | -------- | -------------------------- |
| `false` | dropped           | dropped  | never matches              |
| `true`  | matches           | matches  | false -> true -> false     |

The resize used the real Lynxtron window content-size path. This proves both
rule decoding and runtime media-query re-evaluation. We saw no
`Context construct failed`, JSON parse proxy error, warning, or runtime error
with the flag enabled.

`prefers-reduced-motion: reduce` did not match the current macOS preference.
That experiment does not establish whether Desktop publishes system preference
signals; it only establishes that the rule path remains healthy.

## Documentation request

1. Include Desktop/PC in the supported-platform list for both flags.
2. State their effective defaults for Desktop.
3. Add a troubleshooting note:
   - inline custom properties behaving like static styles usually means
     `enableCSSInlineVariables` is disabled;
   - `@media` / `@supports` disappearing from a Native bundle usually means
     `enableCSSRule` is disabled.
4. Clarify whether these flags are intentionally opt-in for compatibility, and
   whether a future target SDK changes their defaults.
5. Document Desktop system-preference coverage separately from CSS rule
   parsing (`prefers-reduced-motion`, `prefers-color-scheme`, and runtime
   `matchMedia` are distinct capabilities).

## Impact

Before finding these flags, we classified dynamic CSS variables and media
queries as missing Desktop engine capabilities and built substantial
workarounds:

- generated direct-value theme selector sheets;
- a host content-bounds + resize event + root viewport-class pipeline.

Those fallbacks remain useful, but the engine capability itself is present.
Correct platform/default documentation would prevent other Desktop adopters
from repeating the same investigation and architecture work.

## Evidence

The source repository retains:

- `shots/2026-08-18/flag-experiments/enableCSSInlineVariables/off-on.png`;
- `shots/2026-08-18/flag-experiments/enableCSSRule/off-on-resize.png`;
- `shots/2026-08-18/flag-experiments/results.json` with per-round production
  bundle SHA-256 values, computed styles, dimensions, and console results.

No probe route or experiment code remains in the product.
