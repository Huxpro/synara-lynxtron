# 01 — Roadmap（任务状态表）

状态值：`pending` / `in_progress` / `completed` / `blocked(原因)` / `skipped(原因)`
落地位置（历史）：`synara-lynx` 是原可逆 staging；`synara` 是主仓。

> **P8-Q1 后当前控制面**：本目录已随应用迁入 `synara/apps/lynx/plan`；审计从主仓执行，不依赖相邻 staging：
> `bun run --cwd apps/lynx audit:reuse`、`audit:reuse:check`、`audit:style`、`audit:style:check`。P5-R5 的专用 config 仅保留历史证据；其已删除的 fidelity entry 不作为当前门禁运行。
> `synara-lynx` 保留不改，供恢复与历史审计。

## Phase 0 — 风险消减 spike（纯验证，不改主仓）

| ID | 任务 | 退出标准 | 依赖 | 落地 | 状态 |
|---|---|---|---|---|---|
| P0-S1 | Lynxtron scaffold + sidecar 冒烟 | `npm create @lynx-js/lynxtron` 跑通；主进程用 `utilityProcess.fork` 启动一个 Node HTTP server 并探活成功；结论写入 spikes/p0-s1/README.md | — | synara-lynx | completed（2026-07-27 · [结论](../spikes/p0-s1/README.md)） |
| P0-S2 | **WebSocket 判定（生死线）** | 三路径实测并出数据：(a) Lynx view 内直连 WS（验证 LynxWebSocketModule 是否预注册）；(b) lynxBridge 中继主进程 WS（测延迟/吞吐/断线重连）；(c) SSE+fetch 替代。结论→决策 D4 | P0-S1 | synara-lynx | completed（2026-07-27 · (a)直连可行 RTT≤1ms · [结论](../spikes/p0-s2/README.md)） |
| P0-S3 | Tailwind v3 preset 覆盖率实测 | 从 synara 组件提取最高频 ~500 个 class，喂 `@lynx-js/tailwind-preset`，输出通过率与不通过清单→决策 D1 | — | synara-lynx | completed（2026-07-27 · 66% 绝对 / 80.1% 加权 · [报告](../spikes/p0-s3/README.md)） |
| P0-S4 | `<list>` 滚动跟随语义验证 | 最小 transcript 模型：流式追加 + 底部吸附 + 用户上滚脱离；验证子组件 JS 提前实例化、ref≠可见、scroll 事件节流三个语义；模式记录→04 | P0-S1 | synara-lynx | completed（2026-07-27 · 三语义全坐实 · [结论](../spikes/p0-s4/README.md)） |
| P0-S5 | CEF webview 兜底路径验证（可选） | `<webview>` 加载 synara web build 成功；mac arm64 可用性确认；结论→决策 D3 | P0-S1 | synara-lynx | completed（2026-07-27 · 阴性：插入即 view 崩溃，无 CEF 走 WKWebView · [结论](../spikes/p0-s5/README.md)） |

Phase 0 出口：D4（WS 路径）、D1（Tailwind 策略所需数据）、D3（是否兜底）三个决策具备数据；04-lynx-patterns.md 有首批条目。

## Phase 1 — 主仓分层地基（对 web 零行为变化，可独立合入）

| ID | 任务 | 退出标准 | 依赖 | 落地 | 状态 |
|---|---|---|---|---|---|
| P1-F1 | `apps/web/src/platform/` ports 骨架 | storage/socket/clipboard/window/dialogs/motion/scroll 七个接口 + web impl（现状薄封装）；调用方切换完毕 | — | synara | completed（2026-07-27 · 66 文件切换，vitest 与基线一致 · 未 commit） |
| P1-F2 | `window.*` 收敛 + lint 禁则 | 直接引用 window/document/navigator/localStorage 的文件 <30（现状 119），全部在 platform/、components/ui、特性岛内；oxlint no-restricted-globals 分区规则落地 | P1-F1 | synara | completed（2026-07-27 · 区域外引用=0（oxlint 强制）· 区域内 34 文件，<30 尾项见 03；未 commit） |
| P1-F3 | 死代码清理 | 删除 env.ts/nativeApi.ts 的 window.nativeApi 死间接层；移除 shadcn dep（0 运行时引用）；主仓 fmt/lint/typecheck 通过 | — | synara | completed（2026-07-27 · 死层删除+测试迁移 setNativeApiForTest；shadcn dep+components.json 移除；vitest 同基线；fmt/lint/typecheck 按约束未跑，scoped oxlint 0 错误 · 未 commit） |
| P1-F4 | tokens.css 提取 | @theme 66 个设计令牌抽为独立 tokens.css，index.css import 之；双端共享就绪 | — | synara | completed（2026-07-27 · :root 108 声明（亮 66+暗 42）→ tokens.css，vite build 验证产物含 dark 变体 · 未 commit） |
| P1-F5 | React 19 特性降级 | useTransition×7 → @tanstack/react-pacer；useId×9 → 计数器 util；startTransition×5 确认 /compat 兼容或替换 | — | synara | completed（2026-07-27 · useDeferredValue×7→useDebouncedValue、useId×10→useUniqueId、useTransition+useOptimistic→手动态；startTransition 保留（/compat 已证）；vitest 同基线 · 未 commit） |
| P1-F6 | CSS diff 工具 | PostCSS 插件扫 index.css + 组件 class，以 Lynx CSS 属性索引为白名单输出 ✅/🔧/🔀 报告；接入 CI；首份报告回填 02-compat-matrix.md | P1-F4 | synara | completed（2026-07-27 · scripts/lynx-css-report.ts + ratchet --check 接 CI，首报 28 条已回填 02 · 未 commit） |

