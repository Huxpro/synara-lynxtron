# P0-S1 — Lynxtron scaffold + sidecar 冒烟（结论）

日期：2026-07-27 ｜ 状态：✅ 通过 ｜ 环境：macOS arm64，Node v24.18（宿主）/ v22.18.0（Lynxtron 运行时内置）

## 做了什么

1. `npx @lynx-js/create-lynxtron@latest app -y --web` 生成 scaffold（`app/`，含 desktop + web 双 host）。
2. `npm install` 成功（766 包）。**注意**：npm 11 的 allow-scripts 机制默认拦住 postinstall，需
   `npm approve-scripts @lynx-js/lynxtron @lynx-js/lynxtron-builder electron-winstaller && npm rebuild …`，
   否则 lynxtron 二进制（dist/lynxtron.app, 63MB）不会下载。
3. Sidecar 冒烟（本 spike 核心）：
   - 新增 `app/src/main/desktop/sidecar.ts`：纯 Node HTTP server，监听 127.0.0.1:0，
     打印 `SIDECAR_PORT=<port>`，提供 `/health`、`/echo`。
   - `main.ts`：`utilityProcess.fork` 启动 sidecar（stdio 带 `'ipc'`），解析端口行，
     主进程 `fetch /health` 探活；`-lynx-invoke` 桥新增 `sidecarHealth` 方法暴露给 UI。
   - `App.tsx`：卡片显示 sidecar 状态（bindtap → bridge.call('sidecarHealth')）。
   - `rsbuild.config.ts`：desktop 环境新增 `sidecar` entry（node target，独立产物 dist/desktop/sidecar.js）。

## 结果（退出标准逐项）

| 退出标准 | 结果 |
|---|---|
| npm create 跑通 | ✅（含 install/approve-scripts 坑，见上） |
| utilityProcess.fork 启动 Node HTTP server | ✅ pid 92361，SIDECAR_PORT=55509 |
| 主进程探活成功 | ✅ `{"ok":true,"pid":92361,"node":"v22.18.0","uptimeMs":370,"hasParentPort":false}` |
| （附加）UI 渲染 + devtool 截图 | ✅ shots/2026-07-27/p0-s1/lynx.png |

## 新发现（已回填 02-compat-matrix.md）

1. **`utilityProcess` 在原生绑定里存在，但 JS shim 未 re-export**（@lynx-js/lynxtron@0.0.7）。
   绕法：`createRequire(import.meta.url)('lynxtron').utilityProcess`（与 shim 自身同手法，打包安全）。
   原生绑定实际键：`BaseWindow, LynxTemplateBundle, LynxTemplateData, LynxUpdateMeta, LynxWindow,
   Menu, MenuItem, Notification, Tray, app, clipboard, devtool, dialog, lynxBridge, nativeImage,
   powerMonitor, protocol, screen, shell, utilityProcess`（比 shim 多出 BaseWindow/Notification/LynxTemplateBundle）。
2. **确认缺失**：`ipcMain` / `globalShortcut` / `session` / `autoUpdater` 在原生绑定中也不存在（印证 00 策略风险单）。
3. **fork 的 stdio 必须含 `'ipc'`**，否则抛 `ERR_CHILD_PROCESS_IPC_REQUIRED`（与 Electron 默认不同，Electron 默认自带 ipc）。
4. **子进程无 `process.parentPort`**（hasParentPort=false，即使带 ipc channel）——Electron 风格父子消息
   API 未实现；父子通信应走 Node IPC 语义（`process.send`/`process.on('message')` ↔ `utilityProcess.postMessage`），
   待 P0-S2(b) 实测确认。
5. Lynxtron 运行时内置 **Node v22.18.0**（非宿主 Node 版本），V8 14.0.365.4-lynxtron.0，含 undici/sqlite/zstd。
6. 运行时告警 `LynxViewStateObserver not found in registry` 无害（窗口正常创建渲染）。

## 复现

```bash
cd app && npm install && npm run build && npx lynxtron dist/desktop
# 日志应出现： [P0-S1] sidecar health probe OK: {...}
```

探针脚本 `../probe-lynxtron.cjs`（`npx lynxtron ../probe-lynxtron.cjs`）可 dump 原生绑定能力清单。
