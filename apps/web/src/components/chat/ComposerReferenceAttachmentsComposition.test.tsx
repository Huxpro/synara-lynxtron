// FILE: ComposerReferenceAttachmentsComposition.test.tsx
// Purpose: Pin shared attachment visibility and category/item ordering.

import { renderToStaticMarkup } from "react-dom/server";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./ComposerReferenceAttachmentsCompositionElements", () => ({
  ComposerReferenceAttachmentsContainerElement: ({
    children,
  }: {
    children?: ReactNode | undefined;
  }) => <div data-attachments>{children}</div>,
  ComposerAssistantSelectionsAttachmentElement: ({
    selections,
  }: {
    selections: readonly unknown[];
  }) => (selections.length > 0 ? <span>selections</span> : null),
  ComposerFileCommentsAttachmentElement: ({ comments }: { comments: readonly unknown[] }) =>
    comments.length > 0 ? <span>comments</span> : null,
  ComposerPastedTextAttachmentElement: ({ pastedText }: { pastedText: { id: string } }) => (
    <span>paste:{pastedText.id}</span>
  ),
  ComposerFileAttachmentElement: ({ file }: { file: { id: string } }) => (
    <span>file:{file.id}</span>
  ),
  ComposerImageAttachmentElement: ({ image }: { image: { id: string } }) => (
    <span>image:{image.id}</span>
  ),
}));

import { ComposerReferenceAttachmentsComposition } from "./ComposerReferenceAttachmentsComposition";

const callbacks = {
  onExpandImage: () => undefined,
  onRemoveAssistantSelections: () => undefined,
  onRemoveFileComments: () => undefined,
  onRemovePastedText: () => undefined,
  onShowPastedTextInField: () => undefined,
  onRemoveFile: () => undefined,
  onRemoveImage: () => undefined,
};

describe("ComposerReferenceAttachmentsComposition", () => {
  it("omits the row when every real attachment collection is empty", () => {
    expect(
      renderToStaticMarkup(
        <ComposerReferenceAttachmentsComposition
          assistantSelections={[]}
          fileComments={[]}
          pastedTexts={[]}
          files={[]}
          images={[]}
          nonPersistedImageIdSet={new Set()}
          {...callbacks}
        />,
      ),
    ).toBe("");
  });

  it("owns category order and preserves item order inside each category", () => {
    const markup = renderToStaticMarkup(
      <ComposerReferenceAttachmentsComposition
        assistantSelections={[{ id: "s1", text: "selection" } as never]}
        fileComments={[{ path: "a.ts", startLine: 1, endLine: 1, text: "comment" } as never]}
        pastedTexts={[
          { id: "p1", text: "one", lineCount: 1, charCount: 3, createdAt: "now" },
          { id: "p2", text: "two", lineCount: 1, charCount: 3, createdAt: "now" },
        ]}
        files={[{ id: "f1" } as never]}
        images={[{ id: "i1" } as never]}
        nonPersistedImageIdSet={new Set(["i1"])}
        {...callbacks}
      />,
    );

    expect(markup).toContain("data-attachments");
    const expectedOrder = ["selections", "comments", "paste:p1", "paste:p2", "file:f1", "image:i1"];
    for (let index = 1; index < expectedOrder.length; index += 1) {
      expect(markup.indexOf(expectedOrder[index - 1]!)).toBeLessThan(
        markup.indexOf(expectedOrder[index]!),
      );
    }
  });
});
