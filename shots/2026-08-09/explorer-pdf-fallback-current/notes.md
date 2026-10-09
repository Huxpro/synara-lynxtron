# Explorer PDF fallback current-head evidence

- Isolated server `ws://127.0.0.1:58910`, trusted Lynx-for-Web origin
  `http://127.0.0.1:9544`, server instance
  `20d1c3aa-bfcd-41f8-8b69-a79641b98ccb`.
- Canonical project/thread used `/tmp/synara-explorer-pdf` and selected the
  real one-page `report.pdf` fixture through the product route.
- Both light and dark captures are `1280x820`, DPR 1. The PDF fallback is
  `375x706`; title, badge, explanatory copy, and button geometry are identical
  between themes.
- The rendered surface contains no PDF `<image>` and no `<webview>`. It names
  the Native limitation and exposes `Open in default app` with accessible label
  `Open report.pdf in default app`.
- The local-preview route returns HTTP 200, `application/pdf`, 593 bytes,
  trusted-origin CORS, and `nosniff`.
- Relay diagnostics contain no `projects.readFile`, proving the binary PDF
  skips text decoding. Page errors are empty.
- The external-app button was not clicked during capture because that would
  raise the system PDF viewer over the user's desktop. Focused tests verify the
  safe workspace-relative path join and the authenticated
  `shell.openInEditor` / `system-default` action contract.
- Exact-owned Native production PID `22815` launched
  `apps/lynx/dist/desktop` with the correct `synara://` route and connected only
  to `58910`. Host logs showed the real thread snapshot and
  `projects.listDirectories`, with no `projects.readFile`.
- This Lynxtron instance did not publish a DevTool client. The visible clients
  belonged to a Lynxtron 0.0.7 default app and `another-project`, so neither was used as
  evidence. Native screenshot/DOM parity is therefore not claimed.
- The first invalid Native preflight used a stale default-endpoint bundle. It
  was stopped immediately and no frame was retained. Native was rebuilt with
  `SYNARA_WS_URL=58910` before the passing run.
- Cleanup used canonical delete commands and ended at snapshot sequence 6 with
  zero live projects and zero live threads. The named Browser session was
  closed and owned server/static/Native processes were stopped.
