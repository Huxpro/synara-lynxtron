import type { ExternalMcpCapability, ExternalMcpIntegration } from "@synara/contracts";

export const CORE_EXTERNAL_MCP_CAPABILITIES: readonly ExternalMcpCapability[] = [
  "projects:read",
  "tasks:create",
  "tasks:wait",
  "tasks:read",
];

export function buildExternalMcpCapabilities(input: {
  readonly allowProjectRead: boolean;
  readonly allowLocal: boolean;
  readonly allowFullAccess: boolean;
}): readonly ExternalMcpCapability[] {
  const capabilities = [...CORE_EXTERNAL_MCP_CAPABILITIES];
  if (input.allowProjectRead) capabilities.push("tasks:read-project");
  if (input.allowLocal) capabilities.push("runtime:local");
  if (input.allowFullAccess) capabilities.push("runtime:full-access");
  return capabilities;
}

export function integrationStatus(integration: ExternalMcpIntegration, nowMs: number): string {
  if (integration.revokedAt) return "Revoked";
  if (Date.parse(integration.expiresAt) <= nowMs) return "Expired";
  if (integration.lastUsedAt) return "Connected";
  if (integration.pairedAt) return "Paired — not used yet";
  return "Waiting for pairing";
}

export function integrationIsActive(integration: ExternalMcpIntegration, nowMs: number): boolean {
  return !integration.revokedAt && Date.parse(integration.expiresAt) > nowMs;
}

export function formatIntegrationDate(value: string | null): string {
  if (!value) return "Never";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value;
  const date = new Date(timestamp);
  const hours = date.getHours();
  const displayHours = hours % 12 || 12;
  const period = hours < 12 ? "AM" : "PM";
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}, ${displayHours}:${`${date.getMinutes()}`.padStart(
    2,
    "0",
  )}:${`${date.getSeconds()}`.padStart(2, "0")} ${period}`;
}

export function describeIntegrationProjects(
  integration: Pick<ExternalMcpIntegration, "projectScope" | "allowedProjects">,
): string {
  if (integration.projectScope === "all") {
    return "All projects, including future ones";
  }
  const titles = integration.allowedProjects.map((project) => project.title);
  return titles.length > 0 ? titles.join(", ") : "No projects";
}

export function describeIntegrationPermissions(
  capabilities: readonly ExternalMcpCapability[],
): string {
  const descriptions = ["Create and follow its own tasks"];
  if (capabilities.includes("tasks:read-project")) {
    descriptions.push("Read other tasks in selected projects");
  }
  if (capabilities.includes("runtime:local")) {
    descriptions.push("Use the shared local checkout");
  }
  if (capabilities.includes("runtime:full-access")) {
    descriptions.push("Run without approval prompts");
  }
  return descriptions.join(" · ");
}