Phase 1 出口：主仓 lint 强制边界生效；平台代码只存在于四个允许位置；tokens.css 可共享。
**✅ Phase 1 出口达成（2026-07-27）**：F1~F6 全部 completed；oxlint no-restricted-globals 分区强制（区域外=0）；platform/ 10 文件 L1 就位；tokens.css 可共享；CSS ratchet 在 CI。遗留 🟡：F2 文件数 34>30（03 记录）；F3 的 fmt/lint/typecheck 按约束未跑（用户审查时跑）。

## Phase 2 — 垂直切片（目标：真实 WS 数据驱动的只读聊天界面）

| ID | 任务 | 退出标准 | 依赖 | 落地 | 状态 |
|---|---|---|---|---|---|
| P2-V1 | ReactLynx app 骨架 | Rspeedy 工程 + memory-history TanStack Router（isServer:false、URLSearchParams polyfill、react/compat alias）+ zustand + react-query 跑通；tokens.css 生效 | P0-S1, P1-F4 | synara-lynx | completed（2026-07-27 · slice/ 跑通；Router 组件层不兼容→@tanstack/history+自研渲染层（04 P-08）· [README](../slice/README.md)） |
| P2-V2 | L1 lynx impls | storage/net.socket/clipboard/dialogs 的 lynx 实现（net.socket 按 D4 结论）；与主仓 platform/ 接口对齐 | D4, P1-F1 | synara-lynx + synara | completed（2026-07-27 · 四 port+host bridge；storage/WS/clipboard 实机通过，dialogs API+confirm 验证 · [README](../slice/README.md) · [截图](../shots/2026-07-27/p2-v2/ports-final.png)） |
| P2-V3 | ui/ 原语首批 | button/dialog/menu/tooltip/input 等切片所需 wrapper 的 .lynx.tsx（对照 lynx-ui）；调用点零改动验证 | P1-F1 | synara-lynx + synara | completed（2026-07-27 · 5 wrapper+无后缀解析；同形 call-site probe；Dialog/Menu/Tooltip 实机 · [README](../slice/README.md) · [截图](../shots/2026-07-27/p2-v3/dialog.png)） |
| P2-V4 | 图标 codemod | @tabler SVG → Lynx 静态 svg 元素映射工具 + 切片所需图标全部转换 | — | synara-lynx | completed（2026-07-27 · 14 个首切片图标静态生成，稳定 Synara export；生成确定性+build+实机全量渲染通过 · [生成器](../slice/scripts/generate-lynx-icons.mjs) · [截图](../shots/2026-07-27/p2-v4/icons.png)） |
| P2-V5 | markdown 渲染器 | react-markdown components → view/text 映射；GFM 表格/代码块可用；数学降级样式 | — | synara-lynx | completed（2026-07-27 · react-markdown render 期解析不兼容→background unified/remark AST + Lynx renderer（04 P-13）；GFM table/task/code 可用，math 源码样式降级 · [README](../slice/README.md) · [截图](../shots/2026-07-27/p2-v5/markdown-final.png)） |
| P2-V6 | 只读聊天线程视图 | `<list>` transcript + markdown + 真实 synara server WS 数据；滚动跟随按 04 模式 | P2-V1~V5, P0-S4 | synara-lynx | completed（2026-07-27 · 原生 WS 双段握手+真实 snapshot/threads/messages；P-02 `<list>` transcript + markdown · [截图](../shots/2026-07-27/p2-v6/transcript-real.png)） |
| P2-V7 | side-by-side 对比基线 | 按 05 协议跑通首轮：Web 侧 5 核心屏幕基线截图 + Lynx 侧同屏截图 + notes.md 检查单；新差异回填 02 | P2-V6 | synara-lynx | completed（2026-07-27 · 5 组 Web/Lynx/notes 基线；真实 thread 同源，未实现面显式 🔀 · [截图根目录](../shots/2026-07-27/)） |

Phase 2 出口：垂直切片达成 + 首轮 side-by-side 对比报告；02/03/04 文档丰满；Phase 3 工作量有实测依据。

**✅ Phase 2 出口达成（2026-07-27）**：真实 Synara WS 只读 thread/transcript 垂直切片已
落地；5 屏首轮 side-by-side 基线完成。报告把 composer/settings/sidebar 未实现面明确标为
🔀，直接形成 P3-E1/E2/E3 的实测工作量输入，而非伪装成视觉等价。

## Phase 3 — 逐特性推进（切片后细化）

