import {
  DialogBackdrop as LynxDialogBackdrop,
  DialogContent as LynxDialogContent,
  DialogRoot,
  DialogView,
} from '@lynx-js/lynx-ui';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from '@lynx-js/react';

import { XIcon } from '../../lib/icons';
import { focusLynxElementBySelector } from './focus.lynx';
import { useLynxInteractiveState } from './interactive-state.lynx';
import { cx, renderSlot, textContent } from './shared.lynx';
import './primitives.css';

interface DialogProps {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DialogDismissContextValue {
  readonly close: () => void;
  readonly open: boolean;
  readonly show: () => void;
  readonly registerTriggerSelector: (selector: string) => () => void;
}

const DialogDismissContext = createContext<DialogDismissContextValue>({
  close: () => {},
  open: false,
  show: () => {},
  registerTriggerSelector: () => () => {},
});

let nextDialogTriggerId = 0;

export function Dialog({ open, defaultOpen, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
  const triggerSelectorRef = useRef<string | null>(null);
  const wasOpenRef = useRef(false);
  const actualOpen = open ?? uncontrolledOpen;
  const registerTriggerSelector = useCallback((selector: string) => {
    triggerSelectorRef.current = selector;
    return () => {
      if (triggerSelectorRef.current === selector) {
        triggerSelectorRef.current = null;
      }
    };
  }, []);
  const setOpen = (next: boolean) => {
    'background only';
    if (open === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  useEffect(() => {
    if (wasOpenRef.current && !actualOpen && triggerSelectorRef.current) {
      focusLynxElementBySelector(triggerSelectorRef.current);
    }
    wasOpenRef.current = actualOpen;
  }, [actualOpen]);
  return (
    <DialogDismissContext.Provider
      value={{
        open: actualOpen,
        close: () => setOpen(false),
        show: () => setOpen(true),
        registerTriggerSelector,
      }}
    >
      <DialogRoot show={actualOpen} onShowChange={setOpen}>
        {children}
      </DialogRoot>
    </DialogDismissContext.Provider>
  );
}

export function DialogTrigger(props: {
  children?: ReactNode;
  render?: ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const dialog = useContext(DialogDismissContext);
  const selectorRef = useRef<string | null>(null);
  if (selectorRef.current === null) {
    nextDialogTriggerId += 1;
    selectorRef.current = `.LxDialogTrigger--${nextDialogTriggerId}`;
  }
  useEffect(
    () => dialog.registerTriggerSelector(selectorRef.current!),
    [dialog.registerTriggerSelector]
  );
  const interaction = useLynxInteractiveState({
    baseClassName: cx(
      'LxDialogTrigger',
      selectorRef.current.slice(1),
      props.className
    ),
    accessibleLabel: props.ariaLabel,
    disabled: props.disabled,
    onActivate: dialog.show,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      {renderSlot(props.render, props.children)}
    </view>
  );
}

export function DialogClose(props: {
  children?: ReactNode;
  render?: ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const dialog = useContext(DialogDismissContext);
  const interaction = useLynxInteractiveState({
    baseClassName: props.className ?? 'LxDialogClose',
    accessibleLabel: props.ariaLabel,
    disabled: props.disabled,
    onActivate: dialog.close,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      {renderSlot(props.render, props.children)}
    </view>
  );
}

export function DialogBackdrop(props: { className?: string }) {
  const dialog = useContext(DialogDismissContext);
  return (
    <LynxDialogBackdrop
      className={cx('LxDialogBackdrop', props.className)}
      clickToClose={false}
      transition
    >
      <view
        aria-hidden="true"
        className="LxDialogBackdropTapTarget"
        catchtap={dialog.close}
      />
    </LynxDialogBackdrop>
  );
}

export function DialogViewport(props: { children?: ReactNode; className?: string }) {
  return (
    <DialogView className={cx('LxDialogViewport', props.className)} transition>
      {props.children}
    </DialogView>
  );
}

export function DialogPopup({
  className,
  children,
  showCloseButton = true,
  bottomStickOnMobile = true,
  viewportClassName,
}: {
  className?: string;
  children?: ReactNode;
  showCloseButton?: boolean;
  bottomStickOnMobile?: boolean;
  viewportClassName?: string;
}) {
  const dialog = useContext(DialogDismissContext);
  const handleKeyDown = (event: {
    readonly key: string;
    preventDefault?: () => void;
  }) => {
    'background only';
    if (event.key !== 'Escape' || !dialog.open) return;
    event.preventDefault?.();
    dialog.close();
  };
  return (
    <DialogViewport
      className={cx(
        bottomStickOnMobile && 'LxDialogViewport--bottom-stick-mobile',
        viewportClassName
      )}
    >
      <DialogBackdrop />
      <LynxDialogContent
        className={cx(
          'LxDialogPopup',
          bottomStickOnMobile && 'LxDialogPopup--bottom-stick-mobile',
          className
        )}
        dialogContentProps={{
          'aria-modal': true,
          bindkeydown: handleKeyDown,
          role: 'dialog',
        }}
        transition
      >
        {children}
        {showCloseButton && (
          <DialogClose className="LxDialogClose" ariaLabel="Close dialog">
            <XIcon className="LxDialogClose__icon" size={18} />
          </DialogClose>
        )}
      </LynxDialogContent>
    </DialogViewport>
  );
}

export function DialogHeader(props: { children?: ReactNode; className?: string }) {
  return <view className={cx('LxDialogHeader', props.className)}>{props.children}</view>;
}

export function DialogFooter(props: {
  children?: ReactNode;
  className?: string;
  variant?: 'default' | 'bare';
}) {
  return <view className={cx('LxDialogFooter', props.className)}>{props.children}</view>;
}

export function DialogTitle(props: { children?: ReactNode; className?: string }) {
  return (
    <text
      className={cx('LxDialogTitle', props.className)}
      accessibility-element
      accessibility-heading
      accessibility-trait="header"
    >
      {props.children}
    </text>
  );
}

export function DialogDescription(props: { children?: ReactNode; className?: string }) {
  return <>{textContent(props.children, cx('LxDialogDescription', props.className))}</>;
}

export function DialogPanel(props: {
  children?: ReactNode;
  className?: string;
  scrollFade?: boolean;
}) {
  return (
    <scroll-view className={cx('LxDialogPanel', props.className)} scroll-y>
      {props.children}
    </scroll-view>
  );
}

export function DialogPortal(props: { children?: ReactNode }) {
  return (
    <overlay className="LxDialogOverlay" visible>
      <view className="LxDialogOverlayContent">{props.children}</view>
    </overlay>
  );
}

export const DialogCreateHandle = undefined;
export const dialogFieldLabelClassName = 'LxDialogFieldLabel';
export const dialogFooterButtonClassName = 'LxButton--dialog-action';
