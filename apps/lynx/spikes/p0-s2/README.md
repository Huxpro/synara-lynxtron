# P0-S2 — WebSocket 判定（生死线）结论

日期：2026-07-27 ｜ 状态：✅ 完成 ｜ 测试床：spikes/p0-s1/app（Lynxtron 0.0.7，运行时 Node v22.18.0）
原始数据：`results.jsonl`（两轮独立运行一致）；截图：`shots/2026-07-27/p0-s2/lynx-suite.png`

## TL;DR — D4 = 路径 (a)：Lynx view 直连 WS 可行

**Lynxtron 0.0.7 预注册了 `LynxWebSocketModule`**（`NativeModules.LynxWebSocketModule`，
方法 `connect/send/ping/close`，事件经 GlobalEventEmitter 广播 `websocketOpen/Message/Closed/Failed`）。
官方 W3C 风格包装器 **`@lynx-js/websocket`**（lynx-stack 官方包，v0.0.4）直接可用。
→ synara 的 wsTransport（唯一构造点 wsTransport.ts:183）可在 Lynx 后台线程内直连 WS，
**无需主进程中继**。SSE 兜底路径在 Lynxtron 0.0.7 不可用（见下）。

## 实测数据（loopback，30 次 RTT / 300 条 tick / KICK 重连；两轮一致）

| 路径 | 可用性 | RTT avg (p95) | 吞吐 | 重连 |
|---|---|---|---|---|
| (a) 全局 `WebSocket` | ❌ undefined（核心 JS API 确认无） | — | — | — |
| (a2) `LynxWebSocketModule` 直连 | ✅ | **0.5–0.9ms (≤2ms)** | 382–392 msg/s¹ | 1–2ms |
| (b0) 桥基线（-lynx-invoke 往返） | ✅ | 0.4–0.7ms | — | — |
| (b1) 主进程 WS + lynxBridge 中继 | ✅ | 0.7–1.2ms (≤2ms) | 379–392 msg/s¹ | 3ms |
| (b2) preload 注入 Node 模块 WS | ✅ | 0.4–0.9ms (≤2ms) | 364–395 msg/s¹ | **~505ms²** |
| (c) SSE `lynx.EventSource` + `lynx.fetch` | ⚠️ 半残 | — | — | — |

¹ 吞吐受发送端 2ms 间隔限制（理论上限 500/s）；实测 364–395/s ≈ 桥/引擎开销 ~20%。
² b2 重连稳定复现 ~505ms：server `terminate()` 后 undici 客户端 close 握手延迟；非阻塞，重连策略可吸收。

### 路径 (c) 的详细状态
- `lynx.EventSource` 存在（function），`lynx.fetch` 存在且可用（/report 落盘即证明；**fetch 挂在 `lynx.*` 下，不在 globalThis**）。
- SSE TCP 连接**能到达** server（`sseClients=1`），但 JS 侧 `message` 事件**从不派发**（原生/显式 `event: message` 两种写法都试过），~8-10s 后来一个 `{"data":"","error":{}}` 错误事件。判定：Lynxtron 0.0.7 的 EventSource 派发链断裂 → ⬆️ 上游；作为兜底路径当前不可用。

## 架构推论（对 00 策略的修订）

1. **net.socket port 的 lynx impl 直接落地**：`new WebSocket(url)` ← `import { WebSocket } from '@lynx-js/websocket'`。
   API 形状 W3C 兼容（onmessage/onopen/addEventListener/readyState），wsTransport 改动面最小。
2. 限制：`@lynx-js/websocket` **仅支持文本帧**（binary 在其类型中被注释掉）；synara WS 走 JSON 文本，无碍。ping() 可用。
3. 可靠性排序：a2（直连，延迟最低，代码最少）> b1（主进程中继，每消息多 ~0.3ms 桥开销，仍优秀）> b2（重连有 500ms 异常，且无额外收益）。
   b1 作为备选保留（场景：未来需要主进程代理 WS——如统一鉴权/证书 pinning）。
4. 桥开销实测可忽略（b0 基线 0.4ms），打消"每消息过桥必卡"的顾虑——即使走中继也不构成架构约束。
5. preload 注入环境（NativeModules.nodejs）能力实测：`WebSocket/fetch/process v22.18.0` 有，`require/net` 无；
   **Lynx→preload 回调可重复触发**（流式推送成立），该通道对未来 KV storage port 也有价值。

## 测试方法（可复跑）

```bash
cd spikes/p0-s1/app && npm run build && npx lynxtron dist/desktop
# UI 自动执行套件；结果落盘 spikes/p0-s2/results.jsonl（POST /report），
# 屏幕显示摘要；console 经 lynx-devtool get-console 可见（注意：消费型缓冲，端口每次变）。
```

套件：`src/app/wsTests.ts`（a/a2/b0/b1/b2/c 六相）；sidecar：`src/main/desktop/sidecar.ts`
（WS echo + TICK + KICK、SSE + /send + /sse-kick + /sse-tick、/report 落盘）。
模块 WS 迷你客户端：wsTests.ts 内 `createModuleWebSocket`（API 形状学自 @lynx-js/websocket 源码）。

## 新发现（已回填 02-compat-matrix.md / 03-decisions.md D4）

1. `LynxWebSocketModule` 预注册但未文档化 —— 生死线问题的答案：✅。
2. `@lynx-js/websocket` 已在 scaffold 依赖树中（传递依赖），可 `npm i -S` 显式声明直接用。
3. `lynx.fetch` ≠ `globalThis.fetch`（后者 undefined）；代码审计/适配时按 `lynx.*` 命名空间核对。
4. EventSource 连接成功但事件不派发（0.0.7 bug 或未接线）→ ⬆️。
5. devtool get-console 为消费型缓冲且 client 端口每次启动变化（8902→8903→…）；确定性数据请走 /report 落盘模式。
