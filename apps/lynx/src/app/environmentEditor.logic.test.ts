import { describe, expect, it } from '@rstest/core';

import {
  environmentEditorOptions,
  resolveEnvironmentEditor,
} from './environmentEditor.logic';

describe('Environment editor projection', () => {
  it('keeps installed editors in the shared product order', () => {
    expect(environmentEditorOptions(['vscode', 'cursor'])).toEqual([
      { label: 'Cursor', value: 'cursor' },
      { label: 'VS Code', value: 'vscode' },
    ]);
  });

  it('uses the persisted editor only while it remains available', () => {
    const options = environmentEditorOptions(['cursor', 'vscode']);
    expect(resolveEnvironmentEditor(options, 'vscode')).toBe('vscode');
    expect(resolveEnvironmentEditor(options, 'zed')).toBe('cursor');
    expect(resolveEnvironmentEditor([], 'cursor')).toBeNull();
  });
});
