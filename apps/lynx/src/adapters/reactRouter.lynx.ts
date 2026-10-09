// FILE: adapters/reactRouter.lynx.ts
// Purpose: Lynx replacement for `@tanstack/react-router` (resolved in its place
//   by lynx.config.ts). The router's component layer crashes on ReactLynx
//   (P2-V1), so Lynx routes with a bare memory history (`app/router.tsx`). The
//   upstream state layer still asks the router where the app is, through a few
//   hooks; they are served here from that same history.
// Layer: L1 platform adapter (lynx implementation)
// Exports: useRouter, useRouterState, useParams, useSearch, useNavigate — the
//   subset the generated `EventRouter`, `hooks/useDiffRouteSearch` and
//   `hooks/useCommittedPathname` use. Anything else
//   imported from the package is undefined on Lynx by design.
//
// Thread-neutral at module scope. Until `bindLynxRouterHistory` runs (a
// background effect), every hook reports the root location.

import { useSyncExternalStore } from "@lynx-js/react";

/** The part of the `@tanstack/history` memory history this adapter needs. */
export interface LynxRouterHistory {
  readonly location: { readonly href: string };
  readonly subscribe: (listener: () => void) => () => void;
  readonly push: (to: string) => void;
  readonly replace: (to: string) => void;
}

export interface LynxRouterLocation {
  readonly href: string;
  readonly pathname: string;
  readonly search: Readonly<Record<string, unknown>>;
}

export interface LynxRouterState {
  readonly location: LynxRouterLocation;
  /**
   * Always false: the memory history publishes a navigation in one update, so
   * pathname and params never disagree (what `useCommittedPathname` guards).
   */
  readonly isLoading: false;
}

export interface LynxNavigateOptions {
  readonly to: string;
  readonly params?: Readonly<Record<string, string>> | undefined;
  readonly replace?: boolean | undefined;
}

const ROOT_HREF = "/";
const THREAD_ROUTE_PATTERN = /^\/thread\/([^/]+)$/;

let boundHistory: LynxRouterHistory | null = null;
const listeners = new Set<() => void>();

/**
 * Connects the hooks to the app's memory history. Returns the disconnect; the
 * hooks fall back to the root location afterwards.
 */
export function bindLynxRouterHistory(history: LynxRouterHistory): () => void {
  boundHistory = history;
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const unsubscribe = history.subscribe(notify);
  notify();
  return () => {
    unsubscribe();
    if (boundHistory !== history) return;
    boundHistory = null;
    notify();
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readHref(): string {
  return boundHistory?.location.href ?? ROOT_HREF;
}

function decodeSearchComponent(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

interface ResolvedLocation {
  readonly state: LynxRouterState;
  readonly params: Readonly<Record<string, string>>;
}

function resolveLocation(href: string): ResolvedLocation {
  const queryIndex = href.indexOf("?");
  const pathname = queryIndex < 0 ? href : href.slice(0, queryIndex);
  const search: Record<string, unknown> = {};
  if (queryIndex >= 0) {
    for (const pair of href.slice(queryIndex + 1).split("&")) {
      if (!pair) continue;
      const separator = pair.indexOf("=");
      const key = decodeSearchComponent(separator < 0 ? pair : pair.slice(0, separator));
      search[key] = separator < 0 ? "" : decodeSearchComponent(pair.slice(separator + 1));
    }
  }
  // Lynx routes a thread at `/thread/<id>` (upstream: `/$threadId`); the id is
  // not percent-decoded, matching `parseRoute` in app/router.tsx.
  const threadMatch = THREAD_ROUTE_PATTERN.exec(pathname);
  return {
    state: { location: { href, pathname, search }, isLoading: false },
    params: threadMatch ? { threadId: threadMatch[1]! } : {},
  };
}

// One entry: every hook instance reads the same href in a render pass, and
// selectors that compare by identity must see the same objects for it.
let lastResolved: { readonly href: string; readonly value: ResolvedLocation } | null = null;

function useResolvedLocation(): ResolvedLocation {
  const href = useSyncExternalStore(subscribe, readHref, readHref);
  if (lastResolved?.href !== href) lastResolved = { href, value: resolveLocation(href) };
  return lastResolved.value;
}

/** Identity only: upstream keys per-router caches on the router object. */
export interface LynxRouter {
  readonly navigate: (options: LynxNavigateOptions) => Promise<void>;
}

const lynxRouter: LynxRouter = { navigate: (options) => navigate(options) };

/** One router for the app's one history; stable across renders. */
export function useRouter(): LynxRouter {
  return lynxRouter;
}

export function useRouterState<T = LynxRouterState>(options?: {
  readonly select?: (state: LynxRouterState) => T;
}): T {
  const { state } = useResolvedLocation();
  return options?.select ? options.select(state) : (state as T);
}

export function useParams<T = Readonly<Record<string, string>>>(options?: {
  readonly strict?: boolean;
  readonly select?: (params: Readonly<Record<string, string>>) => T;
}): T {
  const { params } = useResolvedLocation();
  return options?.select ? options.select(params) : (params as T);
}

export function useSearch<T = Readonly<Record<string, unknown>>>(options?: {
  readonly strict?: boolean;
  readonly select?: (search: Record<string, unknown>) => T;
}): T {
  const { state } = useResolvedLocation();
  return options?.select
    ? options.select(state.location.search as Record<string, unknown>)
    : (state.location.search as T);
}

/** Upstream route template → Lynx memory-history path. */
export function resolveLynxNavigationPath(options: LynxNavigateOptions): string {
  const params = options.params ?? {};
  const template = options.to === "/$threadId" ? "/thread/$threadId" : options.to;
  return template.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_match, name: string) => {
    const value = params[name];
    if (value === undefined) {
      throw new Error(`Missing route param "${name}" for "${options.to}"`);
    }
    return value;
  });
}

async function navigate(options: LynxNavigateOptions): Promise<void> {
  const history = boundHistory;
  if (!history) return;
  const path = resolveLynxNavigationPath(options);
  if (options.replace) history.replace(path);
  else history.push(path);
}

/** Stable across renders, like the router's own `navigate`. */
export function useNavigate(): (options: LynxNavigateOptions) => Promise<void> {
  return navigate;
}
