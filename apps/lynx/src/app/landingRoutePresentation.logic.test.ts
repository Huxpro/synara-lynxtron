import { describe, expect, it } from '@rstest/core';

import { resolveLandingRoutePresentation } from './landingRoutePresentation.logic';

const projects = [
  { id: 'project-synara', title: 'Synara Fidelity' },
  { id: 'project-blank', title: '   ' },
];

describe('resolveLandingRoutePresentation', () => {
  it('presents a project-scoped route as a new thread', () => {
    expect(
      resolveLandingRoutePresentation({
        initialProjectId: 'project-synara',
        projects,
      })
    ).toEqual({
      headerTitle: 'New thread',
      projectName: 'Synara Fidelity',
    });
  });

  it('keeps generic chat presentation without a project route', () => {
    expect(resolveLandingRoutePresentation({ projects })).toEqual({
      headerTitle: 'New Chat',
      projectName: null,
    });
  });

  it('falls back safely for stale or blank project identities', () => {
    expect(
      resolveLandingRoutePresentation({
        initialProjectId: 'missing-project',
        projects,
      })
    ).toEqual({
      headerTitle: 'New Chat',
      projectName: null,
    });
    expect(
      resolveLandingRoutePresentation({
        initialProjectId: 'project-blank',
        projects,
      })
    ).toEqual({
      headerTitle: 'New Chat',
      projectName: null,
    });
  });
});
