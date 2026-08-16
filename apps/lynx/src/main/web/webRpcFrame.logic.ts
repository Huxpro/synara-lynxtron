export interface WebRpcExitFrame {
  readonly _tag: 'Exit';
  readonly requestId: string;
  readonly exit:
    | { readonly _tag: 'Success'; readonly value: unknown }
    | { readonly _tag: 'Failure'; readonly cause?: unknown };
}

export interface WebRpcChunkFrame {
  readonly _tag: 'Chunk';
  readonly requestId: string;
  readonly values: readonly unknown[];
}

export interface WebRpcDefectFrame {
  readonly _tag: 'Defect';
  readonly defect?: unknown;
}

export type WebRpcResponseFrame =
  | WebRpcExitFrame
  | WebRpcChunkFrame
  | WebRpcDefectFrame;

export function parseWebRpcResponse(data: unknown): WebRpcResponseFrame | null {
  try {
    const parsed = JSON.parse(String(data)) as WebRpcResponseFrame;
    return parsed?._tag === 'Exit' ||
      parsed?._tag === 'Chunk' ||
      parsed?._tag === 'Defect'
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function describeWebRpcDefect(frame: WebRpcDefectFrame): string {
  const defect = frame.defect;
  if (defect && typeof defect === 'object') {
    const record = defect as Record<string, unknown>;
    const name = typeof record.name === 'string' ? record.name.trim() : '';
    const message =
      typeof record.message === 'string' ? record.message.trim() : '';
    if (name && message) return `${name}: ${message}`;
    if (message) return message;
    if (name) return name;
  }
  return JSON.stringify(defect);
}
