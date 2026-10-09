// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rstest/core";
import { withLynxConfig } from "@lynx-js/react/testing-library/rstest-config";

import {
  createLynxResourceReplacementPlugin,
  lynxBrowserEnvironmentRule,
  lynxQueryCoreEnvironmentRule,
  lynxWindowMemberDefines,
} from "./lynx.config";

const webSourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../web/src");

export default defineConfig({
  extends: withLynxConfig(),
  // Archived Phase 0 spikes are reference material, not part of the app suite.
  // `scripts/` tests use `node:test`; run them with `bun run test:scripts`.
  exclude: ["spikes/**", "scripts/**"],
  // Same `window.*` member replacements as the bundle, so upstream source that
  // runs verbatim on Lynx is tested as it is compiled (see lynx.config.ts).
  source: { define: { ...lynxWindowMemberDefines } },
  tools: {
    rspack: (config, { rspack }) => {
      // The bundle's module replacements, so a relative `../nativeApi` import
      // in upstream source reaches the same Lynx facade module as `~/nativeApi`.
      config.plugins ??= [];
      config.plugins.push(createLynxResourceReplacementPlugin(rspack));
      // ReactLynx's webpack plugin compiles `process.env.DEBUG` to a literal
      // (`null` when unset). `debug`'s Node build assigns to it
      // (`process.env.DEBUG = namespaces`), which then is a syntax error that
      // fails every test file whose graph reaches `debug` (micromark's
      // development build, via remark-gfm). The bundle resolves `debug` to its
      // browser build, which never assigns; use the same build under test.
      config.plugins.push(
        new rspack.NormalModuleReplacementPlugin(/^\.\/node\.js$/, (resource) => {
          if (/[\\/]debug[\\/]src$/.test(resource.context)) resource.request = "./browser.js";
        }),
      );
      // The ReactLynx testing loader parses every file as TSX (the production
      // loader passes `tsx: false` for `.ts`), so a generic arrow function in
      // an upstream `.ts` module (`<Result>(…) => …`, e.g. `appSettings.ts`)
      // is a syntax error under test only. Strip the types of upstream `.ts`
      // sources first; what the testing loader then sees is plain JavaScript.
      config.module ??= {};
      config.module.rules ??= [];
      config.module.rules.push(lynxQueryCoreEnvironmentRule);
      // Upstream Web source runs on the Lynx browser environment in the bundle;
      // bind the same globals here so it is tested as it is compiled. (The test
      // runtime has jsdom's `window`, which the bundle does not.)
      config.module.rules.push(lynxBrowserEnvironmentRule);
      config.module.rules.push({
        test: /\.ts$/,
        include: [webSourceRoot],
        enforce: "pre",
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: { syntax: "typescript", tsx: false },
            target: "es2022",
          },
        },
      });
    },
  },
});
