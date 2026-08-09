import { XIcon } from '../lib/icons.lynx';
import './pull-request-detail-close-composition-elements.css';
import { useLynxInteractiveState } from './useLynxInteractiveState';

export function PullRequestDetailCloseButtonElement(props: {
  readonly accessibleLabel: string;
  readonly tooltip: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedPrDetailCloseButton',
    accessibleLabel: props.accessibleLabel,
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.accessibleLabel}
      {...interaction.eventProps}
    >
      <XIcon size={16} color="var(--muted-foreground)" />
    </view>
  );
}
