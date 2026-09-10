import { describe, expect, it } from '@rstest/core';

import type { PullRequestDiffFileView } from '@synara-web/components/pullRequest/pullRequestCode.logic';
import {
  buildDiffSyntaxHighlightRequests,
  mergeDiffSyntaxHighlightResults,
} from './diffSyntaxHighlighting.logic';

const file: PullRequestDiffFileView = {
  key: 'example.js',
  path: 'src/example.js',
  previousPath: null,
  relation: null,
  additions: 1,
  deletions: 1,
  binary: false,
  modeChange: null,
  lifecycle: null,
  lines: [
    { id: 'hunk', kind: 'hunk', oldLine: null, newLine: null, text: '@@' },
    { id: 'context', kind: 'context', oldLine: 1, newLine: 1, text: 'const value =' },
    { id: 'deletion', kind: 'deletion', oldLine: 2, newLine: null, text: 'false' },
    { id: 'addition', kind: 'addition', oldLine: null, newLine: 2, text: 'true' },
    { id: 'marker', kind: 'no-newline-addition', oldLine: null, newLine: null, text: 'No newline' },
  ],
};

describe('diff syntax highlighting projection', () => {
  it('reconstructs old and new source streams without patch metadata', () => {
    expect(buildDiffSyntaxHighlightRequests([file])).toEqual([
      {
        code: 'const value =\nfalse',
        lineIds: ['context', 'deletion'],
        path: 'src/example.js',
      },
      {
        code: 'const value =\ntrue',
        lineIds: ['context', 'addition'],
        path: 'src/example.js',
      },
    ]);
  });

  it('maps theme-specific host tokens back to portable diff line ids', () => {
    const requests = buildDiffSyntaxHighlightRequests([file]);
    const token = (content: string, color: string) => ({
      color,
      content,
      fontStyle: 0,
    });
    const result = (first: string, second: string) => ({
      light: {
        language: 'javascript',
        theme: 'light' as const,
        lines: [[token('const value =', first)], [token('value', second)]],
      },
      dark: {
        language: 'javascript',
        theme: 'dark' as const,
        lines: [[token('const value =', '#FFFFFF')], [token('value', '#EEEEEE')]],
      },
    });
    const tokens = mergeDiffSyntaxHighlightResults({
      requests,
      results: [result('#111111', '#AA0000'), result('#222222', '#00AA00')],
      theme: 'light',
    });

    expect(tokens.context).toEqual([token('const value =', '#111111')]);
    expect(tokens.deletion).toEqual([token('value', '#AA0000')]);
    expect(tokens.addition).toEqual([token('value', '#00AA00')]);
    expect(tokens.hunk).toBeUndefined();
    expect(tokens.marker).toBeUndefined();
  });
});
