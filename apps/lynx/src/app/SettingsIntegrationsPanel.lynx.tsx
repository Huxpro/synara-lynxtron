import { useEffect, useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import type { ExternalMcpCreateIntegrationResult, ExternalMcpIntegration } from "@synara/contracts";
import { SettingsSection } from "@synara-web/components/settings/SettingsSection";
import {
  buildExternalMcpClientConfiguration,
  buildExternalMcpExamplePrompt,
  buildExternalMcpSetupPrompt,
  externalMcpSetupAction,
} from "@synara-web/components/settings/externalMcpSetup";

import { SettingsGeneralBooleanControlElement } from "../adapters/SettingsGeneralCompositionElements.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ChevronRightIcon } from "../lib/icons.lynx";
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from "../platform/motion.lynx";
import {
  createExternalMcpIntegration,
  fetchExternalMcpIntegrations,
  refreshExternalMcpPairing,
  revokeExternalMcpIntegration,
} from "../data/synaraClient.lynx";
import { clipboard } from "../platform/clipboard";
import { fetchSidebarSnapshot, queryClient } from "./queries";
import {
  buildExternalMcpCapabilities,
  describeIntegrationPermissions,
  describeIntegrationProjects,
  formatIntegrationDate,
  integrationIsActive,
  integrationStatus,
} from "./settingsIntegrations.logic";
import { copyIntegrationText } from "./settingsIntegrationsClipboard.logic";
import { CheckboxIndicator } from "../components/ui/checkbox.lynx";

import "./settings-integrations-panel.css";

function ProjectChoice(props: {
  readonly checked: boolean;
  readonly title: string;
  readonly onChange: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SettingsIntegrationsProject${
      props.checked ? " SettingsIntegrationsProject--checked" : ""
    }`,
    accessibleLabel: props.title,
    accessibilityValue: props.checked ? "Selected" : "Not selected",
    onActivate: props.onChange,
  });
  return (
    <view
      className={interaction.className}
      aria-checked={props.checked}
      accessibility-role="checkbox"
      accessibility-state={{ checked: props.checked }}
      {...interaction.eventProps}
    >
      <text className="SettingsIntegrationsProjectTitle">{props.title}</text>
      <CheckboxIndicator checked={props.checked} className="SettingsIntegrationsCheckbox" />
    </view>
  );
}

export function SettingsIntegrationsPanel() {
  const integrationsQuery = useQuery({
    queryKey: ["external-mcp-integrations"],
    queryFn: () => {
      "background only";
      return fetchExternalMcpIntegrations();
    },
    staleTime: 5_000,
  });
  const snapshotQuery = useQuery({
    queryKey: ["sidebar-snapshot"],
    queryFn: () => {
      "background only";
      return fetchSidebarSnapshot();
    },
  });
  const [name, setName] = useState("Coding agent");
  const [allProjects, setAllProjects] = useState(true);
  const [selectedProjectIds, setSelectedProjectIds] = useState<readonly string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [allowProjectRead, setAllowProjectRead] = useState(false);
  const [allowLocal, setAllowLocal] = useState(false);
  const [allowFullAccess, setAllowFullAccess] = useState(false);
  const [setup, setSetup] = useState<ExternalMcpCreateIntegrationResult | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    readonly intent: "success" | "error";
    readonly message: string;
  } | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const projectGridPresent = useLynxDisclosurePresence(!allProjects);
  const advancedPresent = useLynxDisclosurePresence(advancedOpen);
  const manualPresent = useLynxDisclosurePresence(manualOpen);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

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
  const setupIntegration = setup
    ? (integrationsQuery.data?.find(
        (integration) => integration.integrationId === setup.integration.integrationId,
      ) ?? setup.integration)
    : null;
  const setupPaired = setupIntegration?.pairedAt != null;
  const setupConnected = setupPaired && setupIntegration?.lastUsedAt != null;
  const setupRevoked = setupIntegration?.revokedAt != null;
  const setupExpired = setupIntegration ? Date.parse(setupIntegration.expiresAt) <= nowMs : false;
  const pairingExpired = setup ? Date.parse(setup.pairingExpiresAt) <= nowMs : false;
  const setupUnavailable = setupRevoked || setupExpired || (!setupPaired && pairingExpired);
  const setupAction = externalMcpSetupAction({
    revoked: setupRevoked,
    integrationExpired: setupExpired,
    paired: setupPaired,
    pairingExpired,
  });
  const setupStatus = setupRevoked
    ? "Revoked"
    : setupExpired
      ? "Expired"
      : setupConnected
        ? "Connected"
        : setupPaired
          ? "Paired — waiting for first use"
          : pairingExpired
            ? "Pairing code expired"
            : "Waiting for pairing";
  const setupPrompt =
    setup && setupIntegration
      ? buildExternalMcpSetupPrompt({
          setupCommand: setupPaired ? null : setup.setupCommand,
          stdio: setup.stdio,
        })
      : null;
  const manualConfiguration = setup
    ? buildExternalMcpClientConfiguration("other", setup.stdio)
    : null;
  const examplePrompt =
    setup && setupIntegration
      ? buildExternalMcpExamplePrompt(
          setupIntegration.projectScope === "all"
            ? null
            : (setupIntegration.allowedProjects[0]?.title ?? null),
        )
      : null;

  async function createConnection() {
    "background only";
    if (!canCreate) return;
    setPendingAction("create");
    setNotice(null);
    try {
      const result = await createExternalMcpIntegration({
        name: name.trim(),
        projectScope: allProjects ? "all" : "selected",
        ...(allProjects ? {} : { projectIds: selectedProjectIds }),
        capabilities,
        expiresInDays: 30,
      });
      setSetup(result);
      await queryClient.invalidateQueries({
        queryKey: ["external-mcp-integrations"],
      });
    } catch (error) {
      setNotice({
        intent: "error",
        message: error instanceof Error ? error.message : "Could not create the connection.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function revoke(integration: ExternalMcpIntegration) {
    "background only";
    setPendingAction(integration.integrationId);
    setNotice(null);
    try {
      await revokeExternalMcpIntegration(integration.integrationId);
      if (setup?.integration.integrationId === integration.integrationId) {
        setSetup(null);
      }
      await queryClient.invalidateQueries({
        queryKey: ["external-mcp-integrations"],
      });
    } catch (error) {
      setNotice({
        intent: "error",
        message: error instanceof Error ? error.message : "Could not revoke connection.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function resumePairing(integration: ExternalMcpIntegration) {
    "background only";
    setPendingAction(integration.integrationId);
    setNotice(null);
    setManualOpen(false);
    try {
      const result = integration.pairedAt
        ? {
            integration,
            pairingCode: "already-paired",
            pairingExpiresAt: integration.createdAt,
            setupCommand: "Pairing already completed",
            stdio: integration.stdio,
          }
        : await refreshExternalMcpPairing(integration.integrationId);
      setSetup(result);
    } catch (error) {
      setNotice({
        intent: "error",
        message: error instanceof Error ? error.message : "Could not resume pairing.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function copySetupPrompt() {
    "background only";
    if (!setupPrompt) return;
    setNotice(
      await copyIntegrationText({
        value: setupPrompt,
        successMessage: "Setup prompt copied.",
        writeText: clipboard.writeText,
      }),
    );
  }

  async function copySetupValue(value: string, message: string) {
    "background only";
    setNotice(
      await copyIntegrationText({
        value,
        successMessage: message,
        writeText: clipboard.writeText,
      }),
    );
  }

  function closeSetup() {
    setManualOpen(false);
    setSetup(null);
  }

  if (integrationsQuery.isPending || snapshotQuery.isPending) {
    return (
      <view className="SettingsIntegrationsState">
        <text className="SettingsIntegrationsStateText">Loading connections…</text>
      </view>
    );
  }

  return (
    <view className="SettingsIntegrationsPanel">
      {notice ? (
        <view
          className={`SettingsIntegrationsNotice SettingsIntegrationsNotice--${notice.intent}`}
          accessibility-element
          accessibility-role={notice.intent === "error" ? "alert" : undefined}
        >
          <text className="SettingsIntegrationsNoticeText">{notice.message}</text>
        </view>
      ) : null}

      {setup && setupIntegration && setupPrompt && manualConfiguration && examplePrompt ? (
        <SettingsSection title={`Connect ${setupIntegration.name}`}>
          <view className="SettingsIntegrationsSetupRow">
            <view className="SettingsIntegrationsRowCopy">
              <text className="SettingsIntegrationsRowTitle">{setupStatus}</text>
              <text className="SettingsIntegrationsRowDescription">
                {setupRevoked
                  ? "This connection has been revoked and can no longer access Synara."
                  : setupExpired
                    ? "This connection has expired and can no longer access Synara."
                    : setupConnected
                      ? "Synara received a request from this agent. Setup is complete."
                      : setupPaired
                        ? "The private credential is stored locally. If the agent has not registered Synara yet, give it the setup prompt below."
                        : pairingExpired
                          ? "The one-time pairing code was not used in time. Resume pairing to issue a fresh code without replacing this connection."
                          : "Paste the setup prompt into your agent. This page updates automatically when pairing succeeds."}
              </text>
              <text className="SettingsIntegrationsRowDescription">
                {setupConnected
                  ? `Last connected ${formatIntegrationDate(setupIntegration.lastUsedAt)}.`
                  : `Connection expires ${formatIntegrationDate(setupIntegration.expiresAt)}.`}
              </text>
            </view>
            {setupAction === "revoke" ? (
              <Button
                size="xs"
                variant="destructive-outline"
                disabled={pendingAction !== null}
                onClick={() => void revoke(setupIntegration)}
              >
                Revoke and start over
              </Button>
            ) : setupAction === "resume-pairing" ? (
              <view className="SettingsIntegrationsSetupActions">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={pendingAction !== null}
                  onClick={() => void resumePairing(setupIntegration)}
                >
                  Resume pairing
                </Button>
                <Button size="xs" variant="ghost" onClick={closeSetup}>
                  Back
                </Button>
              </view>
            ) : setupAction === "done" ? (
              <Button size="xs" variant="ghost" onClick={closeSetup}>
                Done
              </Button>
            ) : null}
          </view>

          <view className="SettingsIntegrationsSetupRow SettingsIntegrationsSetupRow--stacked">
            <view className="SettingsIntegrationsRowCopy">
              <text className="SettingsIntegrationsRowTitle">1. Give your agent this prompt</text>
              <text className="SettingsIntegrationsRowDescription">
                Copy the prompt and paste it into the agent you want to connect (Codex, Claude Code,
                or any MCP-capable app). The agent pairs this computer, registers Synara in its own
                configuration, and verifies the connection by itself.
              </text>
              <text className="SettingsIntegrationsRowDescription">
                {setupPaired
                  ? "Paired. The prompt now covers only registration and verification."
                  : `Pairing code expires ${formatIntegrationDate(setup.pairingExpiresAt)}.`}
              </text>
            </view>
            <view className="SettingsIntegrationsSetupActionRow">
              <Button
                size="xs"
                variant="outline"
                disabled={setupUnavailable}
                onClick={() => void copySetupPrompt()}
              >
                Copy setup prompt
              </Button>
            </view>
            <scroll-view
              scroll-orientation="vertical"
              className="SettingsIntegrationsCodeBlock SettingsIntegrationsSetupPrompt"
            >
              <text className="SettingsIntegrationsCodeText">{setupPrompt}</text>
            </scroll-view>
          </view>

          <view className="SettingsIntegrationsSetupRow SettingsIntegrationsSetupRow--stacked">
            <view className="SettingsIntegrationsSetupDisclosureHeader">
              <view className="SettingsIntegrationsRowCopy">
                <text className="SettingsIntegrationsRowTitle">Set up by hand instead</text>
                <text className="SettingsIntegrationsRowDescription">
                  For apps without a terminal or chat, like Claude Desktop: run the pairing command
                  in Terminal, then add the JSON below to the app&apos;s MCP configuration.
                </text>
              </view>
              <Button
                size="xs"
                variant="ghost"
                aria-expanded={manualOpen}
                buttonProps={{
                  "accessibility-value": manualOpen ? "Expanded" : "Collapsed",
                }}
                onClick={() => setManualOpen((current) => !current)}
              >
                <text className="LxButton__text">{manualOpen ? "Hide" : "Show"}</text>
                <ChevronRightIcon
                  className={disclosureChevronClassName(
                    manualOpen,
                    "SettingsIntegrationsDisclosureChevron",
                  )}
                  size={14}
                  color="var(--muted-foreground)"
                />
              </Button>
            </view>
            {manualPresent ? (
              <view
                className={disclosureContentClassName(manualOpen, "SettingsIntegrationsManual")}
                aria-hidden={!manualOpen}
              >
                {!setupPaired ? (
                  <view className="SettingsIntegrationsManualSection">
                    <view className="SettingsIntegrationsManualHeader">
                      <text className="SettingsIntegrationsPermissionTitle">
                        Pairing command (run in Terminal)
                      </text>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={setupUnavailable}
                        onClick={() =>
                          void copySetupValue(setup.setupCommand, "Pairing command copied.")
                        }
                      >
                        Copy
                      </Button>
                    </view>
                    <scroll-view
                      scroll-orientation="horizontal"
                      className="SettingsIntegrationsCodeBlock SettingsIntegrationsCodeBlock--short"
                    >
                      <text className="SettingsIntegrationsCodeText">{setup.setupCommand}</text>
                    </scroll-view>
                  </view>
                ) : null}
                <view className="SettingsIntegrationsManualSection">
                  <view className="SettingsIntegrationsManualHeader">
                    <text className="SettingsIntegrationsPermissionTitle">
                      MCP configuration (JSON)
                    </text>
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={setupRevoked || setupExpired}
                      onClick={() =>
                        void copySetupValue(manualConfiguration.value, "Configuration copied.")
                      }
                    >
                      Copy
                    </Button>
                  </view>
                  <scroll-view
                    scroll-orientation="vertical"
                    className="SettingsIntegrationsCodeBlock"
                  >
                    <text className="SettingsIntegrationsCodeText">
                      {manualConfiguration.value}
                    </text>
                  </scroll-view>
                </view>
              </view>
            ) : null}
          </view>

          <view className="SettingsIntegrationsSetupRow SettingsIntegrationsSetupRow--stacked">
            <view className="SettingsIntegrationsRowCopy">
              <text className="SettingsIntegrationsRowTitle">2. Try it</text>
              <text className="SettingsIntegrationsRowDescription">
                Open a new chat in the agent you just connected and send this editable example. You
                never need to copy project IDs, model IDs, or request IDs yourself.
              </text>
              <text className="SettingsIntegrationsRowDescription">
                {setupConnected
                  ? "Connection verified by Synara."
                  : "Synara will show Connected after the agent makes its first request."}
              </text>
            </view>
            <view className="SettingsIntegrationsSetupActionRow">
              <Button
                size="xs"
                variant="outline"
                disabled={!setupPaired || setupRevoked || setupExpired}
                onClick={() => void copySetupValue(examplePrompt, "Example prompt copied.")}
              >
                Copy example prompt
              </Button>
            </view>
            {setupPaired ? (
              <view className="SettingsIntegrationsExample">
                <text className="SettingsIntegrationsRowDescription">{examplePrompt}</text>
              </view>
            ) : null}
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
                How this connection appears in Synara. Works with Codex, Claude, and any other
                MCP-capable agent.
              </text>
            </view>
            <Input
              nativeInput
              className="SettingsIntegrationsNameInput"
              value={name}
              maxLength={120}
              placeholder="Coding agent"
              accessibility-label="Connection name"
              onChange={(event) => setName(event.target.value)}
            />
          </view>

          <view className="SettingsIntegrationsRow SettingsIntegrationsRow--continued SettingsIntegrationsRow--disclosure">
            <view className="SettingsIntegrationsRowHeader">
              <view className="SettingsIntegrationsRowCopy">
                <view className="SettingsIntegrationsTitleLine">
                  <text className="SettingsIntegrationsRowTitle">Access all of Synara</text>
                </view>
                <text className="SettingsIntegrationsRowDescription">
                  The agent can discover and work in every project, including ones you add later.
                  Turn off to pick specific projects.
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
                  "SettingsIntegrationsProjectGrid",
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
                          : [...current, project.id],
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
                  <text className="SettingsIntegrationsRowTitle">Advanced permissions</text>
                </view>
                <text className="SettingsIntegrationsRowDescription">
                  Optional access for existing tasks, shared checkouts, or execution without
                  approvals. The safe defaults are recommended.
                </text>
              </view>
              <Button
                size="xs"
                variant="ghost"
                aria-label="Review advanced permissions"
                aria-expanded={advancedOpen}
                buttonProps={{
                  "accessibility-value": advancedOpen ? "Expanded" : "Collapsed",
                }}
                onClick={() => setAdvancedOpen((current) => !current)}
              >
                <text className="LxButton__text">Review</text>
                <ChevronRightIcon
                  className={disclosureChevronClassName(
                    advancedOpen,
                    "SettingsIntegrationsDisclosureChevron",
                  )}
                  size={14}
                  color="var(--muted-foreground)"
                />
              </Button>
            </view>
            {advancedPresent ? (
              <view
                className={disclosureContentClassName(advancedOpen, "SettingsIntegrationsAdvanced")}
                aria-hidden={!advancedOpen}
              >
                {[
                  {
                    key: "read",
                    title: "Read other project tasks",
                    description:
                      "Without this permission, the agent can read only tasks it creates.",
                    checked: allowProjectRead,
                    onChange: setAllowProjectRead,
                  },
                  {
                    key: "local",
                    title: "Use the shared local checkout",
                    description:
                      "High impact. Tasks may modify the checkout you are actively using instead of an isolated worktree.",
                    checked: allowLocal,
                    onChange: setAllowLocal,
                  },
                  {
                    key: "full",
                    title: "Run without approval prompts",
                    description:
                      "High impact. The external agent may start full-access execution without asking you to approve tool actions.",
                    checked: allowFullAccess,
                    onChange: setAllowFullAccess,
                  },
                ].map((permission) => (
                  <view key={permission.key} className="SettingsIntegrationsPermission">
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
                <text className="SettingsIntegrationsRowTitle">Create connection</text>
              </view>
              <text className="SettingsIntegrationsRowDescription">
                The connection lasts 30 days and can be revoked at any time. The next screen gives
                one prompt to paste into your agent.
              </text>
            </view>
            <Button
              size="sm"
              disabled={!canCreate}
              aria-label="Create coding agent connection"
              onClick={() => void createConnection()}
            >
              {pendingAction === "create" ? "Creating…" : "Create connection"}
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
                  index > 0 ? " SettingsIntegrationsConnection--divided" : ""
                }`}
              >
                <view className="SettingsIntegrationsRowCopy">
                  <text className="SettingsIntegrationsRowTitle">{integration.name}</text>
                  <text className="SettingsIntegrationsRowDescription">
                    {integrationStatus(integration, Date.now())}
                  </text>
                  <text className="SettingsIntegrationsRowDescription">
                    Projects: {describeIntegrationProjects(integration)}
                  </text>
                  <text className="SettingsIntegrationsRowDescription">
                    Permissions: {describeIntegrationPermissions(integration.capabilities)}
                  </text>
                  <text className="SettingsIntegrationsRowDescription">
                    Created {formatIntegrationDate(integration.createdAt)} · Last used{" "}
                    {formatIntegrationDate(integration.lastUsedAt)} · Expires{" "}
                    {formatIntegrationDate(integration.expiresAt)}
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
                      {integration.pairedAt ? "Continue setup" : "Resume pairing"}
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
          <view
            className="SettingsIntegrationsEmpty"
            accessibility-element
            accessibility-label="No connected agents. Connect Codex, Claude, or another local MCP agent to create and follow Synara tasks."
            accessibility-trait="text"
          >
            <text className="SettingsIntegrationsRowTitle">No connected agents</text>
            <text className="SettingsIntegrationsRowDescription">
              Connect Codex, Claude, or another local MCP agent to create and follow Synara tasks.
            </text>
          </view>
        )}
      </SettingsSection>
    </view>
  );
}
