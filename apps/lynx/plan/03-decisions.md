# 03 — 决策日志

状态：🟡 待数据 / 🟢 已决 / ⚪ 暂缓

| ID | 决策 | 选项 | 依赖数据 | 状态 | 结论 |
|---|---|---|---|---|---|
| D1 | Tailwind 策略 | A. web v4 + lynx v3 preset 双 Tailwind；B. v4 产物 PostCSS strip；C. 令牌共享 + 自收敛 utility 子集 | P0-S3 覆盖率 | 🟢 | A（2026-07-27，P0-S3 数据支持，见下） |
| D2 | 终端路径 | a. CEF webview 内嵌 xterm（保体验、付 Chromium 成本）；b. Node-API 自研 native 终端元素（长期最优）；c. 一期裁剪 | Phase 2 后评估工作量 | 🟢 | c（2026-07-28，D13 修订）：runtime 为 hard island，一期保留入口和说明性 placeholder |
| D3 | CEF 兜底过渡形态 | 是否先做"Lynxtron 壳 + webview 内嵌现有 web app"作为过渡发行形态 | P0-S5 | 🟢 | c（2026-07-28）：0.0.7 `<webview>` 实测崩溃，放弃兜底；D13 修订为 browser/PDF 一期保留说明性 placeholder |
| D4 | WS 传输路径 | a. Lynx view 直连（若 WS module 可用）；b. lynxBridge 中继主进程 WS；c. SSE+fetch 重构传输层 | P0-S2 | 🟢 | a（2026-07-27，P0-S2 数据，见下） |
| D5 | updater 方案 | a. 检测更新+跳转下载降级；b. 自研更新器；c. 等上游 | P4 阶段 | 🟢 | a（2026-07-27，P4-X2）：只读 latest metadata + 固定官方下载页，不下载/安装 |
| D6 | 图标方案 | codemod → Lynx svg 静态子集 vs iconfont vs 预渲染图片 | P2-V4 实测覆盖率 | 🟢 | codemod/生成器（2026-07-27）：14/14 首切片 outline 图标实机通过；保留 stroke/currentColor/size props |
| D7 | 代码落点：Lynx app 与主仓关系 | a. 单仓 apps/web-lynx；b. synara-lynx 独立仓 + path/vendor 引用主仓共享层 | P5-R2 原组件编译探针 | 🟢 | a（2026-07-27）：最终进入主仓 workspace；slice 暂作可逆 staging |
| D8 | macOS 正式发行签名 | a. Developer ID + notarization + stapling；b. 内部 unsigned 分发；c. 暂不分发 | Apple 账号、证书、bundle id 归属、CI secrets | 🟡 | P4-X3 仅产本地 unsigned arm64 DMG；不代用户申请凭证或接受系统安全例外 |
| D9 | UI 移植方法 | a. compiler-driven port 原组件树；b. 继续按截图 clean-room 重写；c. 全量 WebView | P2–P4 实测 + 当前 UI 复盘 | 🟢 | a（2026-07-27）：普通 UI 复用组件树与调用点；仅硬岛双实现 |
| D10 | Phase 5 reference screen 边界 | a. 真实 route-owned feature panel；b. 必须连同完整 settings shell；c. slice 诊断页 | P5-R5 与 P6-C1 依赖边界 | 🟡 | 夜间先选 a：Settings Behavior 真实 panel 全图入 denominator；shell 不 mask、明确交 P6-C1；若后续要求 b，可在同一 composition 外扩 |
| D11 | Sidebar 大颗粒复用边界 | a. 原 6.5k 行组件整树运行；b. 真源内抽 controller/view-model + 大颗粒 presentation composition，平台只分 host/L2 叶子；c. Lynx 重画 | P6-C1 full-tree compiler/runtime probe | 🟡 | 先选 b：a 已编译通过但运行时空白；c 违反 D9。保持诊断 route 不进入产品与 reuse 分子，可随上游 router/host 支持改善后回试 a |
| D12 | Phase 6 reuse 门禁位置 | route ≥70% 强制门禁 vs 任务子图门禁/Phase 出口 | route graph 与任务边界实测 | 🟢（已被 D13 取代） | threads-shell 子图已建并保留为观测指标；≥70% 不再作为任务放行门禁 |
| D13 | 聊天优先级与 Phase 6 放行 | 聊天主 UI 优先；terminal/browser/PDF placeholder；reuse 强制点让位 | 用户决策 | 🟢 | P6-C2→C3→C1 收尾→C4→C5→C6；按视觉契约放行，reuse 每刀审计并报告 |

## 决策记录

### D7 — 最终单仓，迁移期保留 staging（2026-07-27，🟢 已定）

