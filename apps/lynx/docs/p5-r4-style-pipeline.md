# P5-R4 — Shared style pipeline

Date: 2026-07-27

## Result

The six P5-R1 screen graphs now drive a deterministic Tailwind/Lynx style
audit and a runtime CSS artifact:

1. Parse class strings from `className`, `cn`/`cva`/`clsx`/`cx`, and exported
   class constants in every eligible Web module.
2. Preserve per-class file and screen provenance in the core manifest.
3. Compile with Tailwind 3.4.19 plus
   `@lynx-js/tailwind-preset` 0.5.0 and the shared semantic theme.
4. Apply narrowly registered deterministic patches for desktop-responsive and
   UI state selectors, Web-shaped semantic alpha colors, spacing, and missing
   Lynx utilities.
5. Strip known unsupported selectors/properties and record them separately.
6. Emit runtime CSS only for modules already counted as physical
   `SHARED`/`PATCHED`; future screens enter the bundle automatically as their
   source reuse lands.

Commands:

```sh
bun run --cwd apps/lynx audit:style
npm run check:styles
```

## Coverage

The utility denominator excludes two explicit non-utility categories:

- authored component classes, which remain covered by their authored CSS;
- registered platform-unsupported utilities, which remain visible in the
  compat report and have a separate non-growth ratchet.

It does not exclude unknown/unmapped utilities.

Current six-screen result after the P6-C1 production-graph resolver correction:

- 2,256 eligible utility tokens;
- 14,057 extracted utility occurrences;
- 13,128 eligible weighted occurrences after 929 registered
  platform-unsupported occurrences;
- 10,952 generated + 1,918 deterministically patched occurrences;
- **98.03% weighted eligible coverage** (threshold: 95%);
- 258 still-unmapped eligible occurrences, retained in the report and ratchet.

Full data:

- `plan/reports/p5-r4-core-class-manifest.json`
- `plan/reports/p5-r4-style-coverage.md`
- `plan/style-audit.baseline.json`

`--check` fails on stale generated artifacts, coverage below the recorded
98.03% or 95% floor, increased uncovered weight, a new uncovered token,
increased platform-unsupported weight, or a new unsupported token.

## Runtime emission

Emitting the full future six-screen utility set immediately produced about
134 kB of CSS and repeatedly made the current Lynx DevTool session miss its
30-second DOM/screenshot deadline. The final pipeline keeps the complete audit
but emits only the 70 classes currently reachable through physically shared
modules: 3.7 kB of generated CSS. The latest P6-C1 shell bundle is 636.6 kB;
the increase is shared feature composition, not preloaded future-screen CSS.

That distinction is intentional:

- the audit prevents future migration work from hiding missing classes;
- the runtime artifact grows only with code that can actually render.

The shared Settings/Input probe then rendered successfully in production
Lynxtron with no console warning/error. The screenshot shows the Web class
recipes now controlling section gap, title spacing/type, card radius/border,
and input layout.

Evidence:
`shots/2026-07-27/port/p5-r4/style-pipeline/lynx.png`.

## Semantic mappings

`tokens.css` remains the source of truth. Lynx Desktop 4.1 currently loses some
imported semantic var-to-var aliases, so `lynx-overrides.css` concretizes the
light values for:

- background/surface/elevated roles;
- foreground/secondary text;
- border/input/ring;
- primary/secondary/muted/accent/destructive/status roles;
- sidebar surface, active, foreground, border, and ring.

Spacing uses the existing 4 px Tailwind scale; Web v4 `--spacing(n)` expressions
are deterministically rewritten to px before Rspeedy. Typography keeps the
shared font variables and Web font-size variables/fallbacks. Transform
utilities receive fallbacks for Tailwind's internal variables because only
utilities, not Tailwind browser base CSS, are emitted.

Dark semantic values remain Phase 7 work; P5-R4 does not claim two-theme
fidelity.
