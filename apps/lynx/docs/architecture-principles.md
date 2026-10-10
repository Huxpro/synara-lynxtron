# Web / Lynx 共享架构：原则与不变量

本文是长期有效的参考：这套 fork 如何在不改上游的前提下，让 Lynx 渲染器运行上游的代码。过程、数字和里程碑记录在 [shared-state-architecture.md](../plan/shared-state-architecture.md)；每一步的实现细节在 [shared-state-design-2026-10-09.md](../plan/reports/shared-state-design-2026-10-09.md)。

## 一句话

上游（`Emanuele-web04/synara`）拥有 Electron 产品。Lynx 渲染器直接编译上游的源码，只在它下面替换平台实现。fork 的价值在 Lynx 专属层，fork 的成本在它留在上游文件里的每一处差异。

## 派生，不要编辑

Lynx 通过构建时的**派生层**消费原样的上游源码。派生层有四种手段，全部在 Lynx 一侧、声明式、可检查：

| 手段            | 用在哪                                             | 例子                                                                                                                      |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 模块替换        | 上游模块整体换成 Lynx 实现                         | `~/wsTransport`、`~/nativeApi`、`~/platform/*`、UI 原语                                                                   |
| 环境注入        | 上游代码直接用的全局对象，由 Lynx 的构建提供       | `window`、`document`、`navigator`、`localStorage`（见下）                                                                 |
| 生成            | 需要上游文件里的一部分（未导出的函数、常量、逻辑） | `EventRouter` 从 `routes/__root.tsx` 生成，带 `--check` 防漂移；变更标记的名称/颜色表从 `DiffPanelChangeMarkers.tsx` 生成 |
| 带守卫的补丁    | 上游的缺陷，Lynx 无法绕开，上游又不能改            | 生成器在抽取前应用 `scripts/event-router-patches.mjs` 里的补丁                                                            |
| Lynx 自己的界面 | 上游把逻辑和 DOM 标记写在一起、无法派生的界面      | Lynx 的页面和 `.lynx.tsx`，只复用上游导出的逻辑、store 和 selector                                                        |

带守卫的补丁只用于修正上游的缺陷，不用于改行为或加功能。每个补丁用 AST 定位锚点：上游的代码不是补丁所针对的形状时生成器停止且不写文件；检测到上游自己修了就什么都不改，并提示删除补丁；每个补丁有一个去掉它就失败的行为测试。补丁在生成物里以 `LYNX PATCH` 标出，并列在文件头。现有一个：`drop-queued-thread-events-covered-by-snapshot`（线程快照替换线程时，丢掉队列里已被该快照包含的流式增量，否则助手文字会重复）。

手工编辑上游文件不是允许的手段。这条结论来自同一次上游合并里的对照：用派生的部分（会话同步）在 567 个上游提交之后不用改；用手工接缝的部分让 41 个上游测试在 Electron 上失败，并且每次合并都要解冲突。

环境注入的实现：`scripts/browser-environment-loader.mjs` 只对 `apps/web/src` 生效，把文件里用到的浏览器全局名绑定到 `src/platform/browserEnvironment.lynx.ts` 的导出；npm 包和 Lynx 自己的代码仍然看到真实运行时。哪些名字要绑定由 TypeScript 编译器的作用域分析决定：只有模块里存在一个不被文件自身任何绑定解析的**值引用**时才注入，属性名、类型位置、字符串、注释、从别的模块转出的名字和嵌套作用域里自己声明的同名变量都不算。import 插在指令序言（`"use client"`、`'background only'`）和 hashbang 之后，不增加行。该环境模块的每个成员属于四类之一并在源码里标明：有 Lynx 实现、接受但无效果、故意缺席（让上游的特性探测走"不可用"分支）、调用即抛出带成员名的错误。rstest 挂同一条规则；`browser-environment-loader.test.mjs` 对 `apps/web/src` 的全部源文件验证两种加载顺序（原始 TS/TSX、去类型之后）结论一致、没有重复绑定、指令保持为指令。

npm 包默认看到真实运行时，只有一个例外：`@tanstack/query-core` 在模块加载时用 `typeof window === "undefined"` 判断自己是否在服务端，服务端模式下不启动 `refetchInterval`、不做过期计时。`scripts/query-core-environment-loader.mjs` 给它的模块绑定同一个环境里的 `window`（后台线程）或 `undefined`（主线程，必须没有计时器）。整个渲染进程只有这一个 `window` 事件目标；宿主的焦点或联网信号从这里派发一次，上游监听器和 query-core 都能收到。升级 query-core 后如果这个判断挪了位置，loader 会让构建失败。

