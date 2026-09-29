# P8-Q1 — 控制面迁入与切片清理

**状态：in_progress**（2026-07-31）

## 已完成的实现收敛

- 删除五个未接入产品的 diagnostic/probe 页面、诊断样式、旧 scaffold 测试，以及九个生成的 `.js` 镜像。
- 删除 `/projects` 过渡路由；产品的唯一项目/看板入口为 `/kanban`。
- 将 Lynx 应用从原 staging `synara-lynx/slice` 迁入主仓 `synara/apps/lynx`。
- 修正 workspace aliases 与隐式依赖，并将 audit 控制面改为随 `apps/lynx` 分发的相对路径。
- 原 staging 未被本次工作删除或修改，仍保留为可恢复的历史 control plane；旧 staging 内容此前已可恢复地移入废纸篓。未触及用户数据或用户进程。

## 主仓审计控制面

从 repository root 依次运行：

```sh
bun run --cwd apps/lynx audit:reuse
bun run --cwd apps/lynx audit:reuse:check
bun run --cwd apps/lynx audit:style
bun run --cwd apps/lynx audit:style:check
```

本次迁入后已实际观察到全部通过：

| 审计                | 结果                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| reuse write / check | Threads 55.15%；Threads shell 63.42%；Thread 38.40%；Settings 51.29%；Projects/Kanban 52.24%；Pull Requests 57.19% |
| style write / check | 2,254 classes；13,185 weighted；98.06% coverage                                                                    |

生成物为 [P5-R1 reuse baseline](p5-r1-reuse-baseline.md) 与 [P5-R4 style coverage](p5-r4-style-coverage.md)。

## 最终门禁（2026-07-31）

P8-Q1 的收口验证已完成：

| 门禁                     | 结果                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun install`            | 通过；锁文件已按移除的无效 Rspack override 重新解析并保存。                                                                                       |
| Web production build     | `bun run --cwd apps/web build` 通过（8,916 modules）。                                                                                            |
| Lynx production build    | `bun run --cwd apps/lynx build` 通过（2267.1 kB Lynx / 2384.1 kB desktop）；仅保留已登记的 `color-scheme` 编码移除和可选 `ws` native addon 警告。 |
| Desktop production build | `bun run --cwd apps/desktop build` 通过；仅保留 Electron `original-fs` external-import 警告。                                                     |
| 严格审计                 | reuse write/check、style write/check 全部通过，结果见上表。                                                                                       |
| 主仓 diff                | `git -C /Users/bytedance/github/synara diff --check` 通过。                                                                                       |
| 可恢复 staging diff      | `git -C /Users/bytedance/github/synara-lynx diff --check` 通过；`slice/` 不存在，符合迁入后 staging 不再承载应用源码的状态。                      |

**结论：P8-Q1 completed。** P8-Q2 最终视觉认证矩阵现已解除依赖，仍须在相同 WS 数据下重新取得六核心屏 × light/dark × 1280×820/1440×900 的当前认证证据。
