// Gives `@tanstack/query-core` the Lynx client environment.
//
// query-core decides `isServer = typeof window === "undefined" || …` once, at
// module load. On a server it never starts an observer's `refetchInterval` or
// stale timers, keeps unused queries forever and does not retry. The Lynx
// background thread has no `window` (the bundle wrapper injects the name with
// no value), so every react-query interval was dead there.
//
// The dependency is not edited: each query-core module that mentions `window`
// gets a module-local `window` binding from `src/platform/queryCoreEnvironment.lynx.ts`:
// the Lynx browser environment's `window` on the background thread (the same
// object upstream Web source is bound to), `undefined` on the main thread,
// which must stay timer-free. That thread rule is why this is its own rule and
// not one more include path of the browser-environment loader.
//
// The loader refuses to run on a query-core it does not recognize, so an
// upgrade that moves the probe fails the build instead of silently disabling
// the intervals again.

const WINDOW_REFERENCE = /\bwindow\b/;
export const QUERY_CORE_SERVER_PROBE = 'typeof window === "undefined"';

/** Files of `@tanstack/query-core` this rule applies to (any installed version). */
export const QUERY_CORE_MODULE_PATTERN =
  /[\\/]@tanstack[\\/]query-core[\\/]build[\\/]modern[\\/][^\\/]+\.js$/;

export function provideQueryCoreEnvironment(source, resourcePath, environmentModule) {
  const isUtils = /[\\/]utils\.js$/.test(resourcePath);
  if (isUtils && !source.includes(QUERY_CORE_SERVER_PROBE)) {
    throw new Error(
      `query-core-environment-loader: ${resourcePath} no longer contains \`${QUERY_CORE_SERVER_PROBE}\`; ` +
        "check how this @tanstack/query-core version detects a server and update the loader.",
    );
  }
  if (!WINDOW_REFERENCE.test(source)) return source;
  return `import { queryCoreWindow as window } from ${JSON.stringify(environmentModule)};\n${source}`;
}

export default function queryCoreEnvironmentLoader(source) {
  const { environmentModule } = this.getOptions();
  return provideQueryCoreEnvironment(source, this.resourcePath, environmentModule);
}
