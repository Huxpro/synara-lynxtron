# Current-head Composer dynamic models light 1280

- Scope: focused OpenCode dynamic-model projection in the Composer model
  picker.
- Web and Lynx-for-Web use the same isolated server/state, light theme,
  `1280x820` viewport, and DPR 1.
- Typed RPC proof: `provider.listModels` returned seven OpenCode models from
  `opencode-cli`, all in the real `OpenCode Zen` upstream group.
- Residual fixed: the Lynx query completed on the relay but the mounted model
  control retained its static fallback. When an initial provider is present,
  the shared Landing bootstrap now prefetches that provider catalog and passes
  the result directly into Composer's first render. Failures degrade to the
  existing static catalog without blocking Landing.
- Runtime result: Web and Lynx both render Big Pickle, DeepSeek V4 Flash Free,
  Laguna S 2.1 Free, Ling-3.0-tiny Free, LongCat-2.0 Free, MiMo V2.5 Free, and
  Nemotron 3 Ultra Free.
- Both retained PNGs are exactly `1280x820`; page-error files are empty. Lynx
  relay is OPEN with zero pending requests and no transport/RPC error.
- Verification: focused landing/model/interaction contracts pass 22/22;
  Lynx-for-Web production build passes.
- Boundary: the real OpenCode catalog has one upstream group, Pi returns no
  dynamic models, and Kilo cannot start in this isolated environment. No real
  multi-group dataset exists here, so collapsible model-group visual
  re-certification remains pending rather than being manufactured with a
  fixture.
