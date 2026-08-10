import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import { ExpandedImageOverlay } from './ExpandedImageOverlay.lynx';

function findElement(selector: string): Element {
  const element = elementTree.root?.querySelector(selector);
  if (!element) throw new Error(`expected ${selector}`);
  return element;
}

describe('Native expanded image overlay fidelity', () => {
  it('renders nothing without a selected image', () => {
    render(
      <ExpandedImageOverlay
        expandedImage={null}
        onClose={() => undefined}
        onNavigate={() => undefined}
      />
    );

    expect(
      elementTree.root?.querySelector('.ComposerExpandedImageOverlay')
    ).toBeNull();
  });

  it('matches Web selected-image, count, navigation, and close behavior', () => {
    const onClose = rs.fn();
    const onNavigate = rs.fn();
    render(
      <ExpandedImageOverlay
        expandedImage={{
          images: [
            { src: 'data:image/png;base64,first', name: 'First image' },
            { src: 'data:image/png;base64,second', name: 'Second image' },
            { src: 'data:image/png;base64,third', name: 'Third image' },
          ],
          index: 1,
        }}
        onClose={onClose}
        onNavigate={onNavigate}
      />
    );

    const overlay = findElement('.ComposerExpandedImageOverlay');
    expect(overlay.getAttribute('role')).toBe('dialog');
    expect(overlay.getAttribute('aria-modal')).toBe('true');
    expect(overlay.getAttribute('aria-label')).toBe('Expanded image preview');
    expect(overlay.getAttribute('accessibility-element')).toBeNull();

    const image = findElement('.ComposerExpandedImage');
    expect(image.getAttribute('src')).toBe(
      'data:image/png;base64,second'
    );
    expect(image.getAttribute('accessibility-label')).toBe('Second image');
    expect(
      findElement('.ComposerExpandedImageNavigate--previous').getAttribute(
        'accessibility-label'
      )
    ).toBe('Previous image');
    expect(
      findElement('.ComposerExpandedImageNavigate--next').getAttribute(
        'accessibility-label'
      )
    ).toBe('Next image');
    expect(
      findElement('.ComposerExpandedImageClose').getAttribute(
        'accessibility-label'
      )
    ).toBe('Close image preview');
    expect(findElement('.ComposerExpandedImageName').textContent).toBe(
      'Second image (2/3)'
    );

    fireEvent.tap(
      findElement('.ComposerExpandedImageNavigate--previous')
    );
    fireEvent.tap(findElement('.ComposerExpandedImageNavigate--next'));
    fireEvent.keydown(overlay, { key: 'ArrowLeft' });
    fireEvent.keydown(overlay, { key: 'ArrowRight' });
    fireEvent.keydown(overlay, { key: 'Escape' });
    fireEvent.tap(findElement('.ComposerExpandedImageClose'));
    fireEvent.tap(findElement('.ComposerExpandedImageBackdrop'));

    expect(onNavigate).toHaveBeenNthCalledWith(1, -1);
    expect(onNavigate).toHaveBeenNthCalledWith(2, 1);
    expect(onNavigate).toHaveBeenNthCalledWith(3, -1);
    expect(onNavigate).toHaveBeenNthCalledWith(4, 1);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('hides navigation for one image and preserves Web overlay optics', () => {
    render(
      <ExpandedImageOverlay
        expandedImage={{
          images: [
            { src: 'data:image/png;base64,only', name: 'Only image' },
          ],
          index: 0,
        }}
        onClose={() => undefined}
        onNavigate={() => undefined}
      />
    );

    expect(
      elementTree.root?.querySelector('.ComposerExpandedImageNavigate')
    ).toBeNull();
    expect(findElement('.ComposerExpandedImageName').textContent).toBe(
      'Only image'
    );

    const styles = readFileSync(
      new URL('./composer.css', import.meta.url),
      'utf8'
    );
    expect(styles).toMatch(
      /\.ComposerExpandedImageBackdropFill\s*\{[^}]*background-color:\s*rgba\(0,\s*0,\s*0,\s*0\.75\);/s
    );
    expect(styles).toMatch(
      /\.ComposerExpandedImageFrame\s*\{[^}]*border:\s*1px solid var\(--color-border\);[^}]*border-radius:\s*8px;[^}]*background-color:\s*var\(--color-background-elevated-primary-opaque\);/s
    );
    expect(styles).toMatch(
      /\.ComposerExpandedImageClose\s*\{[^}]*top:\s*8px;[^}]*right:\s*8px;[^}]*width:\s*24px;[^}]*height:\s*24px;/s
    );
    expect(styles).toMatch(
      /\.ComposerExpandedImageNavigate\s*\{[^}]*width:\s*36px;[^}]*height:\s*36px;/s
    );
    expect(styles).toMatch(
      /\.ComposerExpandedImageName\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;[^}]*text-align:\s*center;/s
    );
  });
});
