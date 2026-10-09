import assert from "node:assert/strict";
import { test } from "node:test";

import { countLynxOwnedQueries } from "./query-ownership.mjs";

const UPSTREAM = `import { gitStatusQueryOptions, serverConfigQueryOptions } from "@synara-web/lib/gitReactQuery";
import { projectReadFileQueryOptions } from "~/lib/projectReactQuery";
import { localOptions } from "./local";
`;
const count = (body) => countLynxOwnedQueries(`${UPSTREAM}${body}`);

test("upstream factories, used as is or with non-data overrides, are not Lynx queries", () => {
  assert.equal(count(`useQuery(gitStatusQueryOptions(cwd));`), 0);
  assert.equal(
    count(
      `useQuery({ ...serverConfigQueryOptions(), enabled: open, retry: false, select: pick });`,
    ),
    0,
  );
  assert.equal(
    count(`useQuery({ ...gitStatusQueryOptions(cwd), "staleTime": 5, initialData });`),
    0,
  );
  assert.equal(count(`await queryClient.fetchQuery(projectReadFileQueryOptions({ cwd }));`), 0);
  assert.equal(
    count(
      `useQueries({ queries: paths.map((path) => projectReadFileQueryOptions({ cwd, path })) });`,
    ),
    0,
  );
});

test("an inline definition counts once, wherever it is passed", () => {
  assert.equal(count(`useQuery({ queryKey: ["a"], queryFn: read });`), 1);
  assert.equal(count(`const o = queryOptions({ queryKey: ["a"], queryFn: read });`), 1);
  assert.equal(count(`queryClient.fetchQuery({ queryKey: ["a"], queryFn: read });`), 1);
  assert.equal(
    count(
      `useQueries({ queries: [{ queryKey: ["a"], queryFn: a }, { queryKey: ["b"], queryFn: b }] });`,
    ),
    2,
  );
});

test("quoted property names are definitions too", () => {
  assert.equal(count(`useQuery({ "queryKey": ["a"], "queryFn": read });`), 1);
  assert.equal(count(`useQuery({ 'queryKey': ["a"], queryFn() { return read(); } });`), 1);
});

test("a query assembled from separate pieces is counted", () => {
  // The key comes from a spread, the function is local.
  assert.equal(
    count(`const keys = { queryKey: ["a"] }; useQuery({ ...keys, queryFn: localRead });`),
    1,
  );
  // Options held in a variable cannot be vouched for.
  assert.equal(count(`const options = gitStatusQueryOptions(cwd); useQuery(options);`), 1);
  assert.equal(count(`useQuery({ ...options, enabled: true });`), 1);
  // Computed names hide what is overridden.
  assert.equal(count(`useQuery({ ...gitStatusQueryOptions(cwd), [name]: value });`), 1);
});

test("a local queryFn or queryKey over an upstream factory is a Lynx query", () => {
  assert.equal(count(`useQuery({ ...gitStatusQueryOptions(cwd), queryFn: localRead });`), 1);
  assert.equal(count(`useQuery({ ...gitStatusQueryOptions(cwd), "queryFn": localRead });`), 1);
  assert.equal(count(`useQuery({ ...gitStatusQueryOptions(cwd), queryKey: ["mine"] });`), 1);
});

test("a local factory is counted where it is defined, not again where it is used", () => {
  assert.equal(
    count(`function mine() { return queryOptions({ queryKey: ["a"], queryFn: read }); }
useQuery(mine());
useQuery({ ...mine(), enabled: true });`),
    1,
  );
  // A consumer of a factory imported from another Lynx file adds nothing here.
  assert.equal(count(`useQuery(localOptions());`), 0);
});

test("a name that only looks like an upstream factory is not trusted", () => {
  assert.equal(
    countLynxOwnedQueries(`import { gitStatusQueryOptions } from "./fake";
useQuery({ ...gitStatusQueryOptions(cwd), queryFn: localRead });`),
    1,
  );
});
