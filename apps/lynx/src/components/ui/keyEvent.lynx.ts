// One event contract for element key handlers on both hosts.
//
// A handler written `event.preventDefault(); event.stopPropagation();` is right for the
// desktop host. Lynx for Web runs handlers on a worker with a structured clone of the
// event, which carries no methods, so the same handler would throw there before it did
// its work. In that bundle the handler is given an event on which both calls are total
// (the contract `toLynxInputKeyEvent` gives Input's `onKeyDown`). They do nothing on that
// host: the default action is cancelled on the UI thread by the rules in
// src/main/web/webKeyEvents.logic.ts, and a handler that consumes a key the browser also
// acts on needs a rule there.
//
// The Native bundle compiles the flag to `"0" === "1"`, and `hostKeyHandler` returns the
// handler it was given: the same function, called with the same event, as before. The
// import below is type-only for the same reason: this file adds no module to the
// graph of the components that use it.
import type { LynxInputKeyEvent } from "./input.lynx";

// Same build-time flag as Transcript.tsx: "1" only in the Lynx-for-Web bundle.
const IS_WEB_HOST = process.env.SYNARA_LYNX_WEB_RELAY === "1";

type CallableEventMethods = Partial<Pick<LynxInputKeyEvent, "preventDefault" | "stopPropagation">>;

/** `hostKeyHandler` with the host passed in, so both branches can be tested. */
export function keyHandlerForHost<Event extends LynxInputKeyEvent>(
  handler: (event: Event) => void,
  webHost: boolean,
): (event: Event) => void {
  if (!webHost) return handler;
  return (event) => {
    const raw = event as CallableEventMethods;
    handler({
      ...event,
      preventDefault: () => raw.preventDefault?.(),
      stopPropagation: () => raw.stopPropagation?.(),
    } as Event);
  };
}

/** Wrap an element `bindkeydown`/`catchkeydown` handler that calls the event's methods. */
export function hostKeyHandler<Event extends LynxInputKeyEvent>(
  handler: (event: Event) => void,
): (event: Event) => void {
  return keyHandlerForHost(handler, IS_WEB_HOST);
}
