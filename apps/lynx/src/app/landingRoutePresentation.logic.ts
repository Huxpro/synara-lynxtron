export interface LandingRouteProject {
  readonly id: string;
  readonly title: string;
}

export interface LandingRoutePresentation {
  readonly headerTitle: 'New Chat' | 'New thread';
  readonly projectName: string | null;
}

export function resolveLandingRoutePresentation(input: {
  readonly initialProjectId?: string | null;
  readonly projects: readonly LandingRouteProject[];
}): LandingRoutePresentation {
  const project = input.initialProjectId
    ? input.projects.find((candidate) => candidate.id === input.initialProjectId)
    : undefined;
  const projectName = project?.title.trim() || null;

  return projectName
    ? { headerTitle: 'New thread', projectName }
    : { headerTitle: 'New Chat', projectName: null };
}
