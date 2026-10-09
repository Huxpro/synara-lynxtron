export const QUERY_CORE_SERVER_PROBE: string;
export const QUERY_CORE_MODULE_PATTERN: RegExp;
export function provideQueryCoreEnvironment(
  source: string,
  resourcePath: string,
  environmentModule: string,
): string;
