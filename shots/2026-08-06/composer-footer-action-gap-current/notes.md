# Composer footer action gap current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `d9f23222`.
- Web footer actions use `gap-2` (8px). After Voice was corrected to 28px, the
  previous Lynx 6px owner placed Voice at x=1065 while Send stayed x=1099.
- `.ComposerFooterActionsLynx` now owns an 8px gap. Current Web and
  Lynx-for-Web both place Voice at x=1063 and Send at x=1099; both controls are
  28x28 and the measured gap is exactly 8px.
- Both browser PNGs are `1280x820` and browser error logs are empty.
- Focused picker contract: 1 file, 3/3 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Exact-owned Native bundle
  `324d1c1de916f2eed5c70467add86810e5b40fd472136444ef11d332d03d9680`,
  root PID `51059`, PID-derived `localhost:8902/session 1`. Native retained the
  action group, Voice, and Send roles at x=1063/x=1099 with 28x28 controls and
  an exact 8px gap. Raw frame is `2560x1576` and warning/error console empty.
- The DevTool endpoint was resolved from the owned process tree rather than a
  remembered port.
