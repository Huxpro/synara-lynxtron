import { beforeEach, describe, expect, it } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';

import { ExternalLinkIcon } from './ExternalLinkIcon.lynx';

beforeEach(() => {
  process.env.SYNARA_WS_URL = 'ws://127.0.0.1:58090';
});

describe('Lynx markdown external-link icon', () => {
  it('uses the shared GitHub mark for GitHub links', () => {
    render(<ExternalLinkIcon url="https://github.com/openai/codex" />);

    expect(elementTree.root?.querySelector('.MdLinkTargetIcon')).not.toBeNull();
    expect(
      elementTree.root?.querySelector('.MdLinkTargetFavicon')
    ).toBeNull();
  });

  it('loads the site favicon and falls back to the shared globe on error', () => {
    render(<ExternalLinkIcon url="https://openai.com/research" />);

    const favicon = elementTree.root?.querySelector('.MdLinkTargetFavicon');
    expect(favicon?.getAttribute('src')).toBe(
      'http://127.0.0.1:58090/api/site-favicon?domain=openai.com'
    );
    fireEvent(favicon!, new Event('bindEvent:error', { bubbles: true }));
    expect(
      elementTree.root?.querySelector('.MdLinkTargetFavicon')
    ).toBeNull();
    expect(elementTree.root?.querySelector('.MdLinkTargetIcon')).not.toBeNull();
  });
});
