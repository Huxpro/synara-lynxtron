# Current empty Projects overview dark audit

Status: retained matched Web original and Lynx-for-Web diagnostic evidence.
This is not a replacement for the populated P8-Q2 Projects overview matrix.

## Identity

- Product commit: `891fb93450a62a74d7a2d433ec5284f3731cb7a8`.
- Isolated backend: `ws://127.0.0.1:53067/?token=synara-local-desktop-comparison`; orchestration sequence `252`.
- Snapshot: 9 projects and 3 live threads; the only ordinary project is `github`, and the current canonical Kanban projection has 0 tasks.
- Navigation: both clients started on their landing surface and activated the visible `Kanban` sidebar control. Web used the accessible button; Lynx-for-Web invoked the rendered shadow-hosted button with `accessibility-label="Kanban"`. No route injection or SQLite fixture write was used.
- State: dark `1280x820`, DPR 1, sidebar open, identical empty overview copy, `github` project row, and the same three-provider update overlay.

## Result

- Current whole-frame RGB MAE: `0.6836233909214092%`.
- Both PNGs are exactly `1280x820`; inner and visual viewports are `1280x820`, DPR 1.
- Both clients render `Kanban`, `0 tasks`, `Nothing on the board yet`, and the same explanatory copy.
- Both page-error buffers are empty. Web has no console warning; Lynx-for-Web has only the named upstream initialization warning.

## Ledger decision

The historical P8-Q2 Projects overview uses snapshot SHA-256
`7dfc4c8d755bb0656df7f4fba2ff4cebe3602189854605508ace4ae278147540`
and documents populated project and Chats columns. The current seed hash and
0-task overview are a different fixture. This evidence therefore confirms the
current empty-state composition but does not supersede
`2026-08-03--p8-q2--projects--dark-1280` or any Native sibling.

Browser entry, retry, capture, and exit gates all reached zero sessions and
zero agent-browser-owned processes. All owned server and Vite processes and
ports were stopped after capture.
