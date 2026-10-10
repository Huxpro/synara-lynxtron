export interface RelayPendingDiagnostic {
  readonly tag: string;
  readonly streaming: boolean;
}

/**
 * A pending relay request is a stream when it buffers chunks (the legacy
 * un-scoped stream) or relays items under a renderer stream id (the scoped
 * streams every subscription uses). Classifying by `chunks` alone reported
 * every scoped subscription as an unfinished unary request.
 */
export function isRelayPendingStream(request: {
  readonly chunks?: unknown;
  readonly onItem?: unknown;
}): boolean {
  return request.chunks !== undefined || request.onItem !== undefined;
}

export interface RelayPendingSummary {
  readonly activeStreamRequests: number;
  readonly activeStreamTags: readonly string[];
  readonly pendingRequests: number;
  readonly pendingRequestTags: readonly string[];
  readonly pendingUnaryRequests: number;
  readonly pendingUnaryTags: readonly string[];
}

export function summarizeRelayPendingRequests(
  requests: Iterable<RelayPendingDiagnostic>,
): RelayPendingSummary {
  const pendingRequestTags: string[] = [];
  const pendingUnaryTags: string[] = [];
  const activeStreamTags: string[] = [];

  for (const request of requests) {
    pendingRequestTags.push(request.tag);
    if (request.streaming) {
      activeStreamTags.push(request.tag);
    } else {
      pendingUnaryTags.push(request.tag);
    }
  }

  return {
    pendingRequests: pendingRequestTags.length,
    pendingRequestTags,
    pendingUnaryRequests: pendingUnaryTags.length,
    pendingUnaryTags,
    activeStreamRequests: activeStreamTags.length,
    activeStreamTags,
  };
}
