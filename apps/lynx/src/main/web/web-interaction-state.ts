const WEB_HOVER_CLASS = 'ui-hover';
const WEB_FOCUS_CLASS = 'ui-focus';
const ENVIRONMENT_TOGGLE_SELECTOR = '.EnvironmentToggle';
const EXPLORER_TOGGLE_SELECTOR = '.ThreadFilesToggle';
const EXPLORER_ENTRY_SELECTOR = '.ExplorerDockEntry';
const FILE_REFERENCE_SELECTOR = '.MdInlineToken--file, .MdInlineToken--mention';
const EXPLORER_PREVIEW_ACTION_TRIGGER_SELECTOR =
  '.ExplorerDockPreviewActions';
const EXPLORER_COMMENT_LINE_SELECTOR = '.ExplorerDockSyntaxLineNumber';
const EXPLORER_SEARCH_SELECTOR = '.ExplorerDockSearchInput';
const RIGHT_PANEL_RESIZE_SASH_SELECTOR = '.RightPanelResizeSash';
const COMPOSER_MODEL_TRIGGER_SELECTOR = '.ComposerModelTriggerLynx';
const COMPOSER_PROVIDER_OPTION_SELECTOR = '.ComposerProviderOptionLynx';
const LYNX_FOCUSABLE_SELECTOR = '[focusable="true"]';

export interface LynxWebExplorerActivation {
  readonly open: boolean;
}

export interface LynxWebEnvironmentActivation {
  readonly open: boolean;
}

export interface LynxWebExplorerNavigation {
  readonly expandedDirectory?: {
    readonly open: boolean;
    readonly path: string;
  };
  readonly path?: string;
  readonly query?: string;
}

export interface LynxWebRightPanelResize {
  readonly panel: string;
  readonly width: number;
}

export interface LynxWebExplorerPreviewAction {
  readonly action: 'toggle-menu';
  readonly path: string;
}

export interface LynxWebExplorerCommentLine {
  readonly lineNumber: number;
}

export interface LynxWebComposerModelMenuActivation {
  readonly open: true;
  readonly provider?: string;
}

function interactiveElement(
  event: Event,
  allowHoverOwner: boolean
): HTMLElement | null {
  for (const target of event.composedPath()) {
    if (
      target instanceof HTMLElement &&
      (target.getAttribute('focusable') === 'true' ||
        (allowHoverOwner &&
          target.classList.contains('LynxWebHoverOwner')))
    ) {
      return target;
    }
  }
  return null;
}

function relatedTargetIsInside(
  element: HTMLElement,
  event: MouseEvent | FocusEvent
): boolean {
  return (
    event.relatedTarget instanceof Node &&
    element.contains(event.relatedTarget)
  );
}

