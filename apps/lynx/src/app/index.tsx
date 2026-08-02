// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// P2-V1: TanStack Router in Lynx needs (per synara-lynx plan 04 P-06):
//   1. url-search-params-polyfill loaded FIRST (PrimJS has no URLSearchParams)
//   2. memory history (no History/Location globals)
//   3. react$ → react-compat-shim alias (see lynx.config.ts)
import 'url-search-params-polyfill';
import '../primjs-polyfills';
import '../text-encoding-polyfill';

import '@lynx-js/preact-devtools';
import { root } from '@lynx-js/react';

import { App } from './App';

root.render(<App />);

// @ts-ignore
if (import.meta.webpackHot) {
  // @ts-ignore
  import.meta.webpackHot.accept();
}
