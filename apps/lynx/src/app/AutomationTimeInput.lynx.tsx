import { Input } from '../components/ui/input.lynx';

export function AutomationTimeInput({
  defaultValue,
  disabled,
  onChange,
}: {
  readonly defaultValue: string;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}) {
  return (
    <Input
      nativeInput
      accessibleLabel="Automation time"
      className="AutomationCreateTime"
      defaultValue={defaultValue}
      disabled={disabled}
      inputFilter="[0-9:]*"
      maxLength={5}
      placeholder="09:00"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
