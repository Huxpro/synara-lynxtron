import { describe, expect, it, rs } from "@rstest/core";
import { createNativeVoiceRecorder } from "./voiceRecorder";

describe("native voice recorder host", () => {
  it("is unavailable without loading an addon outside macOS", async () => {
    const requireNative = rs.fn();
    const recorder = createNativeVoiceRecorder({ platform: "linux", requireNative });
    expect(recorder.getState()).toEqual({
      supported: false,
      recording: false,
      permission: "unknown",
      level: 0,
    });
    await expect(recorder.start()).resolves.toEqual(recorder.getState());
    expect(recorder.stop()).toBeNull();
    expect(requireNative).not.toHaveBeenCalled();
  });

  it("requests permission, bounds capture, returns WAV base64, and disposes", async () => {
    let permission: "not-determined" | "granted" = "not-determined";
    let recording = false;
    const start = rs.fn(() => {
      recording = true;
    });
    const cancel = rs.fn(() => {
      recording = false;
    });
    const recorder = createNativeVoiceRecorder({
      platform: "darwin",
      requireNative: () => ({
        getState: () => ({ supported: true, recording, permission, level: 0.5 }),
        requestPermission: (callback) => {
          permission = "granted";
          callback(true);
        },
        start,
        stop: () => {
          recording = false;
          return { wav: Buffer.from("RIFF"), durationMs: 42.6 };
        },
        cancel,
      }),
    });
    await expect(recorder.start()).resolves.toMatchObject({ recording: true });
    expect(start).toHaveBeenCalledWith(10 * 1024 * 1024);
    expect(recorder.stop()).toEqual({
      audioBase64: Buffer.from("RIFF").toString("base64"),
      durationMs: 43,
      mimeType: "audio/wav",
      sampleRateHz: 24000,
    });
    recorder.dispose();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("does not start when microphone permission is denied", async () => {
    const start = rs.fn();
    const recorder = createNativeVoiceRecorder({
      platform: "darwin",
      requireNative: () => ({
        getState: () => ({ supported: true, recording: false, permission: "denied" }),
        requestPermission: rs.fn(),
        start,
        stop: rs.fn(),
        cancel: rs.fn(),
      }),
    });
    await expect(recorder.start()).rejects.toThrow("Microphone access was denied.");
    expect(start).not.toHaveBeenCalled();
  });
});