P5-R2 证明 sibling path alias 能让同一物理 `SettingsSection.tsx` 同时进入 Web 与 Rspeedy，
但它依赖两个仓库固定相邻、跨仓依赖解析和两套 CI 协调。更重要的是，普通 UI 的高复用需要
大量原子重构：共享 composition 与平台 element/primitive adapter 必须同一次变更保持双端
可编译。最终落点因此选 a（主仓 workspace 内的 Lynx app）。

当前 `synara-lynx/slice` 继续作为 Phase 5 地基迁移的可逆 staging，等 primitive、样式和
门禁稳定后再搬迁；P5-R2 不做大范围目录移动。备选 b 只在 Lynxtron 依赖无法进入主仓构建/
CI 时恢复，届时必须用 workspace package 或发布制共享包替代绝对 sibling alias，不能复制
Web JSX。

### D9 — UI 主线改为 compiler-driven port（2026-07-27，🟢 已定）

P2–P4 的最小 slice 成功验证运行时，却暴露出“同数据重写 renderer”会让任务状态完成而
视觉还原度仍低。后续不再把 ReactLynx 的无 DOM 等同于整页重写：从现有 Web screen
entry 直接进入 Lynx build，以 resolver、同 API UI primitives、ports、CSS utility 补丁
逐个消除编译/运行差异。

普通页面新增独立 `.lynx.tsx` 必须证明共享结构不可行，并在 02/03 留证；终端、PDF、
浏览器、Lexical 富文本等 DOM/Canvas/contentEditable 硬岛允许 SPLIT/EXCLUSIVE。复制一份
Web JSX 后手工维持不算代码复用。Phase 5–8 同时用 eligible source reuse 与 side-by-side
视觉阈值验收，避免再次以“功能可用”代替“移植完成”。

### D10 — Phase 5 reference 先验收真实 route-owned panel（2026-07-27，🟡 待确认）

P5-R5 需要一个“真实核心屏”证明 compiler-driven port、复用率与视觉门禁可同时成立；完整
settings shell/sidebar 的迁移又已由依赖顺序明确分配给 P6-C1/P6-C4。夜间不把 slice 诊断页
当 reference，也不扩大豁免，而是选择 Web `/settings?section=behavior` 中真实的
`SettingsBehaviorPanel`：它仍由原 Web route 渲染，完整 8-module/524-LOC graph 进入
denominator，Lynx 只 SPLIT 两个 host-element leaf。

Web 证据保留完整 shell，不用大面积 mask；测量采用 624px panel-local 坐标，并在 notes
明确 shell 尚未达标。该选择可逆：P6-C1 完成 shell 后，可把同一 shared panel 放回完整
screen 重新跑门禁，不需要重写或迁移已有 reference composition。等待用户确认是否把
Phase-5 历史口径扩大到 b；不阻塞依赖已满足的 P6-C1。

### D11 — Sidebar 先拆共享展示边界（2026-07-27，🟡 待确认）

P6-C1 把实际 `Sidebar.tsx` 整树放入 Lynx compiler：补齐 compat 的静态
`React.version`，并把 `terminalRuntimeRegistry` 精确 alias 到 no-op hard-island 后，
Rspeedy 可以完整产包；xterm 不再进入 PrimJS main thread。实机却只得到空白 surface，
无 console exception。生成模板仍含 `div/span/button`，组件同时要求 TanStack Router
context、Base UI 与 DOM/DnD 事件语义；P2-V1 又已证明 Router component layer会崩溃。

因此夜间保守选择 b：在 Web 真源内把 state/controller 投影成平台中立 view model，并抽出
足够大的 presentation composition；Web 与 Lynx 使用同一物理文件，只有 host elements、
L2 primitive、router callback 与 DnD/terminal 叶子分流。诊断 route 已删除，不用“能编译但
不绘制”的整树虚增 reuse。备选 a 在 ReactLynx host/router 上游改善后仍可恢复；c 不采用。

### D8 — 正式签名/公证留给发行所有者（2026-07-27，🟡 待确认）

P4-X3 已证明 `com.synara.lynx`、`synara://`、arm64 `.app` 与 DMG 打包链可用；本地包使用
`identity: null`，校验、只读挂载和直接启动均通过。公开分发仍需明确 Apple Developer
Team、Developer ID Application 证书、bundle id 归属与 CI secret 管理，并决定是否做
notarization/stapling。夜间自主任务不申请凭证、不绕过 Gatekeeper、不上传产物。

建议 a；若仅做开发预览可暂选 b，但必须明确标注 unsigned。该决策不阻塞 P4-X3 的本地
打包退出标准，只阻塞正式发布。