**还原一个 Lynx 会执行的上游文件之前，要检查它的分支。** 注入之后 `typeof window` 在 Lynx 上恒为已定义。fork 以前把上游的同一个判断改写成了两种谓词：`isBrowser()`（Lynx 上为真）和 `getDocument() !== null`（Lynx 上为假）。还原后两者都变成"为真"，所以 fork 原先刻意关掉的分支会被打开。已知的三处：

- `hooks/useSmoothStreamedText.ts`、`hooks/useThrottledStreamingValue.ts`：目前不在 Lynx 的模块图里；一旦有 Lynx 使用方，逐帧动画和节流会在 Lynx 上启用（以前被 `getDocument() === null` 关掉）。
- `lib/projectReactQuery.ts`：两个 workspace 文件引用查询以前在 Lynx 上是禁用的。这个文件因此还没有还原。

需要真实 DOM 的上游辅助函数（`lib/browserDownload.ts` 创建 `<a>` 并挂到 `body`、`lib/domLayout.ts` 调 `getComputedStyle`、设置页登出用的 `location.assign`）在环境里是"调用即抛出"。它们目前没有 Lynx 使用方；在增加任何 Lynx 使用方之前，先用模块替换给出 Lynx 适配实现，不要让环境假装下载或导航成功。

现存的手工差异是存量债务，只许减少：`bun run --cwd apps/lynx audit:upstream-footprint` 统计上游拥有的路径里被 fork 改过的文件数、改动行数，以及 fork 放在这些路径里的文件数，CI 在任何一项增加时失败。清理顺序按"最机械的先做"：

1. `window.x` → `~/platform/x` 的改写：改为环境注入，上游文件还原。
2. 给 Lynx 加的导出、共用的常量和 token、抽出去的逻辑：改为生成。
3. fork 放在上游目录里的文件：搬到 fork 自己的目录。
4. `data-*` 测试钩子：对比 harness 改用上游已有的角色、文字和属性定位。

值得提给上游的只有真正的上游缺陷。被接受，fork 的差异归零；不被接受，fork 不受影响。fork 的架构不依赖上游接受任何东西。

## 分层

| 层          | 内容                                                                                           | 源码                           |
| ----------- | ---------------------------------------------------------------------------------------------- | ------------------------------ |
| L0 契约     | `packages/contracts`、`packages/shared`                                                        | 上游一份                       |
| L1 平台端口 | 传输、存储、导航、通知与对话框、剪贴板、计时器、窗口                                           | 接口一份，Web 和 Lynx 各一实现 |
| L2 会话核心 | `NativeApi` 门面、`store` 与 selector、会话同步引擎 `EventRouter`、各功能 store、query options | 上游一份，Lynx 原样运行        |
| L3 编排     | 页面级容器（`ChatView`、`Sidebar`、Lynx 的 `router.tsx` 里的页面）                             | 仍是两份，逐屏收敛             |
| L4 展示     | `XxxComposition` 共享；`XxxElements` / `.lynx.tsx` 各一份                                      | 组合共享，叶子两份             |
| L5 平台壳   | Web 路由文件与全局挂载；Lynx 的路由表、`adapters/`、`main/`（宿主进程）、主线程脚本            | 各一份                         |

## 不变量

违反其中任何一条都应该被检查拦住，而不是靠评审发现。

