# P9-U5 Composer fidelity continuation goal prompt

Updated: 2026-08-03

This is the self-contained prompt for resuming the active Composer fidelity
goal from the current checkout. The repository state on disk is authoritative.

## Goal prompt

```text
继续完成 Synara P9-U5 Composer fidelity convergence，直到
`apps/lynx/plan/reports/p9-u5-composer-fidelity-plan.md` 的全部完成标准真实满足。

不要只输出分析、计划、prototype或“下一步建议”。必须完成当前未提交slice、Browser
矩阵收口、exact-owned Native certification、最终审计、独立commits和push。除非遇到
不可获得的外部依赖，否则持续执行到整个goal完成。

## 当前真实起点

- 工作目录：`/Users/bytedance/github/synara`
- 分支：`huxcx/lynxtron-port-current-state`
- 当前HEAD及origin均为`75a03632`。
- 已完成并推送：
  1. `c7ba72fc test(composer): enforce strict comparison states`
  2. `f8895970 refactor(composer): share project picker composition`
  3. `a1b0978d refactor(composer): align extras menu primitives`
  4. `75a03632 refactor(composer): align skill and mention menus`
- Phase 4 Native token projection已经实现并有未提交改动。不得reset、checkout、覆盖、
  丢弃或从头重做；先审查当前diff和已有证据，再完成它的commit/push gate。
- 当前strict verifier：
  `bun run --cwd apps/lynx evidence:composer`
  应准确exit 2并报告17个required cells未retained。不得通过降低schema、删除required
  clients、伪造assertions或把diagnostic/pending直接改成retained来变绿。
- 当前共享snapshot：
  `/private/tmp/synara-lynx-web-harness.SUyxxH/synara-home/dev/state.sqlite`
- 当前snapshot SHA-256：
  `98753f94c2df90724d0a892353c03bf2fba50bb880de6d9db012f1266f606070`
- Phase 4 retained Browser evidence使用：
  - Web build hash：
    `647bb96161b34e9b01afcf44a639c5043e5f1cdc43691694136c5ee8c115046b`
  - Lynx-for-Web build hash：
    `5c1719a2c70171ae07dc6507d86005b37065e833202c884e0b9b89002433572e`
- 当前17个未完成required cells必须保持显式、逐格关闭：
  1. `composer-default.web`
  2. `composer-default.lynx`
  3. `composer-default.native`
  4. `composer-extras-default.native`
  5. `composer-plan-on.native`
  6. `composer-fast-on.native`
  7. `composer-attachment-action.web`
  8. `composer-attachment-action.native`
  9. `composer-project-selected-open.native`
  10. `composer-project-loading.web`
  11. `composer-project-loading.lynx`
  12. `composer-project-error.web`
  13. `composer-project-error.lynx`
  14. `composer-skill-selected.native`
  15. `composer-skill-cleared.native`
  16. `composer-mention-selected.native`
  17. `composer-mention-cleared.native`

开始前必须读取：

1. 根目录`AGENTS.md`；
2. `apps/lynx/plan/reports/p9-u5-composer-fidelity-plan.md`；
3. `apps/lynx/plan/LOG.md`；
4. `apps/lynx/plan/reports/p9-u5-composer-continuation-goal-prompt.md`；
5. `shots/2026-08-03/p9-u5-composer/manifest.json`与`notes.md`；
6. `apps/lynx/scripts/composer-evidence.mjs`；
7. 当前`git status`、`git diff`和最近commits。

## 当前未提交Phase 4

重点文件包括但不限于：

- `apps/lynx/src/components/composer/composerDraftProjection.logic.ts`
- `apps/lynx/src/components/composer/composerDraftProjection.logic.test.ts`
- `apps/lynx/src/components/composer/Composer.lynx.tsx`
- `apps/lynx/src/components/composer/LandingComposer.lynx.tsx`
- `apps/lynx/src/components/composer/composer.css`
- `apps/lynx/src/adapters/composerDraftStore.lynx.ts`
- `apps/lynx/src/adapters/composerDraftStore.lynx.test.ts`
- `apps/lynx/src/app/App.tsx`
- `apps/lynx/src/components/composer/landingComposerFidelity.test.ts`
- `shots/2026-08-03/p9-u5-composer/browser/tokens/`
- Composer manifest、generated manifest.js、notes、主plan和LOG。

已实现的架构：

- canonical prompt与display projection分离；
- 每个selected skill/mention在native textarea中只占一个不可见`U+2063` anchor；
- interleaved visual overlay按canonical顺序只显示一个token chip；
- canonical prompt、structured mentions/skills、selection mapping、history、clipboard、
  send和persistence统一经过projection；
- stable landing draft ID为`lynx-landing-draft`；
- persistence key为`synara.lynx.composer-drafts:v1`；
- App在storage/draft hydration完成后才mount Composer。

已有真实Browser验证：

- skill/mention selected时只显示一个chip，textarea无canonical syntax；
- persisted KV保存canonical provider text和structured ref；
- full reload恢复chip、anchor、canonical和structured context；
- Backspace同步清除chip、prompt、ref和KV；
- selected/cleared skill/mention共8个Web/Lynx cells已retained；
- focused tests此前为32/32，production Web/Lynx/Desktop builds已通过。

这些是必须复核的当前事实，不是允许跳过最终gate的替代品。

## 不可协商原则

1. comparison页面是常态迭代和最终验收工具，不是最后补截图。
2. 每个retained cell必须来自同一snapshot、semantic route、theme、viewport/DPR、
   project/workspace、draft/caret、Plan、Fast和token state。
3. Plan-only、Fast-only、Plan+Fast是不同状态，禁止组合态互相冒充。
4. Browser pass不能冒充Native pass；Native-required state必须来自exact-owned Lynxtron。
5. Web original是composition与visual authority，但正确产品行为高于Web偶发bug。
6. ordinary anatomy必须physical-shared；platform adapter只拥有native elements、input/list、
   icon和host/filesystem能力。
7. Native UI不得使用HTML elements；使用ReactLynx built-ins与`bindtap`等原生事件。
8. 不进入Native Command K shortcut、general host keyboard repair、terminal、browser、
   PDF、voice或其他hard islands。
9. 不做无关cleanup，不删除、绕过或弱化现有测试和证据门禁。
10. 状态必须通过canonical product RPC/mutations或真实rendered controls建立；禁止直接写
    SQLite fixture。SQLite只允许read-only验证projection/persistence。
11. 只使用`bun run test`，永远不要使用`bun test`。
12. 遇到harness failure先修harness，不能报告为product regression；遇到product failure
    必须修根因并重新采集，不能只在notes中解释后pass。
13. 每个coherent slice必须：实现/修复 → focused tests → proportional production builds →
    comparison evidence → 更新plan/LOG/notes → 独立commit → 立即push。
14. commit message末尾必须且只能出现一次：
    `Co-authored-by: TRAE CLI <noreply@bytedance.com>`

## 执行顺序

### Slice A — 收口并提交Phase 4 Native token projection

1. 检查当前diff，确认所有Phase 4改动互相一致，没有部分staged、stale generated manifest
   或意外文件。
2. 读取当前focused test session结果；若session已失效，则仅重跑Phase 4 focused tests：
   - projection；
   - draft store；
   - editor history；
   - native editor；
   - dispatch；
   - landing fidelity。
3. 运行`git diff --check`。
4. 确认旧isolated harness ports无listener，默认Lynx-for-Web/Desktop artifacts未残留
   certification临时端口或Web-only relay marker。
5. 运行strict verifier，确认它只因准确的17个剩余cells exit 2。
6. 确认Phase 4 Browser evidence、assertions、console、PNG dimensions、manifest.js、
   notes、主plan和LOG同步。
7. 独立commit并立即push：
   `feat(composer): project native inline tokens`
8. commit成功后再开始剩余Browser/Native矩阵；不要把后续certification混入此commit。

### Slice B — 关闭剩余Browser矩阵

使用一个isolated Synara server、一个真实snapshot和两个named browser sessions，让Web
original与Lynx-for-Web保持同route/theme/viewport/DPR/product state。先prove harness，
再保留证据。

必须关闭：

- `composer-default.web`
- `composer-default.lynx`
- `composer-attachment-action.web`
- `composer-project-loading.web`
- `composer-project-loading.lynx`
- `composer-project-error.web`
- `composer-project-error.lynx`

执行要求：

1. default必须重新采集为当前build的真实retained paired evidence，不能沿用旧diagnostic。
2. attachment action必须操作Web真实`Add image`control并记录capability-specific assertion；
   不得用Extras-open截图代替action结果。
3. loading/error必须优先稳定捕获真实产品态。若瞬态难以保留，可新增deterministic、
   product-faithful harness入口或扩展evidence schema支持明确的test-only proof，但必须：
   - 不向production UI泄漏fixture开关；
   - 不伪造截图；
   - manifest明确evidence type和可验证artifact；
   - verifier对test-only evidence做严格文件、hash、assertion校验；
   - Web/Lynx都验证shared loading/error/retry anatomy；
   - 若manifest仍要求PNG，就必须保留真实产品态PNG，不能只改status。
4. 每格通过真实rendered controls，记录build/snapshot hash、state echo、geometry、
   runtime和PNG dimensions、structured refs及fresh console。
5. 运行相关focused tests与Web/Lynx-for-Web production builds。
6. 更新manifest、generated manifest.js、notes、plan和LOG。
7. 本slice结束时，strict verifier应只剩10个Native-required cells：
   - default；
   - Extras default；
   - Plan-only；
   - Fast-only；
   - attachment action；
   - project selected-open；
   - skill selected/cleared；
   - mention selected/cleared。
8. Browser closure可与最终Native certification一起进入最后certification commit；不要创建
   含糊的“evidence progress”commit，除非代码/harness变化本身形成独立coherent slice。

### Slice C — Exact-owned Native certification

只在Browser required cells全部有效后执行。

#### Preflight

1. 运行完整Web、Lynx-for-Web和Desktop production builds。
2. 记录staged bundle path与SHA-256，确认Desktop bundle不含Web relay、browser storage、
   Lynx-for-Web build ID或临时certification端口。
3. dry-run isolated server，记录state dir、ports、owned PIDs和snapshot hash。
4. 使用exact-owned `apps/lynx` workspace executable和
   `apps/lynx/dist/desktop/main.lynx.bundle`。
5. 使用`NODE_ENV=production`、`SYNARA_ENABLE_DEVTOOL=1`。
6. 在修改任何persisted Native state前保存原始bytes和hash。
7. 通过owned Lynxtron PID和`lsof`解析DevTool client/session；禁止按历史端口、list order
   或其他正在运行的Lynxtron/Fiddle client选择。
8. 确认process arguments、bundle identity、root theme class、outer/content dimensions、
   snapshot identity和baseline console均正确后才保留证据。

#### 必须关闭的10个Native manifest cells

1. `composer-default.native`
2. `composer-extras-default.native`
3. `composer-plan-on.native`
4. `composer-fast-on.native`
5. `composer-attachment-action.native`
6. `composer-project-selected-open.native`
7. `composer-skill-selected.native`
8. `composer-skill-cleared.native`
9. `composer-mention-selected.native`
10. `composer-mention-cleared.native`

其中：

- Plan-only和Fast-only必须独立建立、独立断言，不能复用Plan+Fast。
- attachment action必须触发真实Native`Add files`host action；记录dialog/host capability，
  不把Browser image picker当成Native证据。
- project selected-open必须显示selected row和reset anatomy。
- selected token必须只显示一个语义chip，native textarea不泄漏canonical syntax。
- cleared token必须同时清除visible token、canonical text、structured ref和persisted draft。

#### Native行为认证

除10个manifest screenshots外，同一exact-owned batch还必须用真实Native input/host路径
认证并记录：

- skill与mention选择、caret前后输入；
- Backspace/Delete与跨token selection deletion；
- undo/redo中visible token、canonical text和structured refs同步；
- paste；
- multiple/duplicate tokens；
- IME-adjacent输入；
- canonical send payload与structured references；
- failed send保留draft/token/context；
- successful send清除draft/token/context；
- cold restart恢复selected skill/mention、anchor、canonical prompt和structured refs；
- restart后再次clear仍同步清KV。

若上述行为不适合作为独立manifest screenshot，必须保留focused interaction log、
DevTool assertions、RPC/read-only DB proof和clean console，并在notes中逐项映射到主plan
acceptance criteria。Lynx-for-Web结果不能替代这些Native textarea/IME/host语义。

#### Native批次约束与cleanup

- 保持一个verified instance完成同size下所有状态；只有cold-start/persistence、bundle变化、
  size变化或进程退出才restart。
- 不Raise用户窗口，不使用`open -a`或会夺焦点的自动化；优先Computer Use background
  `showInactive()`和PID-derived DevTool。
- 每个retained frame同时保存exact assertions、dimensions和error/warning console。
- 如果同一owned app连续两次同错退出，停止restart loop并诊断，不反复弹窗。
- 结束前停止owned进程，确认当前state仍匹配本run写入bytes，再byte-exact恢复用户state。
- 关闭named browser sessions和所有owned Web/server/Lynxtron/DevTool进程，确认owned
  ports释放；不得停止用户或其他任务进程。
- 不认证或声称Native Command K keyboard shortcut。

### Slice D — 最终完成审计与certification commit

1. strict manifest中每个required client cell都必须为真实有效retained evidence。
2. 运行Composer evidence regression tests和strict verifier；strict必须exit 0。
3. 运行全部相关focused Web/Lynx/browser tests。
4. 运行Web、Lynx-for-Web和Desktop production builds。
5. 本goal prompt明确授权只在最终验收阶段运行一次heavy workspace verification pass：
   - `bun fmt`
   - `bun lint`
   - `bun typecheck`
   将三项合并到一次最终pass；迭代中不得重复运行。若格式化产生修改，审查修改并做最小
   必要复验；不得用它顺手改无关文件。
6. 最终代码/架构审计：
   - Project Picker只有一个shared ordinary anatomy owner；
   - Extras没有分叉的普通anatomy；
   - command rows没有`$`、`@`、`/`等文本glyph占位；
   - selected skill/mention只显示一次；
   - canonical send与structured refs正确；
   - clear/undo/redo/send/failure/restart保持原子一致；
   - comparison无stale metadata、错配状态、旧build或未回填Native证据；
   - intentional platform differences逐项登记；
   - 零未登记重大视觉/行为差异。
7. 更新并保持相互一致：
   - `apps/lynx/plan/reports/p9-u5-composer-fidelity-plan.md`
   - `apps/lynx/plan/LOG.md`
   - `shots/2026-08-03/p9-u5-composer/manifest.json`
   - generated `manifest.js`
   - evidence `notes.md`
   - repository comparison gallery。
8. 最终certification commit并立即push：
   `test(composer): certify detailed composer states`
9. 只有strict verifier、focused tests、production builds、final heavy checks全部通过，
   evidence完整，user state恢复，owned processes/ports清理，所有commits已push后，才将
   P9-U5标记complete并向用户报告完成。

## 工作方式

- 使用plan跟踪Slice A–D，任何时刻只保留一个in-progress slice。
- 每次开始大改、build或Native长验证前给用户一句简短进度说明。
- 先读取实际代码、API、DOM/event shape和host行为，不猜测。
- 每完成一个gate立即更新plan状态，不维护与磁盘不一致的todo。
- 不停在“目前完成了大部分”；本prompt的完成单位是整个P9-U5 goal。
```

## Remaining commit sequence

1. `feat(composer): project native inline tokens`
2. `test(composer): certify detailed composer states`

Each commit must be pushed immediately and end with exactly one:

```text
Co-authored-by: TRAE CLI <noreply@bytedance.com>
```
