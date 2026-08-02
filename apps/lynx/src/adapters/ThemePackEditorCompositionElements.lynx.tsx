import type { ReactNode } from '@lynx-js/react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '../components/ui/menu';
import { useLynxInteractiveState } from './useLynxInteractiveState';
import type {
  ChromeTheme,
  ThemeVariant,
} from '@synara-web/theme/theme.logic';
import './theme-pack-editor-composition-elements.css';

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export function ThemePackRootElement(props: {
  readonly children?: ReactNode;
}) {
  return <view className="SharedThemePackRoot">{props.children}</view>;
}

export function ThemePackHeaderElement(props: {
  readonly children?: ReactNode;
}) {
  return <view className="SharedThemePackHeader">{props.children}</view>;
}

export function ThemePackTitleElement(props: {
  readonly title: string;
  readonly children?: ReactNode;
}) {
  return (
    <view className="SharedThemePackTitleLine">
      <text className="SharedThemePackTitle">{props.title}</text>
      {props.children}
    </view>
  );
}

export function ThemePackResetActionElement(props: {
  readonly onReset: () => void;
}) {
  return (
    <Button size="sm" variant="ghost" onClick={props.onReset}>
      Reset
    </Button>
  );
}

export function ThemePackImportActionElement(props: {
  readonly variant: ThemeVariant;
  readonly onImport: (value: string) => void;
}) {
  const importClipboard = () => {
    'background only';
    void import(/* webpackMode: "eager" */ '../platform/clipboard')
      .then(({ readClipboardText }) => readClipboardText())
      .then((value) => {
        props.onImport(value);
      })
      .catch((error) => {
        console.warn(
          `[settings] ${props.variant} theme clipboard import failed`,
          String(error)
        );
      });
  };
  return (
    <Button size="sm" variant="ghost" onClick={importClipboard}>
      Import clipboard
    </Button>
  );
}

export function ThemePackCopyActionElement(props: {
  readonly variant: ThemeVariant;
  readonly shareString: string;
}) {
  const copy = () => {
    'background only';
    void import(/* webpackMode: "eager" */ '../platform/clipboard')
      .then(({ clipboard }) => clipboard.writeText(props.shareString))
      .catch((error) => {
        console.warn(
          `[settings] ${props.variant} theme copy failed`,
          String(error)
        );
      });
  };
  return (
    <Button size="sm" variant="ghost" onClick={copy}>
      Copy
    </Button>
  );
}

export function ThemePackCodeThemeControlElement(props: {
  readonly value: string;
  readonly label: string;
  readonly ariaLabel: string;
  readonly theme: ChromeTheme;
  readonly options: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly previewTheme: ChromeTheme;
  }>;
  readonly onChange: (value: string) => void;
}) {
  return (
    <Menu>
      <MenuTrigger>
        <Button variant="outline" className="SharedThemePackCodeSelect">
          {props.label}
        </Button>
      </MenuTrigger>
      <MenuPopup className="SharedThemePackCodePopup">
        <MenuRadioGroup
          value={props.value}
          onValueChange={(value) => {
            if (value !== props.value) props.onChange(value);
          }}
        >
          {props.options.map((option) => (
            <MenuRadioItem key={option.id} value={option.id}>
              {option.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}

export function ThemePackContextElement(props: {
  readonly children?: ReactNode;
}) {
  return <text className="SharedThemePackContext">{props.children}</text>;
}

export function ThemePackRowElement(props: {
  readonly label: string;
  readonly children?: ReactNode;
}) {
  return (
    <view className="SharedThemePackRow">
      <text className="SharedThemePackRowLabel">{props.label}</text>
      <view className="SharedThemePackRowControl">{props.children}</view>
    </view>
  );
}

export function ThemePackColorControlElement(props: {
  readonly color: string;
  readonly ariaLabel: string;
  readonly onChange: (next: string) => void;
  readonly onReset?: (() => void) | undefined;
}) {
  return (
    <view className="SharedThemePackColorLine">
      {props.onReset ? (
        <Button size="icon-sm" variant="ghost" onClick={props.onReset}>
          ↶
        </Button>
      ) : null}
      <view
        className="SharedThemePackSwatch"
        style={{ backgroundColor: props.color }}
      />
      <Input
        value={props.color}
        onChange={(event) => {
          const next = event.target.value.trim().toLowerCase();
          if (
            next !== props.color.toLowerCase() &&
            HEX_COLOR_RE.test(next)
          ) {
            props.onChange(next);
          }
        }}
      />
    </view>
  );
}

export function ThemePackFontControlElement(props: {
  readonly value: string;
  readonly placeholder: string;
  readonly ariaLabel: string;
  readonly mono?: boolean;
  readonly onChange: (next: string) => void;
}) {
  return (
    <Input
      value={props.value}
      placeholder={props.placeholder}
      onChange={(event) => {
        if (event.target.value !== props.value) {
          props.onChange(event.target.value);
        }
      }}
    />
  );
}

export function ThemePackBooleanControlElement(props: {
  readonly checked: boolean;
  readonly ariaLabel: string;
  readonly onChange: (checked: boolean) => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedThemePackSwitch${
      props.checked ? ' SharedThemePackSwitch--on' : ''
    }`,
    accessibleLabel: props.ariaLabel,
    accessibilityValue: props.checked ? 'On' : 'Off',
    onActivate: () => {
      'background only';
      props.onChange(!props.checked);
    },
  });
  return (
    <view
      className={interaction.className}
      aria-checked={props.checked}
      {...interaction.eventProps}
    >
      <view className="SharedThemePackSwitchThumb" />
    </view>
  );
}

export function ThemePackContrastControlElement(props: {
  readonly value: number;
  readonly ariaLabel: string;
  readonly onChange: (value: number) => void;
}) {
  return (
    <view className="SharedThemePackContrast">
      <Input
        type="number"
        value={String(props.value)}
        onChange={(event) => {
          const value = Math.max(
            0,
            Math.min(100, Math.round(Number(event.target.value)))
          );
          if (Number.isFinite(value) && value !== props.value) {
            props.onChange(value);
          }
        }}
      />
      <text className="SharedThemePackContrastSuffix">0–100</text>
    </view>
  );
}
