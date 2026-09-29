import { describe, expect, it, rs } from "@rstest/core";

import { attachAppSnapCapture } from "./appSnapCapture.lynx";

const capture = {
  captureId: "capture-1",
  capturedAt: "2026-08-19T00:00:00.000Z",
  sourceAppName: "Terminal",
  sourceBundleIdentifier: "com.apple.Terminal",
  sourceWindowTitle: "Synara",
  file: {
    token: "11111111-1111-4111-8111-111111111111",
    name: "AppSnap.png",
    mimeType: "image/png",
    sizeBytes: 128,
  },
} as const;

describe("Lynx AppSnap capture attachment", () => {
  it("adds the picked image and acknowledges its durable capture", async () => {
    const addImages = rs.fn();
    const image = {
      type: "image" as const,
      id: "lynx-image-token",
      token: capture.file.token,
      name: capture.file.name,
      mimeType: capture.file.mimeType,
      sizeBytes: capture.file.sizeBytes,
      previewUrl: "data:image/png;base64,AAAA",
    };

    await expect(
      attachAppSnapCapture("thread-1", capture, {
        addImages,
        existingAttachmentCount: 0,
        resolvePickedFiles: async () => ({
          files: [],
          images: [image],
          rejectedTokens: [],
          error: null,
        }),
      }),
    ).resolves.toBe(true);
    expect(addImages).toHaveBeenCalledWith("thread-1", [
      { ...image, appSnapCaptureId: "capture-1" },
    ]);
  });

  it("keeps the pending capture when preview or attachment limits reject it", async () => {
    const addImages = rs.fn();

    await expect(
      attachAppSnapCapture("thread-1", capture, {
        addImages,
        existingAttachmentCount: 10,
        resolvePickedFiles: async () => ({
          files: [],
          images: [],
          rejectedTokens: [capture.file.token],
          error: "Attachment limit reached.",
        }),
      }),
    ).resolves.toBe(false);
    expect(addImages).not.toHaveBeenCalled();
  });
});
