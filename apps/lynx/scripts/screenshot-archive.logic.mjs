export function mergeScreenshotAssets({
  remoteImages,
  localImages,
  deletedRepoPaths = [],
}) {
  const deleted = new Set(deletedRepoPaths);
  const byRepoPath = new Map(
    remoteImages
      .filter((image) => !deleted.has(image.repoPath))
      .map((image) => [image.repoPath, { ...image, gitStatus: 'remote' }])
  );
  for (const image of localImages) {
    if (deleted.has(image.repoPath)) continue;
    byRepoPath.set(image.repoPath, image);
  }
  return [...byRepoPath.values()].sort((left, right) =>
    left.repoPath.localeCompare(right.repoPath)
  );
}

export function screenshotDays(images) {
  return [...new Set(images.map((image) => image.day))].sort();
}

const clientDirectoryNames = new Set([
  'browser',
  'lynx',
  'native',
  'native-closed',
  'native-tools',
  'normalized',
  'web',
]);

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

function storyDirectory(directory) {
  const parts = directory.split('/');
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

export function archiveDays(images, evidence) {
  return [
    ...new Set([
      ...images.map((image) => image.day),
      ...evidence.flatMap((entry) =>
        entry.sourceDay && entry.sourceDay !== entry.day
          ? [entry.day, entry.sourceDay]
          : [entry.day]
      ),
    ]),
  ].sort();
}

export function buildScreenshotStories({ images, evidence }) {
  const storyMap = new Map();
  const ensureStory = (day, directory) => {
    const normalizedDirectory = storyDirectory(directory);
    const key = `${day}/${normalizedDirectory}`;
    const story = storyMap.get(key) ?? {
      id: key.replaceAll('/', '--'),
      day,
      directory: normalizedDirectory,
      label: storyLabel(normalizedDirectory),
      images: [],
      evidence: [],
    };
    storyMap.set(key, story);
    return story;
  };

  for (const image of images) {
    ensureStory(image.day, image.directory).images.push({
      ...image,
      client: inferClient(image),
    });
  }
  for (const entry of evidence) {
    ensureStory(entry.day, entry.directory).evidence.push(entry);
  }

  return [...storyMap.values()]
    .map((story) => ({
      ...story,
      imageCount: story.images.length,
      evidenceCount: story.evidence.length,
      clients: [
        ...new Set([
          ...story.images.map((image) => image.client),
          ...(story.evidence.length ? ['evidence'] : []),
        ]),
      ],
      sequence:
        story.images.length >= 20 ||
        story.directory.includes('flicker-diagnostic'),
    }))
    .sort((left, right) =>
      `${left.day}/${left.directory}`.localeCompare(
        `${right.day}/${right.directory}`
      )
    );
}
