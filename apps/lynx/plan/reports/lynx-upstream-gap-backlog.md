# Lynx Upstream Gap Backlog — Slop Fork 迁移差距分析

日期：2026-08-17。目的：把 Synara → Lynx（Lynxtron Desktop）port 过程中撞到的所有平台缺口收拢成一份可直接转化为上游 issue 的清单，并标注 Priority（对我们的价值）与 Effort（上游实现难度估计）。

证据来源（全部为本仓一手记录）：

- `apps/lynx/plan/02-compat-matrix.md` — Lynx ↔ Web 差异活文档（A/B/C 三区，四态判定）
- `scripts/reports/lynx-css-report.md` — P1-F6 机器生成 CSS 可移植性报告（28 条）
- `apps/lynx/plan/LOG.md`、`03-decisions.md`、`04-lynx-patterns.md`（P-xx 登记项）
- `apps/lynx/plan/reports/p9-d1-host-input-bridge.md`（25 事件 probe 矩阵）
- `apps/lynx/plan/reports/native-template-context-blocker-resolution.md` 等 fidelity 审计报告

## 0. 怎么读这份清单

**Priority（对 Synara port 的价值）**

- **P0** — 造成 crash、或用户可见的功能残缺（搜索禁用、无键盘、无读屏），或迫使我们维护大规模生成式 workaround
- **P1** — 大面积适配成本 / 明显 fidelity 损失，但已有稳定 workaround
- **P2** — 有确定且成本可控的 workaround；修了能删代码
- **P3** — nice-to-have / 长期架构项

**Effort（上游实现难度，我们的估计，供排期参考不作承诺）**

- **S** — 天级：行为对齐、暴露既有能力、补 polyfill、改报错
- **M** — 周级：单模块新能力
- **L** — 季度级：跨模块 / 架构性
- **XL** — 重大架构（文本栈、AX 栈、渲染管线）

**Layer（issue 应投递到哪一层）**：`engine`（Lynx 渲染/CSS/元素内核）、`primjs`（JS 引擎/字节码）、`reactlynx`（框架/编译器）、`lynx-ui`（官方组件库）、`host`（Lynxtron 桌面壳）、`devtool`。

---

## 1. Top 优先级（建议首批提 issue）

按「用户可见伤害 × workaround 维护成本」排序：

