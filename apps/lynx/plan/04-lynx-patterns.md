# 04 — ReactLynx 双线程模式手册

垂直切片期间持续积累。每条 = 问题模式 → Lynx 写法 → 实例。

## 已知模式（来自文档调研，待代码验证后标注 ✅）

### P-01 测量→渲染（getBoundingClientRect→setState）

Web 写法同步测量后 setState。Lynx 中 `NodesRef.invoke({method:'boundingClientRect'})` 与 `lynx.createSelectorQuery()` 均为 **async 桥调用**；同步读取只能在 MTS（`'main thread'` 函数 + `main-thread:ref` / `main-thread:bindlayoutchange`）内。模式：能移入 MTS 的移入 MTS；否则接受一帧异步。

### P-02 滚动跟随（transcript 底部吸附）✅（P0-S4 实测，2026-07-27）

`<list>` 语义差异全部坐实：子组件 JS 实例**提前全量创建**（150/150），`useEffect`/ref ≠ UI 可见（attachedCells 仅 9）。**已验证模式**（代码：spikes/p0-s1/app/src/app/Transcript.tsx）：

- 状态机：`pinnedRef` + `bindscroll` 中 `eventSource===2(SCROLL) && scrollTop+listHeight < scrollHeight-30` 脱离、回底重吸附；追加后在 items effect 里 `scrollToPosition({index:last, alignTo:'bottom'})`。
- **瞬时程序滚动报 LAYOUT(1) 不会误触发脱离**（设计安全）；**smooth:true 报 SCROLL(2)**，程序动画滚动要注意会走用户同门。
- `scroll-event-throttle` 默认 200ms 太粗 → 设 16–32ms，handler 保持廉价（事件跨线程）。
- 可见性用 `need-visible-item-info` 的 `attachedCells`（@PC ✅）；`getVisibleCells` 无 @PC 标注勿用；`getScrollInfo` @PC ✅。
- `estimated-main-axis-size-px`（list-item 属性）必给。MTS 化（P-03）留待帧率不足时升级。

### P-03 事件处理跨线程延迟

普通 bind 事件在 background 线程执行 → 手势跟随 UI 必卡。手势/拖拽相关全部用 `main-thread:bind*` + MTS；捕获变量须 JSON 可序列化且仅 re-render 时同步；MTS 局部状态用 MainThreadRef。

### P-04 useLayoutEffect

降级为异步 useEffect。同步 layout-read-then-render 模式不存在；用 `main-thread:bindlayoutchange` 或接受异步。

### P-05 'background only' 边界

事件处理器、effects、refs、`lynx.*`/NativeModules/fetch/timers 调用必须 background-only；首屏代码双线程各跑一次——render 期副作用会双发或崩溃。handler 作为 prop 传递、包进自定义 hook 时编译器推断有缺口，需显式 `'background only'` 指令。

### P-06 无 DOM 检测分支

库若 feature-detect `typeof document === 'undefined'` 会走 SSR 分支。TanStack Router 需显式 `isServer: false` + `url-search-params-polyfill` + `react$/compat` alias。

### P-08 路由：TanStack memory history + Lynx 渲染层 ✅（P2-V1 实测）

`@tanstack/react-router` 组件层在本 Lynx 构建崩溃（`snapshotPatchApply failed: ctx not found, snapshot type: 'wrapper'`，Suspense/transition 机制不兼容）；`<Link>` 渲染原生 `<a>`（非法元素）。模式：`createMemoryHistory`（@tanstack/history，纯 JS ✅）+ `history.subscribe` 驱动 `useState` 路由态 + 手写 pathname→params 匹配 + `bindtap` 导航（`history.push`）。react$ alias 用 compat shim（`export *` + default 透传 + `use=undefined`）满足 Rspack 静态链接（TanStack `React["use"]` 动态探测、zustand `import React from 'react'`）。URLSearchParams polyfill 首行加载。

### P-09 Lynxtron 视觉验证陷阱 ✅（P2-V1 实测）

devtool `take-screenshot` 对**不可见/未绘制**的 Lynx 窗口会超时挂起（表现酷似"白屏+无 console"，曾被误判为渲染崩溃整轮 bisect）。判定渲染问题：先 `screencapture` 看整屏（或 `alwaysOnTop`）；devtool 端口按进程 lsof 核实（多 lynxtron app 同名注册）；rspeedy dev 端口被占会自增，模板 main.ts 的 dev URL 硬编码 5969——端口错开会**加载到别家 bundle**。

### P-10 同步 KV port + 异步 host 持久化 ✅（P2-V2 实测）

Lynx 无 localStorage，而现有 stores 依赖同步 `getItem/setItem`。模式：background 线程维护
`Map` 镜像以保留同步契约；启动时显式 `hydrateStorage()`；写操作先同步改镜像，再进入单一
Promise 队列经 `NativeModules.bridge` 写主进程 JSON KV，保证 set/remove/clear 顺序；
需要 durability 边界时 `flushStorage()`。主进程以 userData 路径存储并用
temp+rename 原子替换。P2-V2 实机验证 mirror 与 disk 同值；不要把异步 bridge Promise
直接暴露给原有同步 store，否则调用方语义会扩散。

### P-11 平台同名 wrapper + 无后缀解析 ✅（P2-V3 实测）

Rspeedy `resolve.extensions` 将 `.lynx.tsx/.lynx.ts` 放在 `.tsx/.ts` 前；共享调用方始终
`import .../ui/button`，不写平台后缀。Lynx wrapper 保持导出名与组合形状，并在边界转换
事件语义（例如 Lynx Input 的 `onInput(value)` → web 风格
`onChange({target:{value},currentTarget:{value}})`；Base UI `render={<Button/>}` →
wrapper 内 slot）。P2-V3 probe 以 web 同形调用点构建、实机渲染通过。

UI wrapper 本身参与首屏双线程 render，**不能**整模块 `import 'background-only'`（编译器会
报 main-thread module invalid import）；只在 `handleInput/toggle/handleClick` 等事件函数
内写 `'background only'`。纯 L1 port 模块才适合模块级 background-only。

### P-12 DOM 图标库 → Lynx 静态 SVG 模块 ✅（P2-V4 实测）

不要把 `@tabler/icons-react` 一类 DOM 组件带进 Lynx bundle。生成期读取图标包的原始
SVG，校验并压成字符串；运行期用 Lynx `<svg content={svg}>` 渲染。生成模块保留共享层
所见的稳定 export 与 `size/color/strokeWidth/style` props，因此调用点不需要平台判断。
首切片 14 个图标连续生成 hash 一致，Lynxtron Desktop 全量实机通过。manifest 是唯一
人工清单；生成文件不手改。

### P-13 Markdown：background AST → Lynx renderer ✅（P2-V5 实测）

`react-markdown` 会在 render 期解析；ReactLynx 首屏 render 双线程执行，因此 micromark
也进入 main-thread bytecode，PrimJS 对其中正则语法编译失败。模式：把 unified +
remark-parse/GFM/math 放进 `background-only` 模块，在 effect 中解析；删除 position/data，
只传递可序列化 mdast 字段；渲染模块递归映射到 `view/text/scroll-view`。Rspeedy 对
`decode-named-character-reference` 会选 browser DOM export，需 alias 到同包 `index.js`
纯 character-entities 实现。

GFM table 和 fenced code 使用横向 `scroll-view`；task list 渲染只读 checkbox；数学节点
以带 `ƒ` 标识的 TeX 源码降级。不要在 render 初始化器里直接 parse，也不要带 KaTeX
rehype DOM 输出。

### P-14 原生 WS + Effect JSON wire 的薄 facade ✅（P2-V6 实测）

完整 Effect RPC client 当前不适合直接进入 Lynx bundle（TextEncoder、PrimJS runtime 与
生产 lazy chunk 三重边界）。只读切片可在 `background-only` facade 中保留协议本身：
先连 `/ws/bootstrap` 发送 `bootstrap.negotiate`，再把协商出的 epoch/revision/server
instance 写入 `/ws` query，按 `_tag=Request/Exit` 与 request id 匹配文本帧。业务层只看
可序列化 snapshot，transport singleton 在 close/error 后清空，由 query 层重试。

两个 Lynxtron Desktop 专属陷阱：其原生 WS 默认 Origin 会被 Synara 安全门拒绝，需用
`@lynx-js/websocket` 第三参数显式传服务端既有可信 origin（`synara://app`）；当前 URL
polyfill 的 `url.pathname = ...` 静默无效，endpoint/query 应用纯字符串构造并编码，不能
假定浏览器 URL 的可变语义。P2-V6 抓包确认前者握手头，真实 server snapshot=2 threads
并成功渲染 transcript。

### P-15 native textarea + shadow chip AST ✅（P3-E1 实测）

Lynx `<textarea>` 是原生多行编辑器，不能容纳 inline child/chip。模式：prompt 字符串保持
唯一真源；用与 Web composer-nodes 同形的纯 serializable segments 解析 mention/skill/
slash token，在 textarea 邻接的横向 `scroll-view` 中渲染“shadow chips”。候选 chip
插入时同时更新 store，并通过 textarea ref `setValue` + `setSelectionRange` 同步 native
值/光标；`bindinput` 再把用户编辑写回 store。这样不依赖 DOM selection/range，也不复制
Lexical state machine。

parser 本身参与双线程 render，不能模块级 `background-only`；ref invoke 与事件 handler
必须显式 `'background only'`。P3-E1 Desktop 实机验证 textarea、5 个真实/静态 suggestion
及 4 类 parsed chip；结构化 parser 单测 3/3。

### P-16 UI → background port 的 eager 动态边界 ✅（P3-E2 实测）

同时参与首屏双线程 render 的 UI 模块不能静态 import 一个模块级 `background-only` port；
否则 main-thread 编译直接拒绝依赖。普通 `import()` 虽能跨过编译边界，却会生成
`lazy-bundle/` 文件 chunk，Lynxtron 0.0.7 的生产 `file:` 入口当前不能可靠加载。

模式：把 port 调用封装在带 `'background only'` 的 async function 中，并使用
`import(/* webpackMode: "eager" */ '../platform/storage')`。模块仍编入主 bundle，但只会在
background handler/effect 内执行；UI 保持双线程可编译，也不产生外部 lazy chunk。P3-E2
用此方式完成设置 hydration 与每次变更的顺序持久化；scanner 2 文件 0 diagnostics，生产
构建仅有主 bundle。

P6-C1 进一步验证该边界可包住“共享 feature module → L1 port”：直接从 Sidebar UI
静态 import Web `Sidebar.uiState` 会沿 Lynx storage adapter 把 `background-only` 带入
main-thread graph，编译器按预期拒绝；改为 background async function 内 eager import
共享 feature module，`~/platform/storage`/`env` 再精确 alias 到 Lynx L1，production
first paint 与真实 `bridge.storageDump` 均通过。不要因为 feature module 本身普通就忽略
它的 port 依赖线程属性。

同一边界也用于 Web renderer preference 真源：project `expanded` 不在 server snapshot，
而在 `storePersistence.ts` 的 `synara:renderer-state:v8` 中按 normalized cwd 保存。
Lynx background effect eager import 原物理模块，hydrate 后读写同一 document；UI 线程只持
可序列化的 expanded cwd set。不要从 RPC 缺字段推断为服务端缺陷，也不要另造按 project id
持久化的第二套 authority。

### P-17 大组件双实现：共享 projection，不共享 renderer ✅（P3-E3 实测）

面对 Web Sidebar 这类 DOM、hover、DnD、context menu 与多 store 深度耦合的大组件，不把
6.7k 行 JSX 逐标签翻译。先保留/扩展 Web 已有的 `Sidebar.logic.ts` 纯逻辑边界；Lynx 侧也
以独立纯 `sidebar.logic.ts` 接受 serializable project/thread snapshot，输出稳定分组与
排序，再用原生 `view/scroll-view/bindtap` 渲染。

这样双端共享的是可测试的 projection 契约（项目顺序、recent-first、orphan 保留），不是
平台事件模型。hover/DnD/context menu 不伪造等价；首版用 active 状态类、tap disclosure 与
直接导航。P3-E3 用真实 WS 两项目/两线程实机通过，projection 单测 2/2。

### P-18 桌面看板：视口内列用等分 flex，不套横向 scroll-view ✅（P3-E4 实测）

Lynx Desktop 的 horizontal `scroll-view` 包固定宽 flex 列时，即使总列宽理论上小于父级，
初始 layout/scroll offset 也可能把整个 app shell 推离可视区；首次 Kanban 截图左 sidebar
完全被裁掉。对于已知三列且目标桌面宽度足够的看板，外层使用普通 `view`，列
`flex:1; min-width:0` 等分；每列内部再用 vertical `scroll-view`。修正后 sidebar、三列与
卡片同时稳定入屏。

只有列数真正动态超出视口时才使用 horizontal scroll-view，并显式设置 scroller/内容宽度、
启动 offset 与回归截图，不把 Web `overflow-x:auto` 机械翻译。

### P-19 壳事件：主进程 GlobalEvent → memory history ✅（P4-X1 实测）

Lynxtron 没有 Electron `ipcMain/webContents.send`，但 `LynxWindow.sendGlobalEvent` 与 Lynx
background 侧 `GlobalEventEmitter` 形成稳定单向壳事件通道。主进程把菜单 accelerator、
`open-url`、`second-instance` 统一投影为 `shell:navigate` + pathname；router 在一个
background-only effect 中 eager import bridge、订阅事件并 `history.push`。

不要让主进程理解页面组件，也不要重载 bundle 来导航。单实例启动过早时把 route 暂存，
首 bundle load 后再派发。P4-X1 实测启动第二进程参数 `synara://settings`，既有窗口聚焦且
memory-history 切到设置页；同一机制承载 CmdOrCtrl+1/2/3/, 菜单。

### P-20 无 autoUpdater：元数据检测与固定下载页分离 ✅（P4-X2 实测）

Lynxtron 无 `autoUpdater` 时，不在首版自研下载、校验、替换、重启整条高风险安装状态机。
主进程只向固定 GitHub releases API 发 12s 超时的匿名 GET，解析 `tag_name`，用纯 semver
比较器与当前包版本比较；UI 显示 installed/latest/error。用户点击“Open download page”
时，主进程只打开代码内固定的官方 releases URL，不接受 renderer 传入的任意目标 URL。

网络错误是结果态而不是启动失败；检查不会下载资产，打开页面也不自动安装。P4-X2 实机从
`0.5.5-lynx.0` 检出 `0.6.2`，同时离线/404 路径有明确错误 UI。

### P-21 生产包诊断：默认关闭、显式环境开关开启 DevTool ✅（P4-X3 实测）

Lynxtron 生产包会注册 DevTool connector，但默认不创建可检查的 Lynx session；因此
`list-clients` 能看到进程而 `list-sessions` 为空，不能据此判定 bundle 未加载。主进程在
创建窗口前调用 `devtool.setDevToolEnabled()`，只在 development 或
`SYNARA_ENABLE_DEVTOOL=1` 时开启。普通发行启动仍关闭调试面，受控冒烟则可按 PID+lsof
锁定 connector，确认 session URL 是 `.app/Contents/Resources/.../main.lynx.bundle`，
再用 DevTool 截图与读 console。

打包验证分四层：builder 成功 → `hdiutil verify` → 只读挂载确认 `.app`/Applications →
直接启动包内 Mach-O 并加载内置 bundle。签名/notarization 是独立发行决策，不把本地
unsigned 冒烟与公开可信分发混为一谈。

### P-22 源码复用门禁：物理文件身份，不认同名副本 ✅（P5-R1）

从每个 Web route + 公共 shell entry 构建静态 TS/TSX import graph；排除 test/generated/
声明/已批准 EXCLUSIVE hard island 后形成 eligible denominator。Lynx graph 只有实际引用
同一 realpath 才记 SHARED，确定性生成且显式登记的 source 才记 PATCHED；同名文件、复制
JSX、概念相似或只复用接口都不进入 numerator。module% 与 token-aware non-comment LOC%
同时报告，gate 取二者较低值。

目标 SHARED/PATCHED/SPLIT/EXCLUSIVE 与当前 UNMAPPED 分开：UNMAPPED 是审计状态，不是允许
长期存在的第五种架构分类。生成器必须有 `--check` 模式，import 未解析或分类数量不闭合即
失败。P5-R1 用此口径证实六核心屏当前 eligible reuse 均为 0%，避免用“逻辑理论可复用”
代替“Lynx 构建确实复用了源码”。

### P-23 共享 composition + 最薄 host element adapter ✅（P5-R2）

普通 JSX 不必因为 Web 使用 `section/h2/div` 就整棵复制成 `.lynx.tsx`。先把稳定的组合结构
提成同一物理 source，让 PascalCase host element 从无后缀 import 进入；resolver 只把该
最薄叶子映射到 Web DOM 或 Lynx `view/text` 实现。共享层继续持有 children 顺序、class
recipe 与 props，adapter 只负责合法元素和极少平台 class。

不要从已有大 barrel 直接开始探针。P5-R2 原样导入 `SettingsPanelPrimitives` 会经 Base UI
Select 链触发 `React.version` 静态链接失败；改为直接导入新共享
`SettingsSection.tsx` 后，Web 8,755-module production build、Rspeedy/Lynxtron 实机均通过。
门禁以 realpath 认出该 source，Lynx element adapter 不计 SHARED。此模式可逐层扩大共享
边界，同时让真实 compiler error 决定何处下沉 primitive，而不是先复制页面。

### P-24 canonical UI import + Web-shaped event façade ✅（P5-R3）

共享 feature 永远 import `~/components/ui/<name>`；Rspeedy 的精确 alias 必须排在通用 `~`
source alias 前，将 button/input/dialog/menu/tooltip/scroll-area/collapsible 映射到 Lynx
leaf。调用点不写 suffix、不检查平台。adapter export 集合与当前 Web wrapper 对齐，平台
额外能力不能反向污染共享 API。

事件只模拟调用点实际读取的最小形状：Input change/focus/blur 提供
`target.value/currentTarget.value`；Button click 提供 preventDefault/defaultPrevented/
stopPropagation。后者在无 DOM bubbling 的 Lynx Button 上是 no-op，若业务真正依赖传播
顺序则必须下沉事件 adapter，不能继续扩写一个假的完整 DOM Event。

P5-R3 用主仓未改的 `DebouncedSettingTextInput.tsx` 实证：其 canonical Input import、
controlled value、focus/blur/debounce call-site 原样进入 Lynx build 并实机渲染。reuse
审计必须复刻同一精确 alias 规则，否则会把 Web primitive 文件误记为 SHARED。

### P-25 全量样式审计，按 physical-shared 图发射 ✅（P5-R4）

coverage manifest 必须扫描六屏 eligible module union 的 className、cn/cva/clsx/cx 与导出的
class constants，保留 token→file→screen provenance；但 runtime CSS 只发射当前 reuse
报告中 `SHARED/PATCHED` 物理源实际可达的 tokens。这样门禁先看见未来迁移债务，首包不会
提前吞入尚不可能渲染的几百模块样式。

