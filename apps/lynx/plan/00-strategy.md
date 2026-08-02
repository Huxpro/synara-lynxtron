# 00 — 总体策略：Synara Electron → Lynxtron 系统化移植

> 调研日期：2026-07-27。三个信息源：Lynxtron 官方文档/GitHub 调研、ReactLynx/Lynx 4.0 文档全量挖掘、synara 主仓代码审计（373 tsx / 616 ts）。

## 0.1 核心判断

1. **Lynxtron 壳（主进程）移植是"改形状"而非重写**。其 API 刻意对齐 Electron：`BaseWindow/LynxWindow/Menu/Tray/dialog/shell/clipboard/protocol.handle/utilityProcess.fork/contextBridge/lynxBridge`，主进程是真 Node.js，打包复用 electron-builder。缺口：`autoUpdater`（electron-updater 不可用）、`globalShortcut`、`session`/权限 API、`ipcMain`（由 `lynxBridge.handle` 替代）。项目 2026-06-04 创建，pre-1.0（v0.0.6），issue 受限，无生产用户——**适合跟踪+spike，不适合 all-in**。
2. **渲染层不能复用 DOM，但应优先移植现有组件树，而不是重画页面**。ReactLynx =
   Preact 内核、React 17 API（无并发特性，但支持 React Compiler）；无 DOM；无
   `:hover`/伪元素/媒体查询；无 `overflow:scroll`（必须 `<scroll-view>/<list>`）；无
   canvas/WebGL/contentEditable。差异应收口在同 API 的 L1/L2 平台适配器和少数硬岛；
   普通 feature view 的结构、props、状态、class/tokens 应直接复用。仅把 Web 截图当设计稿
   重新写一份 Lynx JSX，会快速得到可运行切片，但会系统性牺牲还原度和长期同步成本。
3. **synara 现有架构已为此做好准备**（审计结论）：

   | 已有 seam | 位置 | 意义 |
   |---|---|---|
   | 383 个 .ts 中 277 个零 DOM 引用 | apps/web/src | 数据/逻辑层可直接复用 |
   | WebSocket 唯一构造点 | wsTransport.ts:183 | 传输层替换只动一处 |
   | 桌面能力唯一全局 | window.desktopBridge + NativeApi 契约 | 平台端口抽象雏形 |
   | 存储 memory fallback | lib/storage.ts, hooks/useLocalStorage.ts | 无 localStorage 的应对模式已有 |
   | UI 原语集中 43 个 wrapper | components/ui/ | Base UI→Lynx 替换只重写这层 |
   | history 三分支（browser/hash/memory） | appNavigation.ts | Lynx 走 memory history，seam 已存在 |
   | 弹窗全走 api.dialogs.confirm（19 处，无直接 alert/confirm） | — | 平台对话框零成本切换 |

   难点高度集中：ChatView.tsx（11k 行）/Sidebar.tsx（6.7k）/MessagesTimeline.tsx（2.8k）手工滚动几何代码；xterm 终端、pdfjs、Lexical composer、CDP 浏览器面板四个无 Lynx 等价物的功能岛。
   React 19 专有特性用量小：useTransition×7、useId×9、startTransition×5（/compat 已覆盖）、无 flushSync、无直接 createPortal。

## 0.2 分层架构（单一仓库、双渲染目标、机器强制边界）

```
L4 App Shell        routes/ 共享路由表 + Electron main / Lynxtron main
L3 Feature Views    Component.web.tsx | Component.lynx.tsx（共享 .logic.ts/hooks/状态）
L2 Design System    tokens.css 共享 + components/ui/ 原语双实现 + 图标映射
L1 Platform Ports   storage / net.socket / clipboard / window / updater / dialogs / theme / motion / scroll
L0 Isomorphic Core  contracts / shared / *.logic.ts / stores / wsTransport（抽象后）
```

**依赖只能向下。平台代码只允许存在于：L1 impl、L2 `.lynx.tsx`、L3 `.lynx.tsx`、L4 shell。其余目录由 lint 机器强制禁 DOM。**

## 0.3 差异管理三步法（identifying → 演进/适配）

