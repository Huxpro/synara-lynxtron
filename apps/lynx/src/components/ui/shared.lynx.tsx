import { cloneElement, isValidElement, type ReactElement, type ReactNode } from '@lynx-js/react';

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function renderSlot(render: ReactNode | undefined, children: ReactNode): ReactNode {
  if (isValidElement(render)) {
    return cloneElement(render as ReactElement<Record<string, unknown>>, undefined, children);
  }
  return render ?? children;
}

export function textContent(children: ReactNode, className: string): ReactNode {
  return typeof children === 'string' || typeof children === 'number' ? (
    <text accessibility-element={false} className={className}>{String(children)}</text>
  ) : (
    children
  );
}
