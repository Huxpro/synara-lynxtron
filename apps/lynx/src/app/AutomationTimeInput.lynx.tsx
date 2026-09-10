import { Button } from '../components/ui/button.lynx';
import { Menu, MenuPopup, MenuTrigger } from '../components/ui/menu.lynx';
import { TimePicker } from '../components/ui/time-picker.lynx';

export function AutomationTimeInput({
  defaultValue,
  disabled,
  onChange,
}: {
  readonly defaultValue: string;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}) {
  return <Menu>
    <MenuTrigger ariaLabel="Automation time" disabled={disabled}>
      <Button className="AutomationCreateTime" disabled={disabled} variant="outline">{defaultValue}</Button>
    </MenuTrigger>
    <MenuPopup className="AutomationTimePickerPopup" align="start">
      <TimePicker value={defaultValue} disabled={disabled} onChange={onChange} />
    </MenuPopup>
  </Menu>;
}
