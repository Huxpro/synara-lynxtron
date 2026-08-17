# Draft issue 0001 — target: lynx-family/lynx

**Suggested title:** [Desktop] App crashes with `NSInternalInconsistencyException: Flutter text model must not be null` when typing into a focused `<input>`

**Labels:** bug, platform/desktop, crash

---

## Environment

- Lynx SDK 4.1 (`@lynx-js/type-config` 4.1.1), ReactLynx (`@lynx-js/react-rsbuild-plugin` 0.18.1)
- Lynxtron desktop shell 0.0.7 (also reproduced through 0.0.9), macOS arm64
- Rspeedy production build

## What happens

Focusing a native `<input>` element (via a real pointer tap at its coordinates) and then sending ordinary key input crashes the whole application with:

```
NSInternalInconsistencyException: Flutter text model must not be null
```

The crash is reproducible and happens on the first keystroke after focus. The main process aborts; this is not recoverable from JS.

Notes that may help localize it:

- Plain `<textarea>` text entry works (multiline, default-value, `bindinput`, ref `setValue` are all fine in the same build), so the crash appears specific to the single-line `<input>` text-model path on the desktop host.
- IME composition into `<textarea>` also works (real Pinyin IME produces `isComposing=true` update events and a committed event on Space).

## Steps to reproduce

1. Render a page containing a plain `<input>` (we hit it with the standard input element, no custom bindings needed).
2. Tap the input so it receives focus (coordinate-based tap; programmatic `setFocus` followed by key input reproduces it as well).
3. Press any character key.
4. App aborts with the exception above.

## Expected

Text is inserted, or — if single-line `<input>` is not yet supported on desktop — the element should degrade gracefully instead of aborting the process.

## Impact

Any desktop product with a search field or a single-line form control has to ship it disabled. In our port (a desktop coding-agent GUI ported from a React web app) we had to render Settings search and PR search as `Search unavailable in this runtime` with `aria-disabled=true` and no input element mounted at all, purely to keep users away from this crash path.