P5-R4 的 full-union CSS 约 134kB，会让当前 Lynx DevTool DOM/screenshot 连续错过 30s
deadline；按 physical graph 切后只剩 65 classes/3.8kB，生产 bundle 594.3kB 并恢复稳定
截图。utility coverage 的 eligible denominator 只排除 authored component class 与逐项
登记的平台不支持项；UNMAPPED 仍进 denominator。coverage、unmapped 和 unsupported 各自
ratchet，避免靠把失败改名为“不支持”过线。

### P-26 role-specific host class，替代 `!important` ✅（P5-R5）

共享 composition 可以继续携带 Web class recipe，但 Lynx host-element adapter 不应把同一
节点上互相冲突的 Web anatomy utility 原样保留，再尝试用 `!important` 抢回布局。P5-R5
实机发现 encoder 会静默省略含 `!important` 的声明：build 通过，DevTool matched styles
却没有对应 flex direction/size，极易误判为引擎布局 bug。

adapter 应按元素角色剥离确定不适用的 utility anatomy class，追加稳定的
`Shared<Feature><Role>` class，再用普通 specificity 声明 host 布局；semantic color/type
class 继续同源。P5-R5 的 SettingsRow 因此同时得到 Web 18px 行盒、61/78px row anatomy
与 ≤1.75px anchor delta，而没有增加平台判断到共享调用点。

### P-27 DevTool 双尺寸以实际 app state 为准 ✅（P5-R5）

Lynxtron 0.0.7 的 CLI `--user-data-dir` 不改变 `app.getPath('userData')`。若只在临时目录写
window-state，native window 会继续读默认状态，第二张截图可能仍是第一尺寸；DevTool
截图成功也不会提示尺寸错了。

双尺寸协议必须同时记录 native window bounds、LynxView PNG logical size 与 DOM root
width。需要临时改尺寸时：先 byte-for-byte 备份 app 实际 state，关闭本任务实例，修改
state，启动后以 CoreGraphics/DOM 复核，截图后关闭并恢复备份。只终止本轮 PID；不要用
`pkill`，也不要触碰其他 client。

### P-28 full-tree compiler success 与 runtime paint 分门禁 ✅（P6-C1）

把 Web entry 整树送进 Rspeedy 是差异发现工具，不是复用完成证明。P6-C1 的完整
`Sidebar.tsx` 在补 `React.version` 与隔离 xterm registry 后能够产出 3.6MB bundle，但
Lynxtron surface 仍为空白：原树同时携带原生 HTML host tags、Router provider 假设、
Base UI 与 DOM/DnD 事件语义。

探针必须依次记录 compile、module-load、first paint、interaction 四道门。只过 compile 的
route 不得留在产品 entry，也不得进入 source-reuse 分子。遇到这种结果先拆共享
controller/view-model 与大颗粒 presentation composition；平台 alias 只落在 host/L2/hard
island 叶子。这样保留同一物理真源，又不会用不可见代码刷复用率。

### P-29 shared list 不增加 keyed Fragment function wrapper ✅（P6-C1）

共享泛型 list 初版为了统一 key，给每个 `renderRow(row)` 外包一层“带 key 的函数组件，
函数返回 Fragment”。Projects 当前甚至是零 rows，Lynxtron 仍会让整个父 Sidebar 静默
不绘制，console 无异常；同 bundle 其他 surface 正常。

ReactLynx list composition 应让平台 row renderer 把 key 放在真实行根节点，shared source
直接 `rows.map(renderRow)`，不要为 key 人为增加 wrapper snapshot。移除 wrapper 后同一
Projects/Chats shared composition 恢复 first paint。这个限制不改变 Web DOM，也避免再次
触发 P2-V1 已见的 `snapshotPatchApply ... wrapper` 类问题。

### P-30 module-level reuse 指标要求真实模块边界 ✅（P6-C1）

reuse audit 以物理 module 的完整 LOC 计数。若 slice 只调用 1,519 行 monolith
`Sidebar.logic.ts` 里的两个短函数，指标会从 0.91% 瞬间跳到 16.78%，同时无关依赖让
bundle 从约 651kB 涨到 1.15MB；这在定义上是“同文件”，但夸大了真实迁移面。

遇到这种结果必须把两端真实消费的 cohesive helpers 抽成小型物理真源模块，再让原
monolith re-export 保持 Web call-site。P6-C1 将 grouping/recent-sort 抽为
`SidebarProjection.logic.ts` 后，bundle 回到 650.9kB，诚实 gate 为 0.94%。禁止用 import
大文件但只消费少量 export 的方式刷 module/LOC reuse。

同样原则适用于“看似纯逻辑”的 feature 聚合模块。直接 import
`lib/subagentPresentation.ts` 只为 nickname/role/accent，仍会把 parent activity directory
和 model formatting 链带入，使 bundle 671.8→1185.1kB。正确做法是把两端实际共同消费的
显式 identity 规则抽为 `SidebarThreadSubagentModel.logic.ts`，让原 Web 聚合模块反向调用
该核心；Lynx 最终仅 681.6kB。共享率必须伴随依赖边界与 bundle 证据。

相同约束也适用于 icon registry：Lynx 不应为了一个 provider glyph 静态 import Web 的
DOM-oriented `ProviderIcon` 聚合链。P6-C1 将 single-provider 与 source→target handoff
composition 抽成轻量 `SidebarThreadProviderIdentity`，两端分别注入 host element；Lynx
adapter 直接引用主仓 `central-icons-fill` 的同一 raw SVG。资源复用需如实记录，但
TS/TSX module gate 不把 SVG 字节冒充共享代码；主仓缺失的 Droid/Kilo/Pi 采用稳定文字
首字母回退，等待同源资产而不另画近似图标。

### P-31 会读写同一基线的 audit 串行执行 ✅（P6-C1）

`reuse-audit` 会刷新 screen graph，`style-audit` 又以该 graph 计算 runtime class manifest。
两者并行运行时，style 的 write 与紧随其后的 check 可能跨越 reuse report 的原子替换，
表现为 `p5-r4-core-class-manifest.json is stale`，而连续两次 style write 的稳定 hash 又
完全一致。这不是样式回归。门禁顺序固定为：先 reuse write/check 完成，再 style
write/check；只把串行复现的 stale 判为真实失败。

### P-32 大 surface 不以多个 opaque ReactNode slot 穿透 snapshot ✅（P6-C1）

`SidebarSurfaceFrame` 曾把已渲染的 Header、Content、Footer 三棵大 subtree 作为 props 传给
共享 function component，再由 Lynx adapter 包进真实根 `<view>`。Web/Lynx build 与
Sidebar 99/99 tests 全过，实机却整页静默白屏；截图为
`current-fixes/lynx-shared-sidebar-surface-frame.png`。

这与小型 `icon/suffix` slot 可用并不矛盾：边界大小和嵌套 snapshot 数量本身是风险。
大 surface 应共享 controller data、稳定 discriminant 和在同一 render 层直接展开的
composition；不要把几棵已完成的 host subtree 再塞进一个“只是排序 slots”的 wrapper。

### P-33 小型 row presentation 可保留叶子 slots，但必须静态实机命中 ✅（P6-C1）

P-32 不意味着所有 `ReactNode` props 都不可用。thread row 的 leading/title/suffix 是小型、
有界叶子，外层真实可点击 row 仍由平台 renderer 直接持有；共享
`SidebarThreadRowPresentation` 只决定三者顺序并消费已验证的共享 identity。它在 Web 真
调用点与 Lynx project/chat 两类 renderer 同时落地。

若当前真实 snapshot 恰好没有 row，不能用“整页 first paint”冒充该组件的 runtime 证据。
应临时在同一产品 render 层插入一个最小静态 row，production build + 实机截图确认文字、
leading 与其余 surface 同时绘制，然后删除 fixture 并重建最终 bundle。P6-C1 证据为
`current-fixes/lynx-shared-thread-row-presentation-fixture.png`。小 slots 的成功不能外推到
整棵 Header/Content/Footer subtree；边界大小仍按 P-32 保守处理。

### P-34 双线程共享纯逻辑避免仅现代 background JS 可用的方法 ✅（P6-C1）

`SidebarProjection.logic.ts` 的 `rows.toSorted(...)` 在 Vitest、Web production build 与
Lynx background 首屏都能通过，却在 PrimJS main-thread snapshot 报
`not a function`。这类异常会在 background 成功提交后表现为“画面正常但 LogBox 有错”，
不能因为可见 UI 正常就忽略。

共享且参与双线程 render 的 collection helper 应使用最小共同运行时：需要不可变排序时写
`[...rows].sort(compare)`，不要依赖 `toSorted` 等较新的 prototype 方法，除非 main-thread
polyfill 已有实机证据。P6-C1 用 DevTool named stack 定位后替换，重新 open 同一 5971
bundle，console 从原异常变为空；证据
`current-fixes/lynx-shared-project-disclosure-persistence.png` 与同目录 notes。

### P-35 共享行尾语义模型，tooltip 与 glyph 留在 host adapter ✅（P6-C1）

thread-row 的 automation/handoff/fork/worktree 并非四个独立装饰 icon：它们有固定优先级、
handoff avatar 去重、sidechat fork 抑制，以及 status/shortcut/hover action 的互斥关系。
若 Lynx 只照截图手写 glyph，会很快与 Web 状态机分叉。

P6-C1 把可序列化的 visibility/order 抽为 `SidebarThreadMetaModel.logic`，并用
`SidebarThreadStatusIndicator` 共享 completed/running/attention 等分支；Web adapter 保留
tooltip、CentralIcon 与 spinner，Lynx adapter 映射为 view/text/CSS。实机临时 fixture
同时命中 fork + live status，截图为
`current-fixes/lynx-shared-status-meta-fixture.png`，随后删除 fixture。共享的是业务语义与
composition，不强迫没有 hover 的平台伪造 DOM tooltip。

### P-36 路由组件不可复用时，抽状态机并注入 history/store ports ✅（P6-C1）

TanStack Router 的 component layer 在当前 ReactLynx runtime 会触发 wrapper snapshot 崩溃，
但这不意味着 cold-start 行为必须重写。Web 原 `RestoreOrCreateChatRoute` 同时包含“空
bootstrap snapshot 等待 + 强制 refresh + remembered route 校验 + fresh-chat single-flight”
和 Web store/navigation 细节；直接 import 只会再次带入不可运行的 Router/DOM 链。

P6-C1 将前者抽为 `useRestoreOrCreateChatRouteController`，所有外部能力以 callback/data
注入。Web wrapper 继续使用 TanStack navigate/native snapshot/store；Lynx wrapper 使用
memory history、原 `Sidebar.uiState` storage schema 与真实 query refresh。默认空 snapshot
实机经过 fallback 后仍稳定绘制，console 无 exception，证据
`current-fixes/lynx-shared-route-restore-controller.png`。这是共享产品状态机，不是共享
不可移植的 Router renderer。

### P-37 大型 normalized store 在 background 复用，跨线程只传 projection ✅（P6-C1）

主仓 `storeProjection/storeNormalization/storeState` 是数千行真实产品数据语义，不能因为
Lynx main thread 不适合完整 Zustand/Effect runtime 就重写一套轻量模型。正确边界是：
background 收到完整 `orchestration.getSnapshot` 后直接执行
`syncServerReadModel(initialState, snapshot)`，再把 projects 与
`sidebarThreadSummaryById` 的轻量结果提交给 React Query/main thread。

P6-C1 第一次探针依次暴露两个真实 adapter gap：`getLocationOrigin` 未在 Lynx env port
实现，以及 PrimJS 无 `TextEncoder`。前者用明确的 server fallback origin 补齐；后者用
entry-first 纯 UTF-8 encoder/decoder polyfill（含 ASCII/CJK/astral tests）补齐。最终同一
58090 snapshot 经主仓 normalization 成功，截图
`current-fixes/lynx-main-store-projection.png`、console clean；bundle 716.3→1003.5kB，
但诚实 Threads LOC gate 4.14→13.65%，属于实际执行的 7,639 LOC 增量，不是空 import。

不要把完整 normalized `AppState` 作为 prop 穿到 main thread；只传当前 screen 所需的
serializable projection，既降低 snapshot 风险，也保留主仓作为数据语义 SSOT。

### P-38 共享行为从 Web 单体抽 portable leaf，先看实机 context 而非只看 build ✅（P6-C1）

`Sidebar.logic.ts` 与 `storeSelectors.ts` 在 Web 里是合理聚合边界，但为一个 sort/selector
把它们 eager 放进 Lynx main-thread，会间接加载 appSettings、work-log 与 native selector
大图。Rspeedy production build 仍成功，Lynxtron 却在构造模板 context 时失败；bundle
也从 1008.7 增到 1289.4kB。

修复不是复制 slice 算法，而是把 Web 原 attention/timestamp sort 抽成同一物理
`SidebarThreadSort.logic.ts`，把它唯一依赖的 latest-turn lifecycle 再抽成无 work-log
依赖的 `sessionActivity.logic.ts`；Web 单体 re-export 原 API，Lynx 直接调用 portable
leaf。父子行顺序使用既有 `SidebarThreadPaging.logic` tree builder。最终 production
1008.7/1123.7kB，实机截图 `current-fixes/lynx-shared-sidebar-controller.png`，console
无新 exception。

### P-39 复用审计不得把 type-only 依赖图当运行复用 ✅（P6-C1）

当前静态审计器保守扫描所有 import；TypeScript 的 `import type` 也会被计入模块图，虽然
bundler 已完全擦除。P6-C1 初版 portable sort 用 Web 大类型定义，报告一度显示 Threads
20.39%，而 product bundle 并无对应运行模块，这是虚高。

跨端 portable leaf 应优先使用最小结构类型/字符串联合，既降低编译耦合，也让当前审计
口径接近真实运行图；去掉 type-only 大图后诚实 gate 为 13.92%。后续可增强 scanner
显式排除 type-only edge，但在工具修正前不得保留这类虚增。

### P-40 section controller 一次产出 raw/sorted map、partition 与 flattened rows ✅（P6-C1）

Sidebar 若在两端分别拼 `group → per-project sort → project sort → project/chat/studio
partition → chat flatten`，即使每个叶子 helper 都共享，组合顺序和输入集合仍会漂移。Web
此前 project 排序用 root-only threads、folder rows 用 tree threads，这个差异尤其容易在
clean-room adapter 中被抹掉。

P6-C1 抽出 `deriveSidebarSectionCollections`，显式接收 `treeThreads` 与可选
`projectSortThreads`，一次返回 raw/sorted maps、sorted projects、三个 partitions、
chat/studio flattened rows 与 orphan rows。Web 用它替换四段 useMemo，Lynx 的
`deriveSidebarSections` 只保留 DTO/name/cwd 适配。两端 production 与实机通过；bundle
1010.6/1125.6kB，Threads gate 14.00%。

### P-41 per-project core 注入 pinned/status，复用 tree/paging 而不拖入 Web 单体 ✅（P6-C1）

Web 的每个 project row 还包含 collapsed active reveal、parent/child tree、root-aware preview、
extra pages clamp 与 show-more 判定；直接复用 `Sidebar.logic` 会再次带入不可移植大图。

`deriveSidebarProjectRows` 把这些纯控制流抽为 portable core，把 pinned filtering 与
thread→project status aggregation 作为 callback 注入。Web wrapper 保持原
`getUnpinnedThreadsForSidebar` / status pill 语义；Lynx 当前无独立 pinned/status block，
注入 identity/null，但 collapse/tree/paging 已完全同源。slice render 不再自行先截 flat
rows。production 1014.8/1129.8kB，Threads gate 14.16%。

### P-42 list controller 与 row composition 要同时共享 ✅（P6-C1）

只共享 tree/paging helper，仍会让 Web 与 Lynx 分别决定“collapsed 时是否计算 rows、active
child 是否带 root、stale extra-pages 从 requested 还是 effective 继续”；只共享叶子
identity，又会让两端分别复制 provider/subagent/terminal 的分支顺序。两类漂移都不会被
单个空 snapshot 截图暴露。

P6-C1 新增 `deriveSidebarChatRows`，把 Chats 的 expanded gate、parent tree、root-aware
preview、clamp、ordered ids 与 Show more/less 判定一次产出；同文件的 transition reducer
明确 toggle 保留 requested pages、翻页从 clamped effective pages 继续。随后
`SidebarThreadRowComposition` 统一 provider/subagent/terminal leading 与 subagent title
选择，Web 只注入 tooltip/terminal badge，Lynx 只保留 clickable host root。实机初次截图
因窗口不可见得到全白，但 ReactLynx tree 完整；用 `open -a` 激活而不触碰系统权限后同一
session 正常捕获，console 无 exception。production 1016.3/1131.3kB，Threads gate
14.38%。

### P-43 大 store build 通过后仍须区分 dev ceiling 与 production decode ✅（P6-C1）

把完整 `composerDraftStore` facade 改成 Lynx persistence adapter 后，actions/domain/models/
attachments 确实进入同一物理图，production 编译为 1514.2kB；但运行验证出现两个不同
失败面：dev HTTP response（含开发元数据）超过 Lynxtron 10 MiB resource ceiling；停止
dev、重新 build、以 `NODE_ENV=production SYNARA_ENABLE_DEVTOOL=1` 加载干净 file bundle
后，host 仍报 template JSON parse failure，React frame 未创建。不能把前者误当成唯一原因，
也不能因 production 体积小就宣称可用。

保留方案把 Web `setPrompt` 的 immutable map/update/remove 语义抽为无 Schema/attachment
依赖的 `composerDraftPrompt.logic`，Web 完整 actions 与 Lynx prompt-only Zustand facade
同时调用；slice 自己的 draft map 被删除。该 leaf 的 production 1016.4/1131.4kB，
file-bundle DevTool 实机正常，Threads gate 14.41%。完整 attachment/model/persistence 图应
拆到 background 或上游修复 template decoder，禁止用别名让静态审计误计失败大图。

### P-44 row-sized ReactNode composition 也要命中有数据分支 ✅（P6-C1）

项目 disclosure 的 header/body/rows/pagination 顺序可以抽成一个共享 feature component，
而 Web 的 motion/sidebar DOM 与 Lynx 的 `view` disclosure 只留在同名 host-element adapter。
这比把整个 Sidebar 的 Header/Content/Footer 当 opaque slots 小得多，并让 Threads gate 从
14.41% 增至 16.80%；两端 tests/build 与最终 production file-bundle 首屏均通过。

但“首屏不白”不自动证明 row slot：本轮连接的 58090 snapshot 没有 projects，因此
`lynx-shared-project-disclosure.png` 只覆盖共享组件被加载、空 Projects 分支与整页 paint，
没有命中 header/row callback。此类证据必须在 notes 中注明分支边界；后续有真实 project
snapshot 时补展开/折叠截图，或用随后删除的静态 fixture 专门命中。不得把空数据截图写成
完整 disclosure 交互验收。

### P-45 root inline theme vars 需要 `enableCSSInlineVariables` ✅（P6-C1，2026-08-18 翻案）