| # | Gap | Layer | Priority | Effort | 一句话现象 |
|---|---|---|---|---|---|
| 1 | 文本输入内核崩溃：`Flutter text model must not be null` | host | P0 | M | 坐标聚焦 native `<input>` 后发送按键即整应用崩溃（NSInternalInconsistencyException）。后果：Settings/PR 搜索只能渲染 `Search unavailable in this runtime`（P-94） |
| 2 | `<textarea>` 吞掉 Arrow/Enter/Escape，JS 层永远收不到 | engine/host | P0 | M–L | `catchkeydown`、PC 别名、`global-bindkeydown` 全阴性（三分支实验后止损回滚）。Composer 命令/提及菜单无法做键盘导航（P-79/P-81） |
| 3 | view 级按键投递缺失 + Tab 不发布焦点 | host | P0 | L | P9-D1 探针 25 事件矩阵：binding 25/25、delivery Native 仅 13/25；真实 Tab ×4 后 AX tree 无变化、`.ui-focus`=0（P-110/D15）。桌面应用无键盘可达性 |
| 4 | 运行时 CSS 自定义属性不生效（动态主题） | engine | P0 | L | root inline `--var` 与 class-scoped 变量覆盖均不重新求值后代；仅静态 `:root` 可靠。被迫用代码生成器把暗色值直写进每个 selector（`src/generated/native-theme-variables.css`，P-45） |
| 5 | macOS AX tree 只暴露单个 0-child `AXGroup` | host | P0 | XL | 已验证的 Lynx accessibility 属性（name/role/disabled）完全不投影到 macOS AX；`lynx.accessibilityAnnounce` 无可观察语音通道。读屏完全不可用（P-123/P-124） |
| 6 | `:hover` / `:focus-visible` 等状态伪类缺失（仅 `:active`） | engine | P0 | M | Web 侧 312 处 `:hover`、155 处 focus class。被迫为每个 view-backed control 手写 `ui-hover`/`ui-pressed`/`ui-focus` 状态类 + mouse enter/leave 翻译（P7-I1，:hover 已在 CSS 报告标 ⬆️） |
| 7 | PrimJS 标准库缺口五连：`Object.hasOwn` / `Array.toSorted` / `String.replaceAll` / `TextEncoder`/`TextDecoder` / `URLSearchParams` | primjs | P1 | S–M | 每个都以「build/测试全绿、运行期才 `not a function`」的形态爆炸，其中 `replaceAll` 曾造成 native 启动 crash（bisect 到 `7165953d`）。典型低垂果实 |
| 8 | `setFocus`/`scrollToPosition` fulfilled ≠ 生效 | engine | P1 | M | `Element.invoke("setFocus")` resolve 成功但 OS 未授予焦点；tap 结束的 native blur 恒覆盖 sync/0ms/50ms 的 setFocus。API 契约应报告真实结果（P-110 item 4/9） |
| 9 | CSS 静默剥离：不支持属性 build 期丢弃仅 warning，`!important` 运行期直接消失且无任何报错 | engine/工具链 | P1 | S | P5-R5 实测含 `!important` 声明从 matched styles 静默消失；`color-scheme`/`user-select`/`text-transform` 等十余属性被静默剥离，只有恰好被人工检查的 build 才发现。改成响亮诊断即可，低垂果实（P-26） |
| 10 | `@media` / `matchMedia` 全缺（含 `prefers-reduced-motion`、`prefers-color-scheme`） | engine | P1 | M | Native bundle 静默丢弃现有 `@media` 规则；响应式被迫走 host `getContentBounds()` + resize 事件 + root viewport class 全套自建管道；系统深色模式无事件，`system` 主题只能回退 light |

---

## 2. 低垂果实（Low-hanging fruits）

高性价比：行为对齐/暴露既有能力/修报错，上游 S–M 即可完成，我们可以删 workaround。

