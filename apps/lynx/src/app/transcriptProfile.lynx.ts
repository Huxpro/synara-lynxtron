// Explicit local profiling build only; no content is collected or transmitted.
import { runOnMainThread, useEffect, useMemo } from "@lynx-js/react";

import type { ThreadTranscriptRow } from "./queries";
import { estimateTranscriptRowMainAxisSize } from "./transcriptRows.logic";

const enabled = process.env.SYNARA_TRANSCRIPT_PROFILE === "1";
type Pipeline = Record<string, number | string>;
interface ProfileSnapshot {
  active: boolean;
  threadId: string;
  parentRenders: number;
  rowCount: number;
  chatFontSizePx: number;
  rowRenders: Record<string, number>;
  pipelines: Pipeline[];
  capability: string;
  frameIntervals: number[];
  frameCapability: string;
}
interface ProfileApi {
  estimates: () => unknown;
  setRows: (threadId: string, rows: readonly ThreadTranscriptRow[], fontSize: number) => void;
  reset: (threadId: string) => void;
  stop: () => void;
  snapshot: () => ProfileSnapshot;
  subscribe: () => () => void;
  parent: (threadId: string, rowCount: number, fontSize: number) => string | undefined;
  row: (threadId: string, rowId: string) => void;
}
type ProfileGlobals = typeof globalThis & { __synaraTranscriptProfile?: ProfileApi };
function profile(): ProfileApi | undefined {
  if (!enabled || (typeof __MAIN_THREAD__ !== "undefined" && __MAIN_THREAD__)) return;
  const globals = globalThis as ProfileGlobals;
  if (globals.__synaraTranscriptProfile) return globals.__synaraTranscriptProfile;
  let state: ProfileSnapshot = {
    active: false,
    threadId: "",
    parentRenders: 0,
    rowCount: 0,
    chatFontSizePx: 0,
    rowRenders: {},
    pipelines: [],
    capability: "not subscribed",
    frameIntervals: [],
    frameCapability: "not started",
  };
  let sequence = 0;
  let subscribers = 0;
  let observer: { disconnect: () => void } | undefined;
  const prefix = `chat88-${Date.now()}-`;
  const reset = (threadId: string) => {
    const capability = state?.capability ?? "not subscribed";
    state = {
      active: true,
      threadId,
      parentRenders: 0,
      rowCount: 0,
      chatFontSizePx: 0,
      rowRenders: {},
      pipelines: [],
      capability,
      frameIntervals: [],
      frameCapability: "starting",
    };
    void runOnMainThread(startMainThreadFrames)()
      .then((value: unknown) => {
        state.frameCapability = typeof value === "string" ? value : "started";
      })
      .catch((error) => {
        state.frameCapability = "unavailable: " + String(error);
      });
  };
  let estimateRows: (() => unknown) | undefined;
  const api: ProfileApi = {
    estimates: () => estimateRows?.() ?? null,
    setRows: (threadId, rows, fontSize) => {
      estimateRows = () => ({
        threadId,
        fontSize,
        rows: rows.map((row) => ({
          id: row.id,
          kind: row.kind,
          estimate: estimateTranscriptRowMainAxisSize(row, fontSize),
        })),
      });
    },
    reset,
    stop: () => {
      state.active = false;
      void runOnMainThread(stopMainThreadFrames)()
        .then((value: unknown) => {
          const sample = value as { intervals?: unknown; capability?: unknown };
          if (Array.isArray(sample?.intervals))
            state.frameIntervals = sample.intervals.filter(
              (n: unknown): n is number => typeof n === "number" && Number.isFinite(n),
            );
          state.frameCapability =
            typeof sample?.capability === "string" ? sample.capability : "invalid frame sample";
        })
        .catch((error) => {
          state.frameCapability = "unavailable: " + String(error);
        });
    },
    snapshot: () => ({
      ...state,
      rowRenders: { ...state.rowRenders },
      pipelines: [...state.pipelines],
      frameIntervals: [...state.frameIntervals],
    }),
    subscribe: () => {
      subscribers += 1;
      if (subscribers === 1) {
        try {
          const candidate = lynx.performance.createObserver((entry: unknown) => {
            if (!state.active || typeof entry !== "object" || entry === null) return;
            const values = entry as Record<string, unknown>;
            if (typeof values.identifier !== "string" || !values.identifier.startsWith(prefix))
              return;
            const sample: Pipeline = { identifier: values.identifier };
            for (const key of [
              "pipelineStart",
              "pipelineEnd",
              "mtsRenderStart",
              "mtsRenderEnd",
              "resolveStart",
              "resolveEnd",
              "layoutStart",
              "layoutEnd",
              "paintEnd",
              "paintingUiOperationExecuteStart",
              "paintingUiOperationExecuteEnd",
            ]) {
              const value = values[key];
              if (typeof value === "number" && Number.isFinite(value)) sample[key] = value;
            }
            if (state.pipelines.length < 1000) state.pipelines.push(sample);
          });
          candidate.observe(["pipeline"]);
          observer = candidate;
          state.capability = "pipeline observer registered";
        } catch (error) {
          state.capability = "pipeline observer unavailable: " + String(error);
        }
      }
      return () => {
        subscribers -= 1;
        if (subscribers === 0) {
          observer?.disconnect();
          observer = undefined;
        }
      };
    },
    parent: (threadId, rowCount, fontSize) => {
      if (!state.active || state.threadId !== threadId) return;
      state.parentRenders += 1;
      state.rowCount = rowCount;
      state.chatFontSizePx = fontSize;
      return prefix + ++sequence;
    },
    row: (threadId, rowId) => {
      if (state.active && state.threadId === threadId)
        state.rowRenders[rowId] = (state.rowRenders[rowId] ?? 0) + 1;
    },
  };
  globals.__synaraTranscriptProfile = api;
  return api;
}
export function useTranscriptProfile(
  threadId: string,
  rows: readonly ThreadTranscriptRow[],
  fontSize: number,
) {
  profile()?.setRows(threadId, rows, fontSize);
  const unsubscribe = useMemo(() => profile()?.subscribe(), []);
  useEffect(() => () => unsubscribe?.(), [unsubscribe]);
  return profile()?.parent(threadId, rows.length, fontSize);
}
export function recordTranscriptProfileRow(threadId: string, rowId: string): void {
  profile()?.row(threadId, rowId);
}