原 P6-C1 / Lynxtron 0.0.7 实验能读取 stylesheet `:root` 上的 concrete custom
properties，但 ReactLynx root 的 `style={{"--background": ...}}` 不改变后代 tokens；
当时 class-scoped `.SliceRoot--theme-dark { --background: ... }` 也未覆盖 `:root`。
把 Web macOS 透明 material 原样投影时，dark white foreground 会落在 Lynxtron 白 host
上，截图看似空白但 console 正常。因此当时以 direct-value selector generator 收口是正确
的止血方案。

2026-08-18 用 Lynxtron `0.0.12-dev` / DevTool SDK 4.2 / production bundle 重做显式
off/on 配对后结论翻案：

- `enableCSSInlineVariables:false`：inline 请求从红切蓝，后代始终读取 `:root` 绿；
- `enableCSSInlineVariables:true`：后代初始精确为红，真实 tap 后动态变蓝；
- class-scoped override 在 flag off/on 两轮都独立由绿变紫，说明当前 runtime 已支持该
  路径，且它不归 inline flag 控制。

因此能力缺口应改判为「默认关闭 + Desktop 平台文档缺失」，不是引擎完全不支持。产品
config 仍保持原状：正式开启前必须跑 theme/density/composer 全屏视觉回归；删除
`src/generated/native-theme-variables.css` 及其生成器是独立大工程，不能在本实验 issue
顺手完成。探针产品代码已撤回；新证据为
`shots/2026-08-18/flag-experiments/enableCSSInlineVariables/off-on.png` 与同目录
`results.json`，旧阴性截图只保留为历史上下文。

### P-46 搜索先共享 ranking model，再扩 bounded data projection ✅（P6-C1）

Command palette 的全部 DOM/keyboard/browse 状态不适合一次塞进 Lynx，但其 action/theme/
project/thread/message score、tie-break、snippet 与 recent limit 是独立产品语义。
`SidebarSearchPalette.logic` 由 Web/Lynx 同一物理源执行；Lynx 用已有 Dialog/Input host
渲染真实 snapshot 的 recent/title/project 结果，Search 行不再 disabled。

共享字符串算法仍须过 main-thread 实机：PrimJS 同时缺 `toSorted` 与 `replaceAll`；输入
数组本来已由 map 创建，故 `.sort` 保持 immutable contract，regex `.replace(/\s+/g)`
与原 normalize 等价。Web 15/15 防回归，Lynx 第二次 console clean。message bodies 不随
sidebar summary 跨线程；在有 bounded snippet/index port 前明确不提供内容搜索，不能用
空字符串假称 parity。临时 default-open fixture 只用于
`lynx-shared-search-palette-fixture.png`，最终源已恢复点击打开。

### P-47 大 Web palette 先修 runtime primitive，不先拆 controller ✅（P6-C1）

`SidebarSearchPalette.tsx` 的 1141 LOC 首次直接进入 compiler 时，链接错误只来自
env/theme/native API ports；补齐后实机 `not a function` 由 debug metadata 还原到 Effect
Schema 的 `Object.hasOwn`，不是 React tree。React Query 必须 alias 到 slice 单例，否则
跨 workspace 的第二份 context 会报 `No QueryClient set`。补最小 PrimJS polyfill后
console clean，但 Base UI portal 在无 DOM 时不挂载；把 `Command`/`kbd`/button/input
改成稳定 `~/components/ui/*` import 并提供同 API Lynx primitive 后，原组件直接绘制。

原文件内裸 div/span/mark 统一收口到单个 `SidebarSearchPaletteElements` seam：Web adapter
保持原 tag，Lynx adapter 映射 view/text。不要在看到白屏时立即复制 1000 LOC view；先依次
排除 JS builtin、package singleton、portal/primitive、host elements 四层。平台未实现的
appearance/filesystem 通过默认 true 的 capability props 在 Lynx 显式 false，避免共享
组件展示无效动作。产品证据为
`current-fixes/lynx-shared-original-search-palette.png`；真实 Threads reuse 17.32→22.85%。

### P-48 surface 分支与 item 构造应和 row renderer 一起共享 ✅（P6-C1）

只共享 `SidebarPrimaryNavigation` row renderer 仍会让 Web/Lynx 各自维护 workspace /
studio / threads 三套 item 列表、active 条件、badge、shortcut 与 callback 映射。把这些
surface 语义继续上提到 `SidebarPrimarySurfaceNavigation`，再由两端只注入当前 surface、
能力 callback 与少量 icon/badge，才能消除会随产品变化漂移的真实分支。

Web 保留 `IoIosGitCompare` 与完整 Automations callback；Lynx 注入现有可运行 glyph，
没有实现的 Automations callback 会由共享组件统一 disabled。Web 聚焦测试 120/120、
production 8,814 modules；Lynx production 1561.5/1676.6kB，实机 console 仅 preload，
证据为 `current-fixes/lynx-shared-primary-surface-navigation-v2.png`。这类切口必须同时
替换两端调用点；新增共享文件但继续用两份 item array 不算复用完成。

### P-49 trailing cluster 共享互斥顺序，平台只注入叶子 ✅（P6-C1）

thread row 尾部并非简单图标槽：meta chips、jump shortcut 与 live status 有稳定顺序，
shortcut 出现时 status 必须隐藏，hover actions 又必须占同一个 trailing anchor。若两端
只共享 descriptor model、各自拼这一层 JSX，状态组合会继续漂移。

`SidebarThreadTrailingCluster` 现在物理共享上述顺序与互斥，并直接复用 shared
`Kbd`/`SidebarThreadStatusIndicator`；Web 只注入 meta stack、hover actions 与 timestamp
class，Lynx 只注入 descriptor glyph。强制展开 Chats + live status 的临时 fixture 命中
真实有数据行并截图后全部恢复，最终 bundle 仍以默认 collapsed/真实 live 状态构建。证据
`current-fixes/lynx-shared-thread-trailing-cluster.png` 中 Greeting 行尾蓝色 working dot；
console 仅 preload。

### P-50 action catalog 共享产品语义，capability 只做删减 ✅（P6-C1）

Search palette 原组件树已经共享后，若两端仍各写 action 常量，动作顺序、文案、关键词和
快捷键仍会漂移。`buildSidebarSearchActions` 现在是唯一 catalog：Web 注入完整 project /
import / feedback / usage / spaces 能力；Lynx 仅用 capability flags 删除未实现项，保留
同源 New chat、New thread、Settings 的顺序与文案。删减不允许替换成 Lynx 自创 copy。

纯逻辑测试固定完整 Web 顺序、Lynx capability 子集与 space callback；forced-open 产品
截图 `current-fixes/lynx-shared-search-actions.png` 同时显示三项同源 Suggested 与真实
Recent rows。fixture 只临时将 `searchOpen` 设为 true，截图后恢复 false 并重建最终包。

### P-51 display collection 与 identity lookup collection 不可混用 ✅（P6-C1）

Search project results 只应展示 ordinary projects，但 thread result 的 project label lookup
必须包含 Chats/Studio 容器。首次把两端 projection 统一后，Lynx 错把过滤后的 display
projects 同时用于 lookup，实机中 Recent 的 `Studio` / `hi` 标签消失；这类问题仅靠类型和
空数据测试发现不了。

修复后 `projectSidebarSearchProject` 统一 remote/folder/local fallback，
`projectSidebarSearchThreads` 统一 visible order、missing-record skip、project/space
label 与 message projection；Lynx 显式维护 ordinary display collection 和 all-container
lookup collection。`current-fixes/lynx-shared-search-projection.png` 证明两个真实标签恢复，
console 仅 preload。共享 controller 必须把“展示集合”和“身份解析集合”作为不同参数审计。

### P-52 monolith helper 下沉为 normalized presentation leaf ✅（P6-C1）

`Sidebar.logic.ts` 超过 1k LOC，直接为了 status helper 从 Lynx import 整模块会在 source
audit 中虚增整文件，同时实际 bundle 只需要极少代码。正确做法是把 status priority、颜色、
pulse、dismiss 行为和 project aggregation 下沉到独立 `SidebarStatus.logic`；Web 仍在原
controller 计算 pending/live/plan/completed 事实，Lynx 用 bounded snapshot 的
live/connecting 事实调用同一 presentation resolver。

Web 基线测试还捕获了重要语义：最高优先级状态若已 dismiss，应返回 null，不能继续下沉到
Completed。shared resolver 以“状态存在即返回 dismiss 结果”保留该行为。实机 fixture 强制
真实 Greeting row 进入 Working，`current-fixes/lynx-shared-status-presentation.png`
显示同源 sky pulse dot；fixture 恢复后 final bundle 重建。

### P-53 共享导航 leaf 必须接入平台级快捷入口 ✅（P6-C1）

仅把 visible-thread cycling 从 `Sidebar.logic.ts` 搬到小文件，再由 Lynx 做一次无用途
import，会虚增复用率而没有移植价值。正确边界是
`SidebarThreadNavigation.logic`：Web 键盘控制器与 Lynx 原生 application menu 都调用
同一个 wraparound resolver；Lynx 从已经共享的 project/chat row controller 结果生成
当前可见顺序，`⇧⌘[` / `⇧⌘]` 发送 shell event 后切换到 `/thread/:id`。

实现时必须核对 memory-history 的真实路径，而不能从 Web 的 `/$threadId` 或常见复数路径
猜测；本轮构建前静态核验抓到 `/threads/:id` 错写，并修正为 slice router 的
`/thread/:id`。因此“共享算法 + 平台入口 + 产品路由”三者要作为一个闭环验证。

### P-54 同 server 不等于 renderer persistence 同状态 ✅（P6-C1）

`05-side-by-side` 的同 WS 数据约束只能对齐 server read model，不能自动对齐
`pinnedThreadsStore` 这类 renderer-only persistence。实测 Web 点击 Pin 后立即出现
Pinned section，但 58090 snapshot 在 Lynx 端仍没有相应变化；仅消费
`thread.isPinned` 会漏掉 Web 的 persisted/optimistic overlay。

正确做法是把 thread pin ordering、optimistic merge 与 pinned-parent 去重下沉为
`SidebarThreadPinning.logic`，Lynx 在 storage hydration 后 eager rehydrate 原
`synara:pinned-threads:v1` schema，再把 persisted ids 与 snapshot server flag 合并。
paired capture 应显式把两端 renderer 状态设成同值，取证后恢复；本轮
`shots/2026-07-28/p6-c1-pinned/` 证明两端都显示 Pinned/Simple Greeting，且普通列表
不再重复该 standalone row。

同一规则也适用于 project pin：`SidebarProjectPinning.logic` 保留原
`MAX_PINNED_PROJECTS` cap、server/persisted/optimistic merge 与 pinned-first order；
slice rehydrate `synara:pinned-projects:v1` 后，在 ordinary manual order 上应用同一
稳定置顶顺序。不要只传 `project.isPinned`，否则仍会漏掉 renderer persistence。

### P-55 section state 优先保留已有内容，折叠头聚合子状态 ✅（P6-C1）

Projects 的 loading/error/empty/ready 不能由平台 JSX 各写一套，也不能让 transient
loading/error 覆盖已经存在的 rows。`SidebarProjectsState.logic` 先以 projectCount 或
create-path entry 判定 ready，再处理 loading/error/empty；Web 原 empty-state 回归证明
“已有 project + 尚未 hydrated”必须保持 null/ready。

项目状态由同一个 per-project row controller 对所有 child thread status 聚合。展开时由
child rows 表达，折叠时才在 project header 显示最高优先级 glyph；Lynx 不应继续把
`resolveThreadStatus`/`resolveProjectStatus` 注入为恒 null。

### P-56 完整状态事实留在 background，共享 resolver 输出 bounded presentation ✅（P6-C1）

线程状态不能只靠跨线程 DTO 的 `live/connecting` 两个布尔值重写，否则 Pending Approval、
Awaiting Input、Plan Ready、未读 Completed 及其互斥优先级都会漂移。P6-C1 将 Web 原完整
状态推导下沉为 `SidebarThreadStatus.logic`：session 是否还能回答、latest turn settle、
actionable proposed plan、unseen completion 与 dismissal key 都由同一物理 resolver 处理。
Lynx 在主仓 normalized read model 仍位于 background 时调用它，只把
`SidebarStatusPresentation` 传给 UI，不把大 thread/store 对象跨 snapshot。

renderer-only dismissal 也必须先 hydrate。`fetchSidebarSnapshot` 现在并行读取 server
snapshot 与 Lynx KV，等待 `hydrateStorage()` 后从原 `Sidebar.uiState` schema 读取
`dismissedThreadStatusKeyByThreadId`，再注入 resolver；否则已关闭的最高优先级状态会在
另一 renderer 重新出现。Web 102/102、Lynx 6/6 与双端 production build 验证该边界；
当前真实 snapshot 没有可见状态，因此本刀没有伪造新的 side-by-side 视觉结论。

### P-57 可见行顺序应从已派生 controller 收集，不再重跑 tree/paging ✅（P6-C1）

快捷键 cycle/jump、detail prewarm 与行快捷提示必须看到和 renderer 完全相同的顺序，但不应
为了求 ids 再运行一遍 sort/tree/paging。Web 与 Lynx 都已经有 per-project/chat row
controller；`collectVisibleSidebarThreadIds` 只按 pinned → project rows → surface trailing
rows 收集其 `visibleEntries`，以 insertion-order Set 去重。这样 collapsed active reveal、
paging 和 parent/child 顺序仍只有上游 controller 一个真源。

Web 的 trailing 是 Studio flat tree，Lynx 当前 trailing 是 Chats；平台只选择对应的已派生
collection，不重写合并算法。该 helper 同时驱动 Web prewarm/jump 与 Lynx 原生菜单
previous/next，Web 100/100、Lynx 6/6 和双端 production build 通过。

### P-58 Elements 边界必须 canonical；Web max-width 由 host 投影 ✅（P6-C1）

共享 component 对 host element 的 import 不能写成同目录相对路径。Rspeedy 的平台 alias
契约匹配 `~/components/...Elements`；相对 `./*Elements` 会静默绕过 adapter，Web 与 Lynx
build 仍然通过，但运行时实际绘制的是 Web host。`ComposerColumnFrameSurface` 首轮探针中，
对 Lynx adapter 的多次 CSS 修补都无效，最终由 canonical import 修正暴露了真正边界。

Web 的 `mx-auto w-full max-w-[46rem]` 语义继续留在同一物理 frame source；Lynx Elements
adapter 仅投影宿主布局，以内容区 72%、736px cap 和 `align-self:center` 实现同一 desktop
rail。不要把比例补丁散回页面或 placeholder。最终生产截图为 2560×1576/DPR2，composer
宽 1472 physical px（736 logical px），居中且无裁切；console 无 error/warning。
这类静默 alias 旁路和 max-width 差异必须用实机视觉 probe 判断，不能由 build 通过推断。

### P-59 renderer persistence transition 应共享 target/prune，而非只共享 codec ✅（P6-C1）

两端读同一 `Sidebar.uiState` schema 仍不足以保证导航与折叠行为相同：Settings 返回需要按
remembered route → latest thread → home 的同一优先级挑 target；Project 折叠需要同步清理
该 cwd 的 Show-more page，否则再次展开会保留平台特有的陈旧行数。

把这两类 transition 分别下沉为 `SidebarSettingsBack.logic` 与
`SidebarProjectPaging.logic`。Web 直接消费 portable leaf，`Sidebar.logic` 只兼容
re-export；Lynx router/Sidebar 在真实 Settings back 与 project disclosure state path
调用它们。platform 仍只负责 memory-history push 与 KV write。这样共享的是“下一状态”，
不是只让两端用同名 key 后各写一套 if/else。

### P-60 shared badge 必须接真实 feature query，不能只复用 row slot ✅（P6-C1）

共享 `SidebarPrimaryNavigation` 的 badge slot 只保证结构相同，不会自动带来产品语义。
Pull Requests 行的 review-request 数量、partial-result `+` 标记与 accessible wording
下沉为 `SidebarActionBadges.logic`；Web 直接消费，Lynx 用真实 PR RPC entries 计算精确
viewer-review count 后喂同一 resolver。无数据时两端都返回 null，不造假 badge fixture。

adapter 仅负责 badge host element；count 是否完整、0 是否隐藏、单复数文案属于 shared
presentation。这样可见 row、真实 query 和 bounded model 三层闭合，而不是为了审计只 import
一个未进入 render path 的 helper。

### P-61 segment route 先共享 surface model，再喂同一 action catalog ✅（P6-C1）

即使 Segmented Picker 和 Primary Navigation 都已物理共享，平台若永远给 action catalog
传 `surface="threads"`，切到 Studio 仍会错误显示 Kanban/PR/Automations 五项。
`SidebarSurface.logic.resolveSidebarPrimarySurface` 统一 workspace > studio > threads 的
判定；Web 同时保留 active thread 所属 Studio container 的产品语义，Lynx 当前由 memory
route 映射。

正确验证必须进入非默认 segment。P6-C1 用可逆 initial-route fixture 捕获 Studio：
只显示 `New studio chat` 与 `Search`，active picker 为 Studio；截图后恢复 `/` 并重建最终
production bundle。共享 picker 不等于共享 surface，route-derived model 必须也进入真实
catalog consumer。

### P-62 route surface 必须共享内容 composition，不只共享 picker/catalog ✅（P6-C1）

共享 Segmented Picker 与 primary action catalog 只能保证顶部入口正确；若 route 下方仍
复用 Threads 的 Projects + Chats composition，Studio 仍是结构错误的页面。Studio 的产品
结构是单一扁平会话分区，不含 Projects disclosure，也不再附加独立 Chats section。

P6-C1 将 Web 原 Studio prelude/header/actions/flat rows/empty-state 组合下沉为物理共享
`SidebarStudioSection`，Web 保留 auto-animate 与原 row renderer，Lynx 只提供 host
elements。可逆 `/studio` 初始路由截图同时命中空态，证明 action catalog 下方只出现
`Studio` 与 `No studio chats yet`；随后恢复 `/` 并重建。route model、action catalog 与
content composition 三层都进入真实 consumer，才算 surface 收敛。

### P-63 重复出现在多个 surface 的 section shell 应独立共享 ✅（P6-C1）

Pinned 同时作为 Threads Projects section 与 Studio flat section 的 prelude；若两端各自
保留 `if rows → header → list`，即使 row renderer 已共享，空列表隐藏、标题与行间距仍会
分别漂移。P6-C1 抽出物理 `SidebarPinnedSection`，由同一 source 决定空数组返回 null、
`Pinned` header 与 row list 顺序，Web/Lynx adapter 只映射 host 容器与 spacing。

这是有真实数据契约和既有 paired evidence 的 section composition，不是为了审计新增的
opaque slot wrapper：row 数组与 renderer 都由 consumer 提供，而 section 的 visibility 与
anatomy 归共享层。

### P-64 route-owned footer entry 共享 visibility，不把 active 当隐藏替代品 ✅（P6-C1）

