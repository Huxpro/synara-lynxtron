import { describe, expect, it, rs } from '@rstest/core';

const call = rs.fn();
rs.mock('./bridge', () => ({ bridgeCall: call }));

describe('Native voice recorder bridge', () => {
  it('uses the bounded host lifecycle methods', async () => {
    const { nativeVoiceRecorder } = await import('./voiceRecorder.lynx');
    call.mockResolvedValue(null);
    await nativeVoiceRecorder.getState();
    await nativeVoiceRecorder.start();
    await nativeVoiceRecorder.stop();
    await nativeVoiceRecorder.cancel();
    expect(call.mock.calls.map(([name]) => name)).toEqual([
      'voiceGetState', 'voiceStartRecording', 'voiceStopRecording', 'voiceCancelRecording',
    ]);
  });
});
