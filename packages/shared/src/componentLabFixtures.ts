import type {
  AutomationDefinition,
  ModelSelection,
  ProviderKind,
  ProviderModelDescriptor,
  ServerProviderStatus,
} from '@synara/contracts';
import { AutomationId, ProjectId } from '@synara/contracts';
import type { RightDockPane } from './rightDock';

export const COMPONENT_LAB_AUTOMATION_PROJECT = {
  id: ProjectId.makeUnsafe('component-lab-automation-project'),
  name: 'Synara',
  workspaceRoot: '/workspace/synara',
} as const;

export const COMPONENT_LAB_AUTOMATION_DEFINITION: AutomationDefinition = {
  id: AutomationId.makeUnsafe('component-lab-automation'),
  projectId: COMPONENT_LAB_AUTOMATION_PROJECT.id,
  sourceThreadId: null,
  name: 'Review renderer fidelity',
  prompt: 'Compare the current automation surfaces and report any visual drift.',
  schedule: { type: 'daily', timeOfDay: '09:00', timezone: 'America/New_York' },
  enabled: true,
  nextRunAt: '2026-09-14T13:00:00.000Z',
  modelSelection: { provider: 'codex', model: 'gpt-5-codex' },
  runtimeMode: 'approval-required',
  interactionMode: 'default',
  worktreeMode: 'worktree',
  mode: 'standalone',
  targetThreadId: null,
  maxIterations: null,
  stopOnError: true,
  completionPolicy: { type: 'none' },
  completionPolicyVersion: 1,
  completionPolicyUpdatedAt: '2026-09-13T12:00:00.000Z',
  minimumIntervalSeconds: 60,
  maxRuntimeSeconds: 3600,
  retryPolicy: { type: 'none' },
  misfirePolicy: 'coalesce',
  acknowledgedRisks: [],
  iterationCount: 0,
  createdAt: '2026-09-13T12:00:00.000Z',
  updatedAt: '2026-09-13T12:00:00.000Z',
  archivedAt: null,
};

export const COMPONENT_LAB_PAUSED_AUTOMATION_DEFINITION: AutomationDefinition = {
  ...COMPONENT_LAB_AUTOMATION_DEFINITION,
  id: AutomationId.makeUnsafe('component-lab-paused-automation'),
  name: 'Weekly dependency review',
  prompt: 'Review dependency updates and summarize changes that need attention.',
  schedule: {
    type: 'weekly',
    dayOfWeek: 1,
    timeOfDay: '10:30',
    timezone: 'America/New_York',
  },
  enabled: false,
  nextRunAt: null,
  createdAt: '2026-09-13T12:05:00.000Z',
  updatedAt: '2026-09-13T12:05:00.000Z',
};

export type ComponentLabMessageActionsVariant =
  | 'assistant'
  | 'pinned'
  | 'tool'
  | 'user';

export type ComponentLabMessageAction = {
  readonly icon: 'copy' | 'edit' | 'pin' | 'reference' | 'revert';
  readonly label: string;
  readonly persistent?: boolean;
  readonly pressed?: boolean;
  readonly tooltip: string;
};

const ASSISTANT_MESSAGE_ACTIONS: readonly ComponentLabMessageAction[] = [
  { icon: 'pin', label: 'Pin to panel', tooltip: 'Pin to panel' },
  { icon: 'copy', label: 'Copy message', tooltip: 'Copy to clipboard' },
  {
    icon: 'reference',
    label: 'Reference whole assistant message',
    tooltip: 'Add to chat',
  },
];

export const COMPONENT_LAB_MESSAGE_ACTIONS_BY_VARIANT: Readonly<
  Record<ComponentLabMessageActionsVariant, readonly ComponentLabMessageAction[]>
