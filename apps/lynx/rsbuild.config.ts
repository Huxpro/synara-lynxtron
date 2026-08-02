// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/// <reference path="./tsconfig.tools.json" />

import { defineConfig } from '@rsbuild/core';
import { pluginLynxtron } from '@lynx-js/lynxtron-dev-plugins/rsbuild';
const rspeedyDevServer = 'http://localhost:5971';
const buildHostInputProbe = process.env.SYNARA_HOST_INPUT_PROBE === '1';

export default defineConfig({
  server: {
    port: 8080,
    historyApiFallback: true,
    proxy: [
      {
        pathFilter: (pathname: string) =>
          pathname.endsWith('.bundle') ||
          pathname.endsWith('.map') ||
          pathname.includes('__rspeedy') ||
          pathname.includes('/static/'),
        target: rspeedyDevServer,
        pathRewrite: {
          '^/web/': '/',
        },
      },
    ],
  },
  environments: {
    desktop: {
      source: {
        entry: {
          main: './src/main/desktop/main.ts',
          preload: './src/main/desktop/preload.ts',
          hostServices: './src/main/desktop/hostServices.ts',
        },
      },
      plugins: [
        pluginLynxtron({
          args: ['--inspect=9222'],
        }),
      ],
      output: {
        target: 'node',
        distPath: {
          root: './dist/desktop',
        },
        copy: [
          { from: './package.json', to: 'package.json' },
          { from: './output/bundle/lynx/', to: '.' },
        ],
      },
      dev: {
        writeToDisk: true,
      },
    },
    web: {
      source: {
        entry: {
          ...(buildHostInputProbe
            ? {
                'host-input-probe-host':
                  './src/main/web/host-input-probe-host.ts',
              }
            : {
                'web-host': './src/main/web/web-host.ts',
                'nodejs-adapter-web': {
                  import: './src/main/web/nodejs_adapter_web.ts',
                  html: false,
                },
              }),
        },
      },
      output: {
        target: 'web',
        // Derive async chunk and asset URLs from the current script so the
        // output can be served from either / or a nested public path.
        assetPrefix: 'auto',
        filenameHash: false,
        filename: {
          html: 'index.html',
        },
        distPath: {
          root: buildHostInputProbe
            ? './dist/probes/host-input/web'
            : './dist/web',
          js: '',
          jsAsync: '',
        },
        copy: [
          {
            from: buildHostInputProbe
              ? './output/probes/host-input/web/'
              : './output/bundle/web/',
            to: '.',
          },
        ],
      },
      html: {
        template: buildHostInputProbe
          ? './src/main/web/host-input-probe.html'
          : './src/main/web/index.html',
        inject: 'body',
      },
      splitChunks: false,
    },
  },
});
