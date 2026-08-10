import githubSvg from '@synara-central-icons/github.svg?raw';
import globeSvg from '@synara-central-icons/globe-2.svg?raw';
import { useState } from '@lynx-js/react';

import { useTheme } from '../../adapters/useTheme.lynx';
import { colorizeLynxSvg } from '../../lib/themedSvg.lynx';
import {
  buildSiteFaviconUrl,
  isGitHubExternalLink,
} from './siteFavicon.lynx';

export function ExternalLinkIcon(props: { readonly url: string }) {
  const { svgColors } = useTheme();
  const faviconUrl = buildSiteFaviconUrl(props.url);
  const [faviconFailed, setFaviconFailed] = useState(false);
  if (isGitHubExternalLink(props.url)) {
    return (
      <svg
        className="MdLinkTargetIcon"
        content={colorizeLynxSvg(githubSvg, svgColors.mutedForeground)}
        accessibility-element={false}
      />
    );
  }
  if (faviconUrl && !faviconFailed) {
    return (
      <image
        className="MdLinkTargetIcon MdLinkTargetFavicon"
        src={faviconUrl}
        mode="aspectFit"
        accessibility-element={false}
        binderror={() => {
          'background only';
          setFaviconFailed(true);
        }}
      />
    );
  }
  return (
    <svg
      className="MdLinkTargetIcon"
      content={colorizeLynxSvg(globeSvg, svgColors.mutedForeground)}
      accessibility-element={false}
    />
  );
}
