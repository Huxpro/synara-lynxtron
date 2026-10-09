// Counts the queries Lynx owns in one source file: the "parallel data path"
// counter of the reuse audit (`useQueryCallSites`).
//
// A query is upstream's when its options provably come from an imported
// upstream factory (`@synara-web/…` or `~/…`), used as is or spread into an
// object literal that only adds non-data overrides (`enabled`, `select`,
// `staleTime`, …). Everything else is counted, conservatively:
//   - a definition: an object literal with both `queryKey` and `queryFn`
//     (plain or quoted names), wherever it is passed;
//   - a consumer (`useQuery`, `useInfiniteQuery`, each `useQueries` entry,
//     `fetchQuery` / `prefetchQuery` / `ensureQueryData`, `queryOptions`) whose
//     options override `queryFn`, spread something that is not a factory call,
//     or are not an expression this file can vouch for.
// A consumer of a local factory call is not counted again: its definition is.

import ts from "typescript";

const UPSTREAM_MODULE = /^(@synara-web\/|~\/)/;
const CONSUMER_FUNCTIONS = new Set([
  "useQuery",
  "useInfiniteQuery",
  "useSuspenseQuery",
  "queryOptions",
]);
const CONSUMER_METHODS = new Set(["fetchQuery", "prefetchQuery", "ensureQueryData"]);
/** Options that change when or how a query runs, never what it reads. */
const NON_DATA_OVERRIDES = new Set([
  "enabled",
  "select",
  "retry",
  "retryDelay",
  "staleTime",
  "gcTime",
  "placeholderData",
  "initialData",
  "initialDataUpdatedAt",
  "refetchInterval",
  "refetchIntervalInBackground",
  "refetchOnWindowFocus",
  "refetchOnReconnect",
  "refetchOnMount",
  "notifyOnChangeProps",
  "networkMode",
  "meta",
  "throwOnError",
]);

function propertyName(property) {
  if (!property.name) return null;
  if (ts.isIdentifier(property.name) || ts.isStringLiteralLike(property.name)) {
    return property.name.text;
  }
  return null; // computed: unknown
}

function unwrap(node) {
  let current = node;
  while (
    current &&
    (ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isSatisfiesExpression?.(current) ||
      ts.isNonNullExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

export function countLynxOwnedQueries(sourceText, fileName = "source.tsx") {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const upstreamNames = new Set();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
      continue;
    if (!UPSTREAM_MODULE.test(statement.moduleSpecifier.text)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) upstreamNames.add(element.name.text);
    }
  }
  const isCall = (node) => node !== undefined && ts.isCallExpression(node);
  const isUpstreamFactoryCall = (node) =>
    isCall(node) && ts.isIdentifier(node.expression) && upstreamNames.has(node.expression.text);

  const definitions = new Set();
  const isDefinition = (node) => {
    if (!ts.isObjectLiteralExpression(node)) return false;
    const names = new Set(node.properties.map(propertyName));
    return names.has("queryKey") && names.has("queryFn");
  };

  /** 1 when these options are a Lynx-owned query not already counted as a definition. */
  const classifyOptions = (raw) => {
    const node = unwrap(raw);
    if (!node) return 1;
    if (isUpstreamFactoryCall(node)) return 0;
    if (isCall(node)) return 0; // a local factory: counted where it is defined
    if (ts.isObjectLiteralExpression(node)) {
      if (isDefinition(node)) return 0; // counted as a definition
      let vouched = false;
      for (const property of node.properties) {
        if (ts.isSpreadAssignment(property)) {
          const spread = unwrap(property.expression);
          if (!isCall(spread)) return 1; // spread of unknown provenance
          vouched = true;
          continue;
        }
        const name = propertyName(property);
        if (name === null || !NON_DATA_OVERRIDES.has(name)) return 1; // queryFn, queryKey, computed…
      }
      return vouched ? 0 : 1;
    }
    return 1; // an identifier or anything else this file cannot vouch for
  };

  let consumers = 0;
  const visit = (node) => {
    if (isDefinition(node)) definitions.add(node.pos);
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (ts.isIdentifier(callee) && CONSUMER_FUNCTIONS.has(callee.text)) {
        consumers += classifyOptions(node.arguments[0]);
      } else if (ts.isPropertyAccessExpression(callee) && CONSUMER_METHODS.has(callee.name.text)) {
        consumers += classifyOptions(node.arguments[0]);
      } else if (ts.isIdentifier(callee) && callee.text === "useQueries") {
        consumers += classifyUseQueries(node.arguments[0]);
      }
    }
    ts.forEachChild(node, visit);
  };
  const classifyUseQueries = (raw) => {
    const options = unwrap(raw);
    if (!options || !ts.isObjectLiteralExpression(options)) return 1;
    const queries = options.properties.find((property) => propertyName(property) === "queries");
    const value = queries && ts.isPropertyAssignment(queries) ? unwrap(queries.initializer) : null;
    if (!value) return 1;
    if (ts.isArrayLiteralExpression(value)) {
      return value.elements.reduce((sum, element) => sum + classifyOptions(element), 0);
    }
    // `items.map((item) => factory(item))`
    if (
      ts.isCallExpression(value) &&
      ts.isPropertyAccessExpression(value.expression) &&
      value.expression.name.text === "map"
    ) {
      const mapper = unwrap(value.arguments[0]);
      if (mapper && ts.isArrowFunction(mapper) && !ts.isBlock(mapper.body)) {
        return classifyOptions(mapper.body);
      }
    }
    return 1;
  };
  visit(sourceFile);
  return definitions.size + consumers;
}
