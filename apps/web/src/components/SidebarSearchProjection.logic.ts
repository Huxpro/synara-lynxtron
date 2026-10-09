import type { ProviderKind } from "@synara/contracts";
import { projectBoundedSidebarSearchMessages } from "@synara/shared/sidebarSearch";

import { basenameOfPath } from "../file-icons";
import type { SidebarSearchProject, SidebarSearchThread } from "./SidebarSearchPalette.logic";

export interface SidebarSearchProjectSource {
  readonly id: string;
  readonly name: string;
  readonly remoteName?: string | null | undefined;
  readonly folderName?: string | null | undefined;
  readonly localName?: string | null | undefined;
  readonly cwd: string;
  readonly spaceName: string;
  readonly createdAt?: string | undefined;
  readonly updatedAt?: string | undefined;
}

export interface SidebarSearchThreadSource {
  readonly id: string;
  readonly title: string;
  readonly projectId: string;
  readonly provider: ProviderKind;
  readonly createdAt: string;
  readonly updatedAt?: string | undefined;
  readonly messages?: readonly { readonly text: string }[] | undefined;
}

export function projectSidebarSearchProject(
  source: SidebarSearchProjectSource,
): SidebarSearchProject {
  return {
    id: source.id,
    name: source.name,
    remoteName: source.remoteName ?? source.name,
    folderName: source.folderName ?? basenameOfPath(source.cwd) ?? source.name,
    localName: source.localName ?? null,
    cwd: source.cwd,
    spaceName: source.spaceName,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

export function projectSidebarSearchThreads(input: {
  readonly threads: readonly SidebarSearchThreadSource[];
  readonly projects: readonly SidebarSearchProject[];
  readonly visibleThreadIds?: readonly string[] | undefined;
  readonly unknownProjectLabel?: string | undefined;
  readonly fallbackSpaceName?: string | undefined;
}): SidebarSearchThread[] {
  const threadById = new Map(input.threads.map((thread) => [thread.id, thread] as const));
  const projectById = new Map(input.projects.map((project) => [project.id, project] as const));
  const orderedThreads = input.visibleThreadIds
    ? input.visibleThreadIds.flatMap((threadId) => {
        const thread = threadById.get(threadId);
        return thread ? [thread] : [];
      })
    : input.threads;
  const unknownProjectLabel = input.unknownProjectLabel ?? "Unknown project";
  const fallbackSpaceName = input.fallbackSpaceName ?? "Global";
  const boundedMessagesByThreadId = projectBoundedSidebarSearchMessages(orderedThreads);

  return orderedThreads.map((thread) => {
    const project = projectById.get(thread.projectId);
    return {
      id: thread.id,
      title: thread.title,
      projectId: thread.projectId,
      projectName: project?.name ?? unknownProjectLabel,
      projectRemoteName: project?.remoteName ?? unknownProjectLabel,
      spaceName: project?.spaceName ?? fallbackSpaceName,
      provider: thread.provider,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      messages: boundedMessagesByThreadId.get(thread.id) ?? [],
    };
  });
}