| Gap | Layer | Priority | Effort | 说明 |
|---|---|---|---|---|
| PrimJS 补 `Object.hasOwn`、`toSorted`、`replaceAll`（ES2021–2023 追平） | primjs | P1 | S | 见 Top #7。规格明确、无设计空间 |
| `TextEncoder`/`TextDecoder`、`URLSearchParams` 内建 | primjs | P1 | S–M | 我们已写纯 JS polyfill（ASCII/CJK/astral 单测通过，`src/text-encoding-polyfill.ts`）可直接参考语义 |
| ReactLynx background runtime 缺全局 `setTimeout`/`setInterval` | reactlynx | P1 | S | P6-C2 实测 `globalThis.setTimeout` 在 background runtime 不存在，被迫用 host `timerSleep` delayed-reply 模拟轮询 |
| `fetch` 只挂 `lynx.fetch`，`globalThis.fetch` 不存在 | engine | P2 | S | 别名即可，消除一整类调用点改写 |
| EventSource 能连通但 message 事件永不派发 | engine/host | P2 | S–M | 「API 存在但不工作」型缺陷（Lynxtron 0.0.7 / P0-S2 实测），比完全缺失更危险 |
| URL polyfill `pathname =` setter 静默无效 | engine | P2 | S | 抓包发现请求实际打到 `/`。静默正确性 bug，至少应 throw |
| `transform-origin` 被忽略，旋转恒绕左上角 | engine | P1 | S–M | keyword（`center`）与百分比（`50% 50%`）均无效，chevron 旋转产生 14px 跳位；被迫用双 SVG 状态替代旋转 |
| ReactLynx compat 不导出 `React.version`（及 `React.use`；`export *` 不转发 default） | reactlynx | P1 | S | Base UI 的 `reactVersion.js` 模块加载期读取即编译失败；现靠 shim 伪造 `'18.3.1'` |
| `@lynx-js/lynx-ui` Popover 在 Lynxtron PC 上 Presence `delayFrames`/`lynx.requestAnimationFrame` 不推进，popup 停在 `visibility:hidden` 且 console 全空 | lynx-ui | P1 | S–M | 静默失败；我们退回自制 fixed layer + `getRectByRef(...,true)` 锚点 |
| `@lynx-js/websocket` 0.0.4 在 app close listener 运行前置 CLOSED；Lynxtron 遗留 CLOSE_WAIT fd | lynx-ui/host | P1 | S–M | 长时轮询下 fd 耗尽；现靠持有 native socket id 做幂等关闭 |
| `Decode error: Context construct failed` 被表层日志 `An error occurred when parse json…` 掩盖 | primjs/devtool | P1 | S | 真错误只能经 LogBox proxy 看到。误导性报错让我们烧了整轮排障（真因是字节码依赖图，0.0.9 部分改善） |
| 「编译成功但整面空白、无异常」缺一切诊断（大 ReactNode 跨 snapshot 边界静默失败同类） | reactlynx | P1 | S–M | P-28/P-32：6.5k 行 Sidebar 编译通过、渲染空白、console 干净。至少要 throw/警告 |
| embedded SVG `currentColor` 不穿透 `<svg content>` | engine | P2 | S–M | 主题 ink 需生成器注入具体色值 |
| Lynxtron CLI `--user-data-dir` 传入 argv 但不改 `app.getPath('userData')`；单实例锁不按 data dir 区分 | host | P2 | S | 状态隔离/并行实例只能靠自建 env 开关（P-27/D14） |
| `utilityProcess` 原生绑定存在但 JS shim 未 re-export；子进程无 `process.parentPort` | host | P1 | S | 现用 `createRequire` 直取原生。sidecar 架构的根基 |
| dev host 拒绝 >10 MiB HTTP 响应 | host | P2 | S | 曾直接挡住诚实的 composer draft-store 全图验证 |
| `color-mix()` 支持不一致 | engine | P2 | S | tokens 依赖它；现改具体值 + 「registered non-color-mix approximation」 |

---

## 3. 中等难度（值得提，需要设计讨论）

