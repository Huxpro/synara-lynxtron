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
