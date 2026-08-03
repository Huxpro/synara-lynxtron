# P9-U5 Composer fidelity continuation goal prompt

Updated: 2026-08-03

This file is a self-contained execution prompt for continuing the active
Composer fidelity goal. The repository state on disk is authoritative.

## Goal prompt

```text
继续完成 Synara P9-U5 Composer fidelity convergence，直到
`apps/lynx/plan/reports/p9-u5-composer-fidelity-plan.md` 的全部完成标准真实满足。

不要只写分析、计划或 prototype；要完成产品实现、严格 comparison evidence、
Browser paired validation、exact-owned Native certification、独立 commits、push 和最终审计。

## 起点

- 工作目录：`/Users/bytedance/github/synara`
- 分支：`huxcx/lynxtron-port-current-state`
- 已完成并推送 Phase 0：
  - commit `c7ba72fc`，`test(composer): enforce strict comparison states`
  - strict manifest：
    `shots/2026-08-03/p9-u5-composer/manifest.json`
  - comparison gallery：
    `shots/2026-08-03/p8-q2/comparison.html`
  - verifier：
    `bun run --cwd apps/lynx evidence:composer`
- Phase 0 strict verifier 当前因 required evidence 尚未完成而 exit 2，这是正确红灯，
  不能通过降低规则、把 diagnostic 改成 retained 或删掉 required cells 来变绿。
- 当前工作树包含未提交的 Phase 1 Project Picker 实现。先检查和继续这些改动，
  不得 reset、checkout、覆盖或重做：
  - `apps/web/src/components/chat/ComposerProjectPicker.logic.ts`
  - `apps/web/src/components/chat/ComposerProjectPicker.logic.test.ts`
  - `apps/web/src/components/chat/ComposerProjectPickerComposition.tsx`
  - `apps/web/src/components/chat/ComposerProjectPickerCompositionElements.tsx`
  - `apps/web/src/components/chat/ProjectPicker.tsx`
  - `apps/web/src/components/ChatView.browser.tsx`
  - `apps/lynx/src/adapters/ComposerProjectPickerCompositionElements.lynx.tsx`
  - `apps/lynx/lynx.config.ts`
  - `apps/lynx/src/components/composer/LandingComposer.lynx.tsx`
  - `apps/lynx/src/components/composer/landing-composer.css`
  - `apps/lynx/src/components/composer/landingComposerFidelity.test.ts`
  - `shots/2026-08-03/p9-u5-composer/diagnostic/project-picker/`
- 当前 shared picker model 已支持 project/folder、Space/Void/Folders 分组、search、
  selected、empty/no-match、reset 与 New project intents。Web 与 Lynx 已接入 shared
  composition；需要完成真实交互验证、deterministic state coverage、证据和 slice commit。

开始前读取：

1. 根目录 `AGENTS.md`；
2. `apps/lynx/plan/reports/p9-u5-composer-fidelity-plan.md`；
3. `apps/lynx/plan/LOG.md`；
4. 当前 `git status`、`git diff`；
5. strict manifest、verifier和comparison实现。

## 不可协商原则

1. comparison 页面是日常迭代和最终验收工具，不是任务结束时补截图。
2. 每个 retained cell 必须使用同一 build、snapshot、route、theme、viewport/DPR、
   project/workspace、draft/caret、Plan、Fast和token state。
3. 禁止复用不同组合态；Plan-only、Fast-only、Plan+Fast必须是独立状态。
4. Browser pass不能冒充Native pass；Native-required state必须使用exact-owned Lynxtron。
5. Web original是composition和visual authority，但正确产品行为高于Web偶发bug。
6. ordinary anatomy必须physical-shared；platform adapter只拥有原生elements、input/list、
   icon及host/filesystem能力。
7. Native UI不得使用HTML elements；使用ReactLynx built-ins、`bindtap`等原生事件。
8. 不进入Native Command K keyboard shortcut、general host keyboard repair、terminal、
   browser、PDF、voice等hard islands。
9. 不做无关cleanup，不删除或弱化既有测试/证据门禁。
10. 只使用`bun run test`，永远不要使用`bun test`。
11. 每个coherent slice必须：实现 → focused tests → production builds →
    comparison evidence → 更新plan/LOG → 独立commit → 立即push。
12. commit message末尾必须且只能有一次：
    `Co-authored-by: TRAE CLI <noreply@bytedance.com>`

## 执行顺序

### Slice 1 — 完成 Project Picker convergence

先完成当前未提交工作，不要开始Extras。

1. 审查shared model/composition/adapters，确认Web workspace-root mode和project mode、
   Lynx landing mode均使用同一ordinary anatomy owner。
2. 在Lynx-for-Web真实操作：
   - 打开picker；
   - 检查实际closed shadow DOM中的option outerHTML、文字和bounding boxes；
   - 按可见文本定位并点击`spike-workspace`，断言trigger更新；
   - 重新打开并点击reset，断言恢复`Work in a project`；
   - 通过真实input事件验证search filtered和no-match；
   - 不要因automation的`fill`不触发ReactLynx main-thread input而修改产品逻辑。
3. 补足deterministic tests：
   - grouping/order；
   - project/folder filtering；
   - selected/reset；
   - loading；
   - empty/no-match；
   - error/retry；
   - New project和folder selection intents。
4. 验证first-send仍投影正确的project/model/workspace。
5. 保存同snapshot、同状态Web/Lynx paired evidence并回填manifest；diagnostic不得冒充
   retained。
6. 运行focused Web/Lynx tests、相关browser tests、Web和Lynx-for-Web production
   builds。
7. 更新主plan状态和`apps/lynx/plan/LOG.md`。
8. commit：
   `refactor(composer): share project picker composition`
   然后立即push。

Project Picker gate：

- Web/Lynx的search、groups/order、selected/reset、New project、loading、empty/no-match、
  error/retry anatomy一致；
- local folder与existing project行为真实可用；
- Landing Composer不再拥有`MenuItem/MenuPopup`普通picker anatomy；
- Web没有行为回归；
- strict manifest中Project Picker Browser-required cells有有效paired evidence；
- Native-required cells若尚未batch认证，必须保持truthful pending，不能伪装完成。

### Slice 2 — Extras primitive parity

1. 反向检查Web和Lynx是否都消费现有shared Extras composition。
2. 用真实native icons替换`+`、paperclip、Plan、Fast文本/简化占位。
3. Plan使用与Web一致的switch/check anatomy。
4. Fast实现独立定位submenu，不使用inline fallback。
5. 对齐surface、border、radius、shadow、row height、padding、icon size、selected state和
   popup geometry，并复用shared tokens。
6. 保留明确平台能力差异：
   - Web：`Add image`
   - Native：`Add files`
7. 分别采集Plan-only、Fast-only、Plan+Fast；禁止互相代替。
8. 完成tests/builds/evidence/plan/LOG后commit并push：
   `refactor(composer): align extras menu primitives`

### Slice 3 — Skill and Mention command menus

1. 保留shared ranking、grouping、selection intents和structured references。
2. 用真实native icons替换`$`、`@`、`/`、`◉`等文本glyph占位。
3. 传递真实resolved theme，删除hard-coded light theme。
4. 对齐surface、width/max-height、group labels、row typography、description、
   project/scope metadata、highlight/selected/loading/empty/error states。
5. 验证长description和trailing metadata无碰撞，light/dark均正确。
6. 完成paired evidence和focused gates后commit并push：
   `refactor(composer): align skill and mention menus`

### Slice 4 — Native selected token projection

目标：skill/mention每个语义token在编辑器中只显示一次，同时provider dispatch仍获得
canonical text与structured references。

1. 先调查现有Web Lexical token、Lynx textarea、draft persistence、send projection和
   provider payload边界；不要直接在CSS层隐藏重复文本。
2. 建立明确的native draft projection，至少区分：
   - display text/tokens；
   - canonical provider text；
   - structured mentions；
   - structured skills。
3. 选择token后，visible editor不得同时出现chip和canonical raw syntax。
4. editing、clear、selection delete、Backspace/Delete、undo/redo、paste、multiple tokens、
   duplicate selection、failed send、successful send、reload/restart必须原子维护display、
   canonical和structured context。
5. IME/selection/paste/undo等Native textarea语义必须留到exact-owned Native验证，不能由
   Lynx-for-Web推断。
6. send通过canonical product RPC；SQLite仅read-only验证projection，禁止直接写fixture。
7. 完成tests/builds/evidence后commit并push：
   `feat(composer): project native inline tokens`

### Slice 5 — Browser matrix closure

1. 使用一个isolated Synara server、一个真实snapshot、两个named browser sessions。
2. Web original与Lynx-for-Web保持同route/theme/viewport/DPR/product state。
3. 通过canonical RPC/mutations创建状态；禁止直接写SQLite。
4. 对strict manifest的全部Browser-required cells逐格执行真实rendered controls。
5. 每格记录：
   - build/snapshot hash；
   - route/theme/viewport/DPR；
   - runtime与PNG dimensions；
   - project/draft/caret/Plan/Fast/token state；
   - structured refs；
   - geometry/assertions；
   - fresh console。
6. 每次先measure再patch，旧图或不同状态图不得retained。
7. strict verifier可以在Native batch前因Native-required pending保持红，但所有Browser
   required cells必须完整且有效。

### Slice 6 — Exact-owned Native certification batch

只在Browser矩阵通过后执行。

1. 完整production build并记录staged bundle path/hash。
2. dry-run isolated server；记录state dir、ports、owned PIDs和snapshot hash。
3. 使用exact-owned `apps/lynx` workspace executable和
   `apps/lynx/dist/desktop/main.lynx.bundle`。
4. `NODE_ENV=production`、`SYNARA_ENABLE_DEVTOOL=1`。
5. 从owned Lynxtron PID通过`lsof`解析DevTool client；禁止按历史端口或list order选择。
6. 先确认root theme class、bundle identity、outer/content dimensions、console clean。
7. 保持一个verified instance完成同size下所有route/theme/state；只有cold-start、
   persistence、bundle变化或size变化才restart。
8. 至少认证：
   - default landing；
   - Extras default；
   - Plan-only；
   - Fast-only；
   - Project open/selected/reset；
   - Skill menu/selected/cleared；
   - Mention menu/selected/cleared；
   - token editing；
   - send projection；
   - restart persistence。
9. 不认证Native Command K shortcut，不把它重新纳入scope。
10. 每个retained Native frame同时保存exact assertions和error/warning console。
11. 退出前恢复用户state原始bytes/hash；关闭named browser和所有owned
    Web/server/Lynxtron/DevTool进程；确认owned ports释放。

### Slice 7 — Final completion audit

1. strict manifest中每个required cell都必须是有效retained evidence。
2. 运行：
   - Composer evidence regression tests；
   - strict evidence verifier；
   - 所有相关focused Web/Lynx/browser tests；
   - Web、Lynx-for-Web、Desktop production builds。
3. 本goal prompt明确授权仅在最终验收阶段运行一次heavy workspace checks：
   - `bun fmt`
   - `bun lint`
   - `bun typecheck`
   将三项合并为一次final verification pass，不在迭代中重复运行。
4. 检查：
   - Project Picker只有一个shared ordinary owner；
   - Extras没有独立普通anatomy；
   - command rows没有文本glyph占位；
   - selected token只显示一次；
   - canonical send payload和structured refs正确；
   - clean consoles；
   - user state byte-exact restore；
   - owned processes/ports全部清理；
   - comparison无stale metadata、错配状态或未回填证据；
   - 所有intentional platform differences逐项登记；
   - 零未登记重大视觉/行为差异。
5. 更新：
   - `apps/lynx/plan/reports/p9-u5-composer-fidelity-plan.md`
   - `apps/lynx/plan/LOG.md`
   - evidence `notes.md`
   - comparison manifest/gallery
6. 最终certification commit并push：
   `test(composer): certify detailed composer states`
7. 只有strict verifier、focused tests、production builds、final heavy checks全部通过，
   evidence完整、clean-up完成且所有commits已push后，才能声明P9-U5 complete。

## 工作方式

- 使用plan跟踪上述slices，任何时候只保留一个in-progress slice。
- 每次开始大改或长验证前给用户一句简短进度说明。
- 先检查依赖和实际代码，不猜测API、DOM、event shape或host行为。
- 遇到harness failure先修harness，不能报告成product regression。
- 遇到product failure必须修根因并重新采集该cell，不能在notes里解释后直接pass。
- 不停在“建议下一步”；除非缺少真实外部依赖或用户授权，否则持续推进到完整完成。
```

## Expected commit sequence

1. `refactor(composer): share project picker composition`
2. `refactor(composer): align extras menu primitives`
3. `refactor(composer): align skill and mention menus`
4. `feat(composer): project native inline tokens`
5. `test(composer): certify detailed composer states`

Each commit must be pushed immediately and must end with:

```text
Co-authored-by: TRAE CLI <noreply@bytedance.com>
```
