export type ComposerModelPopupPanel = 'providers' | 'models';
export type ComposerModelPopupContent = 'providers' | 'loading' | 'models';

export function resolveComposerModelPopupContent(input: {
  readonly panel: ComposerModelPopupPanel;
  readonly modelsLoading: boolean;
}): ComposerModelPopupContent {
  if (input.panel === 'providers') return 'providers';
  return input.modelsLoading ? 'loading' : 'models';
}