type MainThreadFrames = { active: boolean; intervals: number[]; last?: number; handle?: number };
type MainFrameGlobals = typeof globalThis & { __synaraTranscriptFrames?: MainThreadFrames };
function sampleMainThreadFrame(timestamp?: number): void {
  "main thread";
  const state = (globalThis as MainFrameGlobals).__synaraTranscriptFrames;
  if (!state?.active) return;
  const now = typeof timestamp === "number" ? timestamp : Date.now();
  if (state.last !== undefined && now >= state.last && state.intervals.length < 3000)
    state.intervals.push(now - state.last);
  state.last = now;
  state.handle = requestAnimationFrame(sampleMainThreadFrame);
}
function startMainThreadFrames(): string {
  "main thread";
  const globals = globalThis as MainFrameGlobals;
  if (typeof requestAnimationFrame !== "function" || typeof cancelAnimationFrame !== "function")
    return "unavailable: main-thread requestAnimationFrame";
  const previous = globals.__synaraTranscriptFrames;
  if (previous?.handle !== undefined) cancelAnimationFrame(previous.handle);
  globals.__synaraTranscriptFrames = { active: true, intervals: [] };
  globals.__synaraTranscriptFrames.handle = requestAnimationFrame(sampleMainThreadFrame);
  return "main-thread requestAnimationFrame started";
}
function stopMainThreadFrames(): { intervals: number[]; capability: string } {
  "main thread";
  const state = (globalThis as MainFrameGlobals).__synaraTranscriptFrames;
  if (!state) return { intervals: [], capability: "unavailable: no main-thread frame sampler" };
  state.active = false;
  if (state.handle !== undefined) cancelAnimationFrame(state.handle);
  return {
    intervals: state.intervals.slice(),
    capability: "main-thread requestAnimationFrame stopped",
  };
}
