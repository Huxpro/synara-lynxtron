export function resolveResponsiveSidebarOpen(input: {
  readonly userOverride: boolean | null;
  readonly viewportWidth: number;
  readonly desktopMinimumWidth: number;
}): boolean {
  return (
    input.userOverride ??
    (input.viewportWidth > 0 &&
      input.viewportWidth >= input.desktopMinimumWidth)
  );
}