Web 进入 Settings 后会隐藏 Footer 中的 Settings entry，因为左侧已切换为 Settings 导航；
Lynx 原实现却保留一个 active Settings row。两者动作相同并不代表 route composition 相同，
active styling 也不能替代产品定义的隐藏。

P6-C1 以物理 `SidebarSettingsEntry` 统一 `visible → fixed label → activate` 契约，Web
adapter 保留原 menu/button/glyph classes，Lynx adapter 复用已有 primary row host。可逆
`/settings` 初始路由实机证明 footer row 已消失；恢复 `/` 后重建最终 bundle。

### P-65 shared component 内的可替换 primitive 也必须 canonical import ✅（P6-C1）

Elements 边界使用 canonical import 还不够：共享 composition 若对另一个可替换 primitive
使用相对路径，Rspeedy 同样会静默绕过 alias。`SidebarDesktopHeader` 首版相对导入
`./SynaraLogo`，双端测试/构建全绿，但 Lynx 实机标题栏 logo 消失；改为
`~/components/SynaraLogo` 后才命中 Lynx SVG adapter 并恢复绘制。

因此 canonical 规则覆盖 shared→Elements，也覆盖 shared→任何 host-adapted primitive。
此类静默回退必须以有像素的实机分支验证，不能把 production build 当作 adapter 命中证明。

### P-66 平台独占的 footer 附件用具名 slot，不阻碍容器 composition 共享 ✅（P6-C1）

Sidebar footer 的 frame/stack/row 三层是纯结构，但 Web 里同时挂了两个平台独占附件
（DEV-only debug feature-flags 菜单、desktop update 按钮）。若因为这两个附件就把整段
footer 留在 monolith，容器结构会长期双写。

做法是把容器下沉为物理 `SidebarFooterSection`，附件收敛为 `prelude` / `trailing` 两个
具名 slot：Web 原样传入两个附件，Lynx 两个都不传。slot 是**具名且语义固定**的（不是
opaque children 包装），因此容器顺序、间距与 Settings entry 的位置仍由共享源单点决定，
不会退化成"把一切塞进 children 制造复用"。

判据：slot 只能承载已登记的平台能力差异；若两端都会传同类内容，就应继续下沉而不是留 slot。

### P-67 共享容器改变滚动边界时，把原补偿 padding 拆回真正的拥有者 ✅（P6-C1）

Lynx 侧常见的"外层 scroll inner 统一给 padding"是 clean-room 时期的简化。一旦把 Web 的
content frame 共享过来，picker/navigation 会从滚动区外移入滚动区，那份统一 padding 就会
突然作用到它们身上，产生 10px 级横移。

正确做法不是给新成员加负 margin，而是把补偿 padding 拆回真正的拥有者：垂直首距归还给它
前面那个元素的 `margin-bottom`，横距下放到各 section root（与 Web 的 `SidebarGroup`
自带 padding 同构），只把纯尾距留在 scroll inner。拆完后 Lynx 的 padding 归属与 Web 一致，
后续共享 section 时不会再次踩同一个补偿。

验证方式：同窗口、同 server，在改动前后各截一张图逐锚点比对 y 值，delta 必须为 0；
不要只看"页面还在渲染"。

## 实例记录

- 2026-07-27 P0-S4：P-02 标记 ✅（spikes/p0-s4/results.jsonl：jsInstances=150 全量 eager、effects=150 vs attachedCells=9、throttle 200→16ms 事件 1→10、eventSource 语义实测）。另产出 P-07。
- 2026-07-27 P0-S2：WS 三路径实测（spikes/p0-s2/README.md）：LynxWebSocketModule + GlobalEventEmitter 事件名 websocketOpen/Message/Closed/Failed（按 socketID 过滤）；主→UI 推送 = LynxWindow.sendGlobalEvent；UI→主 = NativeModules.bridge.call；preload 注入模块（NativeModules.nodejs）回调可流式重复触发。
- 2026-07-27 P2-V2：P-10 标记 ✅；storage / net.socket / clipboard 自测全绿，dialogs 三 API 存在且 confirm 返回 true；证据 `shots/2026-07-27/p2-v2/ports-final.png`。
- 2026-07-27 P2-V3：P-11 标记 ✅；Button/Dialog/Input 走 lynx-ui，Menu/Tooltip 因 Desktop Popover 阴性走首切片 view fallback；证据 `shots/2026-07-27/p2-v3/dialog.png`。
- 2026-07-27 P2-V6：P-14 标记 ✅；真实 Synara bootstrap/feature WS、snapshot 与两条真实消息实机通过；证据 `shots/2026-07-27/p2-v6/{threads-real,transcript-real}.png`。
- 2026-07-27 P3-E1：P-15 标记 ✅；native textarea + real-thread/path/skill/command suggestions 与 shadow chips 实机通过；证据 `shots/2026-07-27/p3-e1/{composer-empty,composer-chips}.png`。
- 2026-07-27 P3-E2：P-16 标记 ✅；设置页通过 eager dynamic import 跨 UI/background 边界，真实 host KV hydration/persist 与生产 bundle 实机通过；证据 `shots/2026-07-27/p3-e2/settings.png`。
- 2026-07-27 P3-E3：P-17 标记 ✅；真实 project/thread snapshot 经纯 projection 驱动 Lynx 原生 Sidebar；证据 `shots/2026-07-27/p3-e3/sidebar.png`。
- 2026-07-27 P3-E4：P-18 标记 ✅；三列 Kanban 从固定宽 horizontal scroll-view 改为等分 flex，消除首屏横移；证据 `shots/2026-07-27/p3-e4/kanban.png`。

- 2026-07-27 P4-X1：P-19 标记 ✅；single-instance deep link 经 GlobalEventEmitter 驱动 memory history，窗口状态文件与壳日志实机生成；证据 `shots/2026-07-27/p4-x1/deep-link-settings.png`。
- 2026-07-27 P4-X2：P-20 标记 ✅；只读 GitHub release 检查与固定官方下载页实机通过，不下载/安装；证据 `shots/2026-07-27/p4-x2/update-check.png`。
- 2026-07-27 P4-X3：P-21 标记 ✅；最终 arm64 DMG 校验/挂载通过，受控开启生产 DevTool 后内置 file bundle 实机通过；证据 `shots/2026-07-27/p4-x3/packaged-smoke.png`。
- 2026-07-27 P5-R1：P-22 标记 ✅；六屏 305–586 模块图与逐模块分类生成，`--check` 闭合，当前 physical-source reuse 全部 0%；证据 `plan/reports/p5-r1-reuse-baseline.{md,json}`。
- 2026-07-27 P5-R2：P-23 标记 ✅；同一主仓 SettingsSection source 经单个 host-element adapter 同时通过 Web/Rspeedy build 与 Lynxtron 实机；证据 `slice/docs/p5-r2-compiler-probe.md`。
- 2026-07-27 P5-R3：P-24 标记 ✅；七类 canonical UI import 精确映射，unchanged Web DebouncedSettingTextInput 经 Input adapter 实机；证据 `slice/docs/p5-r3-ui-primitive-contract.md`。
- 2026-07-27 P5-R4/P6-C1：P-25 标记 ✅；production graph resolver 修正后当前六屏 2,256 utility token manifest、98.03% eligible weighted coverage、physical-shared runtime emission 与三重 ratchet；证据 `slice/docs/p5-r4-style-pipeline.md`。
- 2026-07-27 P5-R5：P-26/P-27 标记 ✅；真实 Settings Behavior panel source gate=75%，双尺寸最大 anchor delta=1.75px；证据 `slice/docs/p5-r5-fidelity-gate.md`。

### P-07 后台线程网络 API 命名空间 ✅（P0-S2 实测）

`fetch`/`EventSource` 挂在 `lynx.*`（`lynx.fetch` ✅、`lynx.EventSource` 存在但 0.0.7 消息不派发），`globalThis.fetch/WebSocket` 均 undefined；WS 用 `@lynx-js/websocket`（内部即 LynxWebSocketModule）。库代码若直接引用全局 fetch/WebSocket 需在 L1 port 收口。

### P-68 平台 port 必须双线程可导入，否则整片共享图无法进 compiler ✅（P6-C1）

单个 Lynx 页面可以用 `'background only'` 函数 + `webpackMode: "eager"` 动态 import 绕开
background-only 边界（P-16）。但共享 Web 图是**静态** import 到达 port 的，一旦 port 模块
自身带模块级 `import 'background-only'`，任何拉到它的 screen 在 main-thread 编译期直接失败
（`'background-only' cannot be imported from a main-thread module`）。

正确形状：port 模块本身无线程标记 → 同步状态（mirror/cache）对两端可读 → 所有 host bridge
调用收进 `'background only'` 函数并 eager 动态 import → 用 `__MAIN_THREAD__` 判定线程，
main thread 静默跳过副作用（它不拥有应用状态）。同时必须补齐 Web port 的全部导出，
平台没有的生命周期钩子用同签名显式空实现并写明理由，不要让共享调用点改写。

效果量级：解开这一条后，Threads 屏一刀从 25.40% 涨到 27.90%（此前每刀约 +0.05pt）。
结论：先修边界，再谈复用率；在边界没打通前继续切 composition 是低效的。

### P-69 大型 transcript 聚合图编译失败时，从真实 Web row anatomy 下切 ✅（P6-C2）

`MessagesTimeline.tsx` 整树包含 tool/status、attachments、actions 与 route 状态，直接进入
PrimJS main-thread compiler 会在生成 bytecode 时触发 regex escape 错误；但 action chrome
子图可独立编译。此时共享边界应落在真实 row anatomy，而不是退回 slice 自绘 bubble：

1. 在 Web 真源内抽 `MessageRowComposition`，由它拥有 user/assistant 的可见性、嵌套、
   右对齐、80% column、bubble placement 与 assistant borderless body；
2. Web `MessagesTimeline` 必须先改为产品消费该文件，证明不是 Lynx-only helper；
3. Lynx 只 alias `MessageRowCompositionElements` 到 `<view>` host elements，`<list>` 与
   Markdown renderer 继续作为已登记平台岛；
4. 删除 slice 的角色标签、assistant card border/background 与重复 bubble geometry；
5. probe 与 router 临时 import 用完删除，实机像素确认 canonical Elements alias 真命中。

这种下切保留 Web 的真实 anatomy，并把失败范围缩到后续可继续二分的 tool/status/attachment
图；不能用 opaque `children` frame 把任意页面包一层冒充共享。

### P-70 在 background 生成 Web timeline discriminant，main thread 只渲染共享 row composition ✅（P6-C2）

聊天记录不能只从 snapshot 取 `messages`：Web 的真实时间线还把 `activities`、
`proposedPlans` 与 `latestTurn` 投影为 standalone work、message-leading/inline work、
settled collapsed turn、working header 与 plan 等 row discriminant。若 slice facade 提前把
snapshot 截成 messages，后续无论样式多像都会静默丢掉真实工具/状态消息。

正确边界：

1. background facade 保留完整 thread read model；
2. 直接运行 Web 的 `deriveWorkLogEntries` → `deriveTimelineEntries` →
   `deriveMessagesTimelineRows`，只把可序列化 row union 送到 main thread；
3. main thread 不重写排序/归组规则，只根据 discriminant 调用物理共享的
   `MessageRowComposition` / `TimelineStatusRowComposition`；
4. `<list>`、Markdown renderer 与 disclosure 的 Lynx 事件内核仍是平台岛；
5. assistant message 必须同时消费 standalone、leading、inline、collapsed placements；
   只处理 `row.kind === "work"` 会漏掉 settled turn 的真实活动；
6. 共享 projection 中的新式 prototype API 仍要按 P-34 做 PrimJS 审计，本刀将三处
   `toSorted` 改为等价不可变 spread+sort。

验证不能靠 fixture：本刀对同一 58090 snapshot 做只读检查，选中的真实 thread 含 2 条
message + 6 条 activity；Lynx 默认画出 `Details`，DevTool touch 打开后画出 server 原始
runtime warning，console clean。该模式把产品数据规则留在 Web 真源，又避免把
`MessagesTimeline.tsx` 的整棵 DOM/attachment/action 图塞进 PrimJS。

### P-71 页面状态用纯 resolver 选择共享 composition，host adapter 不拥有文案 ✅（P6-C2）

loading/offline/error/empty 不应成为平台页面各自维护的四套 JSX。先用无副作用 resolver
把 query 的 pending/error/data 压成 bounded discriminant，再由页面选择 Web 产品已消费的
`ChatEmptyStateHero` / `PanelStateMessage`；共享 source 持有 visibility、顺序、文案与
anatomy，Web/Lynx Elements 仅投影 host element 和布局。

网络错误与普通数据错误必须分支：failed fetch/network/socket/WebSocket failure 显示明确
offline copy，其他异常显示 generic error；成功且 0 rows 才进入 empty，已有 transcript
不能被 transient state 静默覆盖。resolver 用纯测试锁定优先级，实机分别验证产品 empty
route 与临时 offline renderer probe。

本刀也再次证明 P-58：`ChatEmptyStateHero` 首版相对 import Elements 时双端 production
均为 green，但 Lynx DOM 文本 box 是 0×0、页面无 hero 像素；改为 canonical
`~/components/...Elements` 后同一产品 route 立即绘制。阴性/修复帧保留在
`shots/2026-07-29/port/p6-c2/thread-states/`，不能只凭 build 判定 adapter 命中。

### P-72 background 无 timer/observer 通知时，用 host delay + local snapshot state ✅（P6-C2）

真实 provider turn 暴露了两个只在 runtime 出现的限制：ReactLynx background 的
`globalThis.setInterval/setTimeout` 均不存在；即使手动完成 React Query `refetch()`，
mounted observer 也不会据此重渲染。build、focused test 和静态 snapshot 都无法发现它们。

稳定形状是：

1. desktop main process 提供 clamped `timerSleep` delayed reply，background 不伪造全局 timer；
2. component effect 运行单飞 `await fetch → await host sleep` 循环，以 cancel flag 结束；
3. transcript 与 header 从同一次 real snapshot 更新 local state，避免标题/正文不同步；
4. route 以 thread id 作 key，deep-link 切换时强制重建 polling lifecycle；
5. background query 以 `snapshotSequence` 缓存并复用 unchanged row/summary 引用，避免每
   500 ms 对相同 read model 重跑 store sync 与 KV persistence；
6. host sleep bridge 的高频日志默认静默，但真实错误继续上报。

该模式不是通用数据层替代：Web 继续使用既有 React Query；只在已经实测缺 timer 与
observer notification 的 Lynx background adapter 内使用。真实 running/completed paired
证据在 `shots/2026-07-29/port/p6-c2/real-streaming/notes.md`。

### P-73 Composer 先共享 chrome region，编辑器内核保持最小平台 island ✅（P6-C3）

Web Composer 的 Lexical node/store/menu 图不能作为“共享程度更高”的理由整体塞进 PrimJS；
此前 production 实机已证明完整 composer store graph 会越过模板加载边界。相反，也不能让
Lynx textarea 页面继续自行维护 border、padding、footer nesting。

可运行的第一条边界是：

1. Web 产品先消费 `ComposerInputSurfaceComposition` /
   `ComposerEditorRegionComposition` / `ComposerFooterRowComposition`；
2. shared source 拥有 shell→surface wrapper nesting，以及 editor/footer region 顺序；
3. Web Elements 单点消费 `composerPickerStyles` 的 canonical tokens；Lynx Elements 只映射
   `<view>` 与少量平台 class；
4. Lexical 与 native `<textarea>` 都只是 editor region 的 kernel content，不进入 shared
   composition；
5. 用短命 probe 验证 canonical Elements alias 后，必须接产品并删除 probe；
6. 现存 Lynx suggestion/meta/Clear 不能因外壳共享而被视为完成，后续必须由真实
   attachment/mention/command/footer state 替换。

本刀 compiler probe 1808.3 kB，最终产品接入 1810.9 kB Lynx / 1926.5 kB desktop，
未拉入 Lexical/store 大图；
Web focused 4/4、slice broad 33/33，实机 thread route pixels 与 console clean。证据见
`shots/2026-07-29/port/p6-c3/composer-chrome/notes.md`。

### P-74 编辑器是 island，不代表 token 语义也要 fork ✅（P6-C3）

Lexical 与 native textarea 必须分平台，但 prompt 中哪些字符构成 mention、skill、slash
command、link、agent mention、terminal context，以及 chip label 如何格式化，属于产品语义，
不应由 Lynx 维护正则子集。

P6-C3 用 compiler probe 证明 Web `splitPromptIntoComposerSegments` 与 label helpers 可直接
进入 PrimJS（1815.3kB），随后让产品 Composer 消费并删除 `composerAst.lynx.ts`、三条
重复测试、router 常驻的 `router.tsx/check-code/automation` suggestion 数据。最终 bundle
1820.0kB Lynx / 1935.6kB desktop；Web canonical focused 55/55、slice 30/30、实机 pixels
与 console clean。

审计解释必须诚实：slice router 当前静态包含 Composer，因而这条真实 import 让所有 screen
graph 的 reuse 同时上升。它不是 probe/type-only 假共享，但也不能被解释为 settings/
projects/PR 视觉完成度提升；P6-C6 要将 route-graph diffusion 单列或收敛。证据见
`shots/2026-07-29/port/p6-c3/canonical-segments/notes.md`。

### P-75 区分产品 native wrapper 与 raw Effect-RPC payload；Stop 只服从权威 session state ✅（P6-C3）

Web `wsNativeApi.orchestration.dispatch` 的调用形状是 `{ command }`，但那是产品 wrapper：
它在 Web 客户端内先解包，再把 **command 本身**送进 Effect-RPC。Lynx 若直接调用 raw
Effect-RPC 仍照抄 wrapper 形状，双端 build/test 都可通过，运行时却不会产生 orchestration
event。

稳定边界：

1. transport adapter 明确自己位于 wrapper 之前还是之后；raw RPC dispatch 只发送 command；
2. `thread.turn.start` 被 server 接受后才清 draft，任何 dispatch failure 都保留 draft并给出
   可恢复错误；
3. primary action 只由权威 session state 决定：`starting` 是 disabled Connecting，
   `running` 才是 Stop；
4. interrupt command 在 server 暴露时携带 `activeTurnId`，没有 active turn 时不伪装成
   可停止；
5. 一旦 provider delivery 对 thread 进入 terminal failure/quarantine，后续验证必须创建
   干净 thread，不能把“command 被 server 主动跳过”误判成 UI 或 transport failure；
6. 真实放行证据至少同时包含 `turn-start-requested`、带 active turn 的 `running`、
   `turn-interrupt-requested`、`ready` 与 `turn.completed(state=interrupted)`。

本刀最终 clean thread 的 paired running 事件为 100 前的 live turn，Stop 后 sequence
100/102/103 分别证明 interrupt / ready / interrupted。Web 与 Lynx 同时显示方形 Stop，
而非用静态 fixture 冒充。证据见
`shots/2026-07-29/port/p6-c3/footer-send-stop/notes.md`。

### P-76 底部工具栏菜单共享状态机，host adapter 负责向上锚定与能力缺失文案 ✅（P6-C3）

