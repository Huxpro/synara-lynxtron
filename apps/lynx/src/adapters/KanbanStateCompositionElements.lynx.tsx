import { resolveSystemStateSemantics } from '@synara-web/components/systemStateSemantics';

import { Button } from '../components/ui/button';
import { useLynxSystemStateAnnouncement } from '../platform/system-state-announcement.lynx';
import './kanban-state-composition-elements.css';

export type KanbanStateElementVariant = 'page' | 'inline';

export function KanbanStateElement(props: {
  readonly announcement: string;
  readonly description: string | null;
  readonly intent: 'status' | 'alert' | 'empty';
  readonly title: string;
  readonly variant: KanbanStateElementVariant;
  readonly retryLabel: string;
  readonly retryDisabled?: boolean;
  readonly onRetry?: () => void;
}) {
  const semantics = resolveSystemStateSemantics(props.intent);
  useLynxSystemStateAnnouncement({
    intent: props.intent,
    announcement: props.announcement,
  });
  return (
    <view
      className={`SharedKanbanState SharedKanbanState--${props.variant}`}
    >
      <view
        className="SharedKanbanStateCopy"
        accessibility-element={semantics.announce}
        accessibility-label={props.announcement}
        accessibility-trait={props.intent === 'status' ? 'updating' : 'text'}
      >
        <text
          className="SharedKanbanStateTitle"
          accessibility-element={false}
        >
          {props.title}
        </text>
        {props.description ? (
          <text
            className="SharedKanbanStateDescription"
            accessibility-element={false}
          >
            {props.description}
          </text>
        ) : null}
      </view>
      {props.onRetry ? (
        <Button
          size="sm"
          variant="outline"
          disabled={props.retryDisabled}
          aria-label={props.retryLabel}
          onClick={props.onRetry}
        >
          {props.retryLabel}
        </Button>
      ) : null}
    </view>
  );
}