> = {
  assistant: ASSISTANT_MESSAGE_ACTIONS,
  pinned: [
    {
      icon: 'pin',
      label: 'Unpin from panel',
      persistent: true,
      pressed: true,
      tooltip: 'Unpin from panel',
    },
    ...ASSISTANT_MESSAGE_ACTIONS.slice(1),
  ],
  user: [
    { icon: 'copy', label: 'Copy message', tooltip: 'Copy to clipboard' },
    { icon: 'edit', label: 'Edit message', tooltip: 'Edit and resend' },
    { icon: 'revert', label: 'Revert to this message', tooltip: 'Revert to this message' },
  ],
  // Tool calls are TimelineWorkEntryRow content, not transcript messages, and
  // Electron does not render a message-action footer for them.
  tool: [],
};

export function resolveComponentLabMessageActions(
  variant: string | undefined
): readonly ComponentLabMessageAction[] {
  if (variant && variant in COMPONENT_LAB_MESSAGE_ACTIONS_BY_VARIANT) {
    return COMPONENT_LAB_MESSAGE_ACTIONS_BY_VARIANT[
      variant as ComponentLabMessageActionsVariant
    ];
  }
  return ASSISTANT_MESSAGE_ACTIONS;
}

export type ComponentLabNavigationRowVariant =
  | 'kanban'
  | 'new-thread'
  | 'search'
  | 'settings';

export const COMPONENT_LAB_NAVIGATION_ROW_BY_VARIANT = {
  'new-thread': { icon: 'new-thread', label: 'New thread', shortcut: '⌘N' },
  search: { icon: 'search', label: 'Search', shortcut: '⌘K' },
  kanban: { icon: 'kanban', label: 'Kanban', shortcut: null },
  settings: { icon: 'settings', label: 'Settings', shortcut: null },
} as const;

export function resolveComponentLabNavigationRow(variant: string | undefined) {
  if (variant && variant in COMPONENT_LAB_NAVIGATION_ROW_BY_VARIANT) {
    return COMPONENT_LAB_NAVIGATION_ROW_BY_VARIANT[
      variant as ComponentLabNavigationRowVariant
    ];
  }
  return COMPONENT_LAB_NAVIGATION_ROW_BY_VARIANT.search;
}

export type ComponentLabCommandPaletteVariant =
  | 'empty'
  | 'error'
  | 'filtered'
  | 'recent'
  | 'suggested';

export const COMPONENT_LAB_COMMAND_PALETTE_BY_VARIANT = {
  suggested: { query: '', searchStatus: 'ready', actions: true, threads: false },
  recent: { query: '', searchStatus: 'ready', actions: false, threads: true },
  filtered: { query: 'settings', searchStatus: 'ready', actions: true, threads: true },
  empty: { query: 'no matching component', searchStatus: 'ready', actions: true, threads: true },
  error: { query: '', searchStatus: 'error', actions: true, threads: true },
} as const;

export function resolveComponentLabCommandPaletteFixture(
  variant: string | undefined
) {
  if (variant && variant in COMPONENT_LAB_COMMAND_PALETTE_BY_VARIANT) {
    return COMPONENT_LAB_COMMAND_PALETTE_BY_VARIANT[
      variant as ComponentLabCommandPaletteVariant
    ];
  }
  return COMPONENT_LAB_COMMAND_PALETTE_BY_VARIANT.suggested;
}

const MODEL_SLUGS = [
  'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5', 'gpt-5.4',
  'gpt-5.4-mini', 'gpt-5.3-codex', 'gpt-5.2-codex', 'gpt-5.2',
  'gpt-5.1-codex-max', 'gpt-5.1-codex-mini',
] as const;

export const COMPONENT_LAB_CODEX_MODELS: readonly ProviderModelDescriptor[] =
  MODEL_SLUGS.map((slug) => ({
    slug,
    name: slug
      .replace(/^gpt-/u, 'GPT-')
      .replace(/-codex/u, ' Codex')
      .replace(/-mini/u, ' Mini')
      .replace(/-max/u, ' Max')
      .replace(/-sol/u, ' Sol')
      .replace(/-terra/u, ' Terra')
      .replace(/-luna/u, ' Luna'),
    supportedReasoningEfforts: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'xhigh', label: 'Extra High' },
    ],
    defaultReasoningEffort: 'medium',
    supportsFastMode: true,
  }));

