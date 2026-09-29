import { describe, expect, it } from "@rstest/core";

import {
  resolvePickedComposerFiles,
  stageNativeComposerFiles,
  type NativeComposerFileAttachment,
  type NativeComposerImageAttachment,
} from "./composerAttachments.lynx";

const picked = (
  overrides: Partial<{
    token: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
  }> = {},
) => ({
  token: "11111111-1111-4111-8111-111111111111",
  name: "notes.txt",
  mimeType: "text/plain",
  sizeBytes: 12,
  ...overrides,
});

const nativeFile = (token: string, name = "notes.txt"): NativeComposerFileAttachment => ({
  type: "file",
  id: `lynx-file-${token}`,
  token,
  name,
  mimeType: "text/plain",
  sizeBytes: 12,
});

const stagedAttachment = (id: string) => ({
  type: "file" as const,
  id,
  name: `${id}.txt`,
  mimeType: "text/plain",
  sizeBytes: 12,
});

const stagedImageAttachment = (id: string) => ({
  type: "image" as const,
  id,
  name: `${id}.png`,
  mimeType: "image/png",
  sizeBytes: 12,
});

const nativeImage = (token: string, name = "screenshot.png"): NativeComposerImageAttachment => ({
  type: "image",
  id: `lynx-image-${token}`,
  token,
  name,
  mimeType: "image/png",
  sizeBytes: 12,
  previewUrl: "data:image/png;base64,AA==",
});