Composer extras 与权限控制的 visibility、顺序、当前选中项属于产品 anatomy，不能用
opaque slot 把两套菜单包成“共享”。稳定边界是：

1. shared composition 直接拥有 Add image→separator→Plan→可选 Fast，以及
   Full access→Default permissions 的实际条件分支、顺序和 indicator；
2. Web Elements 保留 hidden image input 和 canonical Menu，Lynx Elements 只映射
   trigger/popup/item/glyph host；
3. 平台没有真实 capability 时保留同一位置并明确 disabled/unavailable，不绑定空 tap，
   也不伪造成功状态；当前 Lynx attachment 与 Fast 均遵守此规则；
4. 底部 Composer popup 的方向是 host geometry：Lynx adapter 以 `bottom: 100%` 向上锚定，
   不能让共享产品源携带平台专用定位补丁；
5. Elements 与 primitive 必须使用 canonical import。相对 menu import 虽能 build，却会
   绕过 alias；本刀 bundle 从 2000.1kB 回落到 1834.2kB 的变化是前置信号；
6. mode command 的 SQLite projection + reopened check 只证明 UI/server selected-state
   闭环。若 provider cwd/session 不存在，delivery failure 必须单列，不能冒充 live provider
   permission transition。

最终 product 为 1842.4kB Lynx / 1958.0kB desktop，Web focused 7/7、slice broad
35/35、ReactLynx scan 0；DevTool 捕获 Plan 与 Default permissions 选中态且 console
error/warning 为空。证据见
`shots/2026-07-29/port/p6-c3/composer-toolbar/notes.md`。

### P-77 原子 paste 与大文本逐步输入必须分流；附件类别顺序留在共享真源 ✅（P6-C3）

Composer reference row 不能由 Lynx 根据“当前支持什么”自行排列。稳定边界是：

1. Web 产品先消费 physical-shared `ComposerReferenceAttachmentsComposition`；
2. shared source 直接拥有 assistant selection → file comment → pasted text → file → image
   的 visibility/order，Elements 只负责各平台 card host；
3. Lynx 尚无真实 capability 的类别传空数组，不用 fixture 或 disabled fake card 冒充；
4. native textarea 的前后值只解析单个 insertion。只有这段 insertion 达到 Web
   `shouldCollapsePastedText` 阈值才生成 `PastedTextDraft`；
5. 通过多次小 input 累积到 4000 字不能折叠，否则普通输入法和自动化 typing 会被误判；
6. 程序化回写只调用一次 `setValue`。附件 collapse/clear/show 不依赖紧邻的
   `setSelectionRange`，连续 native invoke 会增加 Lynx bridge 高频告警风险；
7. Computer Use 的 `type_text` 是 incremental edits，不是 native paste。若验证工具不能在
   不覆盖用户剪贴板时产生原子事件，应保留阴性证据并用 focused logic/store tests 证明
   判定，而不是加产品 debug hook 或 fixture 冒充 runtime interaction。

本刀 Web focused 23/23、slice broad 40/40；Web production 8,857 modules；slice
1868.7kB Lynx / 1984.4kB desktop。实机逐步输入正确不生成 card，最终
error/warning console 为空；runtime 边界与清理记录见
`shots/2026-07-29/port/p6-c3/composer-reference/notes.md`。

### P-78 完整 picker 编译成功仍须按 bundle 图缩边界；Web primitive 保留原事件 authority ✅（P6-C3）

模型选择同时包含产品 anatomy 与平台 primitive 语义。直接把完整
`ComposerModelEffortPicker` 放进 PrimJS 虽能 build，却会连带 traits、provider discovery、
tooltip/Base UI 和 store 图；本刀从 1868.7kB 涨到 2678.2kB，是错误边界而不是“复用更多”。

稳定形状是：

1. shared trigger composition 拥有 provider icon → model label → optional fast/status →
   chevron 的实际条件和顺序；
2. shared option-list composition 拥有 group visibility/order/label/disclosure、row order、
   active state、cost/favorite visibility 与 selection intent；
3. Elements 使用 canonical import，Web host 保留 `MenuRadioGroup.onValueChange` 作为
   鼠标/键盘 selection authority，row click 只保留原 after-selection 行为；
4. Lynx 没有 radio-group primitive，host adapter 才把 native tap 映射到同一个 shared
   selection intent；不要为了表面同构把 Web 的 keyboard path 改成 row `onClick`；
5. draft model selection 是 next-turn state，不应立即发送 server command；真实
   `thread.turn.start` 消费它，成功发送只清内容、不清 selection；
6. static catalog 可为 unknown current model 临时 prepend，避免当前 server selection
   静默消失，但这不等于 runtime discovery。换离 unknown model 后无法选回必须登记为缺口。

最终边界为 1896.1kB，比完整 picker probe 小 782.1kB。实机从 GPT-5.6 Terra 选择 GPT-5.5，
trigger 即时更新，重开 check 保留，console clean；证据与 discovery 缺口见
`shots/2026-07-30/port/p6-c3/composer-model/notes.md`。

### P-79 共享命令菜单 anatomy，但只暴露 host 已有真实 action 的 capability subset ✅（P6-C3）

Web command menu 不是普通字符串补全：Lexical controller 保存 trigger range 与 expected
text，selection 会原子替换文本并可能写入 structured mention/model/skill state。Lynx
textarea 若只复制所有可见行并清 prompt，会制造“看起来可点、实际语义丢失”的假功能。

稳定边界是：

1. shared composition 直接拥有 built-in → provider → skills 以及
   plugins → chats → local → subagents 的分组顺序、labels、row title/meta、active、
   loading/empty 和 mention Files footer；
2. Web Elements 保留 canonical `Command` primitive、DOM item refs、mouse highlight、
   prevent-blur 与 click selection；row 继续 memo，不能为 Lynx tap 改写 Web 事件 authority；
3. Lynx 用 Web `detectComposerTrigger` 读取真实 selectionStart，用 Web
   `replaceTextRange` 完成 replacement；只有存在真实 host transition 的命令才进入 menu；
4. Plan/Default dispatch 真实 `thread.interaction-mode.set`，Subagents 插入 canonical
   delegation prompt；Clear/Model/Status/provider/skill/mention 等未接能力不显示，不绑定空 tap；
5. 完整 `ComposerCommandMenu` probe 虽通过但达 2087.2kB；缩到 composition + canonical
   Elements 后 probe 1912.1kB、最终产品 1923.5kB，短命 probe/router import 必须删除；
6. runtime 至少验证 trigger、filter、tap、prompt clear、server projection 与可逆恢复；
   单独 Lynx 截图仍只算增量回归，不代替最终双尺寸 paired gate。

本刀 `/` 展示 Plan/Default/Subagents，`/pl` 只剩 Plan；tap 后 SQLite 投影为 `plan`，
再经 `/def` 恢复 `default`，最终 console error/warning 为空。证据见
`shots/2026-07-30/port/p6-c3/composer-command/notes.md`。

### P-80 Structured mention 必须贯穿候选、原子 replacement、draft 与 dispatch ✅（P6-C3）

thread mention 不能只把 `@title` 画成 chip；服务端需要稳定的
`ProviderMentionReference { name, path }` 才能保留引用语义。稳定边界是：

1. 从 Web 抽出纯 `ComposerThreadMentionItems`，同一物理源负责 title/container
   disambiguation、recency ranking、current/archived exclusion、20-item limit 与
   `thread://` path；
2. Lynx 只把真实 sidebar snapshot 映射为候选；plugin/path/skill 等未接能力仍不显示；
3. selection 复用 Web trigger range、leading/trailing-space 和
   `formatComposerMentionToken`，一次替换文本并写入 draft mentions；
4. prompt 编辑后用 Web reference filter 移除已删除 token 的悬空引用；
5. `thread.turn.start` 只有 mentions 非空时才带 `message.mentions`，成功发送后与 prompt
   一起清空，model selection 继续保留；
6. native `setValue` 会异步触发 `bindinput`，必须用一次性 pending-value guard 抑制这次
   程序化事件，否则选中后菜单会被完整 token 重新打开；
7. Lynx 与 desktop bundle 必须成对重建。只跑 `rspeedy build --environment lynx` 后再
   启动 `dist/desktop` 会读取旧 `main.lynx.bundle`，由此得到的 runtime 阴性结论无效。

本刀实机从同 snapshot 的 Chats 候选选择 `READY-LYNX-COMPOSER`，生成 chip 并关闭菜单；
用户授权后的 quarantined-thread 投影写入
`mentions_json=[{"name":"READY-LYNX-COMPOSER","path":"thread://a861…"}]`，provider
按预期跳过，不冒充 live delivery。证据见
`shots/2026-07-30/port/p6-c3/composer-thread-mention/notes.md`。

### P-81 Native textarea 吞键或 tap blur 覆盖 focus 时，三分支止损并登记 hard gap ✅（P6-C3）

Lynxtron 0.0.7 PC native textarea 的编译能力不能推导出桌面事件能力。本刀运行时证明：

1. `catchkeydown`、浏览器/PC key aliases、`global-bindkeydown` 都收不到 textarea 已消费的
   Arrow/Enter/Escape；临时可见诊断也没有变化；
2. Web highlight transition 即使可抽成 shared pure helper，没有 host event source 也不构成
   产品复用；因此 helper、tests 和 Lynx handlers 必须全部回滚，Web 保留原 keyboard authority；
3. slash row tap 后，sync、next-tick 和 50ms `setFocus` 都被 native tap-ending blur 覆盖，
   AX focus 稳定落到 Lynx container；这不是多加一个 timeout 可可靠修复的产品路径；
4. 同一能力连续三个真实 runtime 分支失败后停止试错，保留 screenshot/AX/console 阴性证据，
   不把无效 handler、timer 或 debug UI 留进产品；
5. 只有 Lynxtron/native textarea 新增可证明的 key dispatch 或 post-tap focus API 后才重开该
   路径。当前 tap selection 与原子 replacement 继续可用，keyboard/自动 focus 明示为 gap。

证据见 `shots/2026-07-30/port/p6-c3/composer-focus/notes.md`。

### P-82 Discovery RPC 留在 background host，main-thread composition 只接序列化 catalog ✅（P6-C3）

动态模型不能从 main-thread picker 直接 import `background-only` transport。compiler-first
分支会明确报 `background-only cannot be imported from a main-thread module`；正确边界是：

1. background Composer host 用当前 thread provider + project workspace root 调既有
   Effect-RPC `provider.listModels`，保持 Web/desktop 相同 server discovery authority；
2. 只把 `ProviderModelDescriptor[]` 与 loading state 传给 main-thread model control；
3. option 合并直接消费 Web `mergeDynamicModelOptions`，group/row 继续使用共享 composition，
   不在 slice 复制 provider-specific normalization、runtime-owned catalog 或 upstream grouping；
4. discovery 为空/失败时回退 static catalog；当前 server selection 未返回时 prepend，避免
   active value 静默消失；
5. runtime 正向证据必须包含 static source 中不存在的 discovered model，并验证 selection
   回到 draft trigger。只看到与 static 重叠的列表不足以证明 RPC 命中。

本刀 Codex runtime 返回 static source 不含的 GPT-5.6 Luna，tap 后 trigger 即时更新；证据见
`shots/2026-07-30/port/p6-c3/composer-dynamic-models/notes.md`。provider switching 与
reasoning/traits/favorites 仍是后续边界。

### P-83 Provider switch 共享 visibility/availability controller，submenu 事件仍归 host primitive ✅（P6-C3）

Provider picker 的稳定跨端边界不是 DOM `MenuSub` 本身，而是决定“哪些 provider 以什么
顺序、状态和文案出现”的产品规则：

1. 从 Web 抽 physical-shared `ComposerProviderPickerItems`，统一 canonical labels/order、
   hidden filtering、active provider protection、`Checking`/`Sign in`/`Unavailable` 与
   coming-soon 状态；Web 原 picker 必须反向消费，不能只给 Lynx 用；
2. Web 保留 nested `MenuSub`、radio group、hover/keyboard 与 focus restore authority；
   Lynx 用 native provider→model 两级 tap，但不能绕过 shared disabled state；
3. availability 必须来自 real `server.getConfig.providers`，不能仅凭 checked-in provider
   metadata 把未认证或不可用 provider 画成可选；
4. browse provider 时先查询该 provider 的 runtime catalog，只有选择具体 model 才提交
   `{provider, model}` 到 draft；tap provider 本身不能提前写入一个可能无效的 static model；
5. runtime 至少验证一个 disabled auth state、一个 unavailable state，以及跨 provider 的
   dynamic model commit；不发送 turn也可证明 draft transition，但不能冒充 provider delivery。

本刀实机展示 Cursor `Sign in`、四个 `Unavailable` provider，并完成 Codex GPT-5.6 Terra →
Claude Fable 5 draft switch。证据见
`shots/2026-07-30/port/p6-c3/composer-provider-switch/notes.md`。

### P-84 Runtime trait 是 ModelSelection 的一部分，不是独立 ProviderStartOptions ✅（P6-C3）

模型 trait 的可移植边界必须同时覆盖 runtime descriptor、draft equality、产品 anatomy 与
最终 dispatch，不能只画一组 radio：

1. descriptor 是 capability 与选项顺序的权威来源；shared
   `getComposerTraitSelection` 解析 provider-specific primary trait，slice 不复制 Codex
   effort ladder；
2. shared `ComposerTraitRadioSectionComposition` 拥有 section/row 的真实 label、order、
   active/default/description anatomy，Web 原 `TraitsPicker` 反向消费；canonical Elements
   只替换 Menu/Tooltip 与 native view/text primitive；
3. trait value 必须写入 `ModelSelection.options`，draft equality 必须比较 options。
   `ProviderStartOptions` 是 provider 启动配置，不能承载每次 turn 的模型 trait；
4. snapshot projection 与 `thread.turn.start` 都必须保留完整 `ModelSelection`。只有
   SQLite turn-start options 与真实 provider response 同时成立，才算 delivery proof；
5. fast/thinking/context 等后续 trait 只有在真实 descriptor 声明且对应 provider adapter
   实际读取该 option key 时才展示。菜单像素或静态 metadata 不能替代能力证明。

本刀在 Codex GPT-5.6 Terra 选择 High，SQLite seq 120 精确包含
`options.reasoningEffort=high`，真实 provider seq 135/136 返回 `TRAIT-HIGH-OK`。旧
quarantined thread 仅证明 projection，不计 delivery。证据见
`shots/2026-07-30/port/p6-c3/composer-traits/notes.md`。

### P-85 Fast Mode 需 descriptor、共享入口与 adapter service tier 三点同时成立 ✅（P6-C3）

Fast 不是固定模型名单或纯 UI preference；正向能力链是：

1. runtime discovery 必须明确广告 Fast tier，并由既有 normalizer 投影为
   `supportsFastMode`/boolean descriptor；不能因 provider/model 名称猜测；
2. shared trait section 拥有 Effort header 内 compact toggle 的真实位置和显隐。Web 原
   私有 `FastModeToggle` 必须反向迁入 canonical Elements；有 Effort 时 toggle 后菜单保持
   开启，真正 fast-only model 才用 standalone Speed radio；
3. model picker 与 Extras 两个产品入口都写同一 `ModelSelection.options.fastMode`，draft
   equality、trigger badge 与 turn-start 随之更新；
4. provider adapter 必须实际消费这个 key。Codex 映射为 `serviceTier: "fast"`；只有
   turn-start payload 与真实 provider response 同时成立才算放行。

本刀 Terra runtime 广告 `additionalSpeedTiers:["fast"]`，native toggle 后 SQLite seq 148
精确含 `fastMode:true`，真实 Codex seq 159/160 返回 `FAST-MODE-OK`。证据见
`shots/2026-07-30/port/p6-c3/composer-fast/notes.md`。

### P-86 Favourite 是跨端 app-local 状态；共享规则、key 与 grouping，host 只替换 storage/tap ✅（P6-C3）

模型 favourite 不属于 `ModelSelection.options`，也不应发送给 provider。稳定边界是：

1. 把 provider support、canonical storage keys、normalize/parse/toggle 抽成无副作用
   `modelFavorites.logic.ts`，Web 原 storage wrapper 与 picker 反向消费；
2. favourite set 必须进入既有 `groupProviderModelOptionsWithFavorites`，由 shared option
   composition 决定 `Favourites` 分组、顺序、filled/empty state；Lynx 不复制排序；
3. host adapter 只实现 storage mirror 与嵌套 star tap。tap 必须阻止 model-row selection，
   保持 submenu 打开且 active draft model 不变；
4. 正向证明同时要求 canonical KV 精确值、即时 regroup，以及完整客户端重启后的 hydration。
   单次 filled-star 截图不足以证明持久化。

本刀在真实 OpenCode catalog 将 `North Mini Code Free` 写入
`synara:opencode-favourite-models:v1`，即时进入 `Favourites`；active Codex trigger 未变。
重启 Lynx 后同一 group/star 自动恢复。证据见
`shots/2026-07-30/port/p6-c3/composer-favorites/notes.md`。

### P-87 Server transcription 已存在不等于 native voice 可用；录音/权限桥缺失时不画假 mic 🔀（P6-C3）

Voice 必须拆成 capture 与 transcription 两段审计：

1. Web 已有 `voiceRecorder.ts` 的 `getUserMedia` + `AudioContext` WAV capture、
   `useComposerVoiceController` 状态机，以及 `server.transcribeVoice` 到 Codex adapter 的
   transcription pipeline；
2. Lynxtron 0.0.7 native Lynx surface 不提供 browser recorder primitives，slice main
   process 也没有 microphone permission、PCM/WAV capture 或 audio transport bridge；
3. 因此 server RPC 可以复用但不能凭空产生音频。只共享 mic/recorder bar anatomy会制造
   可点击但不可工作的能力，违反 capability honesty；
4. 一期保持 mic 不显示并在 compat matrix 登记 unavailable。只有 native bridge 能证明
   permission→capture→WAV→RPC→transcript 全链后，才接 Web controller/state anatomy。

### P-88 Bottom-anchored Composer 应按 content inset 对齐，并逐层映射 editor/footer 几何 ✅（P6-C3）

DevTool 截图不含 Lynxtron 32px native titlebar，不能把整张图的绝对 y 直接与浏览器比较：

1. 先对齐 resizable sidebar，再比较 Composer left/width/height、editor text box、footer
   height 和 application content bottom inset；
2. 首帧暴露 Lynx 128px surface 对 Web 95px。最小 native mapping 将 editor padding 设为
   `12px 14px 8px 12px`、textarea 设为 `39px @ 12px/19.5px`、footer padding 设为
   `0 8px 6px 6px`；
3. 1280×820 与 1440×900 retained pair 均得到 736×95 shell、708×39 editor、34px
   footer；left delta 1.81px、bottom-inset delta 4px，全部落在视觉门禁内；
