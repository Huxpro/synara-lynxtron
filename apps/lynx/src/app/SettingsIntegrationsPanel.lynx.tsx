import { useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type {
  ExternalMcpCreateIntegrationResult,
  ExternalMcpIntegration,
} from '@synara/contracts';
import { SettingsSection } from '@synara-web/components/settings/SettingsSection';

import { SettingsGeneralBooleanControlElement } from '../adapters/SettingsGeneralCompositionElements.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { CheckIcon, ChevronRightIcon } from '../lib/icons.lynx';
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from '../platform/motion.lynx';
import {
  createExternalMcpIntegration,
  fetchExternalMcpIntegrations,
  refreshExternalMcpPairing,
  revokeExternalMcpIntegration,
} from '../data/synaraClient.lynx';
import { clipboard } from '../platform/clipboard';
import { fetchSidebarSnapshot, queryClient } from './queries';
import {
  buildExternalMcpCapabilities,
  buildExternalMcpSetupPrompt,
  describeIntegrationPermissions,
  describeIntegrationProjects,
  formatIntegrationDate,
  integrationIsActive,
  integrationStatus,
} from './settingsIntegrations.logic';

import './settings-integrations-panel.css';

function ProjectChoice(props: {
  readonly checked: boolean;
  readonly title: string;
  readonly onChange: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SettingsIntegrationsProject${
      props.checked ? ' SettingsIntegrationsProject--checked' : ''
    }`,
    accessibleLabel: props.title,
    accessibilityValue: props.checked ? 'Selected' : 'Not selected',
    onActivate: props.onChange,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="SettingsIntegrationsProjectTitle">{props.title}</text>
      <view
        className={`SettingsIntegrationsCheckbox${
          props.checked ? ' SettingsIntegrationsCheckbox--checked' : ''
        }`}
      >
        {props.checked ? (
          <view className="SettingsIntegrationsCheckmark">
            <CheckIcon size={12} color="var(--primary-foreground)" />
          </view>
        ) : null}
      </view>
    </view>
  );
}

export function SettingsIntegrationsPanel() {
  const integrationsQuery = useQuery({
    queryKey: ['external-mcp-integrations'],
    queryFn: () => {
      'background only';
      return fetchExternalMcpIntegrations();
    },
    staleTime: 5_000,
  });
  const snapshotQuery = useQuery({
    queryKey: ['sidebar-snapshot'],
    queryFn: () => {
      'background only';
      return fetchSidebarSnapshot();
    },
  });
  const [name, setName] = useState('Coding agent');
  const [allProjects, setAllProjects] = useState(true);
  const [selectedProjectIds, setSelectedProjectIds] = useState<
    readonly string[]
  >([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [allowProjectRead, setAllowProjectRead] = useState(false);
  const [allowLocal, setAllowLocal] = useState(false);
  const [allowFullAccess, setAllowFullAccess] = useState(false);
  const [setup, setSetup] =
    useState<ExternalMcpCreateIntegrationResult | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const projectGridPresent = useLynxDisclosurePresence(!allProjects);
  const advancedPresent = useLynxDisclosurePresence(advancedOpen);

  const projects = snapshotQuery.data?.projects ?? [];
  const capabilities = buildExternalMcpCapabilities({
    allowProjectRead,
    allowLocal,
    allowFullAccess,
  });
  const canCreate =
    name.trim().length > 0 &&
    (allProjects || selectedProjectIds.length > 0) &&
    pendingAction === null;

  async function createConnection() {
    'background only';
    if (!canCreate) return;
    setPendingAction('create');
    setNotice(null);
    try {
      const result = await createExternalMcpIntegration({
        name: name.trim(),
        projectScope: allProjects ? 'all' : 'selected',
        ...(allProjects ? {} : { projectIds: selectedProjectIds }),
        capabilities,
        expiresInDays: 30,
      });
      setSetup(result);
      await queryClient.invalidateQueries({
        queryKey: ['external-mcp-integrations'],
      });
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Could not create the connection.'
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function revoke(integration: ExternalMcpIntegration) {
    'background only';
    setPendingAction(integration.integrationId);
    setNotice(null);
    try {
      await revokeExternalMcpIntegration(integration.integrationId);
      if (setup?.integration.integrationId === integration.integrationId) {
        setSetup(null);
      }
      await queryClient.invalidateQueries({
        queryKey: ['external-mcp-integrations'],
      });
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Could not revoke connection.'
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function resumePairing(integration: ExternalMcpIntegration) {
    'background only';
    setPendingAction(integration.integrationId);
    setNotice(null);
    try {
      const result = integration.pairedAt
        ? {
            integration,
            pairingCode: 'already-paired',
            pairingExpiresAt: integration.createdAt,
            setupCommand: 'Pairing already completed',
            stdio: integration.stdio,
          }
        : await refreshExternalMcpPairing(integration.integrationId);
      setSetup(result);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Could not resume pairing.'
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function copySetupPrompt() {
    'background only';
    if (!setup) return;
    await clipboard.writeText(
      buildExternalMcpSetupPrompt({
        setupCommand: setup.integration.pairedAt ? null : setup.setupCommand,
        stdio: setup.stdio,
      })
    );
    setNotice('Setup prompt copied.');
  }

  if (integrationsQuery.isPending || snapshotQuery.isPending) {
    return (
      <view className="SettingsIntegrationsState">
        <text className="SettingsIntegrationsStateText">
          Loading connections…
        </text>
      </view>
    );
  }

  return (
    <view className="SettingsIntegrationsPanel">
      {notice ? (
        <view className="SettingsIntegrationsNotice">
          <text className="SettingsIntegrationsNoticeText">{notice}</text>
        </view>
      ) : null}

      {setup ? (
        <SettingsSection title={`Connect ${setup.integration.name}`}>
          <view className="SettingsIntegrationsSetup">
            <text className="SettingsIntegrationsRowTitle">
              {setup.integration.pairedAt
                ? 'Paired — waiting for first use'
                : 'Waiting for pairing'}
            </text>
            <text className="SettingsIntegrationsRowDescription">
              Paste the setup prompt into the coding agent you want to connect.
              The one-time pairing code and private credential stay in the
              canonical server workflow.
            </text>
            <view className="SettingsIntegrationsSetupActions">
              <Button
                size="xs"
                variant="outline"
                onClick={() => void copySetupPrompt()}
              >
                Copy setup prompt
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setSetup(null)}>
                Done
              </Button>
            </view>
          </view>
        </SettingsSection>
      ) : (
        <SettingsSection title="Connect a coding agent">
          <view className="SettingsIntegrationsRow SettingsIntegrationsRow--continued">
            <view className="SettingsIntegrationsRowCopy">
              <view className="SettingsIntegrationsTitleLine">
                <text className="SettingsIntegrationsRowTitle">Name</text>
              </view>
              <text className="SettingsIntegrationsRowDescription">
                How this connection appears in Synara. Works with Codex,
                Claude, and any other MCP-capable agent.
              </text>
            </view>
            <Input
              className="SettingsIntegrationsNameInput"
              value={name}
              maxLength={120}
              placeholder="Coding agent"
              onChange={(event) => setName(event.target.value)}
            />
          </view>

          <view className="SettingsIntegrationsRow SettingsIntegrationsRow--continued SettingsIntegrationsRow--disclosure">
            <view className="SettingsIntegrationsRowHeader">
              <view className="SettingsIntegrationsRowCopy">
                <view className="SettingsIntegrationsTitleLine">
                  <text className="SettingsIntegrationsRowTitle">
                    Access all of Synara
                  </text>
                </view>
                <text className="SettingsIntegrationsRowDescription">
                  The agent can discover and work in every project, including
                  ones you add later. Turn off to pick specific projects.
                </text>
              </view>
              <SettingsGeneralBooleanControlElement
                checked={allProjects}
                ariaLabel="Access all of Synara"
                onChange={setAllProjects}
              />
            </view>
            {projectGridPresent ? (
              <view
                className={disclosureContentClassName(
                  !allProjects,
                  'SettingsIntegrationsProjectGrid'
                )}
                aria-hidden={allProjects}
              >
                {projects.map((project) => (
                  <ProjectChoice
                    key={project.id}
                    title={project.title}
                    checked={selectedProjectIds.includes(project.id)}
                    onChange={() =>
                      setSelectedProjectIds((current) =>
                        current.includes(project.id)
                          ? current.filter((id) => id !== project.id)
                          : [...current, project.id]
                      )
                    }
                  />
                ))}
                {projects.length === 0 ? (
                  <text className="SettingsIntegrationsRowDescription">
                    No projects are available.
                  </text>
                ) : null}
              </view>
            ) : null}
          </view>

          <view className="SettingsIntegrationsRow SettingsIntegrationsRow--continued SettingsIntegrationsRow--disclosure">
            <view className="SettingsIntegrationsRowHeader">
              <view className="SettingsIntegrationsRowCopy">
                <view className="SettingsIntegrationsTitleLine">
                  <text className="SettingsIntegrationsRowTitle">
                    Advanced permissions
                  </text>
                </view>
                <text className="SettingsIntegrationsRowDescription">
                  Optional access for existing tasks, shared checkouts, or
                  execution without approvals. The safe defaults are
                  recommended.
                </text>
              </view>
              <Button
                size="xs"
                variant="ghost"
                aria-label="Review advanced permissions"
                aria-expanded={advancedOpen}
                onClick={() => setAdvancedOpen((current) => !current)}
              >
                <text className="LxButton__text">Review</text>
                <ChevronRightIcon
                  className={disclosureChevronClassName(
                    advancedOpen,
                    'SettingsIntegrationsDisclosureChevron'
                  )}
                  size={14}
                  color="var(--muted-foreground)"
                />
              </Button>
            </view>
            {advancedPresent ? (
              <view
                className={disclosureContentClassName(
                  advancedOpen,
                  'SettingsIntegrationsAdvanced'
                )}
                aria-hidden={!advancedOpen}
              >
                {[
                  {
                    key: 'read',
                    title: 'Read other project tasks',
                    description:
                      'Without this permission, the agent can read only tasks it creates.',
                    checked: allowProjectRead,
                    onChange: setAllowProjectRead,
                  },
                  {
                    key: 'local',
                    title: 'Use the shared local checkout',
                    description:
                      'High impact. Tasks may modify the checkout you are actively using instead of an isolated worktree.',
                    checked: allowLocal,
                    onChange: setAllowLocal,
                  },
                  {
                    key: 'full',
                    title: 'Run without approval prompts',
                    description:
                      'High impact. The external agent may start full-access execution without asking you to approve tool actions.',
                    checked: allowFullAccess,
                    onChange: setAllowFullAccess,
                  },
                ].map((permission) => (
                  <view
                    key={permission.key}
                    className="SettingsIntegrationsPermission"
                  >
                    <view className="SettingsIntegrationsRowCopy">
                      <text className="SettingsIntegrationsPermissionTitle">
                        {permission.title}
                      </text>
                        <text className="SettingsIntegrationsPermissionDescription">
                        {permission.description}
                      </text>
                    </view>
                    <SettingsGeneralBooleanControlElement
                      checked={permission.checked}
                      ariaLabel={permission.title}
                      onChange={permission.onChange}
                    />
                  </view>
                ))}
              </view>
            ) : null}
          </view>

          <view className="SettingsIntegrationsRow">
            <view className="SettingsIntegrationsRowCopy">
              <view className="SettingsIntegrationsTitleLine">
                <text className="SettingsIntegrationsRowTitle">
                  Create connection
                </text>
              </view>
              <text className="SettingsIntegrationsRowDescription">
                The connection lasts 30 days and can be revoked at any time.
                The next screen gives one prompt to paste into your agent.
              </text>
            </view>
            <Button
              size="sm"
              disabled={!canCreate}
              aria-label="Create coding agent connection"
              onClick={() => void createConnection()}
            >
              {pendingAction === 'create'
                ? 'Creating…'
                : 'Create connection'}
            </Button>
          </view>
        </SettingsSection>
      )}

      <SettingsSection title="Connected agents">
        {integrationsQuery.data?.length ? (
          integrationsQuery.data.map((integration, index) => {
            const active = integrationIsActive(integration, Date.now());
            return (
              <view
                key={integration.integrationId}
                className={`SettingsIntegrationsConnection${
                  index > 0
                    ? ' SettingsIntegrationsConnection--divided'
                    : ''
                }`}
              >
                <view className="SettingsIntegrationsRowCopy">
                  <text className="SettingsIntegrationsRowTitle">
                    {integration.name}
                  </text>
                  <text className="SettingsIntegrationsRowDescription">
                    {integrationStatus(integration, Date.now())}
                  </text>
                  <text className="SettingsIntegrationsRowDescription">
                    Projects: {describeIntegrationProjects(integration)}
                  </text>
                  <text className="SettingsIntegrationsRowDescription">
                    Permissions:{' '}
                    {describeIntegrationPermissions(integration.capabilities)}
                  </text>
                  <text className="SettingsIntegrationsRowDescription">
                    Created {formatIntegrationDate(integration.createdAt)} ·
                    Last used {formatIntegrationDate(integration.lastUsedAt)} ·
                    Expires {formatIntegrationDate(integration.expiresAt)}
                  </text>
                </view>
                {active ? (
                  <view className="SettingsIntegrationsConnectionActions">
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={pendingAction !== null}
                      onClick={() => void resumePairing(integration)}
                    >
                      {integration.pairedAt
                        ? 'Continue setup'
                        : 'Resume pairing'}
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive-outline"
                      disabled={pendingAction !== null}
                      onClick={() => void revoke(integration)}
                    >
                      Revoke
                    </Button>
                  </view>
                ) : null}
              </view>
            );
          })
        ) : (
          <view className="SettingsIntegrationsEmpty">
            <text className="SettingsIntegrationsRowTitle">
              No connected agents
            </text>
            <text className="SettingsIntegrationsRowDescription">
              Connect Codex, Claude, or another local MCP agent to create and
              follow Synara tasks.
            </text>
          </view>
        )}
      </SettingsSection>
    </view>
  );
}
