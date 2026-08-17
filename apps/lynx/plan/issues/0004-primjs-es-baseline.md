# Draft issue 0004 — target: lynx-family/primjs

**Suggested title:** ES2021–ES2023 + WHATWG baseline gaps: `Object.hasOwn`, `String.replaceAll`, `Array.toSorted`, `TextEncoder`/`TextDecoder`, `URLSearchParams`

**Labels:** feature, stdlib

---

## Environment

- PrimJS as shipped in Lynx SDK 4.1 main thread (via ReactLynx dual-thread builds), Lynxtron desktop 0.0.7–0.0.9

## Problem

The main-thread engine is missing several standard built-ins that are now baseline across engines, and each one bit us the same dangerous way: **the build, type-check, unit tests, and the background thread all pass** (tooling and the background runtime use a modern engine), and the failure only appears at runtime on the main thread as `... is not a function` — sometimes only on a code path a user has to reach first.

Concrete cases from porting a mid-sized React app:

| Missing | Spec | How it surfaced |
|---|---|---|
| `Object.hasOwn` | ES2022 | Runtime `not a function` inside a schema library's parser construction, reached through a shared dependency graph |
| `String.prototype.replaceAll` | ES2021 | A top-level initializer using it caused a **native startup crash** (bisected to the exact commit); a second occurrence only surfaced when a production fixture was force-opened |
| `Array.prototype.toSorted` | ES2023 | Surfaced as an *unnamed* non-blocking rejection until DevTool produced a named stack; three more call sites found afterwards. Sibling methods (`toReversed`, `toSpliced`, `with`) presumably share the gap |
| `TextEncoder` / `TextDecoder` | WHATWG Encoding | Required by common wire/serialization libraries; we ship a pure-JS UTF-8 polyfill (ASCII/CJK/astral-plane tested) as the first import of our entry file |
| `URLSearchParams` | WHATWG URL | Needs `url-search-params-polyfill` loaded before everything else |

## Ask

1. Bring the main-thread engine to an **ES2023 baseline** (the ES2021–2023 additions above are pure-JS, spec-complete, no design space).
2. Provide built-in `TextEncoder`/`TextDecoder` and `URLSearchParams` (or an official core-js-style preset blessed for PrimJS).
3. Until then: **document the supported language/stdlib baseline** for the main thread, and ideally have the ReactLynx compiler lint/flag known-missing methods in code destined for main-thread bytecode — the "green build, runtime-only crash" failure shape is the expensive part, more than any individual missing method.

## Related (separate reports possible)

While reducing these we also hit two main-thread execution issues that we can try to minimize into standalone repros if useful: micromark's regexes fail bytecode compilation with `SyntaxError: invalid escape sequence in regular expression`, and the Effect library's runtime throws `e[i] is not a function` on the main thread even after the encoding polyfills are in place.
