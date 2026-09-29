import { resolveRuntimeSocketUrl } from "../../platform/runtimeEndpoint.logic";

export function extractExternalLinkHost(url: string): string | null {
  const match = url.trim().match(/^https?:\/\/([^/?#]+)/i);
  return match?.[1]?.split("@").pop()?.split(":")[0]?.toLowerCase() ?? null;
}

export function isGitHubExternalLink(url: string): boolean {
  const host = extractExternalLinkHost(url);
  return host === "github.com" || host?.endsWith(".github.com") === true;
}

export function buildSiteFaviconUrl(url: string): string | null {
  const host = extractExternalLinkHost(url);
  if (!host) return null;
  const socketUrl = resolveRuntimeSocketUrl(null, process.env.SYNARA_WS_URL);
  const match = socketUrl.match(/^(ws|wss):\/\/([^/?#]+)(?:[^?#]*)?(?:\?([^#]*))?/i);
  if (!match) return null;
  const protocol = match[1]?.toLowerCase() === "wss" ? "https" : "http";
  const query = new URLSearchParams({ domain: host });
  const socketQuery = new URLSearchParams(match[3] ?? "");
  const token = socketQuery.get("token");
  if (token) query.set("token", token);
  return `${protocol}://${match[2]}/api/site-favicon?${query.toString()}`;
}
