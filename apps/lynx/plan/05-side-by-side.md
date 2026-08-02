# 05 — Side-by-Side 对比验证（Web ↔ Lynx）

目标：Lynx 版与 Web 版并排对比，验证 token 级一致与动效契约一致（非逐像素，见 00 策略 §0.5）。
**核心技巧：Lynx app 与 Web app 连同一个 synara server（同一 WS 数据源），保证两侧数据逐字节一致，差异只来自渲染层。**

## 5.1 环境启动

### Web 侧（原始项目）
隔离实例，避免与日常实例抢端口/状态（遵守主仓 AGENTS.md）：

```bash
cd ~/github/synara
# 先 dry-run 确认无冲突
env -u SYNARA_AUTH_TOKEN SYNARA_PORT_OFFSET=3158 bun run dev -- --home-dir ./.synara-sxs --port 58090 --dry-run
# 正式启动（web 端口 = 58090 + offset 规则以 dry-run 输出为准）
env -u SYNARA_AUTH_TOKEN SYNARA_PORT_OFFSET=3158 SYNARA_NO_BROWSER=1 bun run dev -- --home-dir ./.synara-sxs --port 58090
```

截图：用 `browser` 工具 navigate 到 web 端口 → `screenshot`。
检查端口占用：`lsof -nP -iTCP:<port> -sTCP:LISTEN`（server 与 web 两个端口都要查）。

### Lynx 侧
- Lynx 应用（spike 或垂直切片）以 dev 模式启动（Rspeedy dev server / Lynxtron `npm run dev`）。
- **前置**：安装 LynxDevTool 桌面 app（https://lynxjs.org/next/guide/devtool.html）；`reactlynx tree` 要求 dev build 且含 `@lynx-js/preact-devtools`（含 PR #2/#5 修复）。
- DevTool CLI（lynx-devtool skill）：
  `node /Users/bytedance/.agents/skills/lynx-devtool/scripts/index.mjs <cmd>`

```bash
CLI="node /Users/bytedance/.agents/skills/lynx-devtool/scripts/index.mjs"
$CLI list-clients                          # 找到 Lynxtron app 的 clientId
$CLI list-sessions -c <clientId>           # 找到 LynxView session
$CLI take-screenshot -c <clientId> -o <out.png>   # 截图（默认 lynxview 模式；--fullscreen 整窗）
$CLI reactlynx tree -c <clientId>          # 组件树（结构对比）
$CLI get-console -c <clientId> --level error,warning   # 渲染错误
```

## 5.2 对比协议（每个屏幕走一遍）

1. **同数据**：两侧连同一 server 的同一 thread/页面；Web 侧用 browser 工具、Lynx 侧用 devtool `open`/`App.openPage` 导航到对应视图。
2. **同状态**：同一 theme（dark/light）、同一窗口宽度（记录两侧 viewport px）。
3. **截图对**：`shots/<date>/<screen>/web.png` + `lynx.png` + `notes.md`。
4. **notes.md 检查单**（逐项 ✅/🔧/🔀/⬆️ + 一句说明）：
   - 色彩令牌（background/foreground/border/primary…对照 tokens.css）
   - 圆角/间距尺度（radius scale、padding 节奏）
   - 排版（font family/size/weight/line-height，mono vs sans 使用面）
   - 组件解剖（按钮/输入/菜单/对话框结构一致）
   - 图标（形状与尺寸，svg 子集映射质量）
   - 动效契约（toggle 220ms ease-out、motion-reduce 回退）
   - **接受差异**（ backdrop-blur、滚动条样式、文本选区、focus ring —— 00 §0.5 天花板项，记录但不算失败）
5. 新发现的 Lynx 不支持项 → 回填 `02-compat-matrix.md`；模式 → `04-lynx-patterns.md`。

## 5.3 基线任务

- 首个基线在 **P2-V7** 建立：Web 侧 5 个核心屏幕（聊天线程、composer focus、设置、Sidebar 展开、对话框）截图存档为"目标态"。
- 之后每个 Phase 3 特性完成时跑一轮 5.2 协议。
- 可用像素 diff 工具（如 pixelmatch）做辅助，但判定以检查单为准（允许差异清单内项不计 fail）。

## 更新日志

- 2026-07-27：初始版本（lynx-devtool skill 能力核实：take-screenshot / reactlynx tree / get-console 可用）
