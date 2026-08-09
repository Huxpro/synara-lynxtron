const WEB_HOVER_CLASS = 'ui-hover';
const WEB_FOCUS_CLASS = 'ui-focus';
const EXPLORER_TOGGLE_SELECTOR = '.ThreadFilesToggle';
const EXPLORER_ENTRY_SELECTOR = '.ExplorerDockEntry';
const EXPLORER_SEARCH_SELECTOR = '.ExplorerDockSearchInput';
const RIGHT_PANEL_RESIZE_SASH_SELECTOR = '.RightPanelResizeSash';
const LYNX_FOCUSABLE_SELECTOR = '[focusable="true"]';

export interface LynxWebExplorerActivation {
  readonly open: boolean;
}

export interface LynxWebExplorerNavigation {
  readonly path?: string;
  readonly query?: string;
}

export interface LynxWebRightPanelResize {
  readonly panel: string;
  readonly width: number;
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
  onExplorerNavigation?: (navigation: LynxWebExplorerNavigation) => void,
  onRightPanelResize?: (resize: LynxWebRightPanelResize) => void
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
      if (!resize || !(event instanceof MouseEvent)) return;
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
      const entry = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(EXPLORER_ENTRY_SELECTOR)
        );
      if (
        entry?.getAttribute('aria-disabled') !== 'true' &&
        onExplorerNavigation
      ) {
        const label = entry.getAttribute('accessibility-label') ?? '';
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