const OVERFLOW_MODEL_SLUGS = Array.from(
  { length: 12 },
  (_, index) => `gpt-archive-${String(index + 1).padStart(2, '0')}`
);

export const COMPONENT_LAB_OVERFLOW_CODEX_MODELS: readonly ProviderModelDescriptor[] = [
  ...COMPONENT_LAB_CODEX_MODELS,
  ...OVERFLOW_MODEL_SLUGS.map((slug, index) => ({
    slug,
    name: `GPT Archive ${String(index + 1).padStart(2, '0')}`,
    supportedReasoningEfforts: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
    defaultReasoningEffort: 'medium',
    supportsFastMode: false,
  })),
];

export const COMPONENT_LAB_MODEL_SELECTION: ModelSelection = {
  provider: 'codex',
  model: 'gpt-5.4',
  options: { reasoningEffort: 'low' },
};

export const COMPONENT_LAB_OPENCODE_MODELS: readonly ProviderModelDescriptor[] =
  Array.from({ length: 18 }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return {
      slug: `open-model-${number}`,
      name: `Open Model ${number}`,
      supportedReasoningEfforts: [],
      supportsFastMode: false,
    };
  });

export const COMPONENT_LAB_OPENCODE_SELECTION: ModelSelection = {
  provider: 'opencode',
  model: 'open-model-01',
  options: {},
};

// Three upstream groups are intentional: with one favourite, the production
// grouping policy opens Favourites and the active Anthropic group while Google
// remains available through its real disclosure control.
export const COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_MODELS: readonly ProviderModelDescriptor[] = [
  {
    slug: 'anthropic/claude-favorite-sort',
    name: 'Claude Favorite Sort',
    upstreamProviderId: 'anthropic',
    upstreamProviderName: 'Anthropic',
  },
  {
    slug: 'openai/gpt-favorite-sort',
    name: 'GPT Favorite Sort',
    upstreamProviderId: 'openai',
    upstreamProviderName: 'OpenAI',
  },
  {
    slug: 'google/gemini-group-disclosure',
    name: 'Gemini Group Disclosure',
    upstreamProviderId: 'google',
    upstreamProviderName: 'Google',
  },
];

export const COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_SELECTION: ModelSelection = {
  provider: 'opencode',
  model: 'anthropic/claude-favorite-sort',
  options: {},
};

export const COMPONENT_LAB_OPENCODE_GROUP_DISCLOSURE_FAVORITES = [
  'openai/gpt-favorite-sort',
] as const;

export const COMPONENT_LAB_PROVIDER_UPDATE_COPY = {
  default: {
    title: 'Claude update available',
    description: 'Claude has a newer version available.',
  },
  multiple: {
    title: '2 provider updates available',
    description: 'Claude and 1 more provider have newer versions available.',
  },
  updating: {
    title: 'Updating providers...',
    description: 'Updating 2 providers.',
  },
  failure: {
    title: 'Some provider updates failed',
    description: 'Claude could not be updated. Review provider tools for details.',
    copyText: 'npm install -g @anthropic-ai/claude-code',
  },
} as const;

export const COMPONENT_LAB_RIGHT_DOCK_PANES: readonly RightDockPane[] = [
  { id: 'explorer', kind: 'explorer', threadId: null, diffTurnId: null, diffFilePath: null, filePath: null, pullRequestProjectId: null, pullRequestRepository: null, pullRequestNumber: null, pullRequestInitialTab: null },
  { id: 'terminal', kind: 'terminal', threadId: null, diffTurnId: null, diffFilePath: null, filePath: null, pullRequestProjectId: null, pullRequestRepository: null, pullRequestNumber: null, pullRequestInitialTab: null },
  { id: 'sidechat:component-lab', kind: 'sidechat', threadId: null, diffTurnId: null, diffFilePath: null, filePath: null, pullRequestProjectId: null, pullRequestRepository: null, pullRequestNumber: null, pullRequestInitialTab: null },
];

