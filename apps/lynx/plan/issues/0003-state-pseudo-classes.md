# Draft issue 0003 — target: lynx-family/lynx

**Suggested title:** [CSS] Support state pseudo-classes (`:hover`, `:focus-visible`, `:focus-within`) — only `:active` works today

**Labels:** feature, css, platform/desktop

---

## Environment

- Lynx SDK 4.1, ReactLynx, Lynxtron desktop shell 0.0.7–0.0.9 (macOS arm64)

## Problem

Lynx CSS currently supports `:active` but no other interaction-state pseudo-classes. On pointer-driven desktop targets this is the single most pervasive porting cost:

- Porting an existing React web app (~200 components), we counted **312 class-level `:hover` usages and 155 focus-related usages** in the source styles. None of them can be expressed in Lynx CSS.
- The workaround is to hand-wire every interactive view: translate `mouseenter`/`mouseleave` (and focus/blur, where focus exists at all) into state classes like `.ui-hover` / `.ui-pressed` / `.ui-focus` through a shared helper, on every button, row, tab, menu item, and control. This works but adds a JS round-trip per state flip, an extra binding surface on every element, and a permanent divergence from the web stylesheet.

## Ask

1. First-class `:hover` support on platforms with a pointer (desktop at minimum) — this was the highest-value single item in our whole port.
2. `:focus-visible` / `:focus-within` once view focus exists on the platform (see our separate desktop keyboard/focus issue — the two combine: today focus styling is impossible both in CSS _and_ in JS).
3. If engine-level support is not planned, documenting the recommended state-class pattern (and ideally shipping it as a framework helper) would at least standardize the workaround.

## Notes

- Related, same family: structural pseudo-classes (`:first-child`, `:last-child`, `:disabled`, `:not()`) and attribute selectors (`[data-*]`) are undocumented — a support matrix in the docs would prevent a lot of trial-and-error. We can file that separately if useful.
