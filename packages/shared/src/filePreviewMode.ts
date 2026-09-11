export type FilePreviewMode = 'source' | 'preview';

export function isMarkdownPreviewablePath(filePath: string): boolean {
  return /\.(?:markdown|md|mdx)$/i.test(filePath);
}

export function defaultFilePreviewMode(input: {
  readonly filePath: string;
  readonly presentation: 'dock' | 'editor';
}): FilePreviewMode {
  if (!isMarkdownPreviewablePath(input.filePath)) return 'source';
  return input.presentation === 'dock' ? 'preview' : 'source';
}

export function resolveFilePreviewMode(input: {
  readonly defaultMode: FilePreviewMode;
  readonly filePath: string;
  readonly override: { readonly filePath: string; readonly mode: FilePreviewMode } | null;
}): FilePreviewMode {
  return input.override?.filePath === input.filePath
    ? input.override.mode
    : input.defaultMode;
}