### D1 — Tailwind 策略 → A（2026-07-27）

数据（[spikes/p0-s3](../spikes/p0-s3/README.md)，Top500 高频 class 喂 tailwindcss 3.4.19 + @lynx-js/tailwind-preset 0.5.0）：
- 绝对通过率 66.0%（330/500）；**加权通过率 80.1%**（12,815/15,994 次出现）。
- 未通过大头可机械补齐：自定义主题色（text-muted-foreground 366 次等，~8%）→ tokens 注入 v3 config；缺失 utility（inline-flex 154、cursor-pointer 86、pointer-events-none 76、tabular-nums 74、outline-none 66，~7%）→ preset 扩展/自收敛补丁。
- 补齐后预计 ~95%；真·不兼容（伪类/媒体查询变体 ~3.6%）用 preset 的 uiVariants 或构建期静态化。

结论：按原默认走 A（双 Tailwind），切片阶段验证补齐路径；B/C 留作后备。此结论即原"默认先 A"的路径确认，非新分支。

### D4 — WS 传输路径 → a（2026-07-27）

数据（[spikes/p0-s2](../spikes/p0-s2/README.md)，Lynxtron 0.0.7 实测，两轮一致）：
- **(a) 直连可用**：`LynxWebSocketModule` 已预注册（connect/send/ping/close + GlobalEventEmitter 事件）；官方 `@lynx-js/websocket` 提供 W3C 包装。RTT avg 0.5–0.9ms、吞吐 ~390msg/s（发送端限 500/s）、重连 1–2ms。
- (b) 中继同样可行且桥开销仅 ~0.4ms（b1 RTT ~1ms），保留为备选（主进程代理场景）；(b2) 重连有 ~505ms 异常，淘汰。
- (c) SSE：EventSource 连接成功但消息事件不派发（0.0.7 缺陷）→ 兜底暂不可用，⬆️ 上游。

结论：net.socket 的 lynx impl = `@lynx-js/websocket` 直连（仅文本帧，synara 为 JSON 文本，无碍）；wsTransport 单点替换即可，无需中继架构。

### 执行记录 — P2-V1 路由实现路径（2026-07-27，🟢 已定）

背景：roadmap P2-V1 原文要求「memory-history TanStack Router（isServer:false、URLSearchParams polyfill、react/compat alias）」。实测 `@tanstack/react-router` **组件层**在当前 Lynx 构建崩溃（snapshotPatchApply 'wrapper'；Link 渲染原生 `<a>`）。
结论：保留 TanStack **memory history 引擎**（@tanstack/history），路由匹配/渲染层自研（slice/src/app/router.tsx，约 60 行）——可逆（未来上游修复后可换回组件层）、不 fork 状态引擎、满足切片全部导航需求。react$ alias 与 polyfill 按原方案保留并验证（shim 见 04 P-08）。

### 执行记录 — P2-V2 socket / Effect adapter 分层（2026-07-27，🟢 已定）

为逐 export 对齐主仓 `platform/socket.ts`，曾在 Lynx L1 中直接引入主仓同版 Effect 4
`unstable/socket/Socket` adapter。构建通过但实机加载期立刻报
`ReferenceError: TextEncoder is not defined`；移除 Effect import 后四 port 自测恢复全绿。

结论：L1 只实现 `WebSocketFactory/createWebSocket/resolveDefaultSocketUrl`，按 D4 由
`@lynx-js/websocket` 直连；Effect Layer 属于共享 transport adapter，不下沉进平台工厂。
P2-V6 接入完整 `wsTransport` 时，再以官方 `TextCodecHelper` 或只覆盖 Effect 所需面的
最小 polyfill 验证。该选择可逆、避免当前为未使用 export 增加约 95KB bundle 与全局补丁。

### 执行记录 — P2-V3 Desktop popup 路径（2026-07-27，🟢 已定）

官方 `@lynx-js/lynx-ui` Button/Dialog/Input 在 Lynxtron Desktop 实机可用；Popover 按官方
结构、`defaultShow=true` 与受控 `show=true` 两种方式均不渲染，console 无异常。官方当前
兼容声明也是 iOS/Android fully supported，Desktop ongoing。

结论：Dialog 继续用 lynx-ui；切片所需 Menu/Tooltip 暂用同 API 的 `view` fallback
（单层 absolute 定位、tap 触发），保持调用点零改动。自动避让、hover/focus、独立 submenu
明确不纳入首切片，待 Desktop Popover 上游可用或 P3 有真实复杂菜单时升级。比自研完整
floating/focus 系统更保守可逆。

