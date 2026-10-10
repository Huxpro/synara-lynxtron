// Upstream's remark plugins (`@synara-web/lib/remarkGithubAlerts`) write
// `data.hProperties`. The Web program gets that field from `mdast-util-to-hast`
// (through react-markdown); Lynx renders mdast itself and does not load it.
//
// The specifier is the installed `@types/mdast` those plugins resolve to: this
// package has no `mdast` types of its own, and an augmentation has to name the
// module by a path that resolves. A version bump shows up here as an
// unresolved import in `bun typecheck`.
import type {} from "../../../node_modules/.bun/@types+mdast@4.0.4/node_modules/@types/mdast";

declare module "../../../node_modules/.bun/@types+mdast@4.0.4/node_modules/@types/mdast" {
  interface Data {
    hProperties?: Record<string, unknown> | undefined;
  }
}
