export interface PickedFileUploadSnapshot {
  readonly mimeType: string;
  readonly name: string;
  readonly sizeBytes: number;
}

export function validatePickedFileForUpload(input: {
  readonly currentIsFile: boolean;
  readonly currentSizeBytes: number;
  readonly file: PickedFileUploadSnapshot;
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
}

export function resolveAttachmentUploadPayload(input: {
  readonly ok: boolean;
  readonly payload: unknown;
  readonly status: number;
}): {
  readonly id: string;
  readonly type: 'file';
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
    payload.type !== 'file'
  ) {
    const message =
      payload && typeof payload.error === 'string'
        ? payload.error
        : `Attachment upload failed with status ${input.status}.`;
    throw new Error(message);
  }
  return payload as {
    readonly id: string;
    readonly type: 'file';
    readonly [key: string]: unknown;
  };
}
