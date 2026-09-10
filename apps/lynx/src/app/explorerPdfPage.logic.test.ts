import { describe, expect, it } from '@rstest/core';

import { clampExplorerPdfPage } from './explorerPdfPage.logic';

describe('Explorer PDF page navigation', () => {
  it('clamps typed page numbers and preserves the current page for invalid input', () => {
    expect(clampExplorerPdfPage({ currentPage: 2, pageCount: 5, value: '4' })).toBe(4);
    expect(clampExplorerPdfPage({ currentPage: 2, pageCount: 5, value: '99' })).toBe(5);
    expect(clampExplorerPdfPage({ currentPage: 2, pageCount: 5, value: '0' })).toBe(1);
    expect(clampExplorerPdfPage({ currentPage: 2, pageCount: 5, value: '' })).toBe(2);
  });
});
