# P9-U4 Command K detailed state matrix

Status: Browser matrix complete; Native keyboard certification remains

## Acceptance contract

Command K is complete only when retained evidence covers:

1. Open from the real `Cmd+K` host shortcut.
2. Repeated `Cmd+K` toggle and Escape dismissal.
3. Empty-query suggested actions.
4. Action search.
5. Project search.
6. Thread-title search.
7. Project-name thread search.
8. Message-content search with snippet and hit metadata.
9. Theme-mode and code-theme search.
10. Loading, error/retry, and empty-result states.
11. Keyboard ArrowUp/ArrowDown, Tab/Shift+Tab, Enter, and Escape while the
    search field retains text focus.
12. Pointer activation for the same enabled result types.
13. Browser paired geometry and exact-owned Native evidence.
14. Every Web-only function is either implemented or shown as an explicit
    unavailable capability. Hidden missing functionality is not accepted.

## Current implementation audit

| Capability | Web authority | Lynx before P9-U4 | Required action |
|---|---|---|---|
| New chat | enabled | enabled | verify |
| New thread | enabled | hidden | enable with real landing navigation |
| Settings | enabled | enabled | verify |
| Project results | enabled | enabled | verify |
| Thread/title/project/message results | enabled | enabled | verify all match kinds |
| Theme mode | enabled | hard-disabled | implement persisted native theme setter |
| Code theme | enabled | hard-disabled | implement persisted native code-theme setter |
| Add project/path browse | enabled | hard-disabled; native API returns null | add raw RPC ports before enabling |
| Import thread | enabled when provider supports it | hard-disabled; raw RPC port absent | add capability discovery/import RPC before enabling |
| Feedback | global Web dialog; browser fetch delivery | no Lynx feedback surface or host/server delivery port | explicit unavailable capability until a real delivery surface exists |
| Usage settings | dedicated Web panel | Lynx Usage panel unavailable | implement panel before enabling |
| Spaces | Web store/actions | snapshot currently omits spaces and active-space UI mutation | explicit unavailable capability until Sidebar space filtering/state is ported |
| Keyboard navigation | Base UI DOM events | native command kernel + hidden menu accelerators | retain exact host proof |
| Filesystem path mode | enabled | disabled | depends on raw filesystem RPC |
| Import mode | enabled | disabled | depends on import RPC/capability |

## Evidence policy

- Web and Lynx-for-Web may certify layout, query ranking, and rendered
  interaction.
- Native host shortcut delivery, focus retention, menu accelerators, and
  textarea key handling require an exact-owned Lynxtron run.
- Tests prove algorithms and bindings, but do not replace retained product
  interaction frames and DOM/console evidence.
- Every retained state is added to the comparison gallery rather than living
  only in ad-hoc screenshots.

## Retained results

- Web real keyboard path: `Cmd+K` open, repeated `Cmd+K` toggle, Escape close,
  ArrowDown from the empty state to Usage, and Enter navigation to Usage.
- Browser paired states: empty suggestions, action search, project search,
  thread-title search, message-content search with snippet/hit metadata,
  theme search, and empty result.
- Exact-owned Native: real host `Cmd+K` accelerator opened the palette;
  DevTool DOM contained the search field and highlighted first item; console
  was clean.
- Native background delivery of unmodified Arrow/Tab remains a macOS inactive
  harness boundary. The focused command kernel and hidden accelerator mapping
  are covered by tests, but are not reported as an exact-device pass.
- Feedback and Spaces remain intentionally absent because no real Lynx
  delivery surface or active-space UI state exists yet.

## Evidence

- `shots/2026-08-03/command-k/browser/empty-1280/`
- `shots/2026-08-03/command-k/browser/message-1280/`
- `shots/2026-08-03/command-k/browser/theme-1280/`
- `shots/2026-08-03/command-k/browser/states/`
- `shots/2026-08-03/command-k/native/empty-1280/`
- `shots/2026-08-03/command-k/checklist.md`