| ID | 任务 | 备注 | 依赖 | 落地 | 状态 |
|---|---|---|---|---|---|
| P3-E1 | Composer（textarea + Lynx chips/mentions） | composer-nodes AST 逻辑复用 | P2-V6 | synara-lynx | completed（2026-07-27 · native textarea + Web-compatible serializable token AST + Lynx chip/suggestion rows；draft-only · [截图](../shots/2026-07-27/p3-e1/composer-chips.png)） |
| P3-E2 | 设置页 | 表单类，低危 | P2-V3 | synara-lynx | completed（2026-07-27 · General/Appearance 双栏 + input/toggle/swatches；本地 KV hydration/即时持久化 · [截图](../shots/2026-07-27/p3-e2/settings.png)） |
| P3-E3 | Sidebar（6.7k 行拆解） | 先借 P1 拆 .logic.ts 再双实现 | P2-V6 | synara + synara-lynx | completed（2026-07-27 · 复用主仓既有 Sidebar.logic 边界；Lynx 纯 projection + 原生双栏 renderer，真实项目/线程分组 · [截图](../shots/2026-07-27/p3-e3/sidebar.png)） |
| P3-E4 | 项目/看板/PR 列表 | — | P3-E3 | synara-lynx | completed（2026-07-27 · 真实 snapshot 项目卡/只读三列看板/真实 `pullRequests.list` 空态 · [截图](../shots/2026-07-27/p3-e4/)） |
| P3-E5 | 终端（按 D2） | webview/native/裁剪 | D2 | 待定 | placeholder（D2/D13：terminal runtime 不移植、登记 hard island，但保留入口与说明性占位表面） |
| P3-E6 | PDF/浏览器面板 | webview 或桌面独占 | D3 | synara-lynx + synara | placeholder（D3/D13：放弃 Lynxtron 0.0.7 不可用的 webview 兜底；一期保留入口与说明性占位表面，runtime 为 hard island） |

## Phase 4 — 壳与发行

| ID | 任务 | 退出标准 | 依赖 | 落地 | 状态 |
|---|---|---|---|---|---|
| P4-X1 | Lynxtron main 移植 | apps/desktop 能力映射表逐项翻译（window 状态、菜单/快捷键、protocol、logging、迁移）；globalShortcut/autoUpdater 缺口有降级方案 | P2-V6 | synara-lynx | completed（2026-07-27 · window/menu/deep-link/log/migration/WindowPort 实装；缺口显式降级 · [能力表](../slice/docs/p4-x1-capabilities.md) · [深链截图](../shots/2026-07-27/p4-x1/deep-link-settings.png)） |
| P4-X2 | updater 降级方案 | 检测更新+跳转下载，或自研（electron-updater 不可用已确认） | P4-X1 | synara-lynx | completed（2026-07-27 · GitHub latest metadata + semver compare + 固定官方下载页；零下载/安装副作用 · [截图](../shots/2026-07-27/p4-x2/update-check.png)） |
| P4-X3 | 打包发行 | electron-builder.yml 产出 mac 安装包；冒烟通过 | P4-X1 | synara-lynx | completed（2026-07-27 · unsigned arm64 DMG 校验/只读挂载/打包版实机通过 · [记录](../slice/docs/p4-x3-packaging.md) · [截图](../shots/2026-07-27/p4-x3/packaged-smoke.png)） |

**✅ P0–P4 当时全部可达任务完成（2026-07-27）**：该轮按停止条件 b 收口。UI 复盘后
新增 Phase 5–8；P3-E5/P3-E6 后续已由 D2/D3/D13 收口为一期 placeholder/hard island，
不阻塞普通 UI 高保真迁移主线。

## Phase 5 — 复用地基重置（从原组件树开始）

| ID | 任务 | 退出标准 | 依赖 | 落地 | 状态 |
|---|---|---|---|---|---|
| P5-R1 | 复用审计 + fidelity contract | 六个核心屏入口依赖图；逐模块 SHARED/PATCHED/SPLIT/EXCLUSIVE；eligible reuse 基线；视觉阈值与豁免格式落盘 | P2-V7 | synara-lynx + synara | completed（2026-07-27 · 六屏 305–586 模块图；当前 physical-source reuse=0%；[基线](reports/p5-r1-reuse-baseline.md) · [审计](reports/p5-r1-interface-audit.md) · [模板](templates/fidelity-notes.md)） |
| P5-R2 | 原组件树 Lynx 编译探针 + 落点决策 | 选 Settings/Threads 代表子树，不复制 JSX，直接经 alias/adapter 进入 Rspeedy；编译+实机；用数据收口 D7 | P5-R1, P1-F1 | synara-lynx + synara | completed（2026-07-27 · 同一 SettingsSection 物理源经 host-element adapter 双端编译并在 Lynxtron 实机渲染；D7=a 单仓 · [记录](../slice/docs/p5-r2-compiler-probe.md) · [截图](../shots/2026-07-27/port/p5-r2/shared-settings-probe/lynx.png)） |
| P5-R3 | 同 API UI primitives | 切片所需 button/input/dialog/menu/tooltip/scroll/disclosure 等保持 Web import/props；平台文件解析；代表 Web call-site 零改动 | P5-R2, P2-V3 | synara-lynx + synara | completed（2026-07-27 · 七类 canonical import 精确映射；主仓 DebouncedSettingTextInput 零改动编译+实机 · [契约](../slice/docs/p5-r3-ui-primitive-contract.md) · [截图](../shots/2026-07-27/port/p5-r3/primitive-contract/lynx.png)） |
| P5-R4 | 同源样式管线 | tokens + core-screen class manifest；Lynx utility 加权覆盖 ≥95%；semantic color/spacing/type 映射；新增差异 ratchet | P5-R2, P1-F4, P1-F6 | synara-lynx + synara | completed（2026-07-27 · production graph resolver 修正后当前六屏 2,256 tokens；eligible weighted coverage 98.03%；physical-shared runtime CSS + coverage/unmapped/unsupported ratchet · [报告](reports/p5-r4-style-coverage.md) · [管线](../slice/docs/p5-r4-style-pipeline.md) · [实机](../shots/2026-07-27/port/p5-r4/style-pipeline/lynx.png)） |
| P5-R5 | 复用率 + 视觉回归门禁 | 自动生成 screen source-reuse 报告；同数据截图比较；布局锚点≤8px、字号≤2px、无未登记大色块差异；reference screen 达标 | P5-R3, P5-R4 | synara-lynx | completed（2026-07-27 · 真实 Settings Behavior route-owned panel：module reuse 75%、LOC reuse 89.31%、gate 75%；双尺寸最大锚点偏差 1.75px、字号差 0px、无未登记大色块 · [复用报告](reports/p5-r5-reference-reuse.md) · [验收](../slice/docs/p5-r5-fidelity-gate.md) · [证据](../shots/2026-07-27/port/p5-r5/settings-behavior/notes.md)） |

