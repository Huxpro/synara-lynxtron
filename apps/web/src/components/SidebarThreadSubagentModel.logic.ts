const SUBAGENT_ACCENT_PALETTE = [
  "#b84e44",
  "#2f7a5d",
  "#345fa8",
  "#a86834",
  "#7352a8",
  "#2f7480",
  "#a84d71",
  "#6a8531",
] as const;

const GENERIC_SUBAGENT_TITLES = new Set([
  "",
  "agent",
  "chat",
  "child thread",
  "conversation",
  "new chat",
  "new conversation",
  "new thread",
  "subagent",
  "thread",
]);

export interface SidebarThreadSubagentModel {
  readonly primaryLabel: string;
  readonly nickname: string | null;
  readonly role: string | null;
  readonly title: string | null;
  readonly fullLabel: string;
  readonly accentColor: string;
}

function normalizeWhitespace(value: string | null | undefined): string | null {
  const normalized = value?.trim().replace(/\s+/g, " ") ?? "";
  return normalized.length > 0 ? normalized : null;
}

function normalizeRole(role: string | null | undefined): string | null {
  const normalized = normalizeWhitespace(role);
  return normalized ? normalized.toLowerCase() : null;
}

function isWorkerTierRole(role: string | null): boolean {
  return role !== null && /^worker-(?:low|medium|high|xhigh)$/i.test(role);
}

function suppressWorkerTierRole(role: string | null): string | null {
  return isWorkerTierRole(role) ? null : role;
}

function isGenericSubagentTitle(title: string | null): boolean {
  if (!title) return true;
  const normalized = title.trim().toLowerCase();
  return GENERIC_SUBAGENT_TITLES.has(normalized) || normalized.startsWith("subagent ");
}

function parseBracketedSubagentLabel(label: string | null): {
  readonly nickname: string | null;
  readonly role: string | null;
} {
  if (!label) return { nickname: null, role: null };
  const match = /^(.*?)\s*\[([^\]]+)\]$/.exec(label.trim());
  return match
    ? {
        nickname: normalizeWhitespace(match[1]),
        role: normalizeRole(match[2]),
      }
    : { nickname: null, role: null };
}

function fallbackSubagentLabel(value: string | null): string | null {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return null;
  if (normalized.startsWith("subagent:")) {
    const segments = normalized.split(":").filter((segment) => segment.length > 0);
    return segments.at(-1) ?? normalized;
  }
  const slashIndex = Math.max(normalized.lastIndexOf("/"), normalized.lastIndexOf("\\"));
  return slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized;
}

function hashLabelSeed(seed: string): number {
  let hash = 0;
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export function sidebarThreadSubagentAccentColor(
  seed: string | null | undefined,
): string {
  const normalized = normalizeWhitespace(seed)?.toLowerCase() ?? "subagent";
  const index = hashLabelSeed(normalized) % SUBAGENT_ACCENT_PALETTE.length;
  return SUBAGENT_ACCENT_PALETTE[index] ?? SUBAGENT_ACCENT_PALETTE[0];
}

export function resolveSidebarThreadSubagentModel(input: {
  readonly nickname?: string | null | undefined;
  readonly role?: string | null | undefined;
  readonly title?: string | null | undefined;
  readonly fallbackId?: string | null | undefined;
}): SidebarThreadSubagentModel {
  const explicitNickname = normalizeWhitespace(input.nickname);
  const explicitRole = suppressWorkerTierRole(normalizeRole(input.role));
  const normalizedTitle = normalizeWhitespace(input.title);
  const parsedTitle = parseBracketedSubagentLabel(normalizedTitle);
  const parsedTitleRole = suppressWorkerTierRole(parsedTitle.role);
  const titleWithoutWorkerRole =
    parsedTitle.role !== null && parsedTitleRole === null
      ? parsedTitle.nickname
      : normalizedTitle;
  const parsedTitleNickname = isGenericSubagentTitle(parsedTitle.nickname)
    ? null
    : parsedTitle.nickname;
  const titleLabel = isGenericSubagentTitle(titleWithoutWorkerRole)
    ? null
    : titleWithoutWorkerRole;
  const nickname = explicitNickname ?? parsedTitleNickname;
  const role = explicitRole ?? parsedTitleRole;
  const resolvedTitle = parsedTitleNickname ? null : titleLabel;
  const fallbackLabel =
    fallbackSubagentLabel(normalizeWhitespace(input.fallbackId)) ?? "Subagent";
  const primaryLabel =
    nickname ??
    resolvedTitle ??
    (role ? role.charAt(0).toUpperCase() + role.slice(1) : null) ??
    fallbackLabel;

  return {
    primaryLabel,
    nickname,
    role,
    title: resolvedTitle,
    fullLabel: role && nickname ? `${nickname} [${role}]` : primaryLabel,
    accentColor: sidebarThreadSubagentAccentColor(nickname ?? primaryLabel),
  };
}
