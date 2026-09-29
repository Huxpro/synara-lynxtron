import { isGenericChatThreadTitle } from "./chatThreads";

export type ThreadHeaderIconKind = "none" | "provider" | "terminal";

export function resolveThreadHeaderIconKind(
  entryPoint: "chat" | "terminal",
  title?: string,
): ThreadHeaderIconKind {
  if (entryPoint === "chat" && isGenericChatThreadTitle(title)) return "none";
  return entryPoint === "terminal" ? "terminal" : "provider";
}