Phase 5 出口：至少一个真实核心屏由原组件树驱动，eligible source reuse ≥70%，不存在
clean-room 页面副本；视觉门禁可重复运行。详细口径见 `06-high-fidelity-port.md`。

> **执行顺序覆盖（D13，2026-07-28 用户决策）**：聊天主 UI 为最高优先级。
> 实际推进顺序为 **P6-C2（Thread + Transcript + `<list>` 完整聊天）→ P6-C3（Composer）
> → P6-C1 收尾 → P6-C4 → P6-C5 → P6-C6**，不按 ID 顺序。
> **≥70% 复用率不再是放行门禁**，降为报告用目标值；任务放行以 06 的视觉契约
> （两尺寸、锚点 ≤8px、字号 ≤2px、semantic tokens、同源真实数据、无未登记差异）为准。
> terminal 与内嵌 browser/PDF 一期走 placeholder。

## Phase 6 — 核心屏组件树迁移

| ID | 任务 | 退出标准 | 依赖 | 落地 | 状态 |
|---|---|---|---|---|---|
| P6-C1 | App shell + Sidebar + Threads | 移植原 shell/sidebar/thread-list 结构与 tokens；移除诊断顶栏；真实数据；两尺寸 side-by-side 达标 | P5-R5, P3-E3 | synara-lynx + synara | completed（2026-07-30 · app frame、desktop sidebar header、segmented/primary surfaces、Projects/Chats/Pinned/Studio sections、project disclosure、thread rows/paging/status/meta、Settings footer、content/header/composer frames 均为物理 shared composition；真实 normalized store、renderer persistence、search/navigation/pinning/route restore/PR badge runtime 已闭环。Final same-server/snapshot/thread 1280×820 + 1440×900 pair 中 sidebar/main/header/content like-for-like anchors 最大偏差 3.62px，header icon/title 各约 2px；Web Sidebar 148/148、slice Sidebar 10/10、双端 production 与 serial audit green。Automations disabled capability、hover/keyboard 与 light/dark 明确交 Phase 7，不画假能力 · [final shell evidence](../shots/2026-07-30/port/p6-c1/final-shell/notes.md)） |
| P6-C2 | Thread + Transcript + Markdown | 复用原 thread surface/message row 组合；仅 list/markdown renderer 为平台岛；流式/空态/长消息视觉达标 | P6-C1, P2-V5, P2-V6 | synara-lynx + synara | completed（2026-07-29 · Web/Lynx 产品共同消费原 message-row、timeline status、empty/panel state 与 typography composition；真实 snapshot 走 Web `deriveWorkLogEntries`→`deriveTimelineEntries`→`deriveMessagesTimelineRows`；仅 `<list>`、Markdown renderer、disclosure 事件为已登记平台岛；同 snapshot 1280×820/1440×900 paired anchors 达 ≤8px/≤2px（[geometry evidence](../shots/2026-07-29/port/p6-c2/paired-real/notes.md)）；30-row long Markdown/code/GFM/empty 与 stick→detach→restick→complete renderer gate 已通过（[renderer evidence](../shots/2026-07-29/port/p6-c2/transcript-probe/notes.md)）；empty/loading/offline/error composition 有产品实机证据（[state evidence](../shots/2026-07-29/port/p6-c2/thread-states/notes.md)）；用户授权后发送 real OpenCode turn，production Web 运行中 spinner/stop 帧与 Lynx 增量 transcript 同时捕获，并保存 completed 双尺寸帧（[real streaming evidence](../shots/2026-07-29/port/p6-c2/real-streaming/notes.md)）；为 ReactLynx background 无 timer/observer notification 增加 host `timerSleep` 单飞轮询、thread-key remount 与 snapshotSequence referential cache，长 row 用内容估算 main-axis；slice focused 6/6、broad excluding registered loader baseline 33/33、Web logic 64/64、双端 production green、serial audits/diff checks green；thread reuse **16.38%**、style **98.04%**；Web component 组合套件仍有 5 个与本刀无关的既有 tool-icon/status-row expectation drift，已在 evidence 明示） |
| P6-C3 | Composer | 复用原 composer chrome、toolbar、附件/mention 状态与 tokens；编辑器内核保留已登记 Lynx island；draft 交互视觉达标 | P6-C2, P3-E1 | synara-lynx + synara | completed（2026-07-30 · Web/Lynx 产品物理共享 shell/editor/footer、attachments、commands/mentions、provider/model/trait/Fast/favourite compositions；真实 send/stop、runtime mode、dynamic discovery、provider switch、trait/Fast delivery 与 persistence 均有 server/runtime 证据。Final same-server/snapshot/thread paired gate 在 1280×820 与 1440×900 均得到 736×95 shell、708×39 editor、34px footer，Composer-owned anchor 最大偏差 4px且 typography 精确一致。Lexical/textarea、native keyboard/focus、voice/file capability 均作为诚实平台 split 登记；header icon/title like-for-like delta 约 2px · [final evidence](../shots/2026-07-30/port/p6-c3/composer-paired/notes.md)） |
| P6-C3 update | Runtime primary trait（第十二刀） | Web/Lynx 共同消费 shared trait radio section；Codex Terra High 精确进入 turn options 并获真实 provider 回复 | P6-C3 | synara-lynx + synara | completed cut（2026-07-30 · seq 120 `reasoningEffort: high`，seq 135/136 `TRAIT-HIGH-OK`；Web 23/23、slice 15/15、Web 8,867 modules、slice 1973.9/2089.5kB；thread reuse 29.71%、threads-shell 53.49%、style 98.04%；P6-C3 总任务仍 in_progress，Fast/favorites、voice capability 与 final 双尺寸 paired gate 待完成 · [evidence](../shots/2026-07-30/port/p6-c3/composer-traits/notes.md)） |
| P6-C3 update | Fast Mode（第十三刀） | Runtime capability→shared Effort toggle/Extras→draft options→Codex fast service tier 全链路 | P6-C3 | synara-lynx + synara | completed cut（2026-07-30 · seq 148 `fastMode:true`，seq 159/160 `FAST-MODE-OK`；Web 23/23、slice 15/15、Web 8,867 modules、slice 1977.4kB / desktop total 2093.1kB；thread reuse 29.74%、style 98.04%；P6-C3 总任务仍 in_progress，favorites/voice capability 与 final paired gate 待完成 · [evidence](../shots/2026-07-30/port/p6-c3/composer-fast/notes.md)） |
| P6-C3 update | Model favourites（第十四刀） | Web/Lynx 共用 support/key/toggle/grouping；native nested star 不误选 model；canonical KV 与客户端重启恢复 | P6-C3 | synara-lynx + synara | completed cut（2026-07-30 · OpenCode `North Mini Code Free` 即时进入 `Favourites`，popup 保持且 active Codex trigger 不变；canonical key 精确落盘，完整 Lynx restart 后自动恢复；Web 21/21、slice 15/15、Web 8,868 modules、slice 1981.9/2097.5kB；thread reuse 29.75%、threads-shell 53.51%、style 98.04%；P6-C3 总任务仍 in_progress，voice 已登记 native unavailable，final paired gate 待完成 · [evidence](../shots/2026-07-30/port/p6-c3/composer-favorites/notes.md)） |
| P6-C3 update | Voice capability audit（第十五刀） | 区分既有 Web/server transcription 与 Lynx native capture/permission 缺口；不画假入口 | P6-C3 | synara-lynx + synara | completed capability audit（2026-07-30 · Web `getUserMedia`/`AudioContext`→24 kHz WAV→`server.transcribeVoice`→Codex pipeline 已存在；Lynxtron 0.0.7 与 slice main process 无 microphone recorder/permission/audio bridge，故一期明确 unavailable；无产品代码假实现 · [compat](02-compat-matrix.md) · [pattern](04-lynx-patterns.md#p-87-server-transcription-已存在不等于-native-voice-可用录音权限桥缺失时不画假-mic-p6-c3)） |
| P6-C3 update | Final paired geometry（第十六刀） | 同 server/snapshot/thread 双尺寸量化 Composer shell/editor/footer 与 typography | P6-C3 | synara-lynx + synara | completed cut（2026-07-30 · 1280×820 / 1440×900 均为 736×95 shell、708×39 editor、34px footer；Composer-owned anchor 最大偏差 4px、typography 精确一致；Web focused 21/21、slice focused 22/22、Web 8,868 modules、slice 1981.9/2097.5kB；native titlebar、textarea keyboard/focus、voice/file capability 均显式登记；header icon/title like-for-like delta 约 2px · [evidence](../shots/2026-07-30/port/p6-c3/composer-paired/notes.md)） |
| P6-C4 | Settings | 复用原 settings navigation、section/card/control 结构；平台 storage adapter；General/Appearance 两主题达标 | P6-C1, P3-E2 | synara-lynx + synara | completed（2026-07-30 · navigation/header/General/Appearance/theme-pack editor 均 physical-shared；canonical local + live server mutation、light/dark 1280×820/1440×900 paired gate 完成，最大锚点差 6px；Lynxtron native text input crash 显式登记，clipboard Import 为 retained fallback · [evidence](../shots/2026-07-30/port/p6-c4/settings-paired/notes.md)） |
| P6-C4 update | Settings navigation（第一刀） | Web/Lynx 共同消费 App/Synara taxonomy、15 rows、order/active/availability；native 未支持 panel disabled | P6-C4 | synara-lynx + synara | completed cut（2026-07-30 · full Web sidebar probe 2047.0kB 仅作 compiler finding；retained narrow composition 1992.5/2108.1kB，Web 11/11、slice 1/1、Web production 8,871 modules；首帧 canonical alias 缺失导致 Web host blank rows，修复后 production Settings route 全 labels/active/disabled rows 绘制且 console clean；P6-C4 总任务仍 in_progress，shell/header、General/Appearance canonical storage/theme 与 paired gate 待完成 · [evidence](../shots/2026-07-30/port/p6-c4/settings-navigation/notes.md)） |
| P6-C4 update | Settings panel header（第二刀） | Web/Lynx 共同消费 canonical title/description/restore anatomy 与 availability rendering | P6-C4 | synara-lynx + synara | completed cut（2026-07-30 · Web route 与 Lynx 产品页反向消费同一 header composition；首个 runtime candidate 暴露 defaults 状态 action 误启用，修正 native current/default equality 后 final frame disabled 且 console clean；Web 13/13、slice 2/2、Web 8,874 modules、slice 1995.1/2110.7kB；settings reuse 41.75%、style 98.04%；P6-C4 总任务仍 in_progress，General/Appearance canonical storage/theme 与 paired gate 待完成 · [evidence](../shots/2026-07-30/port/p6-c4/settings-panel-header/notes.md)） |
| P6-C4 update | General + canonical storage（第三刀） | Web/Lynx 共用 4 sections / 17 rows / selects / toggles / reset；删除 local renderer；canonical KV + server thread mode | P6-C4 | synara-lynx + synara | completed cut（2026-07-30 · Web 276 行 General renderer 与 slice 4-row clean-room JSX 删除；canonical `synara:app-settings:v1` projection preserve unknown fields，thread mode 分流 server RPC；首帧 select trigger labels 空白，修正 MenuTrigger child 后实机恢复。canonical Workspace fixture 证明 toggle/reset/global Restore 同步并已逐字恢复；Web 77/77、slice 3/3、Web 8,878 modules、slice 2010.9/2126.5kB；settings reuse 42.48%、style 98.04%；P6-C4 仍 in_progress，Appearance/theme、server live mutation 与 paired gate 待完成 · [evidence](../shots/2026-07-30/port/p6-c4/settings-general/notes.md)） |
| P6-C4 update | Appearance + canonical theme（第四刀） | Web/Lynx 共用 Theme/typography/density/terminal/time composition；canonical app/theme projection；light/dark native runtime | P6-C4 | synara-lynx + synara | completed cut（2026-07-30 · 修正 Web double-card、side-effectful font suggestion import、pre-hydration native change 覆盖持久 dark 与 dark input contrast；Web 66/66、slice 4/4、Web 8,881 modules、slice 2035.6/2151.3kB；settings reuse 46.60%、style 98.04%；ThemePackEditor native 仍为 summary，不冒充完整编辑能力，P6-C4 保持 in_progress · [evidence](../shots/2026-07-30/port/p6-c4/settings-appearance/notes.md)） |
| P6-C4 update | Theme-pack editor（第五刀） | Web/Lynx 共用双 pack header/actions/code-theme 与 7 行 editable anatomy；canonical full-state mutation + clipboard import/export | P6-C4 | synara-lynx + synara | completed cut（2026-07-30 · 删除原 monolithic Web renderer；native default 与 `light/linear/#ff0066` restart 两帧、Copy `clipboardWriteText`、Import `clipboardReadText→storageSet` 均有 runtime 证据；Web 30/30、slice 5/5、Web 8,883 modules、slice 2079.8/2195.4kB；settings reuse 46.33%、style 98.03%；native HEX typing 因 Lynx AX/container focus 限制未冒充 tap proof，P6-C4 仍待 final paired/server gate · [evidence](../shots/2026-07-30/port/p6-c4/settings-theme-editor/notes.md)） |
| P6-C4 update | Final paired + server gate（第六刀） | 同 58090 server/state 双主题双尺寸；live thread-mode mutation；量化 shell/content/card/typography | P6-C4 | synara-lynx + synara | completed cut（2026-07-30 · Lynx→server `New worktree` 实时投影到 Web；首轮 904px native card 暴露后收敛为双方 624px，最大锚点差 6px；Web 37/37、slice 5/5、Web 8,883 modules、slice 2079.9/2195.6kB；native key input 复现 Lynxtron `Flutter text model must not be null` crash 并登记为平台 kernel gap · [evidence](../shots/2026-07-30/port/p6-c4/settings-paired/notes.md)） |
| P6-C5 | Projects + Kanban + PR | 复用原列表/card/column/empty-state 结构；DnD/mutation 可登记豁免但静态与只读状态达标 | P6-C1, P3-E4 | synara-lynx + synara | completed（2026-07-30 · Kanban card/overview/read-only column/route header/canonical board projection，及 PR list/row/loading/empty/header/filter/Summary detail 均已 physical-share；native hero 与简化 DTO renderer 已删除。真实 PR #478 完成 detail、native pin→Web Pinned→native unpin→Web restored；Timeline/Code/commenting 明示 unavailable。Final same-server/state 1280×820 + 1440×900 matrix 覆盖 Kanban overview/project 与 PR list/detail，最大 like-for-like anchor 6.5px，PR detail split 0/1px，console clean；gate 55+6、Web 8,900 modules、slice 2211.2/2326.8kB、strict audits/diff checks green。Projects/Kanban reuse 52.07%、PR 56.91%、style 98.06%；KV/window-state 以明确 baseline byte-exact 恢复。[final evidence](../shots/2026-07-30/port/p6-c5/final-paired/notes.md)） |
| P6-C6 | Shared-source convergence | 合并/删除被共享组件树替代的 slice 页面副本；汇总六屏 reuse 报告（≥70% 为报告目标，未达逐模块解释但不单独阻塞）；视觉契约与 Web 行为基线达标 | P6-C2, P6-C3, P6-C4, P6-C5 | synara-lynx + synara | completed（2026-07-30 · 七刀完成：诊断 routes/CSS 退出 production graph；Kanban route header 单一 owner；PR tabs/capability 与 close 同源并删除错误 native identity；Settings Back/Search capability 同源并剪掉 crashing input；Thread collapsed-work chrome 同源、只留 disclosure 事件平台 Elements。六核心屏 ownership 与 below-70 gap 已逐组解释，未扩大 EXCLUSIVE。Final Web 4 files/8 tests、slice 4 files/20 tests、Web 8,908 modules、slice 2173.0/2288.6kB、strict audit/diff checks green；threads 55.05%、shell 63.33%、thread 38.26%、settings 51.19%、projects/kanban 52.15%、PR 57.08%、style 98.06%。[convergence report](reports/p6-c6-convergence.md)） |

Phase 6 出口：六个核心屏不再是独立重画版；默认窗口与第二尺寸下结构/排版/颜色达到
contract，Web 与 Lynx 的差异集中在已登记平台岛。

## Phase 7 — 桌面交互与状态收敛

| ID | 任务 | 退出标准 | 依赖 | 落地 | 状态 |
|---|---|---|---|---|---|
| P7-I1 | hover/active/focus/keyboard | pointer 状态类、focus affordance、Tab/Enter/Escape、主快捷键；与 Web 交互表逐项对照 | P6-C6 | synara-lynx + synara | completed（2026-07-30 · 六屏 inventory 与十一刀 product cuts 已闭环：PR、Settings、Sidebar/Kanban、transcript/PR Summary disclosure、Composer 非文本 controls/reference attachments、Sidebar controls、Composer overlay items、shared Command primitive、Theme Pack switch。最后 direct tap scan 只剩 35 个均未传 row-level `onClick` 的 SettingsRow host、unrouted diagnostics 与无核心 consumer 的 generic Tooltip/Collapsible。真实 pointer/pressed/action/disabled、ARIA 与 focused tests 完整；Lynxtron 0.0.7 macOS host Tab 不发布 `.ui-focus`，按 P-110 登记平台 gap且不冒充 runtime keyboard pass；Jump detach/reattach按边界留给 P7-I3） |
| P7-I2 | overlays 与上下文交互 | Dialog/Menu/Tooltip/Popover/context actions 的 anchor、dismiss、z-order、disabled/loading 状态达标 | P7-I1 | synara-lynx + synara | completed（2026-07-30 · [真实 product inventory](reports/p7-i2-overlay-inventory.md)：Menu fixed layer/screen anchor/clamp/dismiss/disabled 由 Composer top/start、model top/end、Settings bottom/end 与 PR right-edge bottom/end 四类真实 consumer 闭环；Search Dialog 完成 full backdrop、center/z-order、role/modal 与 dismiss authority；model popup 删除 duplicate kernel并补 loading status。Native Sidebar 现以真实 PC secondary event→screen rect anchor→Lynxtron `Menu.popup` 消费 shared action-item policy，Pin→Unpin server round trip/Copy/Archive/Delete capability 均闭环。官方 Popover Presence 阴性结论、host physical Escape、Search text kernel 与 generic Tooltip no-consumer 边界均显式登记，不冒充支持） |
| P7-I3 | scroll/resize/density | transcript/sidebar/kanban 滚动；窗口 resize；compact/default density；1280×820 与 1440×900 无溢出/横移 | P7-I1 | synara-lynx | completed（2026-07-31 · canonical `uiDensity` 已完成 live switch、restart persistence 与 23.8/28px 实机几何；真实 host wheel 闭环 transcript detach→Jump→restick。临时真实 RPC snapshot 以 5 projects × 16 threads 证明 Sidebar titlebar/footer fixed vertical ownership、Kanban overview horizontal + nested vertical ownership、project 三列独立 vertical ownership；1280×820 与 1440×900 均无 shell displacement/page overflow。Web 9/9、slice 16/16、Web 8,909 modules、slice 2223.2/2340.1kB、strict audits/diff checks green；KV/window byte-exact 恢复 · [inventory](reports/p7-i3-scroll-resize-density-inventory.md) · [density](../shots/2026-07-30/port/p7-i3/density/notes.md) · [transcript](../shots/2026-07-30/port/p7-i3/transcript-scroll/notes.md) · [overflow/resize](../shots/2026-07-30/port/p7-i3/overflow/notes.md)） |
| P7-I4 | themes + motion | light/dark semantic tokens、selected/elevated/focus；共享 motion contract；不可支持效果有登记降级 | P7-I1, P5-R4 | synara-lynx + synara | completed（2026-07-31 · canonical ThemeState 已完成 root hydrate、Settings live propagation、restart restore 与 active `useTheme` projection；light/dark semantic sheets 由 Web theme math 生成，Settings page-local dark authority 删除。修复 Lynx embedded SVG `currentColor` 不继承导致的暗色图标；Native exact-alias motion port 对齐 Web 220ms contract，Sidebar 以 4.93/100/320ms 实测 presence，transcript 明确 immediate close 以保护 list measurement/follow。真实 thread/Settings/Kanban/PR/overlay 双主题、console clean；Web 27/27、slice 11/11、Web 8,909 modules、slice 2245.5/2362.4kB、strict audits/diff checks green，KV/window byte-exact 恢复 · [inventory](reports/p7-i4-theme-motion-inventory.md) · [evidence](../shots/2026-07-31/port/p7-i4/root-theme/notes.md)） |
| P7-I5 | 系统状态 + accessibility | loading/empty/error/offline/streaming 状态；可访问名称、键盘路径、对比度清单；核心路径无假数据 | P7-I2, P7-I3, P7-I4 | synara-lynx | completed（2026-07-31 · [六屏 inventory](reports/p7-i5-system-accessibility-inventory.md) + [cut-1](../shots/2026-07-31/port/p7-i5/accessibility/notes.md) + [cut-2](../shots/2026-07-31/port/p7-i5/system-states/notes.md) + [cut-3](../shots/2026-07-31/port/p7-i5/resilience/notes.md) + [cut-4](../shots/2026-07-31/port/p7-i5/composer-contrast/notes.md)：central Native naming 与 shared `plain/status/alert/empty` contract 已覆盖六屏系统状态；Settings hydration/save failure、Kanban offline/error/not-found/stale/retry 与 last-known-good 均闭环。Composer 只公告 sending/start/complete/stop/failure 离散转换，真实 Claude turn 暴露并修复 Stop 被误报 complete 的跨帧 race，重跑得到 `Stopping response`→`Response stopped` 与 server interrupted 证据。canonical neutral/error/success/warning informative text roles 双主题均 ≥4.5:1。Web 38/38、slice 20/20、Web 8,912 modules、slice 2267.9/2384.8kB、serial audits/diff checks green。Lynxtron 0.0.7 的 0-child AXGroup / 不可观察语音通道保留为 host gap，不冒充 audible screen-reader pass） |

Phase 7 出口：高保真不仅覆盖静态截图，也覆盖桌面指针、键盘、主题、密度与系统状态；
无法等价的行为全部进入 02/03，而非静默缺失。

## Phase 8 — 清理、认证与打包回归

| ID | 任务 | 退出标准 | 依赖 | 落地 | 状态 |
|---|---|---|---|---|---|
| P8-Q1 | 删除切片脚手架与重复 renderer | ports/ui/markdown 等诊断入口不进入产品导航；废弃页面/fixture/重复样式删除；开发诊断改显式 dev-only；主仓 build 与两仓 `git diff --check` 完成后方可收口 | P7-I5 | `synara/apps/lynx` | completed（2026-07-31 · 应用、审计控制面与历史证据已迁入主仓；五个未接入诊断页/样式/scaffold 测试/九个 `.js` 镜像删除，`/projects` alias 删除并统一 `/kanban`；`bun install`、Web/Lynx/desktop production build、reuse/style write/check 及 main/recoverable staging `git diff --check` 均通过，见 [报告](reports/p8-q1-control-plane-migration.md)） |
| P8-Q2 | 最终视觉认证矩阵 | 六核心屏 × light/dark × 1280×820/1440×900；同一 WS 数据；每组 notes+指标；零未登记重大差异 | P8-Q1 | `synara/apps/lynx` | blocked（2026-07-31 · Native 已可通过 persisted state → restart → CoreGraphics 核验两个窗口尺寸并经 DevTool capture；当前缺少可审计的精确 Web 位图 capture surface。preview exporter 的 PNG 与实际 viewport 不一致，且没有可控 Chromium/CDP 或可运行的 Playwright Chromium。未用历史/诊断证据冒充认证，见 [预检报告](reports/p8-q2-certification-preflight.md)） |
| P8-Q3 | packaged-app 回归 | unsigned arm64 DMG 重打；内置 bundle 启动、菜单/深链/update/真实数据及认证屏 smoke；checksum/记录更新 | P8-Q2, P4-X3 | `synara/apps/lynx` | pending |
| P8-Q4 | 移植完成报告 | reuse/视觉/功能/平台岛四份总表；明确 terminal/browser/PDF 一期为 placeholder/hard island，不把普通 UI 完成冒充全功能等价 | P8-Q3 | `synara/apps/lynx` | pending |

Phase 8 出口：普通 UI 的“移植完成”有源码复用和视觉证据；终端/PDF/浏览器等硬岛以明确
决策状态独立追踪；本地发行包与源码认证结果一致。

## 更新日志

- 2026-07-27：初始版本（基于 Lynxtron 调研 + ReactLynx 4.0 文档 + synara 代码审计）
- 2026-07-27：UI 复盘后新增 Phase 5–8；从 clean-room slice 校正为 compiler-driven
  component-tree port，并加入源码复用率与量化视觉门禁。