| Gap | Layer | Priority | Effort | 说明 |
|---|---|---|---|---|
| 伪元素全缺（`::before`/`::after`/`::placeholder`/`::selection`/`::-webkit-scrollbar`） | engine | P2 | M | 现用额外真实元素替代；scrollbar 样式完全不可定制 |
| `:has()`、`:not()`（未文档化）、`:first-child`/`:last-child`/`:disabled` 等结构伪类 | engine | P2 | M | Web 侧 `:has()` 9 处、base-ui `data-[state]` 属性选择器 167 处 class（属性选择器支持同样未文档化） |
| `backdrop-filter` 无 CSS 入口（`<blur-view>` 元素存在） | engine | P2 | M | 原生能力已有，缺 CSS 表达；popover 70% 半透明 + vibrancy 整支放弃，Native 锁定不透明材质分支 |
| `ResizeObserver` 缺失 | engine | P2 | M | 26 处/13 文件；现用 `bindlayoutchange`/IntersectionObserver 拼 |
| 页面生命周期事件缺失（`visibilitychange`/`pagehide`/`beforeunload`） | engine/host | P2 | M | 持久化 flush 钩子只能 no-op |
| 多行截断只有 `text-maxline` 属性、无 CSS `line-clamp`；`overflow-wrap`/`word-break` 缺 | engine | P2 | S–M | Web 侧 truncate×299 |
| 杂项 CSS 属性批量追平：`background-clip:text`、`object-fit`、`outline`、全局关键字（`inherit` 等）、`text-transform`、`user-select`、`cursor` 部分值、`filter` 其余函数、`clip-path polygon()`、`aspect-ratio auto`、`space-evenly` | engine | P2 | S/项 | 建议开一个 umbrella issue + checklist。机器报告 406 个不支持 Tailwind 类 / 929 加权出现次（`p5-r4-style-coverage.md`），头部：`tabular-nums`(61)、`outline-none`(45)、`select-none`(26)、`sr-only`(25)、`overflow-y-auto`(23) |
| `getSelectedText` 在 PC 上 SIGABRT（`out_of_range … "basic_string"`）；selection API 标注 Android/iOS only | engine | P1 | S–M（不崩）/ L（PC 全量支持） | 文本选区在 PC 完全不可用，且尝试即杀进程；现以「Reference whole message」降级 |
| `<webview>` 类型标注 @PC 但插入即 view 崩溃（无 CEF，二进制仅 WKWebView 胶水） | host | P1 | S（优雅失败）/ L（真实支持） | 元素创建期即白屏 + DevTool 断连。嵌入式浏览器/PDF 全支放弃 |
| micromark 正则进 main-thread 字节码报 `invalid escape sequence` | primjs | P1 | M | react-markdown 生态整体进不了 main thread；现走 background-only AST → 可序列化子集 → 自制 renderer |
| `cloneElement from compiled snapshot with children is not supported` | reactlynx | P2 | M–L | 限制 render-prop/slot 模式；共享 Button 的 `render=` seam 被迫删除 |
| React 18/19 API：`useTransition`/`useDeferredValue`/`useId` 缺失（React 17 语义） | reactlynx | P2 | M–L | 7+9 文件受影响；现 react-pacer + 计数器 util 替代 |
| 横向 `scroll-view` 包固定宽 flex 列会把整个 app shell 推出视口 | engine | P1 | M | 即使总列宽 < 父宽也复现（P-18，首张 Kanban 截图 sidebar 整个被裁掉）；布局初始化 bug |
| host 系统能力桥缺失：麦克风（voice 整支不可用）、屏幕捕获、系统通知、系统外观（深色模式）事件、`session`/权限、`globalShortcut`、`autoUpdater` | host | P2 | M–L/项 | 每缺一个桥 = 一个用户可见功能诚实降级为「Unavailable in this runtime」 |
| DevTool 批量：非前台窗口 take-screenshot 挂起/崩溃（P-09）、console 是消费型 buffer 且端口漂移、无 host 按键注入接口、`DOM.getDocument` 返回 `{}`、synthetic drag 不发布真实滚动（P-112）、134 kB CSS 让 30s DOM/截图 deadline 超时 | devtool | P2 | S–M/项 | 直接决定自动化测试/CI 故事能不能讲；键盘证据目前根本无法通过 DevTool 获得 |

---

## 4. 难啃的骨头（架构级，预期长周期）

| Gap | Layer | Priority | Effort | 说明 |
|---|---|---|---|---|
| macOS AX 投影（完整 accessibility tree + 语音通道） | host | P0 | XL | Top #5。合规级需求，但涉及整条 AX 栈 |
| `overflow: auto/scroll` 作为 CSS 能力（任意容器 CSS 驱动滚动） | engine | P1 | L | 现状 scroll-view/list 重构已完成，但每个新迁移面都要重付一次结构税；这是 Web CSS 心智模型的最大单点断裂 |
| 运行时 CSS 变量求值（Top #4 的完整解） | engine | P0 | L | 主题、density、scroll-fade 全在等它 |
| 同步布局测量（`getBoundingClientRect` 等价物） | engine | P3 | XL | 大概率是 by-design（跨线程架构）；34 处/18 文件已按「测量→渲染」模式重写，提 issue 主要为确认官方立场 |
| contenteditable / 富文本内联编辑（Lexical 类编辑器） | engine | P2 | XL | native textarea + 邻接 chip row 的一期方案已接受；光标内嵌 token 无等价物 |
| canvas / WebGL（xterm 终端、pdfjs、html-to-image） | engine | P2 | XL | 终端、PDF、分享卡三支功能整体降级为占位（D13 显式改为 placeholder 而非 descoped） |
| `@property` 注册型自定义属性 + `animation-timeline: scroll()` 滚动驱动动画 | engine | P3 | XL | scroll-fade 系统专属；有替代表达，优先级最低 |
| PrimJS 复杂代码执行正确性（Effect runtime `e[i] is not a function`；background `toLowerCase` rejection；`Context construct failed` 对扩张字节码依赖图的敏感） | primjs | P1 | L | 最难提的 issue —— 需要我们先做最小化复现。但这是「现代 JS 库能否直接进 Lynx」的根本问题，Effect/micromark 两个生态已实证翻车 |
| 引擎文字栅格差异（系统字体 fallback 不一致、glyph 宽度差、需要 per-heading letter-spacing 校正） | engine | P3 | L–XL | 351px vs 320.36px 级别差异；已用命名 `--engine-*` 校正变量收口 |

