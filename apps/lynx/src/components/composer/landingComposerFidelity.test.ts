import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('landing composer fidelity contract', () => {
  it('uses the shared Web landing stack and composer frame without duplicate spacing', () => {
    const routerSource = readFileSync(
      new URL('../../app/router.tsx', import.meta.url),
      'utf8'
    );
    const landingStyles = readFileSync(
      new URL('./landing-composer.css', import.meta.url),
      'utf8'
    );
    const frameStyles = readFileSync(
      new URL(
        '../../adapters/composer-column-frame-surface-elements.css',
        import.meta.url
      ),
      'utf8'
    );

    expect(routerSource).toContain('<CenteredEmptyLandingStack>');
    expect(routerSource).toContain('<CenteredEmptyLanding />');
    expect(routerSource).toContain('<ComposerColumnFrameSurface>');
    expect(routerSource).toContain(
      '<LandingComposer onThreadCreated={props.onThreadCreated} />'
    );
    expect(landingStyles).not.toMatch(/\.LandingComposer\s*\{[^}]*margin-top:/s);
    expect(frameStyles).toMatch(
      /\.ComposerColumnFrameSurfaceLynx[^}]*max-width:\s*736px;/s
    );
  });
});
