# Settings shared menu text current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `3a3d7a5e`.
- Current Web General Settings Select options resolve to 12px/18px/400. The
  shared Lynx MenuRadioItem text previously resolved to 12px/normal/400 with a
  15px visual box.
- `.LxMenuItem__text` now explicitly owns 12px/18px. Shared vertical padding
  changed from 7px to 6px so the existing 32px Native row remains unchanged.
- Web and a fresh named Lynx-for-Web session entered General Settings and
  opened Default thread mode through rendered controls. Web options and Lynx
  item text resolve to 12px/18px/400; both PNGs are `1280x820` and browser
  errors empty.
- An older reused Lynx-for-Web session blanked its root after Settings
  navigation. That run was rejected as harness state pollution and produced no
  retained evidence; the fresh session passed the same path.
- Focused Menu suite: 1 file, 9/9 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Exact-owned Native bundle
  `cebcd55d6123e13bf2ed041783786b47dfe0195db3ee88b9863f2a3c69da6721`,
  root PID `96008`, PID-derived `localhost:8904/session 1`. Real Sidebar
  Settings→thread-mode touches retained popup/row/text roles. Native measured
  text at 12px/18px with an 18px box, row at `206x32`, raw frame at
  `2560x1576`, and warning/error console empty.
