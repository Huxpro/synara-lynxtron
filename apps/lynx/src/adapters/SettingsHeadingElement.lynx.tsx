import type { ReactNode } from 'react';

export function SettingsHeadingElement(props: {
  readonly className: string;
  readonly children?: ReactNode;
}) {
  return (
    <text
      className={props.className}
      accessibility-element
      accessibility-heading
      accessibility-traits="header"
    >
      {props.children}
    </text>
  );
}
