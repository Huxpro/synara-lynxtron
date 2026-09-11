import {
  useCallback,
  createContext,
  Fragment,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from '@lynx-js/react';
import { resolveCommandNavigation } from '@synara/shared/commandNavigation';

import {
  Dialog,
  DialogPopup,
} from './dialog.lynx';
import { useLynxInteractiveState } from './interactive-state.lynx';
import { parseHostCommandKeyboardEvent } from './commandHostNavigation.logic';
import { cx, textContent } from './shared.lynx';
import './primitives.css';

type ChildrenProps = {
  children?: ReactNode;
  className?: string;
};

interface CommandKeyboardEvent {
  readonly key: string;
  readonly shiftKey?: boolean;
  readonly __synaraCommandHandled?: boolean;
  preventDefault?: () => void;
  stopPropagation?: () => void;
}

interface CommandEntry {
  readonly activate: () => void;
}

interface CommandContextValue {
  readonly highlightedValue: string | null;
  readonly handleKeyDown?: (event: CommandKeyboardEvent) => boolean;
  readonly registerItem?: (value: string, entry: CommandEntry) => () => void;
  readonly setHighlightedValue?: (value: string | null) => void;
}

const CommandContext = createContext<CommandContextValue>({
  highlightedValue: null,
});
const CommandDialogOpenContext = createContext<{
  readonly open: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}>({ open: false });

function commandItemClassName(className: string | undefined): string | undefined {
  if (!className) return className;
  return className
    .split(/\s+/)
    .filter((token) => token && token !== 'rounded-lg')
    .join(' ');
}

export function CommandDialog(props: {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <CommandDialogOpenContext.Provider
      value={{ open: props.open ?? false, onOpenChange: props.onOpenChange }}
    >
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        {props.children}
      </Dialog>
    </CommandDialogOpenContext.Provider>
  );
}

export function CommandDialogPopup(props: ChildrenProps) {
  return (
    <DialogPopup
      bottomStickOnMobile={false}
      className={cx('LxCommandDialogPopup', props.className)}
      viewportClassName="LxCommandDialogViewport"
      showCloseButton={false}
    >
      {props.children}
    </DialogPopup>
  );
}

export function Command(props: ChildrenProps & {
  autoHighlight?: boolean | 'always';
  mode?: string;
  onItemHighlighted?: (value: string | null) => void;
}) {
  const dialog = useContext(CommandDialogOpenContext);
  const entriesRef = useRef<Map<string, CommandEntry>>(new Map());
  const onItemHighlightedRef = useRef(props.onItemHighlighted);
  onItemHighlightedRef.current = props.onItemHighlighted;
  const [highlightedValue, setHighlightedValueState] = useState<string | null>(null);
  const setHighlightedValue = useCallback(
    (value: string | null) => {
      setHighlightedValueState(value);
      onItemHighlightedRef.current?.(value);
    },
    []
  );
  const registerItem = useCallback(
    (value: string, entry: CommandEntry) => {
      entriesRef.current.set(value, entry);
      setHighlightedValueState((current) => {
        if (current !== null && entriesRef.current.has(current)) return current;
        if (props.autoHighlight === false) return null;
        const next = entriesRef.current.keys().next().value ?? null;
        onItemHighlightedRef.current?.(next);
        return next;
      });
      return () => {
        entriesRef.current.delete(value);
        setHighlightedValueState((current) => {
          if (current !== value) return current;
          const next = entriesRef.current.keys().next().value ?? null;
          onItemHighlightedRef.current?.(next);
          return next;
        });
      };
    },
    [props.autoHighlight]
  );
  const handleKeyDown = useCallback(
    (event: CommandKeyboardEvent): boolean => {
      if (event.__synaraCommandHandled) return true;
      const intent = resolveCommandNavigation({
        activeValue: highlightedValue,
        enabledValues: [...entriesRef.current.keys()],
        key: event.key,
        shiftKey: event.shiftKey,
      });
      if (intent.type === 'none') return false;
      Object.assign(event, { __synaraCommandHandled: true });
      event.preventDefault?.();
      event.stopPropagation?.();
      // A command palette keeps keyboard focus in its search input. Moving
      // native focus into result rows breaks continued typing and triggers a
      // second host Tab traversal on Lynxtron PC.
      if (intent.type === 'move') setHighlightedValue(intent.value);
      if (intent.type === 'activate') entriesRef.current.get(intent.value)?.activate();
      if (intent.type === 'dismiss') dialog.onOpenChange?.(false);
      return true;
    },
    [dialog.onOpenChange, highlightedValue, setHighlightedValue]
  );
  const handleKeyDownRef = useRef(handleKeyDown);
  handleKeyDownRef.current = handleKeyDown;
  useEffect(() => {
    'background only';
    if (!dialog.open) return;
    let active = true;
    let dispose: (() => void) | null = null;
    void import(/* webpackMode: "eager" */ '../../platform/bridge')
      .then(({ bridgeCall, onGlobalEvent }) => {
        if (!active) return;
        dispose = onGlobalEvent('shell:search-key', (payload: unknown) => {
          const event = parseHostCommandKeyboardEvent(payload);
          if (!event) return;
          const handled = handleKeyDownRef.current(event);
          void bridgeCall('shellSearchNavigationHandled', {
            handled,
            key: event.key,
            shiftKey: event.shiftKey === true,
          }).catch(() => {
            // Runtime acknowledgement is diagnostic only; navigation already ran.
          });
        });
      })
      .catch(() => {
        // The Web host and test renderer do not expose desktop global events.
      });
    return () => {
      active = false;
      dispose?.();
    };
  }, [dialog.open]);
  return (
    <CommandContext.Provider
      value={{
        handleKeyDown,
        highlightedValue,
        registerItem,
        setHighlightedValue,
      }}
    >
      <view
        className={cx('LxCommand', props.className)}
        global-bindkeydown={handleKeyDown}
      >
        {props.children}
      </view>
    </CommandContext.Provider>
  );
}

export function CommandPanel(props: ChildrenProps) {
  return <view className={cx('LxCommandPanel', props.className)}>{props.children}</view>;
}

export function CommandInput(props: {
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (event: { currentTarget: { value: string } }) => void;
  onKeyDown?: (event: unknown) => void;
  startAddon?: ReactNode;
}) {
  const dialog = useContext(CommandDialogOpenContext);
  const command = useContext(CommandContext);
  const inputRef = useRef<React.ElementRef<'textarea'>>(null);
  const nativeValueRef = useRef(props.value ?? '');
  useEffect(() => {
    if (!dialog.open) return;
    try {
      inputRef.current?.invoke({ method: 'focus' }).exec();
    } catch {
      // The test renderer and a closing dialog can invalidate the element
      // between commit and the imperative focus request.
    }
  }, [dialog.open]);
  useEffect(() => {
    if (props.value === undefined || props.value === nativeValueRef.current) return;
    nativeValueRef.current = props.value;
    try {
      inputRef.current
        ?.invoke({ method: 'setValue', params: { value: props.value } })
        .exec();
    } catch {
      // A closed dialog will remount with the current default value.
    }
  }, [props.value]);
  const handleKeyDown = (event: CommandKeyboardEvent) => {
    'background only';
    props.onKeyDown?.(event);
    command.handleKeyDown?.(event);
  };

  return (
    <view className="LxCommandInput" catchkeydown={handleKeyDown}>
      {props.startAddon}
      <textarea
        ref={inputRef}
        className={cx('LxCommandTextarea', props.className)}
        aria-label={props.placeholder ?? 'Command search'}
        accessibility-element={true}
        accessibility-label={props.placeholder ?? 'Command search'}
        focusable={true}
        default-value={props.value ?? ''}
        placeholder={props.placeholder}
        maxlength={140}
        maxlines={1}
        confirm-type="search"
        show-soft-input-on-focus={true}
        bindkeydown={handleKeyDown}
        bindinput={(event) => {
          'background only';
          nativeValueRef.current = event.detail.value;
          props.onChange?.({ currentTarget: { value: event.detail.value } });
        }}
        bindconfirm={() => {
          'background only';
          command.handleKeyDown?.({ key: 'Enter' });
        }}
      />
    </view>
  );
}

export function CommandList(props: ChildrenProps) {
  return (
    <scroll-view
      className={cx('LxCommandList', props.className)}
      scroll-orientation="vertical"
    >
      {props.children}
    </scroll-view>
  );
}

export function CommandEmpty(props: ChildrenProps) {
  return <view className={cx('LxCommandEmpty', props.className)}>{props.children}</view>;
}

export function CommandGroup(props: ChildrenProps) {
  return <view className={cx('LxCommandGroup', props.className)}>{props.children}</view>;
}

export function CommandGroupLabel(props: ChildrenProps) {
  return (
    <view className={cx('LxCommandGroupLabel', props.className)}>
      {textContent(props.children, 'LxCommandGroupLabel__text')}
    </view>
  );
}

export function CommandItem(props: ChildrenProps & {
  value?: string;
  disabled?: boolean;
  'aria-label'?: string;
  onClick?: (event: {
    defaultPrevented: boolean;
    preventDefault(): void;
    stopPropagation(): void;
  }) => void;
  onMouseDown?: (event: { preventDefault(): void }) => void;
}) {
  const command = useContext(CommandContext);
  const activateRef = useRef<() => void>(() => {});
  const onActivate = () => {
    'background only';
    let defaultPrevented = false;
    props.onClick?.({
      get defaultPrevented() {
        return defaultPrevented;
      },
      preventDefault() {
        defaultPrevented = true;
      },
      stopPropagation() {},
    });
  };
  activateRef.current = onActivate;
  const activatable = Boolean(props.onClick);
  useEffect(() => {
    if (props.disabled || !props.value || !activatable) return;
    return command.registerItem?.(props.value, {
      activate: () => activateRef.current(),
    });
  }, [activatable, command.registerItem, props.disabled, props.value]);
  const interaction = useLynxInteractiveState({
    baseClassName: cx(
      'LxCommandItem',
      commandItemClassName(props.className),
      command.highlightedValue === props.value && 'LxCommandItem--highlighted',
      props.disabled && 'LxCommandItem--disabled'
    ),
    disabled: props.disabled,
    onActivate: props.onClick ? onActivate : undefined,
  });
  const onMouseEnter = () => {
    'background only';
    interaction.eventProps.bindmouseenter?.();
    command.setHighlightedValue?.(props.value ?? null);
  };
  const onFocus = () => {
    'background only';
    interaction.eventProps.bindfocus?.();
    command.setHighlightedValue?.(props.value ?? null);
  };
  const onMouseDown = () => {
    'background only';
    interaction.eventProps.bindmousedown?.();
    props.onMouseDown?.({
      // Background-thread Lynx events do not expose the mutable DOM event
      // object. Preserve the shared call-site contract without inventing a
      // native default action.
      preventDefault() {},
    });
  };
  return (
    <view
      className={interaction.className}
      style={{ borderRadius: '10px' }}
      {...interaction.eventProps}
      aria-label={props['aria-label']}
      aria-selected={command.highlightedValue === props.value}
      bindmouseenter={props.disabled ? undefined : onMouseEnter}
      bindfocus={props.disabled ? undefined : onFocus}
      bindmousedown={props.disabled ? undefined : onMouseDown}
      catchkeydown={
        props.disabled
          ? undefined
          : (event: CommandKeyboardEvent) => {
              'background only';
              if (!command.handleKeyDown?.(event)) {
                interaction.eventProps.bindkeydown?.(event);
              }
            }
      }
    >
      {props.children}
    </view>
  );
}

export function CommandSeparator(props: ChildrenProps) {
  return <view className={cx('LxCommandSeparator', props.className)} />;
}

export function CommandFooter(props: ChildrenProps) {
  return <view className={cx('LxCommandFooter', props.className)}>{props.children}</view>;
}

export function CommandShortcut(props: ChildrenProps) {
  return <view className={cx('LxCommandShortcut', props.className)}>{props.children}</view>;
}

export function CommandCollection(props: ChildrenProps) {
  return <Fragment>{props.children}</Fragment>;
}

export function CommandDialogTrigger(props: ChildrenProps) {
  return <Fragment>{props.children}</Fragment>;
}

export const CommandCreateHandle = undefined;