1. **差异清单 = 活文档 + 机器生成**：`02-compat-matrix.md` 三区（JS API / CSS / 依赖），四态 ✅直接可用 / 🔧需适配 / 🔀需重写 / ⬆️推上游。CSS 区由 PostCSS 扫描工具（以 Lynx CSS 属性索引为白名单扫 index.css + Tailwind class）CI 生成报告，diff 即差异演进。
2. **推动 Lynx 向 Web 兼容演进**（⬆️，按价值排序）：
   - WebSocket 进核心 JS API（lynx-family/lynx#951 相关；最高优先）
   - 持久化 KV storage（官方有 NativeLocalStorageModule 示例，可做成共享 NativeModule 贡献回去）
   - `:hover` 在桌面（Clay/Lynxtron）——鼠标事件已 W3C 对齐，缺 pseudo-class 是硬伤
   - `backdrop-filter`（已有 `<blur-view>`，缺 CSS 入口）
   - `prefers-reduced-motion` 媒体查询（synara CSS 里仅有的 4 个 @media 全是它）
   - `ResizeObserver`
   注意：Lynxtron issue 受限、开发主要内部进行——**关键路径不依赖上游节奏，WS 中继/KV 桥按自研可落地做计划**。
3. **定点适配收口进 L1 ports**：每 port = 接口 + 双 impl，web impl = 现状薄封装（零回归）。

   | Port | web impl | lynx impl |
   |---|---|---|
   | storage | localStorage（现有） | NativeModule KV（或 sessionStorage + 主进程持久化） |
   | net.socket | WebSocket | 待 P0-S2：原生 WS module / lynxBridge 中继 / SSE+fetch |
   | clipboard | navigator.clipboard + desktopBridge | Lynxtron 主进程 clipboard API 经 contextBridge |
   | window | desktopBridge.windowControls | LynxWindow 经 lynxBridge |
   | updater | electron-updater 链 | 缺失→短期"检测更新+跳转下载"降级 |
   | dialogs | NativeApi（现有） | Lynxtron dialog |
   | motion | disclosureMotion.ts（grid-rows 动画） | 同契约 Lynx 实现（220ms ease-out + motion-reduce 回退） |
   | scroll | DOM scrollTo/getBoundingClientRect | `<list>/<scroll-view>` async NodesRef.invoke |

## 0.4 文件组织约定

- 解析：Vite `resolve.extensions: ['.web.tsx','.web.ts','.tsx',...]`；Rspeedy 侧 `['.lynx.tsx','.lynx.ts',...]`。**import 永远写无后缀路径**。
- 共享判定四态：`SHARED`（逐字节一致直接 import）/ `PATCHED`（同源生成+补丁，CSS）/ `SPLIT`（同名双实现 .web/.lynx）/ `EXCLUSIVE`（单端独有）。
- 目录镜像：Lynx 侧新文件与 web 侧同相对路径、仅换后缀。
- Lynx 兼容驱动的仓库内改造（收敛 window.*、删 window.nativeApi 死间接层、移除 shadcn dep）本身是 web 版质量改进，不含 Lynx 概念，可独立合入。

## 0.5 CSS 管线（index.css 唯一真源 + 编译期补丁）

审计：CSS 以 flexbox+绝对定位+transition 为主（Lynx 友好）；长尾：mask-image 71、backdrop-filter 21、::-webkit-scrollbar 11、:has() 9、data-[state] class 167、grid-rows 动画技巧。

```
index.css (Tailwind v4, web 真源)
  ├─[1] @theme tokens（66 个）→ tokens.css（纯 CSS 变量，双端共享）
  ├─[2] PostCSS "lynx-strip" 插件 → 删除/降级不支持规则（::-webkit-scrollbar/:hover/:has()/伪元素/@media→静态化）
  ├─[3] lynx-overrides.css → 人工增量补丁
  └─[4] CI：strip 报告新增条目 = 必须决策（推上游/适配/接受差异）
```

Tailwind 分叉三选项（决策 D1，依赖 P0-S3 数据）：A. web v4 + lynx v3 preset 双 Tailwind；B. v4 编译产物 PostCSS strip；C. 令牌共享 + 自收敛 utility 子集。默认先 A 跑切片验证。