export const COMPONENT_LAB_RIGHT_DOCK_OVERFLOW_PANES: readonly RightDockPane[] = [
  ...COMPONENT_LAB_RIGHT_DOCK_PANES,
  ...Array.from({ length: 6 }, (_, index) => ({
    id: `file:component-lab-${index + 1}`,
    kind: 'file' as const,
    threadId: null,
    diffTurnId: null,
    diffFilePath: null,
    filePath: `src/components/ComponentStory${index + 1}.tsx`,
    pullRequestProjectId: null,
    pullRequestRepository: null,
    pullRequestNumber: null,
    pullRequestInitialTab: null,
  })),
];

export const COMPONENT_LAB_VOICE_SILENCE_LEVELS = Array.from(
  { length: 36 },
  () => 0.04
);

export const COMPONENT_LAB_KANBAN_CARD_BY_VARIANT = {
  default: { column: 'done', title: 'Verify the release', draftPrompt: '', activeWorkStartedAt: null, isOptimisticDispatch: false },
  'long-title': { column: 'done', title: 'Verify the complete cross-renderer release workflow without truncating important context', draftPrompt: '', activeWorkStartedAt: null, isOptimisticDispatch: false },
  draft: { column: 'draft', title: 'Prepare release notes', draftPrompt: 'Capture validation evidence and unresolved runtime boundaries.', activeWorkStartedAt: null, isOptimisticDispatch: false },
  working: { column: 'inProgress', title: 'Run Native certification', draftPrompt: '', activeWorkStartedAt: '2026-01-01T00:00:00.000Z', isOptimisticDispatch: true },
} as const;

export function resolveComponentLabKanbanCardFixture(variant: string | undefined) {
  return COMPONENT_LAB_KANBAN_CARD_BY_VARIANT[
    variant && variant in COMPONENT_LAB_KANBAN_CARD_BY_VARIANT
      ? variant as keyof typeof COMPONENT_LAB_KANBAN_CARD_BY_VARIANT
      : 'default'
  ];
}

export const COMPONENT_LAB_VOICE_WAVEFORM_LEVELS = Array.from(
  { length: 72 },
  (_, index) => {
    const phase = index % 12;
    return [0.06, 0.12, 0.24, 0.48, 0.82, 1, 0.76, 0.42, 0.2, 0.1, 0.06, 0.04][phase]!;
  }
);

// A stable, non-round percentage makes partial-ring regressions obvious while
// keeping every optional detail row visible in the paired popover story.
export const COMPONENT_LAB_CONTEXT_WINDOW_USAGE = {
  usedTokens: 14_800,
  usedPercent: 7.4,
  totalProcessedTokens: 38_400,
  maxTokens: 200_000,
  remainingTokens: 185_200,
  usedPercentage: 7.4,
  remainingPercentage: 92.6,
  inputTokens: 12_400,
  cachedInputTokens: 8_100,
  outputTokens: 1_900,
  reasoningOutputTokens: 500,
  lastUsedTokens: 4_200,
  lastInputTokens: 3_400,
  lastCachedInputTokens: 2_100,
  lastOutputTokens: 600,
  lastReasoningOutputTokens: 200,
  toolUses: 3,
  durationMs: 12_400,
  compactsAutomatically: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
} as const;

export type ComponentLabContextWindowVariant =
  | 'high-usage'
  | 'optional-rows'
  | 'percentage-and-ratio';

const COMPONENT_LAB_CONTEXT_WINDOW_BASE = {
  ...COMPONENT_LAB_CONTEXT_WINDOW_USAGE,
  totalProcessedTokens: null,
  inputTokens: null,
  cachedInputTokens: null,
  outputTokens: null,
  reasoningOutputTokens: null,
  lastUsedTokens: null,
  lastInputTokens: null,
  lastCachedInputTokens: null,
  lastOutputTokens: null,
  lastReasoningOutputTokens: null,
  toolUses: null,
  durationMs: null,
  compactsAutomatically: false,
} as const;

