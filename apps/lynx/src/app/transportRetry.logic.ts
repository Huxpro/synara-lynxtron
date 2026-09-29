export interface ActiveQueryRefetcher {
  refetchQueries(filters: { readonly type: "active" }): Promise<unknown>;
}

/**
 * Retry every query currently represented on screen. Transport failures remain
 * reflected by the shared offline notice, so the click handler never leaks an
 * unhandled rejection into the renderer.
 */
export async function retryActiveSynaraQueries(queryClient: ActiveQueryRefetcher): Promise<void> {
  try {
    await queryClient.refetchQueries({ type: "active" });
  } catch {
    // The transport state owns the visible error and allows another retry.
  }
}
