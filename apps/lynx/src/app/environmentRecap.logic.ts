export interface RecapRevisionRow {
  readonly id: string;
  readonly kind: string;
  readonly message?: {
    readonly streaming?: boolean;
    readonly text: string;
  };
}

export function threadRecapRevision(
  rows: readonly RecapRevisionRow[],
  latestTurnState: string | null,
): string {
  const messages = rows.filter(
    (
      row,
    ): row is RecapRevisionRow & { readonly message: NonNullable<RecapRevisionRow["message"]> } =>
      row.kind === "message" && row.message !== undefined,
  );
  const latest = messages[messages.length - 1];
  return [
    messages.length,
    latest?.id ?? "empty",
    latest?.message.text.length ?? 0,
    latest?.message.streaming ? "streaming" : "settled",
    latestTurnState ?? "no-turn",
  ].join(":");
}
