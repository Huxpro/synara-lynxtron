import {
  createContext,
  useContext,
  type ReactNode,
} from '@lynx-js/react';

const LynxInteractionDisabledContext = createContext(false);

export function LynxInteractionScope(props: {
  readonly children?: ReactNode;
  readonly disabled: boolean;
}) {
  const parentDisabled = useContext(LynxInteractionDisabledContext);
  return (
    <LynxInteractionDisabledContext.Provider
      value={parentDisabled || props.disabled}
    >
      {props.children}
    </LynxInteractionDisabledContext.Provider>
  );
}

export function useLynxInteractionDisabled(): boolean {
  return useContext(LynxInteractionDisabledContext);
}
