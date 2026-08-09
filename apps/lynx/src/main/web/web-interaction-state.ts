const WEB_HOVER_CLASS = 'ui-hover';
const WEB_FOCUS_CLASS = 'ui-focus';
const EXPLORER_TOGGLE_SELECTOR = '.ThreadFilesToggle';
const LYNX_FOCUSABLE_SELECTOR = '[focusable="true"]';

export interface LynxWebExplorerActivation {
  readonly open: boolean;
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
  onExplorerActivation?: (activation: LynxWebExplorerActivation) => void
): void {
  const hostHoverClasses = new WeakSet<HTMLElement>();
  const hostFocusClasses = new WeakSet<HTMLElement>();
  const hostTabStops = new WeakSet<HTMLElement>();
  const listenerOptions = signal ? { signal } : undefined;
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
    'click',
    (event) => {
      if (!onExplorerActivation) return;
      const element = event
        .composedPath()
        .find(
          (target): target is HTMLElement =>
            target instanceof HTMLElement &&
            target.matches(EXPLORER_TOGGLE_SELECTOR)
        );
      if (!element || element.getAttribute('aria-disabled') === 'true') return;
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
}
