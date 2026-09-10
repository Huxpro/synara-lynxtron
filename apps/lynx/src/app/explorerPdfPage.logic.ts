export function clampExplorerPdfPage(input: {
  readonly currentPage: number;
  readonly pageCount: number;
  readonly value: string;
}): number {
  const parsed = Number.parseInt(input.value, 10);
  if (!Number.isFinite(parsed)) return input.currentPage;
  return Math.min(Math.max(parsed, 1), Math.max(input.pageCount, 1));
}
