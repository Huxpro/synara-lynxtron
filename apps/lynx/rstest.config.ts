// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rstest/core";
import { withLynxConfig } from "@lynx-js/react/testing-library/rstest-config";

import { lynxBrowserEnvironmentRule, lynxWindowMemberDefines } from "./lynx.config";

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
    rspack: (config) => {
      // The ReactLynx testing loader parses every file as TSX (the production
      // loader passes `tsx: false` for `.ts`), so a generic arrow function in
      // an upstream `.ts` module (`<Result>(…) => …`, e.g. `appSettings.ts`)
      // is a syntax error under test only. Strip the types of upstream `.ts`
      // sources first; what the testing loader then sees is plain JavaScript.
      config.module ??= {};
      config.module.rules ??= [];
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
