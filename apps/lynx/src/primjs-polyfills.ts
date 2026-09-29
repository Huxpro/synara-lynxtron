// PrimJS in Lynx SDK 4.1 predates Object.hasOwn. Effect Schema, reachable
// through the shared contracts/theme graph, uses it while constructing
// parsers on the main thread.
if (typeof Object.hasOwn !== "function") {
  Object.hasOwn = (object: object, key: PropertyKey): boolean =>
    Object.prototype.hasOwnProperty.call(object, key);
}
