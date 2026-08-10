import { describe, expect, it } from '@rstest/core';

import {
  attachmentTypeForMimeType,
  resolveAttachmentUploadPayload,
  resolveImagePreviewSize,
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
        maxBytes: 25,
        sizeLimitLabel: '25MB',
      })
    ).not.toThrow();
  });

  it('rejects a changed or replaced selected file before reading bytes', () => {
    expect(() =>
      validatePickedFileForUpload({
        file,
        currentIsFile: true,
        currentSizeBytes: 13,
        maxBytes: 25,
        sizeLimitLabel: '25MB',
      })
    ).toThrow("'notes.txt' changed after it was selected. Pick it again.");
    expect(() =>
      validatePickedFileForUpload({
        file,
        currentIsFile: false,
        currentSizeBytes: 12,
        maxBytes: 25,
        sizeLimitLabel: '25MB',
      })
    ).toThrow("'notes.txt' changed after it was selected. Pick it again.");
  });

  it('enforces the attachment-specific size limit after validating identity', () => {
    expect(() =>
      validatePickedFileForUpload({
        file,
        currentIsFile: true,
        currentSizeBytes: 12,
        maxBytes: 10,
        sizeLimitLabel: '10MB',
      })
    ).toThrow("'notes.txt' exceeds the 10MB attachment limit.");
  });

  it('classifies image mime types without changing ordinary files', () => {
    expect(attachmentTypeForMimeType('image/PNG')).toBe('image');
    expect(attachmentTypeForMimeType('text/plain')).toBe('file');
  });

  it('bounds image previews without upscaling small images', () => {
    expect(resolveImagePreviewSize({ width: 1_024, height: 512, maxDimension: 512 })).toEqual({
      width: 512,
      height: 256,
    });
    expect(resolveImagePreviewSize({ width: 120, height: 80, maxDimension: 512 })).toEqual({
      width: 120,
      height: 80,
    });
    expect(() =>
      resolveImagePreviewSize({ width: 0, height: 80, maxDimension: 512 })
    ).toThrow('Unable to decode that image attachment.');
  });

  it('accepts successful image and file attachment payloads', () => {
    expect(
      resolveAttachmentUploadPayload({
        ok: true,
        status: 201,
        payload: { id: 'att_v2_valid', type: 'file', sizeBytes: 12 },
      })
    ).toEqual({ id: 'att_v2_valid', type: 'file', sizeBytes: 12 });
    expect(
      resolveAttachmentUploadPayload({
        ok: true,
        status: 201,
        payload: { id: 'att_v2_image', type: 'image', sizeBytes: 12 },
      })
    ).toEqual({ id: 'att_v2_image', type: 'image', sizeBytes: 12 });
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
