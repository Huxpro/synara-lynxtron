import { describe, expect, it } from '@rstest/core';

import { terminalCommittedInputDelta } from './terminalInput.logic';

describe('terminalCommittedInputDelta', () => {
  it('forwards appended ASCII, paste, and committed Unicode', () => {
    expect(terminalCommittedInputDelta('', 'a')).toBe('a');
    expect(terminalCommittedInputDelta('', 'hello world')).toBe('hello world');
    expect(terminalCommittedInputDelta('', '中文')).toBe('中文');
  });

  it('maps deletion and replacement to terminal DEL bytes', () => {
    expect(terminalCommittedInputDelta('abc', 'ab')).toBe('\u007f');
    expect(terminalCommittedInputDelta('abc', 'ax')).toBe('\u007f\u007fx');
  });

  it('counts Unicode code points instead of UTF-16 units', () => {
    expect(terminalCommittedInputDelta('🙂', '')).toBe('\u007f');
  });
});
