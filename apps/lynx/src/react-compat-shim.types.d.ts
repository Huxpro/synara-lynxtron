// `react` type-checks against @types/react 18 here, while upstream state-layer
// source is written against React 19.2. Declares the one newer export the Lynx
// program reaches; the runtime implementation is in `react-compat-shim.ts`.
import "react";

declare module "react" {
  export function useEffectEvent<Args extends unknown[], Result>(
    callback: (...args: Args) => Result,
  ): (...args: Args) => Result;
}