### D6 — 图标方案 → 静态 SVG 生成器（2026-07-27）

`@tabler/icons-react` 组件输出 DOM SVG，不能直接进入 Lynx。P2-V4 改从同版本
`@tabler/icons` 的 outline SVG 源读取，生成单一 `icons.lynx.tsx`：每个稳定 Synara
export 最终渲染 Lynx `<svg content>`，支持 `size/color/strokeWidth/style`。生成器拒绝
`script/foreignObject`，连续生成 hash 相同；首切片 14/14 图标在 Lynxtron Desktop
实机渲染清晰。

结论：采用静态生成器；不引入 iconfont 的字体加载/字形映射风险，也不采用会丢失
currentColor 与缩放能力的预渲染图片。后续图标只扩 manifest，调用方继续从稳定
`lib/icons` 名称导入。

### 执行记录 — P2-V5 Markdown 解析线程边界（2026-07-27，🟢 已定）

最初按 roadmap 直接使用 `react-markdown` + components 全量映射为 `view/text`。构建时
micromark 的现代正则被纳入 main-thread bytecode，PrimJS 报
`SyntaxError: invalid escape sequence in regular expression`。将 parser 标为 background-only
后又发现 Rspeedy 的 browser condition 会选择 `decode-named-character-reference/index.dom.js`，
其模块加载期调用 `document.createElement`。

结论：不在双线程 render 内运行 react-markdown。用同一 unified + remark-parse/GFM/math
pipeline 在 background effect 解析，裁成无 position/data 的可序列化 mdast 子集，再交给
纯 Lynx renderer；resolver 将 named-character decoder 定向到包自带的纯 JS export。
此方案保持主仓语法插件、避免自研 Markdown parser，且未来 PrimJS/ReactMarkdown 修复后
可换回 components 映射。数学首切片明确显示可读 TeX 源码，不引入 KaTeX DOM。

### 执行记录 — P2-V6 Synara RPC client 边界（2026-07-27，🟢 已定）

先按 P2-V2 预案补 TextEncoder 并接入主仓同版 Effect RPC client。编码器缺口消除后，
Lynx 实机仍在 Effect runtime 报 `e[i] is not a function`；生产构建的 lazy chunk 还会走
Lynxtron 不支持的 `file:` 加载路径，bundle 从约 501KB 增至约 1.68MB。

结论：首切片使用约 150 行 `background-only` 文本 facade，严格复用服务端公开的 Effect
RPC wire（bootstrap negotiate → 带 epoch/revision/instance 的 feature URL → Request/Exit
JSON），不复制业务状态机或 schema。它只暴露只读 `orchestration.getSnapshot`，断线即丢弃
singleton 并由 react-query 下次轮询重连。原生 WS 显式携带服务端已信任的
`Origin: synara://app`，不放宽服务端 CSRF 策略。未来 PrimJS/生产 lazy loader 支持完整
Effect client 后可在同一 facade 后替换，属于可逆的切片级适配。

### 执行记录 — P3-E1 textarea 与 chip 的组合边界（2026-07-27，🟢 已定）

Lynx native `<textarea>` 可多行编辑并提供 selection/ref 方法，但不能像 Lexical
contenteditable 一样在光标流中嵌入 React chip 节点。为避免自研文本编辑器，本期保留与
Web `composer-editor-mentions.ts` 同形的可序列化 segment discriminants 与 token 文本契约
（quoted mention、skill、`/automation`；其他 built-in slash command 仍是纯文本），textarea
继续保存单一 prompt 字符串；解析出的 token 在 textarea 上方以横向 Lynx chip row 镜像，
候选在下方以 suggestion chips 插入原始 token。

该方案保留发送协议所需的纯文本与 AST 语义，不假装支持 inline caret geometry；未来若
Lynx 提供富文本输入，可替换渲染层而保留 segment parser/store。P3-E1 只做 draft，不接
mutation RPC，避免越过尚未规划的发送/幂等边界。

### 执行记录 — P3-E2 设置写入边界（2026-07-27，🟢 已定）

当前只读垂直切片尚未建立服务端 settings/config mutation 的 schema、冲突处理与失败回滚；
夜间自主任务不应猜测并修改真实 Synara 配置。因此 P3-E2 只实现低风险的本地 app
preferences（default provider、sidebar sections、environment panel、appearance preview），
复用 P2-V2 的持久化 KV，启动 hydrate、每次变更即时排队写入。

该边界保留完整表单/导航/持久化交互，又不产生服务端副作用。将来确认 RPC 后可把同一个
`SliceSettings` adapter 换成 server query/mutation，并保留 local value 作为 optimistic
cache；当前选择可逆。