describe("native composer picked-file intake", () => {
  it("maps a validated host capability into the shared file-card shape", async () => {
    await expect(
      resolvePickedComposerFiles({ existingAttachmentCount: 0, files: [picked()] }),
    ).resolves.toEqual({
      files: [
        {
          type: "file",
          id: "lynx-file-11111111-1111-4111-8111-111111111111",
          token: "11111111-1111-4111-8111-111111111111",
          name: "notes.txt",
          mimeType: "text/plain",
          sizeBytes: 12,
        },
      ],
      images: [],
      rejectedTokens: [],
      error: null,
    });
  });

  it("resolves image previews through the host capability", async () => {
    const calls: Array<{ method: string; params: Record<string, unknown> }> = [];
    async function request<T>(method: string, params: Record<string, unknown>): Promise<T> {
      calls.push({ method, params });
      return { dataUrl: "data:image/png;base64,AA==" } as T;
    }
    const result = await resolvePickedComposerFiles(
      {
        existingAttachmentCount: 0,
        files: [picked({ name: "shot.png", mimeType: "image/png" })],
      },
      request,
    );
    expect(result).toEqual({
      files: [],
      images: [
        {
          type: "image",
          id: "lynx-image-11111111-1111-4111-8111-111111111111",
          token: "11111111-1111-4111-8111-111111111111",
          name: "shot.png",
          mimeType: "image/png",
          sizeBytes: 12,
          previewUrl: "data:image/png;base64,AA==",
        },
      ],
      rejectedTokens: [],
      error: null,
    });
    expect(calls).toEqual([
      {
        method: "attachmentsGetPickedImagePreview",
        params: { token: "11111111-1111-4111-8111-111111111111" },
      },
    ]);
  });

  it("rejects oversized and malformed capabilities without losing valid files", async () => {
    const result = await resolvePickedComposerFiles({
      existingAttachmentCount: 0,
      files: [
        picked(),
        picked({
          token: "22222222-2222-4222-8222-222222222222",
          name: "large.zip",
          sizeBytes: 25 * 1024 * 1024 + 1,
        }),
        picked({ token: "../not-a-capability", name: "bad.txt" }),
      ],
    });

    expect(result.files).toHaveLength(1);
    expect(result.rejectedTokens).toEqual([
      "22222222-2222-4222-8222-222222222222",
      "../not-a-capability",
    ]);
    expect(result.error).toBe("One selected file could not be validated.");
  });

  it("enforces the shared eight-reference limit against existing draft items", async () => {
    const result = await resolvePickedComposerFiles({
      existingAttachmentCount: 8,
      files: [picked()],
    });
    expect(result.files).toEqual([]);
    expect(result.rejectedTokens).toEqual(["11111111-1111-4111-8111-111111111111"]);
    expect(result.error).toBe("You can attach up to 8 references per message.");
  });

  it("cancels already staged uploads when a later upload fails", async () => {
    const calls: Array<{ method: string; params: Record<string, unknown> }> = [];
    async function request<T>(method: string, params: Record<string, unknown>): Promise<T> {
      calls.push({ method, params });
      if (method === "attachmentsCancel") return { cancelled: true } as T;
      if (params.token === "second-token") throw new Error("read failed");
      return { attachment: stagedAttachment("managed-first") } as T;
    }

    await expect(
      stageNativeComposerFiles(
        {
          threadId: "thread-1",
          files: [nativeFile("first-token"), nativeFile("second-token")],
        },
        request,
      ),
    ).rejects.toThrow("read failed");
    expect(calls).toEqual([
      {
        method: "attachmentsUploadPickedFile",
        params: { token: "first-token", threadId: "thread-1" },
      },
      {
        method: "attachmentsUploadPickedFile",
        params: { token: "second-token", threadId: "thread-1" },
      },
      {
        method: "attachmentsCancel",
        params: { attachmentId: "managed-first" },
      },
    ]);
  });

  it("cancels every staged upload once when dispatch fails", async () => {
    const cancelled: string[] = [];
    let upload = 0;
    async function request<T>(method: string, params: Record<string, unknown>): Promise<T> {
      if (method === "attachmentsCancel") {
        cancelled.push(String(params.attachmentId));
        return { cancelled: true } as T;
      }
      upload += 1;
      return { attachment: stagedAttachment(`managed-${upload}`) } as T;
    }
    const staged = await stageNativeComposerFiles(
      {
        threadId: "thread-1",
        files: [nativeFile("first-token"), nativeFile("second-token")],
      },
      request,
    );

    await expect(
      staged.runWithDispatch(async () => {
        throw new Error("dispatch failed");
      }),
    ).rejects.toThrow("dispatch failed");
    expect(cancelled).toEqual(["managed-1", "managed-2"]);
  });

  it("does not cancel claimed uploads after dispatch succeeds", async () => {
    const cancelled: string[] = [];
    async function request<T>(method: string, params: Record<string, unknown>): Promise<T> {
      if (method === "attachmentsCancel") {
        cancelled.push(String(params.attachmentId));
        return { cancelled: true } as T;
      }
      return { attachment: stagedAttachment("managed-success") } as T;
    }
    const staged = await stageNativeComposerFiles(
      { threadId: "thread-1", files: [nativeFile("first-token")] },
      request,
    );

    await expect(staged.runWithDispatch(async () => "sent")).resolves.toBe("sent");
    expect(cancelled).toEqual([]);
  });

  it("releases and acknowledges an AppSnap only after dispatch succeeds", async () => {
    const calls: Array<{ method: string; params: Record<string, unknown> }> = [];
    async function request<T>(method: string, params: Record<string, unknown>): Promise<T> {
      calls.push({ method, params });
      if (method === "attachmentsUploadPickedFile") {
        return { attachment: stagedImageAttachment("managed-appsnap") } as T;
      }
      return { ok: true } as T;
    }
    const image = {
      ...nativeImage("appsnap-token"),
      appSnapCaptureId: "capture-1",
    };
    const staged = await stageNativeComposerFiles(
      { threadId: "thread-1", files: [image] },
      request,
    );

    await expect(staged.runWithDispatch(async () => "sent")).resolves.toBe("sent");
    expect(calls.slice(1)).toEqual([
      {
        method: "attachmentsReleasePickedFile",
        params: { token: "appsnap-token" },
      },
      {
        method: "appSnapAcknowledgeCapture",
        params: { captureId: "capture-1" },
      },
    ]);
  });

  it("retains the AppSnap capability and capture when dispatch fails", async () => {
    const methods: string[] = [];
    async function request<T>(method: string, _params: Record<string, unknown>): Promise<T> {
      methods.push(method);
      if (method === "attachmentsUploadPickedFile") {
        return { attachment: stagedImageAttachment("managed-appsnap") } as T;
      }
      return { cancelled: true } as T;
    }
    const staged = await stageNativeComposerFiles(
      {
        threadId: "thread-1",
        files: [
          {
            ...nativeImage("appsnap-token"),
            appSnapCaptureId: "capture-1",
          },
        ],
      },
      request,
    );

    await expect(
      staged.runWithDispatch(async () => {
        throw new Error("dispatch failed");
      }),
    ).rejects.toThrow("dispatch failed");
    expect(methods).toEqual(["attachmentsUploadPickedFile", "attachmentsCancel"]);
  });

  it("uploads image and file capabilities with matching server types", async () => {
    const uploaded: string[] = [];
    async function request<T>(method: string, params: Record<string, unknown>): Promise<T> {
      if (method !== "attachmentsUploadPickedFile") {
        return { cancelled: true } as T;
      }
      uploaded.push(String(params.token));
      const isImage = params.token === "image-token";
      return {
        attachment: isImage
          ? {
              type: "image",
              id: "managed-image",
              name: "screenshot.png",
              mimeType: "image/png",
              sizeBytes: 12,
            }
          : stagedAttachment("managed-file"),
      } as T;
    }
    const staged = await stageNativeComposerFiles(
      {
        threadId: "thread-1",
        files: [nativeImage("image-token"), nativeFile("file-token")],
      },
      request,
    );

    expect(uploaded).toEqual(["image-token", "file-token"]);
    expect(staged.attachments.map((attachment) => attachment.type)).toEqual(["image", "file"]);
  });
});
