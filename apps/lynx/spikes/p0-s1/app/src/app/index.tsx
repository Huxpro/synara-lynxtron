// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// BISECT: polyfill import removed (suspect: url-search-params-polyfill may
// crash PrimJS at import time)
// import 'url-search-params-polyfill';

import '@lynx-js/preact-devtools';
import { root } from '@lynx-js/react';

import { App } from './App';

root.render(<App />);

// @ts-ignore
if (import.meta.webpackHot) {
  // @ts-ignore
  import.meta.webpackHot.accept();
}
