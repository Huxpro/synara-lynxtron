import 'background-only';

import type { ChatFileAttachment } from '@synara/contracts';
import {
  PROVIDER_SEND_TURN_MAX_ATTACHMENTS,
  PROVIDER_SEND_TURN_MAX_FILE_BYTES,
} from '@synara/contracts/attachmentLimits';

import { bridgeCall } from '../../platform/bridge';
import type { PickedFile } from '../../platform/dialogs';

type AttachmentBridgeCall = <T>(
  method: string,
  params: Record<string, unknown>
) => Promise<T>;

export interface NativeComposerFileAttachment {
  readonly id: string;
  readonly mimeType: string;
  readonly name: string;
  readonly sizeBytes: number;
  readonly token: string;
  readonly type: 'file';
}

export interface PickedComposerFilesResult {
  readonly error: string | null;
  readonly files: ReadonlyArray<NativeComposerFileAttachment>;
  readonly rejectedTokens: ReadonlyArray<string>;
}

function validPickedFile(file: PickedFile): boolean {
  return (
    typeof file.token === 'string' &&
    /^[a-f0-9-]{16,64}$/i.test(file.token) &&
    typeof file.name === 'string' &&
    file.name.trim().length > 0 &&
    file.name.length <= 255 &&
    typeof file.mimeType === 'string' &&
    file.mimeType.length > 0 &&
    file.mimeType.length <= 255 &&
    Number.isSafeInteger(file.sizeBytes) &&
    file.sizeBytes >= 0
  );
}

export function resolvePickedComposerFiles(input: {
  readonly existingAttachmentCount: number;
  readonly files: ReadonlyArray<PickedFile>;
}): PickedComposerFilesResult {
  const files: NativeComposerFileAttachment[] = [];
  const rejectedTokens: string[] = [];
  const seenTokens = new Set<string>();
  let error: string | null = null;
  let attachmentCount = Math.max(0, input.existingAttachmentCount);

  for (const file of input.files) {
    if (!validPickedFile(file) || seenTokens.has(file.token)) {
      if (typeof file.token === 'string') rejectedTokens.push(file.token);
      error = 'One selected file could not be validated.';
      continue;
    }
    seenTokens.add(file.token);
    if (file.sizeBytes > PROVIDER_SEND_TURN_MAX_FILE_BYTES) {
      rejectedTokens.push(file.token);
      error = `'${file.name}' exceeds the 25MB attachment limit.`;
      continue;
    }
    if (attachmentCount >= PROVIDER_SEND_TURN_MAX_ATTACHMENTS) {
      rejectedTokens.push(file.token);
      error = `You can attach up to ${PROVIDER_SEND_TURN_MAX_ATTACHMENTS} references per message.`;
      continue;
    }
    files.push({
      type: 'file',
      id: `lynx-file-${file.token}`,
      token: file.token,
      name: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    });
    attachmentCount += 1;
  }

  return { files, rejectedTokens, error };
}

export async function releasePickedComposerFile(token: string): Promise<void> {
  try {
    await bridgeCall('attachmentsReleasePickedFile', { token });
  } catch {
    // The host capability expires on its own; removal must stay best-effort.
  }
}

async function cancelManagedAttachments(
  attachmentIds: ReadonlyArray<string>,
  request: AttachmentBridgeCall
): Promise<void> {
  for (const attachmentId of attachmentIds) {
    try {
      await request('attachmentsCancel', { attachmentId });
    } catch {
      // The server also expires staged uploads; keep the original send error.
    }
  }
}

export interface StagedNativeComposerFiles {
  readonly attachments: ReadonlyArray<ChatFileAttachment>;
  readonly runWithDispatch: <A>(
    dispatch: (attachments: ReadonlyArray<ChatFileAttachment>) => Promise<A>
  ) => Promise<A>;
}

export async function stageNativeComposerFiles(input: {
  readonly files: ReadonlyArray<NativeComposerFileAttachment>;
  readonly threadId: string;
}, request: AttachmentBridgeCall = bridgeCall): Promise<StagedNativeComposerFiles> {
  const attachments: ChatFileAttachment[] = [];
  try {
    for (const file of input.files) {
      const result = await request<{ attachment: ChatFileAttachment }>(
        'attachmentsUploadPickedFile',
        { token: file.token, threadId: input.threadId }
      );
      attachments.push(result.attachment);
    }
  } catch (error) {
    await cancelManagedAttachments(
      attachments.map((attachment) => attachment.id),
      request
    );
    throw error;
  }

  let pending = true;
  return {
    attachments,
    runWithDispatch: async (dispatch) => {
      try {
        const result = await dispatch(attachments);
        pending = false;
        return result;
      } catch (error) {
        if (pending) {
          pending = false;
          await cancelManagedAttachments(
            attachments.map((attachment) => attachment.id),
            request
          );
        }
        throw error;
      }
    },
  };
}
