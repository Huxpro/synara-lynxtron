export type ComponentLabRenderer = "electron" | "lynx";

export type ComponentLabTheme = "light" | "dark";

export interface ComponentLabViewport {
  readonly height: number;
  readonly id: string;
  readonly width: number;
}

export interface ComponentLabRendererEntry {
  readonly component: string;
  readonly consumers: readonly string[];
  readonly module: string;
  readonly renderer: ComponentLabRenderer;
}

export interface ComponentLabPlatformDelta {
  readonly evidence: string;
  readonly rationale: string;
  readonly renderer: ComponentLabRenderer;
}

export interface ComponentLabStory {
  readonly category: string;
  readonly fixtureId: string;
  readonly id: string;
  readonly owner: string;
  readonly renderers: Readonly<Record<ComponentLabRenderer, ComponentLabRendererEntry>>;
  readonly states: readonly string[];
  readonly themes: readonly ComponentLabTheme[];
  readonly title: string;
  readonly variants: readonly string[];
  readonly viewports: readonly ComponentLabViewport[];
  readonly cases?: readonly { readonly state: string; readonly variant: string }[];
  readonly platformDeltas?: readonly ComponentLabPlatformDelta[];
}
