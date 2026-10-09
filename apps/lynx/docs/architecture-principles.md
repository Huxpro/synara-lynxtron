# Web / Lynx 共享架构：原则与不变量

本文是长期有效的参考：这套 fork 如何在不改上游的前提下，让 Lynx 渲染器运行上游的代码。过程、数字和里程碑记录在 [shared-state-architecture.md](../plan/shared-state-architecture.md)；每一步的实现细节在 [shared-state-design-2026-10-09.md](../plan/reports/shared-state-design-2026-10-09.md)。

## 一句话

上游（`Emanuele-web04/synara`）拥有 Electron 产品。Lynx 渲染器直接编译上游的源码，只在它下面替换平台实现。fork 的价值在 Lynx 专属层，fork 的成本在它留在上游文件里的每一处差异。

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

1. **上游只读。** `apps/web`、`apps/server`、`apps/desktop`、`packages/*` 里的上游文件不改形状。允许的 fork 差异只有三类：平台端口化（`window.x` → `~/platform/x`）、`data-*` 测试钩子、把拆出的部分放进**新文件**后在原文件里换 import。每一处差异都必须对 Electron 的行为完全中性。
2. **Electron 的行为等于上游。** 上游的测试在 fork 上必须原样通过，不改上游的测试去迁就 fork，CI 工作流用上游的原文件。
3. **共享的是文件，不是概念。** 只有同一份物理源码才算共享。"照着上游再写一份"是平行实现，会静默漂移。
4. **服务器状态只有一个写入方。** 共享 `store` 里的服务器状态只由上游的 `EventRouter` 写入。Lynx 的读取路径只能投影，不能提交。唯一的例外是首次同步失败后用户点击的"重试"，且只在尚未同步到任何数据时生效。
5. **Lynx 不自建数据通道。** 读写都走上游的 `NativeApi` 门面、`store` selector 和上游的 query options，使用上游的 query key。不新增轮询，不新增 `synaraClient` 中继函数。
6. **破坏性操作读权威数据。** 删除、强制清理之类的操作在决定前向服务器取一次最新快照，不依赖可能过期的 `store`。
7. **Lynx 专属代码只在专属层。** `apps/lynx/src/{adapters,platform,main,data}` 和 `*.lynx.*` 文件。
8. **生成物不手改。** `src/generated/eventRouter.generated.tsx` 由 `scripts/generate-event-router.mjs` 从上游的 `routes/__root.tsx` 生成。上游改了就重新生成；生成器不认识的形状要扩展生成器并加测试。
9. **持久化的 store 在存储就绪后才可写。** Lynx 的本地存储是异步加载的，共享 store 的初始化和写入必须在 `persistedStoreHydration` 边界之后。
10. **依赖解析跟随上游。** `bun.lock` 以上游的为基础，用上游固定的 bun 版本生成。Lynx 与 Web 共用的包，Lynx 的版本范围不得高于 Web 的范围；Lynx 构建工具链的版本单独钉住。

## 靠什么保证

| 不变量 | 机制                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------- |
| 1、2   | GitHub CI 用上游的工作流和上游的测试；合并报告的附录逐个列出带 fork 差异的上游文件和原因                            |
| 3、5   | `audit:reuse:check` 的平行实现棘轮：`synaraClient` 引用文件数、`useQuery` 直连数、轮询点数、`router.tsx` 行数只许降 |
| 4      | `eventRouter.generated.test.tsx` 和 `sidebarStoreReadPath.lynx.test.ts` 固定"轮询路径不提交"                        |
| 8      | 生成器的 `--check` 在 `typecheck` 和 `audit:reuse:check` 里运行，发现漂移即失败；遇到不认识的形状不产出文件         |
| 传输层 | `wsTransport.lynx.test.ts` 里的类型断言：上游给 `WsTransport` 增加公开成员时，Lynx 的 typecheck 失败                |
| 9      | `persistedStoreHydration.lynx.test.ts` 先复现覆盖再验证修复                                                         |
| 10     | CI 用冻结锁文件安装                                                                                                 |
| 方向   | `bun run --cwd apps/lynx audit:upstream-merge <基点> upstream/main`：上游改动按层统计，哪些自动到达、哪些要手工移植 |

## 兼容层由哪些部件构成

| 部件         | 位置                                                                | 作用                                                                                        |
| ------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 兼容传输     | `src/adapters/wsTransport.lynx.ts`                                  | 与上游 `WsTransport` 同形，底下走宿主进程的中继；流按渲染器代号归属，可取消，重载后自动清理 |
| 门面         | `src/adapters/nativeApi.lynx.ts`                                    | 返回上游的 `createWsNativeApi()`，只覆盖依赖 DOM 或 `desktopBridge` 的命名空间              |
| 模块替换     | `lynx.config.ts` 的别名和 `lynxResourceReplacements`                | 把上游的 `wsTransport`、`nativeApi`、`platform/*` 等解析到 Lynx 的实现，含相对路径引用      |
| 会话同步     | `scripts/generate-event-router.mjs`、`src/app/SessionSync.lynx.tsx` | 生成并挂载上游的 `EventRouter`，全程只挂载一次                                              |
| 垫片         | `adapters/reactRouter.lynx.ts`、`components/ui/toast.lynx.ts` 等    | 提供 `EventRouter` 用到的路由 hook、toast、计时器和 React 19 的 `useEffectEvent`            |
| 读路径       | `src/app/sidebarSnapshot.{logic,lynx}.ts`                           | 用上游的 selector 从 `store` 投影侧边栏相关界面的数据                                       |
| 存储就绪边界 | `src/app/persistedStoreHydration.lynx.ts`                           | 存储加载完后重读共享 store 的持久化部分                                                     |

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
- **fork 在上游文件里的差异仍然很多。** 数量和原因见最近一次合并报告的附录；它直接决定下一次合并的成本，也是 Electron 行为回退的来源。
- **Thread 页还没有读 `store`。** 上游 `EventRouter` 在替换线程快照时会重复应用排队中的流式增量，测试已固定这一行为；改读之前要在 Lynx 的读取边界处理。
- **`synaraClient.lynx.ts` 尚未删除。** 剩余引用见计划文档。
- **上游新界面的移植队列**见最近一次合并报告。