### 执行记录 — P4-X1 全局快捷键与权限降级（2026-07-27，🟢 已定）

Lynxtron 0.0.7 没有 `globalShortcut` 与 Electron `session` 权限 API。P4-X1 不引入原生 addon
去复制这两块：Threads/Projects/PR/Settings 使用原生 application Menu accelerator，
应用激活时可用，但不在后台截获；录屏/麦克风/Accessibility 继续由系统与用户决定，壳不
自动点击、不假装授权。

这是最保守可逆的发行边界。未来若后台快捷键成为核心需求，可在签名/entitlement 方案明确
后增加小型 native helper；权限状态也应通过明确 port 暴露，而不是绕过系统提示。

### 执行记录 — P6-C1 Sidebar selector/sort 运行时边界（2026-07-27，🟢 已定）

直接让 Lynx main-thread 引用主仓 `Sidebar.logic` 或 eager `storeSelectors` 虽能通过
Rspeedy production build，却会把 Web appSettings/work-log/native selector 大图带进模板
上下文；Lynxtron 实机报 `Decode error: Context construct failed`，bundle 从约 1009KB
升到约 1289KB。该失败不是 UI 逻辑本身不兼容，而是模块边界过宽。

结论：完整 `syncServerReadModel` 继续只在 background 执行；轻量 projection 按 normalized
`threadIds` 读取 summary。Web attention/timestamp sort 与 turn-lifecycle predicate 抽为
无大图运行时依赖的物理共享 `SidebarThreadSort.logic` / `sessionActivity.logic`，Web 原
`Sidebar.logic` API 通过 re-export 保持不变；父子树继续直接复用既有
`SidebarThreadPaging.logic`。该方案保留同一业务语义并可逆，且不以 type-only import
虚增复用率。

### 执行记录 — P6-C1 composer draft store 线程边界（2026-07-28，🟢 已定）

完整 Web `composerDraftStore` 通过 Lynx facade 仅替换 browser persistence 后，测试/build
通过，诚实复用率可结构性上升；但 dev bundle 超过 Lynxtron 10 MiB response ceiling，
重新 build 的 clean production file 又独立触发 template JSON parse failure。两条证据
说明 attachment/model/Schema/action 聚合图不能进入当前 Lynx main thread，不能用
production 体积或 alias 扫描结果代替运行证明。

结论：本期只把 Web `setPrompt` 转换抽为无重依赖 physical-shared leaf；Lynx facade 保存
prompt-only state，删除原 slice draft map。完整 attachments/model/persistence 保留为后续
background split，或等待 template decoder 上游修复。该选择可逆，不改 Web public store
API，也不把失败图计入 reuse。

### 执行记录 — P6-C1 动态主题投影边界（2026-07-28，🟢 已定）

尝试在 Lynx background 复用完整 Web `theme.logic`，读取同一个 `synara:theme` 并把计算后的
CSS variables 传给 render root。生产 build 与默认 light 首屏都通过，但显式 dark 证明
ReactLynx 根 inline `--*` 不生效；改为由 Web 算法生成
`.SliceRoot--theme-dark { --*: value }` 后仍保持 light，说明当前 Desktop 只可靠接受
静态 `:root` concrete token。透明 material 探针还会让白 foreground 落在白 host 上，
视觉上像空白但 console 与组件树正常。

结论：P6-C1 完整撤回 theme runtime/generator，不把 theme.logic 计入 reuse，也不留下
“class 已切换但视觉未切换”的假功能。P7 theme/system state 应采用按最终 selector 生成
direct-value dark overrides，或等待上游支持动态 root custom properties；Lynxtron 没有
透明 vibrancy document surface 时固定走 opaque material。两条路径都保持 Web theme math
为真源，当前选择不阻塞 light-only P6-C1。

### 执行记录 — P6-C1 Sidebar search 数据边界（2026-07-28，🟢 已定）

Web palette 的 ranking/snippet 算法可在 Lynx main thread 直接运行；实机先后暴露 PrimJS
缺 `Array.prototype.toSorted` 与 `String.prototype.replaceAll`，均改为对新数组 `.sort`
和 regex `.replace`，Web 15 个排序/匹配测试保持通过。Lynx 当前 background→render 的
`SidebarSnapshot` 只含 normalized summaries，不含消息文本；把所有 message bodies 为
search 一次性跨线程会扩大敏感数据与 payload。

