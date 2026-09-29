// FILE: ComposerThreadMentionItems.ts
// Purpose: Build stable, disambiguated thread mention menu items from snapshot data.

import type { ProjectKind, ProviderKind } from "@synara/contracts";
import { threadMentionPathForThreadId } from "@synara/shared/threadMentions";

import {
  normalizeProviderDiscoveryText,
  rankProviderDiscoveryItems,
} from "~/lib/providerDiscovery";
import type { ComposerCommandItem } from "./ComposerCommandMenuComposition";

const THREAD_MENTION_SUGGESTION_LIMIT = 20;

export interface ComposerThreadMentionItemSource {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly provider: ProviderKind;
  readonly createdAt: string;
  readonly archivedAt?: string | null;
  readonly lastVisitedAt?: string;
  readonly latestUserMessageAt: string | null;
}

export interface ComposerThreadMentionProjectSource {
  readonly id: string;
  readonly kind: ProjectKind;
  readonly name: string;
  readonly folderName?: string;
}

interface ThreadMentionCandidate {
  readonly thread: ComposerThreadMentionItemSource;
  readonly title: string;
  readonly projectName: string;
  readonly mentionName: string;
}

function threadSuggestionTitle(title: string): string {
  return title.trim() || "Untitled thread";
}

function threadSuggestionContainerName(
  project: ComposerThreadMentionProjectSource | undefined,
): string {
  if (!project) return "Unknown project";
  if (project.kind === "chat") return "Chats";
  if (project.kind === "studio") return "Studio";
  return project.name.trim() || project.folderName?.trim() || "Untitled project";
}

function threadSuggestionRecency(thread: ComposerThreadMentionItemSource): string {
  return thread.latestUserMessageAt ?? thread.lastVisitedAt ?? thread.createdAt;
}

function mentionNameKey(value: string): string {
  return value.trim().toLowerCase();
}

function makeUniqueMentionName(input: {
  readonly preferredName: string;
  readonly threadId: string;
  readonly reservedNames: ReadonlySet<string>;
  readonly usedNames: ReadonlySet<string>;
}): string {
  let attempt = 0;
  while (true) {
    const suffix =
      attempt === 0
        ? input.threadId.slice(-6) || input.threadId
        : attempt === 1
          ? input.threadId
          : `${input.threadId}:${attempt}`;
    const candidate = `${input.preferredName} (${suffix})`;
    const key = mentionNameKey(candidate);
    if (!input.reservedNames.has(key) && !input.usedNames.has(key)) {
      return candidate;
    }
    attempt += 1;
  }
}

function withDisambiguatedMentionNames(
  candidates: ReadonlyArray<Omit<ThreadMentionCandidate, "mentionName">>,
): ThreadMentionCandidate[] {
  const titleCounts = new Map<string, number>();
  const qualifiedCounts = new Map<string, number>();
  for (const candidate of candidates) {
    titleCounts.set(candidate.title, (titleCounts.get(candidate.title) ?? 0) + 1);
  }
  for (const candidate of candidates) {
    if ((titleCounts.get(candidate.title) ?? 0) > 1) {
      const qualified = `${candidate.title} (${candidate.projectName})`;
      qualifiedCounts.set(qualified, (qualifiedCounts.get(qualified) ?? 0) + 1);
    }
  }
  const preferredCandidates = candidates.map((candidate) => {
    const qualified = `${candidate.title} (${candidate.projectName})`;
    const preferredName =
      (titleCounts.get(candidate.title) ?? 0) <= 1
        ? candidate.title
        : (qualifiedCounts.get(qualified) ?? 0) > 1
          ? `${candidate.title} (${candidate.projectName}, ${candidate.thread.id.slice(-6)})`
          : qualified;
    return {
      thread: candidate.thread,
      title: candidate.title,
      projectName: candidate.projectName,
      preferredName,
    };
  });
  const preferredNameCounts = new Map<string, number>();
  for (const candidate of preferredCandidates) {
    const key = mentionNameKey(candidate.preferredName);
    preferredNameCounts.set(key, (preferredNameCounts.get(key) ?? 0) + 1);
  }
  const reservedNames = new Set(preferredNameCounts.keys());
  const usedNames = new Set<string>();

  return preferredCandidates.map((candidate) => {
    const preferredKey = mentionNameKey(candidate.preferredName);
    const mentionName =
      (preferredNameCounts.get(preferredKey) ?? 0) === 1 && !usedNames.has(preferredKey)
        ? candidate.preferredName
        : makeUniqueMentionName({
            preferredName: candidate.preferredName,
            threadId: candidate.thread.id,
            reservedNames,
            usedNames,
          });
    usedNames.add(mentionNameKey(mentionName));
    return {
      thread: candidate.thread,
      title: candidate.title,
      projectName: candidate.projectName,
      mentionName,
    };
  });
}

export function buildThreadMentionComposerItems(input: {
  readonly threads: readonly ComposerThreadMentionItemSource[];
  readonly projects: readonly ComposerThreadMentionProjectSource[];
  readonly currentThreadId: string | null;
  readonly query: string;
}): ComposerCommandItem[] {
  const projectById = new Map(input.projects.map((project) => [project.id, project]));
  const candidates = withDisambiguatedMentionNames(
    input.threads
      .filter(
        (thread) => thread.id !== input.currentThreadId && (thread.archivedAt ?? null) === null,
      )
      .map((thread) => ({
        thread,
        title: threadSuggestionTitle(thread.title),
        projectName: threadSuggestionContainerName(projectById.get(thread.projectId)),
      })),
  );
  const query = normalizeProviderDiscoveryText(input.query);
  const ranked = (
    query
      ? rankProviderDiscoveryItems(candidates, query, ({ title }) => [{ value: title }])
      : candidates.toSorted((left, right) =>
          threadSuggestionRecency(right.thread).localeCompare(threadSuggestionRecency(left.thread)),
        )
  ).slice(0, THREAD_MENTION_SUGGESTION_LIMIT);

  return ranked.map(({ thread, title, projectName, mentionName }) => ({
    id: `thread:${thread.id}`,
    type: "thread" as const,
    threadId: thread.id,
    provider: thread.provider,
    mention: { name: mentionName, path: threadMentionPathForThreadId(thread.id) },
    label: title,
    description: projectName,
  }));
}
