# Environment loaded-data continuation

- Owned harness: server `58670`, Web `9433`, isolated home
  `.synara-environment-final`, server instance
  `7bbd508b-2284-4c49-82d0-311fdba09be6`, canonical project
  `project-env-final`, and thread `thread-env-final`.
- Web and Lynx-for-Web use the same snapshot, route, `1280x480` viewport,
  DPR 1, and light/dark themes. Every retained PNG is exactly `1280x480`;
  every retained page-error array is empty.
- Both clients resolve the Environment surface to
  `x=980, y=138, width=288, height=330` with a `328px` scroll viewport.
- Web top/middle/bottom positions are `0/82/164` over `492px` content.
  Lynx positions are `0/75/149` over `477px` content.
- Lynx-for-Web now renders real branch, local-server, repository, editor,
  project-instruction, and notepad content. It also includes Web's real
  `Editor view` row, wired to the existing Explorer dock.
- The 15px content-height delta is intentional reliability handling:
  direct measurement found `git.status` may trigger a remote fetch and time
  out, while `server.listProviderUsage` exceeded 8 seconds. The fast-loop
  bootstrap excludes both, displays a retryable Git error, omits the
  unavailable Usage row to match current Web composition, and batches the
  remaining four requests two at a time with a 3-second bound.
- Retained Lynx relay diagnostics show one connection, no duplicate live
  Environment requests, no pending requests in the final light/dark cells,
  and no transport/RPC error.
- Chromium wheel input over the Lynx-for-Web custom element did not update
  the nested scroll-view. Top/middle/bottom evidence therefore proves static
  visual geometry only; real wheel/gesture behavior remains a Native boundary.