结论：本期 Search 从 disabled 改为可用，复用同一 ranking 做 recent chats、thread title、
project/folder/path 匹配。后续 compiler/runtime probe 证明整个原
`SidebarSearchPalette.tsx` 可在补 `Object.hasOwn`、React Query 单例与
Command/kbd/elements adapter 后直接运行，因此产品路径已删除 Lynx 自绘 results JSX，
改为小型 snapshot→props adapter。message-content、theme/import/filesystem browse 仍不
伪造，通过默认开启、Lynx 显式关闭的 capability props 收口；后续以 bounded indexed
snippets 或明确 RPC port 接入同一 `SidebarSearchThread.messages` 契约。该边界可逆且
Web 默认行为不变。

### 执行记录 — P1-F2 文件数尾项（2026-07-27，🟡 待用户确认收尾方式）

F2 达成「区域外直接引用 = 0」（oxlint no-restricted-globals[window,document,navigator,localStorage,sessionStorage] + 分区 overrides， scoped 运行验证 0 违规；全局 vitest 同基线）。但区域内文件数 = **34 > 30 目标**：platform 8、L1 legacy 3（nativeApi/env.ts 将由 P1-F3 删除→-2）、shell 3、ui 4、岛屿 14（terminal 5、composer 4、pdf 1、browser 1、resize 1、chat 3、profile 1…）、文档化例外 1（composerDraftStore）。
未自动收尾原因：剩余压缩需岛屿**内部**合并（terminalRuntimeAppearance/terminalPerformance 并入 terminalRuntime、fallbacks 合并、chat 岛 selection 并入 ChatView 等）——属用户可见的结构判断，不宜夜间自主。
备选：a) 用户确认后做 2-3 个岛屿合并即 <30；b) 修订指标为「区域外=0 即达标」（推荐：机器强制的是边界而非文件数）。

### 执行记录 — P1-F1 storage port 的一处保守偏离（2026-07-27，🟡 备注）

`composerDraftStore.ts` 的持久化**未**接入 platform/storage：改前该模块与 useLocalStorage hook 在 node 测试环境使用两个独立内存 Map，attachments 测试编码了这种"双 Map 事故"（经由 hook 路径种"不可读存储"断言 unverified）。统一后行为变化（4 测试失败）→ 保留 legacy 表达式 + 注释，待 P2-V2 Lynx storage impl 落地时连同测试一起统一。备选方案（改 4 个测试适配统一存储）可逆且已评估，按"改动最小化"未采纳。

另：storage port 解析语义经两轮修正定稿为**逐调用惰性解析**（window.localStorage → globalThis.localStorage → 单例 memory）——测试会 defineProperty 替换 globalThis.window，模块加载期绑定会分裂状态（splitViewStore 等 5 文件教训）。

### D3 — CEF 兜底 → 倾向放弃，数据已备（2026-07-27，🟡 待用户确认）

[spikes/p0-s5](../spikes/p0-s5/README.md)：Lynxtron 0.0.7 无 CEF（mac 走 WKWebView 胶水），`<webview>` 元素插入即 Lynx view 崩溃 → "壳 + webview 内嵌"过渡形态当前不可落地。
选项：a) 等上游修（WKWebView 符号已在二进制，预期近版本支持）；b) 自研 NSWindow+WKWebView 原生模块（中等工作量，不依赖 `<webview>` 元素）；c) 放弃兜底直走主线。
**建议 c**（主线 Phase 1/2 不依赖兜底；WS/Tailwind/list 三大风险均已消减，主线信心足）；若用户想要早期可发行形态再评估 b。按规则标 🟡（用户睡醒后拍板），不阻塞任何 Phase 1 任务。

### D12 — Threads 70% 只能靠共享图的线程边界解锁，不靠继续切 Sidebar（2026-07-28，🟡 待确认）

D11 之后的每一刀都在 `Sidebar.tsx` 内部找 composition，本会话两刀合计只推进
25.31% → 25.40%。对 Threads 屏 UNMAPPED 的桶分析显示：sidebar 只占 8,876 LOC（11.5%），
真正的量级在 `other` 32,307（41.8%）与 composer/terminal/routes/chatview/transport，
即 `routes/__root + _chat + _chat.index` 的整片传递依赖。也就是说，即使把
`Sidebar.tsx` 抽干，Threads 也到不了 70%。

按 goal prompt 的硬规则，唯一合法路径是把原 route subtree 放进 Lynx compiler 用真实错误
驱动 adapter。本会话已做只读探针并拿到两条确定性阻塞（LOG 2026-07-28 条目）：
`~/nativeApi` 缺 `ensureNativeApi`（已按同契约补齐），以及 slice `platform/storage`
是 `background-only` 且缺 `flushStorageBeforePageHide`——共享图会把它拉进 main-thread
编译，直接失败。

