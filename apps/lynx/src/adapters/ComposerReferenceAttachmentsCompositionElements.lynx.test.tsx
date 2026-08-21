import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import {
  ComposerImageAttachmentElement,
  ComposerPastedTextAttachmentElement,
} from './ComposerReferenceAttachmentsCompositionElements.lynx';

function findElement(selector: string): Element {
  const element = elementTree.root?.querySelector(selector);
  if (!element) throw new Error(`expected ${selector}`);
  return element;
}

describe('composer reference attachment interaction contract', () => {
  it('uses canonical summary, file, remove, and disclosure icons', () => {
    const source = readFileSync(
      new URL(
        './ComposerReferenceAttachmentsCompositionElements.lynx.tsx',
        import.meta.url
      ),
      'utf8'
    );
    const styles = readFileSync(
      new URL('../components/composer/composer.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      '<MessageCircleIcon className="ComposerReferenceGlyphLynx" size={12} />'
    );
    expect(source).toContain(
      '<XIcon className="ComposerReferenceRemoveIconLynx" size={12} />'
    );
    expect(source).toContain(
      '<FileIcon className="ComposerReferenceTileIconLynx" size={16} />'
    );
    expect(source).toContain('<FileEntryIcon');
    expect(source).toContain('<ChevronRightIcon');
    expect(source).toContain('<CircleAlertIcon');
    expect(source).toContain(
      'accessibility-label="Draft attachment may not persist"'
    );
    expect(source).not.toContain(
      '<text className="ComposerReferenceImageWarningLynx">!</text>'
    );
    expect(source).not.toMatch(/[×◌≡▤]/);
    expect(styles).toMatch(
      /\.ComposerReferenceCardActionLynx\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*row;[^}]*gap:\s*2px;/s
    );
    expect(styles).toMatch(
      /\.ComposerReferenceCardActionLynx\.ui-pressed \.ComposerReferenceCardActionTextLynx\s*\{[^}]*color:\s*var\(--foreground\);/s
    );
    expect(styles).not.toMatch(
      /\.ComposerReference(?:CardAction|Remove|Image)Lynx\.ui-pressed\s*\{[^}]*opacity:/s
    );
    expect(source).toContain('tone="ghost"');
    expect(styles).toMatch(
      /\.ComposerReferenceRemoveLynx--ghost\s*\{[^}]*top:\s*2px;[^}]*right:\s*3px;[^}]*background-color:\s*transparent;/s
    );
    expect(styles).toMatch(
      /\.ComposerReferenceRemoveLynx--ghost \.ComposerReferenceRemoveIconLynx\s*\{[^}]*color:\s*var\(--muted-foreground\);/s
    );
    expect(styles).toMatch(
      /\.ComposerReferenceImageLynx\s*\{[^}]*border:\s*1px solid var\(--color-border-light\);[^}]*border-radius:\s*12px;[^}]*background-color:\s*var\(--color-background-elevated-secondary\);/s
    );
    expect(styles).toMatch(
      /\.ComposerReferenceImageWarningLynx\s*\{[^}]*left:\s*4px;[^}]*bottom:\s*4px;[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*border-radius:\s*10px;[^}]*background-color:\s*var\(--composer-surface\);/s
    );
  });

  it('gives the pasted-text show and remove actions canonical interaction state', () => {
    const onShowInTextField = rs.fn();
    const onRemove = rs.fn();

    render(
      <ComposerPastedTextAttachmentElement
        pastedText={{
          charCount: 11,
          id: 'paste-1',
          lineCount: 1,
          text: 'hello world',
        }}
        onShowInTextField={onShowInTextField}
        onRemove={onRemove}
      />
    );

    const show = findElement('.ComposerReferenceCardActionLynx');
    expect(show.getAttribute('focusable')).toBe('true');
    expect(show.getAttribute('accessibility-label')).toBe(
      'Show hello world in text field'
    );

    fireEvent(show, new Event('bindEvent:mouseenter', { bubbles: true }));
    expect(show.getAttribute('class')).toContain('ui-hover');
    fireEvent.mousedown(show);
    expect(show.getAttribute('class')).toContain('ui-pressed');
    fireEvent.mouseup(show);
    expect(show.getAttribute('class')).not.toContain('ui-pressed');
    fireEvent.focus(show);
    expect(show.getAttribute('class')).toContain('ui-focus');
    fireEvent.keydown(show, { key: 'Enter' });
    fireEvent.tap(show);
    expect(onShowInTextField).toHaveBeenCalledTimes(2);

    const remove = findElement('.ComposerReferenceRemoveLynx');
    expect(remove.getAttribute('focusable')).toBe('true');
    expect(remove.getAttribute('accessibility-label')).toBe(
      'Remove pasted text (11 chars)'
    );
    fireEvent.keydown(remove, { key: ' ' });
    fireEvent(remove, new Event('catchEvent:tap', { bubbles: true }));
    expect(onRemove).toHaveBeenCalledTimes(2);
  });

  it('keeps nested image removal separate from image preview activation', () => {
    const onExpandImage = rs.fn();
    const onRemoveImage = rs.fn();
    const image = {
      id: 'image-1',
      name: 'screen.png',
      previewUrl: 'data:image/png;base64,AA==',
    };

    render(
      <ComposerImageAttachmentElement
        image={image}
        images={[image]}
        nonPersisted={false}
        onExpandImage={onExpandImage}
        onRemoveImage={onRemoveImage}
      />
    );

    const preview = findElement('.ComposerReferenceImageLynx');
    expect(preview.getAttribute('focusable')).toBe('true');
    expect(preview.getAttribute('accessibility-label')).toBe(
      'Preview screen.png'
    );
    expect(
      preview.querySelector('.ComposerReferenceImagePreviewLynx')?.getAttribute(
        'accessibility-element'
      )
    ).toBe('false');
    fireEvent.tap(preview);
    expect(onExpandImage).toHaveBeenCalledTimes(1);
    expect(onExpandImage).toHaveBeenLastCalledWith({
      images: [{ src: image.previewUrl, name: image.name }],
      index: 0,
    });

    const remove = findElement('.ComposerReferenceRemoveLynx');
    fireEvent(remove, new Event('catchEvent:tap', { bubbles: true }));
    expect(onRemoveImage).toHaveBeenCalledWith(image.id);
    expect(onExpandImage).toHaveBeenCalledTimes(1);
  });

  it('names the non-persisted image warning without changing preview activation', () => {
    const image = {
      id: 'image-1',
      name: 'screen.png',
      previewUrl: 'data:image/png;base64,AA==',
    };

    render(
      <ComposerImageAttachmentElement
        image={image}
        images={[image]}
        nonPersisted={true}
        onExpandImage={() => {}}
        onRemoveImage={() => {}}
      />
    );

    const warning = findElement('.ComposerReferenceImageWarningLynx');
    expect(warning.getAttribute('accessibility-element')).toBe('true');
    expect(warning.getAttribute('accessibility-label')).toBe(
      'Draft attachment may not persist'
    );
    expect(
      warning.querySelector('.ComposerReferenceImageWarningIconLynx')
    ).not.toBeNull();
  });
});
