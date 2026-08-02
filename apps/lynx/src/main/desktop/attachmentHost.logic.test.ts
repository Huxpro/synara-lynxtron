import { describe, expect, it } from '@rstest/core';

import {
  resolveAttachmentUploadPayload,
  validatePickedFileForUpload,
} from './attachmentHost.logic';

const file = {
  name: 'notes.txt',
  mimeType: 'text/plain',
  sizeBytes: 12,
};

describe('desktop attachment host validation', () => {
  it('accepts an unchanged regular file', () => {
    expect(() =>
      validatePickedFileForUpload({
        file,
        currentIsFile: true,
        currentSizeBytes: 12,
      })
    ).not.toThrow();
  });

  it('rejects a changed or replaced selected file before reading bytes', () => {
    expect(() =>
      validatePickedFileForUpload({
        file,
        currentIsFile: true,
        currentSizeBytes: 13,
      })
    ).toThrow("'notes.txt' changed after it was selected. Pick it again.");
    expect(() =>
      validatePickedFileForUpload({
        file,
        currentIsFile: false,
        currentSizeBytes: 12,
      })
    ).toThrow("'notes.txt' changed after it was selected. Pick it again.");
  });

  it('accepts only a successful file attachment payload', () => {
    expect(
      resolveAttachmentUploadPayload({
        ok: true,
        status: 201,
        payload: { id: 'att_v2_valid', type: 'file', sizeBytes: 12 },
      })
    ).toEqual({ id: 'att_v2_valid', type: 'file', sizeBytes: 12 });
  });

  it('preserves server errors and rejects malformed success payloads', () => {
    expect(() =>
      resolveAttachmentUploadPayload({
        ok: false,
        status: 413,
        payload: { error: 'Attachment is too large.' },
      })
    ).toThrow('Attachment is too large.');
    expect(() =>
      resolveAttachmentUploadPayload({
        ok: true,
        status: 201,
        payload: { id: '../bad', type: 'file' },
      })
    ).toThrow('Attachment upload failed with status 201.');
  });
});