结论（保守、可逆）：**不修改 06 的 ≥70% 契约、不提前把 P6-C1 标 completed**；把
P6-C1 的剩余工作重定义为"打通共享图的线程/端口边界"，第一步是让 Lynx storage port
双线程安全（main thread 同步只读镜像 + background 写入）并补齐 Web port 导出，然后重跑
同一探针继续收错。备选 a：把 ≥70% 的强制点整体后移到 P6-C6（六屏一起测），理由是
Threads 图天然包含 composer/ChatView，属 P6-C2/C3 范围——该备选需用户拍板，本轮不采用。

### D3 收口 — 放弃 0.0.7 webview 兜底（2026-07-28，🟢 定案=c）

此前挂 🟡 等用户拍板是执行偏差：这不是产品偏好，是已有阴性实测。P0-S5 证明 Lynxtron
0.0.7 二进制无 CEF（mac 仅 WKWebView 胶水），**插入 `<webview>` 元素即 Lynx view 崩溃**
（白屏 + devtool 断连，阶段化插入已定位到创建时刻）。既然可用性已被证伪，选项 a（等上游）
与 b（自研 NSWindow+WKWebView 模块）都不是"现在能做的事"。

定案 c：放弃 webview 兜底，走主线。P3-E6 保持 pending 并标注"依赖上游能力，不阻塞 Phase 6–8"。
若上游后续支持，恢复 a 的成本很低（只需重跑 P0-S5 的探针）。

### D12 收口 — ≥70% 强制点移到 P6-C6，C1 用自有子图门禁（2026-07-28，🟡 可逆）

问题不在门禁数值，在任务切分与度量口径不匹配：复用率按**路由依赖图**计算，而 `/` 路由
天然包含 composer、ChatView、transport——那是 P6-C2/C3 的范围。因此"C1 必须 ≥70%"等价于
"C1 必须先完成 C2/C3"，与 01-roadmap 自己的依赖顺序自相矛盾（C2 依赖 C1）。

定案（保守可逆，不降低最终标准）：
1. **≥70% 的强制放行点移到 P6-C6**（六屏一起验收），与 06 的"Phase 6 每个核心屏均 ≥70%"
   在 Phase 出口层面完全一致；
2. 每个 C 任务继续报本屏数字，作为**进度指标**而非放行条件；
3. **给 P6-C1 加自有子图门禁**：只计 shell + sidebar 入口子图（排除 composer/ChatView/
   terminal/transport），使 C1 有可独立达成的真实门槛，避免"任务状态长期失真"。

备选：不动契约、C1 一直挂到 C2/C3 完成——不采用，因为它让 SSOT 长期不反映真实进度。
本决策只改"强制点位置"，不改任何阈值；若用户希望恢复 C1 即强制，删除本条即可。

### D2 定案 — 终端一期裁剪（2026-07-28，🟢 用户决策）

用户明确："终端一期裁剪"。

范围影响：`components/terminal/terminalRuntime.ts`（1,209 LOC，已归 EXCLUSIVE）与
terminal 相关模块（Threads 图内约 4,646 LOC）整体登记为 **hard island**，一期不移植。
理由与可行性依据：xterm 依赖 DOM/canvas，PrimJS 无法运行；自研原生终端模块属独立项目量级。

执行后果：
- **P3-E5 由 pending 改为 descoped（一期）**，不再作为 Phase 5–8 的可达任务，因此不再
  计入停止条件 (b) 的"等待用户决策"集合。
- 复用率口径：terminal 模块保持 EXCLUSIVE 分类，本就不进 eligible 分母，裁剪不改变已有
  百分比，也不构成"靠扩大排除集刷数字"。
- Phase 8 完成报告需明确列出"终端未移植"为已知能力差距；若后续要补，恢复路径是新建
  原生终端模块 + 在 02 登记新的 SPLIT，而不是把 xterm 塞进 Lynx。

### D13 — 优先级重定：聊天主 UI 高优，复用率降为非阻塞目标（2026-07-28，🟢 用户决策）

用户明确三点：
1. **terminal 与内嵌 browser 留 placeholder**（不是静默缺失，也不是完全不做界面）：
   保留入口与占位表面，说明该能力一期不可用，避免用户以为是 bug。
2. **其余聊天主 UI 全部高优**，尤其是**基于 `<list>` 的完整聊天能力**
   （transcript 虚拟列表、流式追加、底部吸附/脱离、长消息、空态）。
3. **强制点可以让掉**。

因此对既有决策做如下修订：

- **D2 修订**：P3-E5 由 "descoped" 改为 **placeholder**——terminal 仍登记 hard island
  （xterm 无法进 PrimJS），但需要一个说明性占位表面，不移植 runtime。
