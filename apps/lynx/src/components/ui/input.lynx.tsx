import {
  Input as LynxInput,
  InvokeRejectError,
  setNativePropsByRef,
  type InputProps as LynxInputProps,
  type InputRef,
} from '@lynx-js/lynx-ui';
import {
  forwardRef,
  runOnBackground,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from '@lynx-js/react';
import type { NodesRef } from '@lynx-js/types';

import { useLynxInteractionDisabled } from './interaction-scope.lynx';
import { cx } from './shared.lynx';
import './primitives.css';

export interface LynxInputChangeEvent {
  readonly target: { readonly value: string };
  readonly currentTarget: { readonly value: string };
}

export interface LynxInputFocusEvent extends LynxInputChangeEvent {}

export interface LynxInputKeyEvent {
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly key: string;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
  preventDefault?: () => void;
  stopPropagation?: () => void;
}

export interface InputProps
  extends Omit<
    LynxInputProps,
    'className' | 'onInput' | 'onFocus' | 'onBlur' | 'readonly' | 'type'
  > {
  ref?: React.ForwardedRef<InputRef>;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | number;
  variant?: 'default' | 'soft';
  unstyled?: boolean;
  nativeInput?: boolean;
  multiline?: boolean;
  maxLines?: number;
  disabled?: boolean;
  type?: LynxInputProps['type'] | 'search';
  onInput?: LynxInputProps['onInput'];
  onChange?: (event: LynxInputChangeEvent) => void;
  onFocus?: (event: LynxInputFocusEvent) => void;
  onBlur?: (event: LynxInputFocusEvent) => void;
  onKeyDown?: (event: LynxInputKeyEvent) => void;
  'aria-invalid'?: boolean;
}

interface RawInputEvent {
  readonly detail: {
    readonly isComposing: boolean;
    readonly selectionEnd: number;
    readonly selectionStart: number;
    readonly value: string;
  };
  readonly currentTarget?: {
    setAttribute(name: string, value: boolean): void;
  };
}

interface KeyboardInputProps {
  readonly accessibleLabel?: string;
  readonly ariaInvalid?: boolean;
  readonly className: string;
  readonly confirmType: NonNullable<LynxInputProps['confirmType']>;
  readonly defaultValue?: string;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly inputFilter?: string;
  readonly maxLength?: number;
  readonly maxLines?: number;
  readonly onBlur?: LynxInputProps['onBlur'];
  readonly onConfirm?: LynxInputProps['onConfirm'];
  readonly onFocus?: LynxInputProps['onFocus'];
  readonly onInput?: LynxInputProps['onInput'];
  readonly onKeyDown?: (event: LynxInputKeyEvent) => void;
  readonly onSelectionChange?: LynxInputProps['onSelectionChange'];
  readonly placeholder?: string;
  readonly readonly?: boolean;
  readonly showSoftInputOnFocus?: boolean;
  readonly style?: LynxInputProps['style'];
  readonly type: NonNullable<LynxInputProps['type']>;
  readonly value?: string;
}

const KeyboardInput = forwardRef<InputRef, KeyboardInputProps>(
  function KeyboardInput(props, forwardedRef) {
  const controlled = useRef(props.value !== undefined);
  const inputRef = useRef<NodesRef>(null);

  const invoke = (
    method: 'blur' | 'focus' | 'getValue' | 'setSelectionRange' | 'setValue',
    params?: Record<string, unknown>
  ): Promise<unknown> =>
    new Promise((resolve, reject) => {
      try {
        inputRef.current
          ?.invoke({
            method,
            params,
            success: resolve,
            fail: (result: { code: number; data: string }) => {
              reject(new InvokeRejectError(result.code, result.data));
            },
          } as never)
          .exec();
      } catch (error) {
        reject(error);
      }
    });

  const setValue = (value: string): Promise<void> =>
    invoke('setValue', { value }).then(() => undefined);
  const focus = (): Promise<void> => invoke('focus').then(() => undefined);
  const blur = (): Promise<void> => invoke('blur').then(() => undefined);
  const getValue = () =>
    invoke('getValue') as Promise<{
      value: string;
      selectionStart: number;
      selectionEnd: number;
    }>;
  const setSelectionRange = (
    selectionStart: number,
    selectionEnd: number
  ): Promise<void> =>
    invoke('setSelectionRange', { selectionStart, selectionEnd }).then(
      () => undefined
    );

  useEffect(() => {
    void setValue(props.value ?? '').catch(() => undefined);
  }, [props.value]);
  useEffect(() => {
    if (!controlled.current) {
      const timer = setTimeout(() => {
        void setValue(props.defaultValue ?? '').catch(() => undefined);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const sendInputEvent = (
    value: string,
    selectionStart: number,
    selectionEnd: number,
    isComposing: boolean,
    unlockInteraction: boolean
  ) => {
    props.onInput?.(value, selectionStart, selectionEnd, isComposing);
    if (unlockInteraction) {
      try {
        setNativePropsByRef(inputRef, { readonly: false });
      } catch {
        // Older/test hosts may not expose native prop mutation. The controlled
        // value update remains authoritative and the next mount resets readonly.
      }
    }
  };
  const handleInput = (event: RawInputEvent) => {
    'main thread';
    if (controlled.current) event.currentTarget?.setAttribute('readonly', true);
    runOnBackground(sendInputEvent)(
      event.detail.value,
      event.detail.selectionStart,
      event.detail.selectionEnd,
      event.detail.isComposing,
      controlled.current
    );
  };

  useImperativeHandle(
    forwardedRef,
    () => ({ blur, focus, getValue, setSelectionRange, setValue }),
    [blur, focus, getValue, setSelectionRange, setValue]
  );

  const sharedProps = {
    ref: inputRef,
    id: props.id,
    'aria-label': props.accessibleLabel,
    'aria-invalid': props.ariaInvalid,
    'aria-disabled': props.disabled || undefined,
    'accessibility-element': props.accessibleLabel ? true : undefined,
    'accessibility-label': props.accessibleLabel,
    'accessibility-state': props.disabled ? { disabled: true } : undefined,
    readonly: props.disabled || props.readonly,
    disabled: props.disabled,
    focusable: !props.disabled,
    'ignore-focus': true,
    'default-value': props.defaultValue,
    value: props.value ?? props.defaultValue,
    placeholder: props.placeholder,
    'confirm-type': props.confirmType,
    'input-filter': props.inputFilter ?? (props.type === 'number' ? '[0-9.]*' : undefined),
    maxlength: props.maxLength ?? 140,
    'show-soft-input-on-focus': props.showSoftInputOnFocus ?? true,
    'main-thread:bindinput': props.disabled ? undefined : handleInput,
    bindfocus: props.disabled
      ? undefined
      : (event: { detail: { value: string } }) => props.onFocus?.(event.detail.value),
    bindblur: props.disabled
      ? undefined
      : (event: { detail: { value: string } }) => props.onBlur?.(event.detail.value),
    bindconfirm: props.disabled
      ? undefined
      : (event: { detail: { value: string } }) => props.onConfirm?.(event.detail.value),
    bindselection: (event: {
      detail: { selectionStart: number; selectionEnd: number };
    }) =>
      props.onSelectionChange?.(
        event.detail.selectionStart,
        event.detail.selectionEnd
      ),
    catchkeydown: props.disabled ? undefined : props.onKeyDown,
    className: props.className,
    style: props.style,
  } as const;

  // Lynxtron 0.0.21 still aborts when ordinary text reaches a focused single-line
  // <input>. A one-line textarea retains real Native editing, IME, selection,
  // filtering, and confirmation behavior without that host text-model crash.
  return <textarea {...sharedProps} maxlines={props.maxLines ?? 1} />;
  }
);

export const Input = forwardRef<InputRef, InputProps>(function Input(
  {
    className,
    size = 'default',
    variant = 'default',
    unstyled = false,
    nativeInput = false,
    multiline = false,
    maxLines,
    disabled,
    type = 'text',
    onInput,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    'aria-invalid': ariaInvalid,
    'aria-label': ariaLabel,
    'accessibility-label': accessibilityLabel,
    ...props
  },
  forwardedRef
) {
  const scopeDisabled = useLynxInteractionDisabled();
  const resolvedDisabled = scopeDisabled || Boolean(disabled);
  const [focused, setFocused] = useState(false);
  const eventForValue = (value: string): LynxInputFocusEvent => ({
    target: { value },
    currentTarget: { value },
  });
  const handleInput: NonNullable<LynxInputProps['onInput']> = (
    value,
    selectionStart,
    selectionEnd,
    isComposing
  ) => {
    'background only';
    onInput?.(value, selectionStart, selectionEnd, isComposing);
    onChange?.({
      target: { value },
      currentTarget: { value },
    });
  };
  const handleFocus: NonNullable<LynxInputProps['onFocus']> = (value) => {
    'background only';
    setFocused(true);
    onFocus?.(eventForValue(value));
  };
  const handleBlur: NonNullable<LynxInputProps['onBlur']> = (value) => {
    'background only';
    setFocused(false);
    onBlur?.(eventForValue(value));
  };

  return (
    <view
      className={cx(
        !unstyled && 'LxInputControl',
        `LxInputControl--${typeof size === 'number' ? 'default' : size}`,
        multiline && 'LxInputControl--multiline',
        variant === 'soft' && 'LxInputControl--soft',
        resolvedDisabled && 'LxInputControl--disabled',
        ariaInvalid && 'LxInputControl--invalid',
        focused && 'ui-focus',
        className
      )}
    >
      {nativeInput || onKeyDown ? (
        <KeyboardInput
          ref={forwardedRef}
          accessibleLabel={accessibilityLabel ?? ariaLabel}
          ariaInvalid={ariaInvalid}
          id={props.id}
          className="LxInput"
          readonly={props.readonly}
          disabled={resolvedDisabled}
          placeholder={props.placeholder}
          type={type === 'search' ? 'text' : type}
          confirmType={type === 'search' ? 'search' : props.confirmType ?? 'send'}
          inputFilter={props.inputFilter}
          maxLength={props.maxLength}
          maxLines={multiline ? (maxLines ?? 5) : 1}
          defaultValue={props.defaultValue}
          value={props.value}
          showSoftInputOnFocus={props.showSoftInputOnFocus}
          onInput={handleInput}
          onFocus={(value) => handleFocus(value)}
          onBlur={(value) => handleBlur(value)}
          onConfirm={props.onConfirm}
          onSelectionChange={props.onSelectionChange}
          onKeyDown={onKeyDown}
          style={props.style}
        />
      ) : (
        <LynxInput
          {...props}
          ref={forwardedRef}
          className="LxInput"
          readonly={resolvedDisabled || props.readonly}
          disabled={resolvedDisabled}
          focusable={!resolvedDisabled}
          aria-invalid={ariaInvalid}
          type={type === 'search' ? 'text' : type}
          confirmType={type === 'search' ? 'search' : props.confirmType}
          onInput={resolvedDisabled ? undefined : handleInput}
          onFocus={resolvedDisabled ? undefined : handleFocus}
          onBlur={resolvedDisabled ? undefined : handleBlur}
          onConfirm={resolvedDisabled ? undefined : props.onConfirm}
        />
      )}
    </view>
  );
});

export type { InputRef };
