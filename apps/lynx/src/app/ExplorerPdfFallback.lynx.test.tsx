import { describe, expect, it } from '@rstest/core';
import { fireEvent, render, waitFor } from '@lynx-js/react/testing-library';

import { ExplorerPdfFallback } from './ExplorerPdfFallback.lynx';

function renderPdf() {
  render(
    <ExplorerPdfFallback
      path="docs/report.pdf"
      workspaceRoot="/workspace"
      metadataError={false}
      metadataPending={false}
      pageCount={3}
      pageWidth={300}
      pageHeight={180}
      previewError={false}
      previewPending={false}
      previewUrl="http://localhost/local-preview?path=docs%2Freport.pdf"
    />
  );
}

function pageImage(): Element {
  const image = elementTree.root?.querySelector('.ExplorerDockPdfPageImage');
  if (!image) throw new Error('expected rendered PDF page');
  return image;
}

describe('Lynx PDF fallback', () => {
  it('fits to the measured viewport and changes the real raster/image size', () => {
    renderPdf();
    const frame = elementTree.root?.querySelector('.ExplorerDockPdfPageFrame');
    if (!frame) throw new Error('expected PDF viewport');
    const layoutEvent = new Event('bindEvent:layoutchange', { bubbles: true });
    Object.assign(layoutEvent, {
      detail: { width: 648, height: 408 },
    });
    fireEvent(frame, layoutEvent);

    expect(pageImage().getAttribute('style')).toContain('width: 600px');
    expect(pageImage().getAttribute('style')).toContain('height: 360px');
    expect(pageImage().getAttribute('src')).toContain('width=600');
    expect(
      elementTree.root?.querySelector('.ExplorerDockPdfZoomPercent')?.textContent
    ).toBe('200%');

    fireEvent.tap(
      elementTree.root?.querySelectorAll('.ExplorerDockPdfZoomStep')[1]!
    );
    expect(pageImage().getAttribute('style')).toContain('width: 750px');
    expect(pageImage().getAttribute('src')).toContain('width=750');
  });

  it('keeps page navigation and zoom controls available together', () => {
    renderPdf();
    fireEvent.tap(elementTree.root?.querySelector('.ExplorerDockPdfNext')!);
    expect(
      elementTree.root?.querySelector('.ExplorerDockPdfPageInputValue')?.textContent
    ).toBe('2');
    expect(
      elementTree.root?.querySelector('.ExplorerDockPdfPageTotal')?.textContent
    ).toBe('/ 3');
    expect(pageImage().getAttribute('src')).toContain('page=2');
    expect(
      elementTree.root?.querySelector('.ExplorerDockPdfZoomMenuTrigger')
    ).not.toBeNull();
  });

  it('applies Fit page through the real zoom menu', async () => {
    renderPdf();
    const frame = elementTree.root?.querySelector('.ExplorerDockPdfPageFrame');
    const trigger = elementTree.root?.querySelector(
      '.ExplorerDockPdfZoomMenuTrigger'
    );
    if (!frame || !trigger) throw new Error('expected PDF controls');
    const frameLayout = new Event('bindEvent:layoutchange', { bubbles: true });
    Object.assign(frameLayout, { detail: { width: 648, height: 228 } });
    fireEvent(frame, frameLayout);
    const triggerLayout = new Event('bindEvent:layoutchange', { bubbles: true });
    Object.assign(triggerLayout, {
      detail: { width: 66, height: 28, left: 500, top: 10 },
    });
    fireEvent(trigger, triggerLayout);
    fireEvent.tap(trigger);
    const fitPage = await waitFor(() => {
      const items = elementTree.root?.querySelectorAll('.LxMenuItem') ?? [];
      const item = Array.from(items).find(
        (candidate) => candidate.textContent === 'Fit page'
      );
      if (!item) throw new Error('expected Fit page menu item');
      return item;
    });
    fireEvent.tap(fitPage);

    expect(
      elementTree.root?.querySelector('.ExplorerDockPdfZoomPercent')?.textContent
    ).toBe('100%');
    expect(pageImage().getAttribute('style')).toContain('width: 300px');
    expect(pageImage().getAttribute('style')).toContain('height: 180px');
  });
});
