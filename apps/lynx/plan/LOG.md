# 执行心跳日志（LOG）

每个工作单元（含中断）追加一条：时间、任务 ID、做了什么、做到哪、下一步、新发现。
新会话先读本文件再读 01-roadmap.md。

---

## 2026-07-27

- 计划体系初始化完成（00 策略 / 01 roadmap / 02 差异矩阵 / 03 决策 / 04 模式 / 05 side-by-side）。
- 用户确认执行方式：由用户睡前用 README 中的长程 Goal Prompt 自行启动，不在规划会话内执行。
- 现场说明：spikes/p0-s1/app 已用 `npx @lynx-js/create-lynxtron@latest app -y --web` 生成（scaffold 完成，**npm install 与 sidecar 冒烟未做**，P0-S1 仍为 pending）；模板主进程示例见 app/src/main/desktop/main.ts（LynxWindow + `-lynx-invoke` 桥 + dev 模式加载 http://localhost:5969/main.lynx.bundle）。
- 下一步：P0-S1（从 npm install 继续；create CLI 支持非交互 `-y`，Node ≥22.18 已满足，本机 v24.18）。

### 长程执行会话 #1（goal 工具说明：主 goal 为整个 prompt，逐任务 goal 创建会冲突，按用户 fallback 延续主 goal，不再逐任务建 goal）

- **P0-S1 ✅ completed**。install 需 `npm approve-scripts`（lynxtron/builder/electron-winstaller 的 postinstall 被 npm11 拦住，否则二进制不下载）。sidecar 冒烟全绿：fork→SIDECAR_PORT=55509→主进程 fetch /health OK；UI 渲染正常，devtool 截图 shots/2026-07-27/p0-s1/lynx.png。关键发现：①utilityProcess 原生有、shim 未导出→createRequire 绕；②fork stdio 必须含 'ipc'；③子进程无 process.parentPort；④ipcMain/globalShortcut/session/autoUpdater 原生确认缺失。结论：spikes/p0-s1/README.md。
- **P0-S3 ✅ completed**（委派 agent Mira/deepseek-v4-flash，产物已核验）。tailwindcss 3.4.19 + @lynx-js/tailwind-preset 0.5.0 喂 Top500 class：绝对 66.0%（330/500）、加权 80.1%（12,815/15,994）。未通过大头=主题色(~8%，tokens 注入可补)+缺失 utility(~7%)；补齐后 ~95%。→ D1 已决=A（🟢）。报告：spikes/p0-s3/README.md + report.json，harness measure.cjs 可复算。
- 文档已同步：01（两任务 completed）、02（+5 行：utilityProcess/IPC/主进程缺失/预设覆盖率）、03（D1 决策记录）。
- 下一步：P0-S2（WS 三路径实测，生死线）：(a) Lynx view 内直连 WS 试 LynxWebSocketModule；(b) 主进程 WS+lynxBridge 中继（需先验证 utilityProcess IPC 消息或主进程直起 WS 再桥接）；(c) SSE+fetch。依托 P0-S1 app 改造。
- **P0-S2 ✅ completed（生死线解除）**。六相套件（a/a2/b0/b1/b2/c）两轮实测：LynxWebSocketModule 预注册+@lynx-js/websocket 直连全绿（RTT 0.5–0.9ms、~390msg/s、重连 1–2ms）→ **D4 🟢 = a 直连**。b1 中继亦优（~1ms，桥开销 0.4ms）留作备选；b2 重连 505ms 异常淘汰；(c) EventSource 连接成功但消息不派发（0.0.7 缺陷）→⬆️。关键技巧：lynx.fetch≠globalThis.fetch；结果经 sidecar /report 落盘（spikes/p0-s2/results.jsonl），devtool console 是消费型缓冲且端口漂移。产物：spikes/p0-s2/README.md、results.jsonl、shots/2026-07-27/p0-s2/。文档已同步：01/02（WebSocket✅、fetch🔧、SSE⬆️、+nodejs 注入行）/03（D4 决策记录）。
- 下一步：P0-S4（`<list>` 滚动跟随语义验证：流式追加+底部吸附+上滚脱离；子组件提前实例化、ref≠可见、scroll 节流三语义 → 04 模式）。仍用 p0-s1/app 作测试床（加 list 演示页），结论写 spikes/p0-s4/README.md。P0-S5（CEF webview，可选）最后做。
- **P0-S4 ✅ completed**。Transcript 模型（30 初始+120 流式）自动时间线全绿：吸附（scrollY≈maxScrollOffset）、脱离（scrollY 定 3218 内容照涨）、重吸附 pass；三语义坐实（150/150 eager 实例、effects=150 vs attachedCells=9、throttle 200→16ms 事件 1→10）。意外收获：eventSource 语义（瞬时程序滚动=LAYOUT(1) 不误脱；smooth=SCROLL(2)）；getVisibleCells 无 @PC 标注。P-02 升 ✅、新增 P-07。产物：spikes/p0-s4/README.md、results.jsonl、shots/2026-07-27/p0-s4/。
- 下一步：P0-S5（CEF `<webview>` 兜底，可选）：先查 Lynxtron 0.0.7 是否有 webview 元素/API（typings+运行时），无则记 ⬆️ 并按"可用性已确认（阴性）"收口 D3 数据。
- **P0-S5 ✅ completed（阴性）**。类型层 `<webview>` @PC 齐全，但二进制无 CEF（mac=WKWebView 胶水）且**插入元素即 view 崩溃**（白屏+devtool 断连，主进程存活；阶段化插入定位到创建时刻）→ 0.0.7 不可用 ⬆️。D3 🟡 记录建议 c（放弃兜底走主线），备选 b（自研 NSWindow+WKWebView 模块），待用户拍板，不阻塞主线。产物：spikes/p0-s5/README.md。另记录：vite dev 仅绑 IPv6（curl 127.0.0.1 失败、localhost 通）；devtool get-console -w 在无 client 时直接退出且 client 发现偶发不稳——确定性数据一律走 sidecar /report 落盘。
- **🏁 Phase 0 出口达成**：D1=A 🟢、D4=a 🟢、D3 数据具备 🟡（不阻塞）；04 有 P-02✅/P-07 首批条目；02 矩阵 +8 行实测数据。P0-S1~S5 全部 completed。

### 会话 #1 收尾（停止原因：上下文预算，按协议写交接）

- 本会话完成：P0-S1、P0-S2、P0-S3（agent Mira）、P0-S4、P0-S5。主仓 synara 零改动（除启动过隔离 dev 实例，已停；`.synara-sxs/` 目录留存可删）。
- **下一会话从 P1-F1 开始**（主仓 ~/github/synara，遵守其 AGENTS.md：不 commit、不 bun fmt/lint/typecheck、`bun run test` 验证、改动最小化）：
  1. 读 00-strategy §0.2 分层 + §0.3 ports 表；建 `apps/web/src/platform/`（storage/socket/clipboard/window/dialogs/motion/scroll 七接口 + web impl 薄封装）。
  2. 关键 seams 已审计：WS 唯一构造点 wsTransport.ts:183；desktopBridge+NativeApi；lib/storage.ts+hooks/useLocalStorage.ts；api.dialogs（19 处）；disclosureMotion.ts。
  3. P1-F1 完成后 P2-V1 的 Lynx 侧 impl 只需对齐这些接口（D4=a：socket 用 @lynx-js/websocket 直连）。
  4. 验证：`bun run test`（Vitest）；dev 实例用 `env -u SYNARA_AUTH_TOKEN SYNARA_PORT_OFFSET=3158 SYNARA_NO_BROWSER=1 bun run dev -- --home-dir ./.synara-sxs --port 58190`（58090 被用户日常实例占着；web=8892 仅 IPv6）。
- 测试床 p0-s1/app 当前代码态：App.tsx=WebviewTest（P0-S5）；Transcript.tsx（P0-S4）、wsTests.ts（P0-S2）保留可切换；main.ts fork env 指向 p0-s5 results。

### 长程执行会话 #2

- **P1-F1 ✅ completed**（主仓，未 commit）。`apps/web/src/platform/` 七 port（storage/socket/clipboard/window/dialogs/motion/scroll）+ web impl 薄封装；66 文件调用方切换（sed 脚本+手工）。验证：`bun run test` 3018/3026，8 失败均与基线一致（1 个 ChatMarkdown favicon 断言为 HEAD 预存失败，其余为负载超时抖动；基线 worktree 对照实验已做并清理）。
- 关键教训（已记入 03 决策/02 矩阵备选）：①storage port 必须**逐调用惰性解析**全局存储（测试会替换 globalThis.window；加载期绑定分裂状态，splitViewStore 等 5 文件一度失败）；②`composerDraftStore` 保留 legacy 双 Map（attachments 测试编码事故行为，见 03 执行记录）；③platform/dialogs 用 `readNativeApi()` 不用 `ensureNativeApi()`（测试只 mock 前者）；④sed 顺序陷阱：`localStorage.getItem(` 先于 `window.localStorage` 替换会产生 `window.webStorage`（已全量清查修复）。
- Port 设计速记（P2-V2 对齐用）：storage=KeyValueStorage(get/set/remove/clear)；socket=createWebSocket+layerWebSocketConstructorFromPort+resolveDefaultSocketUrl（D4：Lynx 换 @lynx-js/websocket）；clipboard=writeText+writeImagePngDataUrl；window=hasWindowControls+minimize/toggleMaximize/close/state+openExternal+zoomFactor；dialogs=NativeApi['dialogs'] 惰性委托；motion/scroll=纯 re-export（已是 L0）。
- 下一步：P1-F2（window.\* 收敛 <30 文件 + oxlint no-restricted-globals 分区规则；现状 119 文件直引 window/document/navigator/localStorage）。主仓工作树当前有 P1-F1 全部未提交改动——**勿误删/误 commit**，用户睡醒自行审查提交。
- **P1-F2 ✅ completed（带尾项，见 03 🟡）**。185 → 34 文件（区域外=0，oxlint 150 规则 scoped 验证 0 违规 0 错误）。动作：timers/rAF 转裸全局或 platform/frame（80 处+）；typeof window 守卫→isBrowser（27 文件）；navigator.platform→getNavigatorPlatform（24）；window.desktopBridge→getDesktopBridge（12，新 platform/desktopBridge.ts）；事件/visibility/selection/viewport/clipboard/misc helper 一批（platform/env.ts 扩到 20+ helper、events 加 document 变体、window 加 openWindow、storage 加 sessionWebStorage、新 platform/download.ts）；lib/panelResize 接管 body 样式（2 文件出清）；chatSelectionDom 统一 Selection/Range（5 文件出清）；fallbacks 移入 components/ui；flushStorageBeforePageHide 移入 platform/storage。
- 关键判断记录：①composerDraftStore 保留 legacy localStorage 表达式并进 lint overrides（同 P1-F1 记录）；②storageOriginMigration 保持裸 localStorage（web 独占迁移）；③"区域"定义：platform/、components/ui/、L1 impl（wsNativeApi/nativeApi/env.ts）、shell（main/pairingBootstrap/authSignedOut）、岛屿（terminal/composer/pdf/browser/resize/chat-selection/profile）——枚举在 .oxlintrc.json overrides；④`window as T` 类型断言用 globalThis 替代（不在禁则且语义相同）；⑤禁则不含 WebSocket（后续 ratchet 候选）。
- 遇到的坑（均已修）：sed 产生 `typeof navigator === "undefined" ? "" : getNavigatorPlatform()` 自毁三目（14 文件）与 `window.webStorage` 过匹配；useProviderStatusRefresh 提前 return 破坏 cleanup 结构（手工重构）；`a && b ?? c` 语法错误 2 处（useTheme、MessageTrail）；MessageTrail 三目残留 `: false`。
- 下一步：P1-F3（删 env.ts/nativeApi.ts 的 window.nativeApi 死间接层 + 移除 shadcn dep；注意 wsNativeApi.ts 是活的不动）。主仓未提交改动 = F1+F2 全部。
- **P1-F2 补充（测试终态）**：isBrowser 两次语义修正定稿——①改函数（late-stub 测试）；②window-only 判定（fake-window 无 document）。events port 内置 capability 检查（部分 window stub 缺 dispatchEvent/addEventListener，wsTransport.test 复绿）。终态：3018/3026，失败=预存集。
- **P1-F3 ✅ completed**（未 commit）。window.nativeApi 生产死层删除（preload 只暴露 desktopBridge 已证实）；但浏览器测试用它做注入缝 → 新 `setNativeApiForTest` 测试缝（nativeApi.ts），迁移 ChatView.browser.tsx（3 注入点+3 restore）与 chatProjects.test.ts（6 stub 点+afterEach reset）。env.ts 的 isElectron 收敛为 desktopBridge-only。shadcn dep 移除（bun remove）+ components.json 删除（孤儿 CLI 配置）。vite-env.d.ts 移除 Window.nativeApi 类型。vitest 3015/3026，失败=预存集（ChatMarkdown 2 断言基线同败，余为负载超时）。
- 下一步：P1-F4（tokens.css 提取：index.css @theme 66 令牌→独立 tokens.css 被 import）。之后 P1-F5。主仓未提交=F1+F2+F3。
- **P1-F4 ✅ completed**（未 commit）。index.css:487-632 的 :root 令牌块（108 声明 = 66 亮 + 42 暗 @variant dark）原样抽为 `apps/web/src/tokens.css`（含文件头说明），index.css 顶部 `@import "./tokens.css";`（@import 相邻置顶满足 CSS 规范；重排安全已验证：487 后无同属性非 layer 重复定义、unlayered↔layer 关系不变）。验证：`bunx vite build` 成功，产物 main-\*.css 含 --background 与 .dark 变体。第二个 @theme inline（scroll-fade keyframes，1842 行）非令牌，未动。
- 下一步：P1-F5（React 19 特性降级：useTransition×7→react-pacer、useId×9→计数器 util、startTransition×5 确认 /compat）。之后 P1-F6（依赖 F4）→ Phase 2。主仓未提交=F1+F2+F3+F4。
- **P1-F5 ✅ completed**（未 commit）。useDeferredValue×7（含漏网的 \_chat.pull-requests.index）→`useDebouncedValue(x,{wait:100})`（react-pacer 已是依赖）；useId×10 站点/9 文件→新 `hooks/useUniqueId.ts`（计数器+useRef 稳定）；BranchToolbarBranchSelector 的 useTransition+**useOptimistic**（审计漏计）→手动 pending/optimistic state（比 /compat 的恒 false pending 更准）；startTransition×7 **保留**——`@lynx-js/react/compat` 已证导出 startTransition/useTransition（Preact 语义：同步执行/pending 恒 false），P2-V1 需配 react→react/compat alias。vitest 3017/3026 同基线。
- 下一步：P1-F6（CSS diff 工具：PostCSS 插件+CI+首份报告回填 02；依赖 F4 ✓）。之后 Phase 2（P2-V1 依赖 P0-S1✓+P1-F4✓ 已解锁）。主仓未提交=F1~F5。
- **P1-F6 ✅ completed**（未 commit）。`scripts/lynx-css-report.ts`（postcss@8.5.19 加为根 devDep）：解析 index.css+tokens.css，28 条判定（✅1/❓2/⬆️2/🔀5/🔧18）；`--baseline` ratchet + `--check` 已接 CI（Lint 后新步骤，负向测试验证 exit 1）；报告 scripts/reports/lynx-css-report.md + 基线 JSON 入库。新发现回填 02：scroll-fade 依赖 @property（🔀）+ scroll-driven animations（🔧），Lynx 侧需整体重写。package.json 加 `lynx:css-report` script。
- **🏁 Phase 1 出口达成**：F1~F6 全部 completed（详见 01 出口行）。主仓未提交改动 = **F1+F2+F3+F4+F5+F6 全部**（git status 可查；用户审查后自行 commit）。

### 长程执行会话 #3

- **P2-V1 ✅ completed**。slice/ 工程跑通并截图存证（shots/2026-07-27/p2-v1/threads-list.png、thread-page.png）：memory-history 路由 + zustand + react-query + tokens.css（主仓 F4 产物直接 import，--primary/--background 等可见生效）。
- 关键技术结论：①`@tanstack/react-router` 组件层崩溃（snapshotPatchApply 'wrapper'）→ 改用 @tanstack/history + 自研渲染层（03 🟢、04 P-08）；②react$ alias 需 compat shim（default 透传 + use=undefined，Rspack 静态链接）；③tokens.css 的 @variant dark 在 Lynx 惰性（dark 待 strip 管线）；④**devtool 截图对不可见窗口超时挂起**——视觉验证陷阱（04 P-09），本轮白屏排查大半耗于此。
- 环境事项（用户醒来注意）：①本机 t3code 项目的 rspeedy dev server 占着 5969（模板 dev URL 默认端口），slice 已改用 5971；②排查中我 pkill 过一次 Rspeedy 进程，t3code 的 dev 可能需重启（其 supervisor 应会拉活）；③屏幕上有一个 DimAgent 录屏权限对话框**未替你点击**（你的安全决策）；④slice 窗口创建参数已还原（center:true，无 alwaysOnTop）。
- 下一步：P2-V2（L1 lynx impls：storage/net.socket/clipboard/dialogs，net.socket 按 D4=a 用 @lynx-js/websocket 直连；与主仓 platform/ 接口对齐——F1 的接口形状在 synara/apps/web/src/platform/）。依赖 D4✓、P1-F1✓ 均已满足。slice 工程即落地位置。

### 长程执行会话 #4

- **P2-V2 ✅ completed**。续接现场已有但未记 LOG 的四 port 草稿，完成审计与加固：
  `slice/src/platform/{storage,net.socket,clipboard,dialogs}.ts` + `bridge.ts` 全部声明
  background-only；主进程 `hostServices.ts` 实现 userData JSON KV（写队列保序、temp+rename
  原子落盘）、Lynxtron clipboard 文本/PNG、confirm/pickFolder/saveFile（选择+写入同一主进程
  调用）、WS echo；main bridge 对未知方法/异常保证回复。
- **实机退出标准**：storage mirror=disk=`hello-lynx`；`@lynx-js/websocket` 5 次 echo
  RTT avg 1.0–1.4ms；clipboard text+PNG 均 OK；dialogs 三 API 存在且 confirm 返回 true。
  截图：`shots/2026-07-27/p2-v2/ports-final.png`。`npm run build` 通过；警告仅既有
  Lynx CSS 剥离（color-scheme/text-transform）和 ws 可选 native addon。
- **测试基线事项**：`npx rstest run` 现有唯一 App 测试失败
  `recentlyCreatedOwnerStacks`（P2-V1 后 stale React testing harness/snapshot，早于本任务且
  与 port runtime 无关）；本任务用 Lynxtron 实机自测覆盖。后续单列测试基建修复，不把
  stale 测试误判为 port 失败。
- **新差异**：曾尝试逐 export 引入主仓同版 Effect 4 socket Layer，构建成功但实机加载期
  `TextEncoder is not defined`；移除后恢复。02 已将 effect 改为 🔧，03 记录 adapter 留在
  transport 层的 🟢 可逆决定，04 新增 P-10 同步 KV 镜像模式。Effect import 还额外增加约
  95KB Lynx bundle，不在 L1 为未使用 export 支付。
- 下一步：**P2-V3**（button/dialog/menu/tooltip/input 等切片所需 `.lynx.tsx` wrapper，
  对照 lynx-ui；调用点零改动验证）。当前 dev 会话可能仍占 5971/8081，进入下一工作单元前
  先停掉本会话启动的进程；不要动 5969/8080/9222（别的项目/既有实例）。
- **P2-V3 ✅ completed**。新增 `slice/src/components/ui/` 五个 `.lynx.tsx` wrapper
  （button/input/dialog/menu/tooltip）+ primitives.css；Rspeedy 扩展名优先级落地；
  `PrimitivesPage.tsx` 用无后缀 import、Base UI `render` slot、`open/onOpenChange`、
  DOM 风格 input onChange 证明调用点同形。`@lynx-js/lynx-ui@3.135.3` 加为依赖。
- 实机：Button/Input token 样式、Dialog overlay/backdrop/close、单层 Menu/Tooltip 均渲染；
  证据 `shots/2026-07-27/p2-v3/{primitives-open,dialog}.png`。`npm run build` 通过；
  ReactLynx best-practices scanner 扫 6 个 wrapper 0 issue。
- 新差异：① lynx-ui Popover 在 Desktop 受控 show=true 与 defaultShow=true 都不渲染且
  无错误（官方 Desktop ongoing）→ Menu/Tooltip 用 view fallback，02/03 已记；② import
  tokens.css 中语义 var→基础 var 的二次解析失效，`lynx-overrides.css` 具体化首切片语义色；
  ③ UI wrapper 不能模块级 background-only，只能 handler 指令（04 P-11）。
- 下一步：**P2-V4**（@tabler SVG → Lynx 静态 svg 元素映射工具 + 切片所需图标全部转换）。

### 2026-07-27 — P2-V4 完成

- 新增 `slice/scripts/generate-lynx-icons.mjs`：从 `@tabler/icons@3.44.0` 原始 outline SVG
  生成 `src/lib/icons.lynx.tsx`，校验结构与危险元素，输出稳定 Synara export。
- 首切片清单 14 个：Archive/ArrowLeft/Check/Chevrons/Ellipsis/MessageCircle/Paperclip/
  Plus/Refresh/Search/Trash/X；Dialog close 已采用生成图标，`/ui` 提供全量 gallery。
- 退出标准证据：14/14 Lynx `<svg content>` 实机渲染；截图
  `shots/2026-07-27/p2-v4/icons.png`；console 无 error/warning；`npm run build` 通过。
- 确定性：生成前后 `src/lib/icons.lynx.tsx` SHA-256 均为
  `581815d5ec52047a8f9221b7768051ccec2657fd6bbdb392e6e420ed83238e6b`。
- D6 标记 🟢，02 依赖矩阵与 04 P-12 已回填。
- 下一步：**P2-V5**（Lynx markdown renderer：view/text 映射，GFM table/code block，
  math 降级）。

### 2026-07-27 — P2-V5 完成

- 首次尝试 `react-markdown` components → Lynx 元素：构建失败，micromark 正则进入
  main-thread bytecode，PrimJS 报 invalid escape sequence；不是映射遗漏。
- 改为 `background-only` unified + remark-parse/GFM/math → 可序列化 mdast 子集 →
  `ChatMarkdown.lynx.tsx` 纯 Lynx renderer；未自研语法 parser。
- 第二个运行期问题：Rspeedy browser condition 选择 named-character decoder 的 DOM
  export，模块加载期 `document.createElement` 崩溃；`lynx.config.ts` 定向到包自带纯 JS
  `index.js` 后恢复。已写入 02/03 与 04 P-13。
- 退出标准：GFM table/任务列表/链接/强调全部实机渲染；fenced TS code 横向容器可用；
  inline/display math 以带 `ƒ` 标识的 TeX 源码样式降级。证据：
  `shots/2026-07-27/p2-v5/markdown-final.png`。
- `npm run build` 通过；ReactLynx scanner 对 parser/renderer/probe 3 文件均为 0
  diagnostics；DevTool console 除预加载日志与临时 parse 探针外无 error/warning
  （探针随后已移除）。
- 下一步：**P2-V6**（只读聊天线程视图）。依赖 P2-V1~V5 与 P0-S4 已全部 completed；
  重点：真实 synara WS 数据、`<list>` transcript、04 P-02 滚动跟随、P2-V2 的
  TextEncoder/Effect transport 分层尾项。

### 2026-07-27 — P2-V6 完成

- `slice/src/data/synaraClient.lynx.ts` 落地真实 Synara 只读 transport：
  `/ws/bootstrap` negotiate → compatibility query `/ws` → Effect Request/Exit JSON 文本帧；
  `queries.ts` 映射真实 project/thread/message snapshot，react-query 轮询刷新。
- `Transcript.tsx` 使用 `<list>/<list-item>`、estimated size 与 P-02 pinned 状态机；
  assistant 消息接 P2-V5 Markdown renderer。真实服务端两线程与 `hi`/assistant 回复已实机
  渲染，证据 `shots/2026-07-27/p2-v6/{threads-real,transcript-real}.png`。
- 三段排障结论：①完整 Effect RPC client 补 TextEncoder 后仍在 PrimJS 报
  `e[i] is not a function`，生产 lazy file chunk 也不支持，且 bundle 约 501KB→1.68MB，
  因此采用协议兼容薄 facade（03 🟢、04 P-14）；② Lynxtron 原生 WS 要显式传可信
  `Origin: synara://app`，服务端安全策略不改；③ Lynx URL polyfill 的 `pathname=` 静默
  无效（抓包实际请求 `/`），改纯字符串 endpoint/query 后打通。
- 验证：Node raw wire probe snapshotSequence=29/threads=2；Lynx 实机同样显示 2 threads；
  ReactLynx scanner 扫 5 个相关文件 0 diagnostics；最终 `npm run build` 通过（501.0KB）。
- 启动协议备注：按 05 先 dry-run 后尝试隔离 server，但 58090 已由用户现有 Synara
  `.synara-pr84` 实例占用；未终止它，直接复用该实例完成同源 Lynx 数据验证。
- 下一步：**P2-V7** side-by-side 首轮。严格按 05：Web 5 核心屏幕 + Lynx 同屏，
  每屏 `web.png/lynx.png/notes.md`，新差异回填 02。

### 2026-07-27 — P2-V7 完成 / Phase 2 出口

- 按 05 建立 5 组目录：`chat-thread`、`composer-focus`、`settings`、
  `sidebar-expanded`、`dialog`；每组均有 `web.png`、`lynx.png`、逐项四态
  `notes.md`。
- Web 使用现有 `.synara-pr84` 实例（server 58090、Vite 8891）；真实 thread 直达
  `72d62436-...`，与 Lynx P2-V6 同一数据源。Browser DOM viewport 请求 1800×1320，
  in-app capture 固定扣除 251 px host rail，原始 Web 图为 1549×1320；Lynx 为
  1800×1336。未重采样证据，尺寸差异逐 notes 记录。
- 五屏结论：真实 transcript 数据 ✅；Dialog 基础 🔧；composer/settings/sidebar 的完整
  组件解剖为 🔀，分别直接对应 P3-E1/E2/E3。色彩 base tokens 接近，但
  selected/elevated/focus/accent 组件态映射不足，已回填 02 CSS variables 行。
- 浏览器验证没有发送消息或提交设置；composer 仅写入未发送 draft。未结束用户现有
  Synara server，也未修改主仓代码。
- **Phase 2 出口达成**：真实 WS 垂直切片 + 首轮 5 屏报告完成。
- 下一步按 ID：**P3-E1 Composer（textarea + Lynx chips/mentions）**；依赖 P2-V6 ✓。

### 2026-07-27 — P3-E1 完成

- 新增 `slice/src/components/composer/`：纯 serializable `composerAst.lynx.ts` 对齐 Web
  mention token quoting、skill、`/automation` 与 built-in slash plain-text 规则；
  `Composer.lynx.tsx` = native multiline textarea + parsed shadow chips + suggestion chips；
  `composer.css` 完成首版 tokens/spacing。
- ThreadPage 直接挂载 composer；suggestions 含同一 Synara snapshot 的真实 threads，以及
  path/skill/command。textarea 是唯一 prompt 真源，zustand 按 thread 保存 draft；插入时
  ref `setValue/setSelectionRange` 同步 native 值。明确 draft-only，未发送消息。
- 验证：targeted Rstest 3 tests 全过；ReactLynx scanner 3 文件 0 diagnostics；最终
  `npm run build` 通过，bundle 513.8KB。实机证据
  `shots/2026-07-27/p3-e1/{composer-empty,composer-chips}.png`，console 无 error/warning。
- 交互验证绕行：DevTool CDP `Input.dispatchMouseEvent` 未实现；Computer Use 因系统
  Accessibility/Screen Recording 权限未授予而不可用（未代用户点击权限框）。使用临时
  store fixture 驱动同一 parser/renderer 截图，随后已移除；默认 route/store 均恢复。
- 新模式 P-15 与 03 🟢 已记录。下一步按 ID：**P3-E2 设置页**（依赖 P2-V3 ✓）。

### 2026-07-27 — P3-E2 完成

- 新增 `slice/src/app/SettingsPage.tsx` 与 settings 样式；`/settings` 提供 General /
  Appearance 导航、搜索、provider input、三组 toggles、appearance swatches 与 restore
  defaults。router/sidebar 入口已接入，默认启动入口在截图后恢复 `/`。
- 设置通过 P2-V2 storage port 使用 key `synara.lynx.settings.v1`：启动
  `storageDump` hydrate，变更即时 `storageSet`；host 实机日志确认两条 bridge 调用。
  本期只写本地 app preferences，不猜测服务端 config mutation（03 🟢）。
- 线程边界排障：静态 import background-only port 会被 main-thread 编译拒绝；普通动态
  import 会生成生产 `lazy-bundle/`，当前 Lynxtron `file:` loader 不可靠；最终使用
  background-only function + `webpackMode: eager`，已固化为 04 P-16。
- 验证：真实 Lynxtron 截图 `shots/2026-07-27/p3-e2/settings.png`；console 无应用错误；
  ReactLynx scanner 扫 SettingsPage/router 0 diagnostics；默认 `/` 最终 `npm run build`
  通过，bundle 528.7KB。
- 下一步按 ID：**P3-E3 Sidebar（6.7k 行拆解）**，依赖 P2-V6 ✓。先审计主仓 sidebar，
  按 AGENTS.md 最小化抽取纯 `.logic.ts`，再在 slice 做 Lynx 实现。

### 2026-07-27 — P3-E3 完成

- 主仓审计确认 `apps/web/src/components/Sidebar.logic.ts` 已是约 1.4k 行且被 6.7k 行
  `Sidebar.tsx` 使用，覆盖排序/分组/状态/可见性；无需再对用户未提交的主仓差异制造一套
  重叠拆分。本轮主仓零新增改动。
- Lynx 新增 `components/sidebar/{sidebar.logic.ts,Sidebar.lynx.tsx,sidebar.css}`：
  真实 snapshot project/thread 分组、recent-first、orphan 保留、折叠、active thread、
  message count、设置入口；router 改为全局双栏 shell（settings 自带专用 sidebar）。
- 兼容边界：共享/对齐纯 projection 契约，不共享 DOM renderer；hover、DnD、context menu
  明确延后，不做假等价。新模式 04 P-17、02 Sidebar 行已回填。
- 验证：projection Rstest 2/2；ReactLynx scanner 扫 Sidebar/logic/router/queries 0
  diagnostics；最终 `npm run build` 通过（543.5KB）。真实 Lynxtron + 同一 58090 server
  显示 Home/Studio/hi 三项目与两线程，证据
  `shots/2026-07-27/p3-e3/sidebar.png`；console 无应用错误。
- 下一步按 ID：**P3-E4 项目/看板/PR 列表**，依赖 P3-E3 ✓。

### 2026-07-27 — P3-E4 完成

- 新增 `FeatureListsPage.tsx` 三个真实路由：Projects 统计 snapshot 中的 thread/message；
  Kanban 用消息数+streaming 信号投影 Draft/In progress/Done 并可点回 thread；PR 通过
  P2-V6 同一 feature socket 调公开只读 `pullRequests.list`。
- PR 实机返回合法空列表，页面显示明确 empty state；同时保留 RPC failure 的 unavailable
  state。未调用 action/comment/pin 等 mutation，也未使用假数据。
- 首次 Kanban 固定宽列套 horizontal scroll-view 导致初始可视区横移、sidebar 被裁；
  改为 `view` + 三列 `flex:1/min-width:0`、列内纵向 scroll-view 后完整入屏。新差异已
  回填 02 overflow，新模式 04 P-18。
- 验证：Rstest 5/5（sidebar projection 2 + Kanban column 3）；scanner 扫 page/query/
  client/router/sidebar 5 文件 0 diagnostics；默认入口恢复 `/` 后最终 build 567.7KB。
  真实截图 `shots/2026-07-27/p3-e4/{projects,kanban,pull-requests}.png`，console 无应用错误。
- 下一任务按 ID 是 P3-E5，但依赖 **D2**；D2 尚未决。P3-E6 依赖 **D3**（🟡
  不可代为拍板）。按循环应继续检查下一个依赖已满足的任务：**P4-X1** 依赖 P2-V6 ✓。

### 2026-07-27 — P4-X1 完成

- 审计主仓 `apps/desktop/src/main.ts` 及其 focused helpers，逐项能力表落地
  `slice/docs/p4-x1-capabilities.md`；不是机械移植 Electron 的 updater/browser/AppSnap
  状态机。
- 壳实装：`shellRuntime.ts`（窗口状态解析/跨屏居中/原子写、路径、legacy root KV/
  window-state 幂等迁移、1 MiB 单代轮转日志、深链 parser、capability descriptor）；
  `main.ts`（1280×820 恢复、Menu、single instance、协议注册、open-url/second-instance、
  window events）；host bridge + `platform/window.ts` 对齐 WindowPort。
- `globalShortcut` 降为 app-active Menu accelerator；`session` 权限不自动处理；
  autoUpdater 明确 external-download 并交 P4-X2。03 🟢 与 02 已回填。
- 验证：shellRuntime Rstest 3/3；ReactLynx scanner router/window 0 diagnostics；build
  568.0KB。实机生成
  `/Users/bytedance/Library/Application Support/slice/synara-lynx-slice/{window-state.json,logs/desktop-main.log}`；
  启动第二实例参数 `synara://settings` 成功导航既有窗口，截图
  `shots/2026-07-27/p4-x1/deep-link-settings.png`；console 无应用错误。
- 下一步按 ID：**P4-X2 updater 降级方案**，依赖 P4-X1 ✓。按既定能力边界实现只读版本
  检测 + `shell.openExternal` 下载页，不下载/安装或静默更新。

### 2026-07-27 — P4-X2 完成

- 新增 host `updateService.ts`、纯 `update.logic.ts`、background `platform/updater.ts` 与
  `/update` 页面；入口同时加入 Sidebar 与原生 Menu。
- 检查只请求固定 `Emanuele-web04/synara` GitHub latest-release metadata（12s timeout），
  semver 比较处理 numeric/prerelease；下载动作只打开代码内固定 releases/latest URL。
  没有下载、校验、替换、安装、重启或静默更新副作用。
- package version 从模板 0.0.1 校准为 `0.5.5-lynx.0`。真实 Lynxtron 自动检查成功：
  installed `0.5.5-lynx.0`、latest `0.6.2`、update available；截图
  `shots/2026-07-27/p4-x2/update-check.png`。误命中 8905 的 t3code client 后按 P-09 用
  PID/lsof 定位本实例 8906 并重拍，错误截图已覆盖。
- 验证：update+shell Rstest 5/5；scanner UpdatePage/updater/router 0 diagnostics；默认入口
  恢复 `/`，最终 build 575.4KB。04 P-20、能力表已更新。
- 下一步按 ID：**P4-X3 打包发行**，依赖 P4-X1 ✓。运行 `npm run pack` 产出 mac 安装包，
  做解包/启动冒烟；不发布、不签名、不上传。

### 2026-07-27 — P4-X3 完成；长程循环停止

- `slice/electron-builder.yml` 固化 `Synara Lynx`、`com.synara.lynx`、arm64 DMG、
  `synara://` URL scheme、确定性 artifact 名与 `identity:null`；package 补描述/作者，
  `npm run pack` 明确 `--publish never`。未使用凭证、未签名/公证、未上传。
- 最终产物：
  `slice/dist/Synara-Lynx-v0.5.5-lynx.0-darwin-arm64.dmg`（27 MiB），SHA-256
  `a203647f1c2629270c3cfba2cdadab1a56e25cbea74a1889a6d6d51be022a8f4`。
  `hdiutil verify` VALID；只读挂载确认 `Synara Lynx.app` + Applications link 后干净卸载；
  Info.plist identifier/version/scheme 正确，Mach-O 为 arm64。
- 首次生产启动 connector 可见但 session 为空：确认是 production 默认关闭 DevTool，不是
  bundle 失败。增加默认关闭的 `SYNARA_ENABLE_DEVTOOL=1` 诊断开关并重打；按 PID/lsof
  精确命中 8905 后，session URL 明确指向包内 `file://.../main.lynx.bundle`。
- 打包版连接同一 58090 Synara server，真实 Threads/Sidebar 数据渲染正常；截图
  `shots/2026-07-27/p4-x3/packaged-smoke.png`，console 仅 preload log、无应用错误。
  production ReactLynx tree 无 frame 是预期（Preact DevTools setup 被 strip），不作为失败。
- 最终构建：Lynx 575.4KB，desktop 690.0KB；仅既知 unsupported CSS 与 ws 可选 native
  extension 警告。打包/校验/挂载/启动各层均通过。详表：
  `slice/docs/p4-x3-packaging.md`。02 新增打包/签名差异；03 新增 D8 🟡；04 新增 P-21。
- **停止条件 b 触发**：全部依赖已满足的任务 completed。仅剩 P3-E5（依赖未决 D2 终端
  路径）与 P3-E6（依赖未决 D3 webview/PDF/浏览器路径）；两项均属不可代用户拍板的产品/
  架构决策。D8 只阻塞正式公开发行，不回滚已完成的本地 P4-X3。
- 建议恢复顺序：先拍 D2（推荐一期裁剪，或明确投入 native terminal），再确认 D3=c
  放弃 0.0.7 webview 兜底；若要对外分发，再提供 Apple Team/Developer ID/notarization
  方案处理 D8。

### 2026-07-27 — UI 移植路线复盘；新增 Phase 5–8

- 用户指出当前 UI 还原度低。复盘确认 P2–P4 的 slice 有意优先运行时/真实数据/功能验证，
  但 roadmap 缺少后续视觉与源码收敛阶段；“同数据 clean-room renderer”不应被当作最终
  UI port。
- D9 🟢：新主线为 compiler-driven port。普通屏幕从 Web route/subtree 直接进入 Lynx
  compiler，真实错误驱动最小 ports/UI primitive/style adapter；复制 JSX 到独立 Lynx
  页面不算复用。仅 terminal/PDF/browser/Lexical editing core 等硬岛允许 SPLIT/EXCLUSIVE。
- 新增 `plan/06-high-fidelity-port.md`：SHARED/PATCHED/SPLIT/EXCLUSIVE、eligible module+
  LOC reuse（目标 ≥70%）、同数据双尺寸/双主题 fidelity contract（布局锚点 ≤8px、字号
  ≤2px、semantic token 与差异 mask 规则）。
- `01-roadmap.md` 新增：
  - Phase 5 P5-R1~R5：复用审计、原树编译探针、同 API primitives、同源样式、门禁；
  - Phase 6 P6-C1~C6：六核心屏组件树迁移与重复实现收敛；
  - Phase 7 P7-I1~I5：桌面交互、overlay、resize/density、theme/motion、系统状态；
  - Phase 8 P8-Q1~Q4：脚手架清理、视觉认证矩阵、package 回归、完成报告。
- P3-E5/P3-E6 继续等待 D2/D3，但不阻塞 Phase 5–8 的普通 UI 主线。新循环下一任务：
  **P5-R1 复用审计 + fidelity contract**。
- 可直接启动完整新循环的 prompt 已写入
  `plan/07-high-fidelity-goal-prompt.md`；保留原主仓禁止 commit/fmt/lint/typecheck 与
  `bun run test` 约束，以及 PID 定位、多实例、权限/发布安全边界。

### 2026-07-27 — P5-R1 开始

- 目标：六核心屏 Web entry 依赖图、逐模块 SHARED/PATCHED/SPLIT/EXCLUSIVE、eligible
  module/LOC reuse 基线，以及可重复的 fidelity/豁免契约。
- 已重新读取总 goal、06 contract、两仓 AGENTS.md、design context 与 Lynx 官方
  `llms.txt`。本任务使用 audit skill 的系统性检查口径，但只产审计/工具/契约，不修 UI。
- 下一步：从主仓 route 与屏幕 composition 入口建立静态 import graph，核对 slice 对应
  renderer，先定义不靠文件名猜测的分类清单，再实现可重复生成脚本。

### 2026-07-27 — P5-R1 完成

- 六核心屏正式定为 Threads `/`、Thread `/$threadId`、Settings `/settings`、Projects
  overview `/kanban/`、Project Kanban `/kanban/$projectId`、Pull Requests
  `/pull-requests/`。新发现：Web 无 `/projects`；slice 的 `/projects` tile grid 是自建
  screen，已回填 02 🔀。
- 新增 `scripts/reuse-audit.mjs` + `plan/reuse-audit.config.json`：TypeScript AST 解析
  static/export/dynamic/require import，Web/Lynx 各自 extension resolution；逐模块 graph、
  token-aware non-comment LOC、目标 SHARED/PATCHED/SPLIT/EXCLUSIVE 与当前
  SHARED/PATCHED/UNMAPPED 分离；支持 write 与 `--check`。
- 生成 `plan/reports/p5-r1-reuse-baseline.{md,json}`。六屏 graph modules：
  Threads 305、Thread 586、Settings 348、Projects 388、Kanban 388、PR 381；eligible
  modules 分别 296/559/339/377/377/372。Lynx 入口图 32 modules。全部相对 TS/TSX import
  解析为 0 unresolved，分类数量闭合。
- 当前同物理源/确定性 patched TS/TSX numerator 为 0，因此六屏 module reuse、LOC reuse、
  gate 均为 **0%**。tokens.css 与 icon asset groundwork 不用于虚增 UI TS/TSX 指标。
- `plan/reports/p5-r1-interface-audit.md` 按 audit skill 落盘：2 critical/5 high/4 medium/
  3 low，28/100；核心不是 CSS polish，而是 duplicated composition、错误 IA 与缺 theme/
  interaction semantics。正向基础是实数据、ports、tokens 与诚实 side-by-side。
- `plan/templates/fidelity-notes.md` 固化两尺寸/主题、≤8px anchor、≤2px type、semantic
  tokens、≥70% reuse、逐项 exemption 与小范围 mask 规则。04 新增 P-22。
- 验证：`node scripts/reuse-audit.mjs --check` 通过；六屏/lynx unresolved=0；`git
diff --check` 通过。本任务只改 synara-lynx 审计/计划文件，主仓零改动。
- 下一任务：**P5-R2 原组件树 Lynx 编译探针 + 落点决策**。优先选择 Settings 的小型纯
  presentation subtree，必须由主仓同一物理 TSX 文件进入 Rspeedy，不复制 JSX；以真实
  compiler errors 决定最小 adapter 与 D7。

### 2026-07-27 — P5-R2 开始

- 任务状态置 in_progress。先审计 SettingsPanelPrimitives/SettingControls 等候选的真实
  import 与 intrinsic-element 面，选最小代表 subtree；探针必须由
  `/Users/bytedance/github/synara/apps/web/src/...` 的同一 realpath 编入 slice。
- 顺序：原样 alias/import → 保存 compiler/runtime failure → 最小 resolver/primitive
  adapter → build + Lynxtron 实机截图。不会复制候选 JSX，也不会先写新的近似组件。

### 2026-07-27 — P5-R2 完成

- 首次直接 import `SettingsPanelPrimitives`，Rspeedy 在 65.5s 后沿 Base UI Select 链失败：
  `@base-ui/utils/esm/reactVersion.js` 静态 import `React.version`，当前 ReactLynx compat
  surface 无此 export。没有用扩充伪 React API 掩盖问题，而是把共享边界缩到普通
  composition。
- 主仓新增同一物理 `components/settings/SettingsSection.tsx`，承载 section/title/card
  JSX、class recipe 与 props；Web 的 `SettingsSectionElements.tsx` 只渲染 DOM host
  elements，slice resolver 把同一无后缀 import 精确映射到
  `SettingsSectionElements.lynx.tsx`。既有 Web call-site 继续从
  `SettingsPanelPrimitives` re-export，零改动；未复制共享 JSX。
- 双端验证：slice `npm run build` 通过（Lynx 581.4kB）；主仓
  `apps/web` 的 `bun run build` 通过（8,755 modules）。未运行禁用的 fmt/lint/typecheck/
  `bun test`。
- `reuse-audit` 补齐 `@synara-web`/`~`/精确 element adapter 的 Lynx resolver 后，
  `--check` 通过，Lynx 图 37 modules、0 unresolved；SettingsSection 以 realpath 计
  SHARED。Settings gate=0.14%，诚实反映“一个小探针”而非提前宣称 70%。
- 生产 Lynxtron 必须按 P-21 用 `SYNARA_ENABLE_DEVTOOL=1` 才创建 session；PID 对应的
  独立 client 为 `localhost:8903`、session 1。实机截图正确显示 shared
  section/title/card，console 只有 preload startup、无渲染错误。只终止本轮 PID，未触碰
  用户在 8902 的 Lynxtron。
- D7 置 🟢=a：最终进入主仓 workspace，以保证共享重构、依赖与 CI 原子；当前 slice
  保留为可逆 staging，等 Phase 5 地基稳定后再迁移，不在本任务做大目录移动。备选 b
  仅在 Lynxtron 依赖无法纳入主仓时恢复，且必须 package 共享，不能复制 JSX。
- 产出：`slice/docs/p5-r2-compiler-probe.md`、P-23、compat Base UI 新证据、
  `shots/2026-07-27/port/p5-r2/shared-settings-probe/{lynx.png,notes.md,console.txt}`。
- 下一任务：**P5-R3 同 API UI primitives**。从 Web 现有 import/props surface 做 inventory，
  以 Settings shared subtree 作为第一个代表 call-site；平台差异放 suffix/resolver，
  保持 Web call-site 零改动。

### 2026-07-27 — P5-R3 开始

- 先对主仓 `components/ui` 与 slice 的 button/input/dialog/menu/tooltip/scroll/disclosure
  做 export、props、call-site inventory；用 Web 当前 API 作唯一契约。
- 实施顺序：选择代表 Web composition/call-site → 原样进入 Lynx compiler → 精确 alias/
  suffix 映射现有 P2-V3 primitive → 只补 compiler/runtime 证明需要的 props。不会把 Lynx
  fallback API 反向传播到普通 Web 调用点。

### 2026-07-27 — P5-R3 完成

- `lynx.config.ts` 在通用 `~` 前新增七个精确 canonical alias：button/input/dialog/menu/
  tooltip/scroll-area/collapsible。`PrimitivesPage` 全部改用 Web import path；不再依赖
  slice-relative path 或调用点 suffix。
- 补齐同 API 表面：Menu portal/create-handle；native ScrollArea + no-op ScrollBar；
  stateful Collapsible root/trigger/panel/content；Button render/type 与 click event façade；
  Input change/focus/blur 的 `target/currentTarget.value` façade。平台差异保持在 L2 leaf。
- 代表 call-site 是主仓原文件
  `components/settings/DebouncedSettingTextInput.tsx`，零修改进入 Lynx compiler；它自己的
  `~/components/ui/input` 被精确映射到 Lynx adapter。生产 Lynxtron 实机显示 controlled
  `Synara` 值，DOM inspection 有 bindfocus/bindblur，console 无 warning/error。
- `npm run build` 通过（Lynx 588.6kB；desktop total 703.2kB）。reuse audit resolver 同步
  复刻精确 aliases，避免把 Web primitive 误计 SHARED；`--check` 0 unresolved，
  unchanged DebouncedSettingTextInput 计真实 SHARED，Settings gate 0.14%→0.24%。
- Rstest 第一次错误传 `--run`（CLI 不支持）；之后 aggregate 与 focused suite、Node22
  三次均在 Rstest 生成的 lynx-ui vendor mjs 加载期报 `Invalid left-hand side in
assignment`，不是断言失败：其余五 files/13 tests 全过，失败 suite 0 tests started。
  已用 production build + real Lynxtron 分解验证，不再重复同一 loader 尝试。
- `/ui` 全 primitive 截图另遇既有 P-09 类 DevTool screenshot timeout（三次，session
  仍存在）；未把它作为通过证据。P5-R3 的实机退出证据使用可稳定截图的 unchanged Web
  input call-site。默认启动路由已恢复 `/`，只终止本轮 8903 PID，未触碰 8902 用户实例。
- 新增 P-24 与 DOM event/ScrollArea compat 记录。产出
  `slice/docs/p5-r3-ui-primitive-contract.md` 与
  `shots/2026-07-27/port/p5-r3/primitive-contract/{lynx.png,notes.md}`。
- 下一任务：**P5-R4 同源样式管线**。从六屏 graph 生成 core-screen class manifest，
  以真实出现次数测 Lynx utility 加权覆盖；补 semantic color/spacing/type 映射并建立新增
  差异 ratchet，不能用手写页面 CSS 代替。

### 2026-07-27 — P5-R4 开始

- 以 P5-R1 六屏模块图为输入，从真实 TS/TSX className/cva/cn 字符串生成 core-screen class
  manifest 与 occurrence 权重；不使用人工挑选 Top N。
- 先复用 P0-S3/P1-F6 已有 parser/报告方法，明确“可生成”“需 deterministic patch”“平台
  不支持”三类，再补 semantic color/spacing/type。目标 ≥95% 按 occurrence 加权，ratchet
  同时锁定未覆盖集合，禁止靠扩大排除项过线。

### 2026-07-27 — P5-R4 完成

- 新增 `scripts/style-audit.mjs`：从 P5-R1 六屏 eligible module union AST 提取 className、
  cn/cva/clsx/cx 与导出 class constants；逐 token 保存 files/screens/occurrences/runtime
  provenance。初次只扫 JSX 会漏 `settingsPanelStyles/sidebarRowStyles` 常量，已修正后重建
  最终基线。
- slice 固化 Tailwind 3.4.19 + `@lynx-js/tailwind-preset` 0.5.0 + PostCSS 8.5.6，
  `generate:styles/check:styles` 生成 manifest/report/runtime CSS。npm install 报 23 个 high
  transitive audit findings；未运行可能带 breaking changes 的 `npm audit fix`，后续发行
  安全审查单独处理。
- 最终覆盖：1,962 eligible utility tokens；10,816 extracted occurrences；逐项登记的
  platform-unsupported=577 后，eligible weighted=10,239；GENERATED=8,430、
  PATCHED=1,430，**coverage=96.30% ≥95%**；UNMAPPED=379 仍在 denominator。
  authored component classes=70/107 occurrences 独立归类，不冒充 utility。
- `plan/style-audit.baseline.json` 与 `--check` 同时锁：artifact freshness、95% floor、
  96.30% recorded coverage、unmapped weight/token、unsupported weight/token。新增失败不能
  通过扩大排除集静默吸收。
- 生成器补 semantic color/alpha、4px spacing、font family/size、desktop responsive 与
  `.ui-*` state selector；剥离 Lynx 不支持 property/selector；将 Web v4
  `--spacing(n)` 改为 px，并为 Tailwind transform 内部变量加 fallback。
  `lynx-overrides.css` 补齐 light semantic surface/text/border/status/sidebar concrete map。
- 重要 runtime 发现：直接发射未来六屏 full-union CSS 约 134kB，当前 DevTool DOM/screenshot
  连续错过 30s deadline。改为“全量审计、只按 reuse report 的 SHARED/PATCHED source
  发射”后，runtime artifact=65 classes/3.8kB，Lynx bundle=594.3kB；共享 Settings/Input
  实机稳定截图、console 无 warning/error。此模式记 P-25。
- build 只剩已有 `tokens.css color-scheme` 与某现有 `text-transform` encode warning，
  加上 desktop ws optional native addon warnings；生成 CSS 自身不再产生 selector/property/
  calc warning。
- 产出：`plan/reports/p5-r4-{core-class-manifest.json,style-coverage.md}`、
  `plan/style-audit.baseline.json`、`slice/src/generated/core-utilities.css`、
  `slice/docs/p5-r4-style-pipeline.md`、实机截图/notes。
- 下一任务：**P5-R5 复用率 + 视觉回归门禁**。以当前 shared Settings reference 扩大到
  ≥70% eligible source reuse，再实现同数据两尺寸 paired screenshot/anchor/type/color
  check；不能用这个 probe 的 0.24% reuse 或单张截图冒充 Phase 5 exit。

### 会话 #2 收尾（停止原因：上下文预算 + Phase 1 里程碑，按协议写交接）

- 本会话完成：P1-F1（七 port+66 文件切换）、P1-F2（185→34 区域外=0+lint 强制）、P1-F3（死层+shadcn 清理）、P1-F4（tokens.css）、P1-F5（React19 降级）、P1-F6（CSS ratchet）。全部 vitest 验证同基线（3015-3018/3026；失败均为预存集：ChatMarkdown favicon/theme-token 2 断言基线同败，MessagesTimeline/Sidebar.import 负载超时抖动）。
- **下一会话从 P2-V1 开始**（本目录 synara-lynx）：ReactLynx app 骨架=Rspeedy 工程+memory-history TanStack Router（isServer:false、URLSearchParams polyfill、react/compat alias——/compat 已证 startTransition 可用）+zustand+react-query+tokens.css。
  1. 可在 spikes/p0-s1/app 测试床上演进或新起 P2 目录；tokens.css 直接引用主仓 apps/web/src/tokens.css（F4 产物）。
  2. D4 已定：socket 用 @lynx-js/websocket 直连（P0-S2 数据；@lynx-js/websocket 已在依赖树）。
  3. 滚动跟随抄 P0-S4 模式（04 P-02✅：eventSource==SCROLL 门+BOTTOM_EPS+scrollToPosition）。
  4. Tailwind 走 D1=A：v3 preset + tokens 注入（P0-S3：主题色补齐 ~8%、utility 补丁 ~7%）。
  5. 主仓审查优先级：F1 的 port 接口形状（P2-V2 要对齐）、F2 的 oxlint overrides 分区、F5 的 useDebouncedValue(wait:100) 行为差异。
- 临时发现待跟进：P1-F3 的 fmt/lint/typecheck 未跑（用户审查时跑一遍）；F2 尾项 34>30 待 03 🟡 拍板；.synara-sxs/ 隔离目录可删。

### 2026-07-27 — P5-R5 开始

- 目标不是再做一张 slice 示意页，而是从 Web 真源抽出一个仍由真实 route 使用的 feature
  composition，让 Lynx 只替换 host element/control leaf；reference 的 eligible graph
  必须自动生成并以 min(module reuse, LOC reuse) ≥70% 失败门禁。
- 选择 `/settings?section=behavior` 的 route-owned Runtime behavior + Safety confirmations
  panel；完整 settings shell 已由依赖顺序交给 P6-C1/P6-C4。此保守可逆范围写入 D10 🟡，
  Web 截图保留 shell，不用 mask 隐藏尚未迁移区域。

### 2026-07-27 — P5-R5 完成

- 主仓新增同一物理 `SettingsBehaviorPanel.tsx`、`SettingsRow.tsx` 及两个最薄 Web host
  element 文件；真实 `_chat.settings.tsx` 的 Behavior route 改为消费该 shared panel。
  slice 只精确 alias `SettingsRowElements`/`SettingsSectionElements` 到 Lynx leaf，并用
  typed render slots 提供 Switch/Reset 控件；没有复制 panel/row JSX。
- `reuse-audit.mjs` 泛化为 screen-specific config + target enforcement。最终 reference：
  8 modules/524 LOC 全量 eligible，6 SHARED/468 LOC，2 SPLIT host leaf/56 LOC，module
  reuse=75%、LOC=89.31%、gate=**75% ≥70%**；生成报告与 `--check` 均通过。
- 样式调试先后定位两处真实陷阱：共享节点保留冲突 Web utility 后，含 `!important` 的
  Lynx 覆盖声明在 matched styles 中静默消失；改为 adapter 剥离角色不适用的 anatomy
  class + 普通 specificity（P-26）。显式 18px row line-height、10.5px padding、18px inline
  icon box 后，Web/Lynx row typography 与 geometry 同时对齐。
- 双尺寸最终证据：1280×820 与 1440×900 native window；Settings panel content-local 最大
  anchor delta=1.75px、最大 size delta=2.75px、font-size delta=0、row line-height
  delta=0、switch geometry delta=0；无未登记大色块，Lynx warning/error console 为空。
  reset 从文本 glyph 升级为生成器产出的 12px `Undo2Icon`。
- Lynxtron CLI 的 `--user-data-dir` 不会改变 `app.getPath('userData')`，所以首轮伪 1440
  实际仍是 1280；`Emulation.setDeviceMetricsOverride` 又明确返回 Not implemented。按
  P-27 备份实际 app window-state、改尺寸、CoreGraphics+DOM 双重验证、截图后 byte-for-byte
  恢复。只终止本轮 8903 PID，未触碰用户 8902 client。
- Web side-by-side dry-run 的 58090 已被既有隔离 server PID 5203 占用，因此保守复用同一
  `.synara-sxs` server，只启动本轮 8892 Vite frontend。Web RPC channel 在无 auth token
  下持续 warning；reference panel 不含 server-derived content，两侧固定 state 逐项记录，
  没有把连接 warning 当成功数据证据。Vite 只由本轮 session Ctrl-C 停止，未杀既有 server。
- 过程中的非代码失败均已分解：一次从 repo root 误跑 `npm run build`（无 package.json）、
  一次从 slice cwd 误跑 root generator、一次给 Rstest 传不支持的 `--run`；切换到记录的
  cwd/命令后成功。没有同一代码路径三连失败。
- 最终验证：主仓 `bun run build` 5/5 task pass（Web 8,758 modules）；slice `npm run
build` pass（Lynx 612.2kB、desktop 727.2kB）；focused shellRuntime 3/3；reference reuse
  check 75%；style check 当前 1,961 classes/10,208 eligible weighted/96.29%；两仓
  `git diff --check` pass。未运行禁用的 fmt/lint/typecheck/`bun test`，未提交。
- 产出：`slice/docs/p5-r5-fidelity-gate.md`、
  `plan/reports/p5-r5-reference-reuse.{md,json}`、
  `shots/2026-07-27/port/p5-r5/settings-behavior/{web-1280x820,lynx-1280x820,web-1440x900,lynx-1440x900,metrics,notes,console}.*`，
  compat 两条、D10、P-26/P-27。
- P5-R4 报告因真实主仓 source graph 在 P5-R5 后改变，当前 ratchet 快照为
  1,961/96.29%（不是回归：UNMAPPED weighted 仍 379）；roadmap/管线文档同步当前 artifact。
- 下一任务：**P6-C1 App shell + Sidebar + Threads**。直接从 Web shell/sidebar/thread-list
  entry 计算/收敛 graph，复用 P3-E3 真实 projection 与 P5 host-adapter/style 模式；先替换
  slice 诊断顶栏，再做两尺寸完整-screen side-by-side。

### 2026-07-27 — P6-C1 开始

- 依赖 P5-R5/P3-E3 均 completed。先盘点 Web shell/sidebar/thread-list 的真实 entry、
  现有纯 projection 与 slice `AppShell`/诊断导航的重复边界；优先提取可双端构建的外壳和
  thread row composition，平台 pointer/menu/scroll leaf 留在 SPLIT adapter。
- 第一验收切片：默认 `/` 不再显示 Ports/UI/Markdown 等诊断顶栏；真实 snapshot 驱动
  projects/threads，active/empty/loading 文案来自同源；随后才做完整两尺寸对比，不能用
  P3-E3 的独立 sidebar demo 代替 P6-C1。

### 2026-07-27 — P6-C1 心跳：共享 shell 第一批 + 双尺寸 Lynx

- 主仓把真实 Web call-site 的普通 composition 拆成物理共享源：
  `SidebarPrimaryActionRow`、`SidebarSegmentedPicker`、`SidebarListSectionHeader`、
  `CenteredEmptyLanding`；各自只把 DOM/Lynx host nodes 放在精确 `*Elements` adapter。
  `SynaraLogo` 复用 canonical path data，SVG host renderer 按平台 SPLIT。
- `Sidebar.tsx` 与 `ChatView.tsx` 均已消费这些共享源，Web 原行为/DOM class recipe 保持；
  slice 默认 `/` 去掉 Ports/UI/Markdown/Settings 诊断顶栏、fake brand/search、fake Local
  workspace identity 与 Updates，改用真实 actions/picker/landing 和 P3-E3 snapshot。
- 根据浏览器实测把 Lynx sidebar 从 clean-room 308px 改为 Web 的 **256px**。Web 1280
  基线同时测得 picker 232×27.25、action 244×28、30px cadence；两尺寸 Lynx 截图确认
  sidebar 物理宽 512px（DPR 2）且真实 projects/threads 正常。
- Lynx 1280×820 与 1440×900 native window 均由 DevTool `list-clients → list-sessions →
take-screenshot/get-console` 验证，console 只有 preload startup。第二尺寸按 P-27 暂改
  实际 window-state，截图后已恢复到原 1280×820；只 Ctrl-C 本轮 8903 process，未触碰
  用户 8902。
- Web baseline 证据限制：58090 上 PID 5203 是 17h+ 的 `.synara-pr84` 旧 server；当前
  frontend 的原生 WebSocket `/ws/bootstrap` 可以 open，但 Effect RPC channel 启动持续
  失败，页面停在 `Loading projects...`。分别在 8892 与 server 配置的 8891 验证仍相同，
  因此不能把 Web/Lynx 内容称为同 snapshot，也不能完成 P6-C1。没有终止既有 server。
- 当前 reuse（重新生成并 `--check`）：Threads 311 modules/76,462 LOC；eligible
  302/74,869；physical reuse 7 modules/345 LOC；module 2.32%、LOC/gate **0.46%**。
  P6-C1 不以此冒充 P6-C6 的六屏 ≥70% 收敛门；project/thread row 仍是下一共享切口。
- 验证：主仓 `apps/web bun run build` 通过（8,767 modules）；slice `npm run build`
  通过（Lynx 630.2kB、desktop total 745.2kB）；主仓 Sidebar focused test 99/99；
  style audit/check 1,960 classes、10,204 weighted、96.29%；reuse write/check 与两仓
  `git diff --check` 通过。
- 已分解且未重复的过程失败：CenteredEmptyLanding 首次错引 `composerStyles` 后改为
  `composerPickerStyles`；一次从主仓 root 传 focused test path 被 turbo 当 task，转到
  `apps/web` 后 99/99；一次在 synara-lynx root 跑 `npm run generate:styles`（无
  package.json），转到 slice 后成功；首次生产 Lynxtron 漏
  `SYNARA_ENABLE_DEVTOOL=1` 导致 client 无 session，立即按 P-21 重启后截图成功。
- 证据：
  `shots/2026-07-27/port/p6-c1/shared-shell-progress-final/{lynx.png,lynx-1440x900.png,notes.md}`；
  Web shell baseline 与明确限制：
  `shots/2026-07-27/port/p6-c1/web-baseline-1280x820/{web.png,web-same-server.png,web-1440x900-stale-server.png,notes.md}`。
- 下一步命令/切口：
  1. 从 Web `renderProjectItem`/thread row 抽离 presentation composition + exact host leaf，
     slice 删除 `AppSidebarProjectHeader/AppSidebarThread*` 重画层；
  2. 启动与当前源码同版本的新隔离 server 后重跑 05 两尺寸同 snapshot；58090 仍被旧 PID
     占用时不得杀进程或把 loading Web 图当通过；
  3. 补 center landing composer 外围 anchor（编辑器内核仍归 P6-C3），再计算完整
     shell/sidebar/content ≤8px/≤2px 检查单。

### 2026-07-27 — P6-C1 心跳：project/thread/app-frame 共享切口 + 审计收敛

- 主仓真实 call-site 继续抽出 `SidebarProjectSummary`、`SidebarThreadIdentity` 与
  `AppShellFrame` 三段物理共享 composition；Web 只保留 DOM element adapter，slice 用精确
  Lynx adapter。slice 删除 thread 的伪 “N messages” 第二行，并按 Web 单行 28px row anatomy
  渲染；标题栏/picker/nav/project cadence 收敛为 48/27/28px。
- reuse audit 修正一个真实 resolver bug：无扩展名生产 import 过去优先命中
  `.browser.tsx`，导致 route graph 混入 Vitest 且漏计生产 component；现改为 `.tsx/.ts`
  优先，显式 `.browser.tsx` 仍可精确解析。当前 Threads graph 322 modules/77,797 LOC，
  eligible 313/75,991；physical reuse 11 modules/551 LOC，gate **0.73%**。
- style audit 在 production graph 扩大后先触发旧 ratchet。没有直接放宽：修复
  `cn(...)` 条件表达式把 `startsWith("-")` 等条件字符串误收 utility；把生成后仅因 Lynx
  不支持 property 被剥空的 selector 正确归为 UNSUPPORTED；明确登记 child selector、
  text/list/user-select、line-clamp、overscroll、backdrop/resize 等平台语义。
  最终 2,256 tokens、13,128 eligible weighted、GENERATED+PATCHED=12,870，
  **98.03%**；UNMAPPED 478→258。随后才刷新 baseline，`generate/check:styles` 均通过。
- 最新 native 1280×820 DevTool 截图：
  `shots/2026-07-27/port/p6-c1/shared-shell-progress-final/lynx-shell-aligned.png`
  （2560×1576，DPR 2）；console 只有 preload startup。只 Ctrl-C 本轮 8903，未触碰用户
  8902；window-state 仍为原 1280×820。
- 验证：主仓 Web production build 通过（8,773 modules）；slice production build
  通过（Lynx 636.6kB、desktop 751.6kB）；reuse `--check`、style `--check`、两仓当前
  `git diff --check` 通过。focused browser Vitest 因本机缺 Playwright Chromium
  executable，在 0 tests started 前失败；不自动安装浏览器，以 production build +
  in-app-browser inspection 作为此切口证据。
- P6-C1 仍不能完成：58090 是不属于本轮的旧 `.synara-pr84` server，当前 Web frontend
  RPC 无法 hydrate；禁止杀 PID 5203，也不能把 loading 图包装成同数据 side-by-side。
  下一步继续可逆共享切口与 composer 外围 anchor；若无法取得同版本 server，则保留
  P6-C1 in_progress，不进入依赖它的 P6-C2/C4/C5。

### 2026-07-27 — P6-C1 心跳：空态组共享 + composer replacement anchor

- 主仓真实 `ChatView` 抽出 `CenteredEmptyLandingStack` + host-element adapter，原
  `chat-pane-enter` viewport 与 `flex w-full flex-col justify-center` 结构由 Web/Lynx 同一
  composition 消费；没有迁移 Lexical/editor 内核。
- slice 首页用该共享 stack 组合 canonical landing，并补一个明确不可提交的
  `LandingComposerPlaceholder`。它只负责 P6-C1 的 736×84px 外框、placeholder 与 footer
  anchor，P6-C3 将原位替换为真实 composer；没有把这个外观壳冒充输入功能。
- 最新截图
  `shots/2026-07-27/port/p6-c1/shared-shell-progress-final/lynx-with-composer-anchor.png`
  显示标题、composer 与 sidebar 在同一 1280×820 native frame；console 仍只有 preload
  startup。只终止本轮 8903，用户 8902 未触碰。
- 验证：Web build 8,775 modules pass；slice build pass（Lynx 639.4kB、desktop
  754.4kB）；reuse write/check pass，Threads physical reuse 12 modules/576 LOC、
  gate **0.76%**；style write/check 保持 98.03%；两仓 `git diff --check` pass。
- 尚未解除的唯一退出证据缺口仍是 Web 同版本同 snapshot paired capture；旧 58090
  进程不属于本轮，继续保持不终止。
- 同一最新切口另补
  `lynx-with-composer-anchor-1440x900.png`（2880×1736）；按 P-27 临时改实际 state 后已
  恢复为 `x224,y165,1280×820`。首次紧接启动的 `list-clients` 只看到 8902，链式
  screenshot 因超时中断；进程仍健康，单独重试发现 8903 并成功截图，不属于代码失败。

### 2026-07-27 — P6-C1 心跳：current-source 同 server 双尺寸证据

- 协议端口 58090 被不属于本轮的旧 `.synara-pr84` 占用；读 dev-runner 后确认 `--port`
  是 server port，显式端口不会自动避让。先按协议 dry-run，得到可逆替代：
  `.synara-sxs` 不变、server 58091、Web `[::1]:8892`。当前源码 server/Web 均正常 hydrate。
- Lynx 的 `process.env.SYNARA_WS_URL` 不会被普通 shell env 或 build env 注入（bundle 仍含
  58090）。为取得严格同 server 证据，只在 evidence build 临时把 fallback 改为 58091；
  两尺寸截图后立即恢复源码到 58090 并重新 build，已检查最终 bundle 只含 58090。
- 新 paired evidence：
  `shots/2026-07-27/port/p6-c1/current-paired/{web-1280x820,lynx-1280x820-current-server,web-1440x900,lynx-1440x900-current-server,notes}.png/md`。
  Sidebar 256px、picker/action cadence、composer 736px 居中宽度均对齐；console 只有 preload。
- 真实同 snapshot 揭示两个不能隐藏的缺口：Web 空态是 `No projects/chats yet`，Lynx 仍画
  synthetic Studio/Home count=0；Web 有 44px `New Chat` header，Lynx 缺失，导致中心组约
  半个 header 高度的 y 偏差。composer 内核仍按计划归 P6-C3。
- Browser viewport 已 reset、tab finalized；slice window-state 已恢复 1280×820；只停止
  本轮 58091/8892/8903。server shutdown 因一个 discovery Codex provider tree 的
  `captureComplete=false` 返回 code 1，但日志明确 rootExited=true、remaining descendants
  为空；端口均已释放。58090/8902 未触碰。
- P6-C1 仍 in_progress：paired evidence 阻塞已解除，但 header/content parity 与
  screen reuse 0.76%<70% 尚未满足。下一步必须回到 compiler-first 的大颗粒 Web entry
  复用，不能继续靠小型手写 Lynx 组件堆叠。

### 2026-07-27 — P6-C1 心跳：真实 section 语义 + full Sidebar 编译/运行分门禁

- 主仓新增物理共享 `SidebarProjectPartition.logic.ts`，Web 仍用原 authoritative
  Home/Studio/ordinary classifier，Lynx 从真实 snapshot 透传 `kind/workspaceRoot` 后消费
  同一 partition。Projects 不再显示 synthetic Home/Studio count=0；Chats 显示真实 Home
  container threads，Studio 保持独立 segment。focused Rstest **3/3** 通过。
- 主仓真实 `ChatView` 抽出 `ChatSurfaceHeaderFrame` + pure style recipe；Lynx 用精确
  host-element adapter，在默认首页补回 46px `New Chat` header 与 layout-neutral divider。
  最新默认实机证据：
  `shots/2026-07-27/port/p6-c1/current-fixes/{lynx-1280x820.png,notes.md}`；Home/Studio
  partition、header 与空态均生效，console 仅 preload startup。
- compiler-first 大颗粒探针直接 import 实际 6,503 行 Web `Sidebar.tsx`。首次失败于 Base
  UI 静态读取 `React.version`，compat shim 补 `18.3.1` 后继续；随后 xterm WebGL 进入
  PrimJS main-thread，定位到 `terminalRuntimeRegistry` 两条 import，改为 canonical import
  并精确 alias 到 Lynx no-op hard-island。之后完整 Sidebar **编译成功**（诊断 bundle
  3,609.2kB）。
- 实机 client `localhost:8905`/PID 91837 的 full-tree route 只显示空白 native surface，
  console 无 React exception；CoreGraphics 证据：
  `shots/2026-07-27/port/p6-c1/shared-web-sidebar-probe/window.png`。模板仍含 HTML
  `div/span/button`，且整树依赖 TanStack Router provider、Base UI、DOM/DnD；按 P-28
  判为 runtime paint 未过。没有进行第三次同构尝试。
- full-tree 诊断 import/route 已完全移除，memory history 恢复 `/`；不把不可见整树计入
  reuse。默认 production bundle 恢复 **644.0kB**（desktop total 759.0kB）。最新诚实
  audit：Threads 324 modules、eligible 315，gate **0.78%**。
- 验证：slice production build pass；focused Rstest 3/3；主仓 `bun run build` 5/5
  tasks pass（Web 8,779 modules；turbo 输出完成后 wrapper 未自行退出，仅 Ctrl-C 本轮
  build session）；两仓 `git diff --check` pass。只停止本轮 PID 91837 与 97083，
  未触碰用户 8902/8903、旧 58090 server。
- 决策 D11 🟡：下一步从 Web 真源抽 controller/view-model + 大粒度 presentation
  composition，host/L2/router callback/DnD/terminal 仅在叶子分流。不能以更多小 wrapper
  或诊断 import 堆复用率。
- 下一条精确工作：围绕 Web `Sidebar.tsx` 的 Projects/Chats render block 抽一个真实共享
  `SidebarThreadsSurface` view-model/renderer，使 Web call-site 保持现有数据与 handlers，
  Lynx 删除对应 section clean-room JSX；随后 build、focused test、reuse 与双尺寸 paired
  gate。

### 2026-07-27 — P6-C1 心跳：Projects/Chats section 真源抽取

- 主仓真实 Sidebar Projects/Chats render block 已抽为物理共享
  `SidebarProjectsSection.tsx` 与 `SidebarChatsSection.tsx`；Web 保留原 SpaceSwitcher、
  DnD/Sortable、toolbar、paging handlers 与 row renderer，通过 slot/callback 注入，结构、
  文案和行为不降级。host/Base UI anatomy 只在两个 `*Elements.tsx` 叶子。
- Lynx 删除原 Projects header/state/map 与 Chats header/state/map clean-room 分支，消费
  同一 generic row mapping、empty copy、disclosure/paging composition；精确 element
  adapters 映射到 view/text。`SidebarDefaults.logic.ts` 让两端共享 Chats 默认 collapsed。
- 首版用 keyed function-component Fragment 包 row，实机使整个 Sidebar 静默空白；
  `lynx-shared-projects-chats.png` 留作阴性证据。拆解后让 row renderer 把 key 放在真实根，
  first paint 恢复，形成 P-29。阳性证据：
  `shots/2026-07-27/port/p6-c1/current-fixes/{lynx-shared-projects-chats-v2.png,lynx-shared-sections-collapsed.png,notes.md}`。
- 验证：Web production build pass（8,783 modules）；slice production build pass
  （Lynx 650.9kB，desktop total 765.9kB）；focused sidebar Rstest 3/3；style
  generate/check 98.04%；两仓 `git diff --check` pass。只停止本轮 slice clients/PIDs，
  8902/8903 与 58090 未触碰。
- 最新诚实 reuse：Threads graph 329 modules、eligible 320；physical shared gate
  **0.91%**。增量是真实产品调用，但距离 70% 仍很远，P6-C1 保持 in_progress。
- 下一步必须继续扩大到 Sidebar shell/controller projection 与 thread-row surface，或实现
  有证据的确定性 host transform；不能把更多几十行 wrapper 当作达到 screen 复用目标。

### 2026-07-27 — P6-C1 心跳：拒绝 monolith 虚高复用

- Lynx projection 首次直接复用主仓 `Sidebar.logic.ts` 的 grouping + recent-sort。build
  通过，但该 1,519 行 module 的大量无关 imports 让 bundle 650.9kB→1,151.5kB；module
  audit 又把全文件计入分子，使 Threads gate 0.91%→**16.78%**。这不是足够精确的迁移
  口径，未当作成果。
- 把两端实际消费的两个 cohesive helper 抽到主仓
  `SidebarProjection.logic.ts`，原 `Sidebar.logic.ts` re-export，Web call-site 不变；
  slice 直接消费小模块并删除自己的 grouping/sort loop。最终 bundle 恢复
  **650.9kB**，诚实 Threads gate **0.94%**，形成 P-30。
- 这说明 P6-C1 的 70% 不能靠“导入大 controller module”达成；后续必须真的把大块
  controller/view-model/presentation 移入 cohesive shared modules，或改进审计到 export/
  chunk 级后再评估。

### 2026-07-27 — P6-C1 心跳：共享 chat header identity

- 主仓 `ChatHeader` 把 provider/terminal glyph、标题、rename 与 sidechat suffix 的普通
  composition 抽为物理共享 `ChatSurfaceHeaderIdentity`；Web DOM anatomy 留在精确
  `*Elements` adapter。slice 首页删除独立标题节点，消费同一个 identity，并以 Lynx
  `<svg content>` 渲染 Simple Icons 的原始 OpenAI path。
- 默认 1280×820 实机证据：
  `shots/2026-07-27/port/p6-c1/current-fixes/lynx-shared-header-identity.png`。Header glyph/title、
  Projects 居中空态与其余 Sidebar 同时完成 first paint。当前源码 Web 另以 Browser
  捕获 `web-shared-header-identity-dark.png`；它继承用户 dark theme，只证明当前组合已在
  Web 真调用点生效，不替代 `current-paired/` 的同 theme 双尺寸 gate。
- DevTool production console 留下一条 main-thread `not a function` 启动快照异常；画面与
  多枚 SVG 均正常，production bundle 又无 Preact component-tree channel，当前不能可靠
  归到新 SVG 或共享 wrapper。按保守原则记录为未归因非阻断诊断，不把 console 写成 clean，
  也不凭无来源栈撤回已通过的可见共享结构。
- 验证：主仓 Web production build pass（8,787 modules）；slice production build pass
  （Lynx 657.1kB、desktop total 772.1kB）；Sidebar logic Rstest **99/99**；reuse write
  保持诚实 Threads **0.94%**；style generate/check 2,256 classes、13,131 weighted、
  **98.04%**；两仓 `git diff --check` pass。只 Ctrl-C 本轮 8903/PID 43426，用户 8902 与
  58090 server 未触碰。
- 下一切口：提取 Sidebar shell/primary-navigation 与 thread-row outer anatomy 的真实
  presentation composition；Lynx 只保留 event/scroll/icon host leaf。不要再用几十行
  identity wrapper 当作 70% 的主要进度。

### 2026-07-27 — P6-C1 心跳：共享 primary navigation

- 主仓新增物理共享 `SidebarPrimaryNavigation`：Workspace/Studio/Threads 三种真实 item
  集合继续由 Web controller 注入，统一 mapping、active/disabled、shortcut/badge precedence
  与 `SidebarPrimaryActionRow` 调用点；Web group/menu/Kbd 与 Lynx view/text 只留在精确
  `*Elements` adapter。
- slice 删除五个独立 row 调用，改为同一个 declarative item contract；Settings footer
  仍复用原 `SidebarPrimaryActionRow`。实机
  `current-fixes/lynx-shared-primary-navigation.png` 显示五行、⌘K、disabled tone 与其余
  Sidebar 同时 first paint，未重现 keyed Fragment blank。production main-thread 的同一条
  未归因 `not a function` 启动异常仍存在，故与本切口前后一致记录。
- 验证：Web build pass（8,789 modules）；slice build pass（Lynx 659.0kB、desktop total
  774.0kB）；Sidebar logic Rstest 99/99；两仓 `git diff --check` pass。只停止本轮 8903/
  PID 25970；启动时用户 8902 已自行消失，本轮没有终止其他 client/server。
- 诚实 reuse：Threads graph 332 modules、eligible 323；shared navigation 与 identity
  使 gate **1.02%**。仍远低于 70%，P6-C1 保持 in_progress。
- 首次把 reuse audit 与 style write/check 并行时，style check 跨到 reuse report 替换，
  报 manifest stale；reuse 完成后串行两次 style write hash 一致，随后 check 通过并恢复
  2,256 classes/13,131 weighted/**98.04%**。形成 P-31；后续两个生成型 audit 串行。
- 对 main-thread 异常做了两个单变量 production rebuild：先只把 OpenAI `<svg content>`
  换成空 view，再把整个 `ChatSurfaceHeaderIdentity` 换成直接 text；两次仍是完全相同的
  `renderPage` 栈。因此排除新 SVG path 与共享 header wrapper 为根因，正式实现均已恢复并
  最终重建。异常继续作为独立 runtime diagnostic，不阻塞已可见的共享切口。

### 2026-07-27 — P6-C1 阴性探针：大 ReactNode slot frame 已撤回

- 尝试把 Web/Lynx Sidebar 的 Header、Content、Footer 顺序提成共享
  `SidebarSurfaceFrame`。Web 保留原 primitives，Lynx adapter 给真实 `AppSidebar` view；
  两端 build 与 Sidebar Rstest 99/99 均通过。
- 实机 `current-fixes/lynx-shared-sidebar-surface-frame.png` 仍是整面静默白屏，说明三个
  opaque 大 ReactNode subtree 作为 props 穿过额外 function-component snapshot boundary
  不可用；不是缺真实根节点的问题。只做一次同构尝试即停止，没有三连失败。
- 产品集成、alias、audit 分类与三个 probe 文件均已移除，回到已通过的 shared primary
  navigation 版本；阴性截图、compat 行和 P-32 保留。下一切口必须共享 controller data +
  direct composition，不能用“slot 排序 wrapper”伪装大颗粒复用。

### 2026-07-27 — P6-C1 心跳：共享 thread-row presentation

- 主仓 `SidebarThreadRowContent` 把 leading identity、共享 title/pending identity 与 suffix
  的顺序抽到物理共享 `SidebarThreadRowPresentation`；Web 原有 provider/terminal/subagent
  controller、tooltip 与 row event surface 全部保留在原层，不改变行为。
- slice 的 Projects/Chats 两类 row 删除各自的 dot+identity 顺序副本，消费同一个共享
  presentation；真实 clickable `<view>` 与 navigate callback 继续由 Lynx renderer 持有，
  未重试 P-32 的大 surface slot。
- 当前 58090 snapshot 没有可见 row，因此先用临时静态 row 强制命中 production component。
  实机 `current-fixes/lynx-shared-thread-row-presentation-fixture.png` 同时绘制 dot、标题与整页；
  fixture 随即删除。最终源码/production bundle 均不含假数据。
- 验证：fixture 恢复后的 slice production build pass（Lynx **659.9kB**、desktop total
  **774.9kB**）；Web production build
  5/5 tasks pass、8,790 modules；Sidebar focused Rstest **99/99**；reuse 串行 write/check
  为 Threads 333 graph modules、324 eligible、gate **1.06%**；style 串行 write/check
  2,256 classes、13,131 weighted、**98.04%**；两仓 diff check pass。首次 scoped test
  命令把 `--run` 误传给 turbo，立即改为在 `apps/web` 直接执行 `bun run test
src/components/Sidebar.logic.test.ts`，不是代码失败。
- P6-C1 仍 in_progress。下一步不能继续把几十行 leaf composition 当主进度；应从 Web
  Sidebar 的 project/chat row controller 中抽 cohesive row view-model（active/status/
  provider/subagent/meta discriminants）并让两端直接 composition，或把 shell route-owned
  controller 拆成可由 Lynx 真消费的模块。

### 2026-07-27 — P6-C1 心跳：共享 row model + Sidebar UI state

- 主仓新增纯 `SidebarThreadRowModel.logic.ts`，统一 active/selected/highlight、subagent、
  0–30px indent、temporary glyph、compact meta 与 chat/project hover scope。Web
  `renderThreadRow` 删除对应散落推导，slice Projects/Chats row 同时消费；focused tests
  新增 3 cases，总计 **107/107**（Sidebar logic + row model + uiState）。
- slice Chats disclosure 不再只用本地 `useState` 默认值：通过原 Web
  `Sidebar.uiState.ts` 读取/写回相同 v1 schema，只有 `~/platform/storage` 与
  `~/platform/env` 精确 alias 到 Lynx L1。首次把共享模块静态 import 到 UI 时，编译器
  正确报 `background-only cannot be imported from a main-thread module`；按既有 P-16 改为
  background async function 内 eager dynamic import 后 build 通过。该次是边界诊断，
  不是产品代码失败。
- runtime `lynx-shared-row-model-ui-state.png` 完整 first paint；host log 明确出现
  `bridge.storageDump {}`，证明共享 uiState 的读取路径真的命中持久化 mirror，而非只编译。
  原 production main-thread `not a function` LogBox 仍在，未新增第二类异常。
- 验证：slice production build pass（Lynx **664.7kB**、desktop total **779.7kB**）；
  Web scoped production build pass（8,791 modules）；focused Rstest **107/107**；
  reuse 串行 write/check：Threads 334 graph、325 eligible、gate **1.38%**；style 串行
  write/check保持 2,256 classes/13,131 weighted/**98.04%**。只停止本轮 PID 42471，
  58090 与用户 8902 未触碰。
- 下一步仍应扩大 cohesive controller/presentation，而非以 UI state 的 172 LOC 增量宣称
  接近 70%。优先把 Web Projects/Chats row preview/paging model 从 `Sidebar.tsx` 抽为
  真共享 controller，slice 用同一 preview limits 与 persisted extra-pages 数据。

### 2026-07-27 — P6-C1 心跳：共享 thread preview/paging controller

- 把 Web `Sidebar.logic.ts` 中 preview paging、active row reveal、parent/child tree 与
  root→active forced-visible path 抽为 cohesive `SidebarThreadPaging.logic.ts`；原 exports
  保持 wrapper 兼容，Web 常量改用共享 5/5 limit/page-size，107 个既有 focused tests 全过。
- slice Chats 现在同样调用 `resolveSidebarThreadListPaging` +
  `getVisibleThreadsForProject`，并把 `chatThreadListExtraPages` 与 disclosure 一起写回原
  `Sidebar.uiState`。当前 snapshot 没有 chat rows，因此没有伪造 Show more 截图；controller
  在每次 render 对真实 0-row snapshot 实际执行，非诊断 import。
- 验证：slice build pass（Lynx **667.1kB**、desktop total **782.1kB**）；Web scoped build
  pass（8,792 modules）；focused Rstest **107/107**；reuse 串行 write/check为 Threads
  335 graph、326 eligible、gate **1.57%**；style 串行 write/check维持
  2,256/13,131/**98.04%**。两端没有新增 hard island 或 compat 差异。
- 这仍然是 controller 真迁移而非 screen 收口。下一条高价值切口应共享 Projects 的
  collapse/paging view-model 与 `Sidebar.uiState.projectThreadListExtraPagesByCwd`；需要先让
  Lynx snapshot projection 保留真实 `workspaceRoot`，避免错误地以 project id 充当 cwd key。

### 2026-07-27 — P6-C1 心跳：Projects paging + 共享 pagination

- Lynx `SidebarProjectGroup` 现在保留 snapshot 的真实 `workspaceRoot`；新纯
  `SidebarProjectPaging.logic.ts` 把 cwd normalization 从带 storage port 的 uiState module
  拆出，Web API 仍 re-export。Projects 与 Chats 均用共享 5+5 paging controller，project
  extra-pages 按与 Web 相同的 normalized cwd key 持久化；orphan 空 cwd 只保留当前会话，
  codec 会保守丢弃空 key。
- Web Projects 原来的 60 行 Show more/less JSX 与 Chats pagination 合并成物理共享
  `SidebarThreadPagination`。Web host adapter 的 `nested` variant 保留原
  SidebarMenuSubItem/Button、class、focus mouse-down 与 selection-safe 属性；Lynx adapter
  复用 view/text action。
- 当前 snapshot 不足 6 rows，按 P-33 临时插入 canShowMore+canShowLess fixture 实机确认两
  action 与整页同时绘制：
  `current-fixes/lynx-shared-thread-pagination-fixture.png`。fixture 已删除并最终重建，无假
  pagination 留在产品。
- 验证：Web build pass（8,794 modules），main focused Rstest **107/107**；slice
  sidebar projection Rstest **3/3**；最终 slice build **669.6kB**、desktop total
  **784.6kB**；reuse 串行 write/check Threads **1.60%**（337 graph/328 eligible）；
  style 2,256/13,131/**98.04%**；两仓 diff check pass。只停止本轮 PID 34904。
- 下一步必须上升到更大 composition/controller：Projects collapse state 仍是 Lynx 本地
  `Set<id>`，Web authority 是 project expanded state + disclosure motion；thread provider/
  subagent/status/meta 也只有 row model/identity 部分共享。二者择其一继续，不新增小图标层。

### 2026-07-27 — P6-C1 心跳：Projects disclosure 真源 + main-thread 异常清零

- 确认协议真相：`OrchestrationProject` 本来就不含 renderer-only `expanded`；Web 的权威是
  `storePersistence.ts` 中 `synara:renderer-state:v8` 的 normalized cwd 集合，由
  `storeNormalization` 合并到 renderer `Project`。因此没有扩 RPC，也没有把 Lynx 本地
  `Set<id>` 固化成第二套状态。
- 主仓 `storePersistence` 抽出可独立消费的 project expansion read/write API，原 Web
  `readPersistedState`/`persistState` 也回用同一 parser/writer；slice 通过 P-16 background
  eager import 原物理模块，删除 `collapsed Set<id>`，展开/折叠和跨启动持久化均改用同一
  normalized cwd document。host 日志再次命中真实 `bridge.storageDump`。
- DevTool 终于给长期非阻断 `not a function` 命名栈：
  `sortSidebarRowsByUpdatedAt` 在 PrimJS main thread 调用了不存在的 `toSorted`。共享 helper
  改为等价不可变 `[...rows].sort(...)`；重新 open 同一 5971 bundle 后 `get-console` 为空，
  形成 P-34。此前两次 SVG/header 阴性探针判断正确，它们与异常无关。
- 证据：
  `shots/2026-07-27/port/p6-c1/current-fixes/lynx-shared-project-disclosure-persistence.png`。
  当前 server snapshot 无 project row，所以该图证明共享初始化、页面 first paint 与 clean
  console，不冒充 disclosure tap 视觉证据。
- 验证：主仓 focused Vitest **122/122**，Web production build **8,794 modules**；
  slice projection Rstest **3/3**，production build Lynx **671.8kB**、desktop total
  **786.8kB**；reuse 串行 write/check Threads **2.33%**（337 graph/328 eligible）；
  style 串行 write/check **2,256/13,131/98.04%**；只停止本轮明确 PID/8903/5971，用户
  8902 与 58090 未终止。
- P6-C1 仍 in_progress：2.33% 离 70% 很远。下一刀应把 thread provider/subagent/status/
  meta 的输入投影与可见 row composition 整块共享，或提取更大的 route-owned Sidebar
  controller；不继续新增几十行 leaf wrapper。

### 2026-07-27 — P6-C1 心跳：真实 subagent identity 字段 + 轻量共享核心

- slice 的 snapshot/query 不再丢弃 `parentThreadId`、subagent agent/nickname/role、
  fork/sidechat、handoff 与 provider 字段；row model 现在收到真实 parent/sidechat 输入。
  主仓把 subagent nickname/role/title normalization、worker-tier suppression、deterministic
  accent 抽到 `SidebarThreadSubagentModel.logic.ts`，原 `lib/subagentPresentation` 反向复用，
  不产生第二套算法。
- 新物理共享 `SidebarThreadSubagentIdentity` 同时拥有 connector 与 primary/supporting label
  composition；Web `SidebarThreadRowContent` 删除原 inline connector/label，slice Projects/
  Chats row 同样消费。host adapter 仅保留 span 对 view/text 与必要 CSS。
- 阴性依赖探针：共享组件首次直接 import 聚合 `lib/subagentPresentation`，slice bundle
  **671.8→1185.1kB**，原因是无关 parent activity directory/model formatting 链。立即按
  P-30 拆轻量核心；最终 fixture-free bundle **681.6kB**，没有接受虚高 graph/bundle。
- 当前 snapshot 无 row，临时静态 `Halley (explorer)` 强制命中 connector/accent/role；
  DevTool 截图 `current-fixes/lynx-shared-subagent-identity-fixture.png` 可见且 console 无
  exception。fixture 随即删除，源码 `rg` 0 命中并最终重建。
- 验证：主仓 subagent + Sidebar focused Vitest **118/118**，Web production build
  **8,797 modules**；slice 两文件 Rstest **6/6**，production **681.6kB / 796.6kB**；
  reuse 串行 write/check Threads **2.66%**（340 graph/331 eligible）；style 串行
  **2,256/13,131/98.04%**；本轮 slice 5971/8903 明确 PID 已停止，用户 8902/58090 未动。
- P6-C1 仍 in_progress。provider/handoff/terminal/status/meta presentation 尚未进入 Lynx；
  下一刀应以同样 discriminated model + lightweight composition 处理 provider/handoff
  leading identity，避免直接 import Web `ProviderIcon`/Tooltip 聚合链。

### 2026-07-27 — P6-C1 心跳：共享 provider/handoff identity + 主仓 SVG 真源

- 主仓新增轻量 `SidebarThreadProviderIdentity`，统一 generic-title visibility、单 provider
  与 source→target handoff composition；Web `SidebarThreadRowContent` 删除原 inline
  provider avatar anatomy，保留既有 terminal badge/tooltip 外壳并通过 Web host adapter
  继续使用 `ProviderIcon`。
- slice query 现在把 snapshot 的 provider 与 handoff source provider 送入同一共享
  composition。Lynx host adapter 不 import DOM-oriented icon registry，而是直接消费主仓
  `central-icons-fill` 中 Codex/OpenAI、Claude、Cursor、Antigravity、Grok、OpenCode 的
  raw SVG；主仓没有 Droid/Kilo/Pi 资产，保守使用 provider 名首字母，不另造近似 icon。
  raw SVG 是物理资源复用，但审计只计 TS/TSX，未把 asset 字节算进代码复用率。
- 当前 snapshot 无真实 row，临时 Codex single-provider 与 Claude→Codex handoff fixture
  实机命中两分支；`current-fixes/lynx-shared-provider-handoff-fixture.png` 可见真实 glyph，
  console 仅 startup/debugmetadata。fixture 随即删除，源码 `rg` 0 命中并最终重建。
- 验证：主仓 ProviderIcon + Sidebar + subagent focused Vitest **117/117**，Web production
  build **8,799 modules**；slice fixture-free production **703.7kB / 818.7kB**；reuse 串行
  write/check Threads **3.70%**（342 graph/333 eligible）；style 串行 write/check
  **2,257/13,142/98.03%**；两仓 `git diff --check` 通过。
- P6-C1 仍 in_progress：3.70% 离 70% 很远。下一刀应共享 thread status/meta/terminal
  discriminants 或更大 route-owned controller，继续避免只抽几十行纯装饰 wrapper。

### 2026-07-27 — P6-C1 心跳：共享 thread status/meta discriminants

- 主仓把 automation→handoff→fork→worktree 的稳定顺序、handoff-avatar 去重与 sidechat-fork
  抑制抽到 `SidebarThreadMetaModel.logic`；原 Web renderer 反向消费该模型，再映射为既有
  tooltip/icon chip。新增 `SidebarThreadStatusIndicator` 统一 completed/running/dot 分支，
  Web host adapter 保留 CentralIcon/真实 spinner。
- slice 用真实 `live`、`forkSourceThreadId`、`sidechatSourceThreadId`、handoff 字段消费同一
  meta/status 模型，Lynx adapter 只负责 view/text/CSS。临时 fork + live fixture 实机可见
  绿色 fork glyph 与蓝色 running dot；证据
  `current-fixes/lynx-shared-status-meta-fixture.png`，console 无 exception。fixture 删除后
  `rg` 0 命中并完成 fixture-free build。
- 一个精度级 style ratchet 检出 Web provider handoff 的 Tailwind v4 `w-4.5` 未被 Lynx
  v3 preset 生成；未放宽 baseline，改为等价 `w-[18px]`，最终 coverage 从 98.03% 回升
  **98.04%**，unmapped weighted 恢复 258。
- 验证：主仓 meta model + Sidebar Vitest **101/101**，Web production build
  **8,802 modules**；slice sidebar Rstest **3/3**，fixture-free production
  **711.4kB / 826.4kB**；reuse 串行 write/check Threads **3.96%**
  （345 graph/336 eligible）；style 串行 write/check
  **2,256/13,142/98.04%**；两仓 `git diff --check` 通过。只停止本轮 5971/8903，
  用户 8902 与 58090 未动。
- P6-C1 仍 in_progress。下一刀必须转向更大 route-owned Sidebar controller/surface，
  或把 shell restore/create route 逻辑作为完整共享切片；继续堆 leaf glyph 无法接近 70%。

### 2026-07-27 — P6-C1 心跳：共享 cold-start restore/create controller

- 主仓把 `RestoreOrCreateChatRoute` 中 empty-bootstrap recovery、remembered route gate、
  refresh+delay、navigate/fresh fallback 与 fresh-chat single-flight 抽为物理共享
  `useRestoreOrCreateChatRouteController`；Web wrapper 只注入 TanStack navigate、原 stores、
  native snapshot refresh 与 Splash surface，行为未复制。
- slice 根路由现在读取原 `Sidebar.uiState.lastThreadRoute`、用真实 thread query 校验 id，
  通过 memory history replace 恢复；Sidebar 打开 thread 时也写回同一 schema。当前 server
  snapshot 为空，实机命中 remembered-route 的 refresh/delay/fresh fallback 后仍稳定首屏，
  `current-fixes/lynx-shared-route-restore-controller.png` 可见，console 只有
  startup/debugmetadata，无循环 render 或 exception。
- 验证：主仓 route restore/recovery/meta Vitest **10/10**，Web production
  **8,803 modules**；slice production **716.3kB / 831.3kB**；reuse 串行 write/check
  Threads **4.14%**（346 graph/337 eligible）；style 串行 write/check
  **2,256/13,142/98.04%**；两仓 `git diff --check` 通过。只停止本轮 5971/8903，用户
  8902 与 58090 未动。
- P6-C1 仍 in_progress。route controller 已证明可用，但 4.14% 离 70% 仍远；下一步继续
  拆 route-owned shell/Sidebar controller 的大块真实调用，而非回到叶子组件。

### 2026-07-27 — P6-C1 心跳：主仓 normalized store projection 在 Lynx background 跑通

- slice `fetchSidebarSnapshot` 不再直接手写 raw snapshot→row mapping；完整 read model
  现在进入主仓 `syncServerReadModel(initialState, snapshot)`，从 normalized projects 与
  `sidebarThreadSummaryById` 生成轻量 query result。session/provider/subagent/handoff/live/
  pinned/message-count 均来自同一主仓 projection 语义，跨线程不传完整 `AppState`。
- 第一次 build 暴露 `storeNormalization → wsHttpUrl` 需要 Lynx env port 的
  `getLocationOrigin`，补为明确 58090 fallback；第一次实机又暴露 PrimJS
  `TextEncoder is not defined`。新增 entry-first 纯 UTF-8 TextEncoder/TextDecoder
  polyfill，ASCII/CJK/astral 与标准 byte sequence Rstest **2/2**。这只解除编码器阻塞，
  不撤销 P2-V6 对完整 Effect lazy RPC adapter 的独立 🔀 结论。
- 修复后同一 58090 snapshot 实机恢复 `No projects yet`/Chats 首屏；
  `current-fixes/lynx-main-store-projection.png` 为最终证据，DevTool console 只有
  startup/debugmetadata。bundle 从 **716.3→1003.5kB**，但对应真正执行的 store
  normalization/projection，而非空 import。
- 验证：slice UTF-8 + Sidebar Rstest **5/5**，fixture-free production
  **1003.5kB / 1118.5kB**；reuse 串行 write/check Threads **13.65%**
  （59 shared modules / 10,469 LOC；346 graph/337 eligible）；style 串行 write/check
  **2,256/13,142/98.04%**；两仓 `git diff --check` 通过。只停止本轮 5971/8903，
  用户 8902 与 58090 未动。
- P6-C1 仍 in_progress：13.65% 是首个结构性跃迁，但仍小于 70%。下一步应让 Sidebar
  controller/selector 直接消费 normalized state 的更多主仓物理模块，逐步删除 slice
  `deriveSidebarSections` 与重复 query projection，而不是再引入大文件只取一两个 export。

### 2026-07-27 — P6-C1 心跳：attention sort + parent/child tree 的 portable leaf

- slice Sidebar 现在使用主仓 attention/timestamp sort 语义与原
  `buildProjectThreadTree`，Projects/Chats 不再只按 updatedAt 平铺；normalized snapshot
  按 canonical `threadIds` 读取 summary，归档过滤仍来自同一 normalized state。
- 第一轮直接引用 `Sidebar.logic` + eager `storeSelectors`：tests/build 通过、审计曾到
  22.80%，但实机模板解码 `Context construct failed`，bundle 1003.5→1293.1kB，判定失败
  并撤销。随后抽 `SidebarThreadSort.logic`，再把 latest-turn predicate 从
  `session-logic/workLog` 大图抽到 `sessionActivity.logic`；Web 原 API re-export 不变。
  bundle 回落为 **1008.7 / 1123.7kB**。
- 保留实现首次实机由 DevTool named stack 捕获 PrimJS main-thread `toSorted` 缺失，改为
  `[...items].sort` 后 `lynx-shared-sidebar-controller.png` 正常绘制，HMR offset 后 console
  无新 exception。主仓 Sidebar+session tests **134/134**，slice scoped **8/8**，Web
  production **8,805 modules**。
- 审计器会沿 `import type` 计图；初版 portable sort 因大类型 import 虚高到 20.39%。
  改为最小结构类型后 reuse 串行 write/check Threads **13.92%**（61 shared modules /
  10,672 LOC；348 graph/339 eligible）；style 串行 write/check仍为
  **2,256/13,142/98.04%**。两仓待最后 `git diff --check`。
- 环境说明：为定位不可见窗口曾用 System Events 置前，macOS 弹出“ChatGPT 访问其他 App
  数据”权限框，未点击。清理端口时误把 PID 65818 识别为本轮 app，执行前输出随后显示它
  实为 t3code worktree 的 Lynxtron；该进程被误停一次，可能需其 supervisor 重启。这是
  本轮唯一越界清理，后续已改为先核验完整 command path 再 kill；58090 与用户 8902 未动。
- P6-C1 仍 in_progress：13.92%<70%。下一刀应抽 Web Sidebar 的 project/chat section
  controller data（排序、partition、paging、tree 一次完成）并让两端调用；不要再把聚合
  单体或 type-only 大图直接塞进 Lynx。

### 2026-07-27 — P6-C1 心跳：shared section collections controller

- 新增主仓 `SidebarSections.logic.ts`：一次产出 raw/sorted thread maps、project sort、
  project/chat/studio partition、chat/studio flatten 与 orphan rows；保留 Web
  `projectSortThreads=root-only`、`treeThreads=含 subagent` 的原差异。
- Web `Sidebar.tsx` 删除四段独立 grouping/sorting/partition useMemo，chat/studio tree
  直接消费 controller rows；slice `sidebar.logic.ts` 删除同类组合，只保留 transport DTO
  到 Web-shaped structural input 的薄适配。
- 验证：主仓 Sidebar Vitest **99/99**，Web production **8,806 modules**；slice Sidebar
  **3/3**，production **1010.6/1125.6kB**；最新 8904 DevTool session 正常绘制并覆盖
  `lynx-shared-sidebar-controller.png`，console 只有 startup/debugmetadata。reuse 串行
  write/check Threads **14.00%**（62 modules / 10,748 LOC；349 graph/340 eligible）。
- 只停止本轮 PID 54524（执行前已核验 path 为 synara-lynx/slice）与 5971；t3code
  supervisor 已恢复其 8903，用户 8902/58090 未动。P6-C1 仍 in_progress；下一步可把
  project/chat paging + disclosure state 也并入共享 controller，进一步删除 slice
  `Sidebar.lynx.tsx` 中的 orchestration。

### 2026-07-27 — P6-C1 心跳：shared per-project rows core

- 新增主仓 `SidebarProjectRows.logic.ts`，抽出 collapsed active reveal、parent/child tree、
  root-aware preview、paging clamp 与 show-more 判定；pinned filter 与 status aggregation
  通过 callback 注入，避免 portable core 再拖入 `Sidebar.logic` 单体。
- Web `deriveSidebarProjectData` 保持原 export/类型与所有调用点，只变成注入原 pinned/status
  语义的 wrapper；slice project render 改为一次 `deriveSidebarProjectRows` map，删除
  flat-first 截断和每行重复 paging/tree 组合。Chats 也已改为 tree-first/root-aware preview。
- 验证：主仓 Sidebar **99/99**，Web production **8,807 modules**；slice Sidebar **3/3**，production
  **1014.8/1129.8kB**；reuse 串行 write/check Threads **14.16%**
  （63 modules / 10,875 LOC；350 graph/341 eligible）。
- P6-C1 仍 in_progress：14.16%<70%。下一步优先把 chat paging 与 persistence transitions
  抽成同一 controller，之后转向共享 project/chat row presentation composition；不要继续
  只加叶子 helper。

### 2026-07-27 — P6-C1 上下文交接（23:52）

- 当前源状态已落盘，无本轮 5971/8904 进程；58090、用户 8902 与 t3code supervisor 8903
  保持运行。最新 `lynx-shared-sidebar-controller.png` 是 section controller 版本；其后新增
  per-project core 已通过双端 production，但尚未另启 DevTool 覆盖截图。
- 下一条精确命令（先做最新实机回归）：
  `cd /Users/bytedance/github/synara-lynx/slice && ./node_modules/.bin/rspeedy dev --environment lynx`
  等 `RSPEEDY_READY`，再另启
  `PATH="/Users/bytedance/github/synara-lynx/slice/node_modules/.bin:$PATH" ./node_modules/.bin/rsbuild dev --environment desktop`；
  预计 slice client 为 8904（必须用 `lsof` + 完整 command path 核验），随后
  `node /Users/bytedance/.agents/skills/lynx-devtool/scripts/index.mjs get-console/take-screenshot`
  覆盖 `current-fixes/lynx-shared-sidebar-controller.png`。只 kill 明确属于
  `/synara-lynx/slice/` 的 PID。
- 回归后继续的代码切口：抽 `SidebarChatRows.logic.ts`（chat tree + root-aware preview +
  paging + effective extra pages），让 Web 现 3320–3380 附近 useMemo 与 slice
  `Sidebar.lynx.tsx` chat block 同调；随后抽 persistence transition（toggle/show more/
  show less 的 next state），再进入共享 row presentation composition。
- 最后一次已确认：reuse write/check 14.16%；style check 98.04%；Web production 8,807；
  slice production 1014.8/1129.8；主仓 Sidebar 99/99；slice Sidebar 3/3。结束前还需再跑
  两仓 `git diff --check`（上一次在 per-project core 之前通过）。

### 2026-07-28 — P6-C1 心跳：shared Chats controller + row composition

- `SidebarChatRows.logic.ts` 现在由 Web/Lynx 同时消费：expanded gate、parent/child tree、
  root-aware active reveal、paging clamp、ordered ids、Show more/less 判定与 toggle/paging
  transition 全部同源。toggle 明确保留 requested pages；翻页从 effective pages 继续，
  避免 collapsed 时将持久化页数意外清零。
- `SidebarThreadRowComposition.tsx` 统一 provider/subagent/terminal leading 和 subagent
  title 分支。Web wrapper 注入原 tooltip/terminal badge/parent presentation；Lynx 直接走
  shared provider/subagent elements，删除 generic-title 的 Lynx-only dot JSX 与 CSS。
- 验证：主仓 focused Vitest **109/109**，Web production **8,809 modules**；slice Sidebar
  Rstest **3/3**，production **1016.3/1131.3kB**；reuse 串行 write/check Threads
  **14.38%**（352 graph / 343 eligible）；style 串行 write/check
  **2,256/13,142/98.04%**。
- 最新 8903 实机 console 只有 startup/debugmetadata。第一次 `take-screenshot` 得到白图，
  depth-14 ReactLynx tree 证明完整 Sidebar/landing 已挂载；用 `open -a` 激活已有 app（未用
  System Events、未处理任何权限框）后同 session 正常覆盖
  `current-fixes/lynx-shared-sidebar-controller.png`。本轮只停止经完整路径核验的 slice
  PID 60181 与自启 5971；用户 8902/58090 未动。
- P6-C1 仍 `in_progress`：14.38%<70%，且尚未做两尺寸当前-source paired gate。下一刀应
  把 `renderProjectItem` 的 header/disclosure/pagination 大块拆成 host-neutral project-row
  composition，或抽 thread trailing cluster/status/meta composition；避免继续只加几十行
  leaf helper。

### 2026-07-28 — P6-C1 心跳：composer store 大图阴性 + prompt transition 保留

- 为替换 slice 自有 draft map，首次让 Lynx facade 直接调用主仓完整
  `createComposerDraftStoreState`。主仓 composer tests **121/121**、Rspeedy production
  compile 均通过，诚实图若保留可到 28.86%；但 dev host 拒绝 >10 MiB response。
- 为排除“仅 dev 元数据过大”，先完全停止 dev 与本轮 app，再重新 `npm run build`：
  production bundle 1514.2kB；随后用
  `NODE_ENV=production SYNARA_ENABLE_DEVTOOL=1 lynxtron dist/desktop` 加载 file bundle，
  host 仍报 template JSON parse failure，未创建 React frame。故完整 actions/domain/
  models/attachments main-thread 图判为阴性并移除，28.86% 不采纳。
- 保留可运行切口：主仓新增 `composerDraftPrompt.logic.ts`，原 Web `setPrompt` 反向消费；
  Lynx prompt-only Zustand facade 同样消费。slice `app/store.ts` 删除 draft map，仅保留
  旧 pinned smoke。原 background-only storage port 已恢复，不为失败探针放宽线程边界。
- 最终验证：Web composer **121/121**，Web production **8,810 modules**；slice
  composer+Sidebar **6/6**，production **1016.4/1131.4kB**；reuse 串行 write/check
  Threads **14.41%**（353 graph / 344 eligible）；style check **98.04%**。clean
  production client 8904 截图
  `current-fixes/lynx-shared-composer-prompt-store.png` 正常，console 只有 preload。
- P6-C1 仍 `in_progress`，14.41%<70%。下一步优先抽 Sidebar project disclosure/row
  composition 或把更多可证明 main-thread portable 的 route controller 接入；完整 composer
  store 不再重复尝试，除非先拆 background 或上游 decoder 改变。

### 2026-07-28 — P6-C1 心跳：shared project disclosure composition

- 新增主仓 `SidebarProjectDisclosure.tsx`，统一 project header → disclosure body →
  rendered thread rows → nested pagination 的实际组合顺序；Web
  `SidebarProjectDisclosureElements.tsx` 保留 motion/`SidebarMenuSub` DOM，Lynx 同名
  adapter 只保留 `AppSidebarProject`/条件 body host。Web `renderProjectItem` 与 slice
  `SidebarProjectsSection` 已同时消费；slice 删除直接 pagination composition。
- 第一轮 import 使用相对路径，Rspeedy 因而误入 Web host element，暴露
  `useMediaQuery`/background-only 链并失败；改为既有 `~/components/*Elements` adapter
  seam 后通过。这是一次可拆解的单点接线错误，不是 shared composition 阴性。
- 验证：主仓 focused Vitest **109/109**；Web production **8,812 modules**；slice
  composer+Sidebar **6/6**；production **1017.6/1132.6kB**。独立 production client
  `localhost:8904` 的 session URL 明确为 slice `dist/desktop/main.lynx.bundle`；
  `current-fixes/lynx-shared-project-disclosure.png` 正常绘制，console 仅 preload。
  首次 screenshot 因窗口不可见超时，使用无权限 `open -a` 激活后同 session 成功；未用
  System Events、未处理权限框。
- 证据边界：58090 当前 snapshot 无 projects，故截图覆盖 bundle/shared component 加载、
  空 Projects 与整页 paint，不覆盖真实 header/row callback 或折叠交互。未用假 fixture
  冒充真实数据；待有 project snapshot 时补该分支。
- 审计按 reuse write/check → style write/check 串行完成：Threads **16.80%**
  （355 graph / 346 eligible），style **2,256 classes / 13,142 weighted / 98.04%**；
  两仓 `git diff --check` 通过。P6-C1 仍 `in_progress`，16.80%<70%；下一步应继续抽
  route-owned/sidebar trailing/actions 等更大的可运行 composition，而非回到 type-only 或
  monolith 导入。

### 2026-07-28 — P6-C1 阴性探针：Web theme runtime 投影已撤回

- 审计 top unshared graph 显示 Web `theme.logic`/seed 是 app-shell 的结构性缺口，故先尝试
  background hydrate 同一 `synara:theme`，用原 `parseStoredThemeState` /
  `resolveThemeVariant` / `buildThemeCssVariables` 计算变量，再传 root inline style。
  theme tests **23/23**、slice **6/6**、production 1077.7kB 均通过；默认 light 正常。
- 向 slice 自有 `dist/.slice-data/kv.json` 临时写入 default dark（未改用户 app storage）
  后，inline custom properties 不生效；透明 material 的 white foreground 落在白 host，
  `lynx-shared-theme-dark-probe.png` 表现为假白屏。随后用 generator 从同一 Web 算法产
  `.SliceRoot--theme-{light,dark}` concrete variable classes，并固定 opaque；production
  1094.5kB、console clean，但 `lynx-shared-theme-dark-generated.png` 仍是 light，证明
  class-scoped `--*` 同样不能覆盖 Lynx Desktop 静态 `:root` token。
- 按 no-fake-parity 原则完整删除 themeProjection、generator、generated CSS、package
  script 与 App 接线，主仓 storage key 临时 export 也恢复；测试 KV 恢复 `{}`。最终重建
  **1038.8/1153.8kB**。失败图不计 reuse，Threads 仍 **16.80%**。
- 新结论写入 02、03 与 P-45：P7 dark 必须把 Web theme math 确定性生成成 selector 级
  direct property overrides，或等待上游动态 root custom-property API；透明 material 在
  Lynxtron 固定 opaque。P6-C1 继续推进其他可运行共享 composition。

### 2026-07-28 — P6-C1 心跳：shared search ranking + 可用 Search

- slice Search primary action 从 disabled 改为打开 Lynx Dialog/Input palette；数据来自同一
  real normalized sidebar snapshot。新 host island 只负责输入/分组/点击，recent chats、
  thread title、project/folder/path scoring 与 tie-break 直接调用主仓
  `SidebarSearchPalette.logic`。点击 chat 跳 thread；project 跳 projects surface。
- 主仓 portable logic 的四处 `toSorted` 改为对新 map array `.sort`；强制打开生产 fixture
  首次再暴露 PrimJS 无 `replaceAll`，改为等价 regex replace。第一次截图虽已绘制真实
  recent rows但 console 有 exception；第二次
  `current-fixes/lynx-shared-search-palette-fixture.png` 保留，console 仅 preload。
  default-open fixture 已恢复 `false` 并最终重建。
- 数据边界：summary projection 无 message body，所以当前不伪装 content search，也未接
  action/theme/import/filesystem browse；02/03/P-46 已登记，后续可加 bounded snippets/RPC。
- 验证：Web search Vitest **15/15**，Web production **8,812 modules**；slice scoped
  **6/6**，final production **1056.9/1171.9kB**；两仓 `git diff --check` 通过。
  审计曾因 search logic 的 type-only `ThemeMode` import 虚高到 20.17%，已改最小结构 union；
  最终 reuse write/check Threads **17.32%**，style write/check **98.04%**。
- P6-C1 仍 `in_progress`，17.32%<70%。下一步优先共享 route shell/global shortcut 或
  Sidebar trailing/actions 的实际组合；不得把剩余 type-only 大图作为进度。

### 2026-07-28 — P6-C1 心跳：原 Web Search palette 组件树进入产品路径

- Lynxtron Menu 新增 `CmdOrCtrl+K`，沿既有 `sendGlobalEvent` / `GlobalEventEmitter`
  通道打开 palette；源码与 production build 验证通过。DevTool 无宿主按键注入接口，
  未使用可能触发辅助功能授权的 System Events，因此 accelerator 本身未做 OS 自动按键。
- 直接将主仓 1141 LOC `SidebarSearchPalette.tsx` 放进 compiler：先补 env/theme/nativeApi
  adapters；React Query alias 到 slice 单例，消除跨 workspace context；用 debug metadata
  将 main-thread `not a function` 定位到 Effect Schema 的 `Object.hasOwn`，新增单一 PrimJS
  polyfill。之后 console clean，剩余白屏确认是 Base UI DOM portal 不挂载。
- 主仓 palette 的 UI imports 改为稳定 `~/components/ui/*`，裸 div/span/mark 通过新增
  `SidebarSearchPaletteElements` seam；Lynx `Command`/`kbd`/elements adapters 后原文件
  实机完整绘制。slice 自绘 Dialog/results JSX 已删除，仅保留 real snapshot→Web props；
  appearance/filesystem/import 用默认 true、Lynx false capability 明确关闭。
- 产品 forced-open 证据：
  `shots/2026-07-27/port/p6-c1/current-fixes/lynx-shared-original-search-palette.png`，真实
  recent rows、project label、time、actions、shortcut、modal 与 thread surface 同屏，
  console 仅 preload；临时 default-open 已恢复 false，自己的 client 已停止。
- 验证：Web search **15/15**，Web production **8,813 modules**；slice Sidebar **3/3**，
  final production **1554.5/1669.6kB**；reuse 串行 write/check Threads **22.85%**
  （89 modules / 17,610 LOC；347 eligible / 77,066 LOC）；style 串行 write/check
  **98.04%**；两仓 diff-check 通过。P6-C1 仍 in_progress（22.85%<70%）。
- 下一刀：审计 top 未映射仍由 `Sidebar.tsx` 6276 LOC 主导。应继续从该单体抽出并在两端
  真实消费较大的 primary surface/controller composition（优先 navigation+surface body
  或 thread trailing/actions cluster）；不要回到 type-only 大图。精确起点：
  `jq -r '.screens[]|select(.id=="threads")|.modules[]|select(.currentReuse=="UNMAPPED" and .classification!="EXCLUSIVE")|[.loc,.path]|@tsv' plan/reports/p5-r1-reuse-baseline.json | sort -nr | head -40`。

### 2026-07-28 — P6-C1 心跳：shared primary surface navigation

- 在已共享 row renderer 之上新增主仓物理组件
  `SidebarPrimarySurfaceNavigation`，将 workspace/studio/threads 三种 surface 的 item
  顺序、active 判定、shortcut、badge、callback 与 capability-disabled 语义从 Web
  `Sidebar.tsx` 和 slice 两份数组收拢为一份。Web 的 PR icon 与完整 callbacks、Lynx
  当前可运行 icon/callback 仍以叶子注入；未实现 Automations 不伪装可用。
- Web Sidebar 聚焦 Vitest **120/120**，production **8,814 modules**；slice Sidebar
  **3/3**，production **1561.5/1676.6kB**。slice client 8904 独立识别后实机截图
  `shots/2026-07-27/port/p6-c1/current-fixes/lynx-shared-primary-surface-navigation-v2.png`：
  Kanban active、五行、⌘K 与 disabled tone 正常，console 仅 preload；自己的 client
  已停止，8902/8903 与 58090 未动。
- 审计串行 write/check：Threads **23.01%**（90 reused modules / 17,738 reused LOC；
  348 eligible modules / 77,103 eligible LOC），style **98.04%**；两仓
  `git diff --check` 通过。P6-C1 仍 `in_progress`（23.01%<70%）。
- 下一刀继续从 6k LOC `Sidebar.tsx` 提取两端真实消费的较大 composition；优先
  thread trailing/actions cluster 或 search action construction。不得用 type-only 依赖、
  monolith import 或未进入产品路径的 probe 抬高分子。

### 2026-07-28 — P6-C1 心跳：shared thread trailing cluster

- 新增主仓物理 `SidebarThreadTrailingCluster` + host elements seam；Web
  `renderThreadRowTrailingCluster` 改为消费它，slice `SidebarThreadTrailing` 同样消费。
  meta → shortcut → status → hover actions 的顺序、shortcut/status 互斥与 shared
  Kbd/status renderer 不再重复；Web hover button/meta stack、Lynx descriptor glyph
  保持平台叶子。
- Web 四个聚焦文件首轮 106 项通过、重型 `Sidebar.import` 仅冷缓存 15s timeout；单独
  重跑 11s 通过，故不是断言/运行回归。合计 **107/107**，production **8,816 modules**。
  slice **3/3**，final production **1563.7/1678.8kB**。
- 为遵守有数据分支门禁，临时强制 Chats expanded + Greeting Working status；独立 slice
  client 此时为 8903（原 t3code 8903 已不在 list），激活可见窗口后
  `current-fixes/lynx-shared-thread-trailing-cluster.png` 命中真实 Greeting 行与行尾蓝点，
  console 仅 preload。临时 default/source/KV 全部恢复为原值，final bundle 重建，自己的
  client 已停止；8902/58090 未动。
- 审计串行 write/check：Threads **23.09%**（92 reused modules / 17,818 reused LOC；
  350 eligible modules / 77,172 eligible LOC），style **98.04%**，两仓 diff-check 通过。
  P6-C1 仍 `in_progress`（23.09%<70%）；下一刀优先 search action construction 或更大的
  Sidebar route-owned controller/composition。

### 2026-07-28 — P6-C1 心跳：shared Search action catalog

- 新增主仓物理 `SidebarSearchActions.logic`，集中完整 Web catalog 的动作顺序、文案、
  keywords、shortcut、space query-only 语义与注入 callback。Web `Sidebar.tsx` 改为传
  完整 capabilities；slice 删除 `LYNX_SEARCH_ACTIONS` 自写文案，调用同一 builder 并仅
  关闭尚无实现的 Add/Import/Feedback/Usage/Spaces/New space。
- 新测试固定完整 Web 顺序、Lynx capability 子集与 space callback。catalog+palette
  **18/18**；组合跑时 `Sidebar.import` 再次只命中固定 15s cold-cache timeout，单独重跑
  8.5s **1/1**。Web production **8,817 modules**；slice **3/3**，final production
  **1568.3/1683.4kB**。
- forced-open 证据 `current-fixes/lynx-shared-search-actions.png`：New chat/New thread/
  Settings 三项 shared Suggested 与真实 Recent rows 同屏，console 仅 preload。
  `searchOpen=true` fixture 已恢复 false，final bundle 重建；自己的 client 已停止，
  8902/58090 未动。
- 审计串行 write/check：Threads **23.25%**（93 reused modules / 17,962 reused LOC；
  351 eligible modules / 77,243 eligible LOC），style **98.04%**，两仓 diff-check 通过。
  P6-C1 仍 `in_progress`（23.25%<70%）。下一步继续抽大于 leaf 的 Sidebar controller /
  surface composition；当前 top UNMAPPED 仍是 `Sidebar.tsx` 6,101 LOC。

### 2026-07-28 — P6-C1 心跳：shared Search project/thread projection

- 放弃用大 ReactNode slot 包 Projects+Chats surface：Web 的 workspace/studio/settings
  分支夹在中间，且 P-32 已有静默白屏证据。改抽 route-owned Search controller 数据层：
  新增主仓物理 `SidebarSearchProjection.logic`，统一 project fallback 与 thread visible
  order / missing skip / project+space label / messages projection，Web/Lynx 两端均替换旧映射。
- projection+action+palette **20/20**；Web production **8,818 modules**。slice **3/3**，
  final production **1569.5/1684.7kB**。
- 首次 forced-open 实机发现 Recent 的 `Studio`/`hi` 标签消失：Lynx 错把仅 ordinary
  projects 的 display collection 用作 thread identity lookup。修复为 display/lookup 两
  集合后，`current-fixes/lynx-shared-search-projection.png` 恢复两标签，console 仅
  preload。临时 `searchOpen=true` 已恢复 false，final bundle 重建，自己的 client 停止。
- 审计串行 write/check：Threads **23.33%**（94 reused modules / 18,036 reused LOC；
  352 eligible modules / 77,306 eligible LOC），style **98.04%**。P6-C1 仍
  `in_progress`（23.33%<70%）；top UNMAPPED `Sidebar.tsx` 现为 6,090 LOC。

### 2026-07-28 — P6-C1 心跳：shared status priority/presentation

- 审计 `Sidebar.logic.ts` 1,073 LOC 后拒绝直接从 Lynx import monolith：只调用 status
  helper 却让 audit 计整文件违反 P-30。将 status label/color/pulse/priority/dismiss 与
  project aggregation 下沉为主仓物理 `SidebarStatus.logic`；Web 原 controller 继续计算
  完整 pending/live/plan/completed facts，slice 用现有 live/sessionStatus 驱动同一 leaf。
- 初版 Web 102 项中 1 项失败：dismissed Pending Approval 错误下沉到 Completed；修正为
  “最高状态存在即返回其 dismiss 结果”后 **102/102**。slice **3/3**，Web production
  **8,819 modules**，final slice production **1571.8/1686.9kB**。
- forced fixture 展开 Chats 并将真实 Greeting 标为 Working；
  `current-fixes/lynx-shared-status-presentation.png` 命中同源 sky pulse dot，console 仅
  preload。working/expanded/persistence-skip 三处 fixture 全部恢复，自己的 8904 client
  停止；用户 8902、t3code 8903 与 58090 未动。
- 审计串行 write/check：Threads **23.47%**（95 reused modules / 18,151 reused LOC；
  353 eligible modules / 77,352 eligible LOC），style **98.04%**，两仓 diff-check 通过。
  `Sidebar.logic.ts` 已真实缩至 1,004 LOC 但仍 UNMAPPED；P6-C1 保持 `in_progress`。

### 2026-07-28 — P6-C1 心跳：shared visible-thread navigation

- 没有用 Lynx import 1,004 LOC `Sidebar.logic.ts` 来虚增复用。将 visible-thread
  wraparound、数字 jump 与 prewarm selection 下沉到主仓物理
  `SidebarThreadNavigation.logic`；Web `Sidebar.tsx` 直接改用 leaf，旧
  `Sidebar.logic` 仅保留兼容 re-export。
- Lynx 从已共享的 per-project/chat row controller 输出拼出真实当前可见顺序；原生
  application menu 新增 `⇧⌘[` / `⇧⌘]`，通过 shell event 调同一 wraparound resolver
  并导航线程。静态路由核验在构建前抓到初版 `/threads/:id` 错写，已修为 slice router
  的 `/thread/:id`。
- Web Sidebar logic **99/99**、slice Sidebar **3/3**；修正后的 final slice production
  **1573.0/1688.4kB**，仅既有 `color-scheme`/`text-transform` 与可选 ws native addon
  警告。Web Vite 已完成 **8,820 modules** transform 与产物输出，但报告 success 后进程
  handle 未退出，确认产物后只终止该 build child，未动现有 Web dev server。
- 审计串行 write：Threads **23.58%**（96 reused modules / 18,241 reused LOC；
  354 eligible modules / 77,345 eligible LOC），style **98.04%**。下一步执行 check 与
  diff-check；P6-C1 仍 `in_progress`（23.58%<70%）。

### 2026-07-28 — P6-C1 心跳：shared thread pinning + paired persistence state

- 将 thread pin id derivation/order、mutation freshness、standalone 去重与“有可见 child
  的 pinned parent 仍保留”从 `Sidebar.logic.ts` 下沉为主仓物理
  `SidebarThreadPinning.logic`；Web Sidebar/hook 直接消费 leaf，旧 monolith 仅兼容
  re-export，现已缩至 856 行。
- slice 已有 snapshot `isPinned`，但 side-by-side 实测 Web 点击 Pin 后 Lynx 不变化：
  pin 是 renderer `pinnedThreadsStore` persistence + optimistic overlay，不是同 WS 自动
  同步的数据。slice 现于 L1 storage hydration 后 eager rehydrate 原
  `synara:pinned-threads:v1`，再与 server flag 合并；Pinned section 参与 visible-thread
  keyboard order，并从 ordinary project/chat rows 去除 standalone pin。
- paired evidence：`shots/2026-07-28/p6-c1-pinned/{web,lynx}.png`，同 58090、同
  Simple Greeting、同 light theme。两端都显示 Pinned row；Web 仍比 Lynx 多 Studio
  trailing label/hover actions，已记 🔧。Lynx console 无 error/warning。
- 临时 Web Pin、Web Light theme 与 slice KV fixture 全部恢复；自己的 slice runtime
  已停止，用户 8902、t3code 与 58090 未动。Web **8,821 modules** production build
  成功；Web Sidebar **99/99**，slice **5/5**，slice final production
  **1581.8/1697.2kB**。
- 审计串行 write：Threads **23.96%**（99 reused modules / 18,531 reused LOC；
  355 eligible modules / 77,353 eligible LOC），style **98.04%**。P6-C1 仍
  `in_progress`（23.96%<70%）。

### 2026-07-28 — P6-C1 心跳：shared project pinning order

- 将 project pin optimistic freshness、server/persisted merge、`MAX_PINNED_PROJECTS` cap
  与 pinned-first stable order 从 `Sidebar.logic.ts` 下沉为主仓物理
  `SidebarProjectPinning.logic`；Web Sidebar 直接消费 leaf，monolith 继续缩至 821 行。
- normalized snapshot 的 `ProjectSummary` 透传 `isPinned`；slice 同 thread pin 一样在
  L1 storage hydration 后 eager rehydrate 原 `synara:pinned-projects:v1`，将 persisted
  ids 与 server flag 合并，再在 ordinary manual order 上应用共享置顶顺序。没有新增
  Lynx-only 复制逻辑。
- Web Sidebar **99/99**，slice Sidebar **6/6**；Web production **8,822 modules**，
  slice final production **1584.1/1699.5kB**，仅既有 CSS 与可选 ws addon 警告。
- 审计串行 write：Threads **24.10%**（101 reused modules / 18,643 reused LOC；
  356 eligible modules / 77,358 eligible LOC），style **98.04%**。下一步执行 check 与
  diff-check；P6-C1 仍 `in_progress`。

### 2026-07-28 — P6-C1 上下文交接（03:03）

- 本轮两刀均已完整 check 闭环：visible-thread navigation 使 Threads 23.47→23.58；
  thread pinning + 原 store hydration/paired evidence 使 23.58→23.96；project pinning
  merge/cap/order 使 **23.96→24.10%**。最终 reuse/style `--check` 与双仓
  `git diff --check` 均通过，无本轮 slice runtime。
- 最终代码/门禁：Web Sidebar **99/99**；slice Sidebar **6/6**；Web production
  **8,822 modules**；slice **1584.1/1699.5kB**；style **98.04%**；Threads
  101 reused modules / 18,643 reused LOC，356 eligible modules / 77,358 eligible LOC。
- 临时状态已核验恢复：Web DOM 再次显示 `Pin thread` 且无 Pinned section，theme
  preference 回到 System；slice KV 已恢复原两键内容，临时
  `synara:pinned-threads:v1` fixture 删除；自己的 Lynxtron/rspeedy 均已停止。
- 下一刀从仍 UNMAPPED 的 `Sidebar.logic.ts`（821 行）挑真实 Lynx consumer。优先审计：
  `resolveProjectEmptyState` + projects section state（Lynx 仍 inline）或
  project row collapsed/status presentation；不要 import monolith，不要把 type-only/
  单 helper 引用包装成整模块复用。完成后继续 serial reuse write/check、style
  write/check、双仓 diff-check，并更新 01/02/04/LOG。

### 2026-07-28 — P6-C1 心跳：shared Projects section state + collapsed status

- 将 Projects loading/error/empty/ready 与 Web legacy empty-state projection 下沉为
  `SidebarProjectsState.logic`；Lynx 删除内联四层 ternary。首版把 loading 放在 rows
  前导致 Web 99 项中 1 项失败（已有 project、尚未 hydrated 应保持 ready/null），修为
  existing content/path entry 优先后 **99/99**。
- Lynx per-project rows 不再注入恒 null status：用 shared
  `resolveSidebarStatusPresentation` + `resolveSidebarProjectStatus` 聚合
  live/connecting，且只在折叠 project header 显示共享 trailing glyph；展开状态继续由
  child rows 表达。
- slice Sidebar **6/6**；Web production **8,823 modules**；slice final production
  **1584.9/1700.3kB**，仅既有 CSS 与可选 ws addon 警告。
- 审计串行 write：Threads **24.13%**（102 reused modules / 18,669 reused LOC；
  357 eligible modules / 77,375 eligible LOC），style **98.04%**；
  `Sidebar.logic.ts` 812 行。P6-C1 仍 `in_progress`。

### 2026-07-28 — P6-C1 心跳：full shared thread-status facts + dismissal hydration

- 将 `resolveThreadStatusPill` 从 Sidebar monolith 下沉为
  `SidebarThreadStatus.logic`，Web 直接消费、monolith 仅兼容 re-export。Pending
  Approval / Awaiting Input / Working / Connecting / Plan Ready / Completed 的 session、
  latest-turn、plan、unseen-completion 与优先级事实不再由 Lynx 以 `live/connecting`
  近似。
- slice 在主仓 normalized read model 仍位于 background 时运行同一 resolver，只把
  bounded `SidebarStatusPresentation` 跨到 UI。为保持 dismissal 语义，
  `fetchSidebarSnapshot` 等待 L1 `hydrateStorage()`，读取原 `Sidebar.uiState`
  `dismissedThreadStatusKeyByThreadId` 后逐线程注入；已 dismiss 的最高状态不会退回显示
  Completed，也不会在 Lynx renderer 重新出现。
- 门禁：Web focused **102/102**、production **8,824 modules**；slice **6/6**、
  production **1587.9/1703.3kB**，仅既有 CSS encoder 与可选 ws addon 警告。当前真实
  snapshot 无可见状态，本刀不新增 synthetic side-by-side 结论。
- 审计按 reuse write → style write 串行完成：Threads **24.26%**（103 reused modules /
  18,775 reused LOC；358 eligible modules / 77,381 eligible LOC），style **98.04%**；
  `Sidebar.logic.ts` 降至 710 行。P6-C1 仍 `in_progress`，下一刀继续从 route-owned
  Sidebar/landing 的大块真实 consumer 寻找可运行共享边界，不能以 leaf 数量代替 70% gate。

### 2026-07-28 — P6-C1 心跳：shared visible-row collection

- 将 Web 与 Lynx 各自的 pinned/project/chat-or-studio 可见 ids 拼接改为
  `SidebarThreadNavigation.logic.collectVisibleSidebarThreadIds`。输入直接来自已共享
  per-project/chat row controller 的 `visibleEntries`，保持 render order 与 collapsed
  active reveal，不再另跑一套 tree/paging；insertion-order Set 统一跨 section 去重。
- 真实 consumers：Web jump hints/detail prewarm/keyboard navigation；Lynx native
  `⇧⌘[` / `⇧⌘]` cycle。Web focused **100/100**、production **8,824 modules**；slice
  **6/6**、production **1588.4/1703.8kB**，仅既有警告。
- 审计串行 write：Threads **24.29%**（103 reused modules / 18,794 reused LOC；
  358 eligible modules / 77,382 eligible LOC），style **98.04%**。无视觉结构变化，
  本刀不重复 side-by-side；P6-C1 仍 `in_progress`。

### 2026-07-28 — P6-C1 心跳：shared composer 736px column frame

- 新增物理共享 `ComposerColumnFrameSurface`，Web 原 `ComposerColumnFrame` 直接消费，slice
  landing 也消费同一 source；Web 的 `mx-auto w-full max-w-[46rem]` 与 736px 产品尺度不再
  由 slice 页面自写。
- 首轮 shared source 使用相对 `./ComposerColumnFrameSurfaceElements`，Web 与 slice build
  都通过，但 Rspeedy alias 没有命中，运行时静默落回 Web host；因此反复修改 Lynx adapter
  CSS 不会生效。改为 canonical `~/components/chat/...Elements` 后，adapter 才实际进入
  bundle。保留的 Lynx host projection 为内容区 72% + 736px cap +
  `align-self:center`；不得把该补丁散回 placeholder。
- 严格视觉协议：dry-run 得到 Web `8892`；正式命令因用户已有 58090 server 正确拒绝，
  未停止该 server。保守 Web-only fallback 虽产生 1280×720 `web.png`，但在协议要求
  unset token 下 RPC channel 无法连接，故该图只作诊断，**不算同数据 paired 通过**。
  Lynx production file bundle 的 `lynx.png` 为 2560×1576/DPR2，composer 实测
  1472 physical px = 736 logical px，居中无裁切，console 无 error/warning。证据与逐项
  checklist：`shots/2026-07-28/p6-c1-composer-frame/notes.md`。
- 临时 KV `lastThreadRoute:null` 已恢复到
  `72d62436-8d35-43d2-9329-1c1367967d8d`；本轮自己的 Lynxtron/Web fallback 均已停止，
  58090 用户服务未触碰。DevTool 首次 capture 不可见窗口会返回全白，本轮再次印证 P-09。
- 门禁：Web focused **100/100**（首次从仓根传文件名被 turbo 当 task 拒绝，随后在
  `apps/web` 用正确 Vitest script 通过）；slice **6/6**；Web production
  **8,826 modules**；slice production **1589.5/1704.9kB**，仅既有 CSS encoder/可选
  ws addon 警告。
- 审计按 reuse write → style write 串行完成：Threads **24.63%**
  （105 reused modules / 19,061 reused LOC；358 eligible modules / 77,382 eligible LOC），
  style **98.04%**（2,256 classes / 13,142 weighted）。新增 P-58 与 compat 两项记录。
  P6-C1 仍 `in_progress`，24.63%<70%；下一刀继续选择 route-owned 大 composition，不以
  leaf 数量替代 screen gate。

### 2026-07-28 — P6-C1 心跳：shared Settings-back + collapsed paging transitions

- 将 Settings back 的 remembered available thread → latest thread → home target 选择下沉为
  `SidebarSettingsBack.logic`；Web `Sidebar.tsx` 直接消费，monolith 只兼容 re-export。
  slice router 不再固定 Back→`/`，而是把同一 shared target 映射到 memory history。
- 将 collapsed project 清理 `threadListExtraPagesByProjectCwd` 下沉到既有
  `SidebarProjectPaging.logic`；Web 与 Lynx disclosure state 都调用同一 prune。Lynx 仍只
  负责把返回 Map 写回原 `Sidebar.uiState`，重新展开不会保留平台独有的 Show-more 页数。
- 门禁：Web focused **100/100**；slice 新增两条真实 shared controller 测试后 **8/8**；
  Web production **8,827 modules**；slice production **1599.6/1715.0kB**，仅既有警告。
  production Lynxtron 启动、storage hydration 与恢复 route 均正常，DevTool
  error/warning console 为空；无视觉 anatomy 变化，不重复 side-by-side。
- 审计按 reuse write → style write 串行：Threads **24.72%**
  （106 reused modules / 19,130 reused LOC；359 eligible modules / 77,384 eligible LOC），
  style **98.04%**；`Sidebar.logic.ts` 从 702 降至 642 行。新增 P-59。
  P6-C1 保持 `in_progress`。

### 2026-07-28 — P6-C1 心跳：shared Pull Requests review badge

- 将 PR review count 的 exact / incomplete `+` / zero-hidden / accessible plural wording
  下沉为 `SidebarActionBadges.logic`。Web `Sidebar.tsx` 直接消费、monolith 兼容 re-export；
  slice Sidebar 用真实 `fetchPullRequests` RPC entries 计算 viewer-review count，再传给已经
  共享的 `SidebarPrimarySurfaceNavigation` badge slot。
- 当前 server 无待本人 review PR，因此保守不造 positive fixture；生产截图
  `shots/2026-07-27/port/p6-c1/current-fixes/lynx-shared-pr-review-badge.png`
  证明真实 query 后 row 保持 zero-hidden 且页面无回归，DevTool error/warning console 为空。
- 门禁：Web focused **100/100**；slice **9/9**；Web production **8,828 modules**；
  slice production **1600.8/1716.2kB**，仅既有警告。审计 reuse write → style write：
  Threads **24.77%**（107 reused modules / 19,163 reused LOC；360 eligible modules /
  77,372 eligible LOC），style **98.04%**；`Sidebar.logic.ts` 611 行。新增 P-60，
  P6-C1 继续 `in_progress`。

### 2026-07-28 — P6-C1 心跳：shared segment → primary surface

- 将 workspace > studio > threads 判定下沉为 `SidebarSurface.logic`；Web primary catalog
  与 DnD gating 直接消费、monolith 兼容 re-export。slice 不再把
  `SidebarPrimarySurfaceNavigation` 永远写死为 threads：`/studio` 现在只显示
  `New studio chat` + `Search`，不再误留 Kanban/PR/Automations。
- 视觉验证先尝试 DevTool main-thread global event 与 background CDP mouse dispatch；前者
  未触发订阅，后者明确返回 `Not implemented: Input.dispatchMouseEvent`。改用可逆
  initial-route `/studio` fixture，生产截图
  `shots/2026-07-27/port/p6-c1/current-fixes/lynx-shared-studio-primary-surface.png`
  命中真实 Studio branch，console 为空；随后恢复 `/` 并重建最终 bundle，未改用户 KV。
- 门禁：Web focused **100/100**；slice **10/10**；Web production **8,829 modules**；
  slice final production **1601.0/1716.4kB**。审计 reuse write → style write：
  Threads **24.78%**（108 reused modules / 19,177 reused LOC；361 eligible modules /
  77,391 eligible LOC），style **98.04%**；`Sidebar.logic.ts` 608 行。新增 P-61，
  P6-C1 继续 `in_progress`。

### 2026-07-28 — P6-C1 心跳：shared Studio flat content composition

- 上一刀只修正 segment→primary action catalog，Studio 下方仍错误复用 Threads 的 Projects
  - Chats 内容。现将 Web 原 Studio prelude/header/actions/flat rows/empty-state 下沉为物理
    `SidebarStudioSection`；Web 保留 auto-animate/ref 与原 row renderer，Lynx 仅适配 host
    elements，并从共享 `sections.studioThreads` 喂扁平 rows。
- 可逆 initial-route `/studio` 生产截图已覆盖更新
  `shots/2026-07-27/port/p6-c1/current-fixes/lynx-shared-studio-primary-surface.png`：
  Studio picker/action 下只剩 `Studio` + `No studio chats yet`，无 Projects、无额外 Chats；
  DevTool console 无 error/warning。随后 source 恢复 `/`、最终 bundle 重建，用户 KV 未改，
  本轮 Lynxtron 已停止。
- 门禁：Web Sidebar **100/100**、production **8,831 modules**；slice **10/10**、
  final production **1604.4/1719.8kB**，仅既有 CSS encoder/可选 ws addon 警告。
  audit 串行 write：Threads **24.84%**（110 reused modules / 19,239 reused LOC；
  363 eligible modules / 77,451 eligible LOC），style **98.04%**。新增 P-62；
  P6-C1 仍 `in_progress`（24.84%<70%）。

### 2026-07-28 — P6-C1 心跳：shared Pinned section composition

- 将同时出现在 Threads/Studio prelude 的 Pinned 空数组隐藏、section header、row list
  顺序与 spacing 下沉为物理 `SidebarPinnedSection`；Web 与 Lynx 均传真实 pinned rows +
  原 row renderer，adapter 只保留 host element。删除 slice 自写 `if + header + list`，
  不改变 pin hydration/merge/de-dup 语义。
- 本刀 anatomy 保持不变，复用既有同 server 正向 paired evidence
  `shots/2026-07-28/p6-c1-pinned/{web,lynx}.png`；不再改用户 KV 造重复 fixture。
- 门禁：Web Sidebar **100/100**、production **8,833 modules**；slice **10/10**、
  production **1605.3kB Lynx**（desktop build 同次成功，仅既有警告）。audit 串行 write：
  Threads **24.87%**（112 reused modules / 19,272 reused LOC；365 eligible modules /
  77,478 eligible LOC），style **98.04%**。新增 P-63；P6-C1 继续 `in_progress`。

### 2026-07-28 — P6-C1 心跳：shared Settings footer-entry visibility

- 将 Footer Settings entry 的 route visibility、固定 label 与 activate 契约下沉为物理
  `SidebarSettingsEntry`。Web adapter 保留原 SidebarMenuButton/glyph/classes；Lynx
  adapter 复用 shared primary row host。修复 Lynx 进入 Settings 后仍在 footer 保留 active
  Settings row 的结构差异。
- 首次 Web production build 因新 Elements 文件误写 `./sidebarStyles` import 失败；定位为
  正确 `../sidebarRowStyles`（并修正 `SidebarLeadingIcon` 来源）后第二次通过，未改变方案。
  可逆 `/settings` 初始路由截图
  `shots/2026-07-27/port/p6-c1/current-fixes/lynx-shared-settings-footer-visibility.png`
  证明 footer entry 消失，console 无 error/warning；随后恢复 `/`、重建，用户 KV 未改且
  自己的 Lynxtron 已停止。
- 门禁：Web Sidebar **100/100**、production **8,835 modules**；slice **10/10**、
  final production **1605.8/1721.2kB**。audit 串行 write：Threads **24.98%**
  （115 reused modules / 19,362 reused LOC；367 eligible modules / 77,525 eligible LOC），
  style **98.04%**。新增 P-64；P6-C1 继续 `in_progress`。

### 2026-07-28 — P6-C1 心跳：shared desktop sidebar header

- 将 desktop titlebar 的 leading controls → Synara logo 顺序、品牌可访问名与容器下沉为
  物理 `SidebarDesktopHeader`；Web Elements 保留原 SidebarHeader/48px/traffic-light
  gutter，Lynx Elements 保留 host view，logo 继续走已有平台 adapter。
- 首次测试与双 build 均绿，但实机截图标题栏无 logo：共享 source 相对 import
  `./SynaraLogo` 静默绕过 Rspeedy alias。改为 canonical
  `~/components/SynaraLogo`、重建后截图
  `shots/2026-07-27/port/p6-c1/current-fixes/lynx-shared-desktop-header.png`
  恢复 14px 品牌标，console 无 error/warning。capture 两次受 P-09 不可见窗口影响，
  仅用 AXRaise 提升本轮窗口后 DevTool 成功；自己的 Lynxtron 已停止。
- 门禁：Web Sidebar **100/100**、production **8,837 modules**；slice **10/10**、
  final production **1606.7/1722.1kB**。audit 串行 write：Threads **25.31%**
  （120 reused modules / 19,571 reused LOC；368 eligible modules / 77,338 eligible LOC），
  style **98.04%**。新增 P-65；P6-C1 继续 `in_progress`。

### 2026-07-28 — P6-C1 上下文交接（04:58）

- 本会话连续闭环四刀：Studio flat content 24.78→24.84、Pinned section 24.84→24.87、
  Settings footer visibility 24.87→24.98、desktop sidebar header 24.98→**25.31%**。
  最终 reuse/style `--check` 与双仓 `git diff --check` 通过；route 为 `/`，用户 KV 保持
  原两键，自己的 Lynxtron/rspeedy 已停止，58090 与其他项目进程未动。
- 当前门禁：Web Sidebar **100/100**、production **8,837 modules**；slice Sidebar
  **10/10**、production **1606.7/1722.1kB**；Threads 120 reused modules / 19,571 reused
  LOC，368 eligible modules / 77,338 eligible LOC；style **98.04%**。
- P6-C1 仍 `in_progress`。下一会话先从 `plan/reports/p5-r1-reuse-baseline.json` 的 Threads
  UNMAPPED graph 与 Web `Sidebar.tsx` 剩余真实 consumer 选择下一块 composition；优先
  route/shell 级边界，不要以 type-only/helper/opaque slot 包装制造复用。每刀继续 Web
  focused test + slice focused test、双 build、必要时 DevTool 正向分支、串行 audit
  write/check 与双仓 diff-check。

### 2026-07-28 — P6-C1 心跳：shared sidebar footer composition

- 将 Sidebar footer 的 `SidebarFooter > SidebarMenu > SidebarMenuItem > 列 stack > 行`
  三层容器与 Settings entry 位置下沉为物理 `SidebarFooterSection`；Web Elements 保留原
  `gap-2 p-2 font-system-ui` / `flex-col gap-1` / `flex items-center gap-2`，Lynx Elements
  只提供 host view。两个平台独占附件（DEV debug feature-flags 菜单、desktop update 按钮）
  收敛为具名 `prelude` / `trailing` slot，Lynx 两者都不传。slice 删除自写 footer view。
- 本刀 anatomy 不变，故未新做 paired side-by-side；生产实机正向证据
  `shots/2026-07-28/p6-c1-footer/{lynx.png,notes.md}`：默认 `/` 下 footer 仍是全宽
  Settings row（leading glyph + 固定 label），padding/divider 未变，
  `get-console --level error,warning` 无任何条目。
- 门禁：Web `Sidebar.logic` + `Sidebar.uiState` **105/105**（`Sidebar.import.test.ts`
  仍是既有 15s 加载超时，属预存集；本刀以 Web production build 证明模块图完好）；
  slice `npx rstest` **23 passed / 0 failed**（唯一 fail 为既有 lynx-ui vendor mjs 加载器
  问题，0 tests started）；Web production **8,839 modules**；slice production
  **1608.9/1724.3kB**，仅既有 CSS encoder 与可选 ws addon 警告。
- audit 串行 write→check：Threads **25.36%**（25.31%→25.36%），style **98.04%**；
  两仓 `git diff --check` 通过。自己的 Lynxtron PID 25327 已停止，用户 8902/8903/8904
  client 与 58090 未动，默认路由保持 `/`，用户 KV 未改。新增 P-66；P6-C1 继续
  `in_progress`（25.36%<70%）。

### 2026-07-28 — P6-C1 心跳：shared sidebar surface content frame

- 将 `SidebarContent` 外框与 surface 顺序（prelude → picker → keyed
  `sidebar-surface-enter` → navigation + body → trailing）下沉为物理
  `SidebarSurfaceContent`。Web Elements 保留原 `SidebarContent gap-0 font-system-ui` 与
  `div.sidebar-surface-enter`；Lynx Elements 用 `scroll-view.AppSidebarScroll >
view.AppSidebarScrollInner` + `view.AppSidebarSurfaceEnter`。settings 分支以具名
  `settingsNavigation` 表达"设置导航替换整个 surface"，Web 行为与原 ternary 完全一致。
- 结构后果：Lynx 的 picker/primary navigation 从"固定在滚动区之上"改为与 Web 一致地随
  内容滚动。为保持像素不变，把原 `.AppSidebarScrollInner` 的 `14px 10px 18px` 拆开：
  14px 顶距归还给 `.AppSidebarPrimaryNav` 的 `margin-bottom`，10px 横距下放到四个
  section root（Pinned/Projects/Studio/Chats），18px 底距留在 scroll inner。
- 实机验证：生产 Lynxtron（own client `localhost:8903`、session 1、own PID 97386，
  已停止）截图 `shots/2026-07-28/p6-c1-surface/lynx.png` 与本轮 footer 截图逐锚点一致
  （picker/New thread/Search/Kanban/Pull requests/Automations/divider/Projects/empty/
  Chats 全部同 y），`get-console --level error,warning` 无条目。
- 门禁：Web `Sidebar.logic` + `Sidebar.uiState` **105/105**；Web production
  **8,841 modules**；slice `npx rstest` **23 passed / 0 failed**；slice production
  **1610.5/1725.9kB**。audit 串行 write→check：Threads **25.40%**，style **98.04%**；
  两仓 `git diff --check` 通过。新增 P-67；P6-C1 继续 `in_progress`。

### 2026-07-28 — P6-C1 复用结构分析 + Threads route 编译探针（临时，已回滚）

- 观察：本会话两刀各只推进 0.05% 左右。对 Threads 屏 UNMAPPED 做桶分析（59,568 eligible
  LOC / 257 modules，占 77,338 的 77%）：`other` 32,307（41.8%）、`sidebar` 8,876（11.5%）、
  `composer` 5,226（6.8%）、`terminal` 4,646（6.0%）、`routes` 3,766（4.9%）、
  `chatview` 2,805（3.6%）、`transport` 1,942（2.5%）。`other` 前列是
  `whatsNew/entries` 2,481、`storeEventReducer` 1,622、`appSettings` 1,210、
  `lib/automationIntent` 1,083、`splitViewStore` 692，以及 158 个 ≈87 LOC 的长尾共 13,728。
- 结论：靠继续从 `Sidebar.tsx` 抽 composition 无法接近 70%——剩余量级由
  `routes/__root + _chat + _chat.index` 传递依赖的整片应用图决定。唯一符合硬规则的路径是
  goal prompt 已写明的那条：把原 Web route subtree 直接放进 Lynx compiler，用真实错误驱动
  最小 adapter。因此本轮先做一次**只读探针**，不改变 P6-C1 状态与门禁契约。
- 探针（临时文件 `src/app/__probe.threadsRoute.ts` + router 临时 import，均已删除/还原）
  直接引入 `_chat.index.tsx` 的真实依赖面：`store`、`workspaceStore`、
  `composerDraftStore`、`lib/studioProjects`、`chatRouteRestore`、
  `components/RestoreOrCreateChatRoute`。按真实报错顺序拿到两个确定性阻塞：
  1. **`~/nativeApi` 缺 `ensureNativeApi`**（Lynx adapter 只有 `readNativeApi`）。已按
     Web 同契约补上会抛错的 `ensureNativeApi`（不发明 DOM bridge、不静默降级），这是本轮
     唯一保留的探针产物。
  2. **`~/platform/storage` 缺 `flushStorageBeforePageHide`，且 slice 的
     `src/platform/storage.ts` 是 `background-only`**，被共享图拉进 main-thread 编译时直接
     报 `'background-only' cannot be imported from a main-thread module`
     （traces: `src/app/index.tsx → App.tsx → … → src/platform/storage.ts`）。
     这是 P-16 边界的升级版：单个页面可以用 eager 动态 import 绕开，但整片共享图不行。
- 因此**下一任务的第一件事**是把 Lynx storage port 改成双线程安全：main thread 可读同步
  镜像、写入仍走 background bridge，并补齐 `flushStorageBeforePageHide` 等 Web port 导出，
  然后重跑同一探针继续收集下一条真实错误。在此之前不要再做 Sidebar 微切片。
- 本条目未改变任何门禁：Threads **25.40%**、style **98.04%**、两仓 `git diff --check` 通过；
  探针 import 与临时文件已还原，`npm run build` 恢复通过（1610.6/1726.0kB）。
  P6-C1 保持 `in_progress`。

### 2026-07-28 — 本会话收尾交接（停止原因：上下文预算；P6-C1 仍 in_progress）

- 本会话完成两刀（均已闭环并留证）：shared sidebar footer composition（25.31→25.36%）、
  shared sidebar surface content frame（25.36→**25.40%**）；另完成一次只读 Threads route
  编译探针（临时文件与 router import 已还原），产出 D12 与两条确定性阻塞。
- 终态门禁：Web `Sidebar.logic`+`Sidebar.uiState` **105/105**、production
  **8,841 modules**；slice `npx rstest` **23 passed / 0 failed**、production
  **1610.6/1726.0kB**；reuse `--check` Threads **25.40%**、style `--check` **98.04%**；
  两仓 `git diff --check` 通过。默认路由 `/`；用户 KV 未改；本会话启动的 Lynxtron
  （PID 25327、97386，client 8905/8903）均已停止，58090 与其他项目进程未触碰。
- 预存失败（非本轮引入）：Web `Sidebar.import.test.ts` 15s 加载超时；slice rstest 的
  lynx-ui vendor mjs 加载器失败（0 tests started）。
- **下一条精确命令序列**（从 slice 目录起）：
  1. 改 `slice/src/platform/storage.ts`：去掉模块级 `import 'background-only'`，把
     `bridgeCall` 的使用收进带 `'background only'` 指令的函数 + `webpackMode: "eager"`
     动态 import（同 04 P-16），并补 `flushStorageBeforePageHide` 导出（对齐
     `synara/apps/web/src/platform/storage.ts`）。main thread 只读同步 mirror。
  2. 重建临时探针 `slice/src/app/__probe.threadsRoute.ts`（内容见上一条目），在
     `src/app/router.tsx` 顶部临时 `import './__probe.threadsRoute';`，跑
     `npx rspeedy build --environment lynx`，收下一条真实错误。
  3. 每解决一条错误就重跑；错误清零后再决定共享入口落点，最后删除探针、`npm run build`、
     实机截图、串行 `node scripts/reuse-audit.mjs [--check]` 与
     `node scripts/style-audit.mjs [--check]`、两仓 `git diff --check`。
- 主仓本会话新增未提交文件：`components/SidebarFooterSection{,Elements}.tsx`、
  `components/SidebarSurfaceContent{,Elements}.tsx`，并改动 `components/Sidebar.tsx`
  （footer 与 content frame 两处调用点）。其余未提交改动仍属用户，未触碰。

### 2026-07-28 — P6-C1 心跳：Lynx storage port 双线程化 + 真实 client store 接管

- 按 D12 先解 main-thread 编译阻塞：`slice/src/platform/storage.ts` 去掉模块级
  `background-only`，把 bridge 调用收进 `'background only'` + `webpackMode: "eager"` 的
  `callBridge`，用 `__MAIN_THREAD__` 判定线程（main thread 只读同步 mirror、不落盘），
  并补上 Web port 的 `flushStorageBeforePageHide`（Lynxtron 无 page-hide 生命周期，
  按同签名显式空实现，不伪造）。`~/nativeApi` 的 `ensureNativeApi` 亦已按同契约补齐。
- 重跑 Threads route 探针（store / workspaceStore / composerDraftStore /
  lib.studioProjects / chatRouteRestore / RestoreOrCreateChatRoute）：**编译全绿**，
  Lynx bundle 1610→2167kB，说明整片依赖真的链接进来了，不是被 tree-shake 掉。
- 随后把探针换成真实产品消费：`app/queries.ts` 不再用 `storeState.initialState` +
  `storeProjection.syncServerReadModel` 做一次性纯函数投影，改为
  `@synara-web/store` 的真实 zustand `useStore.getState().syncServerReadModel(snapshot)`，
  sidebar projection 从该 store 读回。Lynx 与 Web 从此共用同一个 client state container。
- 实机验证：生产 Lynxtron（own client 8903、session 1、own PID 22183，已停止）截图
  `shots/2026-07-28/p6-c1-realstore/lynx.png` 与本会话前两张逐锚点一致，真实 thread
  数据照常渲染，`get-console --level error,warning` 无条目。
- 门禁：slice `npx rstest` **23 passed / 0 failed**；slice production
  **1723.4/1838.8kB**（+112kB，即真实 store 图的成本）；audit 串行 write→check：
  Threads **25.40% → 27.90%**（单刀 +2.5pt，约为此前每刀的 50 倍），style **98.04%**；
  两仓 `git diff --check` 通过。本刀主仓零改动。新增 P-68；P6-C1 继续 `in_progress`。
- 冷启动排序备注：`store.ts` 在模块加载期 `readPersistedState` 读 mirror，此时
  `hydrateStorage()` 可能尚未完成，因此持久化 UI state 首帧可能取默认值；服务端 read
  model 随后覆盖。Web 亦有同类顺序，暂不引入额外同步等待，留待 P7 状态收敛复核。
- 下一步：沿同一方法继续——把 `_chat.tsx` / `__root.tsx` 的真实 subtree 依赖面逐块放进
  compiler，按真实错误补最小 adapter，然后换成产品消费。优先 `routes/_chat.tsx`
  （609 LOC + 其传递依赖），其次 composer draft store 图。

### 2026-07-28 — 会话最终收尾（覆盖前一条交接；停止原因：上下文预算）

- 本会话共三刀：shared sidebar footer（25.31→25.36）、shared sidebar surface content
  frame（25.36→25.40）、**Lynx storage port 双线程化 + 真实 client store 接管**
  （25.40→**27.90%**）。方法论结论见 D12 与 P-66/P-67/P-68。
- 终态门禁：Web `Sidebar.logic`+`Sidebar.uiState` **105/105**、Web production
  **8,841 modules**（第三刀主仓零改动）；slice `npx rstest` **23/0**、production
  **1723.4/1838.8kB**；reuse `--check` Threads **27.90%**、style `--check` **98.04%**；
  两仓 `git diff --check` 通过。默认路由 `/`；用户 KV 未改；本会话启动的 Lynxtron
  （PID 25327/97386/22183）全部已停止；58090 与其他项目进程未触碰；临时探针文件与
  router 临时 import 均已删除。
- 预存失败（非本轮引入）：Web `Sidebar.import.test.ts` 15s 加载超时；slice rstest 的
  lynx-ui vendor mjs 加载器失败（0 tests started）。
- 主仓本会话未提交新增：`components/SidebarFooterSection{,Elements}.tsx`、
  `components/SidebarSurfaceContent{,Elements}.tsx`；改动 `components/Sidebar.tsx`
  两处调用点。其余未提交改动仍属用户。
- **下一会话精确起点**：重复第三刀的方法，目标 `routes/_chat.tsx`。
  1. 建临时 `slice/src/app/__probe.chatRoute.ts`，import `_chat.tsx` 的真实依赖面；
     router 顶部临时 import 之；`npx rspeedy build --environment lynx` 收错。
  2. 每条错误只补最小 adapter（port 导出缺失 → 补；线程边界 → 按 P-68 形状改；
     DOM/Base UI 叶子 → 精确 alias 到 Lynx Elements）。
  3. 编译通过后**必须换成产品消费**再计复用（探针本身不算），然后实机截图、
     串行 `node scripts/reuse-audit.mjs [--check]` 与 `node scripts/style-audit.mjs [--check]`、
     两仓 `git diff --check`，删除探针后 `npm run build`。

### 2026-07-28 — P6-C1 探针：`routes/_chat.tsx` 依赖面编译全绿（零新增 adapter）

- 在第三刀打通 storage port 线程边界后，立刻复用同一方法对 `_chat.tsx` 的非 DOM 依赖面
  建临时探针 `src/app/__probe.chatRoute.ts`：`appNavigation`、`ChatView.logic`、
  `hooks/{useHandleNewChat,useHandleNewStudioChat,useHandleNewThread,useRecentViewSwitcher}`、
  `latestProjectStore`、`lib/{projectShortcutTargets,threadBootstrap,spaces}`、
  `keybindings`、`spacesUiStore`、`threadSelectionStore`、`workspaceStore`。
- 结果：**编译全绿，零新增 adapter**；Lynx bundle 1723.4 → 2242.5kB（+519kB），证明整片
  依赖真实链接。P-68 修好的 port 线程边界是唯一的前置条件，这一点已被两次探针独立验证。
- 本轮**未**把它换成产品消费（上下文预算不足以完成"消费 + 实机 + 审计"完整闭环），因此
  不计入复用率：探针文件与 router 临时 import 已删除，`npm run build` 恢复
  1723.4/1838.8kB，Threads 保持 **27.90%**，style **98.04%**。
- 下一会话直接从"换成产品消费"开始，不必重跑探针：优先 `appNavigation` +
  `keybindings.resolveShortcutCommand`（Lynx 已有原生 Menu ⌘K / ⇧⌘[ ] 通道，可真实消费）、
  `lib/spaces.isOrdinarySpaceProject`（sidebar project partition 真实使用）、
  `workspaceStore` / `threadSelectionStore`（router 真实状态）。每块换完即实机 + 串行审计。

### 2026-07-28 — P6-C1 尝试并回滚：appSettings sort 默认值消费（缺像素证据）

- 尝试让 `slice/src/components/sidebar/sidebar.logic.ts` 不再硬写 `'manual'` /
  `'updated_at'`，改为消费 `@synara-web/appSettings` 的
  `DEFAULT_SIDEBAR_PROJECT_SORT_ORDER` / `DEFAULT_SIDEBAR_THREAD_SORT_ORDER`。
- 结果：**编译通过**，Lynx bundle 1723.4 → 1850.7kB（+127kB，appSettings 及其
  effect Schema / react-query / providerModelOptions 依赖图真实链接）；
  `npx rstest` **23/0**；production Lynxtron 启动后 DevTool `list-sessions` 仍能列出
  session 1（说明 bundle 加载未致命崩溃）。
- 但 `take-screenshot` 三次均在本轮命中已登记的 P-09（非前台窗口 DevTool 截图挂起/崩溃）。
  上次会话用 AXRaise 提升窗口绕过，需要辅助功能授权——按安全边界不代用户点权限框。
- 因此**按"编译通过 ≠ 能用"主动回滚**，不把无像素证据的消费计入复用率。回滚后
  `npm run build` 恢复 1723.4/1838.8kB，Threads 保持 **27.90%**。
- 结论沉淀（下次直接用）：appSettings 图在 Lynx 侧可编译可加载，只差实机像素证据；
  下一会话若能让窗口前台化（或 P-09 有其它绕法），这一刀可直接重做并计入。

- 补记：换新窗口重试一次后 `take-screenshot` 仍崩（本轮 client 8903、PID 88780/88943），
  确认是 P-09 前台窗口依赖而非偶发。**外部硬阻塞**：取像素证据需 AXRaise/辅助功能授权，
  属不可代用户点击的系统权限。因此该刀二次回滚，Threads 维持 27.90%；进程已停止。
- 再补记（重要，纠正上一条）：第三次重试时 `take-screenshot -c localhost:8903` **拍到的是
  别的项目**（lynxtron-examples 的 Drag&Drop fiddle）——8903 已被其它实例占用。按 P-09/P-21
  必须以 PID→lsof 定位自有 client：本轮自有端口实为 **8909**，`list-sessions` 确认
  session 1 指向本 slice bundle，但对 8909 的 `take-screenshot` 仍崩（自有窗口非前台）。
  故上一条"截图恢复"的判断作废，外部硬阻塞成立且已用正确归属复验。appSettings 刀第三次
  回滚，Threads 维持 27.90%，无遗留截图产物，自有 Lynxtron 已停止。
- 第三补记：又试了一次**无需系统授权**的绕法——临时给 `src/main/desktop/main.ts` 的
  `LynxWindow` 加 `alwaysOnTop: true`（P2-V1 曾用过的可逆手法），重建后自有实例确实占到
  8903，但 `take-screenshot` 仍以未捕获异常退出。说明当前失败**不只是**前台窗口问题，
  devtool CLI 本身在本机当前状态下不稳定（与 P-09 记录的"session 存在但截图挂起"一致）。
  两处临时改动（appSettings 消费、alwaysOnTop）均已回滚并重建，产物目录已删除，
  `main.ts` 恢复原窗口参数。Threads 维持 **27.90%**。

### 2026-07-28 — appSettings 消费：阴性结论（非工具问题，是真实渲染失败）

- 用户提示后重试 devtool：**同一端口 8903、同一命令**，回滚版 bundle（1723.4kB）截图成功
  且画面正确（真实 Synara sidebar/thread）；换成 appSettings 版 bundle（1850.7kB）后，
  `list-sessions` 仍列出 session 1，但 `take-screenshot` 连续 5 次全部未捕获异常退出，
  `get-console` 也取不到任何条目。
- 结论修正：先前记的"DevTool 截图外部硬阻塞"**不成立**。真实原因是
  **appSettings 图进入 Lynx 后页面不绘制**（与 D11 记录的"能编译但不绘制"同类，
  很可能是模块加载期副作用：`useLocalStorage` / `serverSettingsQueryOptions` /
  `ensureNativeApi` 之一在 background 线程初始化时静默失败）。编译通过 + rstest 23/0 +
  session 存在，全都不能证明可用——本例正是该教训的又一次实证。
- 该刀已第四次回滚（这次是有依据的否决，不是保守）。Threads 维持 **27.90%**，
  build 恢复 1723.4/1838.8kB，无遗留截图产物，自有 Lynxtron 已停止。
- 下一会话若要接 appSettings：先做最小化二分（只 import 常量 → 加 useLocalStorage →
  加 serverReactQuery），每步实机截图定位真正的加载期副作用，再决定是补 adapter 还是
  把 sort 默认值下沉到一个无副作用的 `SidebarDefaults.logic` 级共享源。

### 2026-07-28 — P6-C1：sort defaults 以无副作用共享源落地（阴性结论后的正解）

- 上一条阴性结论直接给出解法：不是放弃 appSettings，而是把两个 sort 默认值搬到**无加载期
  副作用**的物理共享源。主仓新增 `apps/web/src/sidebarSortDefaults.ts`（只有字面量与类型），
  `appSettings.ts` 改为从它 import 并原样 re-export，`Schema.Literals` 也复用同一数组，
  因此所有既有 Web 调用点零改动。
- Lynx `sidebar.logic.ts` 消费同一物理文件，删掉 `'manual'` / `'updated_at'` 两处硬写。
  **Lynx bundle 保持 1723.4kB**（对比 appSettings 版 1850.7kB），证明 appSettings 未被拉入，
  副作用源已隔离。
- 验证：Web `bunx vite build` **8,842 modules**；Web `appSettings` + `Sidebar.logic`
  测试 **158/158**；slice `npx rstest` **23/0**；slice production **1723.4/1838.8kB**；
  实机截图 `shots/2026-07-28/p6-c1-sort-defaults/lynx.png` 与本会话前三张逐锚点一致，
  console 无 error/warning；两仓 `git diff --check` 通过。
- 复用率：Threads eligible 372→373 modules，gate 保持 **27.90%**（新模块很小，未改变百分比，
  但消除了一处会静默漂移的双写，并把 appSettings 的副作用边界记录清楚）。
- 方法论沉淀：遇到"共享大模块导致 Lynx 不绘制"时，优先**把需要的纯数据抽成无副作用模块**，
  而不是给大模块补 adapter 或放弃共享。这条比 P-68 更常用，下次遇到 whatsNew/entries、
  providerModelOptions 等同类可直接套用。

### 2026-07-28 — 收口挂起决策 + 验证脚本化（回应"有决策点就推进不下去"）

- 自我纠正：把 D3/D12 挂成"等用户拍板"违反了 goal prompt 的"禁止提问、无明确决策时选最
  保守可逆方案并继续"。本条按该规则收口，两项均可逆。
- **D3 定案 🟢 = c**（放弃 0.0.7 webview 兜底）。理由是 P0-S5 的阴性实测（无 CEF、插入元素
  即崩），不是产品偏好，本就不该等人拍板。P3-E6 标注"依赖上游能力，不阻塞 Phase 6–8"。
- **D12 定案 🟡**：≥70% 的**强制放行点移到 P6-C6**（六屏一起验，与 06 的 Phase 出口表述
  一致），每个 C 任务继续报本屏数字作为进度指标；另给 P6-C1 加**自有子图门禁**（shell +
  sidebar 入口子图，排除 composer/ChatView/terminal/transport）。原因：复用率按路由图计算，
  `/` 天然含 C2/C3 范围的模块，"C1 必须 ≥70%"与"C2 依赖 C1"自相矛盾。阈值一点未降。
- **D2 仍待用户**（终端一期裁剪 vs 投入原生终端）——这条是真实产品范围取舍，不代拍。
  我的建议写在 03/LOG：一期裁剪，登记为 hard island，Phase 8 后再评估。
- 新增 `scripts/capture.sh`：PID→lsof 解析自有 client 端口 → list-sessions 校验 →
  截图 → get-console，一条命令完成。解决本轮两个真实事故：端口被别的项目占用导致误拍，
  以及"session 存在但页面不绘制"时截图静默失败（脚本会明确报"bundle 加载中或加载即崩"）。
- 01-roadmap 的 P6-C1 状态行已相应改为"route gate 27.90% 为进度指标；C1 自有子图门禁待建"。
- 下一会话第一件事：按 D12 在 `plan/reuse-audit.config.json` 增加 C1 子图 screen 定义
  （webEntries 只取 shell/sidebar 入口），跑出基线，再继续 `_chat.tsx` 的产品消费。

### 2026-07-28 — P6-C1 自有子图门禁落地（D12 第二步）

- 按 D12 在 `plan/reuse-audit.config.json` 新增 screen `threads-shell`
  （label "Threads shell + Sidebar (P6-C1 own subgraph)"，webEntry 仅
  `components/Sidebar.tsx`，Lynx 对应 `Sidebar.lynx.tsx`）；配置内写明 composer /
  ChatView / terminal / transport 属 P6-C2/C3，由完整 `threads` route screen 度量。
- 首次基线：**threads-shell 328 modules / 320 eligible / gate 32.04%**
  （完整 threads route 同时 27.90%，作为进度指标保留）。C1 从此有一个不依赖 C2/C3 就能
  推到 70% 的真实门槛——这也说明 `Sidebar.tsx` 自身仍拉了 328 个模块，后续切口应优先
  瞄准这张子图里的大块，而不是完整 route 图。
- `node scripts/reuse-audit.mjs --check` 通过；两仓 `git diff --check` 通过。
- 下一会话起点更新为：以 **threads-shell 32.04% → 70%** 为 C1 的推进目标，
  按 P-68 / 无副作用抽取两条方法从该子图的最大未映射模块开始；完整 route 图的
  composer/ChatView/transport 留给 C2/C3。

### 2026-07-28 — D2 用户定案：终端一期裁剪

- 用户明确"终端一期裁剪"。03 新增 D2 🟢 定案；01-roadmap 的 **P3-E5 由 pending 改为
  descoped（一期）**，terminal（terminalRuntime 1,209 LOC + Threads 图内约 4,646 LOC）
  整体登记 hard island。terminal 本就是 EXCLUSIVE、不进 eligible 分母，故不改变任何
  已有复用率数字，也不构成"扩大排除集刷数字"。
- 至此 **D2 🟢 / D3 🟢=c / D12 🟡 三项全部收口**，停止条件 (b) 中不再有待用户决策的任务；
  仅剩 D8（签名/公证）只阻塞对外发行。`plan/08-continue-goal-prompt.md` 已同步。
- Phase 8 完成报告需列"终端未移植"为已知能力差距；后续若要补，路径是新建原生终端模块 +
  在 02 登记新 SPLIT，不是把 xterm 塞进 Lynx。

### 2026-07-28 — D13 用户重定优先级：聊天主 UI 高优，门禁让掉

- 用户决策三点：① terminal 与内嵌 browser **留 placeholder**（保留入口与说明性占位表面，
  不移植 runtime）；② 其余聊天主 UI 全部高优，尤其**基于 `<list>` 的完整聊天能力**；
  ③ **强制点可以让掉**。
- 文档已同步：03 新增 D13（并修订 D2/D3、取代 D12）；01-roadmap 在 Phase 6 前加执行顺序
  横幅并把 P3-E5 改为 placeholder；06 在阈值段前加 D13 修订说明。
- **新放行标准**：以 06 的视觉契约为准（两尺寸、锚点 ≤8px、字号 ≤2px、semantic tokens、
  同源真实数据、无未登记差异），复用率降为附带记录的目标值。
- **新执行顺序**：P6-C2（Thread + Transcript + `<list>`）→ P6-C3（Composer）→ P6-C1 收尾
  → P6-C4 → P6-C5 → P6-C6 → Phase 7 → Phase 8。
- P6-C2 起步资产：P0-S4 已实测 `<list>` 滚动跟随三语义（吸附/脱离/重吸附，eventSource
  门 + BOTTOM_EPS + scrollToPosition，见 04 P-02）；P2-V5 有 Lynx Markdown renderer；
  P2-V6 有真实 WS transcript。C2 的任务是把这些换成**原 Web thread surface / message row
  组合的物理共享**，只把 list 与 markdown renderer 留作平台岛。

### 2026-07-28 — P6-C2 开始（D13 后的最高优先级）

- 任务置 in_progress。目标：把 slice 自绘的 Transcript 换成**原 Web thread surface /
  message row 组合的物理共享**，只保留 `<list>` 与 Markdown renderer 作为平台岛。
- 起步资产：04 P-02（`<list>` 吸附/脱离/重吸附三语义 + eventSource 门 + 16ms 节流）、
  P2-V5（ChatMarkdown.lynx.tsx）、P2-V6（真实 WS transcript 通路）。
- 第一步：审计主仓 thread 路由与 ChatView 的真实组合边界，建临时探针收编译错误。

### 2026-07-28 — P6-C2 心跳：assistant 显示文本走 Web timeline 同一解析

- 先探针后消费：`MessagesTimeline.logic`、`ChatView.logic`、`ChatView.selectors`、
  `storeSelectors`、`routes/-chatThreadRoute.logic` **零新增 adapter 编译通过**
  （探针期 bundle 1723.4 → 1775.1kB，证明真实链接）；探针与 router 临时 import 已删除。
- 产品消费：`Transcript.tsx` 不再直接渲染 `message.text`，改用 Web timeline 的
  `resolveAssistantMessageDisplayText` —— streaming 轮渲染空、无文本的完成轮渲染同一句
  `(empty response)`，两端语义一致。
- 门禁：slice `npx rstest` 23/0；production **1729.5/1844.9kB**；实机截图
  `shots/2026-07-28/p6-c2-assistant-text/lynx.png` 真实线程渲染正常、console 无
  error/warning；`scripts/capture.sh` 首次使用即自动命中自有 client（8904），
  验证了 PID→lsof 定位的必要性（本机端口确实在漂移）。
- P6-C2 继续 in_progress。下一步：把 message row 的角色/头部/气泡结构从 slice 自绘换成
  原 Web message row 组合的物理共享，`<list>` 与 markdown renderer 保留为平台岛。

### 2026-07-28 — P6-C2 心跳：transcript typography 物理共享（并再次命中 appSettings 副作用）

- Lynx transcript 改用 Web `components/chat/chatTypography.ts` 的
  `getChatTranscriptTextStyle` / `getChatTranscriptUserMessageTextStyle` 推导字号与行高，
  不再用手调 Lynx CSS。两端排版从此单点决定。
- 过程中第二次命中 appSettings 加载期副作用：`chatTypography` 静态 import 了它，bundle
  由 1729.5 → **1857.4kB**（+128kB）即是信号。按已验证解法抽出无副作用
  `apps/web/src/chatFontSize.ts`（MIN/MAX/DEFAULT + normalizeChatFontSizePx），
  `appSettings` 原样 re-export 保持 Web 调用点零改动，`chatTypography` 改从它 import。
  bundle 回到 **1730.8kB**，隔离成立——bundle 体积作为隔离判据再次奏效。
- 门禁：Web `bunx vite build` **8,843 modules**、appSettings 测试通过；slice `npx rstest`
  **23/0**；slice production **1730.8/1846.2kB**；实机截图
  `shots/2026-07-28/p6-c2-typography/lynx.png` 渲染正常、console 无 error/warning；
  两仓 `git diff --check` 通过。
- P6-C2 继续 in_progress。下一刀：message row 的角色标签/头部/气泡容器结构下沉为物理共享
  （`<list>` 与 markdown renderer 仍为平台岛）。

### 2026-07-28 — 会话收尾（上下文预算，按 goal 第十节协议）

- 当前 task：**P6-C2 in_progress**（P6-C1 亦 in_progress，按 D13 让位）。
- 本会话 P6-C2 已完成两刀：① assistant 显示文本走 Web `resolveAssistantMessageDisplayText`；
  ② transcript typography 走 Web `chatTypography`（并抽出无副作用 `chatFontSize.ts`）。
- 验证终态：Web `bunx vite build` **8,843 modules**、appSettings 测试通过；
  slice `npx rstest` **23/0**；slice production **1730.8/1846.2kB**；
  参考指标 thread **16.21%**、threads-shell **32.05%**、style **98.04%**；
  两仓 `git diff --check` 通过。
- 进程/PID：本会话启动的 Lynxtron 全部已停止（`pgrep -f "lynxtron dist/desktop"` 为 0）；
  未触碰用户 58090 server 与其它项目实例。路由保持 `/`，用户 KV 未改。
- 临时文件：无残留（本会话两个探针 `__probe.chatRoute.ts` / `__probe.chatSurface.ts`
  与 router 临时 import 均已删除；`alwaysOnTop` 临时窗口参数已还原）。
- **下一条精确命令**（下会话第一步）：
  1. `cd slice && cat > src/app/__probe.messageRow.ts`，import 主仓 message row 相关真实
     组件面（先看 `apps/web/src/components/chat/` 下 MessagesTimeline 渲染层与
     MessageActionButton / MessageCopyButton / chatTypography 的调用方）；
     router 顶部临时 `import './__probe.messageRow';`；
  2. `npx rspeedy build --environment lynx` 收错；**若 bundle 体积异常上涨，先查是否又拉进
     appSettings 类副作用模块，按 chatFontSize.ts 的方式抽纯数据**；
  3. 编译通过后换成产品消费（角色标签/头部/气泡容器结构），删探针，
     `./scripts/capture.sh shots/2026-07-28/p6-c2-message-row/lynx.png` 取像素证据；
  4. 串行 audit write→check + 两仓 `git diff --check`，更新 01/02/04/LOG。
- 新发现（已在上一条目详述）：**bundle 体积是副作用模块是否被真正排除的可靠前置判据**，
  比事后截图发现白屏快得多；本会话第二次命中 appSettings 即靠它当场识破。

### 2026-07-29 — 主仓 fork remote 与提交策略

- 用户澄清最终主要工作仓库是 `~/github/synara`。已将其原
  `origin=https://github.com/Emanuele-web04/synara.git` 改名为 `upstream`，并新增
  `origin=https://github.com/Huxpro/synara-lynxtron.git`；`main` 继续跟踪
  `upstream/main`，仓库级 `remote.pushDefault=origin`，避免默认 push 到上游。
- `synara-lynx` 仍保留为迁移 staging/control plane（slice/plan/audit/shots/spikes），
  直到 D7 在 P6-C6/P8-Q1 完成单仓收敛后再归档，当前不能删除。
- 提交策略更新：后续可在 `synara` 的自然、已验证检查点提交本迁移范围代码，但**不为提交
  打断当前 in-progress 工作**，不夹带用户无关改动；没有用户明确要求时仍不 push/PR。
  07/08 prompt 与 README 已同步。

### 2026-07-29 — P6-C2 心跳：message-row anatomy 物理共享

- 先完成 objective 要求的确定性 SSOT 同步：README 当前主线与 D2/D3/D13、03 顶部决策表、
  01 的 P3-E6/P6-C1/P6-C6/P8-Q4 已与较新 LOG+D13 对齐；历史正文和截图 notes 未改。
- compiler-first 探针结果：完整 `MessagesTimeline` 依赖图进入 Lynx main-thread bytecode 时
  报 `SyntaxError: invalid escape sequence in regular expression`；缩到
  `MessageActionButton` + `MessageCopyButton` 后 **1861.4kB 编译通过**。探针文件与 router
  import 已删除，阴性结论写入 02，方法写入 P-69。
- 产品消费：主仓新增物理共享 `MessageRowComposition.tsx`，Web `MessagesTimeline` 的真实
  user row/column/bubble 与 assistant body 已改为消费它；Lynx `Transcript` 消费同一文件，
  仅 Elements alias 到 `<view>`。slice 自绘角色标签、assistant border/card/background、
  重复 user bubble geometry 已删除；`<list>` 与 Markdown renderer 保持平台岛。
- 验证：Web focused `MessagesTimeline.logic` **64/64**；Web production **8,845 modules**；
  slice production **1733.3kB Lynx / 1848.7kB desktop**；生产 Lynxtron 自有 client 8904
  截图 `shots/2026-07-29/port/p6-c2/message-row/lynx.png`，console 无 error/warning，
  进程已停止。slice focused（排除已知 loader-only `index.test.tsx`）**23/0**；
  全量 Rstest 的 **23/23 assertions 均通过**，但 Node 26 与 22.19 两次都在
  已知 `lynx-ui` generated vendor mjs 加载阶段把 1 file 标 fail
  (`Invalid left-hand side in assignment`)；clean temp rerun仍复现，未伪报 23/0。
- audit 串行 write→check：threads **27.91%**、threads-shell **32.05%**、
  thread **16.26%**（16.21→16.26）、settings **24.99%**、projects/kanban **23.20%**、
  pull requests **24.62%**；style **98.04%**。两仓 `git diff --check` 通过。
- 临时状态：路由未改，未造 fixture，未主动修改用户 KV；启动时产品自身按既有 hydration
  写回 renderer-state，内容未人为更改。自有 Lynxtron 已停止，用户 58090 与其它项目
  Rspeedy/Lynxtron 未触碰。
- P6-C2 保持 `in_progress`。下一刀从 `MessagesTimeline.logic` 的真实 rows 消费开始：
  把 system/tool/status 的 discriminant 与 composition 接进产品 Transcript，再验证
  streaming 追加中/完成两帧、长消息/code/GFM table；之后按 05 做同 server 双尺寸 paired
  gate，不能用本轮单张 Lynx runtime frame 宣称整屏完成。

### 2026-07-29 — P6-C2 心跳：真实 timeline discriminant + tool/status row 产品消费

- 修复真实数据截断：slice `SynaraThread` facade 不再只保留 messages，现保留
  `activities` / `proposedPlans` / `latestTurn` / `session`；background query 直接消费 Web
  `deriveWorkLogEntries` → `deriveTimelineEntries` → `deriveMessagesTimelineRows`，把真实 row
  union 送进 `<list>`，未造 fixture、未改 route、未手动改用户 KV。
- compiler-first：上述三个纯 projection 函数临时探针 **1733.9kB 编译通过**；完整
  `MessagesTimeline` 仍命中已记录的 regex bytecode 阴性边界。探针与 router 临时 import
  已删除。PrimJS 无 `toSorted`，故主仓 `workLog.ts` 与 `MessagesTimeline.logic.ts` 三处改为
  等价不可变 spread+sort，Web focused tests **135/135**。
- 物理共享：主仓新增 `TimelineStatusRowComposition(.tsx/Elements.tsx)`；Web
  `TimelineWorkEntryRow` 的普通 compact tool/status 行、`MessagesTimeline` 的 system/
  thinking 行已改为产品消费；Lynx 仅 alias Elements 到 host `<view>/<text>`。slice
  `Transcript` 覆盖 standalone work、assistant leading/inline work、settled
  `collapsedTurnItems`、working/header、plan/worktree fallback，且 tail version 包含 work
  状态变化以保持吸底更新。
- 实机先发现一处真实遗漏：选中的 58090 thread 含 **2 messages + 6 activities**，但首帧
  `shots/2026-07-29/port/p6-c2/timeline-rows/lynx.png` 没有 activity；只读检查确认 Web
  projection 将 runtime warning 折进 assistant 的 collapsed placement，而 slice 当时只画
  standalone work。补齐全部 message-attached placement 后，
  `lynx-collapsed.png` 出现 `Details`；通过 Lynx DevTool DOM box + touch 打开后，
  `lynx-expanded.png` 画出真实 server runtime warning，console error/warning 为空。
  这三帧和检查单见同目录 `notes.md`；第一帧明确保留为阴性证据。
- 门禁终态：Web production **8,847 modules**；slice focused（排除既有 loader-only
  `index.test.tsx`）**23/23**；slice production **1800.3kB Lynx / 1800.3kB desktop**
  （desktop total **1915.7kB**）。警告仅既有 Lynx `color-scheme`/`text-transform` 剥离与
  ws optional native addon。
- audit 严格串行 write→write→check→check：threads **27.91%**、threads-shell
  **32.05%**、thread **16.32%**（16.26→16.32）、settings **24.99%**、
  projects/kanban **23.20%**、pull requests **24.62%**；style **98.04%**。两仓
  `git diff --check` 通过。
- 进程/临时状态：两次 repo-owned Lynxtron 均已 SIGINT 停止；用户 58090 server
  （PID 5203）未触碰；无 route/fixture/KV/window override；projection probe 已删，
  `/tmp` DOM dump 已清理。
- **P6-C2 仍为 in_progress**：当前真实 snapshot 没有 running turn，不能伪造 streaming
  两帧或宣称完成。下一刀精确起点：为 `Transcript` 的 long/code/GFM/empty/system rows
  增加真实 row-level fixture-free test coverage，随后等待/捕获真实 active turn 的
  append-in-progress + completed-restick 两帧；再按 plan/05 跑同 server、同 route/state 的
  Web↔Lynx 1280×820 与 1440×900 paired gate，并实测上滚脱离/重吸附。

#### 同日补刀：attached-work / tail-version 纯逻辑测试边界

- 从 `Transcript.tsx` 抽出无副作用 `transcriptRows.logic.ts`，产品继续消费同一 helper；
  它集中决定 live assistant 的 leading/inline placement、settled collapsed 单一展示，以及
  message/standalone work 状态变化进入 `<list>` 吸底 version。新增 4 条 Rstest，focused
  **4/4**、slice broad（排除既有 loader-only `index.test.tsx`）**27/27**。
- 曾新增 `markdownAst.test.ts` 直接执行 unified/remark parser；4 条 transcript assertion
  已通过，但该文件在任何 Markdown assertion 执行前命中既有 generated vendor `.mjs`
  `Invalid left-hand side in assignment` loader 缺陷。为避免给 suite 增加第二个永久 fail，
  该 test 文件已删除；Web canonical fenced-code 测试单跑 **1/1**。Web ChatMarkdown +
  timeline 合跑为 **86 pass / 1 fail**，唯一失败是既有 favicon spacing expectation
  `mr-0.5` 对当前产品 `mr-1`，与本刀无关且未顺手修改。
- production：Web **8,847 modules**；slice **1800.7kB Lynx / 1800.7kB desktop**
  （desktop total **1916.1kB**）。本刀无像素/交互变化，沿用上一组真实 closed/open
  disclosure runtime evidence，不制造重复截图。
- audit 再次严格串行 write→write→check→check，数字不变：thread **16.32%**、
  threads **27.91%**、threads-shell **32.05%**、style **98.04%**。下一步仍是捕获真实
  running turn 的 streaming 两帧；若 server 仍无 active turn，则先做长消息/code/GFM 的
  Lynx runtime evidence与滚动 detach/re-attach，不以 synthetic server data替代。

### 2026-07-29 — P6-C2 心跳：真实 settled transcript 双尺寸 paired gate

- 同一用户 server（58090/PID 5203）、同一 sequence 31 snapshot、同一真实 thread
  `72d62436-8d35-43d2-9329-1c1367967d8d` 完成 Web↔Lynx 1280×820 与 1440×900
  collapsed paired capture，并分别用浏览器 click / Lynx DevTool touch 捕获 1280 expanded
  disclosure；无 fixture、send、route 替换或 server 写入。
- 首轮 paired 暴露并修复三处真实差异：① real thread route 绕过 shared 736px frame 且保留
  诊断 header；现消费 shared `ChatSurfaceHeaderFrame/Identity` 与
  `ComposerColumnFrameSurface`；② header 固定 OpenAI，现按 real `claudeAgent` 选择主仓 raw
  SVG；③ slice 从 raw RPC message 投影导致 `completedAt` 缺失并显示 `Details`，现先进入
  Web normalized store，再投影为 canonical `Worked for 21s`。
- disclosure 与 status row 对齐 Web：label-before-chevron、真实 info checkmark、label/detail
  无自绘分隔点、`maxlines=1` 单行省略。expanded 两端均显示同一真实 runtime warning。
- paired transcript anchors：两尺寸 736px frame 左右 **0px**；label x **3px**；divider
  x **7/5px**；assistant x **5px**；label y 约 **8px**；assistant y 约 **7px**；font
  **0px**，满足 ≤8px / ≤2px。证据与范围声明见
  `shots/2026-07-29/port/p6-c2/paired-real/notes.md`。Composer 明确留给 P6-C3，sidebar
  留给 P6-C1，不把整屏差异冒充 C2 failure/pass。
- 验证：slice broad（排除既有 loader-only `index.test.tsx`）**27/27**；Web focused
  **5/5**；Web production **8,847 modules**；slice production **1798.6kB Lynx**，
  desktop total **1914.0kB**。警告仍仅既有 Lynx CSS 剥离、ws optional native addon 与
  Web chunk-size提示。
- audit 严格串行 write→write→check→check：threads **27.91%**、threads-shell
  **32.05%**、thread **16.32%**、settings **24.99%**、projects/kanban **23.20%**、
  pull requests **24.62%**；style **98.04%**。
- 临时状态：repo-owned Lynxtron 与 isolated browser session 已关闭；用户 server 未触碰；
  1440 window override 已 byte-exact 恢复到原 1280×820，SHA-256
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
- **P6-C2 仍为 in_progress**：当前 snapshot 仍无 running turn、long/code/GFM table、
  empty assistant 或足以 overflow 的 transcript。下一步必须用真实状态补 streaming append/
  completion 两帧、长 Markdown/code/table/empty 和 `<list>` stick→detach→restick；不以
  synthetic server data 宣称完成。

### 2026-07-29 — P6-C2 心跳：production renderer / virtual-list probe

- 用仅存在于 capture 期间的 in-memory route 构造 **30 rows**，直接渲染 production
  `Transcript`/`<list>`/`ChatMarkdown`：long Markdown、fenced TS、GFM table、empty
  settled assistant、足以 overflow 的 12 组 turns 与 streaming tail；没有写 server、
  用户 thread 或 KV。Web 侧同 payload 通过 canonical `MessagesTimeline`/`ChatMarkdown`
  临时 Vite entry 捕获，entry 与 route 随后全部删除。
- 实机生命周期按 production controls 执行：初始 pinned → streaming append 吸底 →
  real pointer drag detach → detached 再 append → `Jump to latest ↓` restick → complete。
  detached append 前后两张 PNG **byte-identical**，共同 SHA-256
  `2043ee5a3c1c8c29bf051b67552f44ca8d9f785128c41c041a17c42064b29ff9`；
  restick 后 tail 明确出现 `Appended chunk 19` 与 `Appended chunk 38`，jump 消失；
  probe-only 外部标签由 `Fixture state: streaming` 切到 `Fixture state: complete`。
- rich frame 同屏确认 Lynx heading/strong/emphasis/inline code/link/task list、horizontal
  GFM table、code block、long wrap 与 canonical `(empty response)`；Web frame确认同一语义
  payload 的产品 renderer。此组是 renderer/behavior gate，不另冒充 light↔dark pixel gate；
  严格双尺寸 paired geometry 继续引用真实 snapshot `paired-real`。
- 证据/边界：`shots/2026-07-29/port/p6-c2/transcript-probe/notes.md`。isolated browser、
  Vite 与 repo-owned Lynxtron 均关闭；临时源文件无残留；window-state SHA-256 仍为
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；用户 58090/PID
  5203 未触碰。
- 清理后门禁：slice broad（排除既有 loader-only `index.test.tsx`）**27/27**；Web
  focused **5/5**；Web production **8,847 modules**；slice production **1798.6kB
  Lynx / 1914.0kB desktop total**。audit 严格串行 write→write→check→check：
  threads **27.91%**、threads-shell **32.05%**、thread **16.32%**、settings
  **24.99%**、projects/kanban **23.20%**、pull requests **24.62%**；style
  **98.04%**（2,256 classes / 13,156 weighted）。两仓 `git diff --check` 通过。
- 最后只读复查 58090：snapshot 仍为 sequence **31**、2 threads、**0 running /
  0 streaming**；没有可捕获的真实 active turn。
- **P6-C2 仍为 in_progress**：这组 probe 关闭 production renderer、overflow 与 list
  lifecycle 风险，但不能把 synthetic streaming flag 当作真实 orchestration event。最终缺口
  缩为实际 server-owned running turn 的 append-in-progress + completed 两帧。

### 2026-07-29 — P6-C2 心跳：shared empty/loading/error/offline states

- Web 产品将 `ChatEmptyStateHero` 与 `PanelStateMessage` 的 host JSX 分到 canonical
  Elements 文件；共享 source 仍单点拥有 visibility/order/copy/anatomy。slice 以最小
  `<view>/<text>` adapter 消费同一物理 composition，并在 `ThreadPage` 通过纯
  `resolveThreadPageState` 选择 transcript/loading/offline/error/empty；真实 transcript
  继续进入 production `<list>`。
- 新增 4 条 state resolver 测试和 Web empty/panel regression；清理后 slice broad
  **31/31**、Web focused **8/8**。Web production **8,849 modules**；最终 slice production
  **1805.6kB Lynx / 1921.0kB desktop total**。警告仍仅既有 Lynx CSS 剥离、
  `ws` optional native addon、Web chunk-size/plugin timing。
- compiler/runtime 阴性：`ChatEmptyStateHero` 首版对 Elements 使用相对 import，双端
  production 均 green，但 Lynx DOM text box 为 0×0 且 hero 不绘制。改成 canonical
  `~/components/chat/ChatEmptyStateHeroElements` 后，同一只读 missing-thread product
  route 画出 logo / `Let's build` / project label，console error/warning 为空。保留
  `lynx-empty.png` 阴性与 `lynx-empty-fixed.png` 修复帧，固化 P-58/P-71。
- `PanelStateMessage` 的 offline copy 用临时 product-component route 实机绘制；它是
  renderer probe，不是网络 outage integration proof。尝试用启动环境覆盖 WS URL 未替换
  production bundle 的 endpoint，误命名帧已删除，没有把真实 transcript 冒充 offline。
  完整范围、hash 和边界见
  `shots/2026-07-29/port/p6-c2/thread-states/notes.md`。
- audit 严格串行 write→write→check→check：threads **27.91%**、threads-shell
  **32.05%**、thread **16.38%**（16.32→16.38）、settings **24.99%**、
  projects/kanban **23.20%**、pull requests **24.66%**；style **98.04%**
  （2,256 classes / 13,156 weighted）。两仓 `git diff --check` 通过。
- 最后以 user server 的 SQLite projection 做只读复查：sequence **31**，`Simple Greeting`
  为 2 messages / 6 activities，`Greeting` 为 1 / 0；两者均 0 streaming message、
  无 provider open turn。PID 5203 仍存活且未触碰。
- 清理/恢复：临时 `ThreadStateProbePage` 与 route 已删除，repo-owned Lynxtron 全部停止；
  没有 server/KV 写入；window-state SHA-256 仍 byte-exact 为
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。其他 workspace
  的 Lynxtron 进程未触碰。
- **P6-C2 仍为 in_progress**：当前 real snapshot 仍没有 server-owned running turn。
  下一刀继续只读复查实际 orchestration；一旦出现 active turn，立即捕获真实
  append-in-progress + completed 两帧并完成最终 paired gate。synthetic renderer/state
  probe 不替代该出口。

### 2026-07-29 — P6-C2 strict blocked audit

- 再次读取 goal SSOT 并调用 goal get，长程 Phase 6–8 scope 未缩小。随后以
  `sqlite3 -readonly` 复查 user server projection：snapshot sequence 仍为 **31**；
  `Simple Greeting` 仍为 2 messages / 6 activities，`Greeting` 为 1 / 0；两条 thread
  均 **0 streaming messages / 0 provider open turn**。PID 5203 仍存活且未触碰。
- 同一缺口已经跨连续四次 P6-C2 续跑成立：real settled paired gate → renderer/list
  lifecycle probe → shared empty/loading/error/offline states → 本次只读复查。此前三刀已把
  所有不依赖外部 turn 的安全工作关闭；继续拆分不能产生 goal 明确要求的真实
  append-in-progress + completed 两帧。
- 不创建 thread、不发送 prompt、不启动 provider turn：这会改 user server、可能触发外部
  provider 成本/副作用，超出只读验证授权；synthetic state 又被 SSOT 明确禁止替代出口。
  D13 还要求 P6-C2 达到放行标准后才能进入 P6-C3，故不能绕过该 gate 推进后序任务。
- 按 Codex blocked audit（同一条件连续至少三次且无安全绕法），P6-C2 与总 goal 现标记
  **blocked**，不是 completed。恢复点精确为：真实 server-owned open turn 出现后，立即
  运行 production Web/Lynx 同 snapshot capture，保存 streaming append 中与 completed
  restick 两帧；重跑 focused tests、双端 production、serial audits、双仓 diff check，
  然后才可把 P6-C2 标 completed 并进入 P6-C3。
- 当前已闭合证据继续有效：Web **8,849 modules**；slice **31/31**；Web focused **8/8**；
  slice production **1805.6kB Lynx / 1921.0kB desktop total**；thread reuse **16.38%**；
  style **98.04%**。临时 route/fixture/process 无残留，window state 与用户 KV 未改。

### 2026-07-29 — P6-C2 completed：真实 provider streaming + host-driven polling

- 用户明确授权发送验证 prompt 后，先后尝试已有 Claude/Codex/OpenCode provider session；
  Claude process tree 与 Codex stdin 无法恢复，OpenCode 新 turn 可用。最终证据 thread 为
  `07cf7e71-d0a9-4dc3-8938-3c6e1d971c13`（`Streaming validation output`），model
  `opencode/deepseek-v4-flash-free`。production Web 与 Lynx 同连 user-owned
  `127.0.0.1:58090` / PID 5203、同 thread/snapshot/route。
- 捕获 `web-streaming-finalproof.png` 的 spinner + stop-square 时，同一 running interval
  的 `lynx-streaming-finalproof.png` 已出现增量 `FINALPROF-*` tail；完成后保存 1280×820
  与 1440×900 paired frames。1440 最终 Lynx frame 也验证 raw snapshot title
  `Streaming validation output`。完整路径、hash、边界与 cleanup 见
  `shots/2026-07-29/port/p6-c2/real-streaming/notes.md`。
- 实机定位了两条 build/test 捕获不到的 runtime 差异：ReactLynx background 没有
  `globalThis.setInterval/setTimeout`；React Query 手动 refetch 成功后 mounted observer
  仍不重渲染。新增 desktop `timerSleep` delayed reply，ThreadPage 用 cancellable
  single-flight local-state polling；route 以 thread id key remount；transcript/header 同轮
  更新。`snapshotSequence` cache 复用 unchanged rows/summary 引用，避免 500ms poll
  重复 store sync/KV persistence。最终 compiler check 还把 cold-route fallback 收敛到同一
  host sleep，并将 timer port 改为模块可双线程导入、仅函数体 background eager import
  bridge 的 P-68 形状。高频 sleep bridge log 静默，错误仍保留。
- 长 provider 输出还暴露 `<list>` row 高度低估；新增 content-based
  `estimateTranscriptRowMainAxisSize` 并接 `estimated-main-axis-size-px`，120-line case
  明确大于 5000px。provider 自身有缺位补零/重复文本，Web 与 Lynx 显示相同源数据，
  没有误判为 renderer bug。
- 门禁：row focused **6/6**；slice broad excluding registered loader-only
  `src/app/__tests__/index.test.tsx` **33/33**；Web `MessagesTimeline.logic` **64/64**；
  Web production **8,849 modules**；slice production **1806.6kB Lynx / 1922.2kB
  desktop total**。Web combined component suite 仍有 5 个与本刀无关的既有
  tool-icon attribute/status-row count expectation drift，已在 evidence 明示，产品 source
  本刀未改。
- audit 严格串行 write→write→check→check：threads **27.91%**、threads-shell
  **32.05%**、thread **16.38%**、settings **24.99%**、projects/kanban **23.20%**、
  pull requests **24.66%**；style **98.04%**（2,256 classes / 13,156 weighted）。
- cleanup：repo-owned Lynxtron 与 isolated browser session 已关闭；用户 server PID 5203
  未触碰；window-state byte-exact SHA-256
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  `synara:renderer-state:v8` 原 JSON 逐字恢复，其他 KV key 未改。
- 结合既有 same-snapshot 双尺寸 ≤8px/≤2px geometry gate、rich transcript/list
  lifecycle probe、shared state composition 与本次 real running/completed evidence，
  **P6-C2 completed**。`<list>` / Markdown renderer / disclosure event kernel 仍是已登记
  platform island，没有把 composer/sidebar scope 冒充 transcript 完成。

### 2026-07-29 — P6-C3 started：composer canonical path audit

- 按 D13 立即进入 P6-C3。Web 产品真源位于 `ChatView.tsx` 的 `composerSection`：
  `ComposerColumnFrame` → input shell/surface → banners → editor padding →
  reference attachments / `ComposerPromptEditor` → footer leading controls /
  picker controls / context meter / send-stop action；chrome/tokens 集中在
  `chat/composerPickerStyles.ts`。Lexical `ComposerPromptEditor` 是允许保留的编辑器内核
  platform island，不应成为共享 shell 的阻塞点。
- 当前 Lynx `Composer.lynx.tsx` 仍自行拥有 border/card、token preview、suggestion strip、
  draft-only meta 与 Clear footer；这些不是 Web canonical composer anatomy。真实 streaming
  修复期间为降低 snapshot churn 移除了动态 thread suggestions，P6-C3 需以 Web
  attachment/mention/command state projection 替代，而不是恢复 clean-room suggestion UI。
- 下一刀 compiler-first：把 shell/surface/editor-padding/footer 的 visibility/order/anatomy
  抽成 Web 产品先消费的 physical-shared composition，建短命
  `slice/src/app/__probe.composerChrome.tsx` 从 router import，运行
  `npx rspeedy build --environment lynx` 收真实错误；只补最小 Elements adapter。通过后
  接进产品 Composer、删除 probe 与对应 slice 自绘 chrome，再做 draft/focus/token/attachment
  paired states。

### 2026-07-29 — P6-C3 heartbeat：composer chrome physical-shared first cut

- 新增 Web 真源 `ComposerInputComposition.tsx` + Web Elements；shared source 拥有
  shell→surface wrapper nesting、editor region 与 footer row anatomy，Web Elements 继续
  单点消费 `composerPickerStyles` 的原 shell/surface/editor-padding/footer tokens。
  `ChatView` 产品已原位消费这三层 composition，不是 Lynx-only helper。
- Lynx 新增 canonical `ComposerInputCompositionElements` alias，native `<textarea>` 作为
  editor kernel content 接入同一 composition；外层 `.LynxComposer` border/card/footer
  wrapper 已删除并下沉到 host Elements CSS。Lexical 与完整 composer store graph 没有进入
  PrimJS。
- 短命 `__probe.composerChrome.tsx` 从 router 静态 import，Rspeedy compiler 一次通过
  （1808.3kB）；接入真实 `Composer.lynx.tsx` 后 probe/import 全部删除，最终 product
  **1810.9kB Lynx / 1926.5kB desktop total**。当前 suggestion strip、draft meta、Clear
  仍是已登记 clean-room 剩余，未因
  chrome 共享冒充完成。
- ReactLynx best-practices scanner：0 issues。Web composition/frame focused **4/4**；
  slice broad excluding registered loader-only test **33/33**；Web production **8,851
  modules**；slice production 与 desktop build green。实机 `/thread/:id` 明确绘制新
  shared editor/footer chrome，error/warning console 为空；冷进程未建立 server session，
  因而本组只作为 incremental chrome runtime evidence，不替代最终 same-data paired gate。
- audit 严格串行 write→write→check→check：thread **16.46%**（16.38→16.46）；
  threads **27.91%**、threads-shell **32.05%**、settings **24.99%**、
  projects/kanban **23.20%**、pull requests **24.66%**；style **98.04%**
  （2,256 classes / 13,156 weighted）。
- evidence：`shots/2026-07-29/port/p6-c3/composer-chrome/notes.md`。本轮 own runtime
  PID 32787 / port 8902 已停止；unrelated port 8901 Lynxtron 未触碰；user server PID
  5203 未被本轮操作，最终 external-state check 时 58090 已不再监听（解释本组 offline
  panel；当前 chrome 刀不依赖 server，后续 paired gate 才需要恢复）；window-state
  byte-exact 恢复 SHA-256
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  temporary backup 已删除。
- P6-C3 保持 **in_progress**。下一刀从 Web `ComposerReferenceAttachments` /
  command-menu state 与 footer leading/action composition 下切，替换 Lynx fake
  suggestions/meta/Clear；随后验证 draft、focus、token/attachment、toolbar/send-stop
  states 的 1280×820 + 1440×900 paired evidence。

### 2026-07-29 — P6-C3 heartbeat：canonical prompt segments，删除静态 suggestions

- compiler-first import Web `splitPromptIntoComposerSegments`、
  `formatComposerSkillChipLabel`、`formatComposerSlashCommandChipLabel`，probe 1815.3kB
  一次通过。产品接入后删除 probe/import、`composerAst.lynx.ts` 与其 3 条重复测试。
- Lynx token preview 现在跟 Web 同源覆盖 mention（含 plugin/thread kind）、skill、
  `/automation`、link、agent mention、terminal context 与同一 boundary/label 规则；Lexical
  仍是 Web editor kernel，native textarea 仍是 Lynx kernel，没有把 DOM 图拉入 PrimJS。
- 删除 router 常驻的 `router.tsx` / `check-code` / `automation` suggestion strip；这些原来
  无论真实 draft 是否包含 token 都显示，属于假数据。现在只有真实 draft 中已经存在的
  segment 才渲染 chip。draft counter/Clear 是真实状态/action 但 footer anatomy 仍非
  canonical，留给下一刀。
- 门禁：Web canonical parser/mention/composition focused **55/55**；slice broad excluding
  registered loader-only **30/30**（33→30 正好是删除的 3 条 duplicate parser tests）；
  ReactLynx scan **0 issues**；Web production **8,851 modules**；slice production
  **1820.0kB Lynx / 1935.6kB desktop total**。offline thread product route 明确不再绘制
  static suggestions，console error/warning 为空。
- audit 严格串行 write→write→check→check：thread **18.34%**、threads **29.50%**、
  threads-shell **33.90%**、settings **26.41%**、projects/kanban **26.07%**、
  pull requests **27.70%**；style **98.04%**。这次所有 screen 同升来自 slice router
  静态包含 Composer/parser 的 route-graph diffusion；是产品真实消费，不是 probe/
  type-only import，但不能解释成非聊天屏视觉进度，P6-C6 必须单列或收敛。
- evidence：`shots/2026-07-29/port/p6-c3/canonical-segments/notes.md`。own PID 66837 /
  port 8902 已停止；unrelated 8901 未触碰；user server 仍未监听；window state byte-exact
  恢复到 SHA-256
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  temporary backup 删除。
- P6-C3 继续 **in_progress**。下一刀抽 footer leading/actions 的共享 anatomy/state，替换
  draft meta/Clear；再从 `ComposerReferenceAttachments` 下切真实 file/image/selection
  state。server 恢复前继续做 compiler/product/tests；same-data 双尺寸 paired gate 后置。

### 2026-07-29 — P6-C3 heartbeat：canonical footer + real send/running/Stop

- 主仓新增 `ComposerFooterContentComposition` 与
  `ComposerPrimaryActionComposition`；shared source 现在拥有 footer leading/actions
  顺序、可见性以及 send/sending/stop discriminant。Web `ChatView` 的普通 Send 和 running
  Stop 原位消费该真源；Lynx canonical Elements adapter 只投影 `<view>/<text>` host。
- Lynx 删除 draft chars/chips meta 与 `Clear`，接入真实 `thread.turn.start` /
  `thread.turn.interrupt`。start 成功才清 draft；失败保留并显示
  `Unable to send. Your draft is still here.`。新增纯
  `composerDispatch.logic.ts` + 3 tests，锁定 command shape 与
  `starting → Connecting` / `running → Stop`。
- 首次实机发现 raw Effect-RPC payload 不能照抄 Web wrapper 的 `{ command }`：Web wrapper
  会先解包，Lynx raw RPC 必须直接发送 command。阴性帧保留为
  `footer-send-stop/lynx-after-send.png`。修复后旧 validation thread 产生真实 sequences
  10/11；但在无 active turn 时误触 Stop 产生 sequence 12 terminal delivery failure，
  server 将该 thread quarantine，后续 sequence 18 被正确跳过。由此修正 UI，只在
  `running` 暴露 Stop，并改用 clean thread 验证 provider。
- clean thread `12134e6f-8644-4284-a7bf-ee19bc789132` 使用 GPT-5.6 Terra：短回合先完整
  走过 starting/running/ready；随后 Lynx 发起真实长命令，Web/Lynx 同 server、同
  thread、同 running turn 同时显示方形 Stop。最终 sequence **100**
  `turn-interrupt-requested` → **102** ready → **103**
  `turn.completed(state=interrupted)`，证明 start/running/Stop 全链而非静态 fixture。
  paired evidence：
  `shots/2026-07-29/port/p6-c3/footer-send-stop/{web,lynx}-running-paired.png`；
  完整 checklist：
  `shots/2026-07-29/port/p6-c3/footer-send-stop/notes.md`。
- clean Web route 同时暴露两处 production build 未捕获的 dev runtime baseline defect：
  `ProjectScriptsControl` 错调用 `React.useUniqueId`（已有正确 local hook import），以及
  collapsed project row 引用未定义 `SidebarStatusTrailingGlyph`。分别改为
  `useUniqueId()` 与共享 `SidebarThreadStatusIndicator`，真实 route 重载恢复；新增
  `ProjectScriptsControl` SSR smoke test。
- `scripts/capture.sh` 正确锁定 own `localhost:8902`，但 production restart 后 client
  没有 DevTool session，故命令如实失败；最终帧由 Computer Use 绑定
  `/Users/bytedance/github/synara-lynx/slice/.../Lynxtron.app` 保存，没有把该组冒充
  DevTool capture。
- 门禁：Web focused **4/4**；slice broad excluding registered loader-only
  **33/33**；ReactLynx scanner **0 issues**；Web production **8,851 modules**；
  slice production **1828.3kB Lynx / 1943.9kB desktop**。audit 严格串行
  write→write→check→check：threads **29.67%**、threads-shell **34.09%**、
  thread **18.52%**、settings **26.55%**、projects/kanban **26.20%**、
  pull requests **27.85%**；style **98.04%**（2,256 classes / 13,156 weighted）。
- 外部状态恢复：own Lynx PIDs 80855/56212、server/Web PIDs 97453/97454 均已停止，
  58090/8891/8902 已释放；unrelated PID 49221 / 8901 未触碰；browser tabs finalized。
  `synara:renderer-state:v8` 与 `synara:sidebar-ui:v1` 已逐字恢复；window state SHA-256
  为原值
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  临时 `/tmp/synara-p6-c3-provider.LcXN0x` 已删除。
- P6-C3 保持 **in_progress**：本刀只放行 footer send/Connecting/Stop。下一条精确工作是
  审计 Web `ComposerReferenceAttachments`、extras/command menu、permission/model/voice
  controls 的真实 visibility/state，建短命 compiler probe，逐个下切可进入 PrimJS 的
  composition；完成 attachment/mention/toolbar 与 draft/focus 的
  1280×820 + 1440×900 same-data paired gate 后才能标 completed。

### 2026-07-29 — P6-C3 heartbeat：physical-shared extras + permission controls

- 主仓新增 `ComposerExtrasMenuComposition` 与
  `ComposerRuntimeModeControlComposition`，Web 产品原位消费；shared source 直接拥有
  Add image→separator→Plan→可选 Fast、Full access→Default permissions 的
  visibility/order/current-state/anatomy，不是 opaque ReactNode slot。Lynx 只提供 canonical
  Elements adapter；无真实 attachment/Fast capability 时分别显示 disabled
  `Add image — unavailable` 与不渲染 Fast。
- Lynx 产品接入真实 `thread.interaction-mode.set` /
  `thread.runtime-mode.set` command builder。compiler-first extras 首版相对 import 绕过
  menu alias，bundle 异常到 **2000.1kB**；改 canonical import 后 probe **1834.2kB**，
  runtime-mode probe **1839.7kB**。两个 probe/product router import 均已删除。
- 初始 DevTool 帧发现底部 popup 向下展开被窗口裁切；Lynx host CSS 改为
  `bottom:100%` 后，extras/runtime 两个 popup 均向上完整显示。精确 CDP node/box/tap
  验证 Plan 后 SQLite 为 `plan`，Default permissions 后为 `approval-required`；重新打开
  菜单均显示选中 check，最后通过同一 UI 恢复 `default/full-access`。最终 DevTool
  error/warning console 为空。
- 边界诚实记录：isolated thread 的临时 cwd 已在上一刀清理，server 尝试向 provider
  delivery mode command 时进入 terminal failure/quarantine。因此本组证明
  UI→server projection→selected-state 闭环，不冒充 live provider permission delivery；
  footer 刀已有独立真实 provider 证据。
- 门禁：Web focused **7/7**；Playwright browser test 因本机缺
  `chromium_headless_shell 1208` 未执行（环境 prerequisite，不记代码失败）；slice command
  **5/5**、broad excluding registered loader-only **35/35**；ReactLynx scanner 三文件
  **0 issues**；Web production **8,855 modules**；slice production **1842.4kB Lynx /
  1958.0kB desktop**。
- audit 严格串行 write→write→check→check：threads **30.72%**、threads-shell
  **35.30%**、thread **19.28%**、settings **27.48%**、projects/kanban **27.21%**、
  pull requests **28.78%**；style **98.04%**（2,255 classes / 13,155 weighted）。
  两仓 `git diff --check` 通过。
- evidence：`shots/2026-07-29/port/p6-c3/composer-toolbar/notes.md`。own Lynx/server/Web
  已停止，8902/58090/8891 已释放；unrelated PID 42769 / 8901 未触碰。
  window-state 与 KV 已逐字恢复为 SHA-256
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd` /
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb`；
  临时备份已删除。
- P6-C3 继续 **in_progress**。下一刀回到真实
  `ComposerReferenceAttachments` row/state 与 command-menu/mention projection，再覆盖
  model/voice、draft/focus/token/attachment/toolbar 状态；最终仍需同 snapshot
  1280×820 + 1440×900 Web↔Lynx paired gate。

### 2026-07-30 — P6-C3 heartbeat：physical-shared reference attachments + real pasted-text draft

- 主仓新增 `ComposerReferenceAttachmentsComposition` 与 canonical Web Elements；shared
  source 真实拥有 assistant selection→file comment→pasted text→file→image 的
  visibility/order。原 `ComposerReferenceAttachments.tsx` 成为稳定 re-export，因此
  `ChatView` 产品原 import 即消费 physical-shared 真源，不是 probe-only reuse。
- Lynx canonical Elements adapter 映射 summary/pasted/file/image cards；产品当前只把真实
  `pastedTexts` 接入，尚无 capability 的 assistant/comment/file/image 传空数组，不造假数据。
  native textarea 通过 common-prefix/suffix 只识别单次 insertion；单次超大 insertion 才生成
  Web `PastedTextDraft`，remove/show-in-field/send/成功后 clear 均接真实 draft store 与 Web
  append helper。逐步输入累积 4000 字明确不折叠。
- compiler-first 的未适配 Web 整树虽能 build，但达 **1925.9kB**；physical-shared
  composition + adapter probe 回落到 **1867.8kB**，probe/router import 随后删除。最终
  product **1868.7kB Lynx / 1984.4kB desktop**。
- Computer Use 无法在不覆盖用户剪贴板时合成原子 native paste，`type_text` 是 incremental
  edits；因此实机没有 card 是正确分类，不冒充 paste runtime proof，也没有加 fixture/debug
  hook。高频自动化曾产生 `CallLepusMethod called too frequently` toast；程序化回写从
  `setValue` + `setSelectionRange` 收敛为单次 `setValue`，最终 DevTool
  error/warning console 为空。
- 门禁：Web focused **23/23**；slice focused **5/5**、broad excluding registered
  loader-only **40/40**；Web production **8,857 modules**；双端 production green。
  audit 严格串行 write→write→check→check：threads **44.26%**、threads-shell
  **50.96%**、thread **27.43%**、settings **39.52%**、projects/kanban **39.57%**、
  pull requests **38.80%**；style **98.04%**（2,255 classes / 13,155 weighted）。
  reuse 大幅跨屏上升来自 Composer/attachment 真图的 static route-graph diffusion，不解释成
  非聊天屏视觉进度。
- evidence：
  `shots/2026-07-29/port/p6-c3/composer-reference/notes.md`。own Lynx PID 99552 /
  server PID 98236 / Web PID 98230 已停止，8902/58090/8891 均释放；unrelated PID
  42769 / 8901 未触碰。KV/window-state byte-exact 恢复为 SHA-256
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  temporary backup 删除。
- P6-C3 保持 **in_progress**。下一条精确工作：审计 command menu / mention / model /
  voice / focus 的 Web 真源，从最小可进入 PrimJS 的 shared composition 下切；随后完成
  1280×820 + 1440×900 same-snapshot Web↔Lynx paired gate。

### 2026-07-30 — P6-C3 heartbeat：physical-shared model trigger/list + real draft selection

- Web 产品与 Lynx 现共同消费 `ComposerModelTriggerComposition` 和
  `ProviderModelOptionGroupListComposition`；shared source 持有 trigger atom
  visibility/order、group/disclosure/option order、active/cost/favorite anatomy 与
  selection intent。所有可替换 Elements 使用 canonical alias。
- Web 事件语义保留基线：`MenuRadioGroup.onValueChange` 继续负责鼠标/键盘 selection，
  row click 只做原 after-selection；Lynx adapter 才把 native tap 映射到 shared intent。
  Lynx draft store 持有 `ModelSelection`，下一次真实 `thread.turn.start` 消费，成功发送清
  prompt/pasted text 但保留 selection。
- compiler 阴性：完整 `ComposerModelEffortPicker` probe 虽通过，却把 bundle 从
  **1868.7kB** 拉到 **2678.2kB**；缩到真实 trigger/list composition 后最终
  **1896.1kB Lynx / 2011.7kB desktop total**，比完整 probe 小 782.1kB。probe/router
  import 已删除。
- 实机 thread `12134e6f-8644-4284-a7bf-ee19bc789132`：初始 GPT-5.6 Terra check →
  DevTool 选择 GPT-5.5 → trigger 即时更新 → 重开 GPT-5.5 check 保留，最终
  error/warning console 为空。没有发送 prompt/provider turn。证据：
  `shots/2026-07-30/port/p6-c3/composer-model/notes.md`。
- 明确差异：Lynx 当前只有 static current-provider catalog，无 provider switching 或 Web
  runtime discovery；unknown current model 初始会 prepend，但换离后无法从菜单选回。
  本刀不冒充完整 picker parity，P6-C3 继续 in_progress。
- 门禁：Web focused **19/19**；slice focused **11/11**、broad excluding registered
  loader-only **41/41**；ReactLynx scanner 四文件 **0 issues**；Web production
  **8,861 modules**；双端 production green。Web browser suite 仍因缺
  `chromium_headless_shell 1208` 无法启动，记环境 prerequisite，不记 green。
- audit 严格串行 write→write→check→check：threads **45.66%**、threads-shell
  **52.58%**、thread **28.27%**、settings **40.78%**、projects/kanban **40.75%**、
  pull requests **40.84%**；style **98.04%**（2,255 classes / 13,151 weighted）。
- cleanup：own Lynx/server/Web 已停止，8902/58090/8891 已释放；unrelated PID 42769 /
  8901 未触碰。KV/window-state byte-exact 恢复为 SHA-256
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  temporary backup 已删除。
- P6-C3 保持 **in_progress**。下一条精确工作：从 command/mention 的真实 Lexical
  selection/action 图继续下切可共享 state/anatomy，随后处理 voice/focus 与 dynamic
  provider/model discovery；最终仍需 same-snapshot 双尺寸 Web↔Lynx paired gate。

### 2026-07-30 — P6-C3 heartbeat：physical-shared command menu + real mode transition

- Web/Lynx 产品现共同消费 `ComposerCommandMenuComposition`；shared source 持有
  built-in/provider/skills 与 plugins/chats/local/subagents 分组顺序、labels、row
  title/meta/active、loading/empty、mention Files footer 和 selection intent。Web adapter
  保留 canonical Command、DOM ref、scroll/mouse/prevent-blur/click 与 memo row；Lynx
  adapter 只映射 native tap。
- Lynx native textarea 用 Web `detectComposerTrigger` + 真实 `selectionStart`；产品只展示
  有真实 action 的 Plan/Default/Subagents。Plan/Default 走
  `thread.interaction-mode.set`，Subagents 用 canonical delegation prompt；其它
  Web-only/provider/skill/mention 命令不造假。
- compiler 阴性：完整 `ComposerCommandMenu` probe 虽 build 通过但达 **2087.2kB**；
  缩到 composition + canonical Elements 后 probe **1912.1kB**，最终 product
  **1923.5kB Lynx / 2039.1kB desktop**；probe/router import 已删除。
- 实机 thread `12134e6f-8644-4284-a7bf-ee19bc789132`：`/` 展示三项 → `/pl` 只剩
  Plan → tap 后 prompt 清空且 SQLite interaction mode=`plan` → `/def` 经同一 UI 恢复
  `default`；popup 最终关闭，DevTool error/warning console 为空。没有发送 provider turn。
  证据：`shots/2026-07-30/port/p6-c3/composer-command/notes.md`。
- 门禁：Web command focused **61/61**；slice focused **11/11**、broad excluding
  registered loader-only **44/44**；ReactLynx scanner 0 issues；Web production
  **8,863 modules**；双端 production green。audit 严格串行 write→write→check→check：
  threads **46.25%**、threads-shell **53.26%**、thread **29.26%**、settings
  **41.30%**、projects/kanban **42.26%**、pull requests **41.28%**；style
  **98.04%**（2,255 classes / 13,151 weighted）。
- cleanup：own Lynx PID 95111、server PID 92482、Web PID 92481 已停止；
  8902/58090/8891 已释放；unrelated PID 42769 / 8901 未触碰。KV/window-state
  byte-exact 恢复为 SHA-256
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  temporary backup 已删除。
- P6-C3 继续 **in_progress**：下一刀补 structured mention selection 与
  focus/keyboard/voice capability，再处理 dynamic provider/model discovery；最终仍需
  same-snapshot 1280×820 + 1440×900 Web↔Lynx paired gate。

### 2026-07-30 — P6-C3 heartbeat：real structured thread mention

- 主仓抽出 `ComposerThreadMentionItems` physical-shared 纯源，Web 原 hook 反向消费；
  shared source 负责 thread title/container disambiguation、recency ranking、
  current/archived exclusion、20-item limit 与 `thread://` path。
- Lynx draft 新增真实 `ProviderMentionReference[]`，prompt 编辑用 Web filter 清理悬空
  reference；selection 复用 Web trigger range、space/token replacement，turn-start 仅在
  非空时带 `message.mentions`。候选只来自真实 sidebar snapshot；plugin/path/skill
  capability 仍不造假。
- 实机 `@rea` 展示 Chats→`READY-LYNX-COMPOSER`，tap 后生成 chip。首轮发现 native
  `setValue` 异步 `bindinput` 会重新打开 popup，加入一次性 pending-value guard 后 popup
  正确关闭。用户授权发送最小消息后，SQLite sequence 112 的 `mentions_json` 精确为
  `READY-LYNX-COMPOSER → thread://a861724b-ea53-4fad-851c-1079c3aa7558`。
- 当前 validation thread 因旧临时 cwd 已删除而 quarantined；sequence 113 明确记录
  provider command skipped。本刀只声称 projection/dispatch shape，不冒充 live provider
  delivery。
- 诊断纠偏：最初 `Loading conversation…` 是因为只构建了新 Lynx bundle，却仍启动旧
  `dist/desktop/main.lynx.bundle`；临时 Composer placeholder 阴性因此无效并已恢复。
  成对重建后真实 transcript 立即加载；临时 fixed initial route 删除，最终 normal `/`
  bundle 的 deep link 在 server 停止时稳定进入 explicit offline state。
- 门禁：Web focused **65/65**；slice focused **16/16**；Web production
  **8,864 modules**；slice production **1937.6kB Lynx / 2053.3kB desktop**。
  audit 严格串行 write→write→check→check：threads **46.25%**、threads-shell
  **53.26%**、thread **29.39%**、settings **41.30%**、projects **42.46%**、
  kanban **42.45%**、pull requests **41.28%**；style **98.04%**
  （2,255 classes / 13,151 weighted）。两仓 `git diff --check` 通过。
- evidence：
  `shots/2026-07-30/port/p6-c3/composer-thread-mention/notes.md`。own Lynx/server/Web
  均已停止，58090/8891/8901 已释放；KV/window-state byte-exact 恢复为 SHA-256
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  temporary backups 删除。
- P6-C3 保持 **in_progress**。后续审计确认下一条最小安全边界是 command/mention
  keyboard navigation：从 Web `nudgeComposerMenuHighlight` 抽 physical-shared pure
  transition，Web 原位消费，Lynx 以 native `catchkeydown` 验证 ArrowUp/ArrowDown、
  Enter/Tab 与 Escape；若 PC textarea 无法阻止默认输入则按实机结果缩到可证明的按键，
  不造假。voice 仍依赖 recorder/transcription 基础设施，dynamic model discovery 仍是更大
  provider-status 图，排在 keyboard 之后。最终仍需 same-snapshot
  1280×820 + 1440×900 Web↔Lynx paired gate。

### 2026-07-30 — P6-C3 heartbeat：native keyboard/focus runtime negative，全部实验回滚

- keyboard probe 先抽 Web `nudgeComposerMenuHighlight` 为 shared pure transition，Web
  原位消费，Lynx 增加 active row 与 textarea `catchkeydown`。focused tests/build 通过，
  但 Lynxtron 0.0.7 PC runtime 的 ArrowDown 从未改变 highlight。
- 依次验证 browser key names、PC aliases（Down/Up/Return/Esc）、临时可见 key diagnostic
  与 `global-bindkeydown`；native textarea 消费按键但 local/global Lynx handler 均没有事件。
  三个 runtime 分支失败后按止损规则删除 helper/test/handlers/diagnostic，Web 恢复原 inline
  keyboard authority，Lynx 不保留假 keyboard path。
- focus probe 在 `/`→Subagents tap 后正确插入 canonical delegation prompt，但 fresh AX
  focus 落到 `container lynxtron`。`setValue` 后同步、next-tick 0ms、50ms 三种 native
  `setFocus` 均被 tap-ending blur 覆盖；第三分支后全部回滚。截图
  `shots/2026-07-30/port/p6-c3/composer-focus/lynx-focus-not-restored.png` 与
  [notes](../shots/2026-07-30/port/p6-c3/composer-focus/notes.md) 保留阴性证据。
- 结论登记到 02 与 04 P-81：tap selection/atomic replacement 继续可用；keyboard
  navigation 与自动 post-selection focus 是 Lynxtron 0.0.7 PC platform gap。除非
  Lynxtron/native textarea 增加可证明的事件/focus API，不再重试同一路径。
- 回滚后门禁：slice focused **16/16**；final production **1937.6kB Lynx /
  2053.3kB desktop**。本刀无保留 Web 代码变化，既有 Web **65/65** / **8,864
  modules** 基线继续有效。serial audit 严格 write→write→check→check：threads
  **46.25%**、threads-shell **53.26%**、thread **29.39%**、settings **41.30%**、
  projects **42.46%**、kanban **42.45%**、pull requests **41.28%**；style **98.04%**
  （2,255 classes / 13,151 weighted）。两仓 `git diff --check` 通过。
- own Lynx 已停止，58090/8891/8901/8902 释放；unrelated Lynx Explorer 8903 未触碰。
  KV/window-state byte-exact 恢复为 SHA-256
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`，
  focus backup 删除。
- P6-C3 保持 **in_progress**。下一条精确工作转入 dynamic provider/model discovery；
  voice 仍需 recorder/transcription 基础设施，最终仍需 same-snapshot 双尺寸 paired gate。

### 2026-07-30 — P6-C3 heartbeat：real active-provider runtime model discovery

- `ThreadHeaderSummary` 补真实 project workspace root；Composer background host 通过既有
  Effect-RPC `provider.listModels` 查询 active provider，把 serializable descriptors/loading
  state 传给 main-thread model control。
- 新增 `resolveLynxProviderModelOptions`，直接消费 Web `mergeDynamicModelOptions` 与 label
  normalization；既有 shared trigger/group/list composition 继续拥有实际 anatomy/order。
  unknown current selection 会 prepend，empty discovery 回退 static catalog。
- compiler-first 第一分支从 main-thread control 直接 import `synaraClient.lynx`，准确失败
  `background-only cannot be imported from a main-thread module`；query 移回 Composer 的
  `'background only'` callback 后 build 通过，没有弱化线程约束。
- 隔离 `.synara-sxs` server/snapshot 实机：Codex 菜单出现 checked-in static source 不含的
  **GPT-5.6 Luna**，证明真实 runtime discovery 而非 fallback；tap Luna 后 trigger 即时更新，
  selection 仅在 draft，未发送 turn。证据：
  `shots/2026-07-30/port/p6-c3/composer-dynamic-models/notes.md`。
- 门禁：slice focused **5 files / 19 tests**；production **1945.9kB Lynx /
  2061.6kB desktop**。本刀无 Web retained change，Web **65/65** /
  **8,864 modules** 基线有效。serial audit write→write→check→check：threads
  **46.25%**、threads-shell **53.26%**、thread **29.39%**、settings **41.30%**、
  projects **42.46%**、kanban **42.45%**、pull requests **41.28%**；style
  **98.04%**（2,255 / 13,151 weighted）。
- own Lynx/server/Web 已停止，58090/8891/8901 释放。server shutdown 对短命 Codex
  discovery root PID 19123 记录 `rootExited=true, captureComplete=false` proof warning，
  同时报告无 remaining descendants；随后 PID/pattern 均不存在。KV/window-state
  byte-exact 恢复为既有 SHA-256，temporary backup 删除。
- P6-C3 保持 **in_progress**：active-provider dynamic catalog 已闭合；provider switching、
  runtime reasoning/traits/favorites、voice 与 final same-snapshot 双尺寸 paired gate 仍待完成。

### 2026-07-30 — P6-C3 heartbeat：server-backed provider switching

- 主仓新增 `ComposerProviderPickerItems` physical-shared controller；原
  `ProviderModelPicker` 反向消费，shared source 统一 provider canonical label/order、
  hidden+protected filtering、available/coming-soon 与 live
  `Checking`/`Sign in`/`Unavailable`。Web nested Menu/radio keyboard authority 保持不变。
- slice background host 新增 unary `server.getConfig`，与按 browse provider 切换的
  `provider.listModels` query；main-thread control 只接 serializable statuses/descriptors。
  Native popup 改为 provider→model 两级：tap provider 只浏览/加载，不提前提交；选具体
  model 才写 `{provider, model}` draft。
- 同 `.synara-sxs` snapshot 实机：Codex/Claude/OpenCode/Pi 可用，Cursor 显示
  `Sign in`，Antigravity/Grok/Droid/Kilo 显示 `Unavailable`；Codex GPT-5.6 Terra →
  Claude runtime catalog → Fable 5 后 trigger 即时更新。未发送 prompt/turn。
- 门禁：Web focused **3 files / 22 tests**；slice focused **5 files / 20 tests**；
  Web production **8,865 modules**；slice **1952.4kB Lynx / 2068.1kB desktop**。
  serial audit write→write→check→check：threads **46.28%**、threads-shell **53.29%**、
  thread **29.41%**、settings **41.33%**、projects **42.48%**、kanban **42.48%**、
  pull requests **41.41%**；style **98.04%**（2,255 / 13,151 weighted）。
- evidence：
  `shots/2026-07-30/port/p6-c3/composer-provider-switch/notes.md`。own Lynx/server/Web
  均停止，58090/8891/8901 释放；8903 unrelated Lynx Explorer 未触碰。KV/window-state
  byte-exact 恢复为既有 SHA-256，temporary backup 删除。
- P6-C3 保持 **in_progress**。下一条精确工作是 runtime reasoning/traits
  （reasoning effort、fast/thinking/context capability subset）；favorites/voice 与 final
  same-snapshot 1280×820 + 1440×900 paired gate 仍待完成。

### 2026-07-30 — P6-C3 heartbeat：physical-shared runtime primary trait + real provider delivery

- 主仓新增 `ComposerTraitRadioSectionComposition` 及 canonical Elements；原
  `TraitsPicker` 五个 section 全部反向消费。shared source 持有 label、option order、
  active/default/description 与 selection intent，不是 opaque slot 或 Lynx-only helper。
- slice 解析真实 runtime descriptor 并消费 Web `getComposerTraitSelection`；Codex Terra
  实机动态显示 Low→Medium→High→Extra High→Max→Ultra。选择写入
  `ModelSelection.options`，draft equality、snapshot projection 与 turn dispatch 均保留
  options；菜单选择完成后关闭。
- Compiler-first probe production 1965.8kB 后删除。Web focused **4 files / 23 tests**；
  slice focused **3 files / 15 tests**；Web production **8,867 modules**；最终 slice
  **1973.9kB Lynx / 2089.5kB desktop**。
- 第一次旧 thread `12134e6f-…` 已 quarantine 且 cwd 被删，虽投影出
  `reasoningEffort: high`，但没有 provider delivery，明确不计正向证明。随后创建临时真实
  project/thread，选择 High 并发送 `Reply with only TRAIT-HIGH-OK.`：SQLite seq 120
  精确携带 `options.reasoningEffort=high`，seq 135/136 为流式/完成
  `TRAIT-HIGH-OK`，seq 140 `turn.completed`。
- evidence：
  `shots/2026-07-30/port/p6-c3/composer-traits/notes.md`。两张
  `scripts/capture.sh` 图 console error/warning 为空。临时 thread→project 依次删除，
  own Lynx/server/Web 停止，58090/8891/8901/8902 释放，unrelated 8903 PID 2270 未触碰；
  KV/window state byte-exact 恢复，RPC helper/backup 删除。checkpoint capture 因大仓超时，
  shutdown 后复核两仓无 staged 内容。
- 串行审计 write→write→check→check green：threads **46.45%**、threads-shell
  **53.49%**、thread **29.71%**、settings **41.48%**、projects/kanban **42.92%**、
  pull requests **41.63%**；style **98.04%**（2,255 / 13,151 weighted）。两仓
  `git diff --check` green。
- P6-C3 保持 **in_progress**。下一条精确工作：审计 runtime `supportsFastMode` →
  `ModelSelection.options.fastMode` 的 descriptor、Web control、Codex adapter 与真实 turn
  delivery 全链路；thinking/context 只在 descriptor+adapter 双向支持时暴露。favorites
  属于 app-local state，voice 仍缺 recorder/transcription，最终仍需 same-snapshot 双尺寸
  Web↔Lynx paired gate。

### 2026-07-30 — P6-C3 heartbeat：shared Fast toggle + Codex fast service tier delivery

- Runtime Terra discovery 明确返回 `additionalSpeedTiers:["fast"]` 与 priority tier；
  existing normalizer→`supportsFastMode`→boolean descriptor，不按模型名猜 capability。
- `ComposerTraitRadioSectionComposition` 现在持有可选 Fast header control；Web
  `TraitsPicker` 删除私有 `FastModeToggle` 并反向消费 canonical Elements。Lynx Effort
  header 同位置 native toggle 保持 popup 开启，fast-only descriptor 才显示 shared
  Default/Fast Speed section；shared Extras 也接同一 resolved state/draft transition。
- Compiler-first probe **1974.9kB** 后删除。Web focused **4 files / 23 tests**；slice
  focused **3 files / 15 tests**；Web production **8,867 modules**；slice
  **1977.4kB Lynx / 2093.1kB desktop artifact total**。
- 临时真实 thread 上 tap Fast 后 trigger badge 出现并保留 Medium；发送
  `Reply with only FAST-MODE-OK.`。SQLite seq 148 精确携带
  `modelSelection.options.fastMode=true`，Codex adapter 将其映射为 fast service tier；
  seq 159/160 流式/完成 `FAST-MODE-OK`，seq 164 `turn.completed`。app-server 使用 fresh
  managed chat workspace，不冒充 repository-root turn。
- evidence：
  `shots/2026-07-30/port/p6-c3/composer-fast/notes.md`。两张 capture console
  error/warning 为空。临时 thread→project 依次删除，own Lynx/Web/server 停止，
  58090/8891/8901 释放，unrelated 8903 PID 2270 未触碰；KV/window state byte-exact
  恢复，temporary RPC helper/backup 删除，两仓无 staged diff。
- 串行审计 green：threads **46.45%**、threads-shell **53.49%**、thread **29.74%**、
  settings **41.48%**、projects/kanban **42.97%**、pull requests **41.63%**；
  style **98.04%**。
- P6-C3 保持 **in_progress**。下一条精确工作：分别审计 favorites 的 app-local
  persistence/排序与 voice 的 recorder→permission→audio transport→transcription 真源；
  无 runtime 基础设施的能力登记 unavailable，不画假入口。随后收敛 final same-snapshot
  1280×820 + 1440×900 Web↔Lynx paired gate。

### 2026-07-30 — P6-C3 heartbeat：shared model favourites + restart persistence；voice capability audit

- 主仓抽出无副作用 `modelFavorites.logic.ts`，统一四个 supported provider、canonical
  storage keys、normalize/parse/toggle；Web 原 storage wrapper 与 picker 反向消费。
  Lynx 从 storage mirror 初始化并把真实 favourite set/toggle 传给既有 shared grouped
  option composition；native Elements adapter 只实现 empty/filled star 与 nested tap。
- 自动门禁：compiler-first probe **1978.6kB** 后删除；Web focused **3 files / 21 tests**；
  slice focused **3 files / 15 tests**；Web production **8,868 modules**；slice production
  **1981.9kB Lynx / 2097.5kB desktop artifact total**。
- `.synara-sxs` + production Lynx 实机：浏览真实 OpenCode catalog，tap
  `North Mini Code Free` star 后 popup 保持、active `GPT-5.6 Terra` trigger 不变，
  top `Favourites` 即时出现；KV 精确写
  `synara:opencode-favourite-models:v1=["opencode/north-mini-code-free"]`。完整停止/重启
  Lynx 后同一 group/filled star 自动恢复，证明 hydration，不只是一帧 UI。
- evidence：
  `shots/2026-07-30/port/p6-c3/composer-favorites/notes.md`；所有 retained capture 的
  DevTool error/warning console 为空。
- Voice 审计纠偏：Web 已有 `getUserMedia` + `AudioContext` WAV recorder、
  `useComposerVoiceController`、`server.transcribeVoice` 与 Codex transcription pipeline；
  缺口是 Lynxtron 0.0.7 native surface 和 slice main process 均无 microphone
  permission/capture/audio bridge。04 P-87 与 compat 已登记一期 unavailable，不画假 mic，
  无产品代码伪实现。
- serial audit 严格 write→write→check→check：threads **46.48%**、threads-shell
  **53.51%**、thread **29.75%**、settings **41.50%**、projects/kanban **42.99%**、
  pull requests **41.76%**；style **98.04%**（2,255 / 13,151 weighted）。两仓
  `git diff --check` green。
- cleanup：own Lynx/Web/server 已停止，58090/8891/8901 释放；unrelated Lynx Explorer
  PID 2270 / 8903 未触碰。KV/window-state byte-exact 恢复为
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  temporary backup 删除。
- P6-C3 保持 **in_progress**。下一条精确工作：同一 `.synara-sxs` server/snapshot/thread
  完成 1280×820 与 1440×900 Web↔Lynx Composer paired capture，逐项量化 shell/sidebar/
  header/content/composer/card anchors ≤8px 与 typography ≤2px；只有 paired notes、双端
  tests/build、serial audit 都成立后才可标 completed。

### 2026-07-30 — P6-C3 completed：final same-data paired geometry

- 同一 `.synara-sxs` server/snapshot/thread
  `12134e6f-8644-4284-a7bf-ee19bc789132` 完成 1280×820 与 1440×900 Web↔Lynx
  retained pair；sequence 保持 166，未发送 prompt。证据：
  `shots/2026-07-30/port/p6-c3/composer-paired/notes.md`。
- 首帧发现 Lynx Composer 高 128px、Web 95px；最小 CSS mapping 后双尺寸均为
  **736×95 shell / 708×39 editor / 34px footer**。Composer left delta 1.81px、
  content bottom inset delta 4px、header top delta 2px，editor typography
  **12px/19.5px** 精确一致。
- Header 复核纠偏：原 20.38px 是把 Web title 起点与 Lynx icon 起点交叉比较；按
  icon/title 同 anatomy 比较，两者 delta 均约 2px，已满足门禁，不产生虚假修复。
  Native titlebar、Lexical/textarea、keyboard/focus、voice/file capability 与无假 mic
  导致的 control slot 均在 02/04/paired notes 登记。
- `scripts/capture.sh` 增加 exact repository Lynxtron executable + `dist/desktop`
  command ownership 检查；负路径遇到非本仓 8901 process 时正确拒绝且不产图。
- 自动门禁：Web focused **3 files / 21 tests**；slice focused **5 files / 22 tests**；
  Web production **8,868 modules**；slice production **1981.9kB Lynx /
  2097.5kB desktop artifact total**；retained Lynx DevTool error/warning 为空。
- serial audit 严格 write→write→check→check：threads **46.48%**、threads-shell
  **53.51%**、thread **29.75%**、settings **41.50%**、projects/kanban **42.99%**、
  pull requests **41.76%**；style **98.04%**（2,255 / 13,151 weighted）。两仓
  `git diff --check` green。
- P6-C3 达到全部放行标准，roadmap 标为 **completed**。下一任务按 D13 回到
  **P6-C1 收尾**；不改已对齐 header，转为审计既有 paired evidence 后仍未闭合的
  whole-shell/content/interactions 放行项。

### 2026-07-30 — P6-C1 completed：whole-shell paired close-out

- 复用 P6-C3 final retained pair 作为同一真实 route/state 的 whole-shell 证据，并新增
  `shots/2026-07-30/port/p6-c1/final-shell/notes.md`。1280×820 / 1440×900 下 sidebar
  width delta 2.62px、main start 3.62px、content column 1.81px、header top 2px。
- 重要纠偏：原始 20.38px 数字把 Web title 起点 294.38 与 Lynx icon 起点约 274
  交叉比较。按 icon/title 同 anatomy 比较分别为 272.38/≈274 与 294.38/≈296，
  两者均约 2px，因此没有制造无效 CSS 修复。
- App/sidebar/header/content 的 physical-shared ownership、真实 normalized store、
  renderer persistence、search/navigation/pinning/disclosure/paging/route restore/status/
  PR badge 证据已逐项复核。Automations 无 callback 时由 shared catalog 统一 disabled；
  hover/focus/keyboard 与 light/dark 继续归 Phase 7。
- focused gates：slice Sidebar **1 file / 10 tests**；Web Sidebar **12 files /
  148 tests**。首次在 monorepo root 执行 Web 命令时参数被 Turbo 当 task 名拒绝，未运行
  测试；切到 `apps/web` 后按 `bun run test -- ...` 正常全绿。
- same-source production 复用本刀前已完成的 Web **8,868 modules**、slice
  **1981.9kB Lynx / 2097.5kB desktop artifact total**。
- serial audit 再次严格 write→write→check→check：threads **46.48%**、
  threads-shell **53.51%**、thread **29.75%**、settings **41.50%**、
  projects/kanban **42.99%**、pull requests **41.76%**；style **98.04%**
  （2,255 / 13,151 weighted）。两仓 `git diff --check` green。
- P6-C1 roadmap 标为 **completed**。下一任务按 D13 为 **P6-C4 Settings**。

### 2026-07-30 — P6-C4 started：Settings canonical-path audit

- Web 真源分为 Sidebar 内的 `SettingsSidebarNav` + `settingsNavigation` taxonomy，以及
  `_chat.settings.tsx` route-owned General/Appearance panels；card/row anatomy 已由
  `SettingsSection` / `SettingsRow` 物理共享。
- slice `SettingsPage.tsx` 当前仍本地拥有 nav、section/group、toggle、theme preview 和
  独立 `synara.lynx.settings.v1` schema；`SharedSettingsProbe` 只是孤立诊断消费，不能计作
  产品复用。
- 下一刀：compiler-first 抽出 physical-shared settings navigation/shell composition，
  让 Web 原 `SettingsSidebarNav` 反向消费，再接进 slice 产品 route；随后把 General /
  Appearance 的 shared row/card composition 接 canonical storage/theme adapter。

### 2026-07-30 — P6-C4 heartbeat：physical-shared settings navigation

- 主仓新增 `SettingsNavigationComposition` + canonical Web Elements，并把 taxonomy resolver
  下沉到无 JSX 的 `.logic.ts`。Shared source 现在拥有 App/Synara 分组、15 row 顺序、
  active/availability；Web 原 `SettingsSidebarNav` 反向消费。
- slice 产品 `SettingsPage` 删除本地 App/General/Appearance/Synara/Providers/Advanced
  nav JSX，直接消费同一 composition；只开放 General/Appearance，其余 canonical rows
  显式 disabled。Native CentralIcon 尚未映射，保留 16px slot，不画假 glyph。
- compiler/runtime 两次纠偏：完整 Web Sidebar probe **2047.0kB**，因 DOM search/
  keyboard 图过宽只作阴性；narrow composition 首轮虽 build 绿，但 canonical Elements
  alias 未在 Rspeedy config 注册，runtime 落回 Web `nav/button/span` 并出现空白 rows。
  显式 alias 后 retained production frame 全 label/active/disabled rows 正常，console
  error/warning 为空；最终 **1992.5kB Lynx / 2108.1kB desktop**。
- 纯 resolver 首个 slice test 因从 TSX 文件导入而失败
  `Cannot find module @lynx-js/react/jsx-runtime`；拆 `.logic.ts` 后 slice **1/1**，
  Web composition + 原 SidebarNav **11/11**。Web production **8,871 modules**。
- `Input.dispatchTouchEvent` 在当前 Lynx DevTool 返回 Not implemented，因此 retained
  frame 不冒充 tap proof；callback/availability transition 由 shared tests 覆盖。
- evidence：
  `shots/2026-07-30/port/p6-c4/settings-navigation/notes.md`。临时 `/settings` initial
  route 已恢复 `/` 并重建 final bundle；own Lynx 8901 已停止，用户 8903 未触碰；
  KV/window-state byte-exact 恢复。
- serial audit 严格 write→write→check→check：threads **46.66%**、threads-shell
  **53.71%**、thread **29.87%**、settings **41.68%**、projects/kanban **43.15%**、
  pull requests **42.36%**；style **98.04%**（2,255 / 13,153 weighted）。两仓
  `git diff --check` green。
- P6-C4 保持 **in_progress**。下一刀抽 route panel header 与 General
  section/row composition，让 Web route 反向消费；随后用 canonical app-settings
  storage projection 替换 `synara.lynx.settings.v1`。

### 2026-07-30 — P6-C4 heartbeat：physical-shared panel header

- 主仓新增 `SettingsPanelHeaderComposition` + host-neutral taxonomy resolver +
  canonical Web Elements；原 `_chat.settings` route 删除本地 title/description/Restore
  JSX 并反向消费。slice 产品 Settings route 通过 exact alias 消费 native Elements。
- 首个 production frame 虽正常绘制且 console clean，但 defaults 值下 Restore 仍可用；
  这是 host 状态投影漂移，未放行。补 current/default 全字段 equality 后重新 build/capture，
  final frame action disabled；证据：
  `shots/2026-07-30/port/p6-c4/settings-panel-header/notes.md`。
- focused gates：Web **3 files / 13 tests**；slice **1 file / 2 tests**。Web production
  **8,874 modules**；slice **1995.1kB Lynx / 2110.7kB desktop artifact total**。
- serial audit 严格 write→write→check→check：threads **46.66%**、threads-shell
  **53.71%**、thread **29.87%**、settings **41.75%**、projects/kanban **43.15%**、
  pull requests **42.36%**；style **98.04%**（2,255 / 13,153 weighted）。两仓
  `git diff --check` green。
- 临时 `/settings` initial route 已恢复 `/` 并重建 final bundle；own 8901 已停止，
  用户 PID 2270 / 8903 未触碰。KV/window-state byte-exact 恢复为 SHA-256
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
- P6-C4 仍 **in_progress**：General/Appearance 仍是 native-owned page content，
  `synara.lynx.settings.v1` 仍是临时 schema。下一刀从 canonical `appSettings` 抽
  host-neutral projection，并让 Web/Lynx 共用 General section/row/control anatomy。

### 2026-07-30 — P6-C4 heartbeat：General composition + canonical storage

- 主仓新增 `SettingsGeneralComposition` + side-effect-free row model + canonical Web
  Elements；shared source 拥有 4 sections / 17 rows 的 order/copy/options/reset
  visibility/control anatomy。Web `_chat.settings` 反向消费后删除原 276 行 General
  renderer；slice 删除原 4-row clean-room renderer 与重复 row/switch CSS。
- 新增 `appSettingsStorageProjection.logic`：canonical key
  `synara:app-settings:v1`、General defaults、validation 与 preserve-unknown merge。
  `appSettings.ts` 自身也消费同一 key。slice 读取 canonical local record，thread mode
  额外由 `server.getSettings` 覆盖并经 `server.updateSettings` 写回；离线 rejection
  显式处理，不产生 unhandled promise。
- runtime 首帧 cards/rows/toggles 正常但四个 select label 空白；定位为 Lynx
  `MenuTrigger render` clone 用 undefined children 覆盖 Button label。改为 Button child
  后 `Codex / Local / Manual order / Recently active` 全恢复且 console clean。
- 临时 canonical KV fixture 设 `showWorkspaceSection=true`，重启后 Workspace switch、
  row reset glyph、global Restore 同步 active；截图后用户 KV/window-state 已逐字恢复。
  evidence：`shots/2026-07-30/port/p6-c4/settings-general/notes.md`。
- focused gates：Web **6 files / 77 tests**；slice **1 file / 3 tests**。Web production
  **8,878 modules**；slice **2010.9kB Lynx / 2126.5kB desktop artifact total**。
- serial audit 严格 write→write→check→check：threads **46.94%**、threads-shell
  **53.99%**、thread **30.07%**、settings **42.48%**、projects **43.40%**、
  kanban **43.39%**、pull requests **42.61%**；style **98.04%**
  （2,255 / 13,153 weighted）。两仓 `git diff --check` green。
- cleanup：temporary `/settings` route 恢复 `/` 并重建 final bundle；own 8901 停止，
  用户 PID 2270 / 8903 未触碰；KV/window-state SHA-256 回到
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
- P6-C4 保持 **in_progress**。Appearance 仍是 native theme swatch preview；下一刀抽
  physical-shared Theme/UI density/font/timestamp composition，接 canonical theme
  storage/tokens；之后跑 server live interaction + light/dark 双尺寸 paired gate。

### 2026-07-30 — P6-C4 heartbeat：Appearance composition + canonical theme

- 主仓新增 `SettingsAppearanceComposition` + host-neutral values/options/normalization +
  canonical Web Elements；shared source 拥有 Theme and typography / Time and reading
  section、card/row 顺序、copy、options、reset visibility 与 primary control anatomy。
  Web `_chat.settings` 删除本地 Appearance renderer 并反向消费。
- source review 先修正 Web adapter 的 double-card（composition 已显式 card，
  `SettingsSection` 又自动包一层）；terminal font suggestions/defaults 从副作用较宽的
  `appSettings.ts` 下沉到 Appearance logic，native 不再为静态数据拉入完整 settings 图。
- slice 删除旧 SettingsGroup/theme-preview JSX/CSS，消费 exact-aliased native Elements；
  Appearance 读写 canonical `synara:app-settings:v1` + `synara:theme`，preserve unrelated
  app fields 与 theme-pack payload；全局 Restore 同时恢复 General + Appearance。
- runtime dark fixture 首轮被 native control mount change 在 hydration 前回写为 `system`；
  增加 ready write gate 后重启保持 `dark`，Dark segment、Theme row reset、global Restore
  同步 active。P-45 direct dark selector 补 `.LxInput` 后数值对比度正常；light surface
  swatch 补 border 后三色均可见。两帧 console error/warning 为空。evidence：
  `shots/2026-07-30/port/p6-c4/settings-appearance/notes.md`。
- native `SettingsAppearanceThemePacksElement` 仍为 honest summary，不冒充 Web
  `ThemePackEditor` 完整编辑能力；本刀仅为 local runtime evidence，不冒充 Web↔Lynx
  paired gate。server live mutation、完整 theme pack contract、双主题双尺寸 paired 仍待。
- focused gates：Web **4 files / 66 tests**；slice **1 file / 4 tests**。Web production
  **8,881 modules**；slice final **2035.6kB Lynx / 2151.3kB desktop artifact total**。
- serial audit 严格 write→write→check→check：threads **50.07%**、threads-shell
  **57.58%**、thread **31.89%**、settings **46.60%**、projects/kanban **46.02%**、
  pull requests **45.77%**；style **98.04%**（2,255 / 13,135 weighted）。两仓
  `git diff --check` green。
- cleanup：temporary `/settings` route 与 Appearance initial section 均恢复并重建 final
  bundle；本轮 runtime 已停止；unrelated `t3code` PID 41999 / 8901 与用户 Lynx Explorer
  PID 2270 / 8903 均未触碰；KV/window-state SHA-256 回到
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
- P6-C4 保持 **in_progress**。下一刀优先把 ThemePackEditor 的 editable state/action
  composition 拆成 shared source 并映射 native controls；随后启动隔离 58090 server，
  完成 live server mutation 与 same-server/state light/dark 1280×820 + 1440×900 paired gate。

### 2026-07-30 — P6-C4 heartbeat：physical-shared ThemePackEditor

- 主仓新增 `ThemePackEditorComposition` + host-neutral model + canonical Web Elements；
  shared source 拥有 active-first 双 pack、title/context、Reset/Import/Copy/code-theme
  actions 与 Accent/Background/Foreground/UI font/Code font/Translucent sidebar/Contrast
  七行。Settings route 直接消费后删除原 monolithic `ThemePackEditor.tsx`。
- slice 新增 exact-aliased native Elements：HEX+swatch、Menu code theme、font Inputs、
  Switch、numeric contrast、clipboard Import/Copy；所有 mutation 使用原
  `theme.logic` pure functions 并写完整 canonical `synara:theme`。首个 compiler pass
  **2081.0kB**；移除 background callback 后不绘制的 transient feedback state 后 final
  **2079.8kB**。
- default production frame 绘制完整 Light editor。Computer Use 仅看到一个 Lynx AX
  container，HEX input coordinate typing 未获焦点，不冒充 text edit proof；但 button
  coordinate activation 实际命中 Copy/Import：owned runtime 依次记录
  `clipboardWriteText(codex-theme-v1:...)` 与
  `clipboardReadText → storageSet(synara:theme)`。
- 临时 canonical fixture `mode=light / codeTheme=linear / accent=#ff0066` full restart
  后 Light segment、Linear trigger、pink swatch/HEX、pack Reset、color reset、global
  Restore 同步投影。evidence：
  `shots/2026-07-30/port/p6-c4/settings-theme-editor/notes.md`。
- focused gates：Web **4 files / 30 tests**；slice **1 file / 5 tests**。Web production
  **8,883 modules**；slice final **2079.8kB Lynx / 2195.4kB desktop artifact total**。
- serial audit 严格 write→write→check→check：threads **49.68%**、threads-shell
  **57.14%**、thread **31.68%**、settings **46.33%**、projects/kanban **45.70%**、
  pull requests **45.55%**；style **98.03%**（2,255 / 13,124 weighted）。新增 native
  interaction adapter 使百分比小幅下降；按 D12/D13 仅报告，不作为放行阻塞。两仓
  `git diff --check` green。
- cleanup：temporary `/settings` route/Appearance section 恢复并 final rebuild；owned
  runtime 停止，用户 PID 2270 / 8903 未触碰；KV/window-state SHA-256 回到
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
- Copy 实机验证按产品语义把系统 clipboard 替换为 light theme share string；本刀未在
  action 前保存原 clipboard，无法逐字恢复，已登记 P-93，后续 clipboard 验证必须先备份。
- P6-C4 仍 **in_progress**。Theme-pack summary gap 已关闭；下一刀只剩 live server
  settings mutation、native text edit 与 same-server/state light/dark 两尺寸 paired gate。

### 2026-07-30 — P6-C4 completed：same-server paired + live mutation

- 按 `plan/05` dry-run 后启动 repo-owned isolated Synara
  `58090` + Web `8891`，Lynx/浏览器连接同一 `.synara-sxs` snapshot。native General
  把 `New threads` 从 Local 改为 New worktree 后，已连接 Web 无 reload 实时显示同值；
  结束前通过 Web 恢复 Local。
- 首轮 paired candidate 暴露 native Settings card 约 **904px**，Web 为 **624px**，
  因此未冒充完成。把 `SettingsContentInner` 收敛为 Web 同契约：
  **672px outer / 24px padding / 624px card** 并重建重采。
- retained Light/Dark × 1280×820/1440×900 matrix：sidebar **256/250px**
  delta 6px；content/card 左锚两尺寸均 **3px**；outer/card width 与 20/28、14/20
  header typography exact。Web/Lynx console error/warning 为空。evidence：
  `shots/2026-07-30/port/p6-c4/settings-paired/notes.md`。
- native HEX 最终 interaction attempt 不再只是 AX limitation：coordinate focus 后发送
  key input 复现 Lynxtron 0.0.7
  `NSInternalInconsistencyException: Flutter text model must not be null` 并退出；停止重试，
  登记 P-94 / compat 上游 gap。Copy/Import/Menu/Switch/reset/server mutation 均已有独立
  runtime proof，clipboard Import 保留为 text-input fallback。
- `scripts/capture.sh` 修正 installed app bundle 的精确大小写
  `dist/Lynxtron.app`，仍严格以 exact executable command + PID→lsof 识别 own client，
  未放宽到用户 8903。
- final gates：Web focused **7 files / 37 tests**；slice **1 file / 5 tests**；
  Web production **8,883 modules**；slice **2079.9kB Lynx / 2195.6kB desktop total**。
- serial audit 严格 write→write→check→check：threads **49.68%**、threads-shell
  **57.14%**、thread **31.68%**、settings **46.33%**、projects/kanban **45.70%**、
  pull requests **45.55%**；style **98.03%**（2,255 / 13,124 weighted）。
- cleanup：owned Lynx/server/Web 全部停止，58090/8891/8901 释放；用户 Lynx Explorer
  PID 2270 / 8903 未触碰。KV/window-state 逐字恢复到
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  临时备份已删除。
- P6-C4 标为 **completed**。下一任务按 D13 为 **P6-C5 Projects + Kanban + PR**。

### 2026-07-30 — P6-C5 heartbeat：physical-shared Kanban card

- 审计确认 Web 无独立 `/projects` route：Projects 真源是 `/kanban/` 的
  `KanbanOverview`，slice `/projects` tile grid 与全局 thread board 是 P5-R1 已登记
  false product semantics。第一刀选择 Web overview/project-board 共用叶子
  `KanbanCardView`。
- direct compiler probe **2091.2kB** 虽 green，但 raw `button/span` 不是可靠 host
  boundary；新增 `KanbanCardComposition` + canonical Web/Lynx Elements，让 shared
  source 拥有 title/draft-preview/provider/branch/env/fork/PR/attachment/status/time/
  column label 的 visibility/order/anatomy。Web `KanbanCardView` 反向 re-export；
  slice 产品 `/kanban` 删除本地 card JSX 与重复 CSS，probe 删除。
- real isolated snapshot 实机出现两张 Done 卡，provider icon、relative time、Done
  status 正常；Computer Use 点击第一张卡实际进入对应 transcript，DevTool console
  error/warning 为空。evidence：
  `shots/2026-07-30/port/p6-c5/kanban-card/notes.md`。
- Web focused **3 files / 49 tests**；slice 首轮因测试从 TSX 页面导入而在收集期报
  `@lynx-js/react/jsx-runtime`，把纯 projection 下沉 `FeatureListsPage.logic.ts` 后
  **1 file / 4 tests**。Web production **8,885 modules**；slice production
  **2099.2kB Lynx / 2214.9kB desktop total**。
- serial audit 严格 write→write→check→check：threads **51.02%**、threads-shell
  **58.68%**、thread **32.42%**、settings **47.52%**、projects/kanban **47.86%**、
  pull requests **46.85%**；style **98.03%**（2,255 / 13,115 weighted）。
- isolated server shutdown 的 conservative process-tree proof 报
  `captureComplete=false`，同时明确 no remaining descendants；随后 PID/port 检查无
  owned server/Web/Lynx/provider 残留。route 恢复 `/` 并 final rebuild；用户 PID
  2270 / 8903 未触碰；KV/window-state byte-exact 恢复为
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
- P6-C5 为 **in_progress**。下一刀抽 `KanbanOverview` project-column/header/empty
  composition，并把 `/projects` 导航语义折叠到真实 overview；随后拆 read-only
  `KanbanColumn`，DnD kernel 保留平台豁免。

### 2026-07-30 — P6-C5 heartbeat：physical-shared Kanban overview

- 主仓新增 `KanbanOverviewComposition` + canonical Web/Lynx Elements；shared source
  拥有 empty-project filter、In Progress→Draft→Done flatten、20-card cap、project
  header/count/chevron、card/show-more order 与 canonical empty copy。Web 原
  `KanbanOverview` 反向 re-export。
- slice 删除 `/projects` tile grid JSX/CSS；`/kanban` 与 transitional `/projects` 现均
  product-consume真实 overview，新增 `/kanban/:projectId` read-only drill-down。
  `FeatureListsPage.logic` 从 real normalized snapshot 组 project boards、按列/recency
  排序；New task mutation callback 未提供，因此 native 不画假能力。
- real isolated snapshot runtime：overview 两张卡分别落入两个 project columns；点击首个
  project header 后 dynamic board 只保留该项目一张 Done card。两帧 console
  error/warning 为空。evidence：
  `shots/2026-07-30/port/p6-c5/kanban-overview/notes.md`。
- focused gates：Web **3 files / 48 tests**；slice **1 file / 5 tests**。Web production
  **8,887 modules**；slice production **2115.0kB Lynx / 2230.7kB desktop total**。
- serial audit 严格 write→write→check→check：threads **51.02%**、threads-shell
  **58.68%**、thread **32.42%**、settings **47.52%**、projects/kanban **48.06%**、
  pull requests **46.85%**；style **98.03%**（2,255 / 13,115 weighted）。
- cleanup：owned Lynx/server/Web 全部停止，58090/8891/8901 释放；用户 Lynx Explorer
  PID 2270 / 8903 未触碰。KV/window-state byte-exact 恢复为
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
- P6-C5 保持 **in_progress**。下一刀把 `KanbanColumn` 拆为 read-only shared
  composition + DnD Web kernel；native 删除 column header/count/empty clean-room JSX。

### 2026-07-30 — P6-C5 heartbeat：physical-shared read-only Kanban column

- 主仓新增 `KanbanColumnComposition` + canonical Web/Lynx Elements；shared source 拥有
  column label/count/status、optional capability、card order、`No cards` 与 Done 30-card
  cap / expand state。Web In Progress/Done 反向消费 composition，`useDroppable` 仅留 outer
  wrapper；Draft sortable branch 保留 DnD kernel。
- slice `/kanban/:projectId` 三列全部 product-consume shared composition，删除本地 column
  header/count/card-list/empty JSX/CSS。real isolated snapshot 显示 Draft 0 / In Progress
  0 / Done 1、两空态与真实 Done card；Computer Use 点击 card 实际进入 transcript。两帧
  console error/warning 为空。evidence：
  `shots/2026-07-30/port/p6-c5/kanban-column/notes.md`。
- focused gates：Web **4 files / 50 tests**；slice **1 file / 5 tests**。Web production
  **8,889 modules**；slice production **2122.7kB Lynx / 2238.4kB desktop total**。
- 首轮 style check 因 `ring-sky-400/30`、`/60` 在第二 screen graph 新可达而跌破精确
  ratchet（显示仍 98.03%）；补 deterministic mapping 后完整 audit 严格重跑
  write→write→check→check：threads **51.02%**、threads-shell **58.68%**、thread
  **32.42%**、settings **47.52%**、projects/kanban **48.15%**、pull requests
  **46.85%**；style **98.06%**（12,924 / 13,180 weighted）。
- `capture.sh` ownership 从脆弱的 `.app` 大小写字符串改为 executable file identity +
  exact `dist/desktop` gate；own 8901 可捕获，只剩用户 8903 时负路径 fail closed。
- cleanup：owned Lynx/server/Web 全部停止，58090/8891/8901 释放；server conservative
  shutdown 再次报告 `captureComplete=false` 且 no captured descendants，显式 PID/port
  复查无残留。用户 Lynx Explorer PID 2270 / 8903 未触碰；KV/window-state byte-exact
  恢复为
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
- P6-C5 保持 **in_progress**。下一刀收敛 slice project-board projection 到更完整的
  canonical Web board state；随后迁移 PR list/row/empty，最后做 Projects/Kanban/PR paired
  gate。

### 2026-07-30 — P6-C5 heartbeat：canonical Web Kanban projection

- `fetchSidebarSnapshot` 不再为 Kanban 丢弃 normalized `SidebarThreadSummary`；跨线程携带
  full summaries + canonical project identity。`FeatureListsPage.logic` 直接 product-consume
  Web `buildKanbanBoard`，删除 `deriveSliceKanbanColumn`、slice card 重建、group/sort。
- 第一版把 builder 静态放进全局 query，审计会让所有 screen graph 都 reachable；修正为
  background 只运数据、FeatureLists 产品逻辑持有 canonical build。browser-local composer
  drafts/optimistic dispatch/manual DnD order/terminal entry state 因 native read-only
  capability 缺失显式传空。
- real isolated snapshot 给出判别性证据：`READY-LYNX-COMPOSER` 有消息但
  `latestTurn === null`，旧 slice 判 Done，canonical Web 判 Draft。最终 overview 为一张
  Draft + 一张 Done；project drill-down 为 Draft 1 / In Progress 0 / Done 0；console
  error/warning 为空。evidence：
  `shots/2026-07-30/port/p6-c5/kanban-projection/notes.md`。
- focused gates：Web canonical logic **2 files / 47 tests**；slice **1 file / 2 tests**。
  Web production **8,889 modules**；final slice production **2132.6kB Lynx /
  2248.2kB desktop total**。
- serial audit 严格 write→write→check→check：threads **51.38%**、threads-shell
  **59.11%**、thread **32.62%**、settings **47.84%**、projects/kanban **48.45%**、
  pull requests **47.29%**；style **98.06%**（12,924 / 13,180 weighted）。
- cleanup：两次 final-boundary runtime 均停止，58090/8891/8901 释放，用户 Lynx Explorer
  PID 2270 / 8903 未触碰；KV/window-state byte-exact 恢复为
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
- P6-C5 保持 **in_progress**。下一刀迁移 PR list/row/empty composition。

### 2026-07-30 — P6-C5 heartbeat：physical-shared PR list/row + real paired evidence

- 主仓新增 `PullRequestListComposition` / `PullRequestRowComposition` 与 canonical
  Web Elements；Web 原 list/row API 反向 re-export。shared source 持有 group/order、
  pinned-first、loading/empty、state/title/meta/time/diff 与 pin availability anatomy。
  slice 新增 exact-aliased Lynx Elements，删除本地 PR row/list/loading/empty JSX/CSS。
- `pullRequests.list` native snapshot 升级为 `{ viewer, entries }` 并携带完整 canonical
  entries。真实 route 首轮出现 `u.filter is not a function`；多轮 controlled socket
  teardown/dispatcher probes 均不改变错误，已全部回滚。bundle 定位最终证明 Sidebar
  review badge 仍把 query result 当 array；修正为
  `countUniqueViewerReviewRequests(pullRequests.entries)` 后 LogBox 消失。
- native RPC facade 保留单 socket 单 dispatcher + pending-call map，避免并发 RPC 重复
  listener；source route 恢复 `/`，无 probe/EventEmitter monkeypatch 残留。
- 同一 isolated 58090 server 的真实 `Emanuele-web04/synara` 50-entry result 完成
  Web/Lynx 1280×820 与 1440×900 paired frames。list 水平锚分别约差 4.5px / 0.5px，
  console error/warning 均为空。native 仍有 clean-room hero header，缺 Web tabs/search/
  project filter/detail/pin，因此本组只放行 list cut，不冒充 PR whole-screen gate。
  evidence：`shots/2026-07-30/port/p6-c5/pull-requests/notes.md`。
- 首轮 final style check 捕获新增 `first:hidden` 未映射。将 separator visibility 上提为
  shared `showSeparator` anatomy fact，双端 Elements 只按 fact 绘制；随后完整重跑
  tests/build/audits。
- final gates：Web focused **2 files / 24 tests**；slice **1 file / 4 tests**；Web
  production **8,893 modules**；slice **2153.4kB Lynx / 2269.0kB desktop total**。
- serial audit 严格 write→write→check→check：threads **51.40%**、threads-shell
  **59.12%**、thread **32.79%**、settings **47.85%**、projects/kanban **48.47%**、
  pull requests **48.17%**；style **98.06%**（12,924 / 13,180 weighted）。两仓
  `git diff --check` green。
- cleanup：owned server/Web/Lynx 停止，58090/8891/8901 释放；用户 Lynx Explorer
  PID 2270 / 8903 未触碰。temporary isolated state/RPC probes 已删除。KV/window-state
  精确恢复为
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
- P6-C5 保持 **in_progress**。下一刀共享 PR route header/filter composition；text search
  必须遵守 P-94 的 input crash capability honesty，再处理 detail/pin 与 final paired gate。

### 2026-07-30 — P6-C5 heartbeat：physical-shared PR route header/filter

- 主仓新增 `PullRequestRouteHeaderComposition` /
  `PullRequestRouteFiltersComposition` 与 canonical Web Elements；shared source 拥有
  title/scope/refresh、All/Reviewing/Authored、Open/Closed/Merged、search capability 与
  project filter order。Web 原 route 反向消费。
- slice 新增 exact-aliased native Elements；PR page 删除 clean-room hero/filter structure，
  state/projectId 进入真实 query key 与 `pullRequests.list` payload，involvement 走 Web
  canonical viewer filter。P-94 native text crash 下显式显示
  `Search unavailable in this runtime`，不画假输入。
- 同一 isolated 58090 server 注入真实 Synara project 并返回 50 entries。exact
  `localhost:8901/session 1` touch 实际完成 Open→Closed、All projects menu→Synara、
  All→Reviewing；分别得到真实 closed rows、header/trigger scoped state 与 canonical
  empty。检测到另一同 bundle Lynxtron 首页后未触碰，改用 DevTool 精确 client；所有
  Lynx frame console error/warning 为空。
- Web 同 server/snapshot 的 Synara/Open 与 Reviewing/Open empty 也由同一 composition
  绘制；in-app Browser 固定 1280×720，因此只作为 interaction/composition proof，不冒充
  新的 exact two-size geometry gate。此前 PR list 的 1280×820/1440×900 exact pair 继续
  保留。evidence：
  `shots/2026-07-30/port/p6-c5/pull-request-controls/notes.md`。
- focused gates：Web **3 files / 26 tests**；slice **1 file / 5 tests**。首次从 monorepo
  根执行 Web target 被 Turbo 当 task name，未执行测试；立即在 `apps/web` 以要求的
  `bun run test -- ...` 重跑并 26/26 green。Web production **8,895 modules**；slice final
  **2168.3kB Lynx / 2280.9kB desktop runtime total**。
- serial audit 严格 write→write→check→check：threads **51.73%**、threads-shell
  **59.51%**、thread **33.13%**、settings **48.40%**、projects/kanban **48.97%**、
  pull requests **49.02%**；style **98.06%**（12,928 / 13,184 weighted）。两仓
  `git diff --check` green。
- cleanup：temporary `/pull-requests` route 恢复 `/` 并 final rebuild；owned
  server/Web/Lynx 停止，58090/8891/8901 释放，用户 PID 2270 / 8903 未触碰；temporary
  isolated state/RPC fixture 删除。KV/window-state byte-exact 回到
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
- P6-C5 保持 **in_progress**。下一刀共享 PR detail state/anatomy + pin interaction，
  随后跑 Projects/Kanban/PR final same-server/state two-size paired gate。

### 2026-07-30 — P6-C5 heartbeat：physical-shared PR Summary + real cross-client pin

- 主仓新增 `PullRequestSummaryComposition` / canonical Elements 与纯 summary logic；Web
  `PullRequestSummaryTab` 反向消费，checks 外链仍走原 native shell。shared source 拥有
  title/meta/branch/reviewer/comment/check、section/Markdown/check/comment 顺序与
  unavailable-commenting copy。
- slice 新增真实 `pullRequests.detail` / `pullRequests.setPinned` background ports；PR
  product route 接 selection/detail query/right dock/shared Summary，并用 canonical
  aggregate/project toggle inputs mutation + refetch。filter 切换清旧 selection，pin failure
  显式显示；Timeline/Code/commenting 明示 unavailable，不画假 tab/composer。
- isolated 58090 + exact 8901 实机选中真实 `Emanuele-web04/synara` PR #478，detail
  title/meta/branch/checks/Markdown 与 Web 一致；native pin 后 Web refresh 同步出现 Pinned，
  native unpin 后 Web refresh 恢复 Others。所有 native frame console error/warning 为空。
  Browser 固定 1280×720，因此这组只证明 composition/interaction/cross-client mutation，
  不冒充 exact two-size geometry。evidence：
  `shots/2026-07-30/port/p6-c5/pull-request-detail-pin/notes.md`。
- cleanup fixture 经真实 `project.delete` 删除，临时 RPC export/fixture/probe/route 已清；
  owned 58090/8891/8901 停止，用户 PID 2270 / 8903 未触碰。window-state byte-exact 为
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。复查发现 final
  default-route boot 在 10:31 CST 写过 `kv.json`，当前 SHA-256
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be`，与 pre-run
  `3a46319cdd22b4401117ece23cd54f4fa5298856c4fb6ffe7ef317df2102f5cb` 不同；本刀未保留
  exact backup，故不猜写、不覆盖当前 valid JSON，将其保留为 P6-C5 cleanup open item。
- final gates：Web focused **5 files / 49 tests**；slice **1 file / 5 tests**；Web production
  **8,898 modules**；slice **2202.4kB Lynx / 2318.0kB desktop total**。
- serial audit 严格 write→write→check→check：threads **54.95%**、threads-shell
  **63.23%**、thread **38.07%**、settings **51.32%**、projects/kanban **51.96%**、
  pull requests **56.91%**；style **98.06%**（12,931 / 13,187 weighted）。两仓
  `git diff --check` green。
- P6-C5 保持 **in_progress**。下一刀先以当前 KV 作明确新 baseline 并保留 exact backup，
  再跑 Projects/Kanban/PR 1280×820 / 1440×900 same-server/state final paired gate；任何
  runtime 写入均从该 backup byte-exact 恢复。

### 2026-07-30 — P6-C5 completed：Projects/Kanban/PR final paired gate

- 以当前 valid KV SHA-256
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be`
  建立 explicit byte backup 后，启动 repo-owned isolated Synara `58090` + Web `8891` +
  exact Lynx `8901`；两端连接同一 `.synara-sxs` snapshot、同一 temporary real Synara
  project、同一 Kanban/PR route state。
- final paired 首轮没有把截图“看起来差不多”冒充通过，反而关闭三项真实漂移：
  1. Web `KanbanView` local recursive `getNavigatorPlatform()` 覆盖 imported helper，
     fresh route boot 栈溢出；删除递归 local 后新 tab console clean；
  2. native 将 chat-kind containers 折叠为 canonical trailing `Chats`，排除 Studio 并保留
     real projects，Web/Lynx 现在得到相同 project/container/card order；
  3. native-only `CONTROL CENTER` hero 删除，route header 改为 physical-shared
     composition。PR dock 的错误 52% candidate 在 1440 暴露 23px drift，回到 Web 50%
     后 1280 split **769/769px**、1440 约 **848/849px**。
- retained 16-frame matrix 覆盖 Kanban overview、project board、PR list、PR #478 Summary
  detail × Web/Lynx × 1280×820/1440×900。sidebar/main delta 0.5px、header 1px、project
  columns 2px、最大 column/card vertical delta 6.5px，全部满足 ≤8px；shared typography
  ≤2px。Web/Lynx console error/warning 均为空。evidence：
  `shots/2026-07-30/port/p6-c5/final-paired/notes.md`。
- final gates：Web focused **9 files / 55 tests**；slice **1 file / 6 tests**；Web
  production **8,900 modules**；slice **2211.2kB Lynx / 2326.8kB desktop total**。
- serial audit 严格 write→write→check→check：threads **54.95%**、threads-shell
  **63.23%**、thread **38.07%**、settings **51.32%**、projects/kanban **52.07%**、
  pull requests **56.91%**；style **98.06%**（2,253 classes / 13,183 weighted）。
  两仓 `git diff --check` green；产品 source 无 probe/fixture ID/P6-C5 temp marker。
- cleanup：temporary project 经 real `project.delete` 删除；Browser viewport reset + tabs
  finalized；owned Lynx/server/Web 停止，58090/8891/8901 释放，用户 Lynx Explorer PID
  2270 / 8903 未触碰。KV/window-state byte-exact 恢复为
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified backup 删除。server shutdown 的既有 conservative Codex discovery
  `captureComplete=false` 同时明确 root exited/no remaining descendants，PID/port 复查无
  owned 残留。
- P6-C5 标为 **completed**。下一任务按 D13 为 **P6-C6 Shared-source convergence**：
  删除仍被 shared trees 替代的 native renderer/style，生成六核心屏 reuse gap 报告并对
  低于 70% 的模块逐项解释；≥70% 是报告目标，不单独阻塞任务。

### 2026-07-30 — P6-C6 heartbeat：remove diagnostic product reachability

- production `router.tsx` 仍静态 import `/ports`、`/ui`、`/markdown`、
  `/shared-settings-probe`、`/fidelity-reference` 五个历史 probe 页面；后者还通过
  `synara://fidelity-reference` deep link 可达。这不是六核心屏产品消费，却会进入单一
  Lynx graph 并制造 reference source reuse。
- 删除 production imports、parse/render branches 和 fidelity deep link；未知该 deep link
  现在按既有 unknown-host contract 安全回 `/`。probe source 文件暂留到 P8-Q1 physical
  cleanup，但已不进入产品 graph。
- validation：shell runtime **1 file / 3 tests**；slice production **2167.8kB Lynx /
  2283.4kB desktop total**，相对 P6-C5 final 减少 **43.4kB**。
- serial audit 严格 write→write→check→check：threads **54.95%**、threads-shell
  **63.23%**、thread **38.07%**、settings **51.10%**、projects/kanban **52.07%**、
  pull requests **56.91%**；style **98.06%**。Settings 的 -0.22pp 是去除
  `FidelityReferencePage` 假可达后的 honest correction，不回填 unused import。
- 新增 `plan/reports/p6-c6-convergence.md`，记录当前六屏距离、主要 gap group、不得扩大
  EXCLUSIVE 的解释和 exit checklist。P6-C6 保持 **in_progress**；下一刀审计 native PR
  dock/route wrapper 与 global CSS，删除仍由 slice 独立拥有的普通 anatomy。

### 2026-07-30 — P6-C6 heartbeat：one physical Kanban route header owner

- audit 发现 project board 已消费 shared `KanbanRouteHeaderComposition`，但 overview 仍有
  唯一调用的 `FeatureHeader/RouteIdentity/Title/Count` JSX 与重复 CSS。overview 改为同一
  shared header；删除旧 JSX、四组 route header CSS、obsolete overview inner wrapper 和
  未使用 Feature title/subtitle rules。
- focused gates：Web Kanban header/overview **2 files / 3 tests**；slice feature projection
  **1 file / 6 tests**。Web production **8,900 modules**；slice **2166.5kB Lynx /
  2282.0kB desktop total**。
- repo-owned `8901`、1440×900 offline smoke 精确点击 Kanban 后，shared `Kanban / 0 tasks /
New task` 44px header 与真实 unavailable state 正常，console error/warning 为空。证据：
  `shots/2026-07-30/port/p6-c6/kanban-overview-header/notes.md`。
- KV/window-state 从 explicit backup byte-exact 恢复到
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  owned 8901 停止，用户 PID 2270 / 8903 未触碰。
- serial audit write→write→check→check green，Projects/Kanban 仍 **52.07%**、style
  **98.06%**。百分比不变是因为 header module 早已由 project route 可达；本刀价值是删除
  第二 source owner，不用重复 consumer 冒充 numerator 增长（04 P-104）。
- P6-C6 保持 **in_progress**。下一刀继续枚举 `FeatureListsPage` 的 PR dock/route wrapper
  与 `App.css`，区分 shared candidate 与 registered native host shell。

### 2026-07-30 — P6-C6 heartbeat：diagnostic CSS leaves the product graph

- diagnostic route/source 已从 production router 不可达，但 reference、primitive、
  Markdown、port self-test selectors 仍位于入口统一 import 的 `App.css`，继续随六个核心屏
  打包。现迁入 page-owned `diagnostics.css` / `FidelityReferencePage.css`，保留的 harness
  source 各自显式 import；P8-Q1 再物理删除或迁入独立 dev-only harness。
- 删除已被 shared renderer 替代且无调用方的 bubble、feature-empty、read-only-footer、
  settings-nav 等旧 recipe。跨 slice + canonical Web source 静态扫描确认 production
  `App.css` **79 classes / 0 unreferenced**，同时保留 Web shared source 实际使用的
  `chat-surface-divider`，没有按 slice-only 搜索误删。
- focused gates：Web Kanban header/overview **2 files / 3 tests**；slice shell/feature
  **2 files / 9 tests**。首次从 monorepo 根传文件参数被 Turbo 当 task name，未执行测试；
  随即在 `apps/web` 以要求的 `bun run test -- ...` 重跑并 3/3 green。
- Web production **8,900 modules**；slice **2159.3kB Lynx / 2274.8kB desktop total**，
  相对上一刀两端各减 **7.2kB**。只有既有 `color-scheme` encode 与可选 `ws` native
  addon warning。
- serial audit 严格 write→write→check→check：threads **54.95%**、threads-shell
  **63.23%**、thread **38.07%**、settings **51.10%**、projects/kanban **52.07%**、
  pull requests **56.91%**；style **98.06%**（2,253 classes / 13,183 weighted）。
  两仓 `git diff --check` green。percentages 不变是预期：本刀删除 global product CSS，
  不制造 reuse credit（04 P-105）。
- 未启动 runtime；8901 保持释放，用户 Lynx Explorer PID 2270 / 8903 未触碰；KV/window
  state 没有写入。P6-C6 保持 **in_progress**，下一刀完成 native core-screen JSX/CSS
  ownership 表，再收敛 PR dock / Settings 的 ordinary anatomy。

### 2026-07-30 — P6-C6 heartbeat：PR detail tabs/capability single owner

- 完成六核心屏 production JSX/CSS ownership 枚举并写入 convergence report，逐屏区分
  physical-shared anatomy、native host/controller、真实 platform kernel 与下一普通
  source-deletion candidate。exit checklist 的 ownership 项已关闭。
- 主仓新增 physical-shared `PullRequestDetailTabsComposition` 与 Web Elements/test；Web
  `PullRequestDetailPanel` 反向消费 canonical Summary/Timeline/Code order、active state。
  slice 新增 exact-alias Lynx Elements/CSS，产品只声明 `summary` available；删除本地 Summary
  chip、capability JSX 与重复 tab/capability styles。
- real RPC 在临时真实 Synara project 中返回 viewer Huxpro、50 个 PR；production Lynx
  exact DevTool 选择真实 PR #478。DOM 证明 Timeline `aria-disabled=true`、76×28，center
  tap 后 Summary 仍 active；同帧明确 `Timeline and Code are unavailable in this runtime`，
  console error/warning 为空。content capture 为 1280×788（32px native titlebar 不在
  DevTool 图内）；证据 `shots/2026-07-30/port/p6-c6/pr-detail-tabs/notes.md`。
- gates：Web focused **3 files / 6 tests**；slice focused **2 files / 9 tests**；Web
  production **8,902 modules**；slice **2163.1kB Lynx / 2278.7kB desktop total**。
  production `App.css` **74 classes / 0 unreferenced**，PR adapter CSS **8 / 0**。
- serial audit 严格 write→write→check→check：threads **54.95%**、threads-shell
  **63.23%**、thread **38.11%**、settings **51.10%**、projects/kanban **52.07%**、
  pull requests **56.97%**；style **98.06%**（2,253 classes / 13,185 weighted）。
  两仓 `git diff --check` green。
- temporary project 通过 real RPC 删除并确认 canonical `deleted_at`；owned
  58090/8891/8901 停止且端口释放，用户 8902/8903 未触碰。KV/window-state byte-exact
  恢复为
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`，
  verified temporary backup 已删除。
- P6-C6 保持 **in_progress**；下一刀优先收敛 Settings Back/search sidebar 普通 anatomy，
  随后处理 PR dock identity/close chrome。Timeline/Code/review 仍是诚实 Web-only kernel，
  disabled taxonomy 不冒充能力。

### 2026-07-30 — P6-C6 heartbeat：Settings Back/Search chrome single owner

- Web `SettingsSidebarNav` 的 Back/Search 与 native `SettingsPage` 本地 Back link +
  uncontrolled `<Input>` 是第二 owner；后者还会进入 P-94 已稳定复现的
  `Flutter text model must not be null` crash。新增 physical-shared
  `SettingsSidebarChromeComposition`，共同拥有 Back→Search order、labels 与
  available/unavailable capability branch。
- Web 反向消费 available 分支，保留真实 query ranking、Enter top-match、Escape clear；
  native exact-alias Elements 使用 shared Tabler Arrow/Search glyph，选择 unavailable，
  删除 local Back/Input JSX 与 `BackLink`/`SettingsBack` CSS。搜索 root
  `aria-disabled=true`，outer HTML 无 input/bindtap，不再暴露 crash path。
- compiler-first 未 alias DOM Elements 时仍 green，但 Lynx **2196.9kB**；这证明 compile
  不是 adapter 命中。retained exact alias 为 **2170.1kB**，临时 probe/import 已删除。
- production DevTool：Back border 221×28、Search 213×28；exact Back center tap 回到
  `What should we work on?` landing，console error/warning 为空。最终 1280×788 content
  frame（1280×820 window）见
  `shots/2026-07-30/port/p6-c6/settings-sidebar-chrome/notes.md`。
- gates：Web focused **3 files / 13 tests**；slice focused **2 files / 8 tests**；Web
  production **8,904 modules**；slice **2170.1kB Lynx / 2285.6kB desktop total**。
  production `App.css` **72 classes / 0 unreferenced**，Settings chrome adapter **9 / 0**。
- serial audit write→write→check→check：threads **55.05%**、threads-shell **63.33%**、
  thread **38.18%**、settings **51.19%**、projects/kanban **52.15%**、PR
  **57.05%**；style **98.06%**（2,253 classes / 13,185 weighted）。共享 module 经全局
  app shell真实可达，故所有 route graph 小幅上升；不是 unused import。两仓 diff check green。
- 两次 owned runtime 已停止且 8901 释放，用户 8902/8903 未触碰；KV/window-state
  byte-exact 恢复为
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
  verified backup 与 superseded intermediate capture 已删除。
- P6-C6 保持 **in_progress**；下一刀处理 PR dock identity/close chrome，再重生成最终
  six-screen gap/exit audit。

### 2026-07-30 — P6-C6 completed：PR close + collapsed-work final convergence

- PR detail 新增 physical-shared `PullRequestDetailCloseComposition`；Web 原 panel 反向消费，
  native exact Elements 绘制 28×28 X。删除 Web 没有对应 anatomy 的 native-only
  `PR #…` identity，而不是把错误差异包进 shared source。真实 RPC 选中 50-entry response
  中 PR #478，DOM 证明 close label/geometry、`PR #478` search=0，center tap 后 dock 消失，
  console clean。unaliased Web IconButton graph 虽编译但为 2388.0kB，retained exact alias
  2170.2kB。证据 `shots/2026-07-30/port/p6-c6/pr-detail-close/notes.md`。
- Thread 新增 physical-shared `CollapsedWorkComposition`，统一 `Worked for/Details`、
  trigger→panel→divider 顺序、Expand/Collapse accessible label 与 controlled open contract；
  Web 保留 Base UI/motion Elements，Lynx 只保留 disclosure tap/visibility Elements。
  删除全部 `TranscriptCollapsedWork*` 本地 chrome JSX/CSS。临时 in-memory product
  Transcript route 中 exact trigger 101×18，center tap 后 panel 0→1、Expand→Collapse、真实
  work row 出现，console clean；probe route final build 前删除。证据
  `shots/2026-07-30/port/p6-c6/collapsed-work-chrome/notes.md`。
- final gates：Web focused **4 files / 8 tests**；slice **4 files / 20 tests**；Web
  production **8,908 modules**；slice **2173.0kB Lynx / 2288.6kB desktop total**。
  broader MessagesTimeline 为既有 **43/48** baseline，五项仍是已登记的 status/icon
  expectation drift，collapsed-work coverage 全过。
- serial audit 严格 write→write→check→check：threads **55.05%**、threads-shell
  **63.33%**、thread **38.26%**、settings **51.19%**、projects/kanban **52.15%**、
  PR **57.08%**；style **98.06%**（2,253 classes / 13,185 weighted）。低于 70 的每一组
  已在 convergence report 解释，未用 unused/type-only/copy/EXCLUSIVE 扩张抬数。
- owned runtime 停止且 8901 释放，用户 8902/8903 未触碰。KV/window state byte-exact
  恢复为
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  temporary route/probe/process 无残留。
- P6-C6 exit checklist 全部关闭并标为 **completed**。下一任务按 D13 为
  **P7-I1 hover/active/focus/keyboard**；先建立六核心屏 Web→Lynx interaction inventory，
  再切 pointer/focus/keyboard 实机闭环。

### 2026-07-30 — P7-I1 started：six-screen interaction inventory

- 对照 Web handlers/classes 与 slice product Elements 后建立
  `plan/reports/p7-i1-interaction-inventory.md`，覆盖 shell/sidebar、thread/transcript、
  composer、Settings、Projects/Kanban、PR 六核心 surface 的 hover/pressed/focus/key
  contract、当前 native 状态与处理顺序。
- ReactLynx PC 当前类型/runtime 明确暴露 mouse enter/leave/down/up、touch lifecycle、
  `focusable`、focus/blur、keydown/up + `event.key`；因此不能把全部桌面交互登记成平台
  unavailable。当前主要缺口是 native Elements 几乎只映射 `bindtap`。
- P6-C3 的 textarea Arrow/Enter/Escape 吞键结论仍保留为窄平台 kernel exception，不外推
  到所有 view-backed control。
- 第一可执行切口定为 PR row/pin/filter/tab/close：真实 action、disabled taxonomy 与
  DevTool DOM 证据链已存在，适合先建立可复用 native interaction-state adapter 与
  hover/focus/Enter/Space ratchet。

### 2026-07-30 — P7-I1 heartbeat：PR pointer/pressed/disabled ratchet

- 新增 `useLynxInteractiveState`，统一 view-backed control 的 hover/focus/pressed class、
  mouse/touch/focus lifecycle、Enter/Space activation 与 disabled exclusion；接入 PR
  row action/root、pin、filter pill、detail tab 和 close。handler unit test 证明支持键
  exact activate once + preventDefault，Escape/Arrow 不被消费。
- isolated real RPC project 返回 viewer Huxpro 与 50 个真实 PR。production 实机证明：
  Reviewing hover enter/leave、All primary down/up 的 `ui-pressed`；真实 PR row 与 close
  拥有完整 bindings。Timeline/Code 则为 `focusable=false`、`aria-disabled=true` 且
  outer HTML 完全没有 mouse/focus/key/tap handlers。
- focus/key 不冒充通过：click、Tab、`DOM.focus` 均未触发 `bindfocus`；main-thread
  `Element.invoke("setFocus")` Promise fulfilled 仍无 focus class。桌面诊断发现旧
  `lynxtron quit unexpectedly` macOS modal 覆盖产品窗口，阻断 OS 输入；未点击该系统
  dialog。Fiber synthetic key/tap 也未跨 native publication boundary，登记为阴性 probe。
- gates：Web PR compositions **4 files / 8 tests**；slice **2 files / 10 tests**；Web
  production **8,908 modules**；slice **2178.0kB Lynx / 2293.6kB desktop total**。
  serial audit write→write→check→check：threads **55.05%**、threads-shell **63.33%**、
  thread **38.26%**、settings **51.19%**、projects/kanban **52.15%**、PR
  **57.08%**；style **98.06%**（2,253 classes / 13,185 weighted）。
- temporary project delete sequence **176**，SQLite canonical `deleted_at` 已确认。owned
  58090/8891/8901 停止；用户 8902/8903 未触碰。KV/window state byte-exact 恢复为
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  temporary RPC/DOM/desktop diagnostic/backup 均已清理。
- P7-I1 保持 **in_progress**。下一刀继续 Settings/sidebar/Kanban 的 view-backed
  pointer/focus/key mapping；在无系统模态框 runtime 再复验 PR 的真实 Tab/Enter/Space，
  不因本次宿主输入障碍停住主线。

### 2026-07-30 — P7-I1 heartbeat：Settings enabled/disabled interaction ratchet

- 同一 `useLynxInteractiveState` 扩到 Settings Back、General/Appearance nav、changed reset
  与 boolean switch；补 hover/focus/pressed CSS、Enter/Space、switch accessible label /
  checked state。Search 与 12 个 unavailable nav 均显式 `focusable=false`，helper 从 DOM
  移除全部 event handler。
- production DOM 证明 Back/General/Appearance/switch 有完整 binding；Profile 等 disabled
  rows 只有 `aria-disabled=true`。Chats switch exact press 进入 `ui-pressed`，release
  `aria-checked` true→false 并写真实 `synara:app-settings:v1`；disabled Profile center
  activation 后 General 仍 selected，console error/warning 为空。
- gates：Web Settings **5 files / 10 tests**；slice **2 files / 9 tests**；Web production
  **8,908 modules**；slice **2181.8kB Lynx / 2297.3kB desktop total**。serial audit
  write→write→check→check：threads **55.05%**、threads-shell **63.33%**、thread
  **38.26%**、settings **51.19%**、projects/kanban **52.15%**、PR **57.08%**；style
  **98.06%**（2,253 classes / 13,185 weighted）。
- runtime 前逐字备份 renderer KV/window state；真实 toggle 后恢复为
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
  owned 8901 已停止，用户 8902/8903 未触碰，verified backup 已删除。
- P7-I1 保持 **in_progress**。下一刀优先把 shared
  `SidebarPrimaryActionButton` 与 Kanban view-backed targets 接入同一 adapter；真实
  focus/key 仍等无系统模态框环境复验。

### 2026-07-30 — P7-I1 heartbeat：Sidebar + Kanban action/disabled ratchet

- 同一 `useLynxInteractiveState` 扩到 Sidebar primary action、Kanban project header、
  card、route Back/New task、column/overview action。enabled host 统一
  hover/focus/pressed + mouse/touch/key/tap；Automations 与 native New task 为结构性
  disabled，DOM 无任何 handler。
- repo-owned isolated 58090 snapshot 有真实 2-task overview、project board 与
  `Reply MODEL-READY` transcript。exact press/release 完成
  Sidebar Kanban→project header→real card→transcript；card、project header、Back 与
  sidebar row 都实际进入 `ui-pressed`，Back 返回 overview。disabled New task exact
  activation 不改变 route，console error/warning 为空。
- gates：Web focused **7 files / 112 tests**；slice focused **2 files / 10 tests**；
  Web production **8,908 modules**；slice **2187.2kB Lynx / 2302.8kB desktop total**。
  证据见
  `shots/2026-07-30/port/p7-i1/sidebar-kanban-interactions/notes.md`。
- serial audit 严格 write→write→check→check：threads **55.05%**、
  threads-shell **63.33%**、thread **38.26%**、settings **51.19%**、
  projects/kanban **52.15%**、PR **57.08%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。数字不变是预期：本刀给已可达 shared
  composition 增加 host interaction semantics，不制造新的 shared source credit。
- owned 58090/8891/8901 已停止且端口释放；shutdown 的 conservative discovery warning
  同时报告 root exited / no remaining descendants，PID/port 复核无残留。用户 8902/8903
  未触碰。KV/window state byte-exact 恢复为
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified backup/DOM payload 已移入 Trash。
- P7-I1 保持 **in_progress**：本刀关闭 Sidebar/Kanban pointer/action/disabled 子项，
  不把完整 DOM bindings 或 source key tests 冒充宿主真实 focus/key。下一刀处理
  thread/transcript/composer 的非文本 view-backed controls，并继续寻找无模态环境的
  Tab/Enter/Space 正向证据。

### 2026-07-30 — P7-I1 heartbeat：Transcript disclosure pressed/action ratchet

- physical-shared `CollapsedWorkComposition` 的 Lynx trigger 接入同一 interaction
  adapter；native `TranscriptJump` host 同步获得 hover/focus/pressed、Enter/Space 与
  accessible label，但 list/controller 仍是平台 kernel。
- real `Reply MODEL-READY` transcript 有 3 个真实 collapsed-work trigger；exact press
  使首个进入 `ui-pressed`，release 后 `aria-expanded=false→true`、Expand→Collapse、
  chevron 与真实 panel 同步变化，console error/warning 为空。
- Jump 不冒充通过：两个方向的 DevTool touch drag 与 main-thread fulfilled
  `scrollToPosition(index=0)` 都没有让 controller 进入 unpinned，host 未出现。
  interaction wiring 保留，user-scroll detach→Jump→reattach 转 P7-I3 继续。
- gates：Web focused **1 file / 2 tests**；slice focused **2 files / 10 tests**；
  Web production **8,908 modules**；slice **2188.3kB Lynx / 2303.9kB desktop total**。
  额外 broad App harness 的 10 个目标断言均跑过，但随后在 Rstest 临时
  `@lynx-js/lynx-ui` vendor load 报 `Invalid left-hand side in assignment`，不计 green
  gate；focused rerun 全绿。证据：
  `shots/2026-07-30/port/p7-i1/transcript-interactions/notes.md`。
- serial audit 严格 write→write→check→check：threads **55.05%**、
  threads-shell **63.33%**、thread **38.26%**、settings **51.19%**、
  projects/kanban **52.15%**、PR **57.08%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。`synara-lynx` 与 `synara` 两仓
  `git diff --check` 均通过。
- owned 58090/8891/8901 停止且端口释放，用户 8902/8903 未触碰。KV/window state
  byte-exact 恢复为
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified backup/DOM payload 已移入 Trash。
- P7-I1 保持 **in_progress**；本刀只关闭 disclosure pointer/action，下一刀处理 composer
  非文本 view-backed controls。focus/key 与 Jump scroll path 仍分别保持 open。

### 2026-07-30 — P7-I1 heartbeat：Composer non-text interaction ratchet

- canonical `interactive-state.lynx` helper 上移到 UI host，旧 adapter path 保留兼容
  re-export；MenuTrigger、Composer send/stop、model trigger、trait/Fast controls 统一
  hover/focus/pressed、Enter/Space 与 disabled exclusion。sibling model/trait trigger
  从会在 DevTool press/release 双 activation 的 `catchtap` 修正为 helper `bindtap`。
- production real `Reply MODEL-READY` transcript 证明：disabled Send 为
  `focusable=false`/`aria-disabled=true`/零 handlers；Extras、Runtime、model、六个
  effort option 与 Fast mode 均完整 binding。model exact press 保持
  `aria-expanded=false` 并进入 `ui-pressed`，release 后稳定展开；Low trait 与 Extras
  也分别证明 pressed→real release action。console error/warning 为空。证据见
  `shots/2026-07-30/port/p7-i1/composer-interactions/notes.md`。
- gates：Web focused **6 files / 11 tests**；slice focused **3 files / 14 tests**；
  Web production **8,908 modules**；slice **2191.4kB Lynx / 2306.9kB desktop total**。
- serial audit 严格 write→write→check→check：threads **55.05%**、
  threads-shell **63.33%**、thread **38.26%**、settings **51.19%**、
  projects/kanban **52.15%**、PR **57.08%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。数字不变符合预期：本刀收敛 native host
  interaction semantics，不增加虚假 shared-source credit。两仓 `git diff --check` green。
- Desktop DevTool 的并发 DOM 请求会 `ECONNRESET`，并行 screenshot connector 也会中止
  长连接；最终 assertions 改为单 connector 严格串行，截图/console 使用独立 exact-state
  run。该工具 reset 未计产品失败，模式登记为 P-112。
- owned 58090/8891/8901 停止且释放；shutdown conservative discovery warning 同时确认
  root exited / no remaining descendants。用户 8903 Lynx Explorer 未触碰。KV/window
  state byte-exact 恢复为
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified backup/runtime payload 已移入 Trash。
- P7-I1 保持 **in_progress**；Composer 非文本 pointer/action/disabled 子项关闭。下一刀
  审计剩余 view-backed controls，并继续无系统模态环境的真实 Tab/focus/key 证据；textarea
  key kernel exception 与 Jump scroll path 均保持 open。

### 2026-07-30 — P7-I1 heartbeat：Sidebar segmented/project/thread/chats ratchet

- Sidebar segmented picker、Chats disclosure/pagination、project disclosure 与全部
  pinned/studio/project/chat thread wrapper 接 canonical UI-host interaction helper；直接
  tap-only row wrapper 已从产品 Sidebar 清零。新增 selected/expanded labels/aria、hover/
  focus/pressed CSS；pagination 未出现时保持 source wiring，不冒充 runtime action。
- production real snapshot 证明：Studio exact press 进入 `ui-pressed`、release 后
  `aria-pressed=true`，Projects 恢复；真实 project header exact press 后
  expanded true→false 并恢复；`Reply MODEL-READY` row 进入 `ui-pressed` 并 release 到
  真实 route；Chats false→true→false。所有 enabled host focusable 且完整 bindings。
  `scripts/capture.sh` baseline frame与 console clean 见
  `shots/2026-07-30/port/p7-i1/sidebar-controls-interactions/notes.md`。
- gates：Web focused **1 file / 5 tests**；标准 Vitest 未收集独立 browser-config 的
  segmented `.browser.tsx`，不计 browser pass。slice focused **2 files / 14 tests**；
  Web production **8,908 modules**；slice **2193.5kB Lynx / 2309.1kB desktop total**。
- serial audit 严格 write→write→check→check：threads **55.05%**、
  threads-shell **63.33%**、thread **38.26%**、settings **51.19%**、
  projects/kanban **52.15%**、PR **57.08%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。两仓 `git diff --check` green。
- first screenshot connector 与等待中的 DOM connector 互斥而拿不到 session；按 P-112
  丢弃失败 attempt，使用干净实例完成 `capture.sh`，再重启以单 connector 串行完成完整
  state machine。不是产品失败。
- owned 58090/8891/8901 停止且释放；shutdown conservative discovery warning 同时确认
  root exited / no remaining descendants。用户 8903 Lynx Explorer 未触碰。KV/window
  byte-exact 恢复为
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified backup/runtime payload 已移入 Trash。
- P7-I1 保持 **in_progress**；下一刀处理 remaining shared UI primitives/overlay items，
  随后集中复验无系统模态环境的真实 Tab/focus/key。Jump scroll path 保持 P7-I3 open。

### 2026-07-30 — P7-I1 negative：no-modal host Tab/focus bridge

- 按 Computer Use skill 操作 exact
  `synara-lynx/slice/.../Lynxtron.app`：Raise `Synara` window 后无 crash modal/permission
  prompt；真实 Tab 四次均未改变 AX tree，serialized DevTool observer 始终
  `.ui-focus=0`。
- 再用真实 pointer 点击 Lynx content，AX focused element 从 standard window 变为
  `container lynxtron`，证明 host pointer focus 已到目标内容；随后真实 Tab 仍无
  `.ui-focus`、segmented state 不变。因此旧 crash modal 不是单因，Lynxtron 0.0.7 的
  macOS Tab→focusable view publication 是当前平台 gap。
- Enter/Space helper tests 与 enabled DOM bindings 继续作为 wiring 证据，不能升级为
  runtime keyboard pass；pointer/action/disabled 的六刀正向证据不受影响。阴性证据见
  `shots/2026-07-30/port/p7-i1/focus-key-host-negative/notes.md`，compat/P-110 已同步。
- owned 58090/8891/8901 停止且释放，用户 8903 未触碰；KV/window byte-exact 恢复为
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  backup/observer 已移入 Trash。
- 不再无界重复同类 focus probe。P7-I1 继续 remaining shared UI primitives/overlay
  items；host focus/key 作为登记平台 gap进入最终功能表，Jump scroll path仍属 P7-I3。

### 2026-07-30 — P7-I1 heartbeat：Composer overlay item / nested favourite ratchet

- command row、provider row/Back、model group/option 与 favourite 接入 canonical UI-host
  interaction helper；补 selected/expanded/checked accessible state。disabled Cursor /
  Antigravity / Grok / Droid / Kilo 均 unfocusable、零 handlers。
- 新增 nested helper，把 mouse/touch/tap 全 lifecycle 映射为 `catch*`，而不是只拦最终
  tap。production OpenCode popup exact press 证明 star 单独进入 `ui-pressed`、parent
  model row 不变；release 只切 favourite、popup 保持且不选择 model。provider、Back 与
  GPT-5.5 model row 分别完成 pressed→真实 action；console error/warning 为空。
- command row 只计 source/helper tests 与 production integration，不冒充已登记 textarea
  kernel 的 runtime action。原 Codex Terra/high catalog 填满 popup；Desktop DevTool
  drag/scrollIntoView 未发布 native scroll，offscreen 坐标可能误命中可见 trait row，故
  使用可恢复的 OpenCode short-catalog fixture 取证，并把工具限制登记到 P-112，而非误报
  产品 scrolling defect。
- gates：Web focused **2 files / 4 tests**；slice focused **3 files / 13 tests**；
  Web production **8,908 modules**；slice **2198.7kB Lynx / 2314.3kB desktop total**。
  serial audit 严格 write→write→check→check：threads **55.05%**、
  threads-shell **63.33%**、thread **38.26%**、settings **51.19%**、
  projects/kanban **52.15%**、PR **57.08%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。`synara-lynx` 与 `synara` 两仓
  `git diff --check` 均通过。
- isolated fixture 已精确恢复
  `{"provider":"codex","model":"gpt-5.6-terra","options":{"reasoningEffort":"high"}}`；
  owned 58090/8891/8901 停止且释放，用户 PID 2270 / 8903 未触碰。KV/window state
  byte-exact 恢复为
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  runtime driver 已删除，verified backup/debug frames 已移入 Trash。
- P7-I1 保持 **in_progress**。下一刀审计并收敛 shared
  `command` / `collapsible` / `tooltip` primitives；host focus/key 与 Jump scroll 分别
  保持登记 gap / P7-I3 open。

### 2026-07-30 — P7-I1 heartbeat：product-consumed shared Command primitive

- primitive consumption 审计确认：physical-shared `SidebarSearchPalette` 的 Lynx 产品路径
  直接命中 canonical `command.lynx`；generic `collapsible` 当前核心产品调用均被更窄
  Elements adapter 接管，不能用 diagnostics page 冒充进展；tooltip trigger state 与
  overlay open/position/dismiss 分属 P7-I1/P7-I2 边界。
- `CommandItem` 从 tap-only + unsupported `:active` 改为 canonical hover/focus/pressed、
  mouse/touch/key/tap contract；保留 shared `onItemHighlighted` 与 `onMouseDown` 回调，
  disabled item unfocusable/handler-free。新增 ReactLynx component tests 覆盖状态、exact
  key/tap activation 与 disabled exclusion。
- production exact chain：Search press 进入 `ui-pressed`，release 打开真实共享 palette；
  5 个 command rows 完整 binding。Settings press 时 dialog 保持且 row 进入
  `ui-pressed`；release 后 command rows 归零并进入 15 行真实 Settings navigation；
  console error/warning 为空。证据：
  `shots/2026-07-30/port/p7-i1/command-primitive/notes.md`。
- gates：Web focused **1 file / 15 tests**；slice focused **2 files / 7 tests**；
  Web production **8,908 modules**；slice **2200.2kB Lynx / 2315.8kB desktop total**。
  serial audit write→write→check→check：threads **55.05%**、
  threads-shell **63.33%**、thread **38.26%**、settings **51.19%**、
  projects/kanban **52.15%**、PR **57.08%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。
- isolated sequence 保持 **176**，未创建 server mutation。owned 58090/8891/8901 停止
  且释放，用户 PID 2270 / 8903 未触碰。KV/window state byte-exact 恢复为
  `300eb49e87ddbcbd57929e2013ac190528ba2748632cfdcfbc2aa2a1e20bb0be` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  runtime driver 删除、verified backup 移入 Trash。
- P7-I1 保持 **in_progress**。下一刀先审计真实 product-consumed tooltip triggers，明确
  哪些只需 P7-I1 trigger state、哪些必须连同 P7-I2 popup semantics 一起做；不修改无核心
  consumer 的 generic collapsible。

### 2026-07-30 — P7-I1 heartbeat：PR Summary disclosure + primitive-consumption negative

- production consumption audit 证明 generic native Tooltip 当前无六核心产品 consumer；
  `LxTooltip*` bundle strings 来自 shared CSS，唯一直接本地 consumer 是 unrouted
  `PrimitivesPage`。generic Collapsible 的核心调用也已被更窄 Elements adapters 接管，
  两者均不靠诊断页冒充 P7-I1 进展。
- real product `PullRequestSummaryComposition` 的 Description/Checks/Comments header 接入
  canonical interaction helper；补 hover/focus/pressed、Enter/Space/tap 单 action path、
  `focusable`、accessible expanded/collapsed label 与 `aria-expanded`。
- isolated real `Emanuele-web04/synara` Open query 返回 50 entries；PR #478 的三个 header
  均具完整 11-handler contract。可见 Description press 命中自身 node 并进入
  `ui-pressed`，release 后 `aria-expanded=false` / `Description, collapsed`，再 click
  恢复 expanded；console error/warning 为空。Checks 在 nested scroll viewport 下方，
  `DOM.scrollIntoViewIfNeeded` 未滚动，按 P-112 改用同 composition 的可见 Description，
  未把屏外工具限制误报为产品失败。
- focused gates：Web **1 file / 2 tests**；slice canonical helper **1 file / 5 tests**。
  新增 component harness 连续三次在收集 assertion 前因 generated vendor
  `Invalid left-hand side in assignment` 失败（含 narrowed mocks），不可运行测试已删除并
  登记为 harness negative。Web production workload **8,908 modules**；slice
  **2201.0kB Lynx / 2316.6kB desktop total**。
- serial audit 严格 write→write→check→check 通过：threads **55.05%**、
  threads-shell **63.33%**、thread **38.26%**、settings **51.19%**、
  projects/kanban **52.15%**、PR **57.08%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。`synara-lynx` 与 `synara` 两仓
  `git diff --check` 均通过。
- runtime 临时 project 通过真实 `project.delete` 清理；isolated sequence
  **176→178** 且目标 workspace root 不再存在。owned 58090/8891/8901 停止释放，用户
  PID 2270 / 8903 未触碰；KV/window state byte-exact 恢复为
  `ca3d163bab055381827226140568f3bef7eaac187cebd76878e0b63e9e442356` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  runtime/RPC drivers 删除，verified backup 移入 Trash。证据：
  `shots/2026-07-30/port/p7-i1/pr-summary-disclosure/notes.md`。
- P7-I1 保持 **in_progress**。下一刀继续审计真实产品 tap-only controls，优先 Composer
  reference attachments；host Tab gap 与 Jump scroll 分别保持登记 gap / P7-I3 open。

### 2026-07-30 — P7-I1 heartbeat：Composer reference attachment actions

- physical-shared `ComposerReferenceAttachmentsComposition` 保持 category
  visibility/order owner；native 真实 product capability 仍只有 pasted text。Show in text
  field 与 nested remove 接入 canonical interaction helper，补 hover/focus/pressed、
  Enter/Space/tap、accessible label；remove 用 `catch*` containment 全 pointer lifecycle。
- component test 证明 pasted show/remove 的状态与 exact key/tap activation，并证明 dormant
  image nested remove 不会冒泡触发 preview；native images 仍传空数组，因此该支不冒充
  product runtime progress。
- isolated sequence **178** 的真实 `Reply MODEL-READY` thread 中，25-line pasted card
  完整发布 11-handler show contract 与 nested catch contract。show press 进入
  `ui-pressed`，release 后 card 消失且 textarea 得到完整 25 行；clean fixture restart 后
  remove 让 card 消失且 textarea 保持空。console error/warning 为空。证据：
  `shots/2026-07-30/port/p7-i1/composer-reference-attachments/notes.md`。
- Computer Use 文字注入按逐字符 input 发布，正确地不满足 atomic large-paste transition；
  改用临时 first-render `PastedTextDraft` fixture。fixture 已删除，source marker 搜索为空并
  重建 final production bundle。
- gates：Web focused **1 file / 2 tests**；slice focused **1 file / 2 tests**；Web
  production **8,908 modules**；final slice **2203.4kB Lynx / 2318.9kB desktop total**。
  serial audit 严格 write→write→check→check：threads **55.05%**、
  threads-shell **63.33%**、thread **38.26%**、settings **51.19%**、
  projects/kanban **52.15%**、PR **57.08%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。
- owned 58090/8891/8902 停止释放；unrelated PID 84293/8901 与 Lynx Explorer
  PID 2270/8903 未触碰。KV/window state byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified backup/diagnostic DOM 已移入 Trash。server shutdown 的既有 conservative
  Codex discovery warning 同时确认 root exited / no remaining descendants。
- P7-I1 保持 **in_progress**。下一刀继续 inventory 中仍由 direct `bindtap` 消费的真实
  product controls；host Tab gap 与 Jump scroll 分别保持登记 gap / P7-I3 open。

### 2026-07-30 — P7-I1 completed：Theme Pack switch + direct-tap closure

- physical-shared `ThemePackEditorComposition` 的 Light/Dark “Translucent sidebar”
  host 从 tap-only 接入 canonical helper，补 hover/focus/pressed、Enter/Space/tap、
  distinct accessible label 与 `aria-checked`；shared composition 继续拥有 slot order、
  wording 与 `opaqueWindows` inversion。
- production Appearance 实机中两 switch 均具完整 11-handler contract。可见 Light press
  进入 `ui-pressed` 且 checked 保持 true；release 后 `aria-checked=false`，只写 Light
  slot 的 `opaqueWindows=true`。console error/warning 为空。证据：
  `shots/2026-07-30/port/p7-i1/theme-pack-switch/notes.md`。
- P7-I1 closure scan：production source direct bind/catch tap 仅剩 5 处。TypeScript AST
  审计 Web 全部 **35** 个 `SettingsRow` callsite，row-level `onClick` 为 **0**；
  `FidelityReferencePage` / `PortsPage` 为 unrouted diagnostics；generic Tooltip /
  Collapsible 仅有 unrouted `PrimitivesPage` consumer。没有再用诊断页或 dormant branch
  冒充 product progress。
- gates：Web focused **1 file / 2 tests**；slice focused **1 file / 1 test**；Web
  production **8,908 modules**；slice **2203.9kB Lynx / 2319.5kB desktop total**。
  serial audit 严格 write→write→check→check：threads **55.05%**、
  threads-shell **63.33%**、thread **38.26%**、settings **51.19%**、
  projects/kanban **52.15%**、PR **57.08%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。
- owned 8902 停止释放；unrelated PID 84293/8901 与 Lynx Explorer PID 2270/8903
  未触碰。KV/window state byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified backup/diagnostic DOM 已移入 Trash。
- P7-I1 标为 **completed**。Lynxtron 0.0.7 macOS host Tab 不发布 `.ui-focus` 继续作为
  P-110 平台 gap，不冒充 runtime keyboard pass；Jump detach/reattach 按既定边界留给
  P7-I3。下一任务进入 **P7-I2 overlays/context actions**，先建真实 product-consumed
  Dialog/Menu/Popover/context-action inventory。

### 2026-07-30 — P7-I2 heartbeat：Composer Menu screen-anchor kernel

- 建立六核心屏真实 overlay/context-action inventory；diagnostics-only generic Tooltip、
  native 未消费的 Web context/mutation menus 不计进展。首刀选择 physical-shared
  `ComposerExtrasMenuComposition` 与 `ComposerRuntimeModeControlComposition` 真实消费的
  canonical native Menu。
- 官方 `@lynx-js/lynx-ui` Popover 尝试虽通过 focused tests 与双 production build，但
  Lynxtron 0.0.7 PC host 不推进 Presence 的 `delayFrames` /
  `lynx.requestAnimationFrame`，popup 留在 `visibility:hidden` 且 console 无错；该实现
  已移除，阴性结论进入 02/P-116。
- retained local kernel 使用 fixed viewport layer（z60）+ full transparent backdrop，
  trigger 用官方 `getRectByRef(ref, true)` 获取 screen rect；支持 side/align、viewport
  clamp、hidden-until-measured、outside/item/Escape dismiss、ARIA 与 canonical
  item/disabled interaction。native submenu 明确保持 inline fallback，不冒充独立 flyout。
- 真实 `Reply MODEL-READY` Composer：Extras trigger/popup 左边缘同为 `407`，popup
  bottom `737` 对 trigger top `741`；Runtime trigger/popup 左边缘同为 `439`，同样
  `4px` top gap。backdrop 为 `(0,0)–(1280,788)`；outside 后 popup `1→0` 且
  `aria-expanded=false`，current Runtime item selection 同样 `1→0`。disabled Add image
  为 unfocusable/handler-free；console error/warning 为空。证据：
  `shots/2026-07-30/port/p7-i2/composer-menu-overlay/notes.md`。
- gates：Web focused **2 files / 4 tests**，Web production **8,908 modules**；slice
  focused **1 file / 2 tests**；final slice **2210.1kB Lynx / 2325.7kB desktop total**。
  serial audit 严格 write→write→check→check：threads **55.05%**、
  threads-shell **63.33%**、thread **38.26%**、settings **51.19%**、
  projects/kanban **52.15%**、PR **57.08%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。两仓 `git diff --check` 通过。
- owned 58090/8891/8904 已停止释放；unrelated 8901/8902 与 Lynx Explorer 8903
  未触碰。KV/window state byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified backup 与 discarded frames 移入 Trash。server shutdown 重复既有
  conservative Codex discovery warning，但报告 root exited / no remaining descendants。
- P7-I2 保持 **in_progress**。下一刀从 inventory 继续：先闭环 routed Search Palette
  Dialog 的 backdrop/Escape/z-order/loading-empty，再验证 Settings/PR 的 inherited
  Menu runtime；model popup 与 context actions 分开取证。

### 2026-07-30 — P7-I2 heartbeat：routed Search Palette Dialog

- physical-shared `SidebarSearchPalette` 真实消费 canonical `CommandDialog`。native Dialog
  wrapper 统一 controlled/uncontrolled state，Backdrop/Close/Escape 汇入
  `onOpenChange(false)`；content 发布 `role=dialog`、`aria-modal=true` 与 bubbling
  Escape handler。Dialog z50 / Menu z60 顺序保持。
- sequence 178 真实 Search popup 位于 `(430,204)–(850,584)`，backdrop 完整覆盖
  `(0,0)–(1280,788)`；5 rows 为 New chat/New thread/Settings 与两个真实 thread。
  outside activation 后 popup `1→0`；重开后真实 Settings row action 同样 `1→0` 并进入
  `.SettingsPage`。console error/warning 为空。host physical Escape 仍按 P-110，不冒充
  runtime key pass。证据：`shots/2026-07-30/port/p7-i2/search-dialog/notes.md`。
- gates：Web focused **1 file / 15 tests**，Web production **8,908 modules**；slice
  Dialog+Command focused **2 files / 5 tests**；slice **2210.8kB Lynx /
  2326.4kB desktop total**。首个 Web 命令从 monorepo root 被 Turbo 正确拒绝为 unknown
  task，未运行测试；随即从 `apps/web` 用规定命令重跑通过。
- serial audit write→write→check→check：threads **55.05%**、
  threads-shell **63.33%**、thread **38.26%**、settings **51.19%**、
  projects/kanban **52.15%**、PR **57.08%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。
- owned 58090/8891/8904 已停止释放；unrelated 8901/8902/8903 未触碰。KV/window
  state byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified backup 移入 Trash。
- P7-I2 保持 **in_progress**。Search Dialog base contract 已闭环；native no-result text
  entry 受既有 PC text kernel gap 限制，保留 shared `CommandEmpty` 与 15-test source
  coverage但不冒充 runtime frame。下一刀验证 Settings General/Appearance 与 PR filter
  对 canonical Menu kernel 的真实继承，再单独处理 Composer model popup/context actions。

### 2026-07-30 — P7-I2 heartbeat：Settings/PR inherited Menu consumers

- routed Settings General 发布 4 个真实 Menu triggers。provider trigger
  `(916,163)–(1060,195)`，popup `(840,199)–(1060,501)`：exact end align +
  `4px` bottom gap；real provider rows/checked Codex 正常，outside dismiss 不改 selection。
- routed PR project filter trigger `(1160,99)–(1256,131)`，popup
  `(1000,135)–(1256,251)`：exact end align + `4px` gap，窗口右缘不溢出。rows 来自
  sequence 178 的 `All projects` 与真实 project；选择当前项 popup `1→0` 且不产生
  mutation。console error/warning 为空。证据：
  `shots/2026-07-30/port/p7-i2/settings-pr-menu/notes.md`。
- 该刀没有新增 page-local overlay；Settings Appearance/Theme Pack 与 PR 都物理消费同一
  canonical Menu。长列表 scroll/density/theme 留在 P7-I3/P7-I4，不重复造 kernel。
- gates：Web focused **3 files / 6 tests**；slice Menu **1 file / 2 tests**；Web
  production **8,908 modules**；slice **2210.8kB Lynx / 2326.4kB desktop total**。
  strict audit write→write→check→check 保持 threads **55.05%**、shell **63.33%**、
  thread **38.26%**、settings **51.19%**、projects/kanban **52.15%**、
  PR **57.08%**、style **98.06%**。
- owned 58090/8891/8904 停止释放；unrelated 8901/8902/8903 未触碰。KV/window state
  byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified backup 移入 Trash。
- P7-I2 保持 **in_progress**。canonical Menu 的真实 routed consumers 已闭环；下一刀转
  Composer model popup（独立 kernel）的 anchor/dismiss/z-order/loading/disabled，再审计
  native context actions 的真实 product boundary。

### 2026-07-30 — P7-I2 heartbeat：Composer model popup convergence

- `ComposerModelControl` 删除 page-local absolute popup positioning，保留
  provider→model panel state并接入 canonical Menu fixed layer。physical-shared
  model trigger、trait section 与 grouped model options 继续拥有真实 anatomy/order；
  popup-level bubbling Escape 让 custom descendants 也汇入同一 close authority。
- 新增 `providers | loading | models` 纯投影；provider navigation pending 时显示六行
  `role=status` skeleton，不再把 static fallback model rows 冒充 settled discovery。
  disabled providers 继续由 shared availability controller 决定并保持 handler-free。
- sequence 178 `Reply MODEL-READY` 实机：trigger
  `(943,741)–(1093,769)`，popup `(833,425)–(1093,735)`，exact end align +
  `6px` top gap；backdrop `(0,0)–(1280,788)`。outside 与 current `High`
  selection 均令 popup `1→0`；Cursor 等 unavailable rows
  `focusable=false` / `aria-disabled=true` / handler-free。server sequence 保持 178，
  console error/warning 为空。证据：
  `shots/2026-07-30/port/p7-i2/composer-model-popup/notes.md`。
- direct component harness 在 assertion collection 前命中既有
  `Cannot find module '@lynx-js/react/jsx-runtime'` loader gap，已删除且不计 green；
  retained gates 为 Web **3 files / 22 tests**、slice Menu+overlay state+catalog
  **3 files / 9 tests**、Web production **8,908 modules**、slice
  **2212.5kB Lynx / 2328.0kB desktop total**。
- strict audit write→write→check→check：threads **55.05%**、shell **63.33%**、
  thread **38.26%**、settings **51.19%**、projects/kanban **52.15%**、
  PR **57.08%**、style **98.06%**。owned 58090/8891/8902 停止释放；
  unrelated 8901 与 Lynx Explorer 8903 未触碰。KV/window state byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified backup/discarded setup frames 移入 Trash。server shutdown 重复既有
  conservative discovery warning，同时确认 root exited / no remaining descendants。
- P7-I2 保持 **in_progress**。下一刀只审计 native context actions 的真实 product
  boundary；generic Tooltip/Popover 无 routed core consumer，native Search no-result
  text entry保持既有 platform gap，不制造 cosmetic overlay。

### 2026-07-30 — P7-I2 completed：real Native Sidebar context actions

- 最终能力审计纠正了“host 无 context-menu capability”的初步判断：
  Lynx PC `bindmousedown` 发布 secondary button，Lynxtron 0.0.7 也有
  `Menu.buildFromTemplate(...).popup(...)`。新增 native context-menu bridge，并把 Web
  Sidebar 的 action order/copy 抽为 physical-shared
  `ThreadContextMenuItems.logic`，Web 原调用方和 Native Sidebar 同时真实消费。
- Native 只发布 capability-backed actions：Pin/Unpin 走 `thread.meta.update`，
  Copy Path/ID 走 clipboard，Archive/Delete 走 orchestration command + native confirm。
  running thread 不给 Archive/Delete；Rename/Mark unread/Handoff/Terminal 因缺完整
  controller/text/runtime authority 不渲染。Kanban 继续一期 read-only，不因底层菜单可用
  扩张 mutation scope。
- Computer Use 对 repo-owned Synara 窗口执行真实 macOS secondary click，AX menu 精确为
  `Pin thread / Copy Path / Copy Thread ID / Archive / Delete`；Escape 无命令关闭。
  隔离 snapshot 执行 Pin→Unpin，菜单文案 `Pin→Unpin→Pin`、row
  project→Pinned→project，server sequence **178→179→180**，最终语义恢复。
- 首轮实机发现 Lynx mouse `x/y` 是 row-local：host 收到错误 `(58,11)`。改为
  `getRectByRef(rowRef, true) + local offset` 后复验 host 收到 `(86,337)`，与真实 thread
  row pointer 匹配。console `error,warning` 为空。证据：
  `shots/2026-07-30/port/p7-i2/sidebar-context-actions/notes.md`。
- gates：Web focused **1 file / 2 tests**；slice focused **2 files / 4 tests**；Web
  production **8,909 modules**；slice final **2218.3kB Lynx / 2335.1kB desktop total**。
  首次 Web test 从 monorepo root 被 Turbo 拒绝为 missing task，随后从 `apps/web` 按规定
  命令通过；首次 slice tests 误用 Vitest import、在 assertion collection 前失败，改为
  repo 标准 `@rstest/core` 后 4/4 通过，两次均不计 green。
- strict audit exact write→write→check→check：threads **55.10%**、
  threads-shell **63.38%**、thread **38.29%**、settings **51.24%**、
  projects/kanban **52.20%**、PR **57.12%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。
- owned 58090/8891/8902 全部停止释放；unrelated Lynx 8901 与 Lynx Explorer 8903
  未触碰。Pin fixture 已反向恢复，KV/window byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
- **P7-I2 completed**。Search no-result text entry保留既有 text-kernel gap；
  generic Tooltip/Popover 无 routed consumer；下一任务进入 **P7-I3
  scroll + resize**，先建 transcript/sidebar/kanban 的真实容器与状态 inventory。

### 2026-07-30 — P7-I3 heartbeat：canonical density + real transcript scroll

- 建立 `p7-i3-scroll-resize-density-inventory.md`，逐一登记 transcript/sidebar/Kanban
  overview/project、window resize 与 density 的 Web authority、Native owner 和待验证
  边界；P7-I3 保持 **in_progress**。
- Native `App` 从 canonical app-settings projection hydrate `uiDensity`，以
  `SliceRoot--density-*` 驱动 root；Settings Appearance change 与 Restore defaults
  同步回 root。新增 `appDensity.logic` 直接复用 Web taxonomy/normalization。
- 实机先暴露两处 host 单位缺陷：custom property 内 `lh` 令 composer 膨胀到约 160px；
  直接复制 Web `rem` 又因 Lynx `1rem=14px` 令 row 偏小。最终仅在 Native adapter
  把 canonical 16px contract 换算为等值 px；同一 primary row compact **23.8px**、
  comfortable **28px**。
- real UI 完成 comfortable→compact live switch；owned Lynx process restart 后首帧仍为
  compact；随后 real UI 恢复 comfortable。console error/warning 为空。证据：
  `shots/2026-07-30/port/p7-i3/density/notes.md`。
- routed `Reply MODEL-READY` 以 Computer Use 发出真实 macOS wheel up，transcript
  detach 并出现 `Jump to latest ↓`；真实 click 后回到底部且 Jump 消失。由此关闭
  P7-I1 中 synthetic touch / fulfilled `scrollToPosition` 不足以证明 user source 的
  gap。证据：`shots/2026-07-30/port/p7-i3/transcript-scroll/notes.md`。
- gates：Web focused **1 file / 3 tests**；slice focused **2 files / 7 tests**；
  Web production **8,909 modules**；slice **2223.2kB Lynx / 2340.1kB desktop**。
  strict audit exact write→write→check→check：threads **55.10%**、
  threads-shell **63.38%**、thread **38.29%**、settings **51.24%**、
  projects/kanban **52.20%**、PR **57.12%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。两仓 `git diff --check` 通过。
- owned 58090/8891/8902 已停止释放；unrelated Lynxtron 8901 与 Lynx Explorer 8903
  未触碰。KV/window byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified backup 与 pre-fix frames 移入 Trash。server shutdown 重复既有
  conservative Codex discovery warning，但 root exited 且 remaining descendants 为空。
- 下一刀：准备真实 overflow snapshot，依次验证 Sidebar titlebar-fixed vertical scroll、
  Kanban overview horizontal + nested vertical scroll、project 三列独立 vertical scroll，
  再完成 1280×820 / 1440×900 shell containment paired evidence。

### 2026-07-31 — P7-I3 completed：overflow ownership + dual-size containment

- 先克隆 `.synara-pr84` 做只读诊断，但其旧数据包含重复 workspace-root chat container，
  current normalization 刷新为 offline；该 clone 判定为不兼容 fixture，而非产品失败，
  与诊断帧一起移入
  `~/.Trash/synara-p7i3-overflow-pr84-rejected-20260730-2342`。
- 随后克隆已知正常 `.synara-sxs` snapshot，并仅在临时 clone 内通过正式 workspace RPC
  创建 **5 projects × 16 threads**；最终 Kanban 有 **82** 个真实 projected tasks
  （80 fixture + 2 baseline），未把静态假 rows 接进产品。
- Sidebar：展开 Project 01 到 16 rows 后，以真实 pointer drag 移动
  `.AppSidebarScroll`，Project 04/05 与 Chats 进入视口；native titlebar 与 Settings footer
  保持固定。证据：
  `shots/2026-07-30/port/p7-i3/overflow/sidebar-before-top.png` /
  `sidebar-after-real-drag.png`。
- Kanban overview：真实 horizontal drag 将 Project 01/02/partial 03 移为
  Project 02/03/04，shell/sidebar 不动；真实 wheel 只让 Project 01 从 `16…07`
  移到 `10…01`，Project 02、outer strip 与 Sidebar 保持不动。证据：
  `kanban-overview-horizontal-{before,after}.png` 与
  `kanban-column-vertical-{before,after}.png`。
- Kanban project：Draft/In Progress/Done 三列同时可见；真实 Draft drag 只将该列
  `16…07` 移到 `10…01`，header 与 sibling columns 固定。证据：
  `kanban-project-draft-{before,after}.png`。
- resize：exact window state **1280×820** 与 **1440×900** 分别得到 DevTool root
  **1280×788** / **1440×868**，余下 32px 为 native titlebar；1440 下
  `AppSidebarTitlebar` border 为 255px。两尺寸 project 三列均完整，没有 shell
  displacement 或 page-level overflow。证据：
  `kanban-project-1280x820.png`、`kanban-overview-1440x900.png`、
  `kanban-project-1440x900.png`。全部 retained capture 的 console error/warning 为空。
- final gates：Web focused **3 files / 9 tests**；slice focused
  **2 files / 16 tests**；Web production **8,909 modules**；slice
  **2223.2kB Lynx / 2340.1kB desktop**。strict audit exact
  write→write→check→check：threads **55.10%**、threads-shell **63.38%**、
  thread **38.29%**、settings **51.24%**、projects/Kanban **52.20%**、
  PR **57.12%**；style **98.06%**（2,253 classes / 13,185 weighted）。
  两仓 `git diff --check` 通过。
- owned 58090/8891/8902 全部停止释放；unrelated Lynxtron 8901 与 Lynx Explorer 8903
  未触碰。产品 KV/window byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`。
  verified fixture clone 移入
  `~/.Trash/synara-p7i3-overflow-sxs-verified-20260731-0050`。
- 新增 P-121：nested scroll/resize 以“单 owner 改变、siblings/shell 固定”的差分证据
  放行；记录 native titlebar 尺寸，并把 incompatible old snapshot 与产品 failure 分离。
- **P7-I3 completed**。下一任务进入 **P7-I4 themes + motion**：先建立六屏
  light/dark semantic token、selected/elevated/focus 与 motion consumer inventory，
  再选最小真实 product cut。

### 2026-07-31 — P7-I4 start：theme / motion authority inventory

- 按项目 `.impeccable.md` 保持 calm / precise / utilitarian 的既有设计方向；P7-I4 是迁移
  等价，不引入新视觉 identity。性能约束明确为 dual-thread Lynx、长 transcript、nested
  scroll 与 streaming pinning；motion 只用于状态反馈，优先 transform/opacity，不接入
  transcript measure/follow 回路。
- 建立 `p7-i4-theme-motion-inventory.md`，覆盖 shell/Sidebar、thread/transcript/composer、
  Settings、Kanban、PR、overlays 与 motion authority。
- 权威发现：Web 已由 `ThemeState`→`resolveThemeVariant`→`resolveThemePack`→
  `buildThemeCssVariables` 统一派生 semantic tokens；Native 虽已能持久编辑同一
  `synara:theme`，但 `App` 只 hydrate density，`useTheme.lynx` 固定返回 light，
  `tokens.css` 的 dark `@variant` 在 Lynx inert，`lynx-overrides.css` 又只 restate
  concrete light。因此 Settings 的 `SettingsPage--theme-dark` 只是 page-local patch，
  不能外推为六屏 dark support。
- motion 发现：Web `platform/motion` 已统一 220ms disclosure + reduced-motion；
  Native Sidebar project/Chats 与 collapsed-work adapters 仍在 closed 时立即 unmount。
  generated CSS 中存在 transition utilities 只证明编译资产，不证明 product motion。
- **P7-I4 in_progress**。下一刀先让 root hydrate/live-consume canonical ThemeState，
  再用 canonical derivation 建 stable light/dark root semantic classes；Settings local
  selectors 只允许保留为明确 host patch，不能继续做 theme authority。

### 2026-07-31 — P7-I4 completed：root theme + SVG contrast + disclosure motion

- canonical ThemeState 现在由 Native `App` 在产品 root hydrate，发布稳定
  `SliceRoot--theme-{light,dark}`；Settings/theme-pack change 即时向 root 传播，restart
  恢复同一持久 variant。`useTheme.lynx` 不再固定返回 light，而是暴露 active
  variant/pack 与 SVG semantic colors。
- light/dark semantic sheets 由 canonical Web `theme.logic` 生成；Settings 旧 page-local
  dark authority 已删除/收窄为 host layout fixes。曾尝试在 runtime 直接拉入
  `buildThemeCssVariables`，bundle 从 2241.8kB 涨到 2279.9kB，判定为 side-effect graph
  信号并撤回；最终使用 normalized canonical pack ink，bundle 为 2245.5kB。
- 实机暴露 Lynx `<svg content>` 不继承 host `currentColor`：dark shell 中 Synara/provider/
  Tabler 图标呈黑。新增 `themedSvg.lynx`，更新 Synara/provider/thread identity adapters
  与 icon generator，把 active canonical ink/muted ink 显式注入 SVG；final dark thread
  图标全部可读。
- 新增 exact-aliased Native `platform/motion`：共享 Web 220ms disclosure timing +
  40ms cleanup，使用 transform/opacity 与 chevron rotation；Sidebar project/Chats 和
  collapsed-work 迁移到同一 contract。真实 Sidebar close 在 **4.93ms** 进入 closed，
  **100ms** body 仍 present，**320ms** absent。Transcript 明确
  `preserveOnClose:false`，避免 exit row 进入 `<list>` measure/follow/streaming 回路。
- 真实 isolated snapshot 证据覆盖 thread、Settings、Kanban、PR、All projects overlay
  的 light/dark；Appearance real click 完成 Dark→Light live switch，KV 为 light 且
  DOM 搜索命中 `SliceRoot--theme-light`；另有 dark restart。retained console
  error/warning 为空。证据：
  `shots/2026-07-31/port/p7-i4/root-theme/notes.md`。
- gates：Web focused **2 files / 27 tests**；slice focused **4 files / 11 tests**；
  Web production **8,909 modules**；slice **2245.5kB Lynx / 2362.4kB desktop**。
  strict audit exact write→write→check→check：threads **55.10%**、threads-shell
  **63.38%**、thread **38.29%**、settings **51.24%**、projects/Kanban **52.20%**、
  PR **57.12%**；style **98.06%**（2,253 classes / 13,185 weighted）。两仓
  `git diff --check` 通过。
- own Lynx/server/Web 停止，`8901/58090/8891` 释放。KV/window byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified snapshot clone、backup 与 staging frames 移入 Trash。shutdown 重复已登记的
  conservative Codex discovery warning，但 root exited、无 captured descendants、
  owned ports 均 free。
- 新增 P-122；02 更新 root theme/SVG/currentColor、reduced-motion signal 与 grid-row
  motion downgrade。**P7-I4 completed**；下一任务进入 **P7-I5 system states +
  accessibility**，先建立 loading/empty/error/offline/streaming 与 accessible
  name/keyboard/contrast 的真实六屏 inventory，再选择最小 product cut。

### 2026-07-31 — P7-I5 start：system state + accessibility audit

- 按 `audit` + `frontend-design` 对六屏 product state 做 source-first inventory；当前视觉
  已通过 anti-pattern gate，剩余问题集中在原生 AT semantics、状态公告、failure
  containment 与 contrast，不回退做新 identity/polish。
- 权威 critical finding：official Lynx `<view>` 默认不是 accessibility element，需要
  显式 `accessibility-element`、`accessibility-trait` 与 label。production source scan：
  **0 accessibility-element / 0 accessibility-trait / 9 accessibility-label /
  45 aria-label**；统一 `useLynxInteractiveState` 有 **29** 个 product consumer 文件。
  因此 P7-I1 的 ARIA/keyboard DOM wiring 是良好基础，但不能外推为 Native screen-reader
  pass。
- system-state matrix：Sidebar 已共享 ready/loading/error/empty 并保留已有 rows；thread
  已有纯 resolver 的 loading/offline/error/empty/transcript 与真实 streaming；PR 已有
  list/detail loading/error/empty/refresh/pin error。主要 gap 是这些动态变化没有 bounded
  AT announcement。Settings initial rejection 会永久停在 Loading，save failure console-only；
  Kanban 把所有 error 叫 server unavailable，unknown project 静默画三空列且无 retry；
  Native PR detail 请求 4 skeleton 但 adapter 固定画 7。
- contrast 计算：canonical light/dark foreground 与 muted 均过 4.5:1；tertiary 为
  **2.66/2.92**，light success **3.36**、light warning **3.19**、dark destructive
  **4.16**；muted 再叠 `opacity:.7` 后约 **2.85/3.73**。后续按 informative/disabled/
  decorative role 修复，不全局改 palette。
- inventory：
  `plan/reports/p7-i5-system-accessibility-inventory.md`。**P7-I5 in_progress**；
  下一刀先扩 central Native interaction semantic model，并以 Sidebar/Settings/Kanban/PR/
  Composer representative consumers + source tests + host accessibility tree 证明，不用
  DevTool outer HTML 代替。

### 2026-07-31 — P7-I5 cut 1：named Native interaction semantics

- `useLynxInteractiveState` 新增 typed
  `accessibility-element` / installed `accessibility-traits` / label / value
  projection，并由 adapter facade 正式导出。初版曾对全部 `onActivate` 节点默认
  `element=true`，实机立刻发现 icon-only consumers 会成为无名 button，因此收紧为只有
  non-empty product label 或 explicit opt-in 才进入 tree；具名 disabled control 仍保留
  node/trait、但 unfocusable/handler-free。
- physical-shared copy 已接入 Sidebar primary actions、Settings navigation、Kanban card、
  PR row/pin、Composer primary action；direct Sidebar thread/project row 与 Settings Back
  使用既有真实 label/value。labeled Native UI Button 同样发布 element/label/trait。
- runtime 使用 isolated sequence-180 real snapshot：thread route 的 10 个 accessibility
  element 全部具名；Settings 15 个导航项全部具名，General=`Current section`，Profile/
  Advanced named+disabled+unfocusable；Kanban 两张真实卡为
  `Reply MODEL-READY, Done` / `READY-LYNX-COMPOSER, Draft`。snapshot 无 PR rows，
  因此只保留 shared render test + 两端 compiler 证据，不造假 row。DevTool
  error/warning 为空。
- host AX 阴性结论：macOS System Events 可只读访问本轮 `lynxtron`，但 content 只是
  `AXGroup` 且 child count **0**。说明 Lynxtron 0.0.7 未把已验证的 Lynx attributes
  投影进 macOS accessibility tree；这是 host gap，不冒充 screen-reader pass，也未点击
  权限对话框。新增 P-123 与 02 compatibility row。
- tests/build：Web focused **5 files / 9 tests**；slice focused **1 file / 7 tests**；
  Web production **8,909 modules**；slice **2247.4kB Lynx / 2364.2kB desktop**。
  strict audit exact write→write→check→check：threads **55.10%**、threads-shell
  **63.38%**、thread **38.29%**、settings **51.24%**、projects/Kanban **52.20%**、
  PR **57.12%**；style **98.06%**（2,253 classes / 13,185 weighted）。
- cleanup：own Lynx/server/Web 已停止，`58090/8891` 释放；后来出现的 unrelated
  `8902` client 未触碰。KV/window byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  verified clone/backup 移入 Trash。shutdown 重复 conservative Codex discovery
  warning，但 root exited、无 captured descendants。
- 证据：`shots/2026-07-31/port/p7-i5/accessibility/notes.md`。**P7-I5 继续
  in_progress**；下一刀读取 `harden` skill 后，从
  `PanelStateMessage` / Sidebar / PR state elements 建 `status | alert | empty`
  physical-shared contract 与 bounded Native announcement，不进入 transcript
  per-token loop。

### 2026-07-31 — P7-I5 cut 2：shared state semantics + bounded announcement

- 按 `harden` 建 physical-shared `plain | status | alert | empty` contract：
  `PanelStateMessage`、Sidebar projects/chats 与 PR list/detail 同一语义源。Web 映射
  atomic polite `status` / assertive `alert`；Native 发布一个具名 state node，并用
  consecutive intent+content key 去重调用 optional `lynx.accessibilityAnnounce`。
  plain/blank fail closed，transcript rows 不消费 hook，因此不会进入 per-token loop。
- Thread loading 映射 status、offline/error 映射 alert；PR online empty/error 和 detail
  loading/error 显式区分。Native PR skeleton 不再固定 7 rows，真实消费 shared
  `rowCount`，detail 为 4 rows + 独立 loading label。新增 Sidebar shared state render
  tests 与 Slice pure announcement policy tests。
- runtime 首轮正确暴露旧 `dist/desktop/main.lynx.bundle`：`rspeedy build` 只更新
  `output/bundle`，所以 PR empty 节点缺新属性。未把阴性结果冒充失败或通过；改用正式
  `npm run build` 完成 Lynx + desktop staging 后重跑。sequence-180 PR 在线空态发布
  `No pull requests found...` label，停掉仅本轮 server、Kanban→PR 后发布
  `Pull requests unavailable...` alert label；均为 element=true/trait=text，
  DevTool error/warning 为空。
- 当前 Lynxtron 仍无 AX children/可观察语音通道，因此 policy + compiler + real state
  node 证明 app announcement contract，不声称 audible Desktop screen-reader pass。
  新增 P-124 与 02 dynamic status row。
- gates：Web focused **3 files / 8 tests**；slice focused **1 file / 3 tests**；
  Web production **8,910 modules**；slice formal production **2251.6kB Lynx /
  2368.4kB desktop total**。strict audit exact write→write→check→check：threads
  **55.11%**、threads-shell **63.38%**、thread **38.31%**、settings **51.25%**、
  projects/Kanban **52.21%**、PR **57.15%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。
- cleanup：owned Lynx/server/Web 停止，58090/8891/8901 释放；unrelated PID 10643 /
  8902 未触碰。KV/window byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  clone/backup 移入 Trash。证据：
  `shots/2026-07-31/port/p7-i5/system-states/notes.md`。
- **P7-I5 继续 in_progress**；下一刀处理 Settings hydration/save failure、
  Kanban offline/error/not-found + retry、composer discrete lifecycle announcement
  与 informative state text contrast。

### 2026-07-31 — P7-I5 cut 3：Settings + Kanban resilience

- Settings 新增 explicit hydration `loading/ready/error` 与 save
  `loaded/saving/saved/error` authority：initial rejection 显示 named alert + Retry，
  不画假默认 controls；critical save 使用 serialized awaited write-through，operation
  sequence 拒绝 stale completion，local/server failure 均保留当前 in-memory values。
  host storage 除 ENOENT 外不再把 malformed JSON/read/write failure 吞成 `{}` 或 success。
- production runtime 以逐字备份后的 malformed KV 验证
  `Preferences could not be loaded` + `Retry loading preferences`；恢复合法 KV 后 Retry
  进入 `Preferences loaded`。临时令 owned data dir 不可写，真实保存失败显示
  `Changes could not be saved. Your current values are still shown.`，UI 值未回滚；权限立即
  恢复。Settings reset/switch/select 与 status footer 同时补齐 bounded name/value 和 11px
  full-opacity informative role。
- physical-shared `KanbanStateComposition` + pure route resolver 区分
  loading/offline/error/not-found/stale，refresh failure 保留 last-known-good board，成功
  missing entity 才进入 not-found，所有 failure path 均有 Retry。实机首轮发现新 Elements
  path 漏 exact alias，生产实际渲染 Web host tags；补
  `~/components/kanban/KanbanStateCompositionElements$` 后 formal rebuild，真实 offline
  route 发布 `SharedKanbanState`、完整 native alert label/trait 与 named Retry。点击 Retry
  在 owned hanging transport 下进入 `Loading Kanban projects`/updating，停止 listener 后
  回到 offline；console error/warning 为空。
- gates：Web focused **4 files / 11 tests**；slice focused **4 files / 14 tests**；
  Web production **8,910 modules**；slice formal production **2262.6kB Lynx /
  2379.6kB desktop total**。strict audit exact write→write→check→check：threads
  **55.11%**、threads-shell **63.38%**、thread **38.31%**、settings **51.25%**、
  projects/Kanban **52.21%**、PR **57.15%**；style **98.06%**
  （2,253 classes / 13,185 weighted）。两仓 `git diff --check` 通过。
- cleanup：owned Lynx/TCP listener 停止，58090/8901 释放；unrelated PID 30250 /
  8902 未触碰。KV/window byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  backup 移入
  `/Users/bytedance/.Trash/synara-p7i5-kanban.oymqks-20260731-0645`。证据：
  `shots/2026-07-31/port/p7-i5/resilience/notes.md`，新增 P-125。
- **P7-I5 继续 in_progress**；下一刀处理 composer discrete lifecycle announcement，
  随后完成 informative state text role-based contrast inventory/fix，不进入 transcript
  per-token loop。

### 2026-07-31 — P7-I5 cut 4 + completed：Composer lifecycle 与 informative contrast

- 新增 physical-shared `ComposerLifecycleStatus` + canonical Web/Native Elements：
  first mount fail closed，只发布 sending/starting/started/stopping/stopped/complete/failure
  离散 transition；Web 使用 polite status / assertive alert，Native 复用 P-124 named
  state/announcement adapter。transcript rows 不消费，因此 token polling 不进入公告环。
- isolated real runtime 先保留两个阴性：既有 `Reply MODEL-READY` 已 quarantined，
  新 Codex GPT-5.5/Terra session 只有 ACP parse/auth noise、没有 provider event/assistant，
  均不冒充 Composer fail/pass。新 Claude Sonnet 4.6 thread
  `f0042f91-563c-487d-aa18-92f7ab34747e` 获真实
  `P7-I5-CLAUDE-READY` response，Native 依次暴露
  `Starting response`→`Response started`→`Response complete`；首次 mount 无 lifecycle
  node，console error/warning 为空。
- 真实 Native Stop 暴露 race：server 已 interrupt，但 local `stopping` 比 polling
  `running→ready` 先清除，旧 resolver 误报 `Response complete`。新增 bounded
  `stopRequested` retention 与 terminal precedence 后 formal rebuild；rapid product probe
  精确得到 `Stopping response`→`Response stopped`，server event 同时记录
  interrupt requested、task stopped、ready 与 `turn.completed state=interrupted`
  （保留序列 346–352）。intent 在 stopped/alert 后清除，普通完成不受影响。新增 P-126。
- canonical theme math 新增 informative
  neutral/error/success/warning text roles；代表性 state CSS 删除低 opacity 叠加，
  decorative/disabled tertiary palette 不全局改变。默认 light contrast 为
  **6.10/4.57/4.82/4.57**，dark 为 **8.37/4.76/5.78/10.65**；Web test 对双主题四角色
  逐项断言 ≥4.5:1，Native generated sheet 由 strict style audit 锁定。
- gates：Web focused **6 files / 38 tests**；slice focused **5 files / 20 tests**；
  Web production **8,912 modules**；slice formal production **2267.9kB Lynx /
  2384.8kB desktop total**。strict audit exact write→write→check→check：threads
  **55.15%**、threads-shell **63.42%**、thread **38.40%**、settings **51.29%**、
  projects/Kanban **52.24%**、PR **57.19%**；style **98.06%**
  （2,254 classes / 13,185 weighted）。两仓最终 `git diff --check` 通过。
- cleanup：owned server/Web/Native 全部停止，58090/8891/8903 释放；用户
  8901/8902 与后来 unrelated 8904/8905 未触碰。KV/window byte-exact 恢复为
  `6dd15e6eb3fa231dca98f7d951a449a13ec45e328ec08725adc1b3769ef87c57` /
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`；
  isolated clone/backup/临时 provider cwd 移入 Trash。证据：
  `shots/2026-07-31/port/p7-i5/composer-contrast/notes.md`。
- **P7-I5 completed at application layer**。六屏 loading/empty/error/offline/streaming、
  named actions、bounded dynamic status 与双主题 informative contrast 已闭环且无假数据。
  Lynxtron 0.0.7 仍只有 0-child AXGroup、无可观察 audible channel；明确保留为 host gap，
  不冒充 screen-reader pass。下一任务进入 **P8-Q1 删除切片脚手架与重复 renderer**。

---

## 2026-07-31 — P8-Q1 主仓控制面迁移（completed）

- 将历史 roadmap、compat matrix、decisions、LOG、P5–P7 reports/templates、reuse/style 配置与审计脚本复制到 `apps/lynx/plan`、`apps/lynx/scripts`；staging `synara-lynx` 未被修改。
- 审计路径已改为主仓相对路径（Web=`apps/web`，Lynx=`apps/lynx`），并在 `apps/lynx/package.json` 加入 `audit:reuse`、`audit:reuse:check`、`audit:style`、`audit:style:check`。
- 通过：reuse write/check（threads 55.15%、shell 63.42%、thread 38.40%、settings 51.29%、projects/Kanban 52.24%、PR 57.19%）；style write/check（2,254 classes / 13,185 weighted / 98.06%）。
- P8-Q1 实现事实：删除五个未接入诊断/probe 页、诊断样式、旧 scaffold 测试及九个生成 `.js` 镜像；删除 `/projects` 过渡路由，统一 `/kanban`；workspace aliases 与隐式依赖已改正。旧 staging 保持可恢复，未碰用户数据或用户进程。
- 最终门禁：`bun install`；Web production（8,916 modules）、Lynx production（2267.1 kB Lynx / 2384.1 kB desktop）和 desktop production build 均通过。四条审计全部通过；主仓与可恢复 staging 的 `git diff --check` 均通过。保留的 build warnings 仅为已登记的 Lynx `color-scheme` 编码移除、可选 `ws` native addon 和 Electron `original-fs` external import。
- **P8-Q1 completed**。下一步进入 **P8-Q2 最终视觉认证矩阵**：以隔离、同源 WS 数据重新验证六核心屏 × light/dark × 1280×820/1440×900；不能将历史截图或 build 结果替代当前认证。

## 2026-07-31 — P8-Q2 认证预检（blocked）

- 已以 `SYNARA_PORT_OFFSET=3158` 启动隔离 Synara（server `58090` / Web `8891` / `.synara-pr84`），先执行 dry-run；Web 与 Native 共享 `ws://127.0.0.1:58090`。
- 已安装缺失的本地 Lynxtron runtime，使用 `SYNARA_ENABLE_DEVTOOL=1` 启动 production bundle。Lynx DevTool 实际发现 `@synara/lynx` client/session，DOM 根为 `SliceRoot--theme-light SliceRoot--density-comfortable`，当前连接帧已保存。
- **未认证也未声称通过**：本终端没有 macOS Accessibility 权限，`osascript` 不能读取/设置 Native window 尺寸；DevTool 输出只得当前 2560×1576 全屏帧，不能替代 1280×820 / 1440×900 的 like-for-like 矩阵。为不伪造六屏 × 双主题 × 双尺寸结果，P8-Q2 标记 blocked。
- 预检证据与恢复步骤：`reports/p8-q2-certification-preflight.md`。本轮自启 isolated server/Web/Lynxtron 在记录后停止；未触及用户进程、用户数据或 staging。

## 2026-07-31 — P8-Q2 capture surface 复核（继续 blocked）

- 当前 Web runtime 仍可在 `http://localhost:8891` 访问，页面 JavaScript 实测为 `1280×820`、DPR 1；但 shared preview screenshot exporter 生成的 PNG 仍不对应请求 viewport，不能计为精确认证位图。
- 复核系统 Chrome、常见 CDP ports 与 Midscene Bridge：没有可连接的 remote-debugging/CDP endpoint。workspace 的 `playwright@1.58.2` 依赖仍在，但其 Chromium executable 不在 `~/Library/Caches/ms-playwright/chromium-1208/`，故不可启动受控浏览器。
- 修订 `reports/p8-q2-certification-preflight.md`：移除与当前机器状态不符的“可控 Puppeteer 已恢复”表述，明确既有 Web PNG 全是诊断产物，不升级为证据；同时修正 DevTool client port 的历史误述（Synara 应动态发现，最近为 `8903`，`8901`/`8902` 是用户 Fiddle）。
- **P8-Q2 继续 blocked**：必须提供/恢复可验证的 Playwright Chromium（明确 viewport、DPR 与运行时检查）或可控的 Chromium CDP endpoint，才能采集六屏 × 双主题 × 双尺寸的 48 张 Web/Lynx 配对证据。未制造剩余证据，未碰用户数据、用户拥有的浏览器/Lynxtron 进程或 recoverable staging。

## 2026-08-02 — Lynx-for-Web relay 产品化与 browser harness 预检

- 按新 goal 只合入 spike 的三个产品边界：`web-host.ts` 主线程 WS RPC relay 与
  storage/timer/dialog handlers、`synaraClient.lynx.ts` 显式 relay transport、
  `lynx.config.ts` Web-only endpoint/relay define。未合 browser background WebSocket
  fallback、trusted-origin 放宽、`buildCache: false` 或 spike diagnostics。
- endpoint 由构建期 `SYNARA_WS_URL` 注入，缺省仍为 `ws://127.0.0.1:58090`；Web build
  使用正式 `0.5.5-lynx-web` build id，Desktop build 显式关闭 relay。host 采用数字字符串
  request id、8s open / 60s RPC timeout、6 次 250ms→2s 指数重连；storage 以
  `synara.lynx.` 前缀隔离到 localStorage，并保留既有 dialog 语义。
- 首轮真实 snapshot 加载暴露 `pullRequests.list` semantic schema failure；旧 bridge 包装会把
  它误判为 transport offline。relay 现区分 `rpc` 与 `transport` error kind：业务 RPC
  failure 保持 connected，连接/超时 failure 才进入 5s offline cooldown。移除全部临时
  memory diagnostics 后重建。
- focused tests **2 files / 9 tests**；Web production **2460.2 kB**、Desktop Lynx
  **2364.3 kB**，`git diff --check` 均通过。保留 warning 仅为 Lynx `color-scheme`、可选
  `ws` native addons 与上游 Web initialization deprecation。
- named `synara-harness-lynx` session 在 isolated `62190` server、同一 snapshot、
  1280×820 / DPR 1 / light 下渲染真实 project + 3 threads，无 offline banner、无 runtime
  error。证据：`shots/2026-08-02/harness/relay/notes.md`。这只是 relay/harness preflight，
  不冒充 UI paired pass。
- 下一步：将同一 snapshot 的 Web original 切到同 route/light，建立 paired baseline；随后
  按 Composer → transcript scroll → Markdown 顺序优化，浏览器阶段不启动 Lynxtron，最后
  只做一次批量 Native 回归。

## 2026-08-02 — Lynx-for-Web Composer paired fidelity

- 同一 isolated snapshot、`1280×820`、DPR 1、light 下完成 Web original ↔ Lynx-for-Web
  empty landing Composer 配对。surface/tray 的宽高与圆角精确一致，锚点差为
  `x=+8 / y=+7.25`，满足 ≤8 px 契约；placeholder、project tray、model/effort split、
  control density 与 Web authority 收敛。
- landing project picker 现在消费真实 project，并决定首次 send 的 thread target；model 与
  effort 分控，Access/Extras 菜单可交互。修复 Web harness 中 nested fixed overlay 的双重
  offset：menu primitive 按 layer origin 归一化 global anchor，Native zero-origin 不变。
- `$skill` 接入真实 `provider.listSkills`：filter → selection → provider canonical token →
  structured draft reference/chip → canonical message payload 全链路完成，undo/redo 与清稿同步
  保留 skill context。voice affordance 明确 disabled/unavailable，不冒充 browser voice 支持。
- 已登记残差：Lynx textarea 是平台岛，当前同时显示独立 chip 与 canonical `/polish` text，
  尚未达到 Web inline rich-token editor 的像素等价。
- gates：focused **6 files / 28 tests**；Web production **2476.6 kB**；Desktop production
  **2379.6 kB Lynx / 2508.3 kB total**；`git diff --check` 通过。证据：
  `shots/2026-08-02/harness/composer/notes.md`。
- 浏览器阶段继续遵守 no-Raise：未启动 Lynxtron/正式 App。下一组按 goal 进入 transcript
  scroll fidelity，完成后独立 commit + push；随后 Markdown，再做一次批量 Native 回归。

## 2026-08-02 — Lynx-for-Web transcript scroll fidelity

- 修复 `<list>.scrollToPosition` 错用 `{index, alignTo}` 的静默失效，改为真实
  `{position, offset, smooth}` contract；长 assistant row 追加 end-clamp offset，既覆盖短尾行，
  也覆盖高于 viewport 的 streaming 长尾行。
- Native 保留 `eventSource=2` 用户滚动门；Lynx-for-Web 缺同构 scroll event shape，Web host
  新增只读、bounded transcript metrics bridge，并按 list identity 保留 previous scrollTop。
  background pure reducer 只在 upward movement 脱离、到 live edge 重吸附，route 切换不继承旧
  list 位置。
- paired authority：Web Scroll-to-bottom `x=752 y=669 32×32`，Lynx-for-Web
  `x=760 y=669 32×32`，只剩 `+8px` 横向差，纵向/尺寸/accessible name 精确一致。
- final-code real provider proof：初始 long transcript `557/557`；PageUp `0/557` + affordance；
  activate 后 `557/557`。真实 `FINAL-SCROLL-OK` turn 在 Response started 时
  `681/681`，完成时 `1083/1083`，全程无 Jump。旧 imported seed thread 的 quarantined skip
  明确保留为阴性，不计 streaming pass；改由 canonical new thread 完成真实 700/300-word turn。
- gates：focused **1 file / 11 tests**；Web production **2478.3 kB**；Desktop production
  **2380.8 kB Lynx / 2509.4 kB total**；`git diff --check` 通过。证据：
  `shots/2026-08-02/harness/transcript-scroll/notes.md`。
- 未启动 Lynxtron/正式 App。下一组进入 Markdown fidelity，并在闭环后独立 commit + push。

## 2026-08-02 — Lynx-for-Web Markdown paired fidelity

- `ChatMarkdown.lynx` 现在以 Web code-fence grammar 和 composer token grammar 为共享
  逻辑源：assistant/user 分离 processor，用户消息进入 Markdown + mention references；code
  surface 补齐 language/file metadata、wrap/copy action、可访问名称、尾换行复制/几何语义。
  Web host 仅补 harness 所需 clipboard/external-link platform handler，不复制业务 renderer。
- transcript 增加与 Web 等价的 64px footer + 16px desktop list padding；吸底明确指向
  trailing chrome row。thread composer bottom inset 同步后，paired light 最终代码块为 Web
  `x399 y463.89 728×140.69`、Lynx `x407 y466 728×143`；composer 为 Web
  `x400 y709 736×95`、Lynx `x408 y709 736×95`。全部关键锚点 ≤8px、字号差 0。
- 后台真实 pointer 验证 Copy `Copy code→Copied`、Wrap
  `Enable→Disable soft wrap→Enable`；同一 isolated sequence-174/thread、1280×820/DPR1
  补 light/dark paired evidence，未启动或 Raise 正式 App。证据：
  `shots/2026-08-02/harness/markdown/notes.md`。
- gates：Lynx focused **2 files / 17 tests**（最终 presentation rerun **1 / 5**）；Web
  focused **2 / 40**；Web production **8,932 modules**；Lynx/Desktop production
  **2398.2kB / 2526.9kB total**；Lynx-for-Web **2497.6kB / 3443.7kB total**。
  strict audit：thread **38.67%**、style **98.07%**，write/check 均通过。
- 阴性/残差不冒充通过：direct component Rstest 因 unified Node `debug` 被错误打进 Lynx
  test runtime 而生成非法代码，改由 dependency-free presentation tests + 双 production
  compiler + runtime 覆盖；Web Shiki/KaTeX、Lynx plain code/textual math 与 image fallback
  仍为已登记平台差异。
- 下一步：按 goal 只做一次 Computer Use/background/exact-owned Native 批量回归，覆盖已重新
  打开的 Search fidelity、empty landing initiate thread 与本轮 Composer/scroll/Markdown；
  完成后再恢复 P9-D1，不越序进入 P9-R1。

## 2026-08-02 — P0-A/P0-B + Composer/scroll/Markdown Native 批量回归

- 按用户 no-Raise 要求使用 `computer-use`；当前另有用户 Lynxtron 0.0.8，同 bundle lock
  使首次本仓 hidden launch 在 window/state 前退出，未触碰用户进程。新增 D14 默认关闭的
  `SYNARA_ALLOW_PARALLEL_INSTANCE=1` + background `showInactive()` contract，且 parallel
  验证实例不注册系统 deep-link handler。两刀已分别提交/push：`d853e555`、`0293ef87`；
  shell focused **12/12**、production **2398.3kB / 2527.1kB total**。
- P0-A：Computer Use 打开 Search、真实输入 `Draft`，结果收敛为 real Draft thread，Enter
  导航成功；popup/input/icons/highlight/footer anatomy 与 Web authority 收敛。P0-A 验收回归闭环。
- P0-B：empty landing 真实 focus/type/send，创建
  `lynx-landing-thread-1785677631901-324479cc461478`，收到真实
  `NATIVE-LANDING-PERSIST-OK`，Chats 回显；唯一一次 owned restart 后 route/messages/rows
  恢复。P0-B 验收回归闭环。
- 同一实例滚动长 Draft transcript 到 final Markdown code；language header、wrap/copy、用户
  bubble 与 trailing inset 均真实绘制。Native Copy 后 `pbpaste` 匹配 canonical fenced code；
  clipboard 旧值未预备份，无法恢复，已在 notes 明示。
- exact DevTool `localhost:8904/session 1`，error/warning 为空。owned PID 1510 仅为 persistence
  restart 停止，final PID 6743/root 6739 已停止、8904 释放；用户 0.0.8 processes 未触碰。
  证据：`shots/2026-08-02/native-regression/notes.md`。
- 两项高优验收回归与 browser-harness 三项闭环后，**P9-D1 恢复 in_progress**；不进入
  P9-R1。后续继续 host/input-bridge 边界调查，仍禁止反复启动/Raise 正式 App。

## 2026-08-02 — transcript A→B→A completion audit

- 对同一 isolated server/state 补做明确 `A -> B -> A` route-switch 证据，双端均为
  `1280×820`、DPR 1、light；所有 thread 切换由 rendered sidebar row 的真实 pointer
  activation 完成。
- Lynx-for-Web：长 A 从 live edge 人为脱离 2400 px 后，B 独立落在自身 live edge；返回 A
  时距底 15 px（30 px pinned tolerance 内）且无 `Scroll to bottom`，未继承 A/B 的旧偏移。
- Web original 对照暴露既有 cross-thread `isAtEnd` 残差：离开 detached A 后 B 首帧停在顶部，
  返回 A 又回 live edge。Lynx 不复制此跨 thread state leak；route/list identity 重置为正确性
  差异，不能冒充逐像素同构。
- 证据：`shots/2026-08-02/harness/transcript-switch/notes.md` 与 8 张 paired PNG。

## 2026-08-02 — Markdown skill/mention completion audit

- 同一 isolated server/thread、`1280×820`、DPR 1、light 下，补齐 Web original 与
  Lynx-for-Web 的 skill/mention 菜单、选中态和 persisted transcript 双端证据。
- real `$polish` UI selection 持久化为 canonical `/polish …`，projection 含真实
  `skills_json` path；real `Draft seed task` mention 持久化为 quoted canonical token，
  projection 含 `thread://thread:…` `mentions_json`。双端输出均渲染实体 chip，不泄露 raw
  syntax。
- 明示残差：Web inline rich token vs Lynx platform textarea 的 chip + canonical text；长 thread
  的 message-trail/scrollbar gutter 使 persisted row x anchor 为 `+12px`，未伪装成 ≤8px；结构化
  payload、输出语义、宽度与顺序一致。
- Web authoritative code block 当前无 line numbers，仅有 language/file metadata、wrap/copy 与
  横向滚动；Lynx 不虚构 Web 不存在的行号。证据：
  `shots/2026-08-02/harness/markdown-tokens/notes.md` 与 10 张 paired PNG。

## 2026-08-02 — Lynx-for-Web goal final verification

- focused tests：Lynx **7 files / 51 tests**、Web **3 files / 31 tests** 全通过；严格遵守
  `bun run test -- ...`，未运行 `bun test`、fmt、lint 或 typecheck。
- production builds：Desktop/Lynx **2398.2kB / 2527.1kB total**；Lynx-for-Web
  **2497.6kB / 3443.6kB total**；Web original **8932 modules**。warning 仅为既有 Lynx
  unsupported CSS、可选 `ws` native addons、Node deprecation 与 Web chunk-size 提示。
- compile-time relay isolation 由 final artifacts 复核：Desktop bundle 只含
  `0.5.5-lynx-slice`，不含 `0.5.5-lynx-web`、`synaraRpc`、`readTranscriptScroll` 或
  `synara.lynx.`；Web bundle 含正式 web build id、relay handlers 与默认
  `ws://127.0.0.1:58090`，不含认证端口 `62190`。
- strict audits：thread reuse **38.67%**、style **98.07%**，write/check 均通过；生成报告
  内容未变，仅 timestamp 被恢复，避免无意义 churn。
- fresh browser sessions 复核 console：Web 仅 Vite debug，零 page errors；Lynx-for-Web
  零 page errors，仅上游 initialization deprecation warning。Native final exact DevTool
  error/warning 仍为空，8904 已释放，且没有 exact-owned Lynxtron process。
- interrupted P9-D1 的两个 `/private/tmp/synara-p9-*` staging path 已不存在；无 owned
  process 可清理。用户的其他 Lynxtron processes 始终未触碰。本 goal 至此闭环，不越序进入
  P9-R1。

## 2026-08-03 — P9-D1 任务正式化

- 按 goal 指令恢复并正式化 P9-D1（host/input-bridge 边界调查）：
  - 从 LOG、02-compat-matrix（P-110、textarea kernel island、host focus bridge gap、
    host physical Escape、`<list>` user-scroll publication）、04-lynx-patterns（P-110）、
    代码（focus.lynx.ts、interactive-state.lynx.ts、Composer.lynx.tsx、main.ts preload.ts
    hostServices.ts）恢复完整问题定义。
  - 已写入 01-roadmap.md Phase 9，含：objective、in-scope（7 类事件路径测试）/
    out-of-scope（IME 生命周期、AX、全局快捷键、非 macOS）、browser-harnessable 部分
    （Lynx-for-Web event binding probe）、Native-only 部分（真实宿主 Tab/Escape/textarea/
    window-focus/scroll）、focused tests、runtime evidence 目录、5 条 exit criteria。
  - P9-R1 设为 pending 并注明"禁止在 D1 完成前进入"。
  - 旧 `/private/tmp/synara-p9-*` staging path 不依赖，全部从源码与已有 plan 文档重建。
- 下一步：开始 P9-D1 browser-harnessable 部分（Lynx-for-Web event probe 诊断工具）。

## 2026-08-03 — P9-D1 正式定义复核

- 完整复核 AGENTS harness、roadmap、compat matrix、decisions、LOG、P8-Q2 preflight、
  Lynx `llms.txt`、官方 input/textarea/event 文档及现有 host/input 代码后，修正三处定义：
  - P9-D1 是恢复后的当前优先任务，不依赖尚未完成的 P8-Q2；依赖改为已完成并提供历史
    证据的 P7-I1/P7-I3，状态改为 `in_progress`。P8-Q2 在 P9-D1 闭环后继续。
  - Native textarea IME composition 属本目标明确要求，不再排除；必须验证
    `bindinput.detail.isComposing` 的开始、更新与提交边界。
  - runtime evidence 不强迫无视觉变化事件生成无信息截图；每类事件必须有结构化 report
    与 exact console，能改变可见状态/DOM 的事件再补 screenshot + attribute，阴性事件以
    操作时间线和前后 report/DOM snapshot 存证。
- 正式化提交 `254c93e0` 已在 `origin/huxcx/lynxtron-port-current-state`；本次为范围纠偏，
  不进入 P9-R1，也不扩大到 terminal/browser/PDF/voice。

## 2026-08-03 — P9-D1 Lynx-for-Web input probe

- 新增独立 host-input probe build，不进入产品 `index/App/router` 静态图：
  `SYNARA_HOST_INPUT_PROBE=1` 仍使用标准 Rspeedy `web` environment（自定义 environment
  不会注册 Lynx template encoder，首轮准确失败后已撤回），输出到
  `output/dist/probes/host-input/web`。bundle 102.1 kB。
- 纯逻辑 matrix 区分 binding existence、event arrival、call count、last detail，并把
  IME composing/committed 分开；focused Rstest **1 file / 3 tests** 通过。
- named `synara-p9-d1-probe-final` session 在 owned static server `127.0.0.1:49321`、
  `1280×820`、DPR 1 下完成真实 browser input：
  - 25/25 bindings 存在；
  - 9/25 event categories 到达：textarea focus/blur、普通 committed input、view
    mousedown/up/tap、host window focus/blur；
  - view focus/key、textarea key、IME composing、mouseenter/leave、nested scroll wheel
    未到达。Web custom-element 阴性不外推 Native。
- 最终 PNG 精确 `1280×820`，page errors 为空，console 仅上游 initialization
  deprecation。结构化 matrix、console、PNG/hash、无效尝试边界见
  `shots/2026-08-03/p9-d1/web-probe/notes.md`。
- 下一步：关闭 Web probe owned process/session 后，按 exact-owned Native protocol
  复证 Tab/Shift+Tab、view keys、textarea keys、普通 input+真实 IME、window focus/blur
  与 wheel/list；未完成前 P9-D1 仍 `in_progress`，禁止进入 P9-R1。

## 2026-08-03 — P9-D1 Native proof（IME blocked）

- 同一 probe 以 `SYNARA_HOST_INPUT_PROBE=1` 进入标准 Lynx/Desktop production build，
  bundle **101.6 kB**，SHA-256
  `05138a65af9bcdc1ff3309999aa0520fd6112f2ef9da01b9cc378289b9857629`；
  host report seam 只有显式 `SYNARA_HOST_INPUT_PROBE_REPORT` 才启用。
- exact-owned instances 均使用 isolated state、parallel/background flags；
  PID→DevTool 动态解析为 `localhost:8903/session 1`，未触碰现有 `8901` Fiddle 与
  `8902` iOS client。初始 1280×820 outer 对应 2560×1576 DevTool frame。
- Native retained matrix **25/25 bound、11/25 delivered**：
  - 正向：view mouseenter/leave/down/up/tap；textarea focus、普通 input/committed；
    scroll-view 真实 wheel（3 calls，最终 scrollTop 242）；host window focus/blur。
  - 阴性：真实 Tab/Shift+Tab 不发布 view focus；view Enter/Space/Arrow/Escape 与
    textarea Enter/Arrow/Escape 不到达 Lynx JS，复现 P-110/textarea kernel island。
- 真实 IME 未完成：Computer Use health check通过但 visual model 未配置；background
  `showInactive()` textarea 可获得 Lynx focus但不是 macOS frontmost text client；
  PID-targeted keycodes不经过 Text Input Manager。豆包拼音尝试均安全恢复 U.S. input source，
  不把未到达记作产品阴性。P9-D1 因 `isComposing=true→false` 缺口标
  **blocked**，解阻需一次用户授权的 exact-owned window activation或可用 Computer Use
  model。报告：`reports/p9-d1-host-input-bridge.md`；证据：
  `shots/2026-08-03/p9-d1/native-probe/notes.md`。
- 不进入 P9-R1；按用户优先级，P9-D1 未 completed 前也不越序进入 P8-Q2。

## 2026-08-03 — P8-Q2 preflight Web capture blocker解除

- 旧 preflight 的“当前没有独立 Chromium/Puppeteer capture surface”已过时：
  `agent-browser` 可用独立 named Chromium session，不连接用户 Chrome，也不依赖 shared
  preview exporter、系统 Chrome CDP、Midscene Bridge或 workspace Playwright binary。
- `synara-p8-q2-preflight` session 两尺寸实测：
  - 1280×820 / DPR1：inner/visual viewport均精确，PNG `1280×820`；
  - 1440×900 / DPR1：inner/visual viewport均精确，PNG `1440×900`；
  - page errors/console为空，session已关闭。
- preflight 状态改为 ready；同时修正矩阵计数为 **24 paired cells / 48 client frames**
  （六屏×双主题×双尺寸），不是48个paired cells。历史无 provenance PNG仍不得升级。
- 证据：`shots/2026-08-03/p8-q2/preflight/`。本刀只刷新 harness preflight，不开始
  P8-Q2产品矩阵；P9-D1真实IME blocker仍存在，不进入P9-R1。

## 2026-08-03 — P8-Q2 Threads / Thread Fast Browser matrix

- 建立单一可信 browser origin：Web original 位于 `/`，Lynx-for-Web 位于 `/lynx/`，
  共同由 `http://localhost:63211` 服务；server `devUrl` 同样指向该 origin。此前双 origin
  会被正确 CSRF gate 拒绝，未放宽产品安全策略。
- 共享真实 snapshot：
  `/private/tmp/synara-lynx-web-harness.SUyxxH/synara-home/dev/state.sqlite`，
  SHA-256 `7dfc4c8d755bb0656df7f4fba2ff4cebe3602189854605508ace4ae278147540`，
  含 3 projects / 5 threads / 30 messages。
- Threads 与 Thread 各完成 light/dark × 1280×820/1440×900，共 **8 paired Browser cells /
  16 PNGs**。主题由 Settings→Appearance真实切换，路由由 `New thread` /
  `Draft seed task` rendered controls切换；未写SQLite或注入隐藏route state。
- Threads landing 的 hero/tray 两尺寸双主题均满足锚点≤8px、字号精确；tray `736×58`
  完全一致。Web-only provider status failure banner通过其产品dismiss action清除，不复制到
  Lynx。
- Thread 使用真实长 transcript。1440两端均精确live edge；1280 light距底0/5px，
  dark两端同为80px trailing-inset distance。Web full-main virtual timeline与Lynx 736px
  native `<list>` 是已登记platform kernel，不记作未登记大色块差异。
- 16 PNG尺寸精确、DPR1、全部page-error文件为空。证据与discarded harness attempts：
  `shots/2026-08-03/p8-q2/threads-thread/notes.md`。
- 本刀只完成 Fast Browser tier；P9-D1真实IME仍blocked，Native最终batch未开始，
  不进入P9-R1。

## 2026-08-03 — P8-Q2 Settings Fast Browser matrix

- Settings→General 完成 light/dark × 1280×820/1440×900，共4 paired Browser cells /
  8 PNGs；主题与页面导航全部走rendered Settings controls。
- 两尺寸双主题的description锚点为 Lynx `x +5px / y +8px`，width与14px字号精确；
  首个section card为 `x +5px / y +5.25px`，宽度624px精确，高度仅1px差，满足门禁。
- Lynx `General` 存在nav与panel title重复文本，初始title selector命中nav；retained比较改用
  唯一description与first content card，不把selector noise记作产品差异。
- 所有PNG尺寸、DPR/visual viewport与page-error gate通过。证据：
  `shots/2026-08-03/p8-q2/settings/notes.md`。Native仍未开始，P9-D1真实IME保持blocked。

## 2026-08-03 — P8-Q2 Projects overview Fast Browser matrix

- Kanban Projects overview 完成 light/dark × 1280×820/1440×900，共4 paired Browser
  cells / 8 PNGs；路由由可见 `Kanban` row进入，主题由 Settings→Appearance rendered
  controls切换。
- 两尺寸双主题的page title均为 Lynx `x +8px / y +7px`、14px字号精确；project与Chats
  heading均为 `x +8px / y +6px`、13px字号精确，满足门禁。
- Lynx section heading owner占满column，Web heading为text shrink-wrap；因此宽度不是
  like-for-like文字指标，不登记为产品差异。
- 所有PNG尺寸、DPR/visual viewport与page-error gate通过；focused Kanban tests
  4 files / 9 tests、strict reuse/style audits均green。证据：
  `shots/2026-08-03/p8-q2/projects/notes.md`。Native仍未开始，P9-D1真实IME保持blocked。

## 2026-08-03 — P8-Q2 Project Kanban Fast Browser matrix

- Project Kanban完成 light/dark × 1280×820/1440×900，共4 paired Browser cells /
  8 PNGs；由可见 `Kanban` row与 `Lynx Web Spike` overview card进入，主题走
  Settings→Appearance rendered controls。
- 首轮测量发现Lynx bespoke `16px` column gap相对Web canonical `12px`产生累积漂移，
  第三列超过10px；未保留该帧。`App.css`改为12px后，三列两尺寸双主题均统一
  `x +8px / y +6px`，宽度精确、高度仅2px差；route title为 `x +4px / y +7px`、
  14px字号精确。
- 所有PNG尺寸、DPR/visual viewport与page-error gate通过；focused Kanban
  board/route/DnD tests 5 files / 14 tests、strict reuse/style audits均green；默认Web
  bundle已恢复仅含`58090`。
- 证据：`shots/2026-08-03/p8-q2/kanban/notes.md`。本刀仍仅完成Fast Browser tier；
  Native未开始，P9-D1真实IME保持blocked。

## 2026-08-03 — P8-Q2 Pull Requests Fast Browser matrix

- Pull Requests完成 light/dark × 1280×820/1440×900，共4 paired Browser cells /
  8 PNGs；共享真实snapshot在All + Open下无匹配PR，因此两端认证canonical filter + empty
  state，不伪造PR fixture。
- 首轮发现Lynx filter stack为68.5px、Web为66px，导致empty state `y +10.5px`；未保留。
  Lynx adapter改为Web实测的12px/18px pill typography与28px search/project row后，
  filter stack精确66px。
- retained四格均为route title `x +8px / y +8px`、14px字号精确；filter与empty shell
  `x +4px / y +8px`、高度精确，满足门禁。所有PNG尺寸、DPR/visual viewport与
  page-error gate通过。
- focused shared PR composition tests 2 files / 5 tests、strict reuse/style audits均green；
  默认Web bundle已恢复仅含`58090`。证据：
  `shots/2026-08-03/p8-q2/pull-requests/notes.md`。Fast Browser 24 paired cells已齐；
  Native最终batch仍未开始，P9-D1真实IME保持blocked。

## 2026-08-03 — P8-Q2 Native final batch / completed

- 完整production desktop build以`SYNARA_WS_URL=ws://127.0.0.1:62190`生成认证bundle，
  SHA-256 `119b43ad13d836ac3d00887cbaacec26ab4ef9a780353040f069b7d64f3c7b32`；
  exact session URL指向`apps/lynx/dist/desktop/main.lynx.bundle`。
- exact-owned background Native只启动两次：PID 16313对应1280×820，PID 42620对应
  1440×900；均使用isolated user-data、parallel-instance与showInactive，不Raise/activate，
  未触碰用户owned 8901/8902 clients。
- CoreGraphics outer bounds精确；24张DevTool LynxView frames中，1280格均为
  2560×1576，1440格均为2880×1736。六屏×双主题×双尺寸共24/24 route assertions、
  24/24 error/warning console gates通过。
- 所有Native路由与theme切换走rendered controls：DOM search + box model +
  `Input.emulateTouchFromMouseEvent`。未注入隐藏route state；project overview card以实测
  main-content可见box center点击。
- cleanup完成：owned app/server退出，8903与62190释放；用户window-state byte-identical，
  shared SQLite SHA-256仍为
  `7dfc4c8d755bb0656df7f4fba2ff4cebe3602189854605508ace4ae278147540`。
  默认desktop bundle已重建且仅含`58090`。
- **P8-Q2 completed**：24 paired Browser cells / 48 client frames + 24 Native frames，
  未登记重大差异为零。证据：
  `shots/2026-08-03/p8-q2/native/notes.md`。P9-D1真实macOS IME composition仍独立
  blocked，不进入P9-R1。

## 2026-08-03 — P9-D1 completion audit：focused gate补齐

- 逐项对照 P9-D1 roadmap 后发现 `focusLynxNode` / `focusLynxElementById` 的建议 focused
  test 尚无直接 owner；新增 dependency-free `components/ui/focus.lynx.test.ts`，覆盖
  ref node `setFocus`、selector/id chain、missing node、native command failure与blank selector。
- P9-D1 focused gate现为 **4 files / 15 tests**：focus helper、interactive-state adapter、
  transcript keyboard landmark、25-event host-input matrix，全部通过。
- 同一逻辑切片完成 Web probe、Native probe、default Web、default Desktop 四次build；
  probe build后默认 artifacts已重建，Web/Desktop bundle均只含`58090`且无probe markers。
  strict reuse/style audits与`git diff --check`通过。
- 该补齐只关闭自动化 test/build/audit 缺口。真实macOS IME `isComposing=true→false` 仍因
  Computer Use model未配置且no-Raise/background窗口不是Text Input Manager client而blocked；
  P9-D1不改判completed，P9-R1继续禁止。

## 2026-08-03 — P9-D1 real IME close-out / completed

- 通过private local provider配置了ephemeral Computer Use visual model；credential仅在
  `/private/tmp`短暂解码使用，未打印、未写repo，cleanup后删除。health check、screenshot与
  visual assertion通过。
- exact-owned probe PID 87477、PID-derived `localhost:8903/session 1`、isolated state、
  1280×820 outer / 2560×1576 DevTool frame。先断言Host Input Probe与`Type here`
  textarea可见未遮挡，再以真实visual tap激活；没有Raise、`open -a`、AppleScript
  focus/show或用户进程控制。
- 当前已选Doubao Pinyin保持不变。延迟输入`zhongwen`得到8次
  `input:composing`，最后`value=zhong'wen;isComposing=true`；单次Space提交得到一次
  `input:committed`，`value=中文;isComposing=false`。timestamp顺序证明真实
  `true → false`边界。
- baseline/focused/composing/committed四帧均2560×1576；exact-client baseline、
  composing、final error/warning console均空；report与证据hash位于
  `shots/2026-08-03/p9-d1/native-ime/`。
- owned probe退出、8903释放，8901/8902未触碰；临时credential copy删除；default
  Web/Desktop artifacts重建并仅含58090、无probe markers。
- **P9-D1 completed**：Web 25/25 bound、9/25 delivered；Native retained runs合并为
  25/25 bound、13/25 delivered；所有gap均已登记。P9-R1仍pending且需用户明确授权，
  本轮不进入。

## 2026-08-03 — P9-U1 Settings Behavior UI扩面

- 新增pure `SettingsBehaviorPanel.logic`，Web原Behavior panel反向消费；Lynx Settings
  开放canonical `behavior` row并直接消费同一composition。5项control全部使用已有
  shared SettingsSection/SettingsRow anatomy，Lynx叶子只映射native switch/reset。
- persistence分层：`enableAssistantStreaming`继续server-owned；diff wrap与3项confirmation
  写入`APP_SETTINGS_STORAGE_KEY`，projection preserve unknown fields。Restore defaults按
  当前section处理，overlapping save/stale completion继续沿用既有序列化门禁。
- Fast Browser同源真实snapshot：
  - Lynx-for-Web把streaming切Off，Web rendered Behavior同步显示Off；恢复On后再同步；
  - local diff wrap切On后canonical key落盘，完整reload+rendered navigation后仍为On，
    最终恢复Off；
  - 1280 light与1440 dark两格均为title `+5/+8px`，两张card `x +5px`、
    `y +5.25/+6.25px`，宽度精确、高度仅1px差，page errors空。
- exact-owned Native 1280×820：五项accessibility control可达；diff wrap落入isolated
  `kv.json`，完整restart后DOM仍为`--on`、`aria-checked=true`、value On，随后恢复Off；
  DevTool error/warning console空。
- gates：Web 1 file / 2 tests；Lynx 2 files / 12 tests；Web 8,933 modules；
  Web/Lynx/Desktop production green；reuse write/check后Settings 51.88%，style 98.07%；
  evidence `shots/2026-08-03/settings-behavior/notes.md`。未进入P8-Q3/Q4、P9-R1或hard islands。

## 2026-08-03 — P9-U2 Settings Keyboard Shortcuts UI扩面

- 把Web原`KeyboardShortcutsSettingsPanel`的search state、canonical section/filter、
  Command/Keybinding顺序、muted alternate-context rows与empty state抽成physical-shared
  `KeyboardShortcutsSettingsComposition`；Web wrapper只保留query获取，Lynx Elements只映射
  native view/text/input/keycaps。
- Lynx Settings开放canonical `shortcuts` row，并从真实`server.getConfig().keybindings`
  hydrate 51行。首版composition误用relative Elements import，Lynx-for-Web虽显示正确内容，
  实际编入Web DOM elements；该诊断build未保留，改为`~` alias后Web/Desktop bundle均含
  `SharedKeyboardShortcuts*` native class。
- Fast Browser同源真实snapshot：
  - Web rendered search输入`Search projects`后51行收敛为唯一目标，Escape清空后恢复51行；
  - 1280 light与1440 dark均为title `+5/+8px`、search/header/row整体
    `x +5px / y +5.25px`；
  - 初版Lynx row 54px相对Web 59px产生累积漂移，未保留；校准后header 33.5px、
    row 59px，第1/10行均无累计差。
- exact-owned Native PID 81457、PID-derived 8903/session 1、isolated 1280×820：
  rendered Settings→Keyboard Shortcuts touch路径成功；exact DOM为47 normal + 4 muted rows，
  含真实`Search projects and threads`、search input；DevTool frame 2560×1576且error/warning
  console空。showInactive DevTool touch/wheel未能移动Settings scroll owner，未保留scroll或
  Native filter交互，不将该harness limitation冒充产品认证。
- gates：Web focused 2 files / 3 tests；Lynx focused 2 files / 12 tests；
  Web 8,935 modules；Lynx-for-Web/Desktop production green；strict reuse write/check后
  Settings 52.64%，style 98.07%。owned Browser/server/static
  server/Lynxtron均关闭，62190/63211/8903释放，用户8901/8902未触碰，snapshot hash不变。
  证据`shots/2026-08-03/settings-shortcuts/notes.md`；未进入P8-Q3/Q4、P9-R1或hard islands。

## 2026-08-03 — P9-U3 Settings Notifications UI扩面

- 抽physical-shared `SettingsNotificationsPanel`与pure defaults/equality；Web原Notifications
  反向消费同一section/rows/copy/reset/switch composition，只保留permission/Test为Web
  platform leaf。Lynx开放canonical Notifications row，以native switch渲染两个boolean。
- 两个值写canonical `APP_SETTINGS_STORAGE_KEY`并preserve unknown fields。Lynx-for-Web把
  Activity toasts切Off后full reload+rendered navigation仍为Off；Native exact KV写入
  `false/true`，完整restart后DOM为`aria-checked=false`、accessibility value Off，最后恢复
  `true/true`。
- Lynx不伪造系统通知Test；Desktop row明确显示
  `System notification tests are unavailable in this runtime.`。首轮诊断发现shared
  `SettingsRow`的11px status被Lynx Elements当generic view导致文字丢失；新增native status
  role后重建，未保留旧帧。
- Browser 1280 light / 1440 dark均保持title `+5/+8px`、section与两rows
  `x +5px / y +5.25px`。Web Desktop row因permission status + Test比Lynx单行capability
  status高15px，为显式platform leaf。Native exact-owned 99902→restart 6627，
  PID-derived 8903/session1，frame 2560×1576、console clean。
- focused Web 1 file / 2 tests；Lynx 2 files / 13 tests；Web 8,937 modules；
  Lynx-for-Web/Desktop production green；strict reuse write/check后Settings 52.73%，
  style 98.07%。evidence：
  `shots/2026-08-03/settings-notifications/notes.md`；未进入P8-Q3/Q4、P9-R1或hard islands。

## 2026-08-03 — P9-U5 Phase 0 strict Composer evidence contract

- Started `P9-U5` from
  `plan/reports/p9-u5-composer-fidelity-plan.md`; Phase 0 is complete.
- Added a 23-state Composer manifest under
  `shots/2026-08-03/p9-u5-composer/manifest.json`. Every state declares route,
  theme, viewport/DPR, project/workspace, Plan/Fast, draft/caret, token state,
  structured refs, client applicability and evidence status.
- Added `scripts/composer-evidence.mjs` plus three Node regression tests.
  Retained evidence requires build/snapshot hashes, assertions, console,
  dimensions and a state echo; strict mode rejects required diagnostic/pending
  cells and combined Plan/Fast evidence reused for single-mode states.
- Existing DevTool captures were JPEG bytes with `.png` names. The valid exact
  Native project and combined Plan/Fast frames were normalized to real PNG
  files before being admitted by the manifest; original evidence was not
  modified.
- Removed all hand-written Composer cases from the repository comparison page.
  It now consumes generated offline `manifest.js`, displays
  retained/diagnostic/pending status badges, and names every missing reason.
- Phase 0 baseline intentionally remains red: 55 required client cells are
  incomplete. This is the truthful starting point for Project picker, Extras,
  command-menu and token convergence; no keyboard-shortcut work was added.
- Gates: evidence tests **3/3**; diagnostic generation green; strict verifier
  exits **2** as designed; comparison HTTP check shows 23 Composer states and
  no legacy Composer ids; `git diff --check` green.

## 2026-08-03 — P9-U5 Phase 1 shared Project Picker

- 抽physical-shared `ComposerProjectPickerComposition`、project/folder grouping
  model与footer action model；Web workspace-root/project两种模式和Lynx landing均反向
  消费。Lynx删除原手写`MenuItem`/`MenuPopup`普通anatomy，只保留native
  input/list/menu/filesystem adapter。
- 双端同一真实snapshot开放`Void`与`Folders on this Mac`，顺序/26 options/footer统一为
  `New project`、`Don't work in a project`；hidden directories过滤。Lynx local-folder选择
  通过canonical `project.create`，filesystem browse错误不再静默吞掉，并使用shared
  error/Retry anatomy。
- measured calibration：两端popup均`288×258`、x=408，option row均26px；Lynx group
  label 28px，Space text glyph替换为native SVG icon。真实rendered controls验证
  open/search/no-match/select/selected-open/reset；closed-shadow Lynx控件走CDP real
  pointer，不直接改React state。
- `shots/2026-08-03/p9-u5-composer/browser/project-picker/`新增7个stable states ×
  Web/Lynx共14 retained cells，均1280×820、same snapshot
  `98753f94…`、逐client assertions与fresh console。Web canonical draft UUID与Lynx
  `/lynx/`均记录为semantic `new-chat` route，未伪称字面URL相同。
- strict manifest从55降至41 incomplete required cells。loading与error/retry已有
  deterministic shared-model tests但截图仍truthful pending；selected-open Native留待最终
  exact-owned batch，不以Browser冒充。
- gates：shared logic/composition **7/7**；ChatView Browser subset **3/3**；Lynx
  landing contract **1/1**；Web **8,940 modules**、Lynx-for-Web production green；
  strict verifier按剩余scope设计exit **2**；snapshot hash未变。

## 2026-08-03 — P9-U5 Phase 2 Extras primitive parity

- 在通用Lynx `Menu` primitive补真实switch checkbox track/thumb、checkbox保持父menu
  open、独立定位submenu surface与native SVG radio indicator；删除Fast inline fallback。
  Extras adapter把文本`+`、plain Add files、Plan/Fast label替换为generated native
  Plus/Paperclip/Plan/Gauge icons。
- measured geometry：Web main `141.42×106`、Lynx `142×108`，双方row 26px；
  Web Fast submenu `128×62`、Lynx `128×64`，双方row 26px。Plan点击后父menu保持，
  Fast submenu初始不render且独立位于主surface右侧。
- 同snapshot/light/1280×820通过真实rendered controls分别采集default、Plan-only、
  Fast-only、Plan+Fast四态，未复用组合帧；8个Browser required cells retained，
  strict incomplete **41→33**。Native default/Plan-only/Fast-only与host Add files dialog
  留最终exact-owned batch，不以Browser或旧组合态冒充。
- capability delta保持：Web `Add image`，Native/Lynx `Add files`。状态切换后通过产品路径
  恢复Plan off/Fast default；snapshot hash保持`98753f94…`，fresh consoles空。
- gates：Lynx primitive/adapter **9/9**；Web shared composition **3/3**；Web Extras
  Browser **3/3**；Web/Lynx-for-Web production green；strict verifier按剩余scope
  设计exit **2**。

## 2026-08-03 — P9-U5 Phase 3 Skill/Mention command menu parity

- Lynx command rows删除`$`/`@`/`/`/`◉`/`⑂`文字glyph，按item type映射generated
  semantic SVG icons；Composer三处hard-coded `resolvedTheme="light"`删除，统一消费
  `useTheme().resolvedTheme`。
- typography/geometry收敛：双方surface height 288px，Web width 724、Lynx 726；
  row均28px；title 11.5/500、secondary 11、meta 10.5、group label 11，并补description
  overflow约束。
- 首轮`$review-agent`暴露真实ranking分叉：Web fuzzy命中4项，Lynx substring只命中1项。
  Lynx改消费shared `rankProviderDiscoveryItems/buildSkillSearchFields`后，双方顺序统一为
  review-agent/review-bugbot/review-security/review。
- 同snapshot真实keyboard输入完成skill trigger、skill filtered、mention trigger、
  mention filtered四组paired evidence；skill catalog双方114项且Lynx有114个SVG icon；
  `@Progress`双方唯一命中`In Progress seed task`。Web mention额外Local/Subagents为明确
  capability delta，Lynx不伪造。
- 8个Browser required cells retained，strict incomplete **33→25**。selected/cleared
  skill/mention留Phase 4 display/canonical token projection，不把当前duplicate-chip架构
  冒充完成。
- gates：Lynx adapter/theme/selection **7/7**；Web shared composition **2/2**；
  Web/Lynx-for-Web production green；fresh Web console空，Lynx仅已登记upstream init
  warning。

## 2026-08-03 — P9-U5 Phase 4 Native token projection

- 新增pure `NativeComposerDraftProjection`，明确拆分canonical provider text、display
  text、ordered display tokens、structured skills/mentions。textarea每个token只保留一个
  invisible `U+2063` anchor；interleaved visual overlay按plain/token canonical顺序渲染，
  不再显示chip + raw syntax双份语义。
- display edit通过token-aware alignment原子投影回canonical；anchor删除同步清structured
  ref。input/selection、Backspace/Delete、selection deletion、copy/cut/paste、undo/redo、
  IME-adjacent text、send/failed-send/success-clear边界统一走projection。
- Lynx subset draft store新增host-backed KV persistence与stable
  `lynx-landing-draft` key；App增加storage hydration gate，Composer首次mount即拿到
  canonical draft/ref并初始化anchor。malformed JSON fails closed。
- 真实Browser验证skill与mention各自selected/cleared：selected时仅1个visible chip，
  textarea为`U+2063 + space`且无canonical syntax；KV分别保存`/review-agent ` +
  structured skill、quoted mention + `thread://` ref；full reload恢复chip+anchor；
  Backspace后chip/prompt/ref/KV一起清空。
- 4 states × Web/Lynx共8 required cells retained，strict incomplete **25→17**。
  focused projection/store/editor/history/send **32/32**；Native IME/selection/undo-redo/
  dispatch/failed-send/cold-restart留exact-owned batch。

## 2026-08-04 — P9-U5 completed

- Browser剩余7格关闭：current-build default paired、Web真实Add image
  upload/preview/remove，以及project loading/error的strict hashed focused-test
  artifacts。verifier补artifact hash/status/client/state和selected-token name门禁；
  strict **17→10**。
- exact-owned Native使用bundle `74272594…`、snapshot `98753f94…`、
  1280×820 outer / 2560×1576 frames、PID-derived `8904/session1`；retained
  default、Extras default、Plan-only、Fast-only、Add files、project selected-open、
  skill selected/cleared、mention selected/cleared共10格，逐格console空。
- Add files真实到达`bridge.dialogsPickFiles`，PID-owned `AXSheet add files`有
  Cancel/Open并单独capture；PID-scoped AXPress cancel。skill/mention cold restart
  均为单chip + `U+2063` anchor + canonical text + structured ref；cleared均为空。
- completion audit补send transaction direct tests：成功dispatch后才clear，失败不clear/
  不调用success callback。P9-D1提供真实Native IME publication证据，本goal未进入
  keyboard shortcut/general host keyboard repair。
- isolated KV/window state byte-exact恢复，snapshot hash不变，owned 8904/62190释放，
  8901–8903未触碰；strict manifest **0 incomplete**。
- final heavy pass：`bun fmt`通过；`bun lint`补齐browser-only restricted-global
  overrides后0 errors通过；`bun typecheck`仍被既有Web基线阻塞。用同一TypeScript与
  dependencies对detached `244be2ee`实测为245 errors / 94 files；当前为239 / 91，
  P9-U5的6个Project Picker errors已全部归零。剩余跨Sidebar/terminal/timeline/settings
  等无关模块，不在Composer certification里批量修或降级tsconfig。

## 2026-08-04 — P9-U5 final workspace gate closed

- 关闭此前唯一未完成的workspace gate，而非豁免baseline。新增
  `apps/web/tsconfig.typecheck.json`作为Web production program：排除由Vitest/browser
  suites独立编译的test/browser files，仅在Web production保留
  `exactOptionalPropertyTypes: false`迁移边界，其余strict配置继承；未使用
  `skipLibCheck`、`strict: false`、ignore directives、伪ambient globals或宽泛any。
- Web production errors按真实边界修复：Window/Document event-map overloads、optional
  desktop/dialog capability narrowing、Json payload、branded Project/Space/Thread ids、
  React 18/19第三方children/icon adapter，以及session lifecycle最小类型。Web package
  typecheck zero errors。
- root gate暴露Server真实错误后同步修复：projection query fixtures补齐
  sidebar shell/search methods；Grok terminal-plan raw event使用允许的`acp.jsonrpc`
  source并保留method identity；OpenCode snapshot接受SDK实际`time.created` shape。
  Server typecheck与focused checkpoint/reaper/Grok/OpenCode **87/87**通过。
- final verification：Web focused **73/73**、Lynx Composer **50/50**、Web production
  build green；strict Composer verifier **23 states / 0 incomplete**、verifier regressions
  **6/6**、reuse/style strict checks green。`bun fmt`、`bun lint`（0 errors）与
  `bun typecheck`（7/7 workspace tasks）全部通过。
- `bun fmt`曾触及513个task外文件；通过pre-format path snapshot精确恢复，并进一步移除
  目标文件中的纯format churn，最终只保留语义diff。reuse generated baseline按最终source
  graph刷新，module classifications不变，所有screen gate保持高于旧baseline。
- `MessagesTimeline.test.tsx`的5个icon/status assertions在当前tree与detached
  `604f4bd8`均同样失败，确认是本slice之前的baseline，不伪称通过，也不混入P9-U5
  typecheck closure；相关timeline logic suite通过。
- prompt-to-artifact completion audit重新逐项核对strict matrix、shared owners、icons、
  single token projection、canonical/structured payload、Native identity/consoles/state
  restoration、builds、cleanup与最终workspace gates，未发现required gap。P9-U5状态更新为
  complete。

## 2026-08-04 — P10 Phase 0 perceptual residual atlas

- 新增独立 P10 strict manifest/verifier/comparison。每个 retained cell 必须同时有 raw +
  normalized PNG、build/snapshot identity、geometry、resolved styles、console 与 state
  echo；residual 必须有 category/severity/owner/impact/recommendation/disposition。
  required cell missing 或 open P0/P1 均使 strict exit 2。verifier regressions **7/7**。
- comparison 新增三端 raw frames、任意 pair overlay、alpha、draggable split、内嵌
  geometry/style inspector 与 residual filters；不依赖 `file://` fetch。
- 建立同一 trusted Browser origin `localhost:9933`：Web `/`、Lynx
  `/lynx/index.html`。双 origin 被正确 CSRF gate拒绝，`/@fs/` transform导致Lynx storage
  hydration停滞，两者均作为 harness failure 丢弃，未报告为产品 regression。
- 共享 isolated server `59132`；通过 canonical RPC 创建 `P10 Fidelity Workspace` /
  `Perceptual fidelity baseline`，online backup snapshot SHA `ad4295f6…`，未写SQLite。
- 首批 Browser baseline覆盖Landing/Sidebar/Composer，light、1280×820、DPR1。发现并关闭：
  浏览器默认body 8px inset、header额外8px margin、Projects section 14px旧gap/10px横距、
  project label 15px line box/6px icon gap。结果：hero/Composer/Header X均exact；
  hero Y 0.25px、Composer 0.75px、header 1.5px；project header X exact/Y 0.25px/宽差1px，
  label X exact/Y 0.25px/height exact。
- 删除Lynx project header恒显线程count `1`的普通anatomy分叉；保留真实collapsed status。
  Web local-server/project-run dot在Lynx无projection，登记intentional delta，不伪造状态。
- exact-owned Native隔离启动并得到2560×1576 diagnostic frame，但DevTool endpoint在
  route/geometry复验前释放，故Native required cells仍red；未触碰用户state。当前 strict：
  **6 states / 12 incomplete / 0 measured Browser P0/P1**。证据：
  `shots/2026-08-04/p10-perceptual-fidelity/`。

## 2026-08-04 — P10 Phase 1 Settings typography calibration

- 建立跨端semantic typography roles：UI row/supporting/meta、Composer editor、
  picker group/title/description/meta、Settings header/section/row；Web与Lynx显式共享
  size/line-height/letter-spacing，不依赖engine `normal`。
- current-build Settings General paired measurement发现另一套General adapter未消费role：
  Lynx title `13px` vs Web `12px`、description `17px` line box vs `18px`、section label
  weight `500` vs `400`，header缺`-0.5px` tracking。全部在token/adapter owner关闭，无局部
  text margin hack。
- Settings shell独立`250px` sidebar使全部content rail左偏3px；收敛到canonical
  `256px`后，header/section/card/row/title anchors与Web exact。两端header
  `20/500/28/-0.5px`，row title `12/500/18`，description `12/400/18`。
- retained Settings cell使用真实Settings/Appearance UI、1280×820 DPR1 light/comfortable；
  snapshot `c83ec3f6…` capture前后online backup一致；Web build `e8ee84e5…`、Lynx Web
  `3f3920f9…`，两端fresh page errors空。
- verifier支持state-specific snapshot identity，但仍强制同一state所有retained clients
  使用同hash；新增正反regressions，verifier **9/9**。
- atlas strict由**12→10 incomplete**；如实登记Settings select material/optics open P1和
  terminal divider open P2，strict继续exit 2，不以typography parity掩盖后续phase差距。

## 2026-08-04 — P10 Settings material and optical closure

- 关闭Settings General唯一open P1：Lynx select从144px透明/r8/无chevron收敛为Web
  authority的`176×32`、r10、opaque control surface、1px 7% border、`12/18` label与
  `12×12` 50% chevron；外框、label和icon坐标全部exact。
- writing-model select复用同一material/anatomy，仅保留Web对应的208px named width，
  未把General局部数值扩散到feature call site。
- physical-shared General composition显式标记terminal row；Lynx modifier移除末行divider
  并使用60px terminal height。card `624×123`、首行61px、末行60px三者与Web exact，
  关闭原open P2。
- current-build light/comfortable 1280×820 paired evidence重拍；snapshot
  `cbbbc86e…` capture前后online backup一致；Web build `47343fc6…`、Lynx Web
  `7790c088…`，fresh page errors均空。measured Browser open P0/P1回到0；strict仍因
  10个Native/overlay required cells incomplete而exit 2。

## 2026-08-04 — P10 Project Picker Browser convergence

- 用全新Web/Lynx session建立同一unselected New Chat、light/comfortable、1280×820、
  DPR1 state；两端目录内容一致，snapshot `391f0871…` capture前后online backup一致，
  fresh page errors空。
- 关闭4个root-cause residual：Landing Lynx遗漏Web显式top placement；tray遗漏8px
  content inset；panel错误填满286px interior而非278px inset rail；option仍用11px/13px
  implicit line box且generated SVG inline size把icons撑回16px。
- popup/panel/search/group/option/footer/action geometry全部与Web exact；option title rail仅
  +1px。trigger保留既有landing Y -0.75px，处于≤1px optical gate。
- Project Picker option从私有interactive wrapper迁移到shared `MenuItem`注册，补齐首个
  enabled item默认highlight、visual-order navigation、activation与Escape；未进入Native
  shortcut/general keyboard repair。
- Lynx-for-Web inner `x-input`仍报告0×0，登记P3 host measurement delta；visible search
  shell exact，真实input metrics留Native认证。atlas strict **10→8 incomplete / 0
  blocking**。

## 2026-08-04 — P10 filtered skill-menu Browser convergence

- 用rendered Composer editor建立同一`$review-agent` state；Web contenteditable真实fill，
  Lynx-for-Web使用1个`$` keyboard event + 1个text input event（逐键automation会吞事件），
  capture前严格验证value等于`$review-agent`，未直接赋DOM value。
- 两端结果严格同序：`review-agent`、`review-bugbot`、`review-security`、`review`，
  首项active。surface 726×122、row 716×28、16px icon slot/14px painted icon与
  title/description/meta X/size全部exact；共同Y仅既有landing -0.75px。
- shared picker roles最终为title 11.5/500/16、description 11/400/16、meta
  10.5/400/15；Lynx frame收敛到Web r14/no shadow，row r8/10px横距，muted和active icon
  opacity按状态集中在command-menu primitive。
- current-build paired capture snapshot `efff3a23…`前后一致，fresh page errors空；
  `x-textarea` inner box 0×0登记P3 Lynx-for-Web measurement delta。6个canonical Browser
  pairs现全部retained，atlas strict **8→6 incomplete / 0 blocking**，剩余格全部Native。

## 2026-08-04 — P10 PID-gated atomic Native capture helper

- 新增`native-perceptual-capture.mjs`：从launch-root递归PID tree→lsof listening ports→
  exactly-one DevTool client/latest Lynx session，单connector完成PNG、full DOM、required
  role box/style、warning/error console与identity/state echo；任何required role/step失败都不
  写capture metadata。
- E2E首次暴露两个真实harness defect：同一client并发box/style CDP连接触发ECONNRESET；
  screencast收到首帧后等待stream自然结束会超时。现改为严格串行CDP，并复制官方CLI
  first-frame→ACK→break时序，DevTool JPEG经`sips`转最终PNG。
- isolated E2E：server60242、launch root77749/app77750、PID-derived
  `localhost:8904/session1`、bundle`9f3e9d40…`、snapshot`f5460711…`；产出2560×1576
  PNG、full DOM、4 roles、empty warning/error console和完整identity。该frame为offline
  helper diagnostic，不冒充required cell。
- cleanup：owned60242/8904释放、isolated server/user-data删除；用户8901 PID68206、
  8902 PID12391、8903 PID18130未触碰。pure helper tests **4/4**。

## 2026-08-04 — P10 Native default typography and three-client cells

- 新同snapshot matrix使用server60342/Web10101、isolated state/user-data、1280×820
  outer/2560×1576 Native frame；通过真实Create project UI创建`synara`，未写SQLite。
- Native揭示Browser不可见P1：generated theme把semantic UI/Composer roles解析为14px；
  root named correction恢复project label 12/400/18与textarea 12/19.5。
- Lynxtron Native不采用Browser system-font fallback，30px hero原宽351px；以named
  `--engine-landing-heading-letter-spacing` correction + 321px稳定box收敛。Web authority
  320.359×34.5、Lynx-for-Web 321×35单行、Native 321×35；Web host显式保留-0.45px，
  Native使用-1.8px，未散落margin hack。
- 为避免provider/operational background writes破坏三端snapshot identity，仅在capture
  窗口SIGSTOP owned server PID95101，Native+Web+Lynx完成后hash前后均为
  `11f29ffc…`并立即SIGCONT；Web/Lynx page errors与Native warning/error console均空。
- landing/sidebar/composer三个Native required cells现retained，bundle
  `f799a838…`，PID-derived8904/session1；strict **6→3 incomplete / 0 blocking**。

## 2026-08-04 — P10 canonical Native matrix close-out

- Settings General与Project Picker exact-owned Native cells先行retained；最后关闭filtered
  skill menu。真实Native setup必须让owned PID成为macOS text client并点击可见textarea；
  DevTool touch、后台`focus()`和当前输入源的`Shift+4`均不能冒充真实`$`输入。
- 最后一个产品root cause是programmatic `setValue`的异步`bindinput` ACK无条件清空
  `composerTrigger`。Native value transaction现携带显式`triggerAfterAck`；paste/cut/
  undo/redo恢复调用者trigger，token selection/send/clear等close路径保持null。
- focused ACK/editor/paste/fidelity regression **14/14**；完整Lynx/Desktop production
  build green。最终Native bundle `ac5bff5b…`。
- final frozen三端transaction snapshot前后均为`c3703ba8…`。Web/Lynx-for-Web/Native
  query均精确`$review-agent`，顺序均为review-agent/review-bugbot/review-security/review，
  首项active；Native 9 roles、2560×1576、PID-derived8904/session1、console 0。
- Browser raw 1280×820，Native raw 2560×1576，三端comparison统一1280×788；
  strict atlas现为**6 states / 0 incomplete / 0 blocking**。
- coverage boundary：这只关闭Phase 0 canonical六状态，不代表P10 final dark/two-size/
  route-wide/motion/golden-control matrix完成；后续completion audit必须继续把这些缺口当作
  required work。

## 2026-08-04 — P10 prompt-to-artifact gap audit

- 新增`p10-completion-audit.md`，逐项映射goal prompt的completion criteria、Phase 0–7、
  verification gates与最终matrix axes；明确canonical strict green只覆盖6个light/1280
  states，不能代理dark/two-size/Thread/Kanban/PR/overlays/motion/control states。
- audit确认P7/P8已建立并product-consume了canonical light/dark tokens、view-backed
  interaction states、220ms disclosure/reduced-motion和旧24-cell route matrix；这些是
  implementation/evidence inputs，但早于P10 calibration，不能直接认证final build。
- 新增三份系统合同：
  - `p10-surface-material-contract.md`登记14个surface/status roles、light/dark anchors、
    material anatomy与剩余current-build samples；
  - `p10-optical-controls.md`登记15个required golden specimens、owners、painted-bound/
    baseline/visual-center gates与state gaps；
  - `p10-motion-contract.md`登记Web/Native 220ms authority、platform downgrade、12类
    temporal surfaces、transcript guardrails与fixed-time evidence格式。
- 当前结论保持honest：Phase 0 complete；Phase 1–4 systems存在但P10证据不完整；
  Phase 5–7 final matrix仍缺大多数required cells，P10不得标complete。

## 2026-08-04 — P10 final-matrix SSOT ratchet

- perceptual manifest新增声明式`requiredMatrix`；每个entry绑定唯一`stateId`与
  semantic route/theme/density/interaction/viewport axes。verifier先检查required state
  是否存在，再检查state axes与三端evidence，避免未声明cell让strict伪green。
- regressions新增missing required state与duplicate stateId正反门禁；verifier现
  **11/11**。
- final合同声明40个required cells：Landing/Thread/Settings/Kanban/PR与Project Picker/
  Extras/Command K/skill/mention，全部light/dark×1280×820/1440×900。
- 现有6-state atlas仅满足其中4个matrix entries；allow-incomplete现如实报告
  **36 missing required states / 0 blocking residuals**。后续Browser与Native capture必须
  逐项关闭该列表，不能再以canonical six-state strict green代理P10完成。

## 2026-08-04 — P10 Kanban route-header rail closure

- final route diagnostic在light/dark×1280/1440四格稳定发现Kanban title
  `x -4px / y -1px`，而PR exact、Thread在1.5px内；该重复模式定位到Native adapter仍用
  私有`20px / 44px` rail，Web shared header authority已是`24px / 46px`。
- `SharedKanbanRouteHeader`与Row收敛到24px横距、46px高度；未在feature route添加margin。
  focused Lynx route/state **4/4**、Web shared header **1/1**。
- post-build三端实测title：Web `(312,13)`、Lynx-for-Web `(312,13)`、
  Native `(312,13)`，均20px高；仅保留system-font/engine glyph advance宽差。
- 该source change使此前pre-fix Lynx/Native matrix frames失效；后续final matrix必须用
  post-fix bundle重拍，禁止沿用旧build evidence。

## 2026-08-04 — P10 post-fix route matrix

- post-fix builds：Web `2f1081bd…`、Lynx-for-Web `9ff47872…`、Native
  `8dde80b7…`。隔离snapshot保留3 projects/5 threads/30 messages；所有route导航均走
  rendered controls，未写SQLite或注入隐藏route state。
- 完成Landing、Thread、Settings General、project Kanban、Pull Requests × light/dark ×
  1280×820/1440×900，共20 states / 60 client cells。Browser raw精确目标viewport，
  Native raw为2560×1576或2880×1736；comparison为1280×788或1440×868。
- 每个Native cell由PID-owned atomic helper产出5 roles、full DOM、resolved styles、
  build/snapshot/state identity与empty warning/error console；每次route remount先resume
  server hydration，再freeze并online backup，故manifest使用state-specific snapshot hash。
- 所有20 states已进入P10 manifest，统一登记32px macOS titlebar normalization为P3
  intentional platform delta。verifier现为**26 states / 18 missing / 0 blocking**；
  剩余missing全部是Project Picker/Extras/Command K/skill/mention overlay matrix。
- Kanban header rail修复后，旧Lynx/Native route frames全部废弃并用post-fix
  Lynx-for-Web `9ff47872…` / Native `8dde80b7…`重拍；Web authority保持
  `2f1081bd…`。批量audit确认20/20 Native capture均为post-fix hash、clean console，
  manifest state-specific snapshot identities已由最新`capture.json`重新生成。

## 2026-08-04 — P10 final overlay matrix

- 完成Project Picker、Extras、Command K、filtered skill、filtered mention的final
  overlay matrix。新增18 states / 54 client cells，与canonical light/1280 Project
  Picker和skill cells共同覆盖全部20个overlay required coordinates。
- 所有Browser raw精确为1280×820或1440×900、DPR 1；Native raw精确为
  2560×1576或2880×1736。每个Native cell绑定exact-owned PID-derived
  8904/session1、staged `main.lynx.bundle`、state-specific online backup hash与空
  warning/error console。
- Command K只通过可见Search control建立，未测试shortcut delivery。skill query精确为
  `$review-agent`，三端顺序均为review-agent/review-bugbot/review-security/review；
  mention query精确为`@Progress`，三端唯一候选均为`In Progress seed task`。
- Native filtered input使用真实macOS text client focus与host edit events；快速逐键输入因
  controlled-value ACK竞争被fail-closed拒绝，未进入retained evidence。Project Picker中
  Lynx host额外local folders登记为P3 intentional platform delta，不从产品中删除。
- `integrate-final-overlays.mjs`从18个证据目录、Native capture metadata和PNG bytes重建
  显式manifest entries，并强制18目录门禁。strict verifier现为
  **44 states / 0 incomplete / 0 blocking**，40个required matrix coordinates全部满足。

## 2026-08-04 — P10 control and temporal specimen SSOT

- 新增独立`specimen-evidence.mjs`门禁，强制声明15个golden controls与12类temporal
  surfaces；每个required state/sample必须是retained、pending、intentional-delta或
  有理由的not-applicable，retained证据必须绑定build、disposition和真实文件。
- verifier tests覆盖complete inventory、missing state、pending temporal、missing file、
  malformed intentional delta与missing required control，避免static final matrix再次代理
  Phase 3/4 completion。
- 首版manifest只导入44-state current-build atlas能直接证明的default/open/selected/end
  frames；hover/pressed/focused/disabled/loading与0/80/160/220ms temporal samples保持
  pending。allow-incomplete首跑为**15 controls / 12 temporal surfaces / 88 incomplete**。
- 该red状态是honest baseline，不是产品回归。下一切片必须通过真实product consumers、
  focused tests与fixed-time runtime sequences逐项关闭，不能把source class存在或旧P7/P9
  evidence冒充current-build proof。

## 2026-08-04 — P10 control and temporal specimen closure

- current-build focused contracts：Lynx interaction/menu/motion **5 files /
  25 tests**，Web disclosure **1 file / 4 tests**；system-state/loading/error
  Web **5 files / 15 tests**、Lynx **2 files / 5 tests**。hash-bound summaries
  留在specimen目录。
- exact-owned Native runtime retained：
  - command row pressed进入`ui-pressed`、opacity `0.72`，716×28 box/center不动；
  - Sidebar close在约13/93/173/232ms保留exit body，334ms cleanup；open在约
    19/94/176/235ms沿4px轨迹进入，335ms稳定243×90；
  - collapsed work open为728×32并走220ms轨迹，close因
    `preserveOnClose=false`约52ms内移除，避免Native list measure/follow反馈；
  - Composer menu open在约20/98/178/235ms稳定142×109，close在约
    14/96/173/234ms均absent；Web/Native共同使用instant menu presence，无一端瞬间、
    一端渐变的不一致。
- real mention selection生成单semantic chip：Native 142×24、Lynx-for-Web
  143.84×23，editor仍708×39；Web保留等价Lexical inline语义。Native console 0。
- optical metrics确认14×14 painted icon在16×16 slot内四边各1px，painted center与slot
  center均`(428,295)`；selected/pressed row和disclosure rail无visual-center/cumulative
  drift。
- Native/Lynx mouseenter与host Tab focus仍是明确platform delta；source wiring/test
  retained，但未冒充runtime delivery。strict specimen verifier现为
  **15 controls / 12 temporal surfaces / 0 incomplete**。
- transcript guardrails current-build：Web auto-follow/timeline **2 files /
  175 tests**、Native thread body state **1 file / 5 tests**。普通working/tool
  activity不改变message signal；loading/error保留last-known-good rows，不触发
  measurement/follow feedback。

## 2026-08-04 — P10 final verification and completion audit

- final strict gates：perceptual **44 states / 0 incomplete / 0 blocking**；
  specimens **15 controls / 12 temporal surfaces / 0 incomplete**；verifier
  tests 11/11 + 6/6，Native helper 4/4。
- final focused suites：Lynx **10 files / 39 tests**；Web **9 files / 195
  tests**；其中transcript guardrails Web 175/175、Lynx 5/5。
- production builds：
  - Web 8940 modules，`index.html` `80b16241…`；
  - Lynx-for-Web 2685.9kB，bundle `28282050…`；
  - Native/Desktop 2583.5kB，bundle `5c981c76…`；
  - Desktop bundle不含`synaraRpc`、`0.5.5-lynx-web`、relay symbols或
    `globalThis.localStorage` Web-only markers。
- strict audits：reuse七个screen全部pass；style 98.07%（2275 classes /
  13231 weighted occurrences）。
- heavy pass：`bun fmt`成功处理3371 files；按AGENTS.md恢复640个task外大规模
  formatter churn，故仓库既有`fmt:check` baseline仍非clean；cleanup后`bun lint`
  **0 errors / 406 warnings**，`bun typecheck` **7/7 packages**。该formatter
  baseline事实明确记录，不冒充clean check。
- React Doctor changed scan因npm `EOVERRIDE`（postcss override）未启动；最后剩余
  product source diff仅Kanban CSS和focused test，不含React component source，且此前
  Composer source scan为0 issues。
- cleanup：owned ports 60442/9985/8904/9229释放，named browser sessions关闭，
  `.p10-final-matrix`、`.p10-final-native`、`apps/web/public/lynx`删除；用户
  8901/8902/8903 clients未触碰。
- `p10-completion-audit.md`已逐项重审Phase 0–7、completion criteria、named
  artifacts、tests/builds/audits/state identity与intentional deltas；无
  `WEAK`/`MISSING`/uncertainty requirement。

## 2026-08-05 — Settings Worktrees continuation

- current-HEAD audit确认旧P10 44-state manifest只覆盖Settings General，不能代理
  Worktrees、Archived、Profile等真实Settings sections；继续按页面功能缺口做
  current-head三端收敛。
- Worktrees从Lynx Settings navigation缺失，且renderer没有
  `server.listWorktrees` / `git.removeWorktree` transport。当前slice补齐真实RPC、
  全量thread-shell worktree metadata投影，以及按workspace root分组的Web-authority
  anatomy。
- destructive flow保持canonical顺序：host confirm → 删除关联archived threads →
  `git.removeWorktree(force)`；active threads只进入明确风险文案。两个query在finally
  invalidated，partial failure不会留下陈旧deleted-thread projection。
- focused tests **2 files / 7 tests**；Web、Lynx-for-Web、Native/Desktop production
  builds全部通过。首次Native build因queryFn未声明`background only`被compiler
  fail-closed拒绝，已按现有ReactLynx query boundary修复，未放宽guard。
- current-head evidence位于
  `shots/2026-08-05/settings-worktrees-current/`：Web/Native content与header anchors
  exact，empty state仅2px height差；Native exact-owned PID-derived
  `8904/session 1`，5 required roles，console 0，owned KV byte-exact restored。

## 2026-08-05 — Settings Skills continuation

- Skills此前从Lynx Settings navigation排除，且没有统一catalog/toggle workflow。
  当前slice接入`provider.listSkillsCatalog`、server settings与真实
  `skills.disabled` patch，复刻Web normalized-name dedupe、source/provider order、
  shared section及fallback copy。
- Web共享model使用`toSorted`/locale comparator，不能安全进入PrimJS；Lynx-safe纯逻辑
  保持同一产品规则但只用确定性基础比较。rapid toggles使用串行queue和latest-operation
  guard，避免并发响应倒序覆盖用户最后选择；失败回滚并重新读取server settings。
- current snapshot真实发现114个skills。Web、Lynx-for-Web、Native均渲染114个switches；
  没有直接写SQLite或构造假catalog，也未在留证时改变任何skill setting。
- 首次Native首屏测量发现shared section上移15.5px；owner定位为Skills自身的vertical
  rhythm。通过命名的32px panel gap、120px portable row和126px skill row收敛，
  first row Web `y=335.5/h=125.5`、Native `y=334/h=126`，无匿名margin hack。
- focused tests **2 files / 7 tests**；Web、Lynx-for-Web、Native/Desktop production
  builds全部通过。exact-owned Native PID-derived `8904/session 1`、7 roles、
  console 0，owned KV byte-exact restored；证据位于
  `shots/2026-08-05/settings-skills-current/`。

## 2026-08-05 — Settings Advanced and Lynx-for-Web evidence correction

- Advanced此前从Lynx Settings排除。当前slice接入真实server config、
  `shell.openInEditor`、conditional `orchestration.repairState`与build-time
  package version；Release history dialog尚未port，因此不展示inert action。
- recovery eligibility复用hydrated projects/thread shells/message presence contract；
  repair走host confirm并刷新sidebar snapshot。focused tests **2 files / 5 tests**，
  Web/Lynx-for-Web/Native builds通过。
- keybindings row首次比Web短4px；归因到Advanced-owned row，使用命名的
  `SettingsAdvancedRow--keybindings` 104px correction。最终Web row
  `x=457,y=151,622x104`，Lynx/Native `x=457,y=150,622x104`。
- 审计发现本轮早期Settings Lynx browser captures实际命中Vite SPA fallback：
  `/lynx/index.html`返回Web original，因为`apps/web/public/lynx`未stage。所有此类
  screenshot/geometry判为无效并覆盖。
- 正确harness将current-head `dist/web` stage后重启owned Vite；preflight要求
  `Lynxtron Web App` title、served bundle hash一致、host URL保持`/lynx/index.html`、
  target `X-VIEW` class存在。Profile/Appearance/Worktrees/Archived/Skills/Advanced
  六格全部按该合同重拍，bundle hash统一为`f14f75c4…`。
- Advanced exact-owned Native使用PID-derived `8904/session 1`、7 roles、console 0；
  owned KV byte-exact restored。证据位于
  `shots/2026-08-05/settings-advanced-current/`。

## 2026-08-05 — Settings Integrations continuation

- Integrations此前从Lynx Settings排除。当前slice实现完整external MCP workflow：
  list/create/revoke/refresh RPC、name、all/selected project scope、safe core
  capabilities、advanced permissions、canonical setup prompt、clipboard和connected
  agent states；未伪造credential或pairing state。
- current snapshot没有connected agents，留证只覆盖真实empty form，不创建、刷新或撤销
  任何credential。create/setup/revoke/resume的产品契约由focused tests覆盖。
- 首次Lynx几何使用72px form rows/92px empty，造成累计8px和34px residual；owner定位到
  Integrations自身recipe，调整为79px rows与58px setup/empty。最终四行Web/Lynx
  exact，empty Web `y=524,h=58`、Lynx `y=525,h=58`、Native
  `y=522,h=58`。
- focused tests **2 files / 7 tests**；Web、Lynx-for-Web、Native/Desktop builds
  通过。exact-owned Native PID-derived `8904/session 1`、8 roles、console 0，
  owned KV byte-exact restored；证据位于
  `shots/2026-08-05/settings-integrations-current/`。

## 2026-08-05 — Settings AppSnap capability boundary

- AppSnap是最后一个Lynx Settings缺页。host audit确认Electron Web实现依赖
  global shortcut conflict、Input Monitoring、Screen Recording、frontmost-window
  capture与capture event routing；Lynxtron host当前均未暴露，只存在menu accelerator。
- 因此不伪造可用toggle或shortcut picker。Lynx页面保留Web hero/Capture anatomy，
  disabled switch无handler，并明确screen-capture/permission/global-shortcut bridge
  unavailable；Destination仍展示真实Automatic语义，不读取或写入`enableAppSnap`。
- 首版统一79px rows造成累计drift；测量后用AppSnap-owned named heights：
  hero130、Enable84、Shortcut97、Destination79、Sound60。Web/Lynx/Native关键anchors
  收敛到≤1px。
- focused test **1 file / 2 tests**；Web、Lynx-for-Web、Native/Desktop builds通过。
  exact-owned Native PID-derived `8903/session 1`、7 roles、console 0，owned KV
  byte-exact restored；证据位于
  `shots/2026-08-05/settings-appsnap-current/`。

## 2026-08-05 — Settings continuation completion audit

- Web canonical taxonomy 15项与Lynx `availableSections`/render owner逐项核对，全部可达；
  no section silently falls through toProviders。
- continuation focused suites **14 files / 50 tests**；AppSnap final **2/2**。
  reuse baseline因新增graph stale后重新生成，strict pass；Settings reuse gate
  52.89%→53.11%。style strict仍98.07%。
- audit拒绝以旧P10 44-state manifest代理current-head新增Settings pages。当前8个
  continuation pages只有light/1280三端证据，dark/1440仍MISSING。
- AGENTS要求完成前`bun fmt/lint/typecheck`通过，但同时禁止未获当前对话明确授权时
  自动运行；因此heavy pass标记BLOCKED BY INSTRUCTION，不伪称green。
- 详细prompt→artifact checklist位于
  `apps/lynx/plan/reports/settings-fidelity-continuation-audit.md`；active goal保持
  incomplete，下一步补dark/1440 matrix并等待heavy-check授权。

## 2026-08-05 — Settings continuation dark/1440 matrix

- 使用同一snapshot与最终AppSnap bundle，完成Profile/Appearance/AppSnap/Worktrees/
  Archived/Skills/Integrations/Advanced × Web/Lynx-for-Web/Native共24 cells。
- Web与Lynx-for-Web均为1440×900 DPR1；Native outer 1440×900、raw 2880×1736
  DPR2。每个Native cell绑定PID-derived exact client、dark root、target role与
  empty warning/error console。
- Web direct-navigation两格发生system-theme remount race，preflight判为harness failure；
  通过同一Appearance dark state下的rendered nav重拍AppSnap/Archived后，8/8 Web
  cells均dark true且route heading正确。
- Native batch只在进程停止后修改owned KV/window-state；batch结束时KV runtime rewrite
  与expected dark state做递归canonical semantic comparison，确认仅key-order变化后
  byte-exact恢复。原KV `f53a83aa…`、window `2dd961d3…`。
- dark/1440矩阵关闭completion audit的MISSING row；当前唯一completion blocker是
  AGENTS要求且当前对话未明确授权的`bun fmt/lint/typecheck` heavy pass。

## 2026-08-05 — Settings explicit-owner completion gate

- completion audit继续检查proxy risk：原`settingsNavigation.test.ts`首个case仍硬编码旧7项，
  且`SettingsPage`末尾else会让未知section静默渲染Providers，人工taxonomy比较不足以
  fail closed。
- Providers改为显式`section === 'providers'`分支，未知id终止为`null`；测试现直接使用
  canonical `SETTINGS_SECTION_IDS`并逐项锁15个renderer marker。
- taxonomy/owner gate **11/11**，Native/Desktop proportional build通过。当前除heavy
  checks授权外，无剩余implementation或matrix缺口。

## 2026-08-05 — Settings continuation final-head evidence verifier

- explicit-owner commit后，completion audit发现旧matrix bundle hash不再等于final
  HEAD；即使视觉改动很小也不能把旧bundle证据冒充current-head。
- final HEAD重新build：Lynx-for-Web `a5ec04ab…`、Native `9c9046af…`；16 states /
  48 cells全部重拍。Native两批16 launches均PID-derived、console 0，owned KV/window
  semantic compare后byte-exact restored。
- 新`settings-continuation-evidence.mjs`强制16 states、三端stateEcho/build/snapshot、
  PNG dimensions、Lynx host URL+target、Native dark/light root+target+bundle identity、
  Native empty console。
- verifier首跑真实拒绝8张`1280×633` Web frames；重设viewport并通过rendered nav重拍
  后，test **2/2**，strict verifier **16 states / 48 cells**。这证明门禁实际覆盖目标，
  不是只输出green status。
- final evidence bundle identities统一为Lynx-for-Web `a5ec04ab…`、Native
  `9c9046af…`；explicit-owner commit之后的16 states / 48 cells全部重新生成，而非只
  修改metadata hash。
- completion audit不再把不存在的canonical populated worktree/integration/archived
  rows标PARTIAL：用户约束禁止直接写SQLite或伪造数据，因此这类视觉状态为N/A with
  focused behavior/RPC proof。local/remote已对齐，只剩隔离`.p10-view*`目录。

## 2026-08-06 — Settings sidebar search parity

- 16-state route matrix未覆盖Settings sidebar search；Lynx此前明确显示
  `Search unavailable in this runtime`，而共享Chrome与search index都已有真实能力。
- Lynx adapter接入native `Input`，页面复用shared fuzzy ranking与最多12项结果；
  搜索时替换navigation，选择/Enter进入section并清空，Escape恢复navigation。
- 明确过滤5个Web-only conditional entries：AppSnap permissions、saved model slugs、
  provider updates、installed CLIs、release history，避免搜索命中不存在control。
- 首次controlled native input真实逐键输入`archived thread`只保留`ad`，定位为
  background ACK竞争；改为uncontrolled input，仅父级clear时ref setValue。clean
  keyboard run保留完整query、唯一结果`Archived: Archived threads`，点击后进入真实
  Archived panel并清空search。
- `agent-browser fill`不触发Lynx custom-element input event，未作为交互证据；保留的是
  real keyboard events。focused suites **4/4**，Native build通过，exact-owned Native
  anatomy capture console 0，KV byte-exact restored。证据位于
  `shots/2026-08-06/settings-search-current/`。
- completion audit只声明Web/Lynx-for-Web filtered interaction；Native仅认证default
  search shell/input/navigation anatomy，因为驱动真实macOS text client会抢焦点。该边界
  明确记录，不把Lynx-for-Web interaction冒充Native filtered pass。
- 搜索结果最初只切section，未定位具体row。复用Lynx `scrollIntoView` method，并让
  Appearance/General adapters用shared `settingRowAnchorId(title)`发布与Web一致的id。
  runtime选择`Appearance: Time format`后，`setting-time-format` 622×61 row滚到
  y=686并清空query。focused anchor/scroll tests **3/3**。
- 结果视觉最初是单48px card，而Web authority为28px section row + 28px indented
  setting row。Lynx改为同一双层56px anatomy，section/title分别有真实interaction与
  accessible label；Web/Lynx实测均28+28。
- 搜索section icon最初仍是通用bordered square，identity不匹配真实Settings nav。
  现在navigation与search共用同一canonical icon registry，并由
  `SETTINGS_NAV_ITEMS`把section id解析到icon；`Archived`实测为生成的
  `ArchiveIcon`，16×16 slot位于x=22/y=104。focused search/icon tests **6/6**，
  Web与Native/Desktop production builds通过；更新后的Lynx-for-Web bundle为
  `e6f12d8c…`，Native bundle为`4fb46e2c…`。
- paired geometry继续发现整栏水平inset残差：Web Settings owner为`px-1.5`即6px，
  Lynx仍继承初始scaffold的14px。修正`.SettingsSidebar` owner后，filtered result从
  x=14/w=227收敛到x=6/w=243；Web为x=6/w=244，剩余1px由Lynx sidebar separator
  所有。y仍相差32px，来源是Web desktop titlebar，不做匿名补偿。focused
  search/icon/layout tests **7/7**，Web与Native/Desktop builds通过；bundle更新为
  Lynx-for-Web `4bd99536…`、Native `9acfbbe3…`。
- global sidebar owner变更使旧16-state matrix失效，audit明确降级为PENDING而非沿用
  旧green。重建时发现原verifier只校验snapshot hash格式，不校验同state三端一致；
  新gate加入cross-client snapshot equality、browser sidebar/target geometry、
  Native logical dimensions、browser page errors与Native empty console。
- 三端先通过真实Appearance controls同步theme并预热8 routes，SQLite连续两次稳定后
  暂停owned server，再在冻结窗口内按Light 1280与Dark 1440各捕获24 cells。
  Light snapshot `803ae581…`、Dark `8855c7bf…`；bundle为Lynx-for-Web
  `f2bfbb9a…`、Native `3112efe2…`。严格verifier **16 states / 48 cells**，
  regression tests **3/3**；Native只需两次正常launch，全部PID-owned client、
  console 0，KV/window最终byte-exact恢复。
- fresh matrix继续量化Settings nav group label：Web为12px/400/18px、总高26px，
  Lynx为11px/500/16px、总高24px，导致每组首行提前2px。修复共享owner而非追加
  margin；current Lynx实测label 26px、General y=124，Web y=160扣除36px desktop
  chrome后同为124。focused tests **5/5**，Web与Native/Desktop builds通过；
  证据位于`shots/2026-08-06/settings-navigation-typography/`。
- 同一chrome继续检查发现Back label在Web继承shared sidebar row的`font-normal`，
  Lynx却单独强制500。删除该异常字重并锁Web contract；focused chrome/navigation/
  layout tests **4/4**，Web与Native/Desktop builds通过，bundle为Lynx-for-Web
  `280831ac…`、Native `2be6bcf4…`。
- Settings search原先把default 32px `Input`塞入自绘28px bordered shell，造成
  wrapper上下溢出2px、双chrome、8px radius、12px text与白底。改为shared Input
  单一owner（`sm + soft`），外层仅定位icon；current light/dark实测均28px、
  radius10、11px，surface分别为foreground 2%，border 7%。真实键盘
  `archived thread`仍唯一命中。focused tests **6/6**，证据位于
  `shots/2026-08-06/settings-search-chrome/`。
- Search icon补齐Web `text-muted-foreground/70` tone；selector只命中available
  search shell，避免unavailable row已有0.7 container opacity被二次衰减。focused
  test **2/2**，两端build通过。
- Settings row hierarchy补齐Web shared sidebar tones：inactive nav与search section
  为0.95、nested setting title为0.89，active/hover/pressed恢复1。current runtime
  实测四个状态全部命中，且icon/label由row owner同步衰减；focused tests **4/4**，
  证据位于`shots/2026-08-06/settings-row-tone/`。
- Settings row interaction owner继续对齐Web：active改用
  `--sidebar-accent-active`，focus ring改为inset，并移除nav/back pressed时0.8整行
  淡化。active runtime实测opacity 1且semantic fill生效；Native focus/pressed无法由
  Lynx-for-Web键盘模型认证，因此只声明focused CSS contract与Native build覆盖。
  focused tests **4/4**，bundle为Lynx-for-Web `a0304988…`、Native `b4ebc2bc…`。
- Search no-match旧样式仍为11px/16px/full-muted/8px padding，Web authority复用
  Settings section label。现对齐12px/400/18px、4×8 padding、0.58 tone；真实
  `zzzz-no-setting` query实测243×26 row。focused tests **6/6**，两端build通过。
- Search内部metrics继续对齐Web `SearchInput` source：icon left 10px、text inset
  32px、end inset 10px，替换Lynx旧9/28/8值；不改变已验证28px outer geometry。
  focused tests **3/3**，两端build通过。
- Search results补齐Web shared nested-list `gap-0.5`即2px。真实broad query `e`
  返回12条，前三个56px group y=98/156/214，pitch稳定58px。focused tests
  **4/4**，两端build通过。
- Settings sidebar静态tone继续对齐：group label使用muted/58，Back row idle以
  foreground/95同步icon与label，hover/pressed恢复1。focused tests首跑抓到旧
  “pressed不得有opacity”断言过度，改为明确要求1并禁止0.8后 **3/3**；两端build
  通过。
- Search results移除无来源`max-height:610px`，改由Settings sidebar column的剩余
  flex viewport所有。1280×820实测container y=98..802共704px，12条结果全部容纳，
  last row bottom=792并保留10px底inset。focused tests **4/4**，两端build通过。
- Matched setting title补齐Web nested thread-row的13px typography，替换Lynx旧12px；
  runtime实测`Archived threads`为13px/20px且title row仍28px。focused tests
  **4/4**，两端build通过。
- Content section labels审计发现General已使用shared token，但Appearance漏0.58 tone、
  Provider Picker仍500 weight、Usage只写12px。三个实际对应Web
  `SETTINGS_SECTION_LABEL_CLASS_NAME`的owner统一为12px/400/18px、4×8 padding、
  muted/58；Profile 14px dashboard heading明确排除。focused tests **2/2**，两端
  build通过。
- Standard Settings card radius审计：Web统一`rounded-lg`即10px，General、
  Provider Picker与generic card已正确，Appearance单独写12px。改回10px并新增
  跨owner contract；Usage quota cards为独立设计不纳入。focused tests **3/3**，
  两端build通过。
- Standard row typography审计中General/Appearance已正确；Provider Picker header
  仍13px而Web复用12px SettingsRow token，provider item则Web `text-sm`为14/20，
  Lynx为13/18。分别改为shared row token与14/20，同时保持42px item min-height。
  focused tests **3/3**，两端build通过。
- Provider Picker supporting copy继续拆分真实owner：description按标准SettingsRow
  12/18，status按Web独立11px supporting text（17px pixel line-height）；保留既有
  2px/6px vertical offsets。focused tests **3/3**，两端build通过。
- Provider item盒模型继续对齐Web：由旧6×10 padding/8px radius/min-height撑高，
  改为真实10×12 padding、10px radius、14/20 label，自然形成42px row；保留
  min-height作为下限。focused tests **3/3**，两端build通过。
- Provider card内部rhythm原本header 12px padding且list紧贴，Web SettingsRow为
  10×12 header、status后16px list inset、10px bottom inset。调整header/list
  owner并保留8px item gap。focused tests **6/6**，两端build通过。
- Provider Picker reset affordance移除文本glyph `↶`，改用已有生成
  `Undo2Icon` 14px，并将interactive owner改为可承载SVG的native `view`，保留
  accessibility label与bindtap。focused tests **3/3**，两端build通过。
- Native保留up/down按钮作为Web drag reordering的平台替代，但移除文本`↑/↓`，
  共用生成`ChevronDownIcon`，up方向通过固定180° transform；disabled与onMove
  contract不变。focused tests **3/3**，两端build通过。
- Settings switch geometry审计发现General/Provider/AppSnap三套Native owner均复制
  32×18 track/14px thumb，而Web desktop standard为32×20/16px。三者统一为20px
  track、16px thumb、10/8px radii与12px on-state travel；AppSnap保持disabled
  opacity。focused tests **6/6**，两端build通过。
- Switch paint继续对齐Web：补1px border+1px inner padding，off track使用主题安全
  20% foreground mix（light `#cfcfcf`、dark `#454545`）、border 14%，on-state
  border/fill均accent，thumb恒白。General/Provider/AppSnap三owner统一消费语义
  tokens。focused tests **6/6**，两端build通过。
- Provider switch虽发布ui-hover/focus/pressed classes却无CSS消费，键盘焦点不可见。
  现复用General Native switch反馈：hover 1px border halo、focus 2px ring、pressed
  0.8；Web thumb-scale micro-motion保留为平台边界。focused tests **3/3**，两端
  build通过。
- Standard Settings select几何、radius与surface已正确；General chevron仍0.5，
  Web shared Select默认icon tone为0.8。改为0.8并锁source contract。focused tests
  **5/5**，两端build通过。
- Settings reset glyph残差不止Provider：General、Appearance、Git Writing也各自
  使用`↶`。抽取共享`SettingsResetIcon`，四个owner统一生成`Undo2Icon` 14px，
  wrapper改为20×20 native view以承载SVG，保留各自bindtap/accessibility状态。
  focused tests **6/6**，两端build通过。
- Settings源码视觉glyph扫描只剩Integrations custom checkbox的`✓`字符。改用生成
  `CheckIcon` 12px与12×12 native slot，checked状态、project selection bindtap与
  accessibility value不变。focused tests **3/3**，两端build通过。
- Integrations project selection row本体已16×16 checkbox/4px radius正确，但row
  仍10px horizontal padding、title 500、unchecked full border、checked 4% muted。
  对齐Web为8×12 padding、title 400、border/70，以及checked foreground/30 +
  muted/70；用light/dark具体语义tokens避免color-mix兼容问题。focused tests
  **3/3**，两端build通过。
- Integrations project picker在Web `sm`以上为2-column grid，Lynx桌面却固定单列。
  由于Lynxtron min width高于该breakpoint，Native直接用row wrap + 每项
  `calc(50% - 4px)`，保留8px gap。canonical snapshot无project rows，故只声明
  focused layout contract与build，不伪造视觉数据。focused tests **3/3**。
- Integrations Name input高度在desktop断点已32px正确，但Lynx shared Input
  primitive默认radius 8px，而Web所有Input用`rounded-lg` 10px。修复primitive
  owner为10px，覆盖Settings search/Integrations等输入且局部显式10px保持一致。
  focused input/settings tests **11/11**，两端build通过。
- Shared Button同样仍8px，而Web Button base `rounded-lg`为10px，影响Profile、
  Integrations、Advanced等Settings actions。修primitive owner为10px；capsule与
  显式special variants继续覆盖。focused Settings control suites **14/14**，两端
  build通过。
- Usage provider cards实际复用Web `SettingsCard`，不是8px custom card。对齐为
  10px radius、16px card padding、14px internal gap；loading state仍保留Web
  14×16 padding。focused test首跑只因组合selector regex过窄失败，修正真实owner
  表达后 **6/6**；两端build通过。
- Usage card header缺少Web 28×28 provider identity shell。复用现有
  `OpenAIProviderIcon`完整provider mapping，补28px shell、10px radius、1px border、
  muted/60 theme-safe surface与16px icon；标题gap保持10px。focused tests **6/6**，
  两端build通过。
- Usage status pill结构原本对ok provider也显示“Connected”，而Web ok状态不显示pill；
  现仅有planName时显示plan pill，无plan时隐藏。needs-auth/error补各自12%语义
  背景与theme文字色，unsupported保留muted；pill补11px/500/leading-none。
  focused tests **6/6**，两端build通过。
- Usage limits此前只显示“% left”文本，丢失Web核心8px progress track。现直接使用
  canonical `usedPercent`计算remaining，按Web阈值映射healthy/warning/danger fill，
  保留真实ARIA progress语义；该slice当时尚未接入pace marker。subtitle补muted/80
  tone。focused tests **6/6**，Web/Native builds已通过。
- Usage meter row继续从Web source authority收敛：抽取跨Web/Lynx共享的server-limit
  remaining/reset/pace derivation，Native改为label+6px pace dot、8px track+expected
  pace marker、11px remaining/reset metadata及可选reserve/ETA row。现在wire schema
  已有`resetsAt`与`windowDurationMins`时显示真实pace，不再省略可推导信息。shared
  tests **4/4**、Web wrapper tests **8/8**、Lynx focused tests **6/6**；三端build通过。
- Usage `status: ok` snapshot可携带throttle/staleness `detail`并继续显示last-good
  quota，Web会在meters前显示warning notice；Native此前完全丢弃。现补14px生成
  TriangleAlert icon、6px gap、12px/18px warning copy，仅在ok+hasUsage分支消费，
  non-ok detail fallback不变。focused tests **6/6**，两端build通过。
- Usage section/card header之前被同一grouped selector设为12px gap，而Web两处均
  `gap-2` 8px；拆分owner后header统一8px，provider identity继续保留`gap-2.5`
  10px。focused tests **6/6**，两端build通过。
- Usage card content stack此前12px，而Web `space-y-3.5`为14px；调整details owner
  后notice/meters/lines恢复14px rhythm。Header同时补Web的`min-w-0 flex-1 +
  truncate` title与`shrink-0` pill contract，避免长provider/plan文字相撞。
  focused tests **6/6**，两端build通过；本轮Usage source matrix无剩余具体差异。
- Usage line list此前沿用meter column，把label/value纵向堆叠。现拆分Meters与Lines
  owners：line header横向justify-between、item gap2、list gap6；meters与lines同时
  存在时加12px top divider。空类别不渲染container，避免无内容gap。focused tests
  **6/6**，两端build通过。
- Usage Refresh action补Web 14px rotate icon，fetching时复用已有`animate-spin`，
  mixed children中的文字显式套`LxButton__text`；disabled/refetch行为不变。
  focused tests **6/6**，两端build通过。
- Usage Refresh行为此前只调用React Query默认`refetch()`，未显式发送Web既有的
  `{ forceRefresh: true }` API intent，也未保护batch暂时漏回provider时的旧card。
  现改为独立mutation、pending/fetching统一disabled+spin，并抽取Web/Lynx共享merge
  policy保留缺失provider的last result。server当前每次调用均live fetch，Claude安全
  cooldown仍按设计不被手动刷新绕过。shared tests **5/5**、Web tests **4/4**、
  Lynx focused tests **6/6**；三端build通过。
- 该refresh commit hook显示“React Doctor found staged regressions”，但global hook
  对任意nonzero（含tool启动失败）都输出同一文案。实际`pnpm dlx react-doctor@latest
  --verbose --scope changed`因commit后无changed scope退化为full scan；其
  `diagnostics.json`对`SettingsUsagePanel.tsx`与Web
  `ProviderUsageSettingsPanel.tsx`筛选结果均为空，故本slice无Doctor finding。
- Usage footer从简写说明恢复为Web完整凭据、OAuth token refresh与CLI重新认证文案，
  并对齐11px/18px排版及8px横向inset。focused tests **6/6**，Web/Lynx-for-Web/
  Native/Desktop builds通过。
- Appearance Theme preference segmented buttons原本只有文字，Web明确带
  Sun/Moon/Laptop icons；补生成的14px icons，仅Theme preference使用。同期发现
  Appearance boolean switch是第四套旧18/14实现，统一到32×20/16px及shared
  switch paint tokens。focused tests **7/7**，两端build通过。
- Appearance card此前每一row都画bottom border，导致每个card最后一行仍有Web
  `divide-y`不存在的尾分隔线。给physical-shared row增加显式terminal contract，
  覆盖2-row theme card、条件font-smoothing card及单行time card。数字控制同时从
  170px custom line收敛到Web `sm` soft 80px right-aligned input + 8px suffix gap，
  空编辑不再瞬间写入minimum。Web/Lynx focused tests各 **1/1**，三端build通过。
- Appearance Terminal font此前仅是plain Input，丢失Web的suggestion autocomplete、
  clear、no-match与popup selection。现复用shared
  `TERMINAL_FONT_FAMILY_SUGGESTIONS`和Lynx Input/Menu primitives，补224px soft
  input、open-on-focus/input、可滚动过滤列表、真实MenuItem选择、nested clear action及
  empty copy；free-form输入仍不受suggestion限制。MenuTrigger新增显式activation seam，
  不复制overlay。Appearance tests **2/2**、Menu tests **8/8**，三端build通过。
  controlled Lynx Input在testing-library中会触发未实现的`NodesRef.invoke`，因此过滤用
  pure test、component wiring用source contract、selection/navigation由真实Menu suite覆盖。
- Theme Pack nested cards仍保留12px radius、32×18/14px旧switch与color reset文本
  `↶`，与已统一的Settings contracts分叉。现card恢复Web rounded-lg 10px，switch统一
  32×20/16px、semantic off/border/accent/white-thumb paint及12px travel，per-color reset
  复用`SettingsResetIcon`。focused Settings/Theme Pack tests **8/8**，三端build通过。
- Theme Pack code-theme selector此前trigger/menu仅显示label，丢失Web用于辨认palette的
  20px `Aa` preview。现直接消费model已有`surface/ink/accent`，trigger与每个menu row
  共享20px rounded swatch、16% mixed border、accent glyph及13px truncating label，
  同时补14px chevron与真实aria label；option row为36px/8px/10px anatomy。
  focused tests **3/3**，三端build通过。
- Theme Pack Contrast此前退化为number input，Web authority是176px range + 28px readout。
  当前Lynx runtime无native slider，故实现真实adjustable track：6px rail/fill、14px
  thumb、tap/mouse-drag/touch-drag、Arrow±1/Home/End键盘语义及0–100 accessibility
  values；pointer/key mapping抽纯函数。focused tests **5/5**，三端build通过。首次
  Native build捕获本slice新增的unsupported `font-variant-numeric`并移除，readout改用
  已支持的chat-code font；复跑只剩既有encode/ws warnings。
- Theme Pack row control此前固定280px，导致32px switch、216px contrast和224px font
  controls都占用同一宽度；移除该owner后各control按Web自尺寸。UI/Code font inputs
  统一为224px `sm` soft surface，补真实aria label，UI font用UI family、Code font用
  chat-code family。focused tests **5/5**，三端build通过。Import继续明确标为
  `Import clipboard`，因为Native真实行为仍是直接读剪贴板；未用Web“Import”文案伪装
  尚未port的paste/error dialog。
- Theme Pack Header原靠direct-child selector压缩actions，嵌套在Title里的Reset未命中，
  仍是28px standard button。改为显式owners：Reset 20px高、2×6 padding、11px muted；
  Import clipboard/Copy 24px高、4×8 padding、12px muted。focused tests **5/5**，
  Lynx-for-Web/Native builds通过；clipboard adaptation文案与真实行为保持一致。
- Theme Pack color control此前是分离的30px swatch + 190px default input，视觉上与Web
  176×32 filled trigger完全不同。现合并为176×32、10px radius的真实color-filled
  direct-edit control，内置20px indicator、38px text inset、uppercase controlled hex、
  chat-code 12px text，并按luminance计算可读text与32% ring；保留真实hex validation
  与shared reset icon，不伪造当前host不存在的native color picker。focused tests
  **5/5**，两端build通过。首次build捕获unsupported `text-transform`，改为value层
  uppercasing后复跑仅剩既有warnings。
- Appearance Time format select此前只有144px label-only outline button，Web desktop是
  160px标准select trigger。现trigger/popup统一160px，补14px chevron、8px gap、
  12px left-aligned truncating label及真实aria label。focused tests **2/2**，
  Lynx-for-Web/Native builds通过。
- Appearance segmented controls此前只是普通buttons：无radiogroup/radio checked语义，
  inactive labels/icons仍full foreground。现补group/option semantics、显式active/inactive
  classes及muted inactive text/icon tone。Theme Pack row labels同步Web foreground/90，
  用light/dark semantic token而非whole-element opacity。focused Appearance/Theme Pack
  tests **7/7**，Lynx-for-Web/Native builds通过。
- General `SettingsGeneralSectionElement`接受`targetId`却未写入native tree，导致
  `environment-panel`搜索/deep link target丢失；现与Web一致落在section wrapper。
  Default provider select同时恢复provider identity：已有六种真实SVG直接复用，
  当前asset set未覆盖的Droid/Kilo/Pi用neutral initial badge而非错误OpenAI fallback，
  trigger/options均14px icon + 8px gap + truncating label。focused tests **7/7**，
  Lynx-for-Web/Native builds通过。
- General标准select的176×32 geometry已与Web一致，但chevron仍沿用旧0.8 tone，
  Web default SelectTrigger实际为12px/0.5；改为0.5，并给interactive MenuTrigger补
  与内部Button一致的aria label。focused tests **7/7**，两端build通过。
- Behavior/Notifications在SettingsPage内各自复制reset callback，仍渲染文本`↶`，
  绕过已统一的Settings reset identity。抽取单一`renderSettingsResetAction`，
  两个shared panels现在共用generated `SettingsResetIcon` 14px、icon-xs ghost button
  与原accessibility label。focused settings tests **11/11**，两端build通过。
- shared `SettingsSection/SettingsRow` adapter仍是旧视觉fork：section label 11px/650、
  card强制background/min-height、row固定10.5px padding/3px copy gap/18px title line；
  Notifications首行`Activity toasts`还被错误加top divider。统一为12px/400/18px、
  muted/58、6px section gap、transparent 10px card、density-driven 12px row、
  2px copy gap/20px title line，并补第三个first-row anchor。focused tests **12/12**，
  Lynx-for-Web/Native builds通过；首次test因直接import Web panel绕过Rstest alias失败，
  改为直接验证真实Lynx platform adapters后通过。
- Notifications两项preferences在Lynx只有storage projection：全仓无toast dispatcher、
  completion-event consumer或host notification bridge，原UI却显示可操作switch，仅desktop
  row附“tests unavailable”，属于misleading control。扩shared panel支持activity status，
  两行分别显示明确unavailable copy；switch保留stored checked state与reset visibility，
  但统一disabled/non-focusable/aria-disabled，避免写入无runtime effect的偏好。Web tests
  **2/2**、Lynx tests **13/13**，三端build通过。
- Advanced Recovery details在Web是`What this does` disclosure，Lynx此前只要recovery
  relevant就永久展开。现补controlled trigger、aria-expanded/value、14px generated
  chevron，并复用`useLynxDisclosurePresence` + shared 220ms content/chevron motion；
  details保持12px divider/inset、10px card，close animation完成后再unmount。focused
  Advanced/motion tests **5/5**，Lynx-for-Web/Native builds通过。
- Profile stat tiles此前value/label为12px/18px，Web两者均14px/20px；heatmap cells也
  用3px radius而非Web请求的5px。完成token校准，并给Model usage恢复provider identity：
  mapped providers使用14px真实SVG，asset未覆盖/unknown使用neutral badge，8px gap且
  model label继续truncate。focused tests **2/2**，Lynx-for-Web/Native builds通过。
- Worktrees rows此前强制96px min-height，短row比Web shared list row多余留白；path也
  不truncate，linked conversation标题错误复用500-weight row title。移除固定height，
  path补mono ellipsis/no-wrap，conversation恢复regular Settings description
  size/line-height。focused tests **3/3**，Lynx-for-Web/Native builds通过。
- Archived empty state重复手写Archive SVG，且title/description继承12px Settings row
  token而非Web 14px empty hierarchy；populated row还强制60px min-height。改用generated
  `ArchiveIcon` 20px，empty copy统一14px/20px，并移除固定row height。focused tests
  **3/3**，Lynx-for-Web/Native builds通过。
- Skills portable/group/empty rows此前固定72/120/126px，control column固定72px，
  与Web content-driven Settings rows不一致；source/path也不truncate，group.providers
  数据未显示。移除固定尺寸，control按switch自宽，source/path补ellipsis；新增overlap
  16px provider stack，mapped SVG为12px，未覆盖provider用neutral initial fallback。
  focused tests **3/3**，Lynx-for-Web/Native builds通过。
- Integrations form/connection rows此前强制79px，setup/empty强制58px，connection actions
  固定190px；Web shared rows/actions均按内容自尺寸。移除三处人工尺寸，保留density
  padding、20px row gap及action shrink contract。focused tests **3/3**，
  Lynx-for-Web/Native builds通过。
- Integrations project picker与Advanced permissions此前条件分支直接mount/unmount，
  且Review按钮用Hide/Review文字切换、无chevron/expanded state。两处改用
  `useLynxDisclosurePresence` + shared 220ms content motion；Review copy保持稳定，
  补aria-expanded与14px generated rotating chevron。focused Integrations/motion tests
  **5/5**，Lynx-for-Web/Native builds通过。
- Models/Git writing只有单row card，但Native未标terminal，留下Web `divide-y`不存在的
  trailing bottom divider；interactive MenuTrigger也未发布select aria label。补
  `SharedSettingsGeneralRow--terminal`与wrapper label，继续复用已校准176/208px
  General select chrome与0.5 chevron tone。focused Settings tests **17/17**，
  Lynx-for-Web/Native builds通过。
- 新增icon后审计Button primitive发现Lynx无content gap，且mixed children中的label
  未自动套`LxButton__text`。补Web base/default 8px、sm 6px、xs 4px gap，并显式
  包裹Theme option label，确保icon+text typography与间距都生效。focused Settings
  control tests **12/12**，两端build通过。
- current-head Appearance fast harness先捕获独立`127.0.0.1:8922` Lynx静态origin被
  server trusted-origin gate拒绝；该离线帧判为harness failure，不留作产品证据。改为
  通过server已配置的`localhost:8921`同源挂载Web与Lynx-for-Web后，两端共享snapshot、
  route、light theme、`1280×820` DPR1并在线。首轮量化定位每个Theme Pack卡片少8.5px：
  两个font controls仍为28px而Web authority为32px，跨两卡累计令后续rows提前17px。
  font control显式32px后，Light/Dark cards均475px对Web 475.5px，`UI density`与
  `Time and reading`只剩1px fractional rounding。随后text-only density segments
  从每项10px horizontal padding校准为Web的9px，Compact/Comfortable/Spacious最终
  宽度分别72.3/92/72.8px，逐项完全一致；icon-bearing theme segments保持原本精确
  geometry。真实terminal-font popup以224px打开并显示shared suggestions，client
  online、page errors为空。focused Appearance/Theme Pack tests **7/7**，
  Lynx-for-Web/Native builds通过；证据在
  `shots/2026-08-05/settings-current-head/`。
- current-head Usage继续复用trusted `localhost:8921`双端harness与同一isolated
  snapshot；通过两端真实Appearance controls显式选Light后返回Usage，避免`System`
  在两个browser runtimes解析成不同主题。真实server state为Codex/Claude/Cursor三张
  Unavailable cards，因此本轮视觉证据只覆盖header、Refresh、provider identity、
  status/detail、card stack与footer，不伪称覆盖缺席的meter/pace/stale-notice branches。
  量化发现四个owner：Usage root仍12px gap而Web section为6px；error detail 18px
  line-height而Web `leading-relaxed`为19.5px；provider title缺20px line-height；
  Refresh仍是80.6×25 generic Lynx xs而Web为72×24、10px/15px label。逐项校准后，
  header `456/118/624/26`、Refresh `1008/119/72/24`、28px icon、14/20 title、
  77.8×19 status、19.5px detail、三张624×95.5 cards（y=150/257.5/365）及
  footer y=466.5均与Web exact。focused suite **6/6**，Lynx-for-Web/Native builds
  通过，snapshot hash保持不变、page errors为空；证据在
  `shots/2026-08-05/usage-current-head/`。
- current-head Notifications在同一snapshot/light/1280×820 harness复验shared row
  anatomy。Web保留真实browser notification switches/Test，Lynx因无toast consumer
  与OS bridge继续显示disabled switches和两条明确unavailable status，属于诚实
  capability delta。量化发现status此前嵌在copy column内，使首行copy由Web共同40px
  增至62px，并把32×20 switch从Web y=171垂直居中到y=182。修复owner在shared
  `SettingsRow` composition：supplemental status移到main layout之后，Lynx row显式
  column flow；status继续扩row但不再参与title/description/control centering。final
  section/card/first-row anchors exact，title `469/162/12/18/500`、description
  `469/183/12/18/400`、switch `1035/171/32/20`与Web一致，首行无divider、第二行
  divider保持。Web Notifications tests **2/2**、Lynx shared-row test **1/1**，
  三端production builds通过；证据在
  `shots/2026-08-05/notifications-current-head/`。
- current-head Profile使用真实identity、5个stat tiles、274 activity cells与空
  plugin/model sections复验；populated model rows在该snapshot缺席，继续明确只由focused
  source contract覆盖。量化发现Lynx虽显示40列，却直接每7个cells切列，漏掉Web按首日
  `weekday`生成的3个lead pads与3个tail pads，导致日期/月份归属错列；同时grid固定
  112px、month row 21.5px，而Web fill mode为123.5px grid、15.0625px cells、10px
  month row。改为与Web一致的slot columns/first-real-cell month算法后，40 columns、
  274 cells、6 transparent pads与十个月份x坐标逐项exact。另修identity两层结构：
  avatar后为6px-gap name/handle group，avatar text 20/28、name 24/32；identity
  `408/88/720/134`、stats `408/250/720/68`、activity/heatmap/month row均exact。
  stats radius由16补为Web computed 18px。focused Profile suite **3/3**（含weekday
  behavior test），Lynx-for-Web/Native builds通过；证据在
  `shots/2026-08-05/profile-current-head/`。
- current-head Archived真实snapshot为空态：root `456/118/624/182`、40×20 padding、
  dashed border、44px icon shell、20px generated Archive icon、14/20 title/description
  均已与Web一致；唯一残差是computed radius为0。根因是Lynx theme未定义
  `--radius-lg`，整个declaration失效。empty/loading/error与restore-error surfaces改用
  Web-owned显式10px radius，final computed radius=10；focused suite **3/3**，
  Lynx-for-Web/Native builds通过。populated restore rows在真实snapshot缺席，未伪称
  screenshot覆盖；证据在`shots/2026-08-05/archived-current-head/`。
- follow-up token audit确认Archived不是孤例：Advanced/AppSnap/Integrations/Skills/
  Worktrees共11处使用`var(--radius-lg)`，但Lynx root/generated theme从未定义该token，
  所有declaration都可能静默compute为0。修复放在单一`.SliceRoot` semantic owner：
  `--radius-lg: 10px`，不把magic number复制到五个panels；focused regression test读取
  五个consumer并锁root definition。真实runtime验证AppSnap hero 624×130、
  Skills loading state 624×72、Worktrees empty state 624×72均恢复10px radius；
  Integrations/Advanced当前state未暴露qualifying surface，明确只计静态consumer coverage。
  focused suite **2/2**，Lynx-for-Web/Native builds通过；证据在
  `shots/2026-08-05/settings-radius-token-current/`。
- current-head Skills使用真实114-item catalog（114 switches，全enabled）完成本轮首个
  populated large-list对照。Lynx此前把provider/source/path metadata放在main copy
  column，导致switch按整块长metadata居中；metadata还错误继承12/18而Web supplemental
  status为11/16.5。重构为`SettingsSkillsMain`（title/description + control）和
  `SettingsSkillsMetadata` sibling，portable title line 20px、icon-bearing skill
  title line 21px，并把divider ownership从后行top改为前行bottom以复刻Web `divide-y`
  box geometry。final `adapt` 123.5px、`agent-browser` 213.5px、`agent-device`
  159.5px、`android-device-automation` 123.5px rows及switch/metadata anchors逐项exact；
  provider stacks/path truncation与114 rows均保留。focused suite **3/3**，
  Lynx-for-Web/Native builds通过；证据在
  `shots/2026-08-05/skills-current-head-populated/`。
- current-head Models对照发现此前只实现`Generation defaults`，整个Web
  `Custom models` workflow缺失，不是单纯几何残差。抽出
  `@synara/shared/customModels`作为Web/Lynx共同validation/normalization owner；
  Lynx新增canonical `server.getSettings`/`server.updateSettings` editor，覆盖8个Web可编辑
  providers（Droid继续因authoritative ACP catalog排除）、provider menu、native confirm、
  Add、validation、saved rows、Remove、Reset，并在success后即时刷新Git writing options。
  真实rendered路径验证空Add错误、添加`trae-fidelity-temp-model`、saved Codex row、
  Git writing menu即时出现对应option、rendered Remove后row/option消失且无settings残留。
  同时修shared General title-line 20px与Custom models单SettingsRow anatomy；final
  Generation section/card/row与Custom section/card/editor/provider/input/Add全部exact。
  shared **2/2**、Web **2/2**、Lynx **15/15** tests，三端build通过；证据在
  `shots/2026-08-05/models-current-head-complete/`。
- current-head Worktrees真实snapshot为空态。Light-state对照发现Lynx强制72px
  minimum且copy继承12/18 Settings description token，Web shared empty state实际为
  content-driven 70px与14/20。移除minimum并给state copy明确14/20后，root
  `456/118/624/70`、24×16 padding、dashed border、10px radius与copy typography
  全部exact。focused suite **3/3**，Lynx-for-Web/Native builds通过；populated
  destructive rows在snapshot缺席，继续只计canonical RPC/focused coverage。证据在
  `shots/2026-08-05/worktrees-current-head/`。
- current-head Advanced真实交互复验发现两行custom row把keybindings/recovery
  metadata与disclosure塞在main copy内，actions按整块内容居中；generic xs为25px，
  trigger/details也分别为20px/18px line boxes。重构为shared Settings ownership：
  `SettingsAdvancedMain`（title/description+action）、`SettingsAdvancedMetadata`
  sibling、disclosure child；actions校准24px/10×15，trigger/chevron 16px，details
  copy 12/16。closed Keybindings row 102px、Recovery row 139.5px及所有actions/status/
  trigger anchors exact。真实open使aria-expanded=true、chevron旋转90°、details
  `469/394.5/598/42`；close后closed motion+aria-hidden保留220ms再unmount。
  focused suite **3/3**，Lynx-for-Web/Native builds通过；证据在
  `shots/2026-08-05/advanced-disclosure-current/`。
- current-head Integrations真实snapshot覆盖完整connection form、2个canonical projects、
  3个advanced permissions与empty connected-agent list。Lynx fixed form rows此前title
  只有18px/weight400，separator归后行top；Web为20px title line、12/18/500与前行
  bottom divide-y，导致前三行各少2px并累计漂移。补
  `SettingsIntegrationsTitleLine`、500 weight与continued bottom divider后，Name
  `457/151/622/79`、Access `457/230/622/79`、Advanced `457/309/622/79`、
  Create `457/388/622/78`及内部anchors逐项exact。真实关闭Access all打开2-project
  grid，Review打开3 permissions；close保留closed motion/aria-hidden 220ms后unmount，
  Access all最终恢复且snapshot hash不变。focused suite **3/3**，
  Lynx-for-Web/Native builds通过；证据在
  `shots/2026-08-05/integrations-current-head/`。
- current-head AppSnap保持真实unavailable capability boundary，但修复其shared row
  anatomy：`Unavailable in this runtime`此前位于Enable copy内，使disabled switch按整块
  status居中到y=337而非Web共同baseline y=325；四行还依赖固定min-height与后行top
  dividers。改为`SettingsAppSnapMain`（title/description+switch）、11/16.5 metadata
  sibling、20px title lines、content-driven rows与前行bottom divider。final Enable
  row `457/305/622/81.5`、main `469/315/598/40`、switch `1035/325/32/20`、
  status `469/359/598/16.5` exact；Shortcut/Destination/Capture sound也由内容自然
  复现Web bounds。focused suite **2/2**，Lynx-for-Web/Native builds通过；证据在
  `shots/2026-08-05/appsnap-current-head/`。
- current-head Providers对照发现此前只有update-check preference与provider picker，
  整个Web `Provider updates`和`Provider tools` workflow缺失。新增
  `SettingsProviderToolsPanel`，读取真实`server.getConfig`/`server.getSettings`，
  通过`server.updateProvider`运行带timeout的真实更新；Provider tools按Web顺序覆盖
  九个CLI disclosure、docs、binary/home/API/server/password/agent-dir/WebSocket
  overrides，并通过`server.updateSettings`持久化与统一reset。default command会归一化
  为空override，Kilo/OpenCode password只显示configured语义，不回写只读redacted flag。
- current-head Providers fast harness使用trusted `localhost:8921`同源、isolated
  `60462` server、Light、`1280×820` DPR1与真实三条更新。量化修复两类owner：
  update rows从错误42px横向状态改为Web `SettingsListRow`的约59px纵向title/description，
  inset list放回Provider updates row内部16px owner；tool rows统一44px，unknown advisory
  的Cursor/Antigravity/Droid按Web继续显示安全Update action，无版本的Codex/Grok/Kilo
  不再泄露server error status。final Updates card `624x338.5`对Web`624x337.5`，
  Provider tools card `624x496`对`624x496.5`，九行均`596x44`。
- 真实Codex disclosure通过shared 220ms motion展开为`596x257`，三条docs与两个
  `572x28` inputs齐全。rendered `CODEX_HOME`输入临时路径后真实server mutation立即
  显示`Custom`；rendered reset清除并关闭。临时路径无残留，owned server停止后
  `settings.json`/`state.sqlite`分别恢复原始`d221bb25…`/`cd3e1e9e…` hashes。
  provider update RPC即使resolve也会检查目标状态的`failed/unchanged`并显示真实
  output/message，避免把provider-level失败静默当成功。
  focused Providers+navigation **15/15**，Lynx-for-Web/Native builds、reuse/style
  strict checks通过；证据在`shots/2026-08-05/providers-current-head/`。
- Providers Native follow-up用configured `60462` production bundle
  `9184c738…`与startup deep link直接进入目标页；每个client均从launch PID/lsof解析，
  未按历史port猜测。closed首update row `596x58`、首tool row `596x44`；documented
  `scroll-view.scrollTo(offset:950)`后真实显示9个Installed CLIs。DevTool
  press/release打开Codex为`596x257`，content `596x213`，两个input wrapper
  `572x28`且Native INPUT均`readonly=false`并发布focus/blur/selection/confirm。
  `CODEX_HOME`只做focus tap，不输入字符，因此不伪称IME/text-entry认证。四态
  exact-owned captures的warning/error console均空，KV/window/settings/SQLite全部
  byte-exact不变；证据在`shots/2026-08-06/providers-native-current/`。
- Providers新workflow补齐dark/1440三端矩阵，继续使用同一`cd3e1e9e…`真实三更新
  snapshot。Web/Lynx-for-Web均精确`1440x900` DPR1，Native outer `1440x900`映射
  root `1440x868` / raw `2880x1736`。Web Updates/Tools cards为
  `624x337.5`/`624x496.5`，Lynx为`624x338.5`/`624x496`；Native首update/tool
  rows为`596x58`/`596x44`，documented scrollTo后9行全部可见。Lynx选择Dark会
  remount renderer并重置in-memory section，首个route frame判harness failure；retained
  frame通过真实Providers navigation row重进。三端page-error/Native console gates通过，
  KV/window/settings/SQLite byte-exact恢复，default Native bundle恢复只含58090；证据在
  `shots/2026-08-06/providers-dark-1440/`。
- Settings navigation row补Native interaction证据：exact-owned `Skills` inactive row
  base为transparent/opacity0.95；DevTool保持mousePressed时真实出现`ui-pressed`，
  semantic fill `rgba(13,13,13,0.0392157)`且opacity=1，不整行dim；Native
  `setFocus`后真实出现`ui-focus`与`inset 0 0 0 1px #0169cc`，geometry/route不变。
  两态console均空、server state未变。Desktop DevTool `mouseMoved`不发布mouseenter，
  因此hover继续只计CSS/source contract，不伪称Native通过。证据在
  `shots/2026-08-06/settings-row-native-interaction/`。
- 新增Providers专用strict evidence manifest/verifier，避免旧16-state Settings
  manifest代理更新后的workflow。当前16 states覆盖light fast-loop、Native
  closed/tools/open/focus、dark/1440三端、OpenCode特有editor与navigation
  base/pressed/focus；逐项锁
  PNG hash/dimensions、Lynx/Native builds、snapshot、PID-owned session URL、console、
  geometry、disclosure motion、Native input/switch DOM与pressed/focus paint。verifier **16/16**，回归测试
  **3/3**，可主动拒绝bundle/geometry/interaction paint漂移。
- OpenCode特有provider-tools分支补三端实机证据，未修改任何值。Web/Lynx均显示
  binary path、server URL、server password、OpenAI response WebSockets四项；Lynx
  open row/content为`596x429`/`596x385`，3个input为`572x28`、switch `32x20`。
  Native disclosure `596x385`、boolean shell `572x76`；三个INPUT为text/text/password、
  `readonly=false`并带focus/selection/blur handlers，switch精确发布
  `aria-checked=false`与`Off`。三端error/Native console为空，settings/SQLite未变；
  证据在`shots/2026-08-06/providers-opencode-current/`。
- update checks off分支通过Lynx rendered switch执行真实server mutation，再由独立Web
  session读取：两端均显示两处`Automatic checks off`，behind-latest list/Actions隐藏；
  Lynx仅保留Cursor/Antigravity/Droid三个unknown-advisory安全Update，并显示reset。
  rendered reset恢复preference=true；新session advisories cache尚未刷新而暂显
  `No provider updates detected`，未误报为status refresh结果。server停止后settings
  revision写入恢复原始bytes，SQLite不变。Providers strict verifier扩至**18/18**。
- provider picker与update filtering补真实联动：Lynx rendered `Show Claude` switch关闭后，
  两处summary从3→2，Claude update row消失而OpenCode/Pi保留，picker显示
  `1 provider hidden`，local storage为`hiddenProviders:[claudeAgent]`；rendered reset
  恢复Claude/3 updates/All providers visible与空hidden list。server settings/SQLite
  全程不变。Providers strict verifier扩至**19/19**。
- Provider tools配置从Web/Lynx两份手写数组抽到单一
  `@synara/shared/providerTools`：9-provider顺序、docs、field kind/key/placeholder、
  password configured key与结构化description均共享；Web将code segment保留为`<code>`，
  Lynx用同一segments投影native text。shared tests **2/2**、Web focused **5/5**、
  Lynx focused **15/15**。
- current-head重拍发现Web `server.refreshProviders`若早于`serverConfig` hydration完成，
  原cache updater会对undefined直接返回并永久丢掉refresh结果，页面错误显示
  `No provider updates detected`。修复为缺cache时先加载完整config再merge providers，
  已有cache则不refetch；focused race tests **2/2**。canonical refresh同时确认当前
  OpenCode latest已从1.18.13更新为1.18.14，因此19态全部按当前真实数据和新bundle
  重拍，strict verifier **19/19**。
- React Doctor fresh `bunx`与本地cache CLI均在扫描前因缺失
  `oxc-parser/src-js` / `oxlint-plugin-react-doctor`失败，未产生diagnostics；本刀不把
  tool failure伪称green，功能与bundle/verifier/audit gates仍分别独立通过。

## 2026-08-06 — current-head Archived populated workflow

- completion audit不再接受Archived empty-state截图代理populated branch。通过owned
  `60462` server和canonical `thread.create`→`thread.archive`创建临时
  `Fidelity archived row verification`，三种snapshot API均确认真实archived row；
  未写SQLite fixture。
- 实测发现前一版Lynx只实现Restore，而Web authority同row还拥有confirmed destructive
  Delete。补`createDeleteArchivedThreadCommand`、host `dialogs.confirm`、canonical
  `thread.delete`、shared pending/error owner与snapshot invalidation；Restore/Delete
  并发时共同disabled，分别显示Restoring/Deleting。
- populated row还暴露shared primitive残差：generic `LxButton--xs`实际为25px、
  12px/normal，而Web为24px、10/15、7px水平padding。修复放在单一
  `primitives.css` owner；Archived copy→actions gap从16px收敛到Web的10px，不加匿名
  margin。final Web/Lynx content anchors exact：title `469/161/478.21875/18`、
  description `469/181/478.21875/18`、Restore
  `957.21875/168/53.890625/24`、Delete
  `1019.109375/168/47.890625/24`，actions gap 8px。
- Browser first capture实际为1280×633，按preflight判harness failure并删除；显式重设
  viewport后runtime/visualViewport/PNG均为1280×820 DPR1，Web/Lynx page errors为空。
  server最初默认trusted `8891`导致8921 Origin 403，按真实owner
  `--dev-url http://localhost:8921`重启owned server后fresh sessions恢复在线。
- exact-owned Native configured bundle `f2982a11…`，root PID71742，
  PID-derived localhost:8903/session1，session URL为当前
  `apps/lynx/dist/desktop/main.lynx.bundle`；root1280×788/raw2560×1576，
  row622×58、actions110×24、12/18 title/description，console 0。
  DevTool touch真实触发Delete，host日志确认完整`dialogsConfirm` warning；为不抢用户
  鼠标/焦点未自动确认隐藏系统dialog，因此只声明confirm bridge reached，不扩张为
  user-confirmed deletion pass。
- canonical `thread.delete`清理临时thread后shell/sidebar snapshots均0；owned server/
  Native/browser sessions退出。SQLite `cd3e1e9e…`、settings `d221bb25…`、Native KV
  `f53a83aa…`、window `2dd961d3…` byte-exact恢复。focused Archived+Advanced
  **6/6**，configured Lynx-for-Web与Native/Desktop builds通过；默认Native bundle已
  重建恢复58090。证据在`shots/2026-08-06/archived-populated-current/`。

## 2026-08-06 — current-head Worktrees populated row

- completion audit继续处理第二个source-only弱项。所有harness输入均位于excluded
  `.p10-view`：初始化disposable Git repo，通过真实`git.createWorktree`显式创建
  `.p10-view/worktrees/fidelity-worktree`；`server.listWorktrees`唯一返回该path和primary
  workspace root，未伪造server inventory或SQLite。
- 真实row暴露三个owner残差：`SettingsWorktreesActions`固定160px把copy/path从Web
  540.109375px压到418px；`Conversations`为11/16而Web为11/18；empty conversation
  直接跟label、缺Web `space-y-1`的4px。修复为action wrapper自然自宽、只有optional
  hint保留160px，copy→action gap为10px，label 11/18，empty/populated都复用
  `SettingsWorktreesConversationList`。
- final Web/Lynx-for-Web anchors逐项exact：title `469/161/540.109375/18`、path
  `469/181/540.109375/18`、label `469/207/540.109375/18`、empty copy
  `469/229/540.109375/18`、Delete `1019.109375/161/47.890625/24`。Browser runtime、
  visualViewport与PNG均1280×820 DPR1，errors为空。
- exact-owned Native configured bundle `7b17b780…`，root PID35940，
  PID-derived localhost:8903/session1，session URL为current
  `apps/lynx/dist/desktop/main.lynx.bundle`；raw2560×1576，row622×106，内部
  title/path/label/description/actions尺寸与Browser一致，仅整体content frame y-1，
  console 0。
- cleanup走canonical `git.removeWorktree({force:true})`，随后server inventory为空；
  disposable repo/worktree均删除。SQLite `cd3e1e9e…`、settings `d221bb25…`、KV
  `f53a83aa…`、window `2dd961d3…` byte-exact。focused Worktrees+Archived **6/6**、
  Worktrees final **3/3**，configured两端build通过。证据在
  `shots/2026-08-06/worktrees-populated-current/`。

## 2026-08-06 — current-head Profile populated model usage

- Profile populated models此前只有source contract。为不污染lifetime stats，byte-clone
  `.p10-view`到独立60463 server，通过canonical `thread.create`和3个
  `thread.turn.start`生成真实2:1 model mix；`stats.getProfileStats`返回
  `gpt-5.6-sol` 2 turns/66.7%、`gpt-5.5` 1 turn/33.3%。clone无可执行Codex CLI，
  provider delivery失败/后续quarantine发生在turn-start event durable acceptance之后；
  Profile按真实user-originated turn event统计，未直接写SQLite。
- 1280×820首个diagnostic screenshot中Model usage在viewport下方，按evidence gate拒绝；
  retained改为标准natural 1440×900 DPR1，Web/Lynx scrollTop均0，两条row与tracks直接
  可见。两端item exact `336×30`，columns gap48，icon14×14，line336×20，
  track336×4，line→track gap6。Web identity按文字intrinsic width，Lynx identity flex；
  name origin、right edge、percentage owner、truncation与track geometry一致，percent
  glyph width差仅font rasterization，不patch CSS。
- exact-owned Native configured bundle `2b0aac94…`，1440×900 outer→root1440×868/
  raw2880×1736，root PID5771，PID-derived localhost:8904/session1。section
  `488/803/720/62`、models `488/835/720/30`、first item `488/835/336/30`、
  line336×20、track336×4，console 0；frame中两条model与percentage/track均可见。
- mutated server clone与独立Native user-data clone完整删除；正常SQLite
  `cd3e1e9e…`、settings `d221bb25…`、KV `f53a83aa…`、window `2dd961d3…`全程
  byte-exact。Web production 8,943 modules、configured Lynx-for-Web与
  Native/Desktop builds通过。该切片只补真实证据/审计，无产品代码churn；证据在
  `shots/2026-08-06/profile-models-populated-current/`。

## 2026-08-06 — current-head Integrations connected agent

- Connected agents此前只有empty-state/form proof。byte-clone normal state到独立60464
  server，通过canonical `server.createExternalMcpIntegration`创建本地unpaired
  `Fidelity coding agent`：all-project scope、projects:read/tasks:create/tasks:wait、
  30-day expiry。API只签发本地pairing/stdio配置，未启动或联系外部agent；clone可整体
  删除，未写normal SQLite。
- real row首测暴露三项owner差异：connection继承form row center alignment，使actions
  从Web y534下沉到y575；继承20px gap把copy压窄10px；Lynx date-only格式改了内容与
  wrapping。拆分owner：form继续center/20px，connection独占flex-start/10px，actions
  margin-top=0；timestamp formatter移到pure logic，保留M/D/YYYY、12-hour time、
  seconds和AM/PM。
- final Web/Lynx-for-Web content anchors exact：copy `549/534/436.5`，title/status
  12/18，Resume `995.5/534/92.046875/24`，Revoke
  `1095.546875/534/51.453125/24`，8px action gap，完整local timestamp均一致。
  Browser/PNG 1440×900 DPR1，errors为空。
- exact-owned Native configured bundle `79f06c20…`，outer1440×900→root1440×868/
  raw2880×1736，root PID76008，PID-derived localhost:8904/session1；connection
  `537/521/622/136`、title `549/531/438/18`、actions `997/531/150/24`，console 0。
  helper的generic copy/description role命中form首实例，未拿来冒充connection evidence；
  retained DOM subtree与connection/title/actions roles直接支撑row claims。
- server/native clones、owned processes和browser sessions全部删除/退出；normal SQLite
  `cd3e1e9e…`、settings `d221bb25…`、KV `f53a83aa…`、window `2dd961d3…`全程
  byte-exact。Integrations logic/panel + Archived **11/11**，configured三端build通过；
  证据在`shots/2026-08-06/integrations-connected-current/`。

## 2026-08-06 — current-head Profile plugin/agent rows

- Most used plugins此前仍由empty snapshot代理。byte-clone normal state到独立60465
  server，通过canonical structured turn refs生成真实rows：`$check-code` skill两次、
  `@reviewer-agent` mention一次；stats RPC返回2 runs/1 run、2 explored/3 total。
  provider delivery因clone无Codex CLI失败，但发生在durable turn-start acceptance之后；
  Profile按真实structured user events统计，未直接写SQLite。
- source/runtime审计发现Web使用exact central `building-blocks`与`agent` glyph，Lynx仍用
  `S`/`A`文字。新增`@synara-central-icons` alias与Profile-specific raw SVG adapter，
  theme-colorize后放入既有20px shell/12px glyph slot；不使用generic User或近似Tabler
  图标。
- final Web/Lynx-for-Web rows exact：右栏x872、336×20，pitch30，shell20×20，
  glyph12×12/inset4，name x902，count right x1208，copy/count 14/20。两端1440×900
  DPR1，errors为空。
- exact-owned Native configured bundle `ff4f27e3…`，outer1440×900→root1440×868/
  raw2880×1736，root PID44793，PID-derived localhost:8903/session1；first row
  `872/575/336/20`、shell20、glyph `876/579/12/12`、name x902、count right1208，
  console 0。generic list role命中首个复用list，未拿来支撑plugin claim；row/identity/
  icon/glyph/name/count roles为直接证据。
- server/native clones与owned processes/sessions全部删除；normal SQLite
  `cd3e1e9e…`、settings `d221bb25…`、KV `f53a83aa…`、window `2dd961d3…`全程
  byte-exact。Profile focused **3/3**、configured三端build通过；证据在
  `shots/2026-08-06/profile-plugins-populated-current/`。

## 2026-08-06 — current-head Usage local fallback

- canonical probe揭示最后一组source-only Usage branch其实有真实数据：Codex local
  archive含96% used/4% left limit与427M/5B/101B token rows；Claude含180M/1B/2B
  rows。live Codex/Claude/Cursor endpoints均不可达，但旧`enrichWithLocalUsage`在
  non-ok status提前return，丢弃全部local data，UI因此误显示Unavailable。
- 抽出server `mergeLiveWithLocalUsage`单一owner：live ok仍authoritative并补缺失local
  fields；live fail但local limits/lines存在时返回`status:ok` last-good snapshot并附
  `Showing the latest usage recorded by the local CLI.` warning；无local data继续保留
  live failure。helper从lines-only升级为完整local snapshot，Codex real limit不再丢失。
- real archive还暴露label冲突：`window:5h`却`windowDurationMins:10080`。shared
  `deriveProviderUsageLimitDisplay`按duration归一为Weekly，Web/Lynx不再漂移。
- populated视觉首测量化line-box累积漂移：Lynx notice18 vs Web19.5、label/value
  normal15 vs16、meta/subtitle normal13 vs16.5。补semantic owners后final内容anchors
  exact：warning y209/19.5、Weekly y242.5/16、track y264.5/590×8、4% left
  y278.5/16.5、24h/7d/30d rows y322/362.5/403及subtitles y340/380.5/421。
- Web首个query为placeholder，但rendered Refresh走真实`forceRefresh:true`后恢复同一
  local data，保留为产品recovery evidence。Browser/PNG 1440×900 DPR1，errors为空。
- exact-owned Native configured bundle `be3d2c08…`，outer1440×900→root1440×868/
  raw2880×1736，root PID70562，PID-derived localhost:8904/session1；Usage owner
  624×746、Codex card624×307、warning590×20、limit590×53、track590×8、
  lines590×130，console 0。
- server merge **3/3**、shared display **6/6**、Web usage **15/15**、Lynx contract
  **6/6**。clones/processes/sessions均删除，normal SQLite `cd3e1e9e…`、settings
  `d221bb25…`、KV `f53a83aa…`、window `2dd961d3…` byte-exact。证据在
  `shots/2026-08-06/usage-local-fallback-current/`。

## 2026-08-06 — current-head Landing shared header

- continuation completion audit不再用8月4日P10 atlas代理后续shared primitive变更后的
  current-head shell。首个刷新对象选择高频Landing shell，使用owned `60480` server、
  trusted同源`localhost:8925`、同一`cd3e1e9e…` snapshot、light/comfortable、
  1280×820 DPR1。Web/Lynx-for-Web bundles分别由`VITE_WS_URL`/
  `SYNARA_WS_URL`显式绑定60480，未复用仍占8921的旧static process。
- paired geometry发现旧atlas曾记录但未block的真实typography residual：
  Web `New Chat`为12/18/400、`298/14/55.0625/18`，Lynx
  `normal` line-height导致`298/15.5/55.0625/15`。owner定位到Landing与Thread共同
  使用的`SharedChatHeaderIdentityTitle`，不是route margin；单一owner补18px
  line-height后Web/Lynx exact `298/14/55.0625/18`，且heading/composer/tray anchors
  未移动。
- Web初始恢复历史selected thread；点击New thread在无project snapshot下正确打开
  Create project dialog，未保留。关闭dialog/toast后，通过rendered
  `Open new chat home` focus+Enter进入真实fresh home。Web当前产品用client-only draft
  UUID表达该semantic `new-chat`状态；SQLite/settings hashes不变，证据明确记录为
  `new-chat-draft`，未伪称literal `/`或注入history。
- exact-owned Native configured bundle `0738aa52…`，root PID28092、descendant
  28096、PID-derived `localhost:8903/session1`，session URL为current
  `apps/lynx/dist/desktop/main.lynx.bundle`；raw2560×1576。DevTool直接读取title
  node91：box `296/14/56/18`、computed 12/18/400，warning/error console空。
  Native 255px sidebar与整数text measurement保留既有x映射，不加补偿offset。
- screenshot helper首次传relative path；helper切换cwd后以ENOENT fail，判为harness
  path bug，改absolute path后成功，无产品状态改变。Lynx-for-Web仅有已知upstream
  initialization deprecation warning，Browser errors空。
- owned server/static/Native/browser sessions退出，本轮Native clone删除；退出后8903
  被09:17新启动的t3code实例复用，确认PID28092/28096均已退出后未触碰新owner。
  normal SQLite `cd3e1e9e…`、settings `d221bb25…`、KV `f53a83aa…`、window
  `2dd961d3…` byte-exact。focused shared-header **1/1**，Web 8,943 modules、
  configured Lynx-for-Web与Native/Desktop builds通过。证据在
  `shots/2026-08-06/landing-header-current/`。

## 2026-08-06 — current-head Pull Requests controls

- current-head route recheck继续拒绝8月4日atlas代理。owned 60480 server与
  localhost:8925同源、`cd3e1e9e…` snapshot、light/comfortable 1280×820 DPR1；
  Web/Lynx均通过rendered sidebar Pull requests进入，Lynx使用可见控件中心真实
  pointer sequence，未注入memory history或SQLite。
- 实测确认历史frame未block的残差仍存在：title Web14/20/500而Lynx600；
  `FeaturePageInner--pullRequests` 24px inset使filters x280而Web x284；
  active pills radius6而Web8；project filter是96px文字按钮而Web为24px exact
  `filter-2`图标；refresh仍用`↻`字体glyph；两个icon button又被透明1px primitive
  border压缩16px painted slot到14px。
- 修复全部落在route/adapter owners：title weight500、route inset28、pill radius8；
  project trigger改24×24 ghost icon button，复用exact Central `filter-2.svg`、
  16px slot、完整aria label/pressed/Native selected state及conditional active dot；
  refresh复用generated `RefreshCwIcon`、28×28/16px slot；两个特例owner移除透明border。
  Search保持真实`Search unavailable in this runtime` capability delta，未伪装editable input。
- final Web/Lynx exact anchors：title `276/13/85.75/20` 14/20/500，All
  `284/62/34.15625/26` radius8，refresh `1232/9/28/28`且glyph
  `1238/15/16/16`，project `1228/102/24/24`且glyph
  `1232/106/16/16`，empty title/description完全一致。Browser PNG均1280×820，
  errors空。
- exact-owned Native configured bundle `e0492c80…`，root PID6801、renderer6804、
  PID-derived localhost:8904/session1，session URL为current bundle，raw2560×1576。
  `Input.emulateTouchFromMouseEvent`真实进入PR；title `276/13/88/20`且computed
  14/20/500，refresh/filter SVG DOM均16×16，project node发布完整label、
  `aria-pressed=false`与touch/tap handlers，console空。
- Native DevTool此版本对compound VIEW的`DOM.getBoxModel`会折叠为child bounds，
  因此没有拿15×18/16×16返回值冒充button外框；Browser pair/CSS contract支撑外框，
  Native只声明title、glyph、a11y、touch、screenshot与console直接证据。
- focused PR contracts **3/3**，configured Lynx-for-Web与Native/Desktop builds通过。
  owned processes/sessions与Native clone删除；normal SQLite `cd3e1e9e…`、settings
  `d221bb25…`、KV `f53a83aa…`、window `2dd961d3…` byte-exact。证据在
  `shots/2026-08-06/pull-requests-current/`。

## 2026-08-06 — current-head empty durable Thread

- normal snapshot没有durable thread/project-kind workspace。创建excluded disposable
  Git repo与server byte-clone；Web rendered Add project dialog走真实`project.create`，
  然后复用当前production chunk导出的`promoteThreadCreate`，其内部通过
  `readNativeApi()`与正常WebSocket transport dispatch canonical `thread.create`。
  clone projection确认真实`project`和`Fidelity route verification` thread；未直接写
  SQLite row。三端均通过rendered sidebar row进入，Native先展开project再touch thread。
- 真实empty durable thread暴露结构fork：Web用`CenteredEmptyLandingStack`将heading、
  composer与context tray作为一组垂直居中；Lynx仍用旧`ChatEmptyStateHero`，composer
  独立钉在bottom y701。修复不是negative margin：empty branch直接复用现有Landing
  SSOT，nonempty/loading/error继续保留normal bottom composer。
- project copy首次在Lynx 321px heading frame内wrap两行；新增命名
  `CenteredEmptyLandingHeading--project` 400px owner，global Landing 321px校准不变。
  第二次对比发现Web还包含真实58px project-context tray；未用placeholder补高度，而是
  新增数据驱动`EmptyThreadContextTray`：project/envMode/branch读取thread snapshot，
  Local/Worktree与branch因本runtime无selector明确disabled；Temporary是真实button，
  发布aria/Native selected state。后续completion audit发现若lifecycle由tray自己持有，
  empty→transcript会因tray unmount误删仍active的thread；现将marker/effect提升到
  ThreadPage，只有真正离开marked thread route才canonical `thread.delete`并invalidate
  queries。
- final Browser anchors收敛到engine fractional rounding：title exact
  `298/14/140.015625/18` 12/18/400，heading y407.25 vs407，composer
  `400/461.75/736/95` vs `400/462/736/95`，tray
  `400/536.75/736/58` vs `400/537/736/58`，Temporary y560.75 vs561。
  两端PNG 1280×820，errors空。
- exact-owned Native configured bundle `ceeda1ce…`，root PID7673、renderer7676、
  PID-derived localhost:8903/session1，raw2560×1576；title
  `296/14/140/18` 12/18/400，heading400×35，完整composer/tray可见，console空。
  real touch验证Temporary `aria-pressed false→true→false`，最终false所以cleanup时未删除
  evidence thread。DevTool compound VIEW box model继续折叠child，未拿其值冒充outer。
- focused Thread/Header/state suites **9/9**，configured Lynx-for-Web与
  Native/Desktop builds通过；owned processes/sessions及整个mutated clone删除。
- cleanup audit发现normal SQLite主文件不再是先前`cd3e…`。根因是外部`sqlite3`读取
  live WAL DB时checkpoint unchanged WAL pages进main file；之后hash继续到
  `25c6a307…`。逻辑数据明确未变：2 orchestration events、2 projects、0 threads、
  所有projector sequence2；settings/KV/window hashes未变。没有pre-checkpoint byte
  backup存活，因此不伪称byte-exact或静默覆写。证据与caveat在
  `shots/2026-08-06/thread-empty-current/`。
- completion audit随后把Temporary误删风险纳入current-head gate：生命周期提升后focused
  suite更新为**10/10**，Lynx-for-Web/Native bundles更新为`d2d2b630…`/
  `e7fe5d1b…`，exact-owned Native root PID94071、renderer94074、
  localhost:8903/session1。相同canonical clone与rendered navigation完成三端重拍，
  Temporary real touch再次`false→true→false`，normal logical baseline保持
  2 events/2 projects/0 threads/sequence2。

## 2026-08-06 — current-head project Kanban

- normal snapshot无project-kind Kanban。新建第二个excluded disposable Git repo/server
  clone，Web rendered Add project走canonical `project.create`，production
  `promoteThreadCreate`走canonical `thread.create`生成`Kanban fidelity task`；未直接写
  SQLite。Web/Lynx均从rendered Kanban overview进入project，Native通过sidebar Kanban
  与project header real touch进入。
- current-head实测关闭多项旧atlas未block残差：column title Web13/19.5/500而Lynx
  13/normal/600；count 16px vs15px；column header Web32px、0/6/8而Lynx35.5px、
  4/6/12；card radius10 vs8；card title13/17.875/500 vs13/17/600；action copy
  12/16 vs11/16；meta 11/16.5 vsnormal；Web root gap6+meta pt2，而Lynx margin7；
  branch text前还漏Web的12px GitBranch glyph。
- 修复全部落在shared Kanban column/card adapter owners，无fixed card height或route
  offset：header32、title/count明确line boxes、card radius10、title500、root gap6、
  meta pt2/11/16.5、action12/16、generated12px branch glyph+4px internal gap。
- final Web/Lynx exact：route title `312/13/.../20` 14/20/500；三列
  `272/606.65625/941.328125`、height746；header322.65625×32；Draft
  `278/60.25/.../19.5` 13/19.5/500；count y62/16；card
  `276/94/314.65625/64.375` vs64.5、radius10；card title y105/17.875/500；
  branch glyph12×12、branch text x327/11/16.5。仅card高0.125px engine rounding。
- exact-owned Native configured bundle `69252f59…`，root PID17557、renderer17562、
  PID-derived localhost:8903/session1，raw2560×1576；real touch完成Kanban→project，
  column titlecomputed13/19.5/500，card title/branch SVG/meta直接DOM可见，console空。
  compound VIEW box-model折叠继续按tool limitation登记，不冒充outer geometry。
- focused Kanban **3/3**，configured Lynx-for-Web/Native/Desktop builds通过。
  clone/processes/sessions全部删除；normal state以immutable只读方式确认2 events、
  2 projects、0 threads、projector sequence2。SQLite main-file checkpoint caveat沿用
  empty Thread记录，不伪称byte-exact。证据在
  `shots/2026-08-06/kanban-project-current/`。

## 2026-08-06 — current-head Command K primitive closure

- 旧P10 atlas的Command K候选先经current-head同snapshot实测，不按历史值直接patch。
  Web/Lynx-for-Web均通过rendered sidebar Search真实click打开；同源staging的served
  bundle hash与build artifact一致，viewport/PNG均1280×820，errors空。
- 历史input/row typography告警大部分是container继承噪声：Web input 12/18，Lynx
  textarea已12px；Web row label 14/20，Lynx真实`X-TEXT` label也已14/20。未为这些
  已对齐值增加重复override。
- 两个真实primitive residual为panel top radius 12→Web14、item radius8→Web10。
  `.LxCommandPanel`与`.LxCommandItem`已更新为14/10。第一次复测item仍为8，定位到
  shared Web composition的`rounded-lg` utility覆盖primitive；修复放在Lynx
  `CommandItem` adapter seam，仅过滤该radius token，保留cursor/gap/padding等classes，
  使primitive成为single owner。final computed panel14、item10。
- focused Command/composition suites **2 files / 10 tests**，configured
  Lynx-for-Web与Native/Desktop production builds通过。
- exact-owned Native configured bundle `3c73de57…`，root PID78314、
  PID-derived localhost:8903/session1，session URL为current staged bundle。
  `Input.emulateTouchFromMouseEvent`真实touch Search打开Command K；retained row class
  已无`rounded-lg`，7 roles、raw2560×1576、console 0。当前DevTool对compound
  Native VIEW统一返回radius0，故只声明bundle/class/interaction/screenshot/console
  直接证据，不伪称Native numeric radius。证据在
  `shots/2026-08-06/command-k-current/`。

## 2026-08-06 — current-head Composer Extras chrome closure

- 从旧P10 atlas结构化筛选并排除已由后续切片关闭的Sidebar、Project Picker、
  skill/mention、Settings与transcript候选后，选择Extras做current-head复证。
  同snapshot Web/Lynx-for-Web均通过rendered Composer extras真实click打开，served
  bundle hash与artifact一致，viewport/PNG 1280×820，errors空。
- 实测确认两个此前状态矩阵未block的真实残差：Web trigger 28×28/radius8，
  Lynx 32×28/radius10；Web menu row radius8，shared Lynx `LxMenuItem` radius6。
  row container的16px/normal仍是继承噪声，真实label已明确12px，未重复patch typography。
- root-cause修复：shared `LxMenuItem`改为canonical radius8，覆盖普通、checkbox/radio与
  submenu trigger；Extras增加命名28×28 host与独立28×28 button chrome owner，
  button padding5/radius8。首次复测发现host/button共用class导致host padding把inner
  button推移5px，随后拆成`ComposerExtrasTriggerHostLynx`与
  `ComposerExtrasTriggerLynx`，final host/button同为407/521/28/28，icon
  413/527/16/16，所有三行radius8。
- popup仍是既有P9明确登记的142×108 versus Web141.421875×106 engine/separator
  rhythm，未用匿名height override掩盖。focused Menu/Extras **2 files / 11 tests**，
  configured Lynx-for-Web与Native/Desktop builds通过。
- exact-owned Native configured bundle `5e05f8af…`，root PID45645、
  PID-derived localhost:8903/session1，real touch打开Extras；host/button均28×28，
  plus icon16×16居中，8 roles、raw2560×1576、console 0。DevTool compound VIEW
  radius继续返回0，因此只声明source/test+Browser computed radius与Native
  bundle/class/interaction/geometry直接证据。证据在
  `shots/2026-08-06/extras-current/`。

## 2026-08-06 — current-head Command K outer shell closure

- Extras之后继续检查同一旧atlas机器差异，发现上一Command K刀只关闭panel14与item10，
  outer `LxCommandDialogPopup`仍显式16，而Web current authority为18。
- outer owner改为18，Command focused contract同时锁outer/panel/item **18/14/10**。
  configured Lynx-for-Web通过rendered Search real click打开后computed exact 18、
  `14 14 0 0`、10；PNG1280×820、errors空。
- focused Command **1 file / 9 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。exact-owned Native bundle `1579d964…`，
  root PID65639、PID-derived localhost:8903/session1，real Search touch后保留
  popup/panel/item，raw2560×1576、console0。Native compound VIEW radius不宣称；
  source/test+Browser computed与Native bundle/class/interaction共同闭环。证据在
  `shots/2026-08-06/command-k-outer-current/`。

## 2026-08-06 — current-head Command K footer radius closure

- 继续审查Command shell后发现footer仍固定15px，而Web canonical class是
  `calc(var(--radius-2xl)-1px)`；当前base radius10、2xl=18，所以真实值17。
  `.LxCommandFooter`下两角改17并进入focused contract。
- configured Web/Lynx-for-Web均通过rendered Search real click打开，footer exact
  `574×41`、padding12/20、radius `0 0 17 17`；PNG1280×820、errors空。
- focused Command **1 file / 9 tests**、configured Lynx-for-Web与
  Native/Desktop builds通过。exact-owned Native bundle `d1544c34…`，root PID89672、
  PID-derived localhost:8903/session1，real Search touch后保留popup/footer，
  raw2560×1576、console0。证据在
  `shots/2026-08-06/command-k-footer-current/`。

## 2026-08-06 — current-head Command K material lift closure

- geometry closure后继续检查paint，旧retained styles与current Web均显示outer
  `shadow-lg/5`、inner panel `shadow-xs/5`，Lynx此前两层均none。
- outer补两层5%软阴影`0 10 15 -3`与`0 4 6 -4`，inner补5% hairline
  `0 1 2 0`；focused contract锁定两层。Web computed多出的前四项是透明utility
  rings，painted layers与Lynx语义exact。
- focused Command **1 file / 9 tests**、configured Lynx-for-Web与
  Native/Desktop builds通过。exact-owned Native bundle `5238d1cc…`，root PID17696；
  首次手猜8903未打开popup，PID/lsof证明owned endpoint为8904，失败目录删除后以
  helper绑定localhost:8904/session1重拍，real Search touch、popup/panel、
  raw2560×1576、console0。证据在
  `shots/2026-08-06/command-k-shadow-current/`。

## 2026-08-06 — current-head Composer Extras popup chrome closure

- shared composer picker source audit发现Extras main/sub popup仍继承generic
  radius10/no-shadow，而Web两层均复用canonical radius10.4与Light 7% /
  Dark 30% soft shadow。Lynx Extras scope补同一radius与双主题shadow。
- opaque Native semantic popover继续保留：Web 70% fill依赖Lynx不支持的
  backdrop-filter；无blur直接alpha会降低可读性，不做伪frosted。
- current Web main/sub为141.421875×106、128×62；Lynx-for-Web为142×108、
  128×64；两端radius/shadow一致，既有2px engine rhythm不强制改height。
- focused Menu/Extras **2 files / 11 tests**、configured Lynx-for-Web与
  Native/Desktop builds通过。exact-owned Native bundle `37188e48…`，
  root PID39774、PID-derived localhost:8903/session1，real touch依次打开
  Extras→Fast，main/sub/row、raw2560×1576、console0。一次helper参数误写
  `--root-pid39774`在capture前退出，未生成证据；仅保留corrected helper capture。
  证据在`shots/2026-08-06/extras-popup-chrome-current/`。

## 2026-08-06 — current-head shared composer picker chrome closure

- Extras修复后继续source-to-source audit，确认Web Model/Traits/Runtime/Extras全部消费
  `ComposerPickerMenuPopup` canonical chrome；Lynx却分叉：Model私有16%重阴影，
  Traits/Runtime generic radius10/no-shadow，Extras刚独立校准。
- 新shared selector统一Model/Traits/Runtime/Extras/Fast submenu为radius10.4、
  Light 7% `0 4 18 -6`、Dark 30% `0 6 24 -10`，删除Model私有`0 8 24 / 16%`。
  opaque Native popover继续作为无backdrop-filter的注册校正。
- current Web Model/Traits为208×244、208×142，current Lynx-for-Web为260×300、
  260×188；material exact，catalog/layout尺寸差保留既有contract。本轮focused命令
  实际只解析到**2 files / 11 tests**；不存在的filename参数被Rstest忽略，不冒充4 files。
- configured Lynx-for-Web与Native/Desktop builds通过。exact-owned Native bundle
  `3d6a37e6…`，root PID78889、PID-derived localhost:8904/session1，real Model
  trigger touch，popup/row、raw2560×1576、console0。证据在
  `shots/2026-08-06/composer-picker-chrome-current/`。

## 2026-08-06 — current-head composer picker option radius closure

- shared popup后继续审计interactive anatomy：Web picker option SSOT为radius8，
  collapsible group header/favourite使用panel radius10.4；Lynx provider/trait/model
  rows仍私有7，group无radius，favourite为6。
- owner统一为provider/trait/model row8、group/favourite10.4；skeleton dot/line的7px
  capsule保留，不与interactive row混淆。
- current Web provider/trait row均8；Lynx-for-Web provider/model/trait row均8。
  当前Claude catalog无collapsible group/favourite，后二者只声明source/test，不冒充runtime。
- focused Menu/Extras **2 files / 11 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。exact-owned Native bundle `506762d9…`，
  root PID5242、PID-derived localhost:8903/session1，real Model touch后
  popup/provider、raw2560×1576、console0。证据在
  `shots/2026-08-06/composer-picker-rows-current/`。

## 2026-08-06 — current-head Composer Fast toggle closure

- 剩余interactive literal审计发现Web Fast control为20×20/radius8、14px icon、
  固定`Fast mode` label+`aria-pressed`；Lynx仍22×22/radius6且动态
  Enable/Disable label。
- Lynx owner改为20×20/radius8与固定label，保留14px `ϟ` Native glyph adaptation；
  新focused adapter test锁geometry/label/false state。composer/menu focused
  **3 files / 12 tests**，configured Lynx-for-Web与Native/Desktop builds通过。
- current Web/Lynx-for-Web均20×20/radius8。Lynx-for-Web custom host省略false
  `aria-pressed`属性，source/test与Native保留语义，不误报缺失。
- exact-owned Native bundle `f9a8fb55…`，root PID35730、PID-derived
  localhost:8904/session1；real touch打开Traits并验证Fast false→true，第二次real touch
  恢复false，restored DOM明确label/pressed=false；raw2560×1576、console0。证据在
  `shots/2026-08-06/composer-fast-toggle-current/`。

## 2026-08-06 — current-head Command K group label line-box closure

- old Lynx group label为12/500但implicit visual line-box15。仅按Web通用text-xs源码曾
  推断18，但current rendered Web实测权威值是12/16/500、outer box22；18px临时改动在
  commit前纠正，final Lynx显式12/16/500、outer22。
- focused Command **1 file / 9 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。Web/Lynx-for-Web均通过real Search打开并精确一致。
- exact-owned Native bundle `fd7618f8…`，root PID90786、PID-derived
  localhost:8904/session1，real Search touch后保留label/parent，
  raw2560×1576、console0。证据在
  `shots/2026-08-06/command-k-label-current/`。

## 2026-08-06 — current-head Command K keyboard-pill typography closure

- Web shared `Kbd`为20×20/radius4、text12/16/500；Lynx box已一致但text仍11且
  implicit line-box。`.LxKbd__text`改为显式12/16/500并进入Command contract。
- focused Command **1 file / 9 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。Web probe首个`data-slot=kbd`是sidebar shortcut，但与
  Command K消费同一Web primitive；Lynx-for-Web直接测Command K Kbd，均20×20/r4、
  12/16/500。
- exact-owned Native bundle `1e73100b…`，root PID14037、PID-derived
  localhost:8905/session1，real Search touch后保留Kbd/text，
  raw2560×1576、console0。证据在
  `shots/2026-08-06/command-k-kbd-current/`。

## 2026-08-06 — current-head Command K footer copy line-box closure

- Web footer copy由`text-xs`解析为12/16；Lynx仅写12导致implicit line-box。
  `.LxCommandFooter > text`增加显式16px line-height并进入Command contract。
- focused Command **1 file / 9 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。current Web/Lynx-for-Web左右footer文案宽度、16px高度、
  12/16 typography完全一致。
- exact-owned Native bundle `4dbeaf81…`，root PID34264、PID-derived
  localhost:8904/session1，real Search touch后保留footer，raw2560×1576、console0。
  证据在`shots/2026-08-06/command-k-footer-text-current/`。

## 2026-08-06 — current-head Command K input line-box closure

- Web Command search input显式12/18；Lynx仅写12并依赖textarea implicit line-height。
  `.LxCommandTextarea`增加显式18px并进入Command contract。
- focused Command **1 file / 9 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。current Web/Lynx-for-Web computed均12/18；Lynx
  custom textarea在Browser内box为0，因此只声明computed typography。
- exact-owned Native bundle `6657bf09…`，root PID52798、PID-derived
  localhost:8904/session1，real Search touch后保留input/textarea，
  raw2560×1576、console0。证据在
  `shots/2026-08-06/command-k-input-current/`。

## 2026-08-06 — current-head Composer Traits label closure

- shared Menu typography候选经consumer tracing被否决：composer Model/Traits均由
  dedicated Lynx adapter持有label，当前Claude model submenu也没有真实group label，
  因此没有修改未被runtime证明的`.LxMenuGroupLabel`或Model owner。
- rendered Traits real click实测Web label为12/16/400、muted/45、padding6/8、
  row28；旧Lynx为10/normal/600、full muted、custom header24。dedicated label/header
  owner改为canonical contract；第一次post-patch测量发现20px Fast toggle把row撑到32，
  随后补Web同源`-my-1`语义的上下-4px margin，final row精确28。
- focused trait-picker **1 file / 2 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。Web/Lynx-for-Web均经rendered Traits control打开，
  viewport/PNG 1280×820、errors空；Lynx final为12/16/400、opacity.45、
  padding6/8、header28。
- exact-owned Native bundle `7743069c…`，root PID12130、PID-derived
  localhost:8904/session1，real touch打开Traits并保留popup/header/label/toggle；
  Native header240×28、label12/16/400 opacity.45、toggle20×20、
  raw2560×1576、console0。证据在
  `shots/2026-08-06/composer-trait-label-current/`。

## 2026-08-06 — current-head Composer Extras label line-box closure

- shared `.LxMenuItem__text`候选继续经真实consumer检查收窄：Extras用dedicated
  `ComposerExtrasItemLabelLynx > text`，wrapper的16px/normal是继承噪声；直接child
  TEXT实测Web为12/18/400，旧Lynx为12/normal/400且visual line-box15。
- dedicated text owner增加显式18px line-height，不改row geometry。focused Extras
  **1 file / 3 tests**、configured Lynx-for-Web与Native/Desktop builds通过。
  current Web/Lynx-for-Web均经rendered Extras trigger打开，三条Lynx label均
  12/18/400，main rows继续26px；viewport/PNG1280×820、errors空。
- exact-owned Native bundle `d90f71a3…`，root PID42725、PID-derived
  localhost:8904/session1；state-idempotent real touch打开Extras，直接三个child
  TEXT均12/18且box18。DevTool将CSS 400等价序列化为`normal`；保留
  popup/label/row、raw2560×1576、console0。证据在
  `shots/2026-08-06/composer-extras-label-current/`。

## 2026-08-06 — current-head Composer Traits option line-box closure

- Web shared radio option明确12/18/400；current rendered四行均26px row。Lynx
  dedicated `ComposerTraitOptionLabelLynx`此前仅12px，四行直接TEXT实测
  12/normal/400、visual line-box15，34px row。
- dedicated text owner补显式18px；不压缩34px Native touch-target/layout contract。
  focused trait-picker **1 file / 2 tests**、configured Lynx-for-Web与
  Native/Desktop builds通过。Web/Lynx-for-Web均经real Traits trigger打开，
  四行label均12/18/400；Web row26、Lynx row34保持原contract，PNG1280×820、
  errors空。
- exact-owned Native bundle `7577d5c8…`，root PID87825、PID-derived
  localhost:8905/session1；state-idempotent real touch打开Traits，保留
  popup/row/label。Native label12/18、box18、weight `normal`等价CSS400，
  row240×34、raw2560×1576、console0。证据在
  `shots/2026-08-06/composer-trait-option-text-current/`。

## 2026-08-06 — current-head Composer provider row closure

- provider rows复用了footer trigger composition，导致Lynx popup name为11/normal、
  status为10/normal且紧跟name；disabled provider还错误带footer chevron。current
  Web真实值为name12/18、status11/18 muted/80并trailing对齐，disabled无chevron，
  available submenu chevron trailing对齐。
- scoped `.ComposerProviderOptionLynx` override使content占满row、name12/18、
  status11/18 opacity.8 + auto trailing、enabled chevron auto trailing、disabled
  chevron hidden；footer `GPT-5.5`仍11/normal，未被popup修复污染。Lynx-for-Web
  final disabled status/available chevron rightGap均7px；row32保持Native touch target，
  Web row26保持原contract。
- focused picker contract **1 file / 3 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。exact-owned Native bundle `a6a735b5…`，root
  PID28434、PID-derived localhost:8905/session1；real Model touch保留
  popup/disabled row/status，Native row248×32、status11/18 opacity.8、box18，
  raw2560×1576、console0。generic Native name class会先命中footer，因此不冒充
  provider-name numeric Native proof；provider scoped name/right edge由current
  Lynx-for-Web + source/test闭环，Native DOM只证明结构。证据在
  `shots/2026-08-06/composer-provider-row-current/`。

## 2026-08-06 — current-head Composer model row text closure

- current Claude model list经rendered Model→Claude两步真实交互打开。Web八行
  `menu-radio-item`均12/18/400、row26；Lynx八行
  `ComposerModelOptionNameLynx`此前11/normal/400、visual box13、row30。
- dedicated model name owner改为12/18；不压缩30px Native touch-target/layout
  contract。focused picker contract **1 file / 3 tests**、configured
  Lynx-for-Web与Native/Desktop builds通过。final Lynx-for-Web八行均12/18/400，
  PNG1280×820、errors空。
- exact-owned Native bundle `7514d567…`，root PID51936、PID-derived
  localhost:8905/session1；real Model→Claude touches后保留popup/model row/name。
  Native name12/18、box18、row248×30、raw2560×1576、console0。current Claude
  catalog无cost multiplier/favourite/collapsible group header，不从source-only
  推断顺带修改。证据在
  `shots/2026-08-06/composer-model-row-text-current/`。

## 2026-08-06 — current-head shared Menu item text closure

- Runtime候选先被current product path否决：当前`Full access`没有真实mode
  transition callback，composition按contract不渲染menu，不能用fixture冒充consumer。
  转到General Settings真实`Default thread mode`：Web Select option为12/18/400、
  row26；Lynx shared `.LxMenuItem__text`为12/normal/400、visual box15、row32。
- shared text补18px line-height；首次复测发现7px vertical padding使row涨到34，
  随即改为6px，final text12/18且row恢复32。focused Menu **1 file / 9 tests**、
  configured Lynx-for-Web与Native/Desktop builds通过。
- 一个复用旧session在Settings navigation后root blank，被判harness state pollution，
  未留证；fresh named session同一rendered path通过。Web/Lynx-for-Web PNG1280×820、
  errors空。
- exact-owned Native bundle `cebcd55d…`，root PID96008、PID-derived
  localhost:8904/session1；real Sidebar Settings→thread-mode touches后保留
  popup/row/text。Native text12/18、box18、row206×32、raw2560×1576、console0。
  证据在`shots/2026-08-06/settings-shared-menu-text-current/`。

## 2026-08-06 — current-head Composer footer trigger text closure

- current rendered landing实测Web Model/Traits label均11/16.5/400、trigger28；
  Lynx两者此前11/normal/400、visual box13、trigger28。只给
  `ComposerModelTriggerLabelLynx`与`ComposerTraitsTriggerLabelLynx`补16.5px，
  不改10px chevron/meta。
- focused picker contract **1 file / 3 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。Lynx-for-Web两label final均11/16.5/400，
  trigger28，PNG1280×820、errors空。
- exact-owned Native bundle `ca441805…`，root PID21351、PID-derived
  localhost:8904/session1；保留model/traits trigger+label。Native两trigger
  均28px，两label11/16.5（fractional box按像素取整17），raw2560×1576、
  console0。证据在
  `shots/2026-08-06/composer-footer-trigger-text-current/`。

## 2026-08-06 — current-head Composer Runtime trigger identity closure

- current rendered `Full access`实测Web为118.15625×28、透明1px border、
  14px shield、11/16.5/400 orange label、12px chevron、6px gap；旧Lynx只是
  generic Button text12/normal/500黑色、无icon/chevron、width86。
- Lynx改为MenuTrigger内显式14px permission glyph + label + chevron anatomy，
  light/dark accent分别`#e25505/#fe8549`。14px diamond明确登记为Native glyph
  adaptation，不伪称Web shield。1px transparent border恢复exact Browser
  118.15625×28 geometry。
- 第一版通过Button `render` seam引入5条
  `cloneElement from compiled snapshot with children is not supported`
  Native warning；该evidence被拒绝。final去掉Button/render，纯view由外层
  MenuTrigger持有interaction/accessibility，focused contract锁无`<Button`/
  `render=`回归。
- focused picker contract **1 file / 3 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。exact-owned Native bundle `98241786…`，root
  PID85026、PID-derived localhost:8904/session1；trigger118×28、glyph14×14、
  label11/16.5、chevron12×12，全部orange，raw2560×1576、console0。证据在
  `shots/2026-08-06/composer-runtime-trigger-current/`。

## 2026-08-06 — current-head Composer Send action closure

- current rendered disabled Send实测Web为28×28 circular primary、transparent
  border1、opacity.2、真实20×20 central `arrow-up`；旧Lynx虽28×28但opacity.42，
  使用17px/700 text `↑`，实际glyph约13.4×20。
- Lynx改为raw `@synara-central-icons/arrow-up.svg?raw`，通过active theme surface
  着色并渲染20×20 SVG；button补transparent border1、disabled opacity.2。
  focused picker contract **1 file / 3 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。Browser final button28×28/r14/border1/opacity.2、
  icon20×20 white，PNG1280×820、errors空。
- exact-owned Native bundle `edc24d25…`，root PID13040、PID-derived
  localhost:8904/session1；button28×28 opacity.2、icon20×20且raw content白色stroke，
  raw2560×1576、console0。Native compound VIEW radius/border仍按已登记DevTool
  zero-value boundary，不冒充numeric Native proof。证据在
  `shots/2026-08-06/composer-send-action-current/`。

## 2026-08-06 — current-head Composer Voice common-anatomy closure

- Web Voice当前enabled但Lynx能力不可用，保留honest capability delta；仅比较公共
  anatomy。Web为28×28/r8/border1、16×16 central microphone；旧Lynx为32×28，
  Web-mask span受icon-sm padding压成14×16。
- Lynx改为raw `@synara-central-icons/microphone.svg?raw`，active theme muted
  foreground着色；button scope固定28×28、padding5、icon16×16。Lynx仍明确
  disabled/no-handler/opacity.48，不复制Web enabled opacity、不伪造录音能力。
- 第一版raw SVG仍通过Button `render` seam，Native出现3条cloneElement warning；
  该证据拒绝。final改为plain disabled view，去掉Button/render。
- focused picker contract **1 file / 3 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。exact-owned Native bundle `a74ea9c5…`，root
  PID4998、PID-derived localhost:8904/session1；button28×28、
  aria-disabled=true且无interaction bindings、mic16×16 muted，
  raw2560×1576、console0。
  证据在`shots/2026-08-06/composer-voice-action-current/`。
- commit hook的React Doctor generic warning经真实changed-scope复查定位到显式
  ReactLynx `focusable`被Web DOM rule误判；plain view本就无event handlers且默认
  non-focusable，删除冗余属性后同scope复扫0 issues。

## 2026-08-06 — current-head Composer footer action gap closure

- Voice修到28px后暴露相邻真实spacing residual：Web footer actions为`gap-2`=8px，
  Voice x1063、Send x1099；Lynx owner仍写死6px，Voice x1065、Send x1099。
- `.ComposerFooterActionsLynx`改为gap8并进入focused contract。current
  Web/Lynx-for-Web均Voice x1063、Send x1099、两者28×28、gap8；PNG1280×820、
  errors空。parent起点/width仍受Model trigger既有2px engine rhythm影响，不与本刀
  action spacing混淆。
- focused picker contract **1 file / 3 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。exact-owned Native bundle `324d1c1d…`，root
  PID51059、PID-derived localhost:8902/session1；actions/Voice/Send保留，Native
  x1063/x1099、gap8、raw2560×1576、console0。endpoint由owned PID动态解析，
  未猜历史端口。证据在
  `shots/2026-08-06/composer-footer-action-gap-current/`。

## 2026-08-06 — current-head Composer picker trigger chrome closure

- footer全控件current-head盘点发现Model/Traits仍分叉：Web两者r10/border1，
  Model 95.15625×28/padding6/真实12px chevron，Traits
  83.75×28/padding10/label-chevron gap8；Lynx两者r8/no border、6px text
  chevron，Model91.1875、Traits69.78125，二者间gap6。
- Model/Traits改用generated `ChevronDownIcon` 12×12/opacity.6；Model
  padding4/6 + transparent border1/r10，Traits gap8 + padding4/10 +
  border1/r10；`ComposerModelControlLynx` gap改8。Browser final Model
  x868.09375/95.15625、Traits x971.25/83.75、gap8，与Web exact。
- provider panel real click复测enabled chevron12px/rightGap7、disabled
  chevron hidden/status rightGap7，未回归上一刀。focused picker contract
  **1 file / 3 tests**，configured Lynx-for-Web与Native/Desktop builds通过。
- exact-owned Native bundle `35c2fc2c…`；保留Model/Traits+chevrons，Native
  rounded geometry96×28/84×28、chevrons12×12、完整trigger bindings，
  raw2560×1576、console0。compound VIEW radius/border仍不冒充Native numeric
  proof。证据在
  `shots/2026-08-06/composer-picker-trigger-chrome-current/`。

## 2026-08-06 — current-head Sidebar primary-action label closure

- current rendered New thread/Search/Settings三项统一暴露shared label residual：
  Web均12/18/400、foreground/89；Lynx均12/18/500、full foreground，文本宽度也因
  weight偏大。`.SharedSidebarPrimaryActionLabel`改400并opacity.89，进入landing
  fidelity contract；同时更新Voice改动后遗留的`useTheme` source expectation。
- current Web/Lynx-for-Web三项label text width exact；PNG1280×820、errors空。
  sidebar row y/width仍是此前登记的shell/separator geometry boundary，不扩大本刀。
- focused landing fidelity **1 file / 2 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。exact-owned Native bundle `be598d2b…`，
  localhost:8904/session1；Settings row保留完整interaction bindings，label
  12/18/400 opacity.89、box18，raw2560×1576、console0。证据在
  `shots/2026-08-06/sidebar-primary-action-label-current/`。

## 2026-08-06 — current-head Sidebar primary-action icon closure

- New thread/Search current Web均15×15、leftInset8.5、foreground/89；Lynx几何已
  exact但full foreground。Settings Web为15×15 central settings、foreground/95，
  Lynx仍是16×19 text `⚙`、muted60。
- shared leading owner补opacity.89，footer scope覆盖.95；Settings call site换为
  generated `SettingsIcon` size15。current Web/Lynx-for-Web三项均15×15、
  leftInset8.5，tone语义一致；PNG1280×820、errors空。
- focused landing fidelity **1 file / 2 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。exact-owned Native bundle `927d8c91…`，
  localhost:8904/session1；footer leading16×16/opacity.95，Settings SVG15×15、
  theme foreground raw content，raw2560×1576、console0。同class New/Search
  numeric Native不冒充，由Browser三项+shared source contract闭环。证据在
  `shots/2026-08-06/sidebar-primary-action-icon-current/`。

## 2026-08-06 — current-head Sidebar primary shortcut closure

- current Web的New thread/Search trailing shortcut均为44×20 group，两个20×20
  Kbd pills、gap4、row right inset8；key为12/16/500、r4、muted foreground/background。
  Lynx此前New thread完全漏传shortcut，Search则把parts join成10px plain `⌘K`。
- 新增单一`LYNX_PRIMARY_SHORTCUT_LABELS`来源，Sidebar同时传New thread/Search，
  Search palette复用同一`⌘N`；adapter改为逐part TEXT key anatomy，不再joined text。
- focused shortcut **1 file / 2 tests**，configured Lynx-for-Web与
  Native/Desktop builds通过。Lynx-for-Web两组final均44×20、key20×20、gap4、
  inset8、12/16/500、r4，light tokens与Web exact；Web/Lynx PNG1280×820、
  browser errors空。
- exact-owned Native bundle `3ad25303…`，root/child由本轮隔离HOME持有，
  PID-derived localhost:8902/session1；两组44×20、四个key均20×20、
  typography12/16/500、四角r4，raw2560×1576、warning/error console0。
  Native跟随system dark，仅用于structure/geometry/typography/runtime-clean证明；
  同主题颜色比较使用Web/Lynx-for-Web light frames。证据在
  `shots/2026-08-06/sidebar-primary-shortcut-current/`。

## 2026-08-06 — current-head Sidebar shortcut reveal closure

- current Web shortcut默认opacity0，row hover/focus-visible后经150ms
  cubic-bezier(0.4,0,0.2,1)显示；上一刀Lynx anatomy虽然exact，但默认始终opacity1。
  `.AppSidebarShortcut`补默认0与同transition，shared row `ui-hover/ui-focus`显示。
- 第一次post-patch Browser probe诚实失败：默认已隐藏，但Playwright真实pointer hover
  没触发Lynx `bindmouseenter`，row无`ui-hover`，不能用unit class test冒充产品通过。
- 在Web-only host新增通用`focusable=true` → Web tab stop与composed
  mouse/focus → `ui-hover/ui-focus` bridge；WeakSet区分host-owned tabindex/class，
  绝不删除runtime/product已有ownership。Desktop/Lynx bundle不包含该bridge。
- focused **2 files / 6 tests**，configured Lynx-for-Web与Native/Desktop builds通过。
  final Lynx-for-Web真实pointer序列为default0 → New thread `ui-hover`/1 → leave0，
  Search保持0；真实Tab也到达New thread X-VIEW并发布`ui-focus/:focus-visible`、opacity1；
  PNG1280×820、browser errors空。
- exact-owned Native bundle `74464b6d…`，PID-derived localhost:8904/session1；
  default shortcut为44×20、opacity0、transition property opacity/duration150/
  cubic-bezier exact，raw2560×1576、warning/error console0。Desktop DevTool没有可靠
  retained mouseenter path，因此不冒充Native hover proof。证据在
  `shots/2026-08-06/sidebar-primary-shortcut-reveal-current/`。

## 2026-08-06 — current-head Sidebar primary focus ring closure

- 真实keyboard focus暴露shared row residual：Web为1px inset ring且无painted outline；
  Lynx原来是outer `0 0 0 1px` shadow，在Web tab-stop bridge启用后还叠加浏览器
  `outline:auto`，形成外扩/double seam。
- shared focus owner改为`outline:none` + `inset 0 0 0 1px var(--ring)`。真实Web与
  Lynx-for-Web Tab focus均为inset 1px，Lynx outline style none；PNG1280×820、
  browser errors空。1px row width与32px titlebar offset继续作为已登记engine boundary，
  custom VIEW radius0不冒充numeric radius proof。
- focused **2 files / 6 tests**，configured Lynx-for-Web与Native/Desktop builds通过。
  exact-owned Native bundle `b7fb1f36…`含encoded inset marker，PID-derived
  localhost:8904/session1，raw2560×1576、warning/error console0。DevTool无支持的
  retained focus/key command，因此不冒充Native focused visual proof。证据在
  `shots/2026-08-06/sidebar-primary-focus-ring-current/`。

## 2026-08-06 — current-head Sidebar primary pressed closure

- 真实pointer-down暴露shared row pressed residual：Web保持opacity1并使用
  `sidebar-accent-active/sidebar-accent-foreground`；Lynx复用hover surface且整行
  opacity.8。shared pressed owner改为active tokens并删除whole-row dim。
- current主题下hover/active background可能解析为同一数值，本刀保持Web语义owner，
  不捏造更强颜色。真实Web/Lynx-for-Web pointer-down均opacity1，Lynx发布
  `ui-pressed`，pointer-up正确清除；PNG1280×820、browser errors空。
- focused **2 files / 6 tests**，configured Lynx-for-Web与Native/Desktop builds通过。
  exact-owned Native bundle `db6de088…`，PID-derived localhost:8901/session1，
  含primary/active token markers且warning/error console0。non-raised window没有发
  screencast frame，该capture按harness failure拒绝且不循环重试，不冒充Native
  pressed visual proof。证据在
  `shots/2026-08-06/sidebar-primary-pressed-current/`。

## 2026-08-06 — current-head Sidebar primary section rhythm closure

- current Web Automations bottom→Projects top为16px，primary group bottom padding6且
  无divider；Lynx此前为20px，来源是padding-bottom9 + 1px divider。
- `.AppSidebarPrimaryNav`改为`padding:0 6px 6px`并移除bottom border，保留既有
  margin-bottom4。final Web/Lynx-for-Web visual pitch均exact 16px；内部margin box
  拆分为Web 6+10、Lynx 8+8，因host-element ownership不同，不用匿名offset强行同构。
- focused **2 files / 6 tests**，configured Lynx-for-Web与Native/Desktop builds通过；
  Browser PNG1280×820、errors空。exact-owned Native bundle `87db0d92…`，
  PID-derived localhost:8904/session1，raw2560×1576、warning/error console0。
  证据在`shots/2026-08-06/sidebar-primary-section-rhythm-current/`。

## 2026-08-06 — current-head Sidebar section-header typography closure

- current Web Projects section label复用shared section identity：12/18/400、
  muted/58；Lynx此前为10px/implicit/600/full muted。
- `.SharedSidebarListSectionHeaderText`改为12/18/400并在theme-safe muted color上
  opacity.58。final Web/Lynx-for-Web直接text box均46.28125×18、typography exact；
  PNG1280×820、browser errors空。当前snapshot无populated Pinned，不伪造第二consumer，
  shared adapter/source contract覆盖其余consumer。
- focused **2 files / 6 tests**，configured Lynx-for-Web与Native/Desktop builds通过。
  exact-owned Native bundle `968dc10d…`，PID-derived localhost:8904/session1；
  Projects TEXT直接测得12/18/400、opacity.58、box18，raw2560×1576、console0。
  证据在`shots/2026-08-06/sidebar-section-header-typography-current/`。
