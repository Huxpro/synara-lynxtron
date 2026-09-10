import type { KanbanColumnKey } from '@synara-web/components/kanban/kanban.logic';

import { useTheme } from './useTheme.lynx';

function statusIconContent(input: {
  readonly column: KanbanColumnKey;
  readonly muted: string;
  readonly surface: string;
}): string {
  if (input.column === 'done') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#5e6ad2"/><path d="M4.1 7.4 6.15 9.4 9.9 4.9" fill="none" stroke="${input.surface}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  if (input.column === 'inProgress') {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="none" stroke="#f2c94c" stroke-width="1.7"/><path d="M7 3.5 A3.5 3.5 0 0 1 7 10.5 Z" fill="#f2c94c"/></svg>';
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="none" stroke="${input.muted}" stroke-width="1.7" stroke-dasharray="2 2.2"/></svg>`;
}

export function KanbanStatusIcon(props: {
  readonly column: KanbanColumnKey;
  readonly className?: string;
}) {
  const { activeTheme, svgColors } = useTheme();
  return (
    <svg
      className={`SharedKanbanColumnStatusIcon${
        props.className ? ` ${props.className}` : ''
      }`}
      content={statusIconContent({
        column: props.column,
        muted: svgColors.mutedForeground,
        surface: activeTheme.theme.surface,
      })}
    />
  );
}
