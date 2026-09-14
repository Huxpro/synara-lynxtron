import {
  getAttachmentIconName,
  getFileIconColor,
  getFileIconName,
} from '@synara-web/file-icons';

import audioSvg from '@synara-central-icons/audio.svg?raw';
import bunSvg from '@synara-central-icons/bun.svg?raw';
import cSvg from '@synara-central-icons/c.svg?raw';
import calendarSvg from '@synara-central-icons/calendar-days.svg?raw';
import cmdSvg from '@synara-central-icons/cmd.svg?raw';
import codeBracketsSvg from '@synara-central-icons/code-brackets.svg?raw';
import fileChartSvg from '@synara-central-icons/file-chart.svg?raw';
import fileJpgSvg from '@synara-central-icons/file-jpg.svg?raw';
import filePdfSvg from '@synara-central-icons/file-pdf.svg?raw';
import filePngSvg from '@synara-central-icons/file-png.svg?raw';
import fileTextSvg from '@synara-central-icons/file-text.svg?raw';
import fileZipSvg from '@synara-central-icons/file-zip.svg?raw';
import gitSvg from '@synara-central-icons/git.svg?raw';
import imageSvg from '@synara-central-icons/image-alt-text.svg?raw';
import javaSvg from '@synara-central-icons/java.svg?raw';
import javascriptSvg from '@synara-central-icons/javascript.svg?raw';
import jsonSvg from '@synara-central-icons/json.svg?raw';
import lockSvg from '@synara-central-icons/lock.svg?raw';
import markdownSvg from '@synara-central-icons/markdown.svg?raw';
import npmSvg from '@synara-central-icons/npm.svg?raw';
import pageTextSvg from '@synara-central-icons/page-text.svg?raw';
import phpSvg from '@synara-central-icons/php.svg?raw';
import pythonSvg from '@synara-central-icons/phyton.svg?raw';
import reactSvg from '@synara-central-icons/react.svg?raw';
import rustSvg from '@synara-central-icons/rust.svg?raw';
import settingsSvg from '@synara-central-icons/settings-gear-1.svg?raw';
import svelteSvg from '@synara-central-icons/svelte.svg?raw';
import typescriptSvg from '@synara-central-icons/typescript.svg?raw';
import vercelSvg from '@synara-central-icons/vercel.svg?raw';
import videoSvg from '@synara-central-icons/video.svg?raw';
import vueSvg from '@synara-central-icons/vue.svg?raw';

import { useTheme } from '../adapters/useTheme.lynx';
import {
  colorizeLynxSvg,
  resolveLynxSvgColor,
} from '../lib/themedSvg.lynx';

const FILE_ICON_SVG_BY_NAME: Readonly<Record<string, string>> = {
  audio: audioSvg,
  bun: bunSvg,
  c: cSvg,
  'calendar-days': calendarSvg,
  cmd: cmdSvg,
  'code-brackets': codeBracketsSvg,
  'file-chart': fileChartSvg,
  'file-jpg': fileJpgSvg,
  'file-pdf': filePdfSvg,
  'file-png': filePngSvg,
  'file-text': fileTextSvg,
  'file-zip': fileZipSvg,
  git: gitSvg,
  'image-alt-text': imageSvg,
  java: javaSvg,
  javascript: javascriptSvg,
  json: jsonSvg,
  lock: lockSvg,
  markdown: markdownSvg,
  npm: npmSvg,
  'page-text': pageTextSvg,
  php: phpSvg,
  phyton: pythonSvg,
  react: reactSvg,
  rust: rustSvg,
  'settings-gear-1': settingsSvg,
  svelte: svelteSvg,
  typescript: typescriptSvg,
  vercel: vercelSvg,
  video: videoSvg,
  vue: vueSvg,
};

export function FileEntryIcon(props: {
  readonly className?: string;
  readonly colorMode?: 'file' | 'inherit';
  readonly kind?: 'file' | 'directory';
  readonly mimeType?: string | null;
  readonly pathValue: string;
}) {
  const { svgColors } = useTheme();
  const iconName =
    props.mimeType === undefined
      ? getFileIconName(props.pathValue)
      : getAttachmentIconName({
          name: props.pathValue,
          mimeType: props.mimeType,
        });
  const svg = FILE_ICON_SVG_BY_NAME[iconName] ?? codeBracketsSvg;
  const color =
    props.colorMode === 'inherit'
      ? svgColors.iconSecondary
      : resolveLynxSvgColor(getFileIconColor(iconName), svgColors);
  return (
    <svg
      className={props.className}
      content={colorizeLynxSvg(svg, color)}
    />
  );
}