export function installLynxWebInteractionStateBridge(
  root: ShadowRoot,
  signal?: AbortSignal,
  onExplorerActivation?: (activation: LynxWebExplorerActivation) => void,
  onEnvironmentActivation?: (
    activation: LynxWebEnvironmentActivation
  ) => void,
  onExplorerNavigation?: (navigation: LynxWebExplorerNavigation) => void,
  onRightPanelResize?: (resize: LynxWebRightPanelResize) => void,
  onExplorerPreviewAction?: (
    action: LynxWebExplorerPreviewAction
  ) => void,
  onExplorerCommentLine?: (
    commentLine: LynxWebExplorerCommentLine
  ) => void,
  onComposerModelMenuActivation?: (
    activation: LynxWebComposerModelMenuActivation
  ) => void
): void {
  const hostHoverClasses = new WeakSet<HTMLElement>();
  const hostFocusClasses = new WeakSet<HTMLElement>();
  const hostTabStops = new WeakSet<HTMLElement>();
  const listenerOptions = signal ? { signal } : undefined;
  let resize:
    | {
        readonly panel: HTMLElement;
        readonly panelName: string;
        readonly startWidth: number;
        readonly startX: number;
      }
    | null = null;
  let fileReferencePointer:
    | {
        readonly path: string;
        readonly startX: number;
        readonly startY: number;
      }
    | null = null;
  let explorerPreviewActionPointer:
    | {
        readonly action: LynxWebExplorerPreviewAction['action'];
        readonly path: string;
        readonly startX: number;
        readonly startY: number;
      }
    | null = null;
  let explorerCommentLinePointer:
    | {
        readonly lineNumber: number;
        readonly startX: number;
        readonly startY: number;
      }
    | null = null;
  let composerModelPointer:
    | {
        readonly provider?: string;
        readonly startX: number;
        readonly startY: number;
      }
    | null = null;
  const syncTabStop = (element: HTMLElement) => {
    if (element.matches(LYNX_FOCUSABLE_SELECTOR)) {
      if (!element.hasAttribute('tabindex')) {
        element.tabIndex = 0;
        hostTabStops.add(element);
      }
      return;
    }
    if (hostTabStops.has(element)) {
      element.removeAttribute('tabindex');
      hostTabStops.delete(element);
    }
  };
  const syncTree = (node: Node) => {
    if (!(node instanceof HTMLElement)) return;
    syncTabStop(node);
    for (const element of node.querySelectorAll<HTMLElement>(
      LYNX_FOCUSABLE_SELECTOR
    )) {
      syncTabStop(element);
    }
  };
  for (const element of root.querySelectorAll<HTMLElement>(
    LYNX_FOCUSABLE_SELECTOR
  )) {
    syncTabStop(element);
  }
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') {
        syncTabStop(record.target as HTMLElement);
        continue;
      }
      for (const node of record.addedNodes) syncTree(node);
    }
  });
  observer.observe(root, {
    attributes: true,
    attributeFilter: ['focusable'],
    childList: true,
    subtree: true,
  });
  signal?.addEventListener('abort', () => observer.disconnect(), { once: true });

  root.addEventListener(
    'mouseover',
    (event) => {
      const element = interactiveElement(event, true);
      if (!element || relatedTargetIsInside(element, event as MouseEvent)) {
        return;
      }
      if (!element.classList.contains(WEB_HOVER_CLASS)) {
        element.classList.add(WEB_HOVER_CLASS);
        hostHoverClasses.add(element);
      }
    },
    listenerOptions
  );
  root.addEventListener(
    'mouseout',
    (event) => {
      const element = interactiveElement(event, true);
      if (
        !element ||
        relatedTargetIsInside(element, event as MouseEvent) ||
        !hostHoverClasses.has(element)
      ) {
        return;
      }
      element.classList.remove(WEB_HOVER_CLASS);
      hostHoverClasses.delete(element);
    },
    listenerOptions
  );
  root.addEventListener(
    'focusin',
    (event) => {
      const element = interactiveElement(event, false);
      if (!element || relatedTargetIsInside(element, event as FocusEvent)) {
        return;
      }
      if (!element.classList.contains(WEB_FOCUS_CLASS)) {
        element.classList.add(WEB_FOCUS_CLASS);
        hostFocusClasses.add(element);
      }
    },
    listenerOptions
  );
  root.addEventListener(
    'focusout',
    (event) => {
      const element = interactiveElement(event, false);
      if (
        !element ||
        relatedTargetIsInside(element, event as FocusEvent) ||
        !hostFocusClasses.has(element)
      ) {
        return;
      }
      element.classList.remove(WEB_FOCUS_CLASS);
      hostFocusClasses.delete(element);
    },
    listenerOptions
  );
  root.addEventListener(
    'mousedown',
    (event) => {
      if (event instanceof MouseEvent && event.button === 0) {
        const composerModelTrigger = event
          .composedPath()
          .find(
            (target): target is HTMLElement =>
              target instanceof HTMLElement &&
              target.matches(COMPOSER_MODEL_TRIGGER_SELECTOR)
          );
        if (
          composerModelTrigger &&
          composerModelTrigger.getAttribute('aria-disabled') !== 'true'
        ) {
          composerModelPointer = {
            startX: event.clientX,
            startY: event.clientY,
          };
        }
        const composerProviderOption = event
          .composedPath()
          .find(
            (target): target is HTMLElement =>
              target instanceof HTMLElement &&
              target.matches(COMPOSER_PROVIDER_OPTION_SELECTOR)
          );
        const composerProvider =
          composerProviderOption?.getAttribute('data-provider') ?? '';
        if (
          composerProviderOption &&
          composerProvider &&
          composerProviderOption.getAttribute('aria-disabled') !== 'true'
        ) {
          composerModelPointer = {
            provider: composerProvider,
            startX: event.clientX,
            startY: event.clientY,
          };
        }
        const commentLineTarget = event
          .composedPath()
          .find(
            (target): target is HTMLElement =>
              target instanceof HTMLElement &&
              target.matches(EXPLORER_COMMENT_LINE_SELECTOR)
          );
        const commentLineLabel =
          commentLineTarget?.getAttribute('accessibility-label') ?? '';
        const commentLineMatch = /^Comment on line (\d+)$/.exec(
          commentLineLabel
        );
        if (commentLineMatch) {
          explorerCommentLinePointer = {
            lineNumber: Number(commentLineMatch[1]),
            startX: event.clientX,
            startY: event.clientY,
          };
        }
        const previewActionTarget = event
          .composedPath()
          .find(
            (target): target is HTMLElement =>
              target instanceof HTMLElement &&
              target.matches(EXPLORER_PREVIEW_ACTION_TRIGGER_SELECTOR)
          );
        const previewHeader = previewActionTarget?.closest<HTMLElement>(
          '.ExplorerDockPreviewHeader'
        );
        const previewHeaderLabel =
          previewHeader?.getAttribute('accessibility-label') ?? '';
        const path = previewHeaderLabel.startsWith('File path ')
          ? previewHeaderLabel.slice('File path '.length).trim()
          : '';
        if (previewActionTarget && path) {
          explorerPreviewActionPointer = {
            action: 'toggle-menu',
            path,
            startX: event.clientX,
            startY: event.clientY,
          };
        }
        const fileReference = event
          .composedPath()
          .find(
            (target): target is HTMLElement =>
              target instanceof HTMLElement &&
              target.matches(FILE_REFERENCE_SELECTOR)
          );
        const label =
          fileReference?.getAttribute('accessibility-label') ?? '';
        if (
          fileReference?.getAttribute('aria-disabled') !== 'true' &&
          label.startsWith('Open ') &&
          label.length > 5
        ) {
          fileReferencePointer = {
            path: label.slice(5),
            startX: event.clientX,
            startY: event.clientY,
          };
        }
      }
      if (
        !onRightPanelResize ||
        !(event instanceof MouseEvent) ||
        event.button !== 0
      ) {
        return;
      }
      const sash = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(RIGHT_PANEL_RESIZE_SASH_SELECTOR)
        );
      const panel = sash?.parentElement;
      if (!panel?.classList.contains('ExplorerDock')) return;
      resize = {
        panel,
        panelName: 'ExplorerDock',
        startWidth:
          panel.getBoundingClientRect().width ||
          Number.parseFloat(panel.style.width) ||
          0,
        startX: event.clientX,
      };
      event.preventDefault();
    },
    listenerOptions
  );
  root.addEventListener(
    'mousemove',
    (event) => {
      if (!resize || !(event instanceof MouseEvent)) return;
      const min = 480;
      const max = 960;
      const mainMin = 320;
      const viewportMax = Math.max(min, globalThis.innerWidth - mainMin);
      const width = Math.max(
        min,
        Math.min(
          resize.startWidth + resize.startX - event.clientX,
          max,
          viewportMax
        )
      );
      resize.panel.style.width = `${width}px`;
      const page = root.querySelector<HTMLElement>('.ThreadPage');
      if (page) page.style.paddingRight = `${width}px`;
      event.preventDefault();
    },
    listenerOptions
  );
  root.addEventListener(
    'mouseup',
    (event) => {
      if (!(event instanceof MouseEvent)) return;
      if (composerModelPointer) {
        const pointer = composerModelPointer;
        composerModelPointer = null;
        if (
          onComposerModelMenuActivation &&
          Math.abs(event.clientX - pointer.startX) <= 2 &&
          Math.abs(event.clientY - pointer.startY) <= 2
        ) {
          onComposerModelMenuActivation({
            open: true,
            ...(pointer.provider ? { provider: pointer.provider } : {}),
          });
          event.preventDefault();
          return;
        }
      }
      if (explorerCommentLinePointer) {
        const pointer = explorerCommentLinePointer;
        explorerCommentLinePointer = null;
        if (
          onExplorerCommentLine &&
          Math.abs(event.clientX - pointer.startX) <= 2 &&
          Math.abs(event.clientY - pointer.startY) <= 2
        ) {
          onExplorerCommentLine({ lineNumber: pointer.lineNumber });
          event.preventDefault();
          return;
        }
      }
      if (explorerPreviewActionPointer) {
        const pointer = explorerPreviewActionPointer;
        explorerPreviewActionPointer = null;
        if (
          onExplorerPreviewAction &&
          Math.abs(event.clientX - pointer.startX) <= 2 &&
          Math.abs(event.clientY - pointer.startY) <= 2
        ) {
          onExplorerPreviewAction({
            action: pointer.action,
            path: pointer.path,
          });
          event.preventDefault();
          return;
        }
      }
      if (fileReferencePointer) {
        const pointer = fileReferencePointer;
        fileReferencePointer = null;
        if (
          onExplorerNavigation &&
          Math.abs(event.clientX - pointer.startX) <= 2 &&
          Math.abs(event.clientY - pointer.startY) <= 2
        ) {
          onExplorerNavigation({ path: pointer.path });
          event.preventDefault();
          return;
        }
      }
      if (!resize) return;
      const width = Math.round(
        resize.panel.getBoundingClientRect().width ||
          Number.parseFloat(resize.panel.style.width) ||
          0
      );
      const panel = resize.panelName;
      resize = null;
      onRightPanelResize?.({ panel, width });
      event.preventDefault();
    },
    listenerOptions
  );
  root.addEventListener(
    'click',
    (event) => {
      const element = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(EXPLORER_TOGGLE_SELECTOR)
        );
      if (
        element &&
        element.getAttribute('aria-disabled') !== 'true' &&
        onExplorerActivation
      ) {
        onExplorerActivation({
          open: !element.classList.contains('ThreadFilesToggle--active'),
        });
        return;
      }
      const environmentToggle = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(ENVIRONMENT_TOGGLE_SELECTOR)
        );
      if (
        environmentToggle &&
        environmentToggle.getAttribute('aria-disabled') !== 'true' &&
        onEnvironmentActivation
      ) {
        onEnvironmentActivation({
          open: !environmentToggle.classList.contains(
            'EnvironmentToggle--open'
          ),
        });
        return;
      }
      const composerModelTrigger = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(COMPOSER_MODEL_TRIGGER_SELECTOR)
        );
      if (
        composerModelTrigger &&
        composerModelTrigger.getAttribute('aria-disabled') !== 'true' &&
        onComposerModelMenuActivation
      ) {
        onComposerModelMenuActivation({ open: true });
        return;
      }
      const composerProviderOption = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(COMPOSER_PROVIDER_OPTION_SELECTOR)
        );
      const composerProvider =
        composerProviderOption?.getAttribute('data-provider') ?? '';
      if (
        composerProviderOption &&
        composerProvider &&
        composerProviderOption.getAttribute('aria-disabled') !== 'true' &&
        onComposerModelMenuActivation
      ) {
        onComposerModelMenuActivation({
          open: true,
          provider: composerProvider,
        });
        return;
      }
      const entry = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(EXPLORER_ENTRY_SELECTOR)
        );
      if (
        entry &&
        entry.getAttribute('aria-disabled') !== 'true' &&
        onExplorerNavigation
      ) {
        const label = entry.getAttribute('accessibility-label') ?? '';
        if (label.startsWith('Open ') && label.length > 5) {
          onExplorerNavigation({ path: label.slice(5) });
          return;
        }
        if (label.startsWith('Expand ') && label.length > 7) {
          onExplorerNavigation({
            expandedDirectory: { open: true, path: label.slice(7) },
          });
          return;
        }
        if (label.startsWith('Collapse ') && label.length > 9) {
          onExplorerNavigation({
            expandedDirectory: { open: false, path: label.slice(9) },
          });
        }
      }
      const fileReference = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(FILE_REFERENCE_SELECTOR)
        );
      if (
        fileReference &&
        fileReference.getAttribute('aria-disabled') !== 'true' &&
        onExplorerNavigation
      ) {
        const label =
          fileReference.getAttribute('accessibility-label') ?? '';
        if (label.startsWith('Open ') && label.length > 5) {
          onExplorerNavigation({ path: label.slice(5) });
        }
      }
    },
    listenerOptions
  );
  root.addEventListener(
    'keydown',
    (event) => {
      if (
        !onExplorerActivation ||
        !(event instanceof KeyboardEvent) ||
        (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar')
      ) {
        return;
      }
      const element = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(EXPLORER_TOGGLE_SELECTOR)
        );
      if (!element || element.getAttribute('aria-disabled') === 'true') return;
      event.preventDefault();
      onExplorerActivation({
        open: !element.classList.contains('ThreadFilesToggle--active'),
      });
    },
    listenerOptions
  );
  root.addEventListener(
    'keydown',
    (event) => {
      if (
        !(event instanceof KeyboardEvent) ||
        (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar')
      ) {
        return;
      }
      const composerModelTrigger = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(COMPOSER_MODEL_TRIGGER_SELECTOR)
        );
      if (
        composerModelTrigger &&
        composerModelTrigger.getAttribute('aria-disabled') !== 'true' &&
        onComposerModelMenuActivation
      ) {
        event.preventDefault();
        onComposerModelMenuActivation({ open: true });
        return;
      }
      const composerProviderOption = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(COMPOSER_PROVIDER_OPTION_SELECTOR)
        );
      const composerProvider =
        composerProviderOption?.getAttribute('data-provider') ?? '';
      if (
        !composerProviderOption ||
        !composerProvider ||
        composerProviderOption.getAttribute('aria-disabled') === 'true' ||
        !onComposerModelMenuActivation
      ) {
        return;
      }
      event.preventDefault();
      onComposerModelMenuActivation({
        open: true,
        provider: composerProvider,
      });
    },
    listenerOptions
  );
  root.addEventListener(
    'keydown',
    (event) => {
      if (
        !onEnvironmentActivation ||
        !(event instanceof KeyboardEvent) ||
        (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar')
      ) {
        return;
      }
      const element = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(ENVIRONMENT_TOGGLE_SELECTOR)
        );
      if (!element || element.getAttribute('aria-disabled') === 'true') return;
      event.preventDefault();
      onEnvironmentActivation({
        open: !element.classList.contains('EnvironmentToggle--open'),
      });
    },
    listenerOptions
  );
  root.addEventListener(
    'keydown',
    (event) => {
      if (
        !onExplorerNavigation ||
        !(event instanceof KeyboardEvent) ||
        (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar')
      ) {
        return;
      }
      const fileReference = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(FILE_REFERENCE_SELECTOR)
        );
      if (
        !fileReference ||
        fileReference.getAttribute('aria-disabled') === 'true'
      ) {
        return;
      }
      const label =
        fileReference.getAttribute('accessibility-label') ?? '';
      if (!label.startsWith('Open ') || label.length <= 5) return;
      event.preventDefault();
      onExplorerNavigation({ path: label.slice(5) });
    },
    listenerOptions
  );
  root.addEventListener(
    'keydown',
    (event) => {
      if (
        !onExplorerNavigation ||
        !(event instanceof KeyboardEvent) ||
        event.key !== 'Enter'
      ) {
        return;
      }
      const searchOwner = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            (target.matches(EXPLORER_SEARCH_SELECTOR) ||
              Boolean(target.closest(EXPLORER_SEARCH_SELECTOR)))
        );
      const search = searchOwner?.matches(EXPLORER_SEARCH_SELECTOR)
        ? searchOwner
        : searchOwner?.closest<HTMLElement>(EXPLORER_SEARCH_SELECTOR);
      const value =
        search
          ?.querySelector('x-input')
          ?.shadowRoot?.querySelector<HTMLInputElement>('input')?.value ?? '';
      if (!search) return;
      event.preventDefault();
      onExplorerNavigation({ query: value.trim() });
    },
    listenerOptions
  );
}
