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
} from '@lynx-js/react';
import type { NodesRef } from '@lynx-js/types';

import { cx } from './shared.lynx';
import './primitives.css';

export interface LynxInputChangeEvent {
  readonly target: { readonly value: string };
  readonly currentTarget: { readonly value: string };
}

export interface LynxInputFocusEvent extends LynxInputChangeEvent {}

export interface LynxInputKeyEvent {
  readonly key: string;
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
  readonly currentTarget: {
    setAttribute(name: string, value: boolean): void;
  };
}

interface KeyboardInputProps {
  readonly className: string;
  readonly confirmType: NonNullable<LynxInputProps['confirmType']>;
  readonly defaultValue?: string;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly inputFilter?: string;
  readonly maxLength?: number;
  readonly onBlur?: LynxInputProps['onBlur'];
  readonly onConfirm?: LynxInputProps['onConfirm'];
  readonly onFocus?: LynxInputProps['onFocus'];
  readonly onInput?: LynxInputProps['onInput'];
  readonly onKeyDown: (event: LynxInputKeyEvent) => void;
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
      void setValue(props.defaultValue ?? '').catch(() => undefined);
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
    if (unlockInteraction) setNativePropsByRef(inputRef, { readonly: false });
  };
  const handleInput = (event: RawInputEvent) => {
    'main thread';
    if (controlled.current) event.currentTarget.setAttribute('readonly', true);
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

  return (
    <input
      ref={inputRef}
      id={props.id}
      readonly={props.disabled || props.readonly}
      ignore-focus={true}
      placeholder={props.placeholder}
      confirm-type={props.confirmType}
      type={props.type}
      input-filter={props.inputFilter}
      maxlength={props.maxLength ?? 140}
      show-soft-input-on-focus={props.showSoftInputOnFocus ?? true}
      main-thread:bindinput={handleInput}
      bindfocus={(event) => props.onFocus?.(event.detail.value)}
      bindblur={(event) => props.onBlur?.(event.detail.value)}
      bindconfirm={(event) => props.onConfirm?.(event.detail.value)}
      bindselection={(event) =>
        props.onSelectionChange?.(
          event.detail.selectionStart,
          event.detail.selectionEnd
        )
      }
      catchkeydown={props.onKeyDown}
      className={props.className}
      style={props.style}
    />
  );
  }
);

export const Input = forwardRef<InputRef, InputProps>(function Input(
  {
    className,
    size = 'default',
    variant = 'default',
    unstyled = false,
    nativeInput: _nativeInput,
    disabled,
    type = 'text',
    onInput,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    'aria-invalid': ariaInvalid,
    ...props
  },
  forwardedRef
) {
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
    onFocus?.(eventForValue(value));
  };
  const handleBlur: NonNullable<LynxInputProps['onBlur']> = (value) => {
    'background only';
    onBlur?.(eventForValue(value));
  };

  return (
    <view
      className={cx(
        !unstyled && 'LxInputControl',
        `LxInputControl--${typeof size === 'number' ? 'default' : size}`,
        variant === 'soft' && 'LxInputControl--soft',
        disabled && 'LxInputControl--disabled',
        ariaInvalid && 'LxInputControl--invalid',
        className
      )}
    >
      {onKeyDown ? (
        <KeyboardInput
          ref={forwardedRef}
          id={props.id}
          className="LxInput"
          readonly={props.readonly}
          disabled={disabled}
          placeholder={props.placeholder}
          type={type === 'search' ? 'text' : type}
          confirmType={type === 'search' ? 'search' : props.confirmType ?? 'send'}
          inputFilter={props.inputFilter}
          maxLength={props.maxLength}
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
          readonly={disabled || props.readonly}
          type={type === 'search' ? 'text' : type}
          confirmType={type === 'search' ? 'search' : props.confirmType}
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )}
    </view>
  );
});

export type { InputRef };
