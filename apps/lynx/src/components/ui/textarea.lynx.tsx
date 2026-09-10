import type { InputRef } from '@lynx-js/lynx-ui';
import type { ForwardedRef } from '@lynx-js/react';

import { Input, type InputProps } from './input.lynx';

export interface TextareaProps extends Omit<InputProps, 'multiline' | 'type'> {
  readonly maxLines?: number;
  readonly ref?: ForwardedRef<InputRef>;
}

export function Textarea({ maxLines = 5, ...props }: TextareaProps) {
  return <Input {...props} multiline maxLines={maxLines} />;
}
