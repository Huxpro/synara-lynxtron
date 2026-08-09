import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import githubDark from 'shiki/themes/github-dark.mjs';
import githubLight from 'shiki/themes/github-light.mjs';

import {
  MAX_NATIVE_SYNTAX_HIGHLIGHT_INPUT_CHARS,
  getNativeSyntaxLanguageForPath,
  normalizeNativeSyntaxHighlightResult,
  type NativeSyntaxHighlightResult,
  type NativeSyntaxHighlightThemes,
} from './syntaxHighlightingContract.logic';

type LanguageModule = {
  readonly default: Parameters<HighlighterCore['loadLanguage']>[0];
};

const LANGUAGE_LOADERS: Readonly<
  Record<string, () => Promise<LanguageModule>>
> = {
  bash: () => import('shiki/langs/bash.mjs'),
  c: () => import('shiki/langs/c.mjs'),
  cpp: () => import('shiki/langs/cpp.mjs'),
  csharp: () => import('shiki/langs/csharp.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  diff: () => import('shiki/langs/diff.mjs'),
  dockerfile: () => import('shiki/langs/dockerfile.mjs'),
  dotenv: () => import('shiki/langs/dotenv.mjs'),
  'git-commit': () => import('shiki/langs/git-commit.mjs'),
  go: () => import('shiki/langs/go.mjs'),
  graphql: () => import('shiki/langs/graphql.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  java: () => import('shiki/langs/java.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  json5: () => import('shiki/langs/json5.mjs'),
  jsonc: () => import('shiki/langs/jsonc.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  kotlin: () => import('shiki/langs/kotlin.mjs'),
  makefile: () => import('shiki/langs/makefile.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  mdx: () => import('shiki/langs/mdx.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  ruby: () => import('shiki/langs/ruby.mjs'),
  rust: () => import('shiki/langs/rust.mjs'),
  scss: () => import('shiki/langs/scss.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  svelte: () => import('shiki/langs/svelte.mjs'),
  swift: () => import('shiki/langs/swift.mjs'),
  toml: () => import('shiki/langs/toml.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  vue: () => import('shiki/langs/vue.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
};

let highlighterPromise: Promise<HighlighterCore> | null = null;
const loadedLanguages = new Set<string>();
const loadingLanguages = new Map<string, Promise<void>>();

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [],
    themes: [githubLight, githubDark],
  });
  return highlighterPromise;
}

async function ensureLanguageLoaded(
  highlighter: HighlighterCore,
  language: string
): Promise<void> {
  if (loadedLanguages.has(language)) return;
  const existing = loadingLanguages.get(language);
  if (existing) return await existing;
  const loader = LANGUAGE_LOADERS[language];
  if (!loader) throw new Error(`Unsupported syntax language: ${language}`);
  const loading = loader()
    .then(async (module) => {
      await highlighter.loadLanguage(module.default);
      loadedLanguages.add(language);
    })
    .finally(() => {
      loadingLanguages.delete(language);
    });
  loadingLanguages.set(language, loading);
  await loading;
}

export async function highlightCodeForNativePreview(input: {
  readonly code: string;
  readonly path: string;
  readonly theme: 'dark' | 'light';
}): Promise<NativeSyntaxHighlightResult | null> {
  if (
    input.code.length === 0 ||
    input.code.length > MAX_NATIVE_SYNTAX_HIGHLIGHT_INPUT_CHARS
  ) {
    return null;
  }
  const language = getNativeSyntaxLanguageForPath(input.path);
  if (!language) return null;
  const themeName = input.theme === 'dark' ? 'github-dark' : 'github-light';
  try {
    const highlighter = await getHighlighter();
    await ensureLanguageLoaded(highlighter, language);
    const result = highlighter.codeToTokens(input.code, {
      lang: language,
      theme: themeName,
    });
    return normalizeNativeSyntaxHighlightResult({
      code: input.code,
      language,
      lines: result.tokens,
      theme: input.theme,
    });
  } catch {
    return null;
  }
}

export async function highlightCodeThemesForNativePreview(input: {
  readonly code: string;
  readonly path: string;
}): Promise<NativeSyntaxHighlightThemes | null> {
  const [light, dark] = await Promise.all([
    highlightCodeForNativePreview({ ...input, theme: 'light' }),
    highlightCodeForNativePreview({ ...input, theme: 'dark' }),
  ]);
  return light && dark ? { dark, light } : null;
}
