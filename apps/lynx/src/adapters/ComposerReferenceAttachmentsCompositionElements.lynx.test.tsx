import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';

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
});
