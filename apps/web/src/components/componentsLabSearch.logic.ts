export interface ComponentsLabSearchState {
  readonly embed?: string | undefined;
  readonly state?: string | undefined;
  readonly story?: string | undefined;
  readonly variant?: string | undefined;
}

export function resolveComponentsLabSearch(
  routerSearch: ComponentsLabSearchState,
  outerSearch: string,
  locationHash = "",
): ComponentsLabSearchState {
  const outer = new URLSearchParams(outerSearch);
  const hashQueryIndex = locationHash.indexOf("?");
  const hashSearch = new URLSearchParams(
    hashQueryIndex >= 0 ? locationHash.slice(hashQueryIndex + 1) : "",
  );
  return {
    embed: hashSearch.get("embed") ?? routerSearch.embed ?? outer.get("embed") ?? undefined,
    story: hashSearch.get("story") ?? routerSearch.story ?? outer.get("story") ?? undefined,
    state: hashSearch.get("state") ?? routerSearch.state ?? outer.get("state") ?? undefined,
    variant: hashSearch.get("variant") ?? routerSearch.variant ?? outer.get("variant") ?? undefined,
  };
}
