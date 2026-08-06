# Sidebar primary focus ring current-head fidelity

Status: retained Web and real Lynx-for-Web focus evidence plus exact-owned
Native bundle/runtime evidence

- Source base: `2248f074`.
- Current Web New thread focus-visible uses a one-pixel inset ring and no
  painted outline. The focused row remains `244x28` with its existing 8px
  radius.
- Before this slice, Lynx used an outer `0 0 0 1px` shadow. Once the Web-only
  tab-stop bridge made the row genuinely keyboard focusable, the browser also
  added its default `outline: auto`, producing a double/external focus seam.
- The shared Lynx primary-action focus owner now sets `outline: none` and
  `box-shadow: inset 0 0 0 1px var(--ring)`.
- Real Lynx-for-Web Tab traversal reaches New thread and publishes `ui-focus`
  / `:focus-visible`. Its computed shadow is
  `rgb(1,105,204) 0 0 0 1px inset`, and its outline style is `none`. Web and
  Lynx-for-Web frames are `1280x820`; browser error logs are empty.
- The one-pixel Web/Lynx row width difference and 32px vertical offset remain
  the registered separator/titlebar engine boundary and were not patched.
  Lynx-for-Web reports the compound custom VIEW radius as zero, so this slice
  does not claim numeric radius parity from that value.
- Focused suites: 2 files, 6/6 tests. Configured Lynx-for-Web and
  Native/Desktop production builds pass with only the existing encoder and
  optional `ws` warnings.
- Exact-owned Native bundle
  `b7fb1f36c1dbedb46c7380f31fe35d35397da22559b300d8a7e43bceee65590b`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8904/session 1`; the staged bundle
  contains the encoded inset-ring marker, the raw default frame is
  `2560x1576`, and warning/error console is empty.
- Native focused-row visuals are not claimed because this DevTool target has
  no supported retained focus/key command. Native focus class publication
  remains covered by the real Lynx interaction-state contract.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
