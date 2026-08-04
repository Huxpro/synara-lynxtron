import type {
  ExternalMcpCapability,
  ExternalMcpIntegration,
  ExternalMcpStdioConfiguration,
} from '@synara/contracts';

export const CORE_EXTERNAL_MCP_CAPABILITIES: readonly ExternalMcpCapability[] = [
  'projects:read',
  'tasks:create',
  'tasks:wait',
  'tasks:read',
];

export function buildExternalMcpCapabilities(input: {
  readonly allowProjectRead: boolean;
  readonly allowLocal: boolean;
  readonly allowFullAccess: boolean;
}): readonly ExternalMcpCapability[] {
  const capabilities = [...CORE_EXTERNAL_MCP_CAPABILITIES];
  if (input.allowProjectRead) capabilities.push('tasks:read-project');
  if (input.allowLocal) capabilities.push('runtime:local');
  if (input.allowFullAccess) capabilities.push('runtime:full-access');
  return capabilities;
}

export function integrationStatus(
  integration: ExternalMcpIntegration,
  nowMs: number
): string {
  if (integration.revokedAt) return 'Revoked';
  if (Date.parse(integration.expiresAt) <= nowMs) return 'Expired';
  if (integration.lastUsedAt) return 'Connected';
  if (integration.pairedAt) return 'Paired — not used yet';
  return 'Waiting for pairing';
}

export function integrationIsActive(
  integration: ExternalMcpIntegration,
  nowMs: number
): boolean {
  return !integration.revokedAt && Date.parse(integration.expiresAt) > nowMs;
}

export function describeIntegrationProjects(
  integration: Pick<
    ExternalMcpIntegration,
    'projectScope' | 'allowedProjects'
  >
): string {
  if (integration.projectScope === 'all') {
    return 'All projects, including future ones';
  }
  const titles = integration.allowedProjects.map((project) => project.title);
  return titles.length > 0 ? titles.join(', ') : 'No projects';
}

export function describeIntegrationPermissions(
  capabilities: readonly ExternalMcpCapability[]
): string {
  const descriptions = ['Create and follow its own tasks'];
  if (capabilities.includes('tasks:read-project')) {
    descriptions.push('Read other tasks in selected projects');
  }
  if (capabilities.includes('runtime:local')) {
    descriptions.push('Use the shared local checkout');
  }
  if (capabilities.includes('runtime:full-access')) {
    descriptions.push('Run without approval prompts');
  }
  return descriptions.join(' · ');
}

function jsonConfiguration(stdio: ExternalMcpStdioConfiguration): string {
  return JSON.stringify(
    {
      mcpServers: {
        synara: {
          command: stdio.command,
          args: stdio.args,
          ...(stdio.env ? { env: stdio.env } : {}),
        },
      },
    },
    null,
    2
  );
}

export function buildExternalMcpSetupPrompt(input: {
  readonly setupCommand: string | null;
  readonly stdio: ExternalMcpStdioConfiguration;
}): string {
  const sections = [
    'Connect this coding agent to Synara via MCP. Complete every step yourself, in order, and report what happened.',
  ];
  if (input.setupCommand) {
    sections.push(
      [
        'Step 1 — Pair this computer. Run this exact command in a shell:',
        '',
        input.setupCommand,
      ].join('\n')
    );
  } else {
    sections.push('Step 1 — Pairing is already completed on this computer.');
  }
  sections.push(
    [
      'Step 2 — Register Synara as a local stdio MCP server named "synara":',
      '',
      jsonConfiguration(input.stdio),
    ].join('\n'),
    'Step 3 — Reload MCP servers, call the "synara_overview" tool, and summarize what it returns.'
  );
  return sections.join('\n\n');
}
