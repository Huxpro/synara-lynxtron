// PrimJS in Lynx SDK 4.1 predates Object.hasOwn. Effect Schema, reachable
// through the shared contracts/theme graph, uses it while constructing
// parsers on the main thread.
if (typeof Object.hasOwn !== "function") {
  Object.hasOwn = (object: object, key: PropertyKey): boolean =>
    Object.prototype.hasOwnProperty.call(object, key);
}

// PrimJS has no DOM Event classes. The shared transport state bus
// (`wsTransportEvents.ts`) publishes `CustomEvent`s through the
// `~/platform/events` port and skips publishing when the constructor is
// missing; a data-only stand-in lets the Lynx events port carry them.
const polyfillGlobal = globalThis as {
  Event?: unknown;
  CustomEvent?: unknown;
};
if (typeof polyfillGlobal.Event !== "function") {
  class LynxEvent {
    readonly type: string;
    readonly bubbles: boolean;
    readonly cancelable: boolean;
    defaultPrevented = false;
    constructor(type: string, init: { bubbles?: boolean; cancelable?: boolean } = {}) {
      this.type = type;
      this.bubbles = init.bubbles === true;
      this.cancelable = init.cancelable === true;
    }
    preventDefault(): void {
      if (this.cancelable) this.defaultPrevented = true;
    }
    stopPropagation(): void {}
    stopImmediatePropagation(): void {}
  }
  polyfillGlobal.Event = LynxEvent;
}
if (typeof polyfillGlobal.CustomEvent !== "function") {
  const BaseEvent = polyfillGlobal.Event as new (
    type: string,
    init?: { bubbles?: boolean; cancelable?: boolean },
  ) => object;
  class LynxCustomEvent<T = unknown> extends BaseEvent {
    readonly detail: T;
    constructor(type: string, init: { detail?: T; bubbles?: boolean; cancelable?: boolean } = {}) {
      super(type, init);
      this.detail = init.detail as T;
    }
  }
  polyfillGlobal.CustomEvent = LynxCustomEvent;
}
