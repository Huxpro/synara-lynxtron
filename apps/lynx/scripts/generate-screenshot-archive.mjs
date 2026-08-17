import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  mergeScreenshotAssets,
  screenshotDays,
} from './screenshot-archive.logic.mjs';

const scriptDirectory = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(scriptDirectory, '../../..');
const shotsRoot = resolve(repoRoot, 'shots');
const outputPath = resolve(
  shotsRoot,
  '2026-08-04/p10-perceptual-fidelity/screenshot-archive.js'
);
const assetManifestPath = resolve(
  shotsRoot,
  '2026-08-04/p10-perceptual-fidelity/screenshot-assets.json'
);
const assetBaseUrl =
  'https://raw.githubusercontent.com/Huxpro/synara-fidelity-assets/main';
const imageExtensions = new Set(['.jpeg', '.jpg', '.png']);
const clientDirectoryNames = new Set([
  'browser',
  'lynx',
  'native',
  'native-closed',
  'native-tools',
  'normalized',
  'web',
]);

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function gitFileSet(args) {
  const output = execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return new Set(output.split('\n').filter(Boolean));
}

const trackedFiles = gitFileSet(['ls-files', '--', 'shots']);
const untrackedFiles = gitFileSet([
  'ls-files',
  '--others',
  '--exclude-standard',
  '--',
  'shots',
]);
const deletedFiles = gitFileSet([
  'diff',
  '--name-only',
  '--diff-filter=D',
  'HEAD',
  '--',
  'shots',
]);

const localImages = listFiles(shotsRoot)
  .filter((absolutePath) =>
    imageExtensions.has(extname(absolutePath).toLowerCase())
  );
const discoveredImages = localImages
  .map((absolutePath) => {
    const repoPath = relative(repoRoot, absolutePath).split(sep).join('/');
    const [, day, ...pathParts] = repoPath.split('/');
    if (
      !/^\d{4}-\d{2}-\d{2}$/u.test(day) ||
      !imageExtensions.has(extname(repoPath).toLowerCase())
    ) {
      return null;
    }
    const directory = pathParts.slice(0, -1).join('/') || '.';
    return {
      day,
      directory,
      name: pathParts.at(-1),
      path: `${assetBaseUrl}/${repoPath}`,
      repoPath,
      bytes: statSync(absolutePath).size,
      gitStatus: trackedFiles.has(repoPath)
        ? 'tracked'
        : untrackedFiles.has(repoPath)
          ? 'untracked'
          : 'ignored',
    };
  })
  .filter(Boolean)
  .sort((left, right) => left.repoPath.localeCompare(right.repoPath));
if (!discoveredImages.length && !existsSync(assetManifestPath)) {
  throw new Error('No local screenshots or screenshot-assets.json manifest found');
}
const remoteImages = existsSync(assetManifestPath)
  ? JSON.parse(readFileSync(assetManifestPath, 'utf8')).images
  : [];
const images = mergeScreenshotAssets({
  remoteImages,
  localImages: discoveredImages,
  deletedRepoPaths: deletedFiles,
});

if (images.length) {
  writeFileSync(
    assetManifestPath,
    `${JSON.stringify(
      {
        version: 1,
        assetBaseUrl,
        imageCount: images.length,
        byteCount: images.reduce((total, image) => total + image.bytes, 0),
        images: images.map(({ gitStatus: _gitStatus, ...image }) => image),
      },
      null,
      2
    )}\n`
  );
}

const days = screenshotDays(images).map((day) => {
  const dayImages = images.filter((image) => image.day === day);
  const directories = new Map();
  for (const image of dayImages) {
    const entries = directories.get(image.directory) ?? [];
    entries.push(image);
    directories.set(image.directory, entries);
  }
  return {
    day,
    imageCount: dayImages.length,
    byteCount: dayImages.reduce((total, image) => total + image.bytes, 0),
    trackedCount: dayImages.filter((image) => image.gitStatus === 'tracked').length,
    untrackedCount: dayImages.filter((image) => image.gitStatus === 'untracked').length,
    remoteCount: dayImages.filter((image) => image.gitStatus === 'remote').length,
    directories: [...directories]
      .map(([directory, directoryImages]) => ({
        directory,
        imageCount: directoryImages.length,
        images: directoryImages,
      }))
      .sort((left, right) => left.directory.localeCompare(right.directory)),
  };
});

function inferClient(image) {
  const path = image.repoPath.toLowerCase();
  const name = image.name.toLowerCase();
  if (
    path.includes('/native/') ||
    name.startsWith('native') ||
    name.includes('-native')
  ) {
    return 'native';
  }
  if (
    path.includes('/lynx/') ||
    name.startsWith('lynx') ||
    name.includes('-lynx')
  ) {
    return 'lynx';
  }
  if (
    path.includes('/web/') ||
    name.startsWith('web') ||
    name.includes('-web')
  ) {
    return 'web';
  }
  return 'evidence';
}

function storyDirectory(image) {
  const parts = image.directory.split('/');
  const lastPart = parts.at(-1);
  if (lastPart && clientDirectoryNames.has(lastPart)) parts.pop();
  if (parts[0] === 'p8-q2' && parts[1] === 'native') parts.splice(1, 1);
  return parts.join('/');
}

function storyLabel(directory) {
  return directory
    .split('/')
    .map((part) =>
      part
        .replaceAll('-', ' ')
        .replace(/\b\w/gu, (letter) => letter.toUpperCase())
    )
    .join(' · ');
}

const storyMap = new Map();
for (const image of images) {
  const directory = storyDirectory(image);
  const key = `${image.day}/${directory}`;
  const story = storyMap.get(key) ?? {
    id: key.replaceAll('/', '--'),
    day: image.day,
    directory,
    label: storyLabel(directory),
    images: [],
  };
  story.images.push({ ...image, client: inferClient(image) });
  storyMap.set(key, story);
}

const stories = [...storyMap.values()]
  .map((story) => ({
    ...story,
    imageCount: story.images.length,
    clients: [...new Set(story.images.map((image) => image.client))],
    sequence:
      story.images.length >= 20 ||
      story.directory.includes('flicker-diagnostic'),
  }))
  .sort((left, right) =>
    `${left.day}/${left.directory}`.localeCompare(
      `${right.day}/${right.directory}`
    )
  );

const archive = {
  version: 1,
  assetBaseUrl,
  range: {
    firstDay: days.at(0)?.day ?? null,
    lastDay: days.at(-1)?.day ?? null,
    consecutiveCalendarDays: days.filter((day) => day.imageCount > 0).length,
  },
  imageCount: images.length,
  byteCount: images.reduce((total, image) => total + image.bytes, 0),
  trackedCount: images.filter((image) => image.gitStatus === 'tracked').length,
  untrackedCount: images.filter((image) => image.gitStatus === 'untracked').length,
  remoteCount: images.filter((image) => image.gitStatus === 'remote').length,
  storyCount: stories.length,
  stories,
  days,
};

writeFileSync(
  outputPath,
  `globalThis.__SYNARA_SCREENSHOT_ARCHIVE__ = ${JSON.stringify(archive, null, 2)};\n`
);

console.log(
  `Indexed ${archive.imageCount} screenshots across ${archive.range.consecutiveCalendarDays} days in ${relative(repoRoot, outputPath)}`
);