4. native titlebar 与无假 mic 导致的 control slot 必须分别登记；header 还必须按
   icon→title 同一 anatomy 比较，不能把一端 title 起点与另一端 icon 起点做假差值。
   本组 like-for-like header delta 约 2px。证据见
   `shots/2026-07-30/port/p6-c3/composer-paired/notes.md`。

### P-89 Shared taxonomy composition 要同时拆纯 resolver、canonical Elements 与 availability ✅（P6-C4）

Settings navigation 既不能整棵 DOM sidebar 生搬，也不能只复制 label 数组：

1. shared composition 必须拥有 group/item 顺序、active 与 availability；Web 原
   `SettingsSidebarNav` 反向消费，Lynx 对未实现 panel 显式 disabled；
2. taxonomy resolver 单独放 `.logic.ts`。若与 TSX 同文件，slice Rstest 会无意义拉入
   Lynx JSX runtime，纯状态测试失去 host-neutral 性；
3. Elements import 必须是 canonical alias，并在 Rspeedy config 显式注册。首轮 alias
   缺失时 build 绿但 runtime 落回 Web `nav/h2/button/span`，出现空白 row；
4. native 没有 CentralIcon mask adapter 时保留同宽 leading slot，不画假 glyph，并在
   compat 登记。证据见
   `shots/2026-07-30/port/p6-c4/settings-navigation/notes.md`。

### P-90 Shared header 不能只共享 copy；host 状态必须复刻 action availability ✅（P6-C4）

把 title、description、button JSX 抽成同源 composition 后，平台仍可能在状态投影处制造
行为漂移：

1. shared source 持有 copy/title/description/restore 的固定 anatomy，并从 canonical
   settings taxonomy 解析 copy；Web 原 route 必须反向消费；
2. host 只计算是否存在 changed values。Web 可沿用 changed-setting labels；Lynx 在
   canonical storage 接入前至少必须比较 hydration 与每个 current/default field；
3. 实机首帧若 values 全为 default 而 Restore 仍可用，不能以“shared component 已绘制”
   放行。修正状态投影、重建、重新捕获，才得到 disabled final frame；
4. 单张 native frame 只证明 runtime 回归，不冒充整屏 paired gate。证据见
   `shots/2026-07-30/port/p6-c4/settings-panel-header/notes.md`。

### P-91 Canonical partial settings projection 必须 preserve unknown fields；control trigger 要查真实 children ✅（P6-C4）

Settings General 同时涉及大 schema、server-owned 字段和平台控件，不能把整个
`appSettings.ts` 副作用图塞进 main-thread，也不能另造 native schema：

1. 把 storage key、General defaults、decode/merge 放进 side-effect-free `.logic.ts`；
   写入 canonical `synara:app-settings:v1` 时先解析原 record，再覆盖 General fields，
   保留 chat typography/provider 等其它字段；
2. `defaultThreadEnvMode` 属于 server settings：hydrate 时 server view 覆盖 local fallback，
   mutation 同时发 `server.updateSettings`；server offline 时 local write 仍落盘且 rejection
   被显式处理；
3. shared composition 拥有 4 sections / 17 rows 的 order/copy/options/reset visibility。
   Web 原 renderer 与 native clean-room renderer 都要删除，不能把旧 JSX 留作第二真源；
4. Lynx MenuTrigger 的 `render` slot 会 clone 并用 trigger children 覆盖 Button children。
   只传 `render={<Button>label</Button>}` 会在 build green 时把 label 变成 undefined；
   把 Button 作为 trigger child 后实机恢复四个 select labels；
5. 用 canonical KV changed fixture 验证 Workspace switch、row reset、global Restore 三者同步，
   截图后逐字恢复用户状态。证据见
   `shots/2026-07-30/port/p6-c4/settings-general/notes.md`。

### P-92 Async hydration 前必须屏蔽 native control 初始化回写；Appearance section/card ownership 只能有一层 ✅（P6-C4）

Appearance 同时加载 canonical app settings、theme payload 和 native inputs，green build
不能证明持久状态与结构正确：

1. shared composition 若显式拥有多个 card，Web Elements 不能再复用自动包 card 的
   `SettingsSection`；应只映射原 section/title shell，否则形成测试不易发现的双层 card；
2. 纯 autocomplete suggestions/defaults 必须留在 host-neutral logic，native Elements
   不得为了一个常量导入带 hooks/storage/query 副作用的 `appSettings.ts`；
3. native Input/Menu 等控件可能在首次 render 发 initialization change。异步 storage
   hydration 完成前，General/Appearance change handler 必须直接丢弃事件，不能把 default
   `system` 回写覆盖用户的 canonical `dark`；
4. 验证必须用 changed theme fixture 重启：mode 保持 dark、Dark segment active、row reset
   与 global Restore 同步 active，才证明不是静态深色截图；
5. P-45 direct dark selectors 还需覆盖 native 内层 text/input node；只给 wrapper 写
   foreground 会出现边框正确但数值仍为黑色。证据见
   `shots/2026-07-30/port/p6-c4/settings-appearance/notes.md`。

### P-93 Web 复杂 editor 要拆 shared anatomy + host interaction kernel；clipboard 可验证真实 action ✅（P6-C4）

ThemePackEditor 同时含 store、七行 anatomy、DOM picker/dialog/slider 与 clipboard，不能整文件
硬搬，也不能把 native 永久降为三色 summary：

1. shared composition 必须拥有 active-first 双 pack 顺序、title/context、Reset/Import/Copy/
   code-theme action 顺序，以及 Accent/Background/Foreground/UI font/Code font/
   Translucent sidebar/Contrast 七行；
2. Web Elements 保留 picker/dialog/range/toast，native Elements 可用 HEX+swatch、
   clipboard import、numeric contrast、Menu/Input/Switch，但双方 state mutation 必须调用同一
   `theme.logic` 并写完整 canonical `synara:theme`；
3. native action 内不要依赖 background callback 后的 React state feedback；bridge action
   可成功但 main-thread label 不重绘。保持 deterministic label，用 host call/log 证明
   `clipboardWriteText` 与 `clipboardReadText→storageSet`；
4. AX 只暴露 Lynx container 时，Computer Use coordinate button 仍可能命中 native button，
   但 text input focus/typing 不能据此宣称通过。用 changed fixture restart 证明 state/
   reset projection，并把真实 typing 留给可获得焦点的 final interaction gate；
5. 复制 action会改变系统 clipboard。验证前应先读出并在结束后恢复；本刀首次实机没有先
   保存旧 clipboard，已在 evidence/LOG 明示，后续不得重复。证据见
   `shots/2026-07-30/port/p6-c4/settings-theme-editor/notes.md`。

### P-94 Paired gate 必须量化 content max-width；native key input crash 要和 AX 缺失分开登记 ✅（P6-C4）

Settings 首轮 paired frame 看似结构完整，但 native card 从 sidebar 后铺到窗口右边，
Web 则是 `max-w-2xl` 居中列；若只看单端截图会漏掉 280px 宽度漂移：

1. 从 Web 真实布局还原外列契约：672px outer、24px horizontal padding、624px
   card/content。Lynx `SettingsContentInner` 同样设 672px max-width + auto margin；
2. sidebar 可保留 Web 256px / Lynx 250px 的平台差，因而两尺寸 content/card 左锚均只差
   3px，最大 shell anchor 是 sidebar 的 6px；
3. `capture.sh` 的进程所有权检查要比较真实安装路径大小写
   `dist/Lynxtron.app/.../lynxtron`。路径写错时应 fail closed，而不是放宽到任意 8901 client；
4. AX 只暴露 container 只说明无法语义定位。若 coordinate focus 后发送 key input 直接触发
   `NSInternalInconsistencyException: Flutter text model must not be null`，这是可复现的
   Lynxtron input-kernel crash，必须按平台 gap 单独登记，停止重试；
5. screen gate 可保留已验证的 clipboard Import、Copy、Menu/Switch/reset/server mutation
   fallback，但不得把 swatch/HEX 静态显示冒充可用文本编辑。

证据见 `shots/2026-07-30/port/p6-c4/settings-paired/notes.md`。

### P-95 可编译的 Web 叶子仍可能不是可替换的共享边界 ✅（P6-C5）

`KanbanCardView` 整图直接送入 Rspeedy 可以成功生成 bundle，但原文件仍拥有
`button/span` 等 Web host tags。这样的结果只能证明依赖图能编译，不能证明 Lynx
runtime 会命中正确 host renderer。应把 visibility/order/anatomy 留在同一
`*Composition.tsx`，把 tags、icons、events 与 host CSS 下沉到 canonical
`*CompositionElements`；Web 原 API 反向 re-export composition，Lynx config 对 exact
Elements specifier 建 alias。最终还必须由产品 route 消费、实机绘制并验证 activation；
probe 本身不计复用。P6-C5 Kanban card 首刀按此模式从 2091.2 kB raw-tag probe 收敛到
product-consumed 2099.2 kB bundle，并删除 probe。

### P-96 页面迁移先校正 route 真义，再复用其 composition ✅（P6-C5）

如果 Web 没有 `/projects` route，而产品真源是 `/kanban` overview，给 native tile grid
套同色 card 只会让错误 screen 更像真的。应先从 Web route、container 与数据 derivation
确认 screen identity，再让旧 native path 成为同一 canonical screen 的临时 alias：

1. shared overview 拥有 empty-project filtering、项目顺序、In Progress→Draft→Done 展平、
   render cap、header/count/card/show-more/empty copy；
2. Web 原 `KanbanOverview` 必须反向消费，native 删除 tile grid JSX/CSS；
3. project header 是 read-only navigation，必须进入 `/kanban/:projectId` 并按 project
   过滤真实 snapshot；不能无操作，也不能打开仍含全局 cards 的假 project board；
4. mutation capability（New task）可通过 callback availability 显式隐藏，但 card/project
   navigation 不能跟随 DnD 一起豁免；
5. transitional alias 只为导航收敛期保留，最终认证与 Phase 8 cleanup 以 Web route 为准。

### P-97 交互内核可以外包，read-only anatomy 不能随 DnD 一起豁免 ✅（P6-C5）

`KanbanColumn` 同时包含 `useDroppable` / `useSortable` 和静态列结构。平台没有 DnD 时，
不能因此保留一整套 native column JSX：

1. shared read-only composition 拥有 label/count/status、capability visibility、card order、
   empty copy 与 Done render cap / expand state；
2. Web non-sortable columns 直接消费 composition，把 `useDroppable` ref 和 over-state ring
   留在外层 host wrapper；Draft 的 sortable card wrapper 才是最小 DnD exception；
3. native 三列全部消费同一 composition，不提供 New task / DnD callback，因此不画假能力；
4. 共享 import 让原 Web drop-ring utilities 在第二 screen graph 变为 reachable 时，style
   weighted denominator 会变化。新增可确定映射，不调低 ratchet；
5. macOS launcher 可能在 argv 中改变 `.app` 大小写。capture ownership 应比较 executable
   file identity，再校验精确 repo path 实体和 `dist/desktop` 参数；只按字符串大小写会把
   自有实例误判为不存在，放宽到端口则可能误抓用户 client。

证据见 `shots/2026-07-30/port/p6-c5/kanban-column/notes.md`。

### P-98 共享 renderer 仍不够；状态归属必须直接消费 canonical projection ✅（P6-C5）

同一套 card/column JSX 若喂入简化 DTO，仍会产生产品语义漂移。Kanban 的反例是
`messageCount > 0` 但 `latestTurn === null`：slice 原规则判 Done，Web
`deriveKanbanColumn` 正确判 Draft。

1. normalized store 已有 `SidebarThreadSummary` 时，不再压成 `messageCount/live` 后重建
   card；把完整 summary 和 project identity 跨平台边界；
2. 产品 feature logic 直接调用 Web `buildKanbanBoard`，由它统一处理 pending requests、
   session connecting/running、latest turn、timestamp、provider、branch/worktree、pin/PR、
   recency 和 column；
3. native 没有 composer mutation/DnD/terminal kernel 时，对应 local draft、optimistic
   overlay、manual order、terminal-entry set 传空，明确是 capability absence，不另造状态；
4. canonical feature import 不应藏进全局 query 模块来制造所有 screen 都 reachable 的假
   共享；background 只运送 normalized data，feature product logic 才持有 board build；
5. 必须用能区分两套规则的真实 snapshot 复验。若数据恰好让两者同列，green frame 不能
   证明简化 projection 已消失。

证据见 `shots/2026-07-30/port/p6-c5/kanban-projection/notes.md`。

### P-99 Query result shape 升级必须审计同 key 的全部消费者；badge 复用 canonical helper ✅（P6-C5）

把 PR query 从 entry array 升级为 `{ viewer, entries }` 后，feature page 已正确消费新结构，
但 Sidebar badge 仍对整个 result 调用 `filter`。这种遗漏可以通过 build/test，却会在真实
snapshot hydration 后以压缩代码 `u.filter is not a function` 让整面 LogBox：

1. query result 或 cache value shape 变化时，不能只改 route；必须按 query key、hook 和
   selector 搜索全部消费者，包括 sidebar badge、header count、prefetch 与 background
   projection；
2. consumer 不应再复制字段名或 review-request 去重规则。先取 canonical `entries`，再调用
   `countUniqueViewerReviewRequests`，让 Web/Lynx 使用同一规则；
3. runtime error 若出现在 socket close 附近，不要先假设 teardown。用完整 stack/bundle
   定位压缩调用，并以最小 shape discriminant 复现；本刀所有 socket monkeypatch 探针均
   无效并已回滚；
4. 修复后必须重跑真实 server/snapshot route，而不只跑 empty fixture。该 real-data gate
   同时证明 PR list 50 entries 正常渲染且 console error/warning 为空。

证据见 `shots/2026-07-30/port/p6-c5/pull-requests/notes.md`。

### P-100 共享 filter anatomy 还不够；query 参数与 unavailable capability 都必须是真的 ✅（P6-C5）

PR header/tabs/search/project filter 共享以后，最容易留下两类“看起来一样”的假等价：
native pills 只切本地样式但 RPC 仍固定 `open/all`，或者为了像 Web 而画一个不能安全输入的
search box。

1. shared composition 拥有两组 canonical options、active state、search capability 和
   project filter order；Web 原 route 反向消费，不能保留第二套 labels/order；
2. host state 必须进入真实数据边界。`state`、`projectId` 要同时进入 query key 与
   `pullRequests.list` payload；involvement 使用 canonical viewer filter，不能只过滤标题；
3. 平台 kernel 已有可复现 text-input crash 时，capability 不是 styling 问题。shared source
   应显式接受 `editable | unavailable`，native 画说明性 disclosure，不能画 inert input；
4. 实机至少验证一项 server-side state（Closed）、一项 project scope（Synara）和一项
   viewer-side involvement（Reviewing empty），并同时检查 header/trigger/empty copy；
5. 多个同 bundle desktop 窗口存在时，Computer Use 不能可靠区分。停止坐标点击，改用
   DevTool exact client/session 的 `Input.emulateTouchFromMouseEvent`，避免误操作非任务窗口；
6. Web evidence viewport 若无法达到认证尺寸，必须明示为 composition/interaction proof，
   不冒充 exact paired geometry；最终 screen gate仍须回到两尺寸矩阵。

证据见 `shots/2026-07-30/port/p6-c5/pull-request-controls/notes.md`。

### P-101 大型 detail graph 先按产品 tab 缩边；跨客户端 mutation 才能证明真实 pin ✅（P6-C5）

PR detail 的 Web 聚合树同时包含 Summary、Timeline、Code diff、review composer、DOM hooks
和 mutation actions。整图 compiler probe 失败时，安全边界不是重画整个 dock，也不是把
所有 Web tab 做成 disabled 假按钮：

1. 先按真实产品 tab 找到最小 cohesive composition；本刀让 Summary shared source 持有
   intro/meta/section order、Markdown、checks、comments 与 unavailable-commenting copy；
2. Web 原 Summary tab 反向消费同一 source，host Elements 保留 checks external-link；
   Lynx exact alias 只替换 host tags/Markdown kernel；
3. background query 必须调用真实 `pullRequests.detail`，pin 必须使用 canonical
   aggregate/project toggle inputs 调 `pullRequests.setPinned`，不能只在本地移动 row；
4. 同一 native frame 的 filled pin 仍不足以证明 mutation。用同一 server 让 native pin，
   Web refresh 观察 Pinned，再让 native unpin、Web refresh 恢复，才证明 server-owned state；
5. filter 改变时关闭旧 selection，避免旧 detail 与新 query scope 混合；mutation failure
   必须有可见状态；
6. Timeline/Code/commenting 若 kernel 未接，写明 unavailable；对应 Web 能力保持不变。
   interaction proof 的固定 Browser viewport 不能冒充 exact two-size paired geometry。

证据见 `shots/2026-07-30/port/p6-c5/pull-request-detail-pin/notes.md`。

### P-102 Final paired gate 必须同时校验 route boot、canonical grouping 与响应式 split ✅（P6-C5）

局部 composition/runtime 证据都 green 后，真正的 same-server two-size gate 仍可能发现三类
跨层问题：

1. route 第一次在 Web 加载时可因同名 local helper 覆盖 imported helper 而栈溢出。本刀
   `KanbanView` 的递归 `getNavigatorPlatform()` 只有 fresh route boot 才暴露；HMR、单测和
   native frame 都不能替代 Web 新标签页启动证明；
2. 相同 normalized snapshot 不保证相同 container identity。native 若按 cwd/project
   逐个显示 chat-kind containers，Web 却合并为 trailing `Chats`，card composition 再共享
   也是假等价。分组规则必须在 feature projection 层 canonical 化，并用有 real project、
   Studio、chat container 的判别数据复验；
3. 单尺寸百分比修正可能在第二尺寸反向漂移。PR dock 从 50% 临时调到 52% 后，一尺寸观察
   被误读为改善，但 retained 1440 pair 明确出现 23px 偏差。回到 Web 的 50% 契约后，
   1280 split 为 769/769px，1440 为约 848/849px；
4. native-only hero/marketing chrome 会把整个 board 下推，即使 card/column 都同源也不能
   放行。route header 本身应成为 shared composition，mutation availability 只控制 action，
   不得由 host 另造大面积结构；
5. geometry 必须按应用 content 比较：Lynx DevTool frame 排除 32px titlebar且为 DPR 2。
   先归一化坐标，再量 sidebar/header/content/card/split；本组最大 like-for-like delta
   6.5px，证据见
   `shots/2026-07-30/port/p6-c5/final-paired/notes.md`。

### P-103 诊断页静态可达会制造 product reuse；先断 production graph 再谈收敛率 ✅（P6-C6）

早期 compiler/runtime probe 即使没有产品导航按钮，只要被 production router 静态 import，
仍会进入 Lynx graph 和发行 bundle；若 probe 恰好消费 Web reference composition，还会把
非产品消费计为六屏 physical reuse：

1. `/ports`、`/ui`、`/markdown`、`/shared-settings-probe`、`/fidelity-reference` 必须从
   product router 的 import、parse 和 render branch 同时移除；
2. deep link 也是产品可达性。`synara://fidelity-reference` 必须和 route 一起退役，不能留下
   隐蔽入口；
