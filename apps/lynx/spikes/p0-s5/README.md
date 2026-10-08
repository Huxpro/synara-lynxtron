# P0-S5 — CEF webview 兜底路径验证（结论：❌ 当前不可用）

日期：2026-07-27 ｜ 状态：✅ 完成（阴性结论）｜ 测试床：spikes/p0-s1/app（Lynxtron 0.0.7 mac arm64）

## TL;DR

`<webview>` 元素**类型定义存在且标注 @PC**（src/html/initjs/cookies/use-osr、bindload/error/message/locationchange、reload/eval/cookies.* 方法），二进制中**无 CEF**（`strings` 0 命中），但含 **WKWebView** ObjC 胶水符号（mac 实现走 WKWebView 而非 CEF）。
**实测：插入 `<webview>` 即导致 Lynx view 崩溃**（白屏 + devtool 连接断开，主进程存活），阶段化插入复现定位到元素创建时刻。→ mac arm64 可用性确认：**0.0.7 不可用**，⬆️ 推上游。

## 过程与证据

1. 类型：`@lynx-js/types/types/common/element/webview.d.ts` — @PC 标注齐全（`use-osr` 为 CEF 概念，类型层先于实现）。
2. 二进制：`dist/lynxtron.app/Contents/Frameworks/` 仅 `Lynxtron Framework.framework`，无 CEF framework；strings 检索 `cef/chromium embedded` = 0 命中，`WKWebView` 方法签名多个 → mac webview = WKWebView 路线。
3. 实测（两阶段测试 `src/app/WebviewTest.tsx`）：
   - header 文本先渲染（`stage header-rendered` ✅ 落盘），+1.5s 插入 `<webview src=...>`（`stage insert-webview` ✅）；
   - 之后**无任何 bindload/binderror 事件**，devtool client 消失（view 崩溃特征，与首轮非阶段化测试一致：白屏）。
   - 佐证：synara web 实例当时正常（curl localhost:8892 = 200）；vite 仅绑 IPv6 `::1`（127.0.0.1 会 RST，sidecar 重定向已改 localhost）——与崩溃无关，记录备查。
4. 数据：`results.jsonl`（仅两条 stage 记录即断）。

## 对 D3 的影响

- CEF webview 兜底（"Lynxtron 壳 + webview 内嵌现有 web app"过渡形态）**在 0.0.7 不可落地**。
- 后续路径（按保守排序）：a) 等上游修 `<webview>`（WKWebView 胶水已在二进制中，大概率是近版本目标）；b) 自研 NSWindow+WKWebView 原生模块经 lynxBridge 控制（不依赖 `<webview>` 元素，工作量中等）；c) 放弃兜底，直走 ReactLynx 重写主线。
- 主线（Phase 1/2）不依赖本路径，继续推进。

## 复跑

```bash
cd spikes/p0-s1/app && npm run build && npx lynxtron dist/desktop
# UI 先显示 header，1.5s 后插入 webview → view 崩溃（白屏，devtool 断连）
```
