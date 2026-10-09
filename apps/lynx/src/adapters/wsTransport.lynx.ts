// FILE: adapters/wsTransport.lynx.ts
// Purpose: Lynx replacement for the Web `wsTransport.ts` (resolved in its place
//   by lynx.config.ts). Same public surface as the upstream `WsTransport`, but
//   instead of running the Effect RPC client in the renderer it talks to the
//   feature socket the Lynxtron host owns (`main/desktop/nativeRpcHost.ts`,
//   `main/web/web-host.ts`) through `NativeModules.bridge`. Everything above it
//   (`wsNativeApi.ts` → `nativeApi` → store → EventRouter) is upstream source.
// Layer: L1 platform port (lynx implementation of the transport)
//
// Threading: this module is reached by shared Web modules on both Lynx threads,
// so nothing at module scope may touch the host bridge. Host access happens in
// `'background only'` functions only; a transport instance created on the main
// thread never opens a stream and rejects requests.

import {
  ORCHESTRATION_WS_CHANNELS,
  ORCHESTRATION_WS_METHODS,
  WS_CHANNELS,
  WS_METHODS,
  type GitActionProgressEvent,
  type GitRunStackedActionResult,
  type ServerConfigStreamEvent,
  type ServerLifecycleStreamEvent,
  type WsBootstrapNegotiateResult,
  type WsCompatibilityError,
  type WsPush,
  type WsPushChannel,
  type WsPushMessage,
} from "@synara/contracts";

import type { WsTransportState } from "@synara-web/wsTransportEvents";
import type { RpcTransportState } from "../data/rpcTransport.logic";
import {
  isNativeTransportError,
  nativeRpcCancelStream,
  nativeRpcOpenStream,
  nativeRpcRequest,
  subscribeNativeRpcStreamItems,
  subscribeNativeTerminalEvents,
  subscribeNativeTransportState,
} from "../data/nativeRpcBridge";

type PushListener<C extends WsPushChannel> = (message: WsPushMessage<C>) => void;

export interface WsRequestOptions {
  readonly timeoutMs?: number | null;
  readonly signal?: AbortSignal;
}

/** Same shape as the upstream error so shared callers can keep their checks. */
export class WsTransportRequestInterruptedError extends Error {
  readonly _tag = "WsTransportRequestInterruptedError";
  readonly code: "WS_REQUEST_TIMEOUT" | "WS_REQUEST_ABORTED";
  readonly method: string;

  constructor(input: {
    readonly message: string;
    readonly code: "WS_REQUEST_TIMEOUT" | "WS_REQUEST_ABORTED";
    readonly method: string;
  }) {
    super(input.message);
    this.name = "WsTransportRequestInterruptedError";
    this.code = input.code;
    this.method = input.method;
  }
}

interface ActiveStream {
  readonly streamId: string;
  /** Resolves with whether the open request reached the host bridge. */
  readonly opened: Promise<boolean>;
  readonly settled: Promise<void>;
  stopped: boolean;
}

const STREAM_RESTART_DELAY_MS = 500;
const STREAM_RESTART_MAX_DELAY_MS = 5_000;