3. source 文件可在独立清理刀前暂存，但不应由 product entry 静态引用；最终 P8-Q1 再物理
   删除或迁入显式 dev-only harness；
4. 收敛后指标下降可能是正确结果。本刀 Settings 51.32%→51.10%，因为去掉了
   `FidelityReferencePage` 制造的共享可达；同时 Lynx graph 429→420 modules、bundle
   2211.2→2167.8kB；
5. ≥70% 是 D13 报告目标，不得为了守住旧数字保留 unused import 或把 ordinary module
   扩成 EXCLUSIVE。

当前 gap 分组与后续候选见 `plan/reports/p6-c6-convergence.md`。

### P-104 收敛刀不一定提高 reuse%；模块已由另一 route 可达时，以第二 owner 删除为准 ✅（P6-C6）

Kanban project board 已让 `KanbanRouteHeaderComposition` 进入 Lynx graph，overview 再从
本地 `FeatureHeader/Title/Count` 改为同一 shared source 时，审计 numerator 不会再次增加；
这不代表该刀没有收敛价值：

1. source-of-truth 数量从两套降为一套才是 P6-C6 的目标，graph set metric 天然不计同一
   module 的第二 consumer；
2. 必须用 search 证明旧 JSX/class 无调用方，再物理删除对应 CSS，不能只在新分支加 shared
   import；
3. production build 与实机 pixel 证明新 consumer 真命中；本刀 native bundle
   2167.8→2166.5kB，DevTool 画出 shared 44px header 且 console clean；
4. 报告同时写清 metric unchanged，避免用“没有涨点”诱导保留重复 owner，或用重复 import
   伪造百分比。

证据见 `shots/2026-07-30/port/p6-c6/kanban-overview-header/notes.md`。

### P-105 route 不可达不等于 CSS 不可达；global stylesheet 也属于 production graph ✅（P6-C6）

从 production router 删除诊断页 import 后，页面 JSX/module 已不进入产品图，但其 selector
若仍留在入口统一 import 的 `App.css`，照样会打进六个核心屏的每一份 bundle：

1. 历史 probe 暂留作 dev harness 时，样式必须与页面共置并由页面直接 import；这样只有
   harness 真正作为独立 entry 消费时才进入 graph；
2. global stylesheet 只保留产品入口可达的 shell/screen class。已被 shared composition
   替代的 bubble、feature empty、read-only footer、settings nav recipe 应物理删除；
3. dead-class 检查必须覆盖 slice source 和被 exact alias/canonical import 拉入的 Web
   source；只搜 slice 会把共享 composition 使用的 class 误判为 dead；
4. 本刀 `App.css` 79 classes / 0 unreferenced，产品 bundle 2166.5→2159.3kB；reuse/style
   百分比不变是预期结果，减包和 source ownership 才是证明；
5. 诊断 source 最终仍由 P8-Q1 删除或迁入显式 dev-only harness。本阶段共置 CSS 只是防止
   暂留资产污染产品图，不是把诊断页重新变成产品能力。

完整结果见 `plan/reports/p6-c6-convergence.md`。

### P-106 unavailable kernel 可以共享 taxonomy，但 disabled 语义和 disclosure 必须同帧可证 ✅（P6-C6）

把 PR detail 缩到 Summary kernel 时，隐藏 Timeline/Code 会留下第二套 native taxonomy；反过来
只画两个无效按钮又会冒充能力。可复用的边界是“ordinary tab anatomy + honest capability”：

1. physical-shared source 拥有 Summary → Timeline → Code 顺序、active/available state 和
   unavailable copy；Web 原 dock 反向消费，不保留第二套 labels/order；
2. native 可显示 canonical taxonomy，但 unavailable label 必须同时具备 muted styling、
   `aria-disabled=true` 与 guarded tap，不能改变 active tab；
3. disclosure 必须在同一 detail frame 明示具体 unavailable kernels；仅靠灰色不能替代
   capability 文案，Summary 内 commenting 差异也继续保留；
4. Timeline/Code diff/review 仍是 Web-only platform/product kernel，不因共享 tab anatomy
   获得“已移植”状态；
5. 实机用 exact DevTool DOM + center tap 双证据：Timeline 为 disabled 76×28 node，tap 后
   Summary 仍 active，console error/warning 为空。

证据见 `shots/2026-07-30/port/p6-c6/pr-detail-tabs/notes.md`。

### P-107 compiler 允许 DOM host 不代表可留；crashing input 必须在 shared capability 层被剪掉 ✅（P6-C6）

Settings sidebar 的 Back/Search 看似只是两个小 host 控件，但 native 本地 `<Input>` 同时造成
source duplication 和假能力：Lynxtron 0.0.7 已有稳定 text-model crash 证据。

1. physical-shared composition 拥有 Back → Search 顺序、labels 与
   `available | unavailable` branch；Web 原 sidebar 反向消费 available 分支；
2. Web search controller 继续拥有 query ranking、Enter top-match、Escape clear，Elements
   只把 value/key event 翻译为平台中立回调；
3. Native 必须在 composition 层选择 unavailable，Elements 绘制同源图标与 disclosure，
   DOM tree 不得存在 input、focus 或 tap handler，不能仅把危险 input 设成只读；
4. compiler-first 未 alias DOM Elements 时仍能 green build，但 bundle 为 2196.9kB；
   exact canonical alias 后为 2170.1kB并有真实像素。能编译不是 host adapter 命中证明；
5. 实机需同时证明 outer HTML `aria-disabled=true`/no input、Back 可返回、console clean，
   然后 byte-exact 恢复 KV/window state。

证据见 `shots/2026-07-30/port/p6-c6/settings-sidebar-chrome/notes.md`。

### P-108 平台没有对应 anatomy 时应删除，不要为了“共享”保留错误 UI ✅（P6-C6）

PR detail native dock 曾额外绘制 `PR #<number>` identity 和本地 X close，而 Web dock
只有 canonical header/tabs 与 close control。收敛不能把 native-only identity 包进新
composition 来永久化差异：

1. physical-shared close composition 只拥有双方真实共有的 visibility、accessible label
   与 close action；Web 原 panel 反向消费；
2. native-only `PR #…` row 没有 Web 对应 anatomy，直接删除，不能因数据真实就保留第二
   结构 owner；
3. Web `IconButton`/tooltip Elements graph compiler-first 可通过，但把 Lynx 推到
   2388.0kB；exact alias 后 2170.2kB，必须以 bundle + runtime pixels 证明 adapter 命中；
4. 实机用真实 PR #478 证明 28×28 close node、accessible label、center tap 后 dock 消失，
   同时搜索 `PR #478` 为 0、console clean。

证据见 `shots/2026-07-30/port/p6-c6/pr-detail-close/notes.md`。

### P-109 disclosure 事件可平台化，文案/顺序/chrome 仍必须单一物理 owner ✅（P6-C6）

Thread 的 `<list>`、Markdown 与 disclosure tap/animation 是已登记平台内核，但这不意味着
`Worked for` trigger、panel、divider 可以在两端各写一套：

1. shared composition 拥有 `Worked for <elapsed>` / `Details` 文案、trigger → panel →
   divider 顺序、expanded/collapsed accessible label 与受控 open contract；
2. Web Elements 保留 Base UI Collapsible/motion/DOM chevron；Lynx Elements 只翻译 tap、
   `aria-expanded` 与 panel visibility；
3. panel children 仍由各平台的 work-row/Markdown kernel 绘制，但不能反向拥有 disclosure
   chrome；native 原 `TranscriptCollapsedWork*` JSX/CSS 必须删除；
4. exact DevTool center tap 证明 panel 0→1、Expand→Collapse、真实 work row 出现且 console
   clean；临时 in-memory route 用后删除，不能进入 final product graph。

证据见 `shots/2026-07-30/port/p6-c6/collapsed-work-chrome/notes.md`。

### P-110 事件类型、handler 和 fulfilled `setFocus` 都不是键盘实机闭环 ✅（P7-I1）

ReactLynx PC 类型和真实 product DOM 可以同时证明 view-backed control 支持
mouse/touch/focus/key bindings，但焦点与键盘仍受宿主窗口状态和跨线程事件发布影响：

1. 先用真实 pointer 证明状态机，而不是只检查 CSS：PR filter 实际进入/离开
   `ui-hover`，primary down/up 实际进入/退出 `ui-pressed`；
2. disabled exclusion 要从 DOM 反向证明：Timeline/Code 必须
   `focusable=false`、`aria-disabled=true` 且没有 mouse/focus/key/tap handler，不能只在
   callback 内 early-return；
3. enabled DOM 有 `bindfocus/bindkeydown` 与 unit test 通过，只证明 wiring。真实 Tab、
   `DOM.focus` 和 key delivery 仍需独立 runtime evidence；
4. PC `Element.invoke("setFocus")` Promise fulfilled 也不等于 OS 授予焦点。本刀宿主窗口
   被旧 `lynxtron quit unexpectedly` macOS modal 覆盖，fulfilled 后没有 `bindfocus`；
   该环境只能产出阴性结论；
5. DevTool main-thread `__CreateEvent/__DispatchEvent` 若没有穿过 native cross-thread
   publication 并改变产品状态，不能作为按键证明。系统模态框不代用户点击，改在无阻挡
   环境复验；
6. 因此本刀只关闭 pointer/pressed/disabled 子项，focus/key 保持 open，同时继续其他
   P7-I1 surface，避免把单一宿主障碍升级成全阶段 blocker。
7. 同一 adapter 扩到 Settings 后，真实 switch press/release 进入 `ui-pressed`、切换
   `aria-checked` 并写 canonical renderer key；disabled Profile exact activation 不改变
   General selection。可复用 helper 仍需每个 surface 的真实 action/disabled 证据，不能用
   PR 一处通过替代全应用证明。
8. Sidebar/Kanban 继续按 surface 给出独立正反证据：enabled Kanban、project header、真实
   card 与 Back 均实际进入 `ui-pressed` 且 release 到达预期 route；Automations 与 New
   task 则为 `focusable=false`、`aria-disabled=true`、零 handlers，exact activation 不改变
   route。完整 wiring 仍不等于真实 Tab/key delivery，后者继续保持 open。
9. Transcript disclosure 同样要验证 state 与 action 的连续链：真实 trigger press 进入
   `ui-pressed`，release 后 `aria-expanded`、accessible label、chevron 与 panel 必须一起
   改变。相邻 Jump host 即使完成 adapter wiring，若 runtime 没有发布 user-scroll 并使其
   可见，也不能把 scroll detach/reattach 记为通过；fulfilled `scrollToPosition` 仍只是
   阴性诊断。
10. Composer 非文本 controls 继续给出独立证据：disabled Send 必须 unfocusable 且零
    handlers；model press 时保持 `aria-expanded=false` 并进入 `ui-pressed`，release 后才
    展开真实 panel；trait 与 Extras 也必须分别证明 press state 与 release action。该结果
    不改变 textarea Arrow/Enter/Escape 的窄 kernel exception。
11. Sidebar 不能只验证全局 primary navigation：segmented selection、project/chats
    disclosure 与真实 thread rows 都要移除 tap-only wrapper。selected/expanded label 和
    aria state 必须随 release action 同步；一线程 snapshot 未渲染 pagination 时，只保留
    source wiring，不把它记作 runtime action 通过。
12. 去掉系统模态后须用真实宿主输入复验，而不是沿用旧推断。本轮 Computer Use Raise
    exact Synara app，真实 Tab 四次均无 `.ui-focus`；点击 Lynx content 后 AX focus 已从
    window 进入 `container lynxtron`，再次 Tab 仍无 view focus。故 crash modal 不是单因，
    Lynxtron 0.0.7 host focus bridge 是当前平台 gap；停止重复同类 probe，保留 helper
    source wiring 和 pointer runtime 证据，Enter/Space 不冒充实机通过。

证据见 `shots/2026-07-30/port/p7-i1/pr-interactions/notes.md` 与
`shots/2026-07-30/port/p7-i1/settings-interactions/notes.md`、

### P-127 输入桥调查必须分离 binding、delivery 与 harness 可达性 ✅（P9-D1）

host input probe 不应把类型/DOM handler 当作 runtime pass，也不应把 automation 无法施加的
输入当作产品阴性：

1. matrix 为每个 source/event 分别记录 `bindingExists`、`eventArrived`、call count 与
   last detail；Web 与 Native 使用同一纯逻辑 catalog；
2. probe 必须是 compile-time 独立 entry，默认 product bundle 不含 probe marker，避免诊断
   route污染六屏 graph；
3. Native report 通过显式 owned path 写出，DevTool client 必须从 owned PID 动态解析；
4. 被前台用户窗口遮挡的 click、未配置 visual model 的 Computer Use、错误 target 的全局
   key input都属于 harness failure，不进入 event matrix；
5. real pointer/wheel/text input必须由真实 OS input产生；`dispatchEvent`、`scrollTop=...`、
   fulfilled `setFocus`或 PID-targeted keycode不能替代真实 host/IME delivery；
6. background textarea可收到 Lynx focus但不是 macOS Text Input Manager client时，IME cell
   应标 blocked，不应推断 `isComposing` unsupported；
7. 阴性 event 以操作时间线 + 前后 matrix/DOM/console存证；无视觉变化时不制造无信息截图。

证据见 `shots/2026-08-03/p9-d1/{web-probe,native-probe}/notes.md`，完整判定见
`reports/p9-d1-host-input-bridge.md`。
`shots/2026-07-30/port/p7-i1/sidebar-kanban-interactions/notes.md`、
`shots/2026-07-30/port/p7-i1/transcript-interactions/notes.md`、
`shots/2026-07-30/port/p7-i1/composer-interactions/notes.md`、
`shots/2026-07-30/port/p7-i1/sidebar-controls-interactions/notes.md`、
`shots/2026-07-30/port/p7-i1/focus-key-host-negative/notes.md`。

### P-111 sibling overlay trigger 不应滥用 `catchtap` ✅（P7-I1）

Lynx popup trigger 需要区分“阻止真实祖先 activation”和“popup 只是 sibling”：

1. model trigger 与 popup panel 是 sibling，没有外层 tap action 需要拦截；
2. 该结构使用 `catchtap` 时，Desktop DevTool 的 press 与 release 各触发一次 toggle，
   panel 会打开后立即关闭，且无法保留稳定 `ui-pressed` 帧；
3. retained host 应直接展开 canonical interaction helper 的 `bindtap`、mouse/touch/focus/
   key props；press 只改变 pressed class，release 才单次 activation；
4. 只有节点确实嵌套在另一个会响应 tap 的 ancestor 中，才可局部覆盖为 `catchtap`，并须
   有 exact press/release runtime 证据。

Composer model、trait/Fast 的最终实机链见
`shots/2026-07-30/port/p7-i1/composer-interactions/notes.md`。

### P-112 Desktop DevTool DOM 取证必须单 connector 串行 ✅（P7-I1）

Lynxtron 0.0.7 的 Desktop debug router 在本刀暴露两种工具级 reset：

1. 同一 connector 上用 `Promise.all` 并发发送 attributes/box/outerHTML 请求，会
   `ECONNRESET`；必须逐 node、逐 method 串行；
2. 长生命周期 connector 等待期间再启动 screenshot connector，会中止前者；截图和
   完整 DOM state machine 应拆成两个 exact-state run；
3. debug router reset 时应用 PID 与 8901 仍可存活，不能把 client 枚举消失误报为产品
   crash；先停止自己启动的 app、恢复 byte-exact renderer state，再重启取证；
4. capture 仍使用仓库 `scripts/capture.sh` 的 PID→port 归属检查，不能因串行要求退回
   猜端口。
5. Desktop restart 后 8901 有时需要一次 CLI `DOM.performSearch` 才能 warm up；不要调用会
   挂满超时的 `DOM.enable`。完整 document tree 可在未 enable 的单 connector 上串行读取；
6. `DOM.scrollIntoViewIfNeeded` 或 offscreen box 坐标不等于 native `scroll-view` 已滚动。
   若 viewport 不变，屏外坐标可能命中当前可见 row；必须用 DOM state/截图证明滚动，或改用
   可恢复的短内容真实 fixture。失败工具动作不能升级为产品 scroll defect。

该模式只约束验证工具，不改变产品 interaction 结论。

### P-113 nested interactive control 要 contain 完整 pointer lifecycle，不只拦 tap ✅（P7-I1）

模型 row 内的 favourite 是真实嵌套交互，和 P-111 的 sibling popup trigger 不同：

1. 只把 favourite 的 `bindtap` 改为 `catchtap` 虽能阻止最终 model selection，但
   `mousedown/touchstart` 仍会冒泡，父 model row 会错误进入 `ui-pressed`；
2. canonical nested helper 应把 mouse down/up、touch start/end/cancel 与 tap 全部映射为
   `catch*`，同时保留自己的 hover/focus/key contract；
3. exact press 必须证明 star 进入 `ui-pressed` 而 parent row 不变；release 必须只改变
   `aria-checked`、保持 popup 打开且不选择 model；
4. containment 是 host event primitive，model option/favourite 的 visibility、selected/
   checked anatomy 仍由 physical-shared composition 持有。

真实 OpenCode popup 的 pressed/release 证据见
`shots/2026-07-30/port/p7-i1/composer-overlay-items/notes.md`。

### P-114 shared primitive 只有被真实产品消费并闭合 state→action 才计进展 ✅（P7-I1）

UI primitive 文件存在、诊断页可渲染或 unit test 通过，都不能证明六核心屏交互已经收敛：

1. 先从 canonical alias 反查真实产品 consumer。本轮 `command` 被 physical-shared
   `SidebarSearchPalette` 直接消费；generic `collapsible` 的核心产品调用已由更窄 Elements
   adapter 接管，因此不能靠 `PrimitivesPage` 给 P7-I1 记完成；
2. native primitive 必须移除 unsupported `:active` 依赖，统一使用
   `.ui-hover/.ui-focus/.ui-pressed` 与 canonical helper；
3. runtime 要证明连续链：Search press→dialog open→CommandItem press 时 dialog 保持→release
   执行真实 Settings action。只检查 handler attributes 或 pressed 截图仍不够；
4. shared callback 也要保留：CommandItem hover/focus 继续发布
   `onItemHighlighted(value)`，`onMouseDown` call-site contract 不能在 host adapter 静默丢失；
5. host Tab gap 仍按 P-110 处理。unit key test 证明 Enter/Space wiring，但不能外推为宿主
   keyboard pass。

证据见 `shots/2026-07-30/port/p7-i1/command-primitive/notes.md`。

### P-115 disclosure 要同时证明 pointer state、ARIA state 与真实 visibility ✅（P7-I1）

只给 disclosure header 增加 pressed class，或只检查 `aria-expanded` attribute，都不能证明
折叠交互已闭环：

1. 更窄的 physical-shared Elements adapter 仍应持有平台 host，canonical composition 持有
   label/order/body；不要为了复用 generic Collapsible 把真实产品 disclosure 改造成诊断页
   primitive consumer；