export const COMPONENT_LAB_CONTEXT_WINDOW_BY_VARIANT = {
  'percentage-and-ratio': {
    usage: COMPONENT_LAB_CONTEXT_WINDOW_BASE,
    cumulativeCostUsd: null,
    activeWindowLabel: '200k',
    pendingWindowLabel: null,
  },
  'optional-rows': {
    usage: COMPONENT_LAB_CONTEXT_WINDOW_USAGE,
    cumulativeCostUsd: 0.1842,
    activeWindowLabel: '200k',
    pendingWindowLabel: '1M',
  },
  'high-usage': {
    usage: {
      ...COMPONENT_LAB_CONTEXT_WINDOW_BASE,
      usedTokens: 180_000,
      usedPercent: 90,
      remainingTokens: 20_000,
      usedPercentage: 90,
      remainingPercentage: 10,
    },
    cumulativeCostUsd: null,
    activeWindowLabel: '200k',
    pendingWindowLabel: null,
  },
} as const;

export function resolveComponentLabContextWindowFixture(
  variant: string | undefined
) {
  if (variant && variant in COMPONENT_LAB_CONTEXT_WINDOW_BY_VARIANT) {
    return COMPONENT_LAB_CONTEXT_WINDOW_BY_VARIANT[
      variant as ComponentLabContextWindowVariant
    ];
  }
  return COMPONENT_LAB_CONTEXT_WINDOW_BY_VARIANT['percentage-and-ratio'];
}

export const COMPONENT_LAB_PROVIDER_STATUSES: readonly ServerProviderStatus[] = [
  {
    provider: 'codex',
    status: 'ready',
    available: true,
    authStatus: 'authenticated',
    checkedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    provider: 'opencode',
    status: 'ready',
    available: true,
    authStatus: 'authenticated',
    checkedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const COMPONENT_LAB_DIFF_CODE_VIEW = {
  kind: 'files',
  additions: 1,
  deletions: 1,
  files: [
    {
      key: 'src/components/Typography.tsx',
      path: 'src/components/Typography.tsx',
      previousPath: null,
      relation: null,
      additions: 1,
      deletions: 1,
      binary: false,
      modeChange: null,
      lifecycle: null,
      lines: [
        { id: 'typography-delete', kind: 'deletion', oldLine: 41, newLine: null, text: 'const font = uiFont;' },
        { id: 'typography-add', kind: 'addition', oldLine: null, newLine: 41, text: 'const font = monoFont;' },
        { id: 'typography-context', kind: 'context', oldLine: 42, newLine: 42, text: 'renderCode(font);' },
      ],
    },
  ],
} as const;

export const COMPONENT_LAB_MODEL_OPTIONS_BY_PROVIDER: Record<
  ProviderKind,
  ReadonlyArray<{ readonly name: string; readonly slug: string }>
> = {
  antigravity: [],
  claudeAgent: [],
  codex: COMPONENT_LAB_CODEX_MODELS.map(({ name, slug }) => ({ name, slug })),
  cursor: [],
  droid: [],
  grok: [],
  kilo: [],
  opencode: COMPONENT_LAB_OPENCODE_MODELS.map(({ name, slug }) => ({ name, slug })),
  pi: [],
};

export const COMPONENT_LAB_OVERFLOW_MODEL_OPTIONS_BY_PROVIDER: Record<
  ProviderKind,
  ReadonlyArray<{ readonly name: string; readonly slug: string }>
> = {
  ...COMPONENT_LAB_MODEL_OPTIONS_BY_PROVIDER,
  codex: COMPONENT_LAB_OVERFLOW_CODEX_MODELS.map(({ name, slug }) => ({
    name,
    slug,
  })),
};
