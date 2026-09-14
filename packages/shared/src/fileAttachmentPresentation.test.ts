import { describe, expect, it } from 'vitest';

import { fileAttachmentTypeLabel } from './fileAttachmentPresentation';

describe('file attachment presentation', () => {
  it('prefers compact filename extensions', () => {
    expect(fileAttachmentTypeLabel({ name: 'archive.tar.gz', mimeType: 'application/gzip' })).toBe('TAR.GZ');
    expect(fileAttachmentTypeLabel({ name: 'notes.md', mimeType: 'text/plain' })).toBe('MD');
  });

  it('maps known MIME types when no extension exists', () => {
    expect(fileAttachmentTypeLabel({ name: 'document', mimeType: 'application/pdf' })).toBe('PDF');
    expect(fileAttachmentTypeLabel({ name: 'proposal', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })).toBe('DOCX');
  });

  it('keeps unknown labels short and predictable', () => {
    expect(fileAttachmentTypeLabel({ name: 'blob', mimeType: 'application/octet-stream' })).toBe('FILE');
    expect(fileAttachmentTypeLabel({ name: 'theme', mimeType: 'application/x-custom' })).toBe('X CUSTOM');
  });
});
