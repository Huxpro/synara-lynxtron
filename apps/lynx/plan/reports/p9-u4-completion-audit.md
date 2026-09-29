# P9-U4 objective completion audit

Status: feature-state follow-up complete; keyboard shortcut certification deferred by user

## Objective as concrete deliverables

1. Keep `shots/2026-08-03/p8-q2/comparison.html` as the permanent,
   filterable evidence surface for every retained state.
2. Verify every enabled Command K capability through the rendered product:
   open/toggle/dismiss, query classes, action activation, loading/error/retry,
   empty results, filesystem browse, provider import, usage, appearance, and
   explicit unavailable capabilities.
3. Verify Command K keyboard behavior with real key delivery:
   ArrowUp/ArrowDown, Tab/Shift+Tab, Enter, Escape, and repeated Cmd+K.
4. Verify Composer details through rendered controls:
   extras closed/open, attachment action, Plan off/on, Fast default/fast,
   project picker empty/open/search/selected/reset, skill
   trigger/filter/selected/cleared, and mention trigger/filter/selected/cleared.
5. Retain paired Browser evidence for layout/product-state parity and
   exact-owned Native evidence for platform keyboard, textarea, focus, host
   dialogs, and persistence semantics.
6. Fix every unregistered Web/Lynx difference found during verification,
   rerun focused tests/builds, update the comparison gallery, commit, and push.

## Prompt-to-artifact checklist

| Requirement                                                 | Artifact / product evidence                | Current audit                                                                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comparison remains the normal workflow                      | `shots/2026-08-03/p8-q2/comparison.html`   | pass; follow-up states added                                                                                                                        |
| Command K real Cmd+K open                                   | `command-k/native/empty-1280/`             | pass                                                                                                                                                |
| Repeated Cmd+K and Escape                                   | Browser product interaction                | Web pass; Native shortcut certification deferred by user                                                                                            |
| Suggested/action/project/thread/message/theme/empty queries | `command-k/browser/` and `browser/states/` | pass                                                                                                                                                |
| Project-name thread query                                   | `command-k/browser/states/*-project.json`  | pass: `Lynx Web Spike` returns all three project threads plus the project row                                                                       |
| Appearance activation and persistence                       | product storage + restart                  | implementation and earlier theme evidence retained; restart persistence remains outside this follow-up                                              |
| Add project / filesystem browse                             | rendered path mode and real RPC            | pass: Web dialog + canonical `filesystem.browse` evidence                                                                                           |
| Import thread/provider state                                | rendered import mode and real RPC          | pass: Web provider surface + five canonical capability results                                                                                      |
| Usage action/provider cards                                 | rendered navigation and real usage RPC     | pass: Web Usage route + three real usage records                                                                                                    |
| Loading/error/retry/empty                                   | rendered states                            | pass for empty and real search error→Retry recovery; loading text remains source/test contract                                                      |
| Keyboard Arrow/Tab/Shift+Tab/Enter/Escape                   | exact-owned delivery and state assertions  | deferred by user; not claimed complete                                                                                                              |
| Pointer activation for enabled result types                 | rendered interactions                      | pass for Web action surfaces and exact Native Composer controls; Lynx-for-Web CommandItem activation is an explicit custom-element harness boundary |
| Feedback/Spaces do not fake capability                      | palette omission + report                  | pass, explicit unavailable                                                                                                                          |
| Extras closed/open                                          | paired Browser frames                      | pass                                                                                                                                                |
| Attachment action                                           | host file dialog semantics                 | menu visible; host dialog intentionally not opened over user desktop                                                                                |
| Plan off/on and first-send mode                             | paired state + command projection          | pass for Browser off/on and Native checked; first-send projection covered by command construction                                                   |
| Fast default/fast                                           | rendered submenu and selected value        | pass; activation exposed and fixed a real missing-icon crash                                                                                        |
| Project empty/open/search/selected/reset                    | paired states                              | pass for Web search/select/reset and Native open/select/reset                                                                                       |
| Skills trigger/filter/select/clear                          | paired Browser + structured payload        | pass for trigger/filter/select/real editor clear; Native text input deferred with keyboard                                                          |
| Mentions trigger/filter/select/clear                        | paired Browser + structured payload        | pass for trigger/filter/select/real editor clear; Native text input deferred with keyboard                                                          |
| Browser geometry / dimensions / console                     | notes + PNG checks                         | pass for retained Browser cells                                                                                                                     |
| Native exact-owned dimensions / console / identity          | PID-derived DevTool evidence               | pass for Composer pointer states; six 2560×1576 frames and empty console                                                                            |
| Focused tests and production builds                         | command output in final audit              | pass: Web unit 36, TraitsPicker Browser 23, Lynx 16, Web and Lynx/Desktop production builds                                                         |
| Commit and push                                             | git commit and remote ref                  | satisfied by the P9-U4 follow-up commit containing this audit                                                                                       |

Passing unit tests or existing screenshots are not sufficient for rows marked
pending or weak. Keyboard delivery remains an explicit deferred boundary by
user request and is not represented as a pass.

## Final follow-up gates

- Web focused unit: 2 files / 36 tests passed.
- Web TraitsPicker Browser: 1 file / 23 tests passed after installing the
  repository's required Playwright Chromium cache.
- Lynx focused: 4 files / 16 tests passed.
- Web production build passed.
- Lynx/Desktop production build passed with only the existing unsupported CSS
  and optional `ws` native-acceleration warnings.
- `git diff --check` passed.
- Comparison follow-up: 8/8 new filter cells loaded every referenced image at
  its expected dimensions.
- Snapshot SHA-256 remained
  `98753f94c2df90724d0a892353c03bf2fba50bb880de6d9db012f1266f606070`.
- Default user window-state SHA-256 remained
  `770cc84f1973b042e89d5cbe38903d8f4a9d7bd136bb084aaccf8c0cedbf70e4`.
- Owned ports `62190`, `63231`, `63232`, and `8903` were released.
