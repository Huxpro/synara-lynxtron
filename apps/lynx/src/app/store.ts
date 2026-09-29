// P2-V1: remaining slice-local Zustand smoke. Composer drafts now use the
// physical main-repository composerDraftStore.

import { create } from "zustand";

interface SliceUiState {
  readonly pinnedByThreadId: Record<string, boolean>;
  setPinned: (threadId: string, pinned: boolean) => void;
}

export const useSliceUiStore = create<SliceUiState>()((set) => ({
  pinnedByThreadId: {},
  setPinned: (threadId, pinned) =>
    set((s) => ({ pinnedByThreadId: { ...s.pinnedByThreadId, [threadId]: pinned } })),
}));