**视觉一致性的诚实边界**：令牌/排版/间距/结构必须高一致；backdrop-blur、滚动条样式、
文本选区、focus ring 可近似或重做，但必须逐项记入差异预算。目标不再只是“token 级一致”，
而是核心屏幕达到可量化的高保真阈值；平台确实不支持的像素差异才允许豁免。

## 0.6 硬骨头决策框架

| 功能岛 | 现状 | 建议路径 |
|---|---|---|
| 终端 | xterm.js canvas/WebGL | 🔀 三选一 spike：CEF webview 内嵌 / Node-API 自研 native 元素 / 一期裁剪（D2） |
| Composer | Lexical contenteditable | 🔀 一期 textarea + chips/mentions 用 Lynx 元素；composer-nodes AST 逻辑复用 |
| Transcript 滚动 | 手工 geometry/rAF/scroll-follow | 🔀 `<list>` + MTS 重写；list 语义不同（子组件 JS 提前全建、ref≠可见、滚动事件跨线程节流），独立设计课题 |
| PDF | pdfjs canvas | 🔀 webview 内嵌或裁剪 |
| 浏览器面板/CDP | Electron webview+CDP | ⬆️/🔀 CEF webview 唯一路径；或桌面版独占 |
| Markdown/数学 | react-markdown + katex | 🔧 components 映射到 view/text（pipeline 纯，可复用）；KaTeX→一期降级源码样式或预渲染图片 |
| 图标 | @tabler/react-icons SVG | 🔧 codemod → Lynx 静态 svg 元素（path 为主，覆盖率预计高） |
| DnD | dnd-kit×5 | 🔀 MTS 手写；一期可只做点击替代交互 |
| React 19 | useTransition×7、useId×9 | 🔧 →@tanstack/react-pacer（已有）/ 计数器 util |
| Base UI 43 wrapper | floating-ui/portal/focus-trap | 🔀 对照官方 lynx-ui headless 库逐个重写（L2 主体工作量） |

## 0.7 并行兜底路径

Phase 0 后可用 **CEF `<webview>` 内嵌完整现有 web app** 快速得到"跑在 Lynxtron 上的 Synara"：保留 Chromium 成本、不达成轻量化，但可提前验证 Lynxtron 壳全部命题（sidecar、updater 缺口、菜单、协议、打包），给 UI 重写争取时间。决策 D3。

## 0.8 风险单

1. Lynxtron 成熟度（7 周、pre-1.0、无 updater、无生产用户）——渲染层产出未来也可跑 Clay 集成或 Lynx for Web，不锁死。
2. WebSocket 缺失——P0-S2 生死线。
3. ReactLynx 双线程语义——所有"测量→setState→再渲染"模式需重想；useLayoutEffect 降级异步；产出 04-lynx-patterns.md 持续积累。
4. Tailwind preset 官方自述 "still not stable"。

## 0.9 2026-07-27 路线校正：从 clean-room slice 转为 compiler-driven port

P0–P4 已证明运行时、WS、ports、主壳和打包链成立，但 slice 的 feature renderer 主要是
“同数据重新实现”，只复用了逻辑/projection 和接口形状，未复用 Web 组件树，因此功能
完成度与 UI 还原度脱钩。后续 Phase 5–8 改为：

1. 从 Web 屏幕入口出发，统计依赖图并标注 SHARED/PATCHED/SPLIT/EXCLUSIVE。
2. 直接让原组件树进入 Lynx compiler；遇到不兼容点才新增无后缀同 API adapter 或
   `.lynx.tsx` 硬岛。
3. 复制 Web JSX 到独立 Lynx 页面不计作复用；普通页面 clean-room rewrite 默认禁止。
4. class/tokens 保持同源，Lynx utility/override 管线集中补差异，不在页面散写近似视觉。
5. 每屏以同一 Synara 数据做 side-by-side，复用率与视觉差异共同作为退出标准。

详细契约和 phased plan 见 `06-high-fidelity-port.md`；这是 D9 的已决执行路径。
