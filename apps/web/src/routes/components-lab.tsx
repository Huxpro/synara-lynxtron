import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";

import { ComponentsLabPage } from "~/components/ComponentsLabPage";
import { resolveComponentsLabSearch } from "~/components/componentsLabSearch.logic";
import { getLocationHash, getLocationSearch } from "~/platform/env";

interface ComponentsLabSearch {
  readonly embed?: string;
  readonly state?: string;
  readonly story?: string;
  readonly variant?: string;
}

function ComponentsLabRouteView() {
  const search = useSearch({ from: "/components-lab" });
  const resolvedSearch = resolveComponentsLabSearch(search, getLocationSearch(), getLocationHash());
  const navigate = useNavigate();
  return (
    <ComponentsLabPage
      renderer="electron"
      embedded={resolvedSearch.embed === "electron"}
      selectedStoryId={resolvedSearch.story ?? null}
      selectedState={resolvedSearch.state ?? null}
      onSelectStory={(story) =>
        void navigate({
          to: "/components-lab",
          search: { story, state: "default", variant: undefined },
        })
      }
      onSelectState={(state) =>
        void navigate({
          to: "/components-lab",
          search: { story: resolvedSearch.story, state, variant: resolvedSearch.variant },
        })
      }
      selectedVariant={resolvedSearch.variant ?? null}
      onSelectVariant={(variant) =>
        void navigate({
          to: "/components-lab",
          search: { story: resolvedSearch.story, state: resolvedSearch.state, variant },
        })
      }
    />
  );
}

export const Route = createFileRoute("/components-lab")({
  validateSearch: (search: Record<string, unknown>): ComponentsLabSearch => ({
    ...(typeof search.embed === "string" ? { embed: search.embed } : {}),
    ...(typeof search.story === "string" ? { story: search.story } : {}),
    ...(typeof search.state === "string" ? { state: search.state } : {}),
    ...(typeof search.variant === "string" ? { variant: search.variant } : {}),
  }),
  component: ComponentsLabRouteView,
});
