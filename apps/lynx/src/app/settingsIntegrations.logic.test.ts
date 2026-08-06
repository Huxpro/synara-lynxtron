import { describe, expect, it } from '@rstest/core';
import type { ExternalMcpIntegration } from '@synara/contracts';

import {
  buildExternalMcpCapabilities,
  buildExternalMcpSetupPrompt,
  describeIntegrationPermissions,
  describeIntegrationProjects,
  formatIntegrationDate,
  integrationIsActive,
  integrationStatus,
} from './settingsIntegrations.logic';

const integration: ExternalMcpIntegration = {
  integrationId: 'integration-1' as never,
  name: 'Coding agent',
  audience: 'synara.external-mcp',
  capabilities: ['projects:read', 'tasks:create', 'tasks:wait', 'tasks:read'],
  projectScope: 'all',
  allowedProjects: [],
  createdAt: '2026-08-01T00:00:00.000Z',
  expiresAt: '2026-09-01T00:00:00.000Z',
  lastUsedAt: null,
  pairedAt: null,
  revokedAt: null,
  rateLimitPerMinute: 60,
  concurrencyLimit: 4,
  clientKind: 'other',
  stdio: {
    command: 'synara',
    args: ['mcp'],
  },
};

describe('Settings Integrations projection', () => {
  it('keeps safe core permissions and appends explicit high-impact grants', () => {
    expect(
      buildExternalMcpCapabilities({
        allowProjectRead: false,
        allowLocal: false,
        allowFullAccess: false,
      })
    ).toEqual(['projects:read', 'tasks:create', 'tasks:wait', 'tasks:read']);
    expect(
      buildExternalMcpCapabilities({
        allowProjectRead: true,
        allowLocal: true,
        allowFullAccess: true,
      })
    ).toEqual([
      'projects:read',
      'tasks:create',
      'tasks:wait',
      'tasks:read',
      'tasks:read-project',
      'runtime:local',
      'runtime:full-access',
    ]);
  });

  it('projects active, paired, connected, expired, and revoked status', () => {
    const now = Date.parse('2026-08-05T00:00:00.000Z');
    expect(integrationStatus(integration, now)).toBe('Waiting for pairing');
    expect(
      integrationStatus(
        { ...integration, pairedAt: '2026-08-02T00:00:00.000Z' },
        now
      )
    ).toBe('Paired — not used yet');
    expect(
      integrationStatus(
        { ...integration, lastUsedAt: '2026-08-03T00:00:00.000Z' },
        now
      )
    ).toBe('Connected');
    expect(
      integrationStatus(
        { ...integration, expiresAt: '2026-08-04T00:00:00.000Z' },
        now
      )
    ).toBe('Expired');
    expect(
      integrationStatus(
        { ...integration, revokedAt: '2026-08-04T00:00:00.000Z' },
        now
      )
    ).toBe('Revoked');
    expect(integrationIsActive(integration, now)).toBe(true);
  });

  it('describes project scope and optional permissions', () => {
    expect(describeIntegrationProjects(integration)).toBe(
      'All projects, including future ones'
    );
    expect(
      describeIntegrationProjects({
        projectScope: 'selected',
        allowedProjects: [
          { projectId: 'project-1' as never, title: 'Project One' },
        ],
      })
    ).toBe('Project One');
    expect(
      describeIntegrationPermissions([
        ...integration.capabilities,
        'runtime:local',
        'runtime:full-access',
      ])
    ).toContain('Use the shared local checkout');
  });

  it('builds a self-contained setup prompt from canonical server output', () => {
    const prompt = buildExternalMcpSetupPrompt({
      setupCommand: 'synara pair abc',
      stdio: integration.stdio,
    });
    expect(prompt).toContain('synara pair abc');
    expect(prompt).toContain('"mcpServers"');
    expect(prompt).toContain('"synara_overview"');
  });

  it('matches the Web local timestamp identity for connected agents', () => {
    expect(formatIntegrationDate(null)).toBe('Never');
    expect(formatIntegrationDate('not-a-date')).toBe('not-a-date');
    expect(formatIntegrationDate('2026-08-05T12:40:58')).toBe(
      '8/5/2026, 12:40:58 PM'
    );
  });
});