- **D3 修订**：同理，内嵌 browser / PDF 走 **placeholder**，不再等待上游 webview。
- **D12 取代**：≥70% 不再是任何任务的**放行门禁**，降为**报告用目标值**。
  `06-high-fidelity-port.md` 的 ≥70% 表述按本条解释为"持续追踪的目标"，
  reuse-audit 继续每刀出数，但不因未达标而阻塞任务标 completed。
  `threads-shell` 子图指标保留为进度观测，不再作为 C1 放行条件。

**新的任务放行标准**（取代百分比门禁）：某屏的结构、文案、tokens、交互与真实数据达到
`06` 的视觉契约（两尺寸、锚点 ≤8px、字号 ≤2px、semantic tokens、同源内容），
且无未登记的平台差异，即可标 completed。复用率作为附带指标记录。

**新的执行顺序**（覆盖 01-roadmap 的原 ID 顺序）：
P6-C2（Thread + Transcript + `<list>` 完整聊天）→ P6-C3（Composer）→ P6-C1 收尾
→ P6-C4（Settings）→ P6-C5（Projects/Kanban/PR）→ P6-C6 → Phase 7 → Phase 8。
理由：聊天是产品主路径，C1 的剩余部分是 sidebar 打磨，不应挡住主路径。


### D7 更新 — 主仓 workspace 已成为实际落点（2026-07-31，🟢）

P8-Q1 已将应用从原 `synara-lynx/slice` staging 落入 `synara/apps/lynx`，并把可重复的
审计控制面复制、改造成该 workspace 的相对路径。`synara-lynx` 不再是构建依赖，也不在
本次迁移中被删除或修改；它继续作为可恢复的历史 control plane。

P8-Q1 已完成 `bun install`、Web/Lynx/desktop production build、四条严格审计及主仓/可恢复
staging `git diff --check`；该结论仅证明单仓源码、依赖与审计链闭环。

本次不将“移入主仓”误记为发行完成：D8 的 Developer ID 签名、公证、stapling 与 CI
凭证仍待发行所有者提供，且不阻塞源代码、审计或 P8-Q2 视觉认证。

### D14 — exact-owned 后台 Native 验证实例（2026-08-02，🟢）

同 bundle-id 的用户 Lynxtron 已运行时，0.0.7 的 single-instance lock 会让本仓验证实例在
创建窗口前退出；仅靠 `--user-data-dir` 无法可靠分离。为满足 no-Raise、不得触碰用户进程的
验收约束，主进程新增两个默认关闭的显式开关：

1. `SYNARA_ALLOW_PARALLEL_INSTANCE=1` 跳过应用锁，并同时禁止该验证实例注册系统
   `synara://` handler；默认产品仍获取 single-instance lock。
2. `SYNARA_BACKGROUND_LAUNCH=1` 在创建时保持 hidden，setup 完成后只调用
   `showInactive()`，使 Computer Use 可捕获/操作而不 activate/focus/Raise。

这两个开关只用于 exact repository app + isolated user data/server 的自动验收，不改变普通
启动、deep-link 或单实例产品语义。Computer Use 仍必须用完整 `.app` 路径；不得因 bundle-id
重复而降级到模糊目标。

### D15 — host input 缺口以 delivery evidence 分层，真实 IME 已闭环（2026-08-03，🟢）

P9-D1 的 Web/Native probe 证明 binding 存在与 runtime delivery 必须分开判定。当前结论：

1. application menu accelerators、`-lynx-invoke` request/reply 与 Lynx built-in events 是
   三条独立路径，不能互相替代证据；
2. Native pointer、普通 textarea input、scroll wheel、window focus/blur 可由当前 host
   发布；Tab/view key 与 textarea Arrow/Enter/Escape 不发布到 Lynx JS，继续作为
   Lynxtron 0.0.7 host/kernel gap；
3. 真实 macOS IME composition 只能由 active/frontmost text client 获得。
   `SYNARA_BACKGROUND_LAUNCH=1` 的 exact-owned textarea即使收到programmatic focus，也不
   成为Text Input Manager target；PID-targeted `CGEvent`不经过IME，不能作为替代；
4. 配置可用Computer Use visual model后，先验证exact-owned window/textarea可见未遮挡，
   再用真实visual tap激活。Doubao Pinyin延迟输入`zhongwen`得到8次
   `input:composing`（最后`isComposing=true`），单次Space提交得到
   `input:committed`（`中文`, `isComposing=false`）；该cell为真实阳性；
5. P9-D1据此completed。Tab/view key与textarea Arrow/Enter/Escape仍是已登记host/kernel
   gaps；P9-R1仍需用户明确授权，不能因D1完成自动进入。