1. **上游只读。** 不编辑 `apps/web`、`apps/server`、`apps/desktop`、`packages/*`、`.github` 里的上游文件，也不往这些目录里放 fork 的文件。Lynx 需要的差异用上面的派生层解决。现存的差异是只许减少的存量。
2. **Electron 的行为等于上游。** 上游的测试在 fork 上必须原样通过，不改上游的测试去迁就 fork，CI 工作流用上游的原文件。
3. **共享的是文件，不是概念。** 只有同一份物理源码才算共享。"照着上游再写一份"是平行实现，会静默漂移。
4. **服务器状态只有一个写入方。** 共享 `store` 里的服务器状态只由上游的 `EventRouter` 写入。Lynx 的读取路径只能投影，不能提交。唯一的例外是首次同步失败后用户点击的"重试"，且只在尚未同步到任何数据时生效。
5. **Lynx 不自建数据通道。** 读写都走上游的 `NativeApi` 门面、`store` selector 和上游的 query options，使用上游的 query key。不新增轮询，不新增 `synaraClient` 中继函数。
6. **破坏性操作读权威数据。** 删除、强制清理之类的操作在决定前向服务器取一次最新快照，不依赖可能过期的 `store`。
7. **Lynx 专属代码只在专属层。** `apps/lynx/src/{adapters,platform,main,data}` 和 `*.lynx.*` 文件。
8. **生成物不手改。** `src/generated/eventRouter.generated.tsx` 由 `scripts/generate-event-router.mjs` 从上游的 `routes/__root.tsx` 生成。`src/generated/diffChangeMarkers.generated.ts` 由 `scripts/generate-diff-change-markers.mjs` 用同一个抽取器从 `DiffPanelChangeMarkers.tsx` 生成，`--check` 同样挂在 `typecheck` 和 `audit:reuse:check` 上。上游改了就重新生成；生成器不认识的形状要扩展生成器并加测试。与上游逐字不同的地方只能来自 `scripts/event-router-patches.mjs` 里带守卫的补丁。
9. **持久化的 store 在存储就绪后才可写。** Lynx 的本地存储是异步加载的，共享 store 的初始化和写入必须在 `persistedStoreHydration` 边界之后。
10. **依赖解析跟随上游。** `bun.lock` 以上游的为基础，用上游固定的 bun 版本生成。Lynx 与 Web 共用的包，Lynx 的版本范围不得高于 Web 的范围；Lynx 构建工具链的版本单独钉住。

## 靠什么保证

| 不变量 | 机制                                                                                                                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | `audit:upstream-footprint:check`（CI 的 "Upstream footprint" 任务）：上游路径里的 fork 差异任何一项增加即失败                                                                                           |
| 2      | GitHub CI 用上游的工作流和上游的测试；fork 自己的门禁在单独的 `lynx-fork.yml` 里                                                                                                                        |
| 3、5   | `audit:reuse:check` 的平行实现棘轮：`synaraClient` 引用文件数、`useQuery` 直连数、轮询点数、`router.tsx` 行数只许降                                                                                     |
| 4      | `eventRouter.generated.test.tsx`、`sidebarStoreReadPath.lynx.test.ts` 和 `threadPageStore.lynx.test.tsx` 固定"读取路径不提交"                                                                           |
| 8      | 生成器的 `--check` 在 `typecheck` 和 `audit:reuse:check` 里运行，发现漂移即失败；遇到不认识的形状不产出文件；补丁的守卫和行为由 `generate-event-router.test.mjs`、`eventRouter.generated.test.tsx` 固定 |
| 传输层 | `wsTransport.lynx.test.ts` 里的类型断言：上游给 `WsTransport` 增加公开成员时，Lynx 的 typecheck 失败                                                                                                    |
| 9      | `persistedStoreHydration.lynx.test.ts` 先复现覆盖再验证修复                                                                                                                                             |
| 10     | CI 用冻结锁文件安装                                                                                                                                                                                     |
| 方向   | `bun run --cwd apps/lynx audit:upstream-merge <基点> upstream/main`：上游改动按层统计，哪些自动到达、哪些要手工移植                                                                                     |

## 兼容层由哪些部件构成

| 部件          | 位置                                                                | 作用                                                                                                                                |
| ------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 兼容传输      | `src/adapters/wsTransport.lynx.ts`                                  | 与上游 `WsTransport` 同形，底下走宿主进程的中继；流按渲染器代号归属，可取消，重载后自动清理                                         |
| 门面          | `src/adapters/nativeApi.lynx.ts`                                    | 返回上游的 `createWsNativeApi()`，只覆盖依赖 DOM 或 `desktopBridge` 的命名空间                                                      |
| 模块替换      | `lynx.config.ts` 的别名和 `lynxResourceReplacements`                | 把上游的 `wsTransport`、`nativeApi`、`platform/*` 等解析到 Lynx 的实现，含相对路径引用                                              |
| 会话同步      | `scripts/generate-event-router.mjs`、`src/app/SessionSync.lynx.tsx` | 生成并挂载上游的 `EventRouter`，全程只挂载一次                                                                                      |
| 垫片          | `adapters/reactRouter.lynx.ts`、`components/ui/toast.lynx.ts` 等    | 提供 `EventRouter` 用到的路由 hook、toast、计时器和 React 19 的 `useEffectEvent`                                                    |
| 读路径        | `src/app/sidebarSnapshot.{logic,lynx}.ts`                           | 用上游的 selector 从 `store` 投影侧边栏相关界面的数据                                                                               |
| Thread 读路径 | `src/app/threadPageStore.lynx.ts`、`threadPageProjection.logic.ts`  | 用上游的 `createThreadSelector` 和 `threadDetailSyncById` 读路由线程，投影成转录行和头部摘要；用上游的 retention 保留最近打开的线程 |
| 存储就绪边界  | `src/app/persistedStoreHydration.lynx.ts`                           | 存储加载完后重读共享 store 的持久化部分                                                                                             |

