export type LynxWebInteractionEvent =
  | {
      readonly kind: 'explorer-visibility';
      readonly open: boolean;
    }
  | {
      readonly kind: 'environment-visibility';
      readonly open: boolean;
    }
  | {
      readonly kind: 'explorer-navigation';
      readonly expandedDirectory?: {
        readonly open: boolean;
        readonly path: string;
      };
      readonly path?: string;
      readonly query?: string;
    }
  | {
      readonly kind: 'explorer-resize';
      readonly width: number;
    }
  | {
      readonly kind: 'explorer-preview-menu';
      readonly path: string;
    }
  | {
      readonly kind: 'explorer-comment-line';
      readonly lineNumber: number;
    }
  | {
      readonly kind: 'composer-model-menu';
      readonly provider?: string;
    };