2. enabled header 展开 canonical interaction helper 后，必须同时发布 focusable、完整
   mouse/touch/focus/key/tap handlers、accessible expanded/collapsed label 与
   `aria-expanded`；
3. runtime 链应为 press 只加 `ui-pressed` 且保持 expanded，release 单次 activation 后移除
   pressed、隐藏 body、切换 glyph/label/ARIA，再次 activation 恢复；
4. DevTool 返回屏外 box 不代表 target 可交互。`DOM.scrollIntoViewIfNeeded` 未移动 nested
   `scroll-view` 时，应改取同一真实 composition 中可见的 sibling disclosure，不用屏外坐标
   冒充 action；
5. 若 Rstest 在收集 assertion 前因 generated vendor 报错，连续复现只登记 harness negative；
   保留 canonical helper test + production build + exact runtime，不保留永远无法加载的测试文件。

PR #478 Description 的 press→collapsed→restored 与三组 header contract 证据见
`shots/2026-07-30/port/p7-i1/pr-summary-disclosure/notes.md`。

### P-116 PC overlay 要分离屏幕锚点、viewport layer 与 Presence 能力 ✅（P7-I2）

构建通过、popup 节点存在或局部 layout 坐标非空，都不足以证明桌面 overlay 可用：

1. `bindlayoutchange` 的 `left/top` 是局部布局坐标。Composer trigger 因此曾得到
   `(0,0)`，不能直接作为 fixed viewport layer 的 anchor；
2. retained trigger 用 `NodesRef` +
   `getRectByRef(ref, true)` 异步读取 screen-relative rect。popup 在 anchor 与自身尺寸
   都齐备前保持 hidden，避免左上角错误帧；
3. overlay layer 固定覆盖 viewport，透明 backdrop 负责 outside dismiss，popup 用独立
   z-order；side/align 算法最后按 viewport clamp；
4. 官方 Popover 并非这台 host 的可用兜底。其 Presence 等待
   `delayFrames`/`lynx.requestAnimationFrame`，Lynxtron 0.0.7 PC 未推进该链，实际结果是
   `visibility:hidden` 且 console clean；该阴性实现必须移除，不能凭双 build 绿保留；
5. runtime 必须量化 trigger/popup/backdrop box，并闭合 outside/item dismiss 与 disabled
   handler exclusion。submenu 若仍是 inline fallback，必须明确登记，不能宣称独立 flyout；
6. screenshot connector 会改变窗口焦点，可能在取帧后关闭当前 popup。DOM state machine
   与截图仍按 P-112 分开串行，证据以取帧时画面和独立的 open→dismiss 计数链组合。

真实 Composer Extras/Runtime 两个 product consumer 的 exact anchor、4px gap、full
backdrop、dismiss 与 disabled 证据见
`shots/2026-07-30/port/p7-i2/composer-menu-overlay/notes.md`。

### P-117 official Dialog overlay 可复用，但 dismiss authority 要在 adapter 收敛 ✅（P7-I2）

官方 Dialog 的 Overlay/Backdrop 在 Lynxtron 0.0.7 PC 可实机绘制和 click-close，但
native adapter 仍需补齐 Web contract：

1. wrapper 统一持有 controlled/uncontrolled open state，Backdrop、Close 与 Escape 都走
   同一个 `onOpenChange(false)`；不能让 Escape 只通知 controlled caller、却无法关闭
   `defaultOpen` dialog；
2. `DialogContent.dialogContentProps` 发布 `role=dialog`、`aria-modal=true` 与 bubbling
   `bindkeydown`。Escape 只在 open 时消费，其他 keys 不拦截；
3. Dialog viewport 维持 z50，Menu layer 维持 z60，避免 dialog 内菜单被 backdrop 覆盖；
4. backdrop 必须量化为完整 viewport，action dismiss 要证明 popup 消失后真实 route/state
   到达；只看半透明截图不够；
5. component test 需要 stub `lynx.requestAnimationFrame` 才能驱动 Presence；这是 test
   harness 需求，不改变 Popover 在 PC runtime 的 P-116 阴性；
6. host physical Escape 仍受 P-110 限制。保留 handler/source test，不把它外推为真实按键
   通过。

routed Search Palette 的 full-backdrop、modal attributes、outside dismiss 与真实 Settings
action 证据见 `shots/2026-07-30/port/p7-i2/search-dialog/notes.md`。

### P-118 custom picker 应复用 overlay kernel，只保留产品 panel state ✅（P7-I2）

自定义 picker 含多级内容，不代表它需要第二套定位和 dismiss 实现：

1. model picker 的 provider→model panel、runtime trait 与 favourites 是产品状态；screen
   anchor、viewport layer、backdrop、Escape 与 z-order 是通用 overlay kernel；
2. 把前者保留在 `ComposerModelControl`，后者接入 canonical Menu，可以继续消费
   physical-shared trigger/trait/model-list composition，同时删除 page-local
   `position:absolute/right/bottom/z-index`；
3. pending provider catalog 不能继续展示 static/fallback rows，避免把未完成 discovery
   冒充 settled result。panel state 应明确投影为 `providers | loading | models`；
4. Escape handler 应发布在 popup bubbling boundary，而不只发布在 trigger/MenuItem。
   自定义 interactive descendants 才能继承同一 close authority；
5. runtime 仍需量化 custom popup 自身的 top/end anchor、full backdrop、outside/selection
   dismiss 与 disabled handler exclusion。generic Menu 已验证不能替代真实 picker 取证；
6. 若 physical-shared component 的 Rstest harness 在断言前触发现有 JSX runtime loader
   缺陷，应删除不可运行测试，保留 canonical Menu component test、纯 panel-state test、
   production build 与 exact runtime，不能把 loader fail 计为产品 fail 或 green。

真实 `Reply MODEL-READY` 的 trigger/popup exact end align、6px gap、full backdrop、dismiss、
disabled 与 cleanup 证据见
`shots/2026-07-30/port/p7-i2/composer-model-popup/notes.md`。

### P-119 PC context action 必须同时闭环事件、锚点、宿主菜单与真实命令 ✅（P7-I2）

Web 的 `onContextMenu` JSX 契约本身不等于 native context action。可交付边界至少包含：

1. PC secondary-button 事件源；
2. cursor/window anchor；
3. native/system menu host service；
4. action-item order/copy policy；
5. clipboard/dialog/orchestration 等真实 action authority。

Lynx Desktop 的 mouse `x/y` 在当前 host 是**目标节点内局部坐标**。不能直接传给
`Menu.popup`；先用 `getRectByRef(ref, true)` 取 row screen rect，再加 local pointer
offset。实机第一轮 host 收到错误 `(58,11)`，修复后为与真实线程行一致的
`(86,337)`。

菜单项必须由能力裁剪，而不是全量画出后失效。Native Sidebar 共享 Web 的
`buildThreadContextMenuItems`，但只发布可由当前 platform/controller 完成的
Pin/Copy/Archive/Delete；Rename/Handoff/Terminal 等缺少完整 authority 时不渲染。
Kanban 若产品决策仍是 read-only，也不因底层菜单可用而暗中扩张 mutation scope。

### P-120 density 必须共享语义与数值，host 单位换算属于平台 adapter ✅（P7-I3）

设置页选中 Compact 只证明 control state，不证明产品密度。完整链路必须覆盖：

1. 从 canonical app-settings projection hydrate 根节点；
2. Settings change / Restore defaults 立即更新根节点；
3. 重启后恢复持久值；
4. 至少量化一个跨屏共享 row 与 composer 几何；
5. 以真实 routed product 取证，而不是 diagnostics/probe。

Lynxtron 0.0.7 对运行时 custom-property mutation 不可靠，因此 Native 使用稳定的
`SliceRoot--density-{compact|comfortable|spacious}` 静态 class scope。这个 adapter
不能直接复制 Web 的 unit string：Web density contract 按 `1rem=16px`，当前 Lynx host
按 `1rem=14px`；同时 `lh` 放入 custom property 会在消费点重复参与 line-height 计算，
曾使 composer 高度膨胀到约 160px。正确边界是保持 Web 的 taxonomy、normalization 与
物理值，Native 仅把它们换算成等值 px（例如 compact row `23.8px`、comfortable
`28px`），并以实时 box geometry 验证。

滚动同样要求真实输入来源：DevTool `scrollToPosition` fulfilled 或 synthetic touch
都不能替代 host wheel/trackpad publication。P7-I3 在 routed transcript 上以真实 macOS
wheel 证明 detach、Jump visible，再以真实 click 证明回到底部与 Jump 消失。

### P-121 nested scroll / resize 必须用差分状态证明 owner 边界 ✅（P7-I3）

滚动容器出现在 DOM、`scroll-view` 属性正确或截图没有明显裁切，都不足以证明滚动归属。
完整验证应使用可恢复的真实 overflowing snapshot，并对动作前后做差分：

1. fixture 只能通过正式产品 RPC 写入临时 snapshot clone，不能用静态假 rows。P7-I3
   使用 5 projects × 16 threads；结束后逐字恢复 KV/window state 并移除 clone；
2. 每次动作只应改变一个 owner：Sidebar 内容移动时 titlebar/footer 固定；overview
   横向移动时 shell/sidebar 固定；一个 Kanban card/column 纵向移动时 sibling 与外层
   strip 固定；
3. 两个认证尺寸要同时记录 native window bounds 与 DevTool content root。本轮
   1280×820→1280×788、1440×900→1440×868，差值明确归属于 32px native titlebar；
4. 固定三列 project board 沿用 P-18 等分 flex，动态 overview 才使用显式横向
   `scroll-view`。不能为了统一实现重新引入整页横移；
5. 旧 snapshot 若因 schema/重复 workspace root normalization 落入 offline，先与已知
   正常 snapshot 对照。确认 fixture 不兼容后应拒绝该证据，不把它升级为产品失败；
6. retained evidence 必须同时包含动作前/后帧、console error/warning 结果、门禁与
   byte-exact cleanup。程序化 scroll fulfilled 仍只算诊断，不算真实输入证明。

该模式在 P7-I3 关闭了 Sidebar、Kanban overview/project 与双尺寸 containment：
`shots/2026-07-30/port/p7-i3/overflow/notes.md`。

### P-122 theme 共享状态/数学，motion 共享语义；host 表达由 adapter 负责 ✅（P7-I4）

主题或动画的“同源”不能靠两端恰好长得相似来证明。Lynxtron 0.0.7 有三项必须显式分层
的 host 边界：

1. root runtime custom-property mutation 不是可靠 authority；
2. `<svg content>` 内的 `currentColor` 不继承宿主节点 `style.color`；
3. Web disclosure 的 `grid-template-rows: 0fr → 1fr` 不能在 Native 等价动画，且 host
   不发布可验证的 `prefers-reduced-motion` runtime signal。

正确实现是共享状态、颜色数学、语义时序和产品消费，再由精确 alias 的平台 adapter
翻译表达：

- `App` hydrate canonical `ThemeState`，Settings/theme-pack mutation 即时发布稳定
  `SliceRoot--theme-{light,dark}`，restart 恢复同一 payload；
- light/dark direct-value selector sheets 由 Web `theme.logic` 生成或回归验证，不能维护
  一套无关 dark palette；`useTheme.lynx` 必须返回 active variant/pack；
- SVG generator/adapter 在交给 `<svg content>` 前，将 semantic `currentColor` 替换成
  active canonical ink/muted ink，而不是期待 host 继承；
- Native `platform/motion` 保持 Web 的 220ms disclosure 语义和 chevron state，以
  transform/opacity 替代 grid-row；Sidebar 为关闭保留 220ms + 40ms cleanup presence；
- transcript collapsed-work 禁止 exit presence。退出 row 若继续占据 `<list>`，会进入
  measurement/bottom-follow/streaming 回路，视觉“更完整”反而破坏性能与正确性。

验证必须同时证明状态和时间：P7-I4 的真实 Sidebar click 在 4.93ms 进入 closed class，
100ms body 仍存在，320ms 已移除；真实 Settings Dark → Light action 同时更新 KV 与 root
class，dark restart 恢复同一 variant。代表性 thread/Settings/Kanban/PR/overlay 两主题及
SVG contrast 证据见
`shots/2026-07-31/port/p7-i4/root-theme/notes.md`。

### P-123 accessibility primitive 必须 fail closed，DOM 属性与 host AX 分层证明 🔧（P7-I5）

Lynx `<view>` 默认不是 accessibility element。中央交互 primitive 可以统一 node/name/
trait/value，但默认暴露所有可点击节点会把尚未迁移的 icon-only control 变成无名 button。
正确边界是：

1. `useLynxInteractiveState` 只有收到 non-empty product label 或 explicit opt-in 才发布
   `accessibility-element=true`；具名 disabled control 也必须保留 node/trait，同时保持
   unfocusable/handler-free；
2. label 必须来自拥有真实 copy 的 physical-shared composition，例如
   `SidebarPrimaryActionRow`、Settings item、Kanban card title+column、PR title+number；
   Native adapter 不猜页面文案；
3. 使用安装目标类型的 `accessibility-traits` 复数拼写。官方 guide 的旧 singular 文案
   不能覆盖当前 compiler/type authority；
4. source test 证明 shared copy 与 helper policy，production compiler 证明 alias 命中，
   DevTool attributes 证明真实产品消费；三者都不能替代宿主 accessibility tree；
5. 当前 Lynxtron 0.0.7 的 macOS window content 只暴露一个 `AXGroup`，child count 为 0。
   因此应用层 semantics 可交付并应保留，但 Desktop screen-reader support 必须标为上游
   host gap，不能因为 DevTool 有属性就声称通过。

本刀真实 evidence：
`shots/2026-07-31/port/p7-i5/accessibility/notes.md`。

### P-124 live state 只公告离散语义；正式 runtime 必须加载 staged desktop bundle 🔧（P7-I5）

Loading、empty、error 和普通 placeholder 不能共享一个默认 live behavior。正确 contract
是 fail closed：

1. `plain` 不发布 role/live，也不调用 Native announcement；
2. `status` 与 `empty` 使用 polite/atomic，`alert` 使用 assertive/atomic；
3. Native caller 必须提供明确字符串，空白拒绝进入公告通道；
4. consecutive intent+content key 只播一次；回到 plain 会 reset，之后同一状态可在新的
   生命周期再次播报；
5. streaming transcript row 不允许消费这个 hook，避免每个 token 都触发公告；
6. state node 本身仍需 `accessibility-element` + label/trait，主动公告不能替代可导航结构。

验证时要区分两个 production 产物：`rspeedy build` 只更新
`output/bundle/lynx/main.lynx.bundle`；Lynxtron production 从
`dist/desktop/main.lynx.bundle` 加载。P7-I5 首轮因加载旧 staged bundle 看不到新属性，
正式 `npm run build` 同时完成 Lynx + desktop staging 后，sequence-180 PR online empty
与 owned-server offline alert 才得到真实 node/name/trait 证据。后续任何 desktop runtime
gate 都必须先比对或正式重建 staged bundle，不能用 output bundle 绿替代产品加载证据。

当前 Lynxtron 0.0.7 仍无 macOS AX children 和可观察语音通道，因此 policy test、compiler
和 DevTool state node 证明的是应用公告 contract，不是 audible screen-reader pass。
证据：`shots/2026-07-31/port/p7-i5/system-states/notes.md`。

### P-125 persistence 与 route failure 必须 end-to-end acknowledged；last-known-good 优先 🔧（P7-I5）

只在 component 内增加 `catch` 不足以形成可靠状态：若 host bridge 把 parse/write error
吞成空对象或 success，UI 仍会展示假成功。可靠边界需要贯穿 storage、query 和
presentation：

1. 除明确的 `ENOENT` 外，KV read/JSON parse error 必须穿过 bridge 到 hydration
   controller；页面显示 alert + Retry，不能用默认值伪装成已加载；
2. 同步 Web Storage mirror 与 durable acknowledgement 分层：普通调用保留兼容的同步
   mirror，关键 Settings save 使用 serialized awaited write-through，并以 operation
   sequence 拒绝 stale completion；
3. persistence failure 不回滚当前 in-memory theme/density/value。提示必须明确当前值仍在
   UI 中，但未可靠落盘；server partial failure 与 local write failure使用不同 copy；
4. query refresh failure 若已有成功 board，应保留 last-known-good 内容并显示 inline
   stale alert；只有没有可用数据时才进入 page-level offline/error；
5. not-found 只能来自成功响应后的 missing entity，不能从 transport error 推断；Retry
   必须回到 loading/status 再产生新的离散结果；
6. canonical Elements alias 是 runtime gate。P7-I5 Kanban 首轮虽共享 resolver/build
   通过，却因漏掉 exact alias 实际加载 Web host elements；只有 production DOM 出现
   `SharedKanbanState` 和 Lynx accessibility attributes 才证明 adapter 命中。

P7-I5 实机分别用 malformed JSON、临时不可写数据目录、无 server 与 owned hanging
transport 证明 read failure→Retry→ready、save failure 保留值，以及
offline→Retry→loading→offline。KV/window state 均 byte-exact 恢复。证据：
`shots/2026-07-31/port/p7-i5/resilience/notes.md`。

### P-126 Composer lifecycle 保留 stop intent；informative text 使用独立 AA 角色 🔧（P7-I5）

实时 session 状态与本地 operation 不保证同一帧到达。Native Stop 的真实事件顺序是：
本地进入 `stopping`，server 接受 interrupt，本地 operation 先回 idle，随后 polling 才把
session 从 running 投影为 ready/interrupted。若只看当前帧，会把已中断 turn 误报为
`Response complete`。可靠 lifecycle contract 必须：

1. 首次 mount fail closed，不公告 snapshot 中已存在的 ready/running；
2. 只公告 sending、starting、started、stopping、stopped、complete、failure 等离散
   transition，绝不进入 transcript row/token polling；
3. Stop 被请求后保留一个 bounded intent，直到 active→ready/stopped 被解析为
   `Response stopped`，或 alert 清除；terminal stopped precedence 高于 stopping 与
   ordinary completion；
4. Web 用 polite status / assertive alert，Native 复用同一 presentation 与 P-124 的
   named state node/去重 announcement；
5. provider delivery 阴性必须和 presentation 分层。quarantined thread 或 ACP auth/parse
   failure 没有产生 provider runtime event 时，不能拿来判定 lifecycle UI 成败；
6. runtime 必须同时证明 UI labels 与 server interrupt/event terminal state。P7-I5 的
   rapid Native probe 得到 `Stopping response`→`Response stopped`，server 同时记录
   interrupt request、task stopped、ready、`turn.completed state=interrupted`。

状态颜色也不能继续从 decorative/disabled tertiary palette 借用再叠 opacity。canonical
theme math 应提供独立 informative neutral/error/success/warning text roles，并对每个
light/dark surface 保证 normal-text contrast ≥4.5:1；component 只选择语义角色，不自行
混色或降低 opacity。默认生成值的最低比值是 4.57:1，Web theme test 与 Native generated
sheet/strict style audit 共同锁定。

证据：
`shots/2026-07-31/port/p7-i5/composer-contrast/notes.md`。
