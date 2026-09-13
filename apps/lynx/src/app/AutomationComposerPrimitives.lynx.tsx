import { CheckboxIndicator } from '../components/ui/checkbox.lynx';
import { Input } from '../components/ui/input.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { useTheme } from '../adapters/useTheme.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';

export function AutomationComposerNameInput(props: {
  readonly disabled: boolean;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <Input
      className="AutomationCreateName"
      nativeInput
      unstyled
      aria-label="Automation title"
      disabled={props.disabled}
      maxLength={160}
      placeholder="Automation title"
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    />
  );
}

export function AutomationComposerStopWhenInput(props: {
  readonly disabled: boolean;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <Input
      className="AutomationCreateName"
      nativeInput
      unstyled
      aria-label="Heartbeat stop condition"
      disabled={props.disabled}
      maxLength={2000}
      placeholder="PR is ready to merge"
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    />
  );
}

export function AutomationComposerToolbarIcon(props: {
  readonly className: string;
  readonly content: string;
}) {
  const { semanticIconColor } = useTheme();
  return (
    <svg
      className={props.className}
      content={colorizeLynxSvg(
        props.content,
        semanticIconColor('secondary')
      )}
      accessibility-element={false}
    />
  );
}

export function AutomationComposerWarningRow(props: {
  readonly checked?: boolean;
  readonly detail: string;
  readonly onToggle?: () => void;
  readonly title: string;
}) {
  if (!props.onToggle) {
    return (
      <view
        className="AutomationCreateWarning"
        accessibility-element={true}
        accessibility-label={`${props.title}. ${props.detail}`}
        accessibility-trait="text"
      >
        <view className="AutomationCreateWarningDot" />
        <AutomationComposerWarningCopy
          title={props.title}
          detail={props.detail}
        />
      </view>
    );
  }

  return (
    <InteractiveAutomationComposerWarningRow
      {...props}
      onToggle={props.onToggle}
    />
  );
}

function AutomationComposerWarningCopy(props: {
  readonly detail: string;
  readonly title: string;
}) {
  return (
    <view className="AutomationCreateWarningCopy">
      <text className="AutomationCreateWarningTitle">{props.title}</text>
      <text className="AutomationCreateWarningDetail">{props.detail}</text>
    </view>
  );
}

function InteractiveAutomationComposerWarningRow(props: {
  readonly checked?: boolean;
  readonly detail: string;
  readonly onToggle: () => void;
  readonly title: string;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName:
      'AutomationCreateWarning AutomationCreateWarning--interactive',
    accessibleLabel: `${props.title}. ${props.detail}`,
    accessibilityValue: props.checked ? 'Checked' : 'Unchecked',
    accessibilityTraits: 'button',
    onActivate: props.onToggle,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <CheckboxIndicator checked={props.checked} size="sm" />
      <AutomationComposerWarningCopy
        title={props.title}
        detail={props.detail}
      />
    </view>
  );
}