function deferred<T>(): { readonly promise: Promise<T>; readonly resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function isMainThread(): boolean {
  // Rspeedy defines `__MAIN_THREAD__` per bundle; the typeof guard keeps the
  // module usable under Rstest, where the flag may not be injected.
  return typeof __MAIN_THREAD__ === "undefined" ? false : __MAIN_THREAD__;
}

/** Host relay state (`RpcTransportState`) → the Web transport state contract. */
export function mapHostTransportState(
  state: RpcTransportState,
  everConnected: boolean,
): WsTransportState {
  switch (state) {
    case "connected":
      return "open";
    case "connecting":
    case "reconnecting":
      return "connecting";
    case "offline":
      return "closed";
    case "idle":
      return everConnected ? "closed" : "connecting";
  }
}

let nextStreamSequence = 0;

export class WsTransport {
  private readonly listeners = new Map<string, Set<(message: WsPush) => void>>();
  private readonly stateListeners = new Set<(state: WsTransportState) => void>();
  private readonly compatibilityListeners = new Set<(issue: WsCompatibilityError | null) => void>();
  private readonly latestPushByChannel = new Map<string, WsPush>();
  private readonly streams = new Map<string, ActiveStream>();
  private readonly streamItemHandlers = new Map<string, (item: unknown) => void>();
  private readonly streamRestartTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly streamFailures = new Map<string, number>();
  private readonly threadSubscriptions = new Map<string, unknown>();
  private shellSubscribed = false;
  private legacyTerminalEvents: Promise<() => void> | null = null;
  private sequence = 0;
  private state: WsTransportState = "connecting";
  private everConnected = false;
  private disposed = false;
  private hostLinks: Promise<() => void> | null = null;

  // No constructor argument: the upstream class accepts an explicit socket URL,
  // but here the host owns the endpoint (`runtimeWsUrl` init data), and a
  // renderer-chosen URL would let it address a different backend than its host.

  async request<T = unknown>(
    method: string,
    params?: unknown,
    options?: WsRequestOptions,
  ): Promise<T> {
    if (this.disposed) throw new Error("Transport disposed");
    await this.ensureHostLinks();
    if (method === ORCHESTRATION_WS_METHODS.unsubscribeShell) {
      this.shellSubscribed = false;
      await this.stopStream("orchestration.shell");
      return undefined as T;
    }
    if (method === ORCHESTRATION_WS_METHODS.unsubscribeThread) {
      const threadId = (params as { threadId: string }).threadId;
      this.threadSubscriptions.delete(threadId);
      await this.stopStream(`orchestration.thread:${threadId}`);
      return undefined as T;
    }
    if (method === ORCHESTRATION_WS_METHODS.subscribeShell) {
      this.shellSubscribed = true;
      this.startShellStream();
      return undefined as T;
    }
    if (method === ORCHESTRATION_WS_METHODS.subscribeThread) {
      const threadId = (params as { threadId: string }).threadId;
      this.threadSubscriptions.set(threadId, params);
      await this.startThreadStream(threadId, params);
      return undefined as T;
    }
    if (method === WS_METHODS.gitRunStackedAction) {
      return (await this.runGitActionStream(params)) as T;
    }
    const payload =
      method === ORCHESTRATION_WS_METHODS.dispatchCommand
        ? (params as { command: unknown }).command
        : (params ?? {});
    try {
      const result = await nativeRpcRequest<T>(method, payload, {
        timeoutMs: options?.timeoutMs,
      });
      this.noteHostResult();
      return result;
    } catch (error) {
      if (isNativeTransportError(error)) {
        this.setState("closed");
      } else {
        this.noteHostResult();
      }
      throw error;
    }
  }

  subscribe<C extends WsPushChannel>(
    channel: C,
    listener: PushListener<C>,
    options?: { readonly replayLatest?: boolean },
  ): () => void {
    let channelListeners = this.listeners.get(channel);
    if (!channelListeners) {
      channelListeners = new Set<(message: WsPush) => void>();
      this.listeners.set(channel, channelListeners);
      this.startChannelStream(channel);
    }

    const wrappedListener = (message: WsPush) => listener(message as WsPushMessage<C>);
    channelListeners.add(wrappedListener);

    if (options?.replayLatest) {
      const latest = this.latestPushByChannel.get(channel);
      if (latest) wrappedListener(latest);
    }

    return () => {
      channelListeners?.delete(wrappedListener);
      if (channelListeners?.size === 0) {
        this.listeners.delete(channel);
        this.stopChannelStream(channel);
      }
    };
  }

  getLatestPush<C extends WsPushChannel>(channel: C): WsPushMessage<C> | null {
    const latest = this.latestPushByChannel.get(channel);
    return latest ? (latest as WsPushMessage<C>) : null;
  }

  onStateChange(
    listener: (state: WsTransportState) => void,
    options?: { readonly replayCurrent?: boolean },
  ): () => void {
    this.stateListeners.add(listener);
    if (options?.replayCurrent) listener(this.state);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  getState(): WsTransportState {
    return this.state;
  }

  /** The host negotiates compatibility before any renderer request; nothing to expose here. */
  getCompatibility(): WsBootstrapNegotiateResult | null {
    return null;
  }

  onCompatibilityIssue(
    listener: (issue: WsCompatibilityError | null) => void,
    options?: { readonly replayCurrent?: boolean },
  ): () => void {
    this.compatibilityListeners.add(listener);
    if (options?.replayCurrent) listener(null);
    return () => {
      this.compatibilityListeners.delete(listener);
    };
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.setState("disposed");
    for (const timer of this.streamRestartTimers.values()) clearTimeout(timer);
    this.streamRestartTimers.clear();
    const keys = [...this.streams.keys()];
    await Promise.all(keys.map((key) => this.stopStream(key)));
    this.stopChannelStream(WS_CHANNELS.terminalEvent);
    const hostLinks = this.hostLinks;
    this.hostLinks = null;
    if (hostLinks) {
      await hostLinks.then((release) => release()).catch(() => undefined);
    }
  }

  // ── host links ──────────────────────────────────────────────────────────

  private ensureHostLinks(): Promise<() => void> {
    if (!this.hostLinks) {
      this.hostLinks = (async () => {
        const releaseState = await subscribeNativeTransportState((state) => {
          if (state === "connected") this.everConnected = true;
          this.setState(mapHostTransportState(state, this.everConnected));
        });
        const releaseItems = await subscribeNativeRpcStreamItems((streamId, item) => {
          this.streamItemHandlers.get(streamId)?.(item);
        });
        return () => {
          releaseState();
          releaseItems();
        };
      })();
    }
    return this.hostLinks;
  }

  private noteHostResult(): void {
    this.everConnected = true;
    this.setState("open");
  }

  private setState(state: WsTransportState): void {
    if (this.disposed && state !== "disposed") return;
    if (this.state === state) return;
    this.state = state;
    for (const listener of this.stateListeners) {
      try {
        listener(state);
      } catch {
        // Listener errors must not break transport state transitions.
      }
    }
  }

  private emit<C extends WsPushChannel>(channel: C, data: WsPushMessage<C>["data"]): void {
    const message = {
      type: "push" as const,
      sequence: ++this.sequence,
      channel,
      data,
    } as WsPush;
    this.latestPushByChannel.set(channel, message);
    const listeners = this.listeners.get(channel);
    if (!listeners) return;
    for (const listener of listeners) {
      try {
        listener(message);
      } catch {
        // Listener errors must not break transport streams.
      }
    }
  }

  // ── streams ─────────────────────────────────────────────────────────────

  private startChannelStream(channel: WsPushChannel): void {
    if (isMainThread() || this.disposed) return;
    const restart = () => {
      if (this.listeners.has(channel)) this.startChannelStream(channel);
    };
    switch (channel) {
      case WS_CHANNELS.serverWelcome:
      case WS_CHANNELS.serverMaintenanceUpdated:
        this.startStream(
          "server.lifecycle",
          WS_METHODS.subscribeServerLifecycle,
          {},
          (event: ServerLifecycleStreamEvent) => {
            if (event.type === "welcome") {
              this.emit(WS_CHANNELS.serverWelcome, event.payload);
            } else if (event.type === "maintenance") {
              this.emit(WS_CHANNELS.serverMaintenanceUpdated, event);
            }
          },
          () => {
            if (
              this.listeners.has(WS_CHANNELS.serverWelcome) ||
              this.listeners.has(WS_CHANNELS.serverMaintenanceUpdated)
            ) {
              this.startChannelStream(WS_CHANNELS.serverWelcome);
            }
          },
        );
        return;
      case WS_CHANNELS.serverConfigUpdated:
        this.startStream(
          "server.config",
          WS_METHODS.subscribeServerConfig,
          {},
          (event: ServerConfigStreamEvent) => {
            if (event.type === "snapshot") {
              this.emit(WS_CHANNELS.serverConfigUpdated, {
                issues: event.config.issues,
                providers: event.config.providers,
              });
            } else if (event.type === "configUpdated") {
              this.emit(WS_CHANNELS.serverConfigUpdated, event.payload);
            }
          },
          restart,
        );
        return;
      case WS_CHANNELS.serverProviderStatusesUpdated:
        this.startStream(
          "server.providers",
          WS_METHODS.subscribeServerProviderStatuses,
          {},
          (payload) => this.emit(WS_CHANNELS.serverProviderStatusesUpdated, payload as never),
          restart,
        );
        return;
      case WS_CHANNELS.serverSettingsUpdated:
        this.startStream(
          "server.settings",
          WS_METHODS.subscribeServerSettings,
          {},
          (payload) => this.emit(WS_CHANNELS.serverSettingsUpdated, payload as never),
          restart,
        );
        return;
      case WS_CHANNELS.terminalEvent:
        // Transitional: the legacy relay stream already holds the per-socket
        // `terminal.events` lease for the Lynx terminal consumers; a second
        // stream would be rejected as a duplicate. Mirror its broadcast.
        this.legacyTerminalEvents ??= subscribeNativeTerminalEvents((event) =>
          this.emit(WS_CHANNELS.terminalEvent, event as never),
        );
        return;
      case WS_CHANNELS.projectDevServerEvent:
        this.startStream(
          "project.devServers",
          WS_METHODS.subscribeProjectDevServerEvents,
          {},
          (event) => this.emit(WS_CHANNELS.projectDevServerEvent, event as never),
          restart,
        );
        return;
      case WS_CHANNELS.automationEvent:
        this.startStream(
          "automation.events",
          WS_METHODS.subscribeAutomationEvents,
          {},
          (event) => this.emit(WS_CHANNELS.automationEvent, event as never),
          restart,
        );
        return;
      case ORCHESTRATION_WS_CHANNELS.domainEvent:
        this.startStream(
          "orchestration.domain",
          WS_METHODS.subscribeOrchestrationDomainEvents,
          {},
          (event) => this.emit(ORCHESTRATION_WS_CHANNELS.domainEvent, event as never),
          restart,
        );
        return;
      default:
        // gitActionProgress, shellEvent and threadEvent are fed by requests.
        return;
    }
  }

  private stopChannelStream(channel: WsPushChannel): void {
    if (channel === WS_CHANNELS.terminalEvent) {
      const release = this.legacyTerminalEvents;
      this.legacyTerminalEvents = null;
      void release?.then((unsubscribe) => unsubscribe()).catch(() => undefined);
      return;
    }
    const key =
      channel === WS_CHANNELS.serverWelcome || channel === WS_CHANNELS.serverMaintenanceUpdated
        ? this.listeners.has(WS_CHANNELS.serverWelcome) ||
          this.listeners.has(WS_CHANNELS.serverMaintenanceUpdated)
          ? null
          : "server.lifecycle"
        : channel === WS_CHANNELS.serverConfigUpdated
          ? "server.config"
          : channel === WS_CHANNELS.serverProviderStatusesUpdated
            ? "server.providers"
            : channel === WS_CHANNELS.serverSettingsUpdated
              ? "server.settings"
              : channel === WS_CHANNELS.projectDevServerEvent
                ? "project.devServers"
                : channel === WS_CHANNELS.automationEvent
                  ? "automation.events"
                  : channel === ORCHESTRATION_WS_CHANNELS.domainEvent
                    ? "orchestration.domain"
                    : null;
    if (key) void this.stopStream(key);
  }

  private startShellStream(): void {
    this.startStream(
      "orchestration.shell",
      ORCHESTRATION_WS_METHODS.subscribeShell,
      {},
      (event) => this.emit(ORCHESTRATION_WS_CHANNELS.shellEvent, event as never),
      () => {
        if (this.shellSubscribed) this.startShellStream();
      },
    );
  }

  private async startThreadStream(threadId: string, input: unknown): Promise<void> {
    const key = `orchestration.thread:${threadId}`;
    if (this.disposed || this.threadSubscriptions.get(threadId) !== input) return;
    await this.stopStream(key);
    if (this.disposed || this.threadSubscriptions.get(threadId) !== input) return;
    this.startStream(
      key,
      ORCHESTRATION_WS_METHODS.subscribeThread,
      input,
      (event) => this.emit(ORCHESTRATION_WS_CHANNELS.threadEvent, event as never),
      () => {
        const desired = this.threadSubscriptions.get(threadId);
        if (desired !== undefined) void this.startThreadStream(threadId, desired);
      },
    );
  }

  private startStream<T>(
    key: string,
    tag: string,
    payload: unknown,
    listener: (item: T) => void,
    restart: () => void,
  ): void {
    if (isMainThread() || this.disposed || this.streams.has(key)) return;
    this.clearRestartTimer(key);
    const streamId = `${key}#${++nextStreamSequence}`;
    this.streamItemHandlers.set(streamId, (item) => {
      this.streamFailures.delete(key);
      this.noteHostResult();
      listener(item as T);
    });
    const { promise: opened, resolve: resolveOpened } = deferred<boolean>();
    const entry: ActiveStream = {
      streamId,
      opened,
      stopped: false,
      settled: this.ensureHostLinks().then(
        () => {
          // Stopped while the host links were still being set up: never open.
          if (entry.stopped) {
            resolveOpened(false);
            return;
          }
          const pending = nativeRpcOpenStream(streamId, tag, payload);
          resolveOpened(true);
          return pending;
        },
        (error: unknown) => {
          resolveOpened(false);
          throw error;
        },
      ),
    };
    this.streams.set(key, entry);
    void entry.settled
      .then(
        () => true,
        (error: unknown) => {
          if (isNativeTransportError(error)) this.setState("closed");
          return false;
        },
      )
      .then((endedCleanly) => {
        this.streamItemHandlers.delete(streamId);
        if (this.streams.get(key) !== entry) return; // replaced or stopped
        this.streams.delete(key);
        if (this.disposed) return;
        const failures = endedCleanly ? 0 : (this.streamFailures.get(key) ?? 0) + 1;
        this.streamFailures.set(key, failures);
        const delayMs = Math.min(
          STREAM_RESTART_DELAY_MS * 2 ** Math.max(0, failures - 1),
          STREAM_RESTART_MAX_DELAY_MS,
        );
        this.clearRestartTimer(key);
        this.streamRestartTimers.set(
          key,
          setTimeout(() => {
            this.streamRestartTimers.delete(key);
            if (!this.disposed && !this.streams.has(key)) restart();
          }, delayMs),
        );
      });
  }

  private clearRestartTimer(key: string): void {
    const timer = this.streamRestartTimers.get(key);
    if (timer === undefined) return;
    clearTimeout(timer);
    this.streamRestartTimers.delete(key);
  }

  private async stopStream(key: string): Promise<void> {
    this.clearRestartTimer(key);
    this.streamFailures.delete(key);
    const entry = this.streams.get(key);
    if (!entry) return;
    this.streams.delete(key);
    this.streamItemHandlers.delete(entry.streamId);
    entry.stopped = true;
    // Cancel only once the open request is on the bridge, so the host never
    // receives the cancel first and then starts an orphaned stream.
    if (await entry.opened) {
      await nativeRpcCancelStream(entry.streamId).catch(() => false);
    }
    await entry.settled.catch(() => undefined);
  }

  private async runGitActionStream(params: unknown): Promise<GitRunStackedActionResult> {
    let result: GitRunStackedActionResult | null = null;
    const streamId = `git.runStackedAction#${++nextStreamSequence}`;
    this.streamItemHandlers.set(streamId, (item) => {
      const event = item as GitActionProgressEvent;
      this.emit(WS_CHANNELS.gitActionProgress, event);
      if (event.kind === "action_finished") {
        result = (event as Extract<GitActionProgressEvent, { kind: "action_finished" }>).result;
      }
    });
    try {
      await this.ensureHostLinks();
      await nativeRpcOpenStream(streamId, WS_METHODS.gitRunStackedAction, params);
      this.noteHostResult();
    } catch (error) {
      if (isNativeTransportError(error)) this.setState("closed");
      throw error;
    } finally {
      this.streamItemHandlers.delete(streamId);
    }
    if (!result) throw new Error("Git action stream completed without a final result.");
    return result;
  }
}