---

## 5. 可直接引用的崩溃/错误现场（提 issue 附件）

| 精确信息 / 症状 | 层 | 本仓证据 |
|---|---|---|
| `NSInternalInconsistencyException: Flutter text model must not be null` | host 输入内核 | `04-lynx-patterns.md`（P-94）；`plan/LOG.md`（P6-C6） |
| `out_of_range was thrown in -fno-exceptions mode with message "basic_string"` + SIGABRT（`getSelectedText`） | engine（PC） | `plan/reports/p10-completion-audit.md` |
| `Decode error: Context construct failed`（`QuickContext::DeSerialize`），表层被 `An error occurred when parse json…` 掩盖 | primjs 模板解码 | `plan/reports/native-template-context-blocker-resolution.md` |
| `<webview>` 元素创建即 view 崩溃（白屏 + DevTool 断连，主进程存活） | host | `plan/LOG.md`（P0-S5） |
| background `JSRuntime` `toLowerCase` rejection + renderer 反复重建（retained-tree 动效） | primjs background | `plan/LOG.md`（P10） |
| `cloneElement from compiled snapshot with children is not supported` ×5 | reactlynx | `plan/LOG.md` |
| PrimJS `SyntaxError: invalid escape sequence in regular expression`（micromark 正则） | primjs 编译 | `plan/LOG.md`（P2-V5） |
| `e[i] is not a function`（Effect runtime，TextEncoder 补齐后仍现） | primjs | `plan/LOG.md`（P2-V6） |
| `!important` 声明从 matched styles 静默消失、无 build 错误 | engine | `docs/p5-r5-fidelity-gate.md`（P-26） |
| 真实 Tab ×4 无 AX 变化、`.ui-focus`=0，而真实 click 可把 AX focus 移入 `container lynxtron` | host | `plan/LOG.md` + `plan/reports/p9-d1-host-input-bridge.md`（P-110/D15） |

## 6. 后续步骤建议

1. **首批 issue（本周可发）**：Top 表 #1/#2/#3（输入/键盘三连，同属一条 host input bridge 主线，可作一个 tracking issue + 三个子 issue，直接附 P9-D1 的 25 事件矩阵）、#4（动态 CSS 变量，附 P-45 双重复现）、#9（静默剥离 → 只要求「响亮诊断」，最容易被接受）。
2. **低垂果实打包**：PrimJS 标准库五连 + background timers + `globalThis.fetch` 别名，可合并为一个「ES/Web 平台基线追平」umbrella issue，逐项 checklist。
3. **CSS 杂项**：以 `scripts/reports/lynx-css-report.md` 机器报告为附件开 umbrella issue，避免 20 个碎 issue。
4. **需要先做最小复现再提**的：PrimJS 执行正确性三件（Effect / toLowerCase / Context construct failed）——没有 repro 上游无法行动，这是我们侧的前置工作。
5. 提交前逐条核对 Lynx 最新 release notes（本清单基于 Lynx SDK 4.1 / Lynxtron 0.0.7–0.0.9 实测；0.0.9 已修复部分模板解码问题，其他项可能已有进展）。
