# Composer footer trigger text current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `674512ed`.
- Current Web Model and Traits footer labels resolve to 11px/16.5px/400. The
  dedicated Lynx labels previously resolved to 11px/normal/400 with 13px
  visual boxes.
- `ComposerModelTriggerLabelLynx` and `ComposerTraitsTriggerLabelLynx` now
  explicitly own 16.5px line height. Their existing 28px trigger geometry is
  unchanged; 10px chevron/meta owners are untouched.
- Web and Lynx-for-Web use the same preserved landing snapshot. Both labels
  resolve to 11px/16.5px/400; both PNGs are `1280x820` and browser errors
  empty.
- Focused picker contract: 1 file, 3/3 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Exact-owned Native bundle
  `ca441805a476ac856e0a6f3e761e37b222c4f9f835c5c798b9c7b478ccbdb6b9`,
  root PID `21351`, PID-derived `localhost:8904/session 1`. Both trigger and
  label roles were retained. Native measured both triggers at 28px high and
  both labels at 11px/16.5px; native box geometry rounds the fractional line
  box to 17px. Raw frame is `2560x1576` and warning/error console empty.
