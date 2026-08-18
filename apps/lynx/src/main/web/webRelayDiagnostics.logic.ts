export interface RelayPendingDiagnostic {
  readonly tag: string;
  readonly streaming: boolean;
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
  requests: Iterable<RelayPendingDiagnostic>
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
