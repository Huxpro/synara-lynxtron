import { beforeEach, describe, expect, it } from "@rstest/core";

import { PROVIDER_SEND_TURN_MAX_ATTACHMENTS } from "@synara/contracts";
import { createAssistantSelectionAttachment } from "@synara-web/lib/assistantSelections";
import { createPastedTextDraft } from "@synara-web/lib/composerPastedText";
import {
  LYNX_COMPOSER_DRAFT_STORAGE_KEY,
  parsePersistedLynxComposerDrafts,
  useComposerDraftStore,
} from "./composerDraftStore.lynx";
import { webStorage } from "../platform/storage";

describe("Lynx composer draft attachment subset", () => {
  beforeEach(() => {
    webStorage.clear();
    useComposerDraftStore.setState({ draftsByThreadId: {} });
  });

  it("keeps pasted text when the editable prompt is empty and removes an empty draft", () => {
    const pastedText = createPastedTextDraft({
      id: "paste-1",
      createdAt: "2026-07-29T00:00:00.000Z",
      text: "large paste",
    });
    const store = useComposerDraftStore.getState();

    store.addPastedText("thread-1", pastedText);
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]).toEqual({
      assistantSelections: [],
      files: [],
      images: [],
      fileComments: [],
      mentions: [],
      nonPersistedImageIds: [],
      prompt: "",
      pastedTexts: [pastedText],
      skills: [],
      terminalContexts: [],
    });

    useComposerDraftStore.getState().removePastedText("thread-1", "paste-1");
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]).toBeUndefined();
  });

  it("clears prompt and attachment state together after a successful send", () => {
    const store = useComposerDraftStore.getState();
    store.setPrompt("thread-1", "ship it");
    useComposerDraftStore.getState().addPastedText(
      "thread-1",
      createPastedTextDraft({
        id: "paste-1",
        createdAt: "2026-07-29T00:00:00.000Z",
        text: "context",
      }),
    );

    useComposerDraftStore.getState().clearDraft("thread-1");
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]).toBeUndefined();
  });

  it("keeps the selected model while clearing sent prompt content", () => {
    const store = useComposerDraftStore.getState();
    store.setPrompt("thread-1", "ship it");
    store.setModelSelection("thread-1", {
      provider: "codex",
      model: "gpt-5.6-sol",
    });

    useComposerDraftStore.getState().clearDraft("thread-1");
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]).toEqual({
      assistantSelections: [],
      files: [],
      images: [],
      fileComments: [],
      mentions: [],
      nonPersistedImageIds: [],
      prompt: "",
      pastedTexts: [],
      skills: [],
      terminalContexts: [],
      runtimeMode: undefined,
      interactionMode: undefined,
      modelSelection: {
        provider: "codex",
        model: "gpt-5.6-sol",
      },
      modelSelectionByProvider: {
        codex: {
          provider: "codex",
          model: "gpt-5.6-sol",
        },
      },
    });
  });

  it("discards prompt and retained model for an abandoned scratch draft", () => {
    const store = useComposerDraftStore.getState();
    store.setPrompt("thread-1", "temporary task");
    store.setModelSelection("thread-1", {
      provider: "codex",
      model: "gpt-5.6-sol",
    });

    useComposerDraftStore.getState().discardDraft("thread-1");
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]).toBeUndefined();
  });

  it("persists, deduplicates, and removes whole-message assistant references", () => {
    const selection = createAssistantSelectionAttachment({
      assistantMessageId: "assistant-1",
      text: "\n  Complete response  \n",
    });
    expect(selection).not.toBeNull();
    if (!selection) return;

    const store = useComposerDraftStore.getState();
    store.addAssistantSelection("thread-1", selection);
    useComposerDraftStore.getState().addAssistantSelection("thread-1", {
      ...selection,
      id: "duplicate-id",
    });

    expect(
      useComposerDraftStore.getState().draftsByThreadId["thread-1"]?.assistantSelections,
    ).toEqual([
      {
        ...selection,
        text: "Complete response",
      },
    ]);
    expect(
      parsePersistedLynxComposerDrafts(webStorage.getItem(LYNX_COMPOSER_DRAFT_STORAGE_KEY))[
        "thread-1"
      ]?.assistantSelections,
    ).toEqual([
      {
        ...selection,
        text: "Complete response",
      },
    ]);

    useComposerDraftStore.getState().removeAssistantSelections("thread-1");
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]).toBeUndefined();
  });

  it("persists, deduplicates, normalizes, and removes file comments", () => {
    const store = useComposerDraftStore.getState();
    store.addFileComment("thread-1", {
      id: "comment-1",
      path: " src/example.ts ",
      startLine: 0,
      endLine: 2,
      text: "\n  Rename this value.  \n",
    });
    useComposerDraftStore.getState().addFileComment("thread-1", {
      id: "comment-duplicate",
      path: "src/example.ts",
      startLine: 1,
      endLine: 2,
      text: "Rename this value.",
    });

    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]?.fileComments).toEqual([
      {
        id: "comment-1",
        path: "src/example.ts",
        startLine: 1,
        endLine: 2,
        text: "Rename this value.",
      },
    ]);
    expect(
      parsePersistedLynxComposerDrafts(webStorage.getItem(LYNX_COMPOSER_DRAFT_STORAGE_KEY))[
        "thread-1"
      ]?.fileComments,
    ).toEqual([
      {
        id: "comment-1",
        path: "src/example.ts",
        startLine: 1,
        endLine: 2,
        text: "Rename this value.",
      },
    ]);

    useComposerDraftStore.getState().removeFileComments("thread-1");
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]).toBeUndefined();
  });

  it("persists terminal context metadata with one atomic prompt placeholder", () => {
    const context = {
      id: "terminal-context-1",
      threadId: "thread-1" as never,
      terminalId: " terminal-1 ",
      terminalLabel: " Terminal 1 ",
      lineStart: 0,
      lineEnd: 2,
      text: "\nfirst\nsecond\n",
      createdAt: "2026-08-29T00:00:00.000Z",
    };

    useComposerDraftStore.getState().addTerminalContext("thread-1", context);
    useComposerDraftStore.getState().addTerminalContext("thread-1", context);

    const draft = useComposerDraftStore.getState().draftsByThreadId["thread-1"];
    expect(draft?.prompt).toBe("\uFFFC");
    expect(draft?.terminalContexts).toEqual([
      {
        ...context,
        terminalId: "terminal-1",
        terminalLabel: "Terminal 1",
        lineStart: 1,
        lineEnd: 2,
        text: "first\nsecond",
      },
    ]);
    const persisted = JSON.parse(
      webStorage.getItem(LYNX_COMPOSER_DRAFT_STORAGE_KEY) ?? "{}",
    ) as Record<string, { terminalContexts?: Array<Record<string, unknown>> }>;
    expect(persisted["thread-1"]?.terminalContexts?.[0]).toMatchObject({
      id: "terminal-context-1",
      terminalId: "terminal-1",
      terminalLabel: "Terminal 1",
      lineStart: 1,
      lineEnd: 2,
    });
    expect(persisted["thread-1"]?.terminalContexts?.[0]).not.toHaveProperty("text");
    expect(
      parsePersistedLynxComposerDrafts(webStorage.getItem(LYNX_COMPOSER_DRAFT_STORAGE_KEY))[
        "thread-1"
      ]?.terminalContexts,
    ).toEqual([
      {
        id: "terminal-context-1",
        threadId: "thread-1",
        createdAt: "2026-08-29T00:00:00.000Z",
        terminalId: "terminal-1",
        terminalLabel: "Terminal 1",
        lineStart: 1,
        lineEnd: 2,
        text: "",
      },
    ]);

    useComposerDraftStore.getState().removeTerminalContext("thread-1", "terminal-context-1");
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]).toBeUndefined();
  });

  it("drops malformed and oversized assistant references during hydration", () => {
    const raw = JSON.stringify({
      valid: {
        prompt: "",
        assistantSelections: [
          {
            type: "assistant-selection",
            id: "selection-1",
            assistantMessageId: " assistant-1 ",
            text: "\nValid reference\n",
          },
          {
            type: "assistant-selection",
            id: "",
            assistantMessageId: "assistant-2",
            text: "missing id",
          },
          {
            type: "assistant-selection",
            id: "selection-too-long",
            assistantMessageId: "assistant-3",
            text: "x".repeat(4_001),
          },
          {
            type: "file",
            id: "wrong-type",
            assistantMessageId: "assistant-4",
            text: "wrong type",
          },
        ],
        skills: [],
        mentions: [],
        files: [],
        pastedTexts: [],
      },
    });

    expect(parsePersistedLynxComposerDrafts(raw).valid?.assistantSelections).toEqual([
      {
        type: "assistant-selection",
        id: "selection-1",
        assistantMessageId: "assistant-1",
        text: "Valid reference",
      },
    ]);
  });

  it("normalizes runtime references and enforces the shared attachment limit", () => {
    const store = useComposerDraftStore.getState();
    for (let index = 0; index < PROVIDER_SEND_TURN_MAX_ATTACHMENTS + 1; index += 1) {
      store.addAssistantSelection("thread-1", {
        type: "assistant-selection",
        id: `selection-${index}`,
        assistantMessageId: ` assistant-${index} `,
        text: `\nReference ${index}\n`,
      });
    }

    const selections =
      useComposerDraftStore.getState().draftsByThreadId["thread-1"]?.assistantSelections ?? [];
    expect(selections).toHaveLength(PROVIDER_SEND_TURN_MAX_ATTACHMENTS);
    expect(selections[0]).toMatchObject({
      assistantMessageId: "assistant-0",
      text: "Reference 0",
    });
    expect(selections).not.toContainEqual(
      expect.objectContaining({
        assistantMessageId: `assistant-${PROVIDER_SEND_TURN_MAX_ATTACHMENTS}`,
      }),
    );
  });

  it("keeps picked-file capabilities until removal or successful clear", () => {
    const file = {
      type: "file" as const,
      id: "lynx-file-1",
      token: "11111111-1111-4111-8111-111111111111",
      name: "notes.txt",
      mimeType: "text/plain",
      sizeBytes: 12,
    };
    const store = useComposerDraftStore.getState();
    store.addFiles("thread-1", [file, file]);
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]?.files).toEqual([file]);

    useComposerDraftStore.getState().removeFile("thread-1", file.id);
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]).toBeUndefined();
  });

  it("persists picked-image capabilities as non-persisted draft warnings", () => {
    const image = {
      type: "image" as const,
      id: "lynx-image-1",
      token: "11111111-1111-4111-8111-111111111111",
      name: "screenshot.png",
      mimeType: "image/png",
      sizeBytes: 12,
      previewUrl: "data:image/png;base64,AA==",
    };
    const store = useComposerDraftStore.getState();
    store.addImages("thread-1", [image, image]);
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]).toMatchObject({
      images: [image],
      nonPersistedImageIds: [image.id],
    });
    expect(
      parsePersistedLynxComposerDrafts(webStorage.getItem(LYNX_COMPOSER_DRAFT_STORAGE_KEY))[
        "thread-1"
      ],
    ).toMatchObject({
      images: [image],
      nonPersistedImageIds: [image.id],
    });

    useComposerDraftStore.getState().removeImage("thread-1", image.id);
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]).toBeUndefined();
  });

  it("replaces a restarted AppSnap capability without duplicating its capture", () => {
    const first = {
      type: "image" as const,
      id: "lynx-image-first",
      token: "11111111-1111-4111-8111-111111111111",
      name: "appsnap.png",
      mimeType: "image/png",
      sizeBytes: 12,
      previewUrl: "data:image/png;base64,AA==",
      appSnapCaptureId: "capture-1",
    };
    const second = {
      ...first,
      id: "lynx-image-second",
      token: "22222222-2222-4222-8222-222222222222",
      previewUrl: "data:image/png;base64,BB==",
    };
    const store = useComposerDraftStore.getState();
    store.addImages("thread-1", [first]);
    store.addImages("thread-1", [second]);

    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]?.images).toEqual([second]);
  });

  it("updates and preserves options when a trait changes on the same model", () => {
    const store = useComposerDraftStore.getState();
    store.setModelSelection("thread-1", {
      provider: "codex",
      model: "gpt-5.6-sol",
      options: { reasoningEffort: "medium" },
    });
    useComposerDraftStore.getState().setModelSelection("thread-1", {
      provider: "codex",
      model: "gpt-5.6-sol",
      options: { reasoningEffort: "high" },
    });

    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]?.modelSelection).toEqual({
      provider: "codex",
      model: "gpt-5.6-sol",
      options: { reasoningEffort: "high" },
    });
  });

  it("remembers each provider selection while switching the active provider", () => {
    const store = useComposerDraftStore.getState();
    const openCode = {
      provider: "opencode" as const,
      model: "opencode/deepseek-v4-flash-free",
    };
    const pi = {
      provider: "pi" as const,
      model: "openai/gpt-5.5",
    };

    store.setModelSelection("thread-1", pi);
    store.setModelSelection("thread-1", openCode);

    const draft = useComposerDraftStore.getState().draftsByThreadId["thread-1"];
    expect(draft?.modelSelection).toEqual(openCode);
    expect(draft?.modelSelectionByProvider).toEqual({
      pi,
      opencode: openCode,
    });
  });

  it("persists pre-send runtime and interaction modes", () => {
    const store = useComposerDraftStore.getState();
    store.setRuntimeMode("thread-1", "approval-required");
    store.setInteractionMode("thread-1", "plan");

    const draft = useComposerDraftStore.getState().draftsByThreadId["thread-1"];
    expect(draft?.runtimeMode).toBe("approval-required");
    expect(draft?.interactionMode).toBe("plan");
    expect(
      parsePersistedLynxComposerDrafts(webStorage.getItem(LYNX_COMPOSER_DRAFT_STORAGE_KEY))[
        "thread-1"
      ],
    ).toMatchObject({
      runtimeMode: "approval-required",
      interactionMode: "plan",
    });
  });

  it("migrates a legacy single provider selection into provider memory", () => {
    const drafts = parsePersistedLynxComposerDrafts(
      JSON.stringify({
        "thread-1": {
          prompt: "",
          modelSelection: {
            provider: "pi",
            model: "openai/gpt-5.5",
          },
        },
      }),
    );

    expect(drafts["thread-1"]?.modelSelectionByProvider).toEqual({
      pi: {
        provider: "pi",
        model: "openai/gpt-5.5",
      },
    });
  });

  it("keeps only structured mentions whose token remains in the prompt", () => {
    const mention = {
      name: "Release prep",
      path: "thread://thread-2",
    };
    const store = useComposerDraftStore.getState();
    store.setPrompt("thread-1", '@"Release prep" ');
    store.setMentions("thread-1", [mention]);
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]?.mentions).toEqual([
      mention,
    ]);

    useComposerDraftStore.getState().setPrompt("thread-1", "No reference");
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]?.mentions).toEqual([]);
  });

  it("keeps only structured skills whose canonical token remains in the prompt", () => {
    const skill = { name: "polish", path: "/skills/polish" };
    const store = useComposerDraftStore.getState();
    store.setPrompt("thread-1", "/polish ");
    store.setSkills("thread-1", [skill]);
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]?.skills).toEqual([skill]);

    useComposerDraftStore.getState().setPrompt("thread-1", "No skill");
    expect(useComposerDraftStore.getState().draftsByThreadId["thread-1"]?.skills).toEqual([]);
  });

  it("persists canonical prompt and structured token references for restart", () => {
    const store = useComposerDraftStore.getState();
    store.setPrompt("thread-1", 'Use /polish with @"Release prep"');
    store.setSkills("thread-1", [{ name: "polish", path: "/skills/polish/SKILL.md" }]);
    store.setMentions("thread-1", [{ name: "Release prep", path: "thread://release" }]);

    const persisted = webStorage.getItem(LYNX_COMPOSER_DRAFT_STORAGE_KEY);
    expect(parsePersistedLynxComposerDrafts(persisted)["thread-1"]).toMatchObject({
      prompt: 'Use /polish with @"Release prep"',
      skills: [{ name: "polish", path: "/skills/polish/SKILL.md" }],
      mentions: [{ name: "Release prep", path: "thread://release" }],
    });
  });

  it("fails closed when persisted draft JSON is malformed", () => {
    expect(parsePersistedLynxComposerDrafts("{bad")).toEqual({});
    expect(
      parsePersistedLynxComposerDrafts(
        JSON.stringify({
          broken: { prompt: 42 },
          valid: {
            prompt: "keep",
            skills: [],
            mentions: [],
            files: [],
            pastedTexts: [],
          },
        }),
      ),
    ).toEqual({
      valid: {
        assistantSelections: [],
        fileComments: [],
        prompt: "keep",
        skills: [],
        mentions: [],
        files: [],
        images: [],
        nonPersistedImageIds: [],
        pastedTexts: [],
        terminalContexts: [],
      },
    });
  });
});
