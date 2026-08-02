import { describe, expect, it } from '@rstest/core';

import {
  resolvePickedComposerFiles,
  stageNativeComposerFiles,
  type NativeComposerFileAttachment,
} from './composerAttachments.lynx';

const picked = (overrides: Partial<{
  token: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}> = {}) => ({
  token: '11111111-1111-4111-8111-111111111111',
  name: 'notes.txt',
  mimeType: 'text/plain',
  sizeBytes: 12,
  ...overrides,
});

const nativeFile = (
  token: string,
  name = 'notes.txt'
): NativeComposerFileAttachment => ({
  type: 'file',
  id: `lynx-file-${token}`,
  token,
  name,
  mimeType: 'text/plain',
  sizeBytes: 12,
});

const stagedAttachment = (id: string) => ({
  type: 'file' as const,
  id,
  name: `${id}.txt`,
  mimeType: 'text/plain',
  sizeBytes: 12,
});

describe('native composer picked-file intake', () => {
  it('maps a validated host capability into the shared file-card shape', () => {
    expect(
      resolvePickedComposerFiles({ existingAttachmentCount: 0, files: [picked()] })
    ).toEqual({
      files: [
        {
          type: 'file',
          id: 'lynx-file-11111111-1111-4111-8111-111111111111',
          token: '11111111-1111-4111-8111-111111111111',
          name: 'notes.txt',
          mimeType: 'text/plain',
          sizeBytes: 12,
        },
      ],
      rejectedTokens: [],
      error: null,
    });
  });

  it('rejects oversized and malformed capabilities without losing valid files', () => {
    const result = resolvePickedComposerFiles({
      existingAttachmentCount: 0,
      files: [
        picked(),
        picked({
          token: '22222222-2222-4222-8222-222222222222',
          name: 'large.zip',
          sizeBytes: 25 * 1024 * 1024 + 1,
        }),
        picked({ token: '../not-a-capability', name: 'bad.txt' }),
      ],
    });

    expect(result.files).toHaveLength(1);
    expect(result.rejectedTokens).toEqual([
      '22222222-2222-4222-8222-222222222222',
      '../not-a-capability',
    ]);
    expect(result.error).toBe('One selected file could not be validated.');
  });

  it('enforces the shared eight-reference limit against existing draft items', () => {
    const result = resolvePickedComposerFiles({
      existingAttachmentCount: 8,
      files: [picked()],
    });
    expect(result.files).toEqual([]);
    expect(result.rejectedTokens).toEqual([
      '11111111-1111-4111-8111-111111111111',
    ]);
    expect(result.error).toBe('You can attach up to 8 references per message.');
  });

  it('cancels already staged uploads when a later upload fails', async () => {
    const calls: Array<{ method: string; params: Record<string, unknown> }> = [];
    async function request<T>(
      method: string,
      params: Record<string, unknown>
    ): Promise<T> {
      calls.push({ method, params });
      if (method === 'attachmentsCancel') return { cancelled: true } as T;
      if (params.token === 'second-token') throw new Error('read failed');
      return { attachment: stagedAttachment('managed-first') } as T;
    }

    await expect(
      stageNativeComposerFiles(
        {
          threadId: 'thread-1',
          files: [nativeFile('first-token'), nativeFile('second-token')],
        },
        request
      )
    ).rejects.toThrow('read failed');
    expect(calls).toEqual([
      {
        method: 'attachmentsUploadPickedFile',
        params: { token: 'first-token', threadId: 'thread-1' },
      },
      {
        method: 'attachmentsUploadPickedFile',
        params: { token: 'second-token', threadId: 'thread-1' },
      },
      {
        method: 'attachmentsCancel',
        params: { attachmentId: 'managed-first' },
      },
    ]);
  });

  it('cancels every staged upload once when dispatch fails', async () => {
    const cancelled: string[] = [];
    let upload = 0;
    async function request<T>(
      method: string,
      params: Record<string, unknown>
    ): Promise<T> {
      if (method === 'attachmentsCancel') {
        cancelled.push(String(params.attachmentId));
        return { cancelled: true } as T;
      }
      upload += 1;
      return { attachment: stagedAttachment(`managed-${upload}`) } as T;
    }
    const staged = await stageNativeComposerFiles(
      {
        threadId: 'thread-1',
        files: [nativeFile('first-token'), nativeFile('second-token')],
      },
      request
    );

    await expect(
      staged.runWithDispatch(async () => {
        throw new Error('dispatch failed');
      })
    ).rejects.toThrow('dispatch failed');
    expect(cancelled).toEqual(['managed-1', 'managed-2']);
  });

  it('does not cancel claimed uploads after dispatch succeeds', async () => {
    const cancelled: string[] = [];
    async function request<T>(
      method: string,
      params: Record<string, unknown>
    ): Promise<T> {
      if (method === 'attachmentsCancel') {
        cancelled.push(String(params.attachmentId));
        return { cancelled: true } as T;
      }
      return { attachment: stagedAttachment('managed-success') } as T;
    }
    const staged = await stageNativeComposerFiles(
      { threadId: 'thread-1', files: [nativeFile('first-token')] },
      request
    );

    await expect(staged.runWithDispatch(async () => 'sent')).resolves.toBe('sent');
    expect(cancelled).toEqual([]);
  });
});
