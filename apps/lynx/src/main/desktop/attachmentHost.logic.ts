export interface PickedFileUploadSnapshot {
  readonly mimeType: string;
  readonly name: string;
  readonly sizeBytes: number;
}

export type BinaryAttachmentType = 'image' | 'file';

export function attachmentTypeForMimeType(mimeType: string): BinaryAttachmentType {
  return mimeType.toLowerCase().startsWith('image/') ? 'image' : 'file';
}

export function validatePickedFileForUpload(input: {
  readonly currentIsFile: boolean;
  readonly currentSizeBytes: number;
  readonly file: PickedFileUploadSnapshot;
  readonly maxBytes: number;
  readonly sizeLimitLabel: string;
}): void {
  if (
    !input.currentIsFile ||
    !Number.isSafeInteger(input.currentSizeBytes) ||
    input.currentSizeBytes !== input.file.sizeBytes
  ) {
    throw new Error(
      `'${input.file.name}' changed after it was selected. Pick it again.`
    );
  }
  if (input.currentSizeBytes > input.maxBytes) {
    throw new Error(
      `'${input.file.name}' exceeds the ${input.sizeLimitLabel} attachment limit.`
    );
  }
}

export function resolveImagePreviewSize(input: {
  readonly height: number;
  readonly maxDimension: number;
  readonly width: number;
}): { readonly height: number; readonly width: number } {
  if (
    !Number.isFinite(input.width) ||
    !Number.isFinite(input.height) ||
    input.width <= 0 ||
    input.height <= 0
  ) {
    throw new Error('Unable to decode that image attachment.');
  }
  const scale = Math.min(1, input.maxDimension / Math.max(input.width, input.height));
  return {
    width: Math.max(1, Math.round(input.width * scale)),
    height: Math.max(1, Math.round(input.height * scale)),
  };
}

export function resolveAttachmentUploadPayload(input: {
  readonly ok: boolean;
  readonly payload: unknown;
  readonly status: number;
}): {
  readonly id: string;
  readonly type: BinaryAttachmentType;
  readonly [key: string]: unknown;
} {
  const payload = input.payload as
    | { readonly error?: unknown; readonly id?: unknown; readonly type?: unknown }
    | null;
  if (
    !input.ok ||
    !payload ||
    typeof payload.id !== 'string' ||
    !/^[a-z0-9_-]+$/i.test(payload.id) ||
    (payload.type !== 'image' && payload.type !== 'file')
  ) {
    const message =
      payload && typeof payload.error === 'string'
        ? payload.error
        : `Attachment upload failed with status ${input.status}.`;
    throw new Error(message);
  }
  return payload as {
    readonly id: string;
    readonly type: BinaryAttachmentType;
    readonly [key: string]: unknown;
  };
}