## 合上游的做法

1. `git fetch upstream`，先跑 `audit:upstream-merge <上次同步点> upstream/main`，看改动落在哪一层。
2. 用真实的 merge（`--no-ff`），PR 用 merge commit 合入，不 squash，保留上游祖先关系。
3. 上游文件以上游为准。fork 的钩子只在仍然需要时重新落位，并保持最小；上游已经有等价实现的，丢掉 fork 的。
4. 锁文件：取上游的 `bun.lock`，用上游固定的 bun 版本 `install`，再确认 Lynx 工具链版本没有变化。
5. 重新生成 `EventRouter`；按上游的 `wsTransport.ts` 更新兼容传输（类型断言会指出缺什么）。
6. 上游新增而 Lynx 没有的界面不在合并里移植：在 Lynx 上干净地缺席或打桩，并加入移植队列。
7. 以 CI 为准：上游的浏览器测试在 fork 上失败，说明 fork 的差异改变了 Electron 的行为，要去掉原因，而不是放宽检查。
8. 合并后跑两端的工作流，并让另一个模型对合并做独立 review，重点看服务端的 fork 差异、Lynx 状态层和被丢弃的 fork 行为。

## 永远留在 Lynx 的

宿主进程与原生桥、主线程脚本、文本输入与 IME、终端渲染、浏览器视图、PDF、滚动与测量、`<list>` 转录、markdown 解析适配、宿主语法高亮、Lynx CSS 子集的样式适配、路由表与内存历史。

## 已知的缺口

- **编排层仍是两份。** 合并成本的大头在 `ChatView.tsx`、`Sidebar.tsx` 这类容器和 Lynx 自己的对应物上，状态层共享并没有消掉它。
- **fork 在上游文件里的差异仍然很多。** 2026-10-09 合并后的基线是 260 个上游文件被改过（6,672 行），另有 400 个 fork 文件放在上游的目录里；`~/platform` 改写的第一批还原、并删掉一个 fork 自加的 RPC 之后是 184 个文件（5,883 行）和 395 个 fork 文件。原因见最近一次合并报告的附录；它直接决定下一次合并的成本，也是 Electron 行为回退的来源。
- **线程详情还有请求式的读取方。** Thread 页已经读 `store`。右侧 dock 里的 Side 面板、侧边栏和 Kanban 的线程操作、任务完成通知、Environment 面板的 recap 仍用 `queries.ts` 里的 `getThreadDetailSnapshot` 读取（只投影、不提交）。Side 面板要先让上游的 `EventRouter` 知道 Lynx 的 dock 状态才能拿到流租约。
- **仍有读取用 Lynx 自己的 query key。** `synaraClient.lynx.ts` 已删除，请求全部走门面；模型目录已换成上游的 `providerModelsQueryOptions`，Code review 页面（列表、PR 与 issue 详情、diff、操作、评论、置顶）也都换成了上游的 query 和 mutation options，但 Automations、插件库等读取还没有换成上游的 query options，清单见计划文档。
- **单元格矩阵覆盖的界面都已按上游移植。** 应用外壳、模型菜单、dock 头部与 diff 工具栏（含 change markers）、Code review 页面、Appearance 的主题包编辑器。每个里程碑的通过数记录在计划文档；仍是占位的功能（Inbox、Spaces、线程内切换 provider、窗口半透明等）列在合并报告的移植队列里。
- **宿主里还有没有调用方的旧流路径**（不带 `streamId` 的 `synaraRpcStream` 和固定通道表里的终端、shell 通道）。它和在用的代码交织在两个宿主里，删除前要先把 Lynx-for-Web 宿主跑通一遍。
- **上游新界面的移植队列**见最近一次合并报告。
