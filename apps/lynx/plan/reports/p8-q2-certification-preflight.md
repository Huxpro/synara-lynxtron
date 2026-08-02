# P8-Q2 — 最终视觉认证矩阵预检

**状态：in progress — 已恢复可审计的 Web 位图 capture surface，待完成 48 个 Web/Lynx 配对认证单元**（2026-08-01）

## 已验证的认证前提

- 以隔离状态启动 Synara：`SYNARA_PORT_OFFSET=3158`、server `58090`、Web `8891`、状态目录 `.synara-pr84`；启动前 dry-run 确认端口未占用。
- Web 端已连接到该实例并加载真实空快照；Native 使用
  `SYNARA_WS_URL=ws://127.0.0.1:58090` 启动，Lynx DevTool 可识别
  `@synara/lynx` client 及其 LynxView session。client port 必须按当次运行动态发现；最近
  Synara 注册于 `localhost:8903`，而用户拥有的 Fiddle instances 占用 `localhost:8901`、
  `localhost:8902`。
- Native DOM 根发布 `SliceRoot--theme-light SliceRoot--density-comfortable`，证明当前应用实际运行了 canonical light/density projection。
- DevTool 已成功采集当前 Native 全屏帧：
  [`lynx-light-current.png`](../shots/2026-07-31/p8-q2/lynx-light-current.png)。
  该帧是连接性证据，**不是**认证矩阵证据。

## 尺寸控制恢复（当前）

原预检错误地把 macOS Accessibility 权限视为 Native window-size 认证的唯一可行路径。该权限依然未授予，`osascript` 仍不能控制窗口；但 production shell 的持久化 window state 是唯一运行时权威，且可由 `CoreGraphics` 在不需要辅助功能权限时独立读取。

本轮以隔离的 `@synara/lynx` app state 验证了可恢复替代路径：

1. 备份 `~/Library/Application Support/@synara/lynx/synara-lynx-slice/window-state.json`；
2. 写入 `{ version: 1, bounds: { x, y, width, height }, maximized: false, fullscreen: false }`；
3. 重启仅本轮的 production Lynxtron；
4. 用 `CGWindowListCopyWindowInfo` 读取 title 为 `Synara` 的 Lynxtron window；
5. 同时用 DevTool 截图确认其 content root 与 native titlebar 的既有 32px 差值。

当前实测 1440×900 native window 的 CoreGraphics bounds 为 `X=144, Y=125, Width=1440, Height=900`；DevTool content frame 为 2880×1736 physical pixels，即 DPR 2 下的 1440×868 logical content。该结果符合既有 P7-I3 记录，证明认证可继续进行。随后恢复的 1280×820 state 也由 CoreGraphics 验证为 `X=224, Y=165, Width=1280, Height=820`，其 DevTool content 为 2560×1576 physical pixels（1280×788 logical）。

同机有用户拥有的 Lynxtron Fiddle instances：`localhost:8901` 和 `localhost:8902` 不是 Synara。Synara 在本轮动态注册为 `localhost:8903`（client `App: @synara/lynx`）；所有 Native capture 必须显式指定该 client，不能依赖默认 client。此前误取的 `8901` connectivity frame 已剔除，不可作为 P8-Q2 证据。

此路径仅修改本轮 Lynxtron app 的 window-state，并在结束时逐字恢复原文件；不修改用户数据、server state 或 staging。Accessibility 仍是 host AX/键盘路径的既有平台限制，但不再阻塞 P8-Q2 的窗口尺寸认证。

## Web capture recovery（当前）

shared browser preview 的 screenshot exporter 与页面 viewport 不一致：其页面 JS 报告
`1280×820`、DPR 1，但导出 PNG 是 `1846×1952` 或 `1590×1952`。该 preview export 不用于
认证位图。

复核结果表明此机器**当前没有**可用的独立 Chromium/Puppeteer capture surface：

- 当前 shared preview 页面运行时实际报告 `innerWidth=1280`、`innerHeight=820`、DPR 1，
  但 preview exporter 导出的 PNG 仍为不对应 viewport 的位图；不能作为认证位图。
- 系统 Chrome 未开放 remote-debugging/CDP endpoint；Midscene Bridge 也未监听，不能作为
  受控证据来源。
- workspace 虽安装 `playwright@1.58.2`，其对应 Chromium executable 不在
  `~/Library/Caches/ms-playwright/chromium-1208/`，因此无法启动受控 browser。
- 既有 `settings/light-1280/web.png`（`1590×1952`）、
  `thread/light-1280/web.png`（`2560×1640`）及 `_scratch/web-1440.png`
  （`2560×1600`）均仅为诊断产物，缺乏与 capture path 一致的可审计
  viewport/DPR provenance，不能升级为认证证据。

因此 P8-Q2 在 Web 位图证据上仍然 blocked。可接受的解除方式仅有：

1. 恢复/提供 Playwright Chromium binary，以明确 `viewport: 1280×820` 或 `1440×900`、
   `deviceScaleFactor: 1` 和 capture 前运行时检查输出 PNG；或
2. 提供可连接、可控的 Chromium CDP endpoint，以同等配置 capture。

Native 的 `1280×820` window 同时由 CoreGraphics 验证，且 DevTool 截图稳定为
`2560×1576` physical pixels，能精确映射既有 32px titlebar 差值；但这不能替代 paired
Web evidence。

## 后续认证顺序

1. 对两个 Native 尺寸继续以 state-file + restart + CoreGraphics + DevTool 记录实际尺寸；
2. 对 Threads、Thread、Settings、Projects overview、Project Kanban、Pull Requests 的 light/dark 组合采集同一 WS 数据下的 Web/Lynx 对；
3. 为每组写 `notes.md`、记录 anchors/typography/tokens/allowed platform differences，并更新 compatibility matrix；
4. 只有所有 48 个 Web/Lynx 组合均有当前证据且未登记重大差异为零时，才将 P8-Q2 标为 completed。
